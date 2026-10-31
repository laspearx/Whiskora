// whiskora-staging only (refuses other URLs; ~/.whiskora/staging_db_url). Dry runs the vaccine reminder Edge Function
// handler (supabase/functions/send-push-notifications/handler.ts) against synthetic staging data. Nothing leaves this
// machine: pushes go to a local HTTPS mock push service on 127.0.0.1 (real web-push encryption + VAPID signing).
//
// Part A — logic: the handler's database calls run as SQL on staging with `set local role service_role` (the role
//   the Edge Function uses), through a small adapter that mirrors the supabase-js calls the handler makes.
// Part B — real PostgREST: the same handler with a real supabase-js client signed in as QA owner (RLS limits it to
//   its own rows); proves the batched queries are accepted (old embed → PGRST200) and that a real error → 500.
//
// usage: NODE_PATH=<dir with pg, web-push> STAGING_ANON_KEY=<staging publishable key> SUPABASE_JS=<path to supabase-js>
//        node supabase/tests/vaccine_reminder_staging.mts [cleanup]
// Prints PASS/FAIL with statuses and counts only. Synthetic rows: pets 900021–900025, vaccines 9900021–9900030,
// orphan pet id 900029 (never created), push subscriptions on QA users 01 / 05 pointing at 127.0.0.1.
import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import https from "node:https";
import crypto from "node:crypto";
import { handleRequest, type Deps } from "../functions/send-push-notifications/handler.ts";
import { bangkokDate, makeSender } from "../functions/send-push-notifications/reminders.ts";

const require = createRequire(import.meta.url);
const { Client, types } = require("pg");
const webpush = require("web-push");
types.setTypeParser(1082, (v: string) => v);          // date → 'YYYY-MM-DD' like PostgREST
types.setTypeParser(1184, (v: string) => v);          // timestamptz → string
types.setTypeParser(20, (v: string) => Number(v));    // bigint → number like PostgREST JSON

const url = fs.readFileSync(os.homedir() + "/.whiskora/staging_db_url", "utf8").trim();
if (!url.includes("wpxcukrwmegwzfccbbga")) { console.error("refusing: not staging"); process.exit(2); }
const SB = "https://wpxcukrwmegwzfccbbga.supabase.co";

const U = { owner: "a0000000-0000-4000-8000-000000000001", buyer: "a0000000-0000-4000-8000-000000000005", stranger: "a0000000-0000-4000-8000-000000000006" };
const PET = { a1: 900021, a2: 900022, b: 900023, c: 900024, noOwner: 900025, orphan: 900029 };
const SECRET = "test-cron-secret-" + crypto.randomBytes(8).toString("hex");   // local only, never deployed
const vapid = webpush.generateVAPIDKeys();                                      // throwaway pair for this run

let pass = 0, fail = 0;
const ok = (n: string, c: boolean, i: unknown = {}) => { c ? pass++ : fail++; console.log(`${c ? "PASS" : "FAIL"} ${n} :: ${JSON.stringify(i)}`); };
const conn = async () => { const c = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } }); await c.connect(); return c; };

// ---------- adapter: the supabase-js calls handler.ts makes → SQL as service_role ----------
type Res = { data: any; error: { code?: string; message?: string } | null; count?: number | null };
// inject["<table>:<op>"]: true → a plain error; {code, message} → that error object; "throw" → from() throws
type Inject = Record<string, true | "throw" | { code?: unknown; message?: string; details?: string }>;
function pgDb(client: any, inject: Inject = {}) {
  return { from: (table: string) => {
    const t = inject[`throw:${table}`];
    if (t) throw Object.assign(new Error(String((t as any).message ?? "thrown")), { name: (t as any).name ?? "Error" });
    return new Q(client, table, inject);
  } } as unknown as Deps["db"];
}
class Q {
  c: any; t: string; inject: Inject; op = "select"; cols = "*"; ret = ""; where: string[] = []; params: unknown[] = [];
  orderBy = ""; off = 0; lim = 0; rows: any[] = []; conflict = ""; ignore = false; set: Record<string, unknown> = {};
  constructor(c: any, t: string, inject: Inject) { this.c = c; this.t = t; this.inject = inject; }
  p(v: unknown) { this.params.push(v); return "$" + this.params.length; }
  select(cols: string) { if (this.op === "select") this.cols = cols; else this.ret = cols; return this; }
  gte(col: string, v: unknown) { this.where.push(`${col} >= ${this.p(v)}`); return this; }
  lt(col: string, v: unknown) { this.where.push(`${col} < ${this.p(v)}`); return this; }
  eq(col: string, v: unknown) { this.where.push(`${col} = ${this.p(v)}`); return this; }
  in(col: string, vs: unknown[]) { this.where.push(`${col}::text = any(${this.p(vs.map(String))}::text[])`); return this; }
  order(col: string) { this.orderBy = col; return this; }
  range(a: number, b: number) { this.off = a; this.lim = b - a + 1; return this; }
  upsert(rows: any[], o: { onConflict: string; ignoreDuplicates: boolean }) { this.op = "upsert"; this.rows = rows; this.conflict = o.onConflict; this.ignore = o.ignoreDuplicates; return this; }
  update(set: Record<string, unknown>) { this.op = "update"; this.set = set; return this; }
  delete(_o?: { count?: string }) { this.op = "delete"; return this; }   // count → rowCount, like supabase-js count: "exact"
  then(res: (r: Res) => unknown, rej: (e: unknown) => unknown) { return this.exec().then(res, rej); }
  async exec(): Promise<Res> {
    if (this.op === "upsert" && !this.ignore) throw new Error("adapter supports upsert with ignoreDuplicates only");
    const inj = this.inject[`${this.t}:${this.op}`];
    if (inj) return { data: null, error: inj === true ? { code: "XX000", message: `injected failure ${this.t}:${this.op}` } : inj as any };
    const w = this.where.length ? " where " + this.where.join(" and ") : "";
    let sql: string;
    if (this.op === "select") sql = `select ${this.cols} from public.${this.t}${w}${this.orderBy ? ` order by ${this.orderBy}` : ""}${this.lim ? ` limit ${this.lim} offset ${this.off}` : ""}`;
    else if (this.op === "upsert") {
      const cols = Object.keys(this.rows[0]);
      sql = `insert into public.${this.t} (${cols}) select ${cols} from json_populate_recordset(null::public.${this.t}, ${this.p(JSON.stringify(this.rows))}::json)
             on conflict (${this.conflict}) do nothing returning ${this.ret || "*"}`;   // = ignoreDuplicates (the only mode used)
    } else if (this.op === "update") sql = `update public.${this.t} set ${Object.entries(this.set).map(([k, v]) => `${k} = ${this.p(v)}`)}${w}`;
    else sql = `delete from public.${this.t}${w}`;
    try {
      await this.c.query("begin"); await this.c.query("set local role service_role");
      const r = await this.c.query(sql, this.params); await this.c.query("commit");
      return { data: r.rows, error: null, count: r.rowCount };
    } catch (e: any) { await this.c.query("rollback").catch(() => {}); return { data: null, error: { code: e.code, message: e.message } }; }
  }
}

// ---------- local mock push service (HTTPS on 127.0.0.1, self-signed cert made for this run) ----------
const tlsDir = fs.mkdtempSync(path.join(os.tmpdir(), "vr-mock-"));
execFileSync("openssl", ["req", "-x509", "-newkey", "ec", "-pkeyopt", "ec_paramgen_curve:prime256v1", "-nodes", "-keyout", `${tlsDir}/k.pem`,
  "-out", `${tlsDir}/c.pem`, "-days", "1", "-subj", "/CN=127.0.0.1", "-addext", "subjectAltName=IP:127.0.0.1"], { stdio: "ignore" });
const mode: Record<string, string> = {}, hits: Record<string, number> = {}, bad: string[] = [];
const hanging: any[] = [];
const server = https.createServer({ key: fs.readFileSync(`${tlsDir}/k.pem`), cert: fs.readFileSync(`${tlsDir}/c.pem`) }, (req, res) => {
  const tag = (req.url ?? "").split("/")[2] ?? "?";
  hits[tag] = (hits[tag] ?? 0) + 1;
  if (req.headers["content-encoding"] !== "aes128gcm" || !String(req.headers.authorization ?? "").startsWith("vapid t=")) bad.push(tag);
  const m = mode[tag] ?? "ok";
  req.resume();
  req.on("end", () => {      // the whole message has arrived before we answer (or don't)
    if (m === "hang") { hanging.push(res); return; }
    if (m === "drop") { req.socket.destroy(); return; }   // received, then the connection is cut before any answer
    res.statusCode = { ok: 201, fail500: 500, fail429: 429, fail400: 400, gone410: 410, nf404: 404 }[m] ?? 500; res.end();
  });
});
await new Promise<void>((r) => server.listen(0, "127.0.0.1", () => r()));
const PORT = (server.address() as any).port;
// trust the throwaway cert only for this loopback mock (the deployed function uses web-push defaults)
const loopbackAgent = new https.Agent({ ca: fs.readFileSync(`${tlsDir}/c.pem`) });
const keyPair = () => { const e = crypto.createECDH("prime256v1"); e.generateKeys(); return { p256dh: e.getPublicKey("base64url"), auth: crypto.randomBytes(16).toString("base64url") }; };

// ---------- handler wiring ----------
// capture the handler's log lines once (per-call swapping is not safe with concurrent calls); print everything else
const logs: string[] = [];
for (const k of ["log", "error"] as const) {
  const orig = console[k].bind(console);
  console[k] = (...a: unknown[]) => { const line = a.join(" "); line.startsWith('{"fn":"send-push-notifications"') ? logs.push(line) : orig(...a); };
}
function deps(db: Deps["db"], over: Partial<Deps> & { env?: Partial<Deps["env"]> } = {}): Deps {
  return {
    db,
    env: { CRON_SECRET: SECRET, VAPID_PUBLIC_KEY: vapid.publicKey, VAPID_PRIVATE_KEY: vapid.privateKey, VAPID_EMAIL: "mailto:qa@example.com", ...over.env },
    setVapidDetails: (e, pub, priv) => webpush.setVapidDetails(e, pub, priv),
    // the function's own sender (request built first), but only ever towards the loopback mock
    sendNotification: makeSender({
      generateRequestDetails: (sub: any, p: string, o: object) => webpush.generateRequestDetails(sub, p, o),
      sendNotification: (sub: any, p: string, o: object) => {
        if (!String(sub.endpoint).startsWith("https://127.0.0.1:")) throw new Error("refusing non-loopback endpoint in test");
        return webpush.sendNotification(sub, p, o);
      },
    }, { agent: loopbackAgent }),
    now: over.now ?? (() => Date.now()),
  };
}
async function call(d: Deps, body?: unknown, headers: Record<string, string> = { "x-cron-secret": SECRET }, method = "POST") {
  const res = await handleRequest(new Request("http://local/send-push-notifications", { method, headers, body: method === "POST" && body !== undefined ? JSON.stringify(body) : undefined }), d);
  const text = await res.text(); let j: any = null; try { j = JSON.parse(text); } catch {}
  return { status: res.status, j, text };
}

// ---------- fixture ----------
const admin = await conn();
const q = async (sql: string, p: unknown[] = []) => (await admin.query(sql, p)).rows;
const today = (await q(`select (now() at time zone 'Asia/Bangkok')::date::text d`))[0].d as string;
const add = (n: number) => (bangkokDate(Date.parse(today + "T00:00:00+07:00"), n));
const SUBS = { A1: U.owner, A2: U.owner, B1: U.buyer };
async function cleanup() {
  await q(`delete from public.push_subscriptions where endpoint like 'https://127.0.0.1:%/s/QAVR-%'`);
  await q(`delete from public.vaccines where id between 9900021 and 9900030`);
  await q(`delete from public.pets where id between 900021 and 900025`);
}
async function fixture() {
  await cleanup();
  if (!(await q(`select 1 from public.profiles where id = $1`, [U.owner])).length) throw new Error("refusing: staging QA seed not found");
  if ((await q(`select 1 from public.pets where id = $1`, [PET.orphan])).length) throw new Error("orphan pet id unexpectedly exists");
  await q(`insert into public.pets (id, name, species, user_id, status, is_public) values
    (900021, 'QA-VR Pet A1', 'cat', $1, 'ไม่ขาย', false), (900022, 'QA-VR Pet A2', 'cat', $1, 'ไม่ขาย', false),
    (900023, 'QA-VR Pet B', 'cat', $2, 'ไม่ขาย', false), (900024, 'QA-VR Pet C', 'cat', $3, 'ไม่ขาย', false),
    (900025, 'QA-VR Pet NoOwner', 'cat', null, 'ไม่ขาย', false)`, [U.owner, U.buyer, U.stranger]);
  await q(`insert into public.vaccines (id, pet_id, vaccine_name, next_due) values
    (9900021, 900021, 'QA-VR today', $1), (9900022, 900022, 'QA-VR tomorrow', $2), (9900023, 900021, 'QA-VR day after', $3),
    (9900024, 900021, 'QA-VR yesterday', $4), (9900025, 900023, 'QA-VR B today', $1), (9900026, 900024, 'QA-VR C tomorrow', $2),
    (9900027, 900025, 'QA-VR no owner', $1), (9900028, 900029, 'QA-VR orphan', $1), (9900029, 900021, 'QA-VR no date', null)`,
    [today, add(1), add(2), add(-1)]);
  for (const [tag, uid] of Object.entries(SUBS)) {
    const k = keyPair();
    await q(`insert into public.push_subscriptions (user_id, endpoint, p256dh, auth) values ($1, $2, $3, $4)`, [uid, `https://127.0.0.1:${PORT}/s/QAVR-${tag}`, k.p256dh, k.auth]);
  }
}
const resetRuns = async () => { await q(`delete from public.vaccine_reminder_deliveries where vaccine_id between 9900021 and 9900030`); for (const k of Object.keys(hits)) delete hits[k]; for (const k of Object.keys(mode)) delete mode[k]; };
// send-log rows are keyed by user + endpoint hash (not the subscription row) → map hashes back to our tags
const sha = (e: string) => crypto.createHash("sha256").update(e).digest("hex");
const TAG_OWNER: Record<string, string> = { A1: U.owner, A2: U.owner, A1N: U.owner, B1: U.buyer };
const tagOfHash = new Map<string, string>();
for (const t of Object.keys(TAG_OWNER)) { tagOfHash.set(sha(`https://127.0.0.1:${PORT}/s/QAVR-${t}`), t); tagOfHash.set(sha(`https://127.0.0.1:9/s/QAVR-${t}`), t); }
const deliveries = async () => {
  const rows = await q(`select user_id::text u, endpoint_hash h, string_agg(vaccine_id - 9900000 || ':' || status, ',' order by vaccine_id) v
    from public.vaccine_reminder_deliveries where vaccine_id between 9900021 and 9900030 group by 1, 2`);
  return Object.fromEntries(rows.map((r: any) => { const t = tagOfHash.get(r.h) ?? "?"; return [TAG_OWNER[t] === r.u ? t : `${t}@other-user`, r.v]; }));
};
const pick = (j: any, ...k: string[]) => Object.fromEntries(k.map((x) => [x, j?.[x]]));

if (process.argv.includes("cleanup")) { await resetRuns(); await cleanup(); await admin.end(); server.close(); console.log("cleaned"); process.exit(0); }
ok("Bangkok date of the database = handler's Bangkok date", today === bangkokDate(Date.now()), { today });
await fixture();
const db = pgDb(admin);
const realDue = Number((await q(`select count(*) c from public.vaccines where next_due >= $1 and next_due < $2 and id not between 9900021 and 9900030`, [today, add(2)]))[0].c);
ok("no other staging vaccine falls in the window (counts below are exact)", realDue === 0, { realDue });

// ---------- 1. endpoint authentication / input ----------
{
  const noSecret = await call(deps(db, { env: { CRON_SECRET: undefined } }));
  ok("CRON_SECRET not configured → 500 misconfigured (fails closed, never open)", noSecret.status === 500 && noSecret.j?.error === "misconfigured");
  const missing = await call(deps(db), {}, {});
  const wrong = await call(deps(db), {}, { "x-cron-secret": SECRET + "x" });
  const prefix = await call(deps(db), {}, { "x-cron-secret": SECRET.slice(0, -1) });
  ok("missing / wrong / prefix secret → 401", missing.status === 401 && wrong.status === 401 && prefix.status === 401, { s: [missing.status, wrong.status, prefix.status] });
  const get = await call(deps(db), undefined, { "x-cron-secret": SECRET }, "GET");
  ok("GET → 405", get.status === 405);
  const asOfLive = await call(deps(db), { as_of: "2026-01-01T00:00:00Z" });
  const badJson = await handleRequest(new Request("http://local/x", { method: "POST", headers: { "x-cron-secret": SECRET }, body: "{" }), deps(db));
  ok("as_of without dry_run → 400; invalid JSON → 400", asOfLive.status === 400 && badJson.status === 400);
  const noVapid = await call(deps(db, { env: { VAPID_PRIVATE_KEY: undefined } }), {});
  ok("VAPID key missing on a real run → 500 misconfigured, no push", noVapid.status === 500 && Object.keys(hits).length === 0);
  ok("nothing written by the auth / input checks", Object.keys(await deliveries()).length === 0);
}

// ---------- 2. Thai dates (dry runs, nothing written) ----------
{
  const r = await call(deps(db), { dry_run: true });
  ok("dry run now: window = Bangkok today + tomorrow; due 6 (today ×4 incl. no-owner + orphan, tomorrow ×2)", r.status === 200 && r.j.window[0] === today && r.j.window[1] === add(1) && r.j.due === 6, pick(r.j, "due", "window"));
  ok("dry run: orphan 1 skipped, no-owner 1 skipped, recipients 3, 1 without subscription, would send to 3 devices",
    r.j.orphan_skipped === 1 && r.j.no_owner_skipped === 1 && r.j.recipients === 3 && r.j.recipients_without_subscription === 1 && r.j.subscriptions === 3 && r.j.attempted === 3 && r.j.outcome === "would_send" && r.j.sent === 0,
    pick(r.j, "orphan_skipped", "no_owner_skipped", "recipients", "recipients_without_subscription", "subscriptions", "attempted", "outcome"));
  // one second before Bangkok midnight of `today` (= 16:59:59Z the day before) → window yesterday + today
  const before = await call(deps(db), { dry_run: true, as_of: new Date(Date.parse(today + "T00:00:00+07:00") - 1000).toISOString() });
  ok("as_of 23:59:59 BKK the evening before → window [yesterday, today], due 5 (yesterday + today ×4)", before.j.window[0] === add(-1) && before.j.due === 5, pick(before.j, "window", "due"));
  const midnight = await call(deps(db), { dry_run: true, as_of: new Date(Date.parse(today + "T00:00:00+07:00")).toISOString() });
  ok("as_of 00:00 BKK (still the previous day in UTC) → window [today, tomorrow], due 6", midnight.j.window[0] === today && midnight.j.due === 6, pick(midnight.j, "window", "due"));
  const cron = await call(deps(db), { dry_run: true, as_of: today + "T01:00:00Z" });
  ok("as_of cron time 01:00 UTC = 08:00 BKK → same window", cron.j.window[0] === today && cron.j.due === 6);
  const far = await call(deps(db), { dry_run: true, as_of: "2031-06-01T01:00:00Z" });
  ok("nothing due → 200 no_due (distinct from errors)", far.status === 200 && far.j.outcome === "no_due" && far.j.due === 0);
  ok("dry runs sent nothing and wrote nothing", Object.keys(hits).length === 0 && Object.keys(await deliveries()).length === 0);
}

// ---------- 3. no subscription ----------
{
  await resetRuns();
  const saved = await q(`select user_id, endpoint, p256dh, auth from public.push_subscriptions where endpoint like '%/s/QAVR-%'`);
  await q(`delete from public.push_subscriptions where endpoint like '%/s/QAVR-%'`);
  const r = await call(deps(db), {});
  ok("due items but no subscription → 200 no_subscriptions, 0 attempts", r.status === 200 && r.j.outcome === "no_subscriptions" && r.j.attempted === 0 && r.j.recipients === 3, pick(r.j, "outcome", "recipients", "recipients_without_subscription"));
  for (const s of saved) await q(`insert into public.push_subscriptions (user_id, endpoint, p256dh, auth) values ($1, $2, $3, $4)`, [s.user_id, s.endpoint, s.p256dh, s.auth]);
}

// ---------- 4. full send, then a second run the same day ----------
{
  await resetRuns();
  const r = await call(deps(db), {});
  const d = await deliveries();
  ok("run: 3 devices sent, 200 'sent'", r.status === 200 && r.j.outcome === "sent" && r.j.sent === 3 && r.j.failed === 0, pick(r.j, "outcome", "sent", "attempted"));
  ok("one push per device, encrypted (aes128gcm) + VAPID", hits["QAVR-A1"] === 1 && hits["QAVR-A2"] === 1 && hits["QAVR-B1"] === 1 && bad.length === 0, { hits, bad });
  ok("log rows: A1/A2 = today + tomorrow, B1 = its today; all 'sent'; no row for orphan / no-owner / excluded dates",
    d.A1 === "21:sent,22:sent" && d.A2 === "21:sent,22:sent" && d.B1 === "25:sent", d);
  const again = await call(deps(db), {});
  ok("second run same day → 200 already_sent, 0 pushes, 5 items skipped", again.status === 200 && again.j.outcome === "already_sent" && again.j.attempted === 0 && again.j.already_sent_skipped === 5 && hits["QAVR-A1"] === 1, pick(again.j, "outcome", "attempted", "already_sent_skipped"));
}

// ---------- 5. push service errors, partial success, retry ----------
{
  await resetRuns();
  mode["QAVR-A2"] = "fail500"; mode["QAVR-B1"] = "fail429";
  const r1 = await call(deps(db), {});
  ok("A1 ok, A2 500, B1 429 → 502 partial_failure, failed_status counted", r1.status === 502 && r1.j.outcome === "partial_failure" && r1.j.sent === 1 && r1.j.failed === 2 && r1.j.failed_status["500"] === 1 && r1.j.failed_status["429"] === 1, pick(r1.j, "outcome", "sent", "failed", "failed_status"));
  ok("failed claims released, A1 recorded", JSON.stringify(await deliveries()) === JSON.stringify({ A1: "21:sent,22:sent" }), await deliveries());
  mode["QAVR-B1"] = "ok";
  const r2 = await call(deps(db), {});
  ok("retry: A1 skipped (not re-sent), B1 now sent, A2 still 500 → 502", r2.status === 502 && r2.j.attempted === 2 && r2.j.sent === 1 && r2.j.failed === 1 && hits["QAVR-A1"] === 1, { ...pick(r2.j, "attempted", "sent", "failed"), hits });
  mode["QAVR-A2"] = "ok";
  const r3 = await call(deps(db), {});
  ok("second retry: only A2 sent → 200 sent; A1 got exactly 1 push in total, B1 1 success", r3.status === 200 && r3.j.attempted === 1 && r3.j.sent === 1 && hits["QAVR-A1"] === 1, { ...pick(r3.j, "attempted", "sent"), hits });
  const r4 = await call(deps(db), {});
  ok("third retry: nothing left → already_sent", r4.j.outcome === "already_sent" && r4.j.attempted === 0);
  // a vaccine added later the same day: only that item goes out, to that owner's device
  await q(`insert into public.vaccines (id, pet_id, vaccine_name, next_due) values (9900030, 900023, 'QA-VR B added later', $1)`, [add(1)]);
  const r5 = await call(deps(db), {});
  ok("item added later the same day → only B1 gets one push for it", r5.j.sent === 1 && r5.j.attempted === 1 && hits["QAVR-B1"] === 3 && (await deliveries()).B1 === "25:sent,30:sent", { hits, d: await deliveries() });
  await q(`delete from public.vaccines where id = 9900030`);
}

// ---------- 6. expired subscriptions, network failure, timeout ----------
{
  await resetRuns();
  mode["QAVR-A2"] = "gone410"; mode["QAVR-B1"] = "nf404";
  const r = await call(deps(db), {});
  const left = (await q(`select split_part(endpoint, '/s/QAVR-', 2) t from public.push_subscriptions where endpoint like '%/s/QAVR-%' order by 1`)).map((x: any) => x.t);
  ok("410 / 404 → subscriptions removed (expired_removed 2), A1 sent, 200 'sent'", r.status === 200 && r.j.expired_removed === 2 && r.j.sent === 1 && JSON.stringify(left) === '["A1"]', { ...pick(r.j, "outcome", "expired_removed", "sent"), left });
  // clear failures: connection refused (nothing left), 400 from the push service, keys that cannot be encrypted
  await fixture(); await resetRuns();
  await q(`update public.push_subscriptions set endpoint = 'https://127.0.0.1:9/s/QAVR-B1' where endpoint like '%/s/QAVR-B1'`);
  await q(`update public.push_subscriptions set p256dh = 'not-a-key' where endpoint like '%/s/QAVR-A1'`);
  mode["QAVR-A2"] = "fail400";
  const c = await call(deps(db), {});
  ok("refused / 400 / bad keys → clear failures (connect_failed, 400, request_build_failed), 502, claims released, A1 never reached the mock",
    c.status === 502 && c.j.failed === 3 && c.j.uncertain === 0 && c.j.failed_status.connect_failed === 1 && c.j.failed_status["400"] === 1 && c.j.failed_status.request_build_failed === 1
      && Object.keys(await deliveries()).length === 0 && !hits["QAVR-A1"], { ...pick(c.j, "outcome", "failed", "failed_status"), hits });
  // uncertain: the mock receives the whole message, then cuts the connection (A1) or never answers (A2, 10 s timeout)
  await fixture(); await resetRuns();
  mode["QAVR-A1"] = "drop"; mode["QAVR-A2"] = "hang";
  const t0 = Date.now();
  const u = await call(deps(db), {});
  const du = await deliveries();
  ok("received-then-dropped + no answer → uncertain (connection_lost, timeout), 502, claims kept as 'uncertain'; B1 sent",
    u.status === 502 && u.j.outcome === "partial_failure" && u.j.uncertain === 2 && u.j.failed === 0 && u.j.sent === 1
      && u.j.uncertain_reason.connection_lost === 1 && u.j.uncertain_reason.timeout === 1
      && du.A1 === "21:uncertain,22:uncertain" && du.A2 === "21:uncertain,22:uncertain" && du.B1 === "25:sent",
    { ...pick(u.j, "outcome", "uncertain", "uncertain_reason", "sent"), d: du, ms: Date.now() - t0, hits: { ...hits } });
  hanging.forEach((res) => res.destroy()); hanging.length = 0;
  mode["QAVR-A1"] = "ok"; mode["QAVR-A2"] = "ok";
  const u2 = await call(deps(db), {});
  ok("next run: the uncertain devices are NOT sent again (each got 1 delivery attempt in total), reported as uncertain_claims 4",
    u2.status === 200 && u2.j.attempted === 0 && u2.j.uncertain_claims === 4 && hits["QAVR-A1"] === 1 && hits["QAVR-A2"] === 1,
    { ...pick(u2.j, "outcome", "attempted", "uncertain_claims"), hits });
  await fixture();
}

// ---------- 7. query / service failures → 500 with the stage, nothing sent ----------
{
  for (const stage of ["vaccines:select", "pets:select", "push_subscriptions:select", "vaccine_reminder_deliveries:select", "vaccine_reminder_deliveries:upsert"]) {
    await resetRuns();
    const r = await call(deps(pgDb(admin, { [stage]: true })), {});
    ok(`${stage} fails → 500 query_failed (not 200 {sent:0}), 0 pushes, 0 rows`, r.status === 500 && r.j.error === "query_failed" && Object.keys(hits).length === 0 && Object.keys(await deliveries()).length === 0, { status: r.status, stage: r.j?.stage });
  }
  await resetRuns();
  const r = await call(deps(pgDb(admin, { "vaccine_reminder_deliveries:update": true })), {});
  const d = await deliveries();
  ok("pushes accepted but recording 'sent' fails → 500; claims stay 'sending'", r.status === 500 && r.j.stage === "deliveries_mark_sent" && d.A1 === "21:sending,22:sending", { status: r.status, d });
  const retry = await call(deps(db), {});
  ok("retry right after → nothing re-sent (claims count as taken)", retry.j.attempted === 0 && hits["QAVR-A1"] === 1, pick(retry.j, "outcome", "attempted"));
  const later = await call(deps(db, { now: () => Date.now() + 20 * 60 * 1000 }), {});
  ok("20 min later → still not re-sent, reported as stuck_claims 5", later.j.attempted === 0 && later.j.stuck_claims === 5, pick(later.j, "attempted", "stuck_claims"));
}

// ---------- 8. two runs at the same time ----------
{
  // 10 rounds; the second run starts 0–40 ms later so the claim steps overlap in different ways
  const c1 = await conn(), c2 = await conn();
  const splits: string[] = []; let dupes = 0, wrongTotal = 0;
  for (let i = 0; i < 10; i++) {
    await resetRuns();
    const [x, y] = await Promise.all([call(deps(pgDb(c1)), {}),
      (async () => { await new Promise((r) => setTimeout(r, Math.random() * 40)); return call(deps(pgDb(c2)), {}); })()]);
    splits.push(`${x.j.sent}/${y.j.sent}`);
    if (x.j.sent + y.j.sent !== 3) wrongTotal++;
    if (Object.values(hits).some((h) => h !== 1)) dupes++;
  }
  await c1.end(); await c2.end();
  ok("two concurrent runs ×10 → every device exactly 1 push per round, total 3", dupes === 0 && wrongTotal === 0, { splits, dupes, wrongTotal });
}

// ---------- 9. owner changes → reminders follow pets.user_id ----------
{
  await resetRuns();
  await q(`update public.pets set user_id = $1 where id = 900022`, [U.buyer]);
  await call(deps(db), {});
  const d = await deliveries();
  ok("pet A2 now owned by 05 → its reminder goes to B1 only, A1/A2 devices get only pet A1", d.A1 === "21:sent" && d.A2 === "21:sent" && d.B1 === "22:sent,25:sent", d);
  await q(`update public.pets set user_id = $1 where id = 900022`, [U.owner]);
}

// ---------- 9b. QA single-user run (qa_only_user_id) ----------
{
  await resetRuns();
  const bad = await call(deps(db), { qa_only_user_id: "not-a-uuid" });
  ok("qa_only_user_id must be a UUID → 400", bad.status === 400);
  const two = await call(deps(db), { qa_only_user_id: U.owner });
  ok("QA run for a user with 2 subscriptions → 409 qa_guard_failed, 0 pushes, 0 rows", two.status === 409 && two.j.outcome === "qa_guard_failed" && Object.keys(hits).length === 0 && Object.keys(await deliveries()).length === 0, pick(two.j, "outcome", "subscriptions"));
  const none = await call(deps(db), { qa_only_user_id: U.stranger });
  ok("QA run for a user without subscription → 409, 0 pushes", none.status === 409 && Object.keys(hits).length === 0, pick(none.j, "outcome", "subscriptions"));
  const dryQa = await call(deps(db), { dry_run: true, qa_only_user_id: U.buyer });
  ok("QA dry run for buyer (1 subscription) → would_send to 1 device, recipients 1 (others filtered out)", dryQa.status === 200 && dryQa.j.outcome === "would_send" && dryQa.j.recipients === 1 && dryQa.j.attempted === 1 && dryQa.j.qa_single_user === true, pick(dryQa.j, "outcome", "recipients", "attempted"));
  const one = await call(deps(db), { qa_only_user_id: U.buyer });
  const d = await deliveries();
  ok("QA run for buyer → exactly 1 push to B1, none to A1/A2 although they have due items; only B1 rows recorded", one.status === 200 && one.j.sent === 1 && hits["QAVR-B1"] === 1 && !hits["QAVR-A1"] && !hits["QAVR-A2"] && d.B1 === "25:sent" && !d.A1 && !d.A2, { ...pick(one.j, "outcome", "sent"), hits, d });
  const again = await call(deps(db), { qa_only_user_id: U.buyer });
  ok("QA run repeated → already_sent, no second push", again.j.outcome === "already_sent" && hits["QAVR-B1"] === 1);
}

// ---------- 10. no personal data in responses or logs ----------
{
  const all = logs.join("\n");
  const leaks = ["QA-VR", "127.0.0.1", "QAVR-", U.owner, U.buyer, U.stranger, "p256dh", vapid.privateKey, SECRET].filter((s) => all.includes(s));
  ok("handler logs: no names, user ids, endpoints, keys or secret", leaks.length === 0 && logs.length > 0, { lines: logs.length, leaks });
  const r = await call(deps(db), { dry_run: true });
  ok("response body: counts only", !["QA-VR", "127.0.0.1", U.owner, U.buyer].some((s) => r.text.includes(s)));
  ok("error logs carry the stage + code", logs.some((l) => l.includes('"stage":"pets"') && l.includes('"code":"XX000"')));

  // errors that carry secrets in message / details / code, and an unexpected throw with a secret message
  const POISON = ["SECRET-ENDPOINT-https://fcm.googleapis.com/fcm/send/abc", "poison@example.com", "a0000000-0000-4000-8000-0000000000aa", "sk_live_SECRETKEY"];
  const msg = POISON.join(" | ");
  const before = logs.length;
  await resetRuns();
  const r1 = await call(deps(pgDb(admin, { "pets:select": { code: "23505", message: `duplicate key: Key (endpoint)=(${msg})`, details: msg } })), {});
  const r2 = await call(deps(pgDb(admin, { "push_subscriptions:select": { code: msg, message: msg } })), {});
  const r3 = await call(deps(pgDb(admin, { "throw:vaccines": { message: msg, name: "TypeError" } as any })), {});
  const r4 = await call(deps(pgDb(admin, { "throw:vaccines": { message: msg, name: msg } as any })), {});
  const newLogs = logs.slice(before).join("\n"), bodies = [r1, r2, r3, r4].map((x) => x.text).join("\n");
  const leaked = POISON.filter((p) => newLogs.includes(p) || bodies.includes(p));
  ok("poisoned errors: 500s with stage + sanitised code only (23505 kept, junk code → 'other', throw → TypeError / object); nothing of the secret text in logs or bodies",
    leaked.length === 0 && r1.j.code === "23505" && r2.j.code === "other" && r3.status === 500 && r3.j.error === "internal_error"
      && newLogs.includes('"error":"TypeError"') && newLogs.includes('"error":"object"'),
    { leaked, codes: [r1.j.code, r2.j.code], r3: r3.j, lines: logs.length - before });
  // push errors whose message holds the endpoint: only labels reach logs
  await resetRuns(); mode["QAVR-A1"] = "fail500";
  const before2 = logs.length;
  await call(deps(db), {});
  const pushLogs = logs.slice(before2).join("\n");
  ok("push failure logs: labels / counts only, no endpoint", !pushLogs.includes("127.0.0.1") && !pushLogs.includes("QAVR") && pushLogs.includes('"failed_status":{"500":1}'), { pushLogs: pushLogs.length });
}

// ---------- 11. history kept across unsubscribe / resubscribe; isolation; retention ----------
{
  const subRow = async (t: string) => (await q(`select id, user_id from public.push_subscriptions where endpoint = $1`, [`https://127.0.0.1:${PORT}/s/QAVR-${t}`]))[0];
  const addSub = async (uid: string, t: string) => { const k = keyPair(); await q(`insert into public.push_subscriptions (user_id, endpoint, p256dh, auth) values ($1, $2, $3, $4)`, [uid, `https://127.0.0.1:${PORT}/s/QAVR-${t}`, k.p256dh, k.auth]); };
  await fixture(); await resetRuns();
  await call(deps(db), {});
  ok("baseline run: A1 / A2 / B1 sent", JSON.stringify(await deliveries()) === JSON.stringify(await deliveries()) && (await deliveries()).A1 === "21:sent,22:sent", await deliveries());
  // app unsubscribe (row deleted) → history stays, subscription_id null
  const a1 = await subRow("A1");
  await q(`delete from public.push_subscriptions where id = $1`, [a1.id]);
  const kept = (await q(`select count(*)::int c, count(*) filter (where subscription_id is null)::int n from public.vaccine_reminder_deliveries where endpoint_hash = $1`, [sha(`https://127.0.0.1:${PORT}/s/QAVR-A1`)]))[0];
  ok("unsubscribe: A1's 2 send-log rows kept, subscription_id set to null (history no longer lost)", kept.c === 2 && kept.n === 2, kept);
  // resubscribe with the SAME endpoint (new subscription id, new keys) → not sent again
  await addSub(U.owner, "A1");
  const same = await call(deps(db), {});
  ok("resubscribe, same endpoint → already_sent, A1 still 1 push", same.j.outcome === "already_sent" && same.j.attempted === 0 && hits["QAVR-A1"] === 1, { ...pick(same.j, "outcome", "attempted"), hits: { ...hits } });
  // resubscribe with a NEW endpoint (browser-level unsubscribe) → treated as a new destination
  await q(`delete from public.push_subscriptions where endpoint = $1`, [`https://127.0.0.1:${PORT}/s/QAVR-A1`]);
  await addSub(U.owner, "A1N");
  const neu = await call(deps(db), {});
  ok("resubscribe, NEW endpoint → sent again to it (an endpoint hash cannot prove it is the same device — documented)", neu.j.sent === 1 && hits["QAVR-A1N"] === 1 && (await deliveries()).A1N === "21:sent,22:sent", { ...pick(neu.j, "outcome", "sent"), hits: { ...hits } });
  // isolation: pet A2 transferred to the buyer, who subscribes from the owner's old endpoint A2 (shared browser)
  await q(`delete from public.push_subscriptions where endpoint = $1`, [`https://127.0.0.1:${PORT}/s/QAVR-A2`]);
  await q(`update public.pets set user_id = $1 where id = 900022`, [U.buyer]);
  await addSub(U.buyer, "A2");
  const iso = await call(deps(db), {});
  const di = await deliveries();
  ok("another account on the same endpoint is NOT blocked by the first account's rows: buyer gets pet A2's reminder on endpoint A2",
    iso.j.sent >= 1 && di["A2@other-user"] === "22:sent,25:sent" && di.A2 === "21:sent,22:sent" && hits["QAVR-A2"] === 2, { ...pick(iso.j, "outcome", "sent"), d: di, hits: { ...hits } });
  await q(`update public.pets set user_id = $1 where id = 900022`, [U.owner]);
  // 410 → subscription deleted, its claims released (nothing delivered), no stuck 'sending' rows
  await fixture(); await resetRuns(); mode["QAVR-B1"] = "gone410";
  await call(deps(db), {});
  const b1rows = (await q(`select count(*)::int c from public.vaccine_reminder_deliveries where endpoint_hash = $1`, [sha(`https://127.0.0.1:${PORT}/s/QAVR-B1`)]))[0].c;
  ok("410: subscription deleted and its claims released (0 rows for B1, no stuck 'sending')", b1rows === 0 && !(await subRow("B1")), { b1rows });
  // retention: rows > 90 days past next_due are pruned on a real run (not on a dry run); 30 days kept
  await fixture(); await resetRuns();
  const h = sha(`https://127.0.0.1:${PORT}/s/QAVR-B1`);
  await q(`insert into public.vaccine_reminder_deliveries (user_id, endpoint_hash, vaccine_id, next_due, reminder_date, status, sent_at)
           values ($1, $2, 9900024, $3::date - 100, $3::date - 100, 'sent', now()), ($1, $2, 9900024, $3::date - 30, $3::date - 30, 'sent', now())`, [U.buyer, h, today]);
  const d0 = await call(deps(db), { dry_run: true });
  const afterDry = (await q(`select count(*)::int c from public.vaccine_reminder_deliveries where vaccine_id = 9900024`))[0].c;
  const real = await call(deps(db), {});
  const left = (await q(`select (next_due < $1::date - 90) old from public.vaccine_reminder_deliveries where vaccine_id = 9900024`, [today])).map((r: any) => r.old);
  ok("retention: dry run prunes nothing; real run prunes the 100-day-old row, keeps the 30-day-old one", afterDry === 2 && d0.j.pruned === 0 && real.j.pruned === 1 && JSON.stringify(left) === "[false]", { afterDry, pruned: real.j.pruned, left });
  // retention also runs when nothing is due
  await q(`insert into public.vaccine_reminder_deliveries (user_id, endpoint_hash, vaccine_id, next_due, reminder_date, status) values ($1, $2, 9900024, $3::date - 120, $3::date - 120, 'sent')`, [U.buyer, h, today]);
  const nd = await call(deps(db), { qa_only_user_id: U.stranger });   // QA filter → no subscription → 409 → no prune
  const nothing = await call(deps(pgDb(admin, {})), {});
  ok("retention runs on every non-dry run that is not refused", nd.status === 409 && nothing.j.pruned === 1, { qa: nd.status, pruned: nothing.j.pruned });
  await fixture();
}

// ---------- Part B: real PostgREST on staging (QA owner session, RLS-limited) ----------
{
  const KEY = process.env.STAGING_ANON_KEY, SJS = process.env.SUPABASE_JS;
  if (!KEY || !SJS) ok("Part B needs STAGING_ANON_KEY + SUPABASE_JS", false);
  else {
    const { createClient } = require(SJS);
    const PW = fs.readFileSync(os.homedir() + "/.whiskora/staging_qa_password", "utf8").trim();
    const sb = createClient(SB, KEY, { auth: { persistSession: false } });
    const { error: le } = await sb.auth.signInWithPassword({ email: "whiskora-qa+owner@example.com", password: PW });
    ok("QA owner signed in (staging)", !le);
    const old = await sb.from("vaccines").select("pet_id, vaccine_name, next_due, pets!inner(name, user_id)").gte("next_due", today).lt("next_due", add(2));
    ok("old embed query on real PostgREST → PGRST200 (the production bug)", old.error?.code === "PGRST200", { code: old.error?.code });
    await resetRuns();
    const r = await call(deps(sb), { dry_run: true });
    ok("handler via real PostgREST: vaccines + pets + subscriptions queries accepted; deliveries table denied to API roles → 500 stage deliveries_read (42501)",
      r.status === 500 && r.j.stage === "deliveries_read" && r.j.code === "42501", r.j);
    const live = await call(deps(sb), {});
    ok("same on a real run → 500, 0 pushes", live.status === 500 && Object.keys(hits).length === 0, { status: live.status });
    const direct = await sb.from("vaccine_reminder_deliveries").insert({ subscription_id: crypto.randomUUID(), vaccine_id: 9900021, next_due: today, reminder_date: today });
    ok("API user cannot write the send log", !!direct.error, { code: direct.error?.code });
    await sb.auth.signOut();
  }
}

await resetRuns(); await cleanup();
const leftover = (await q(`select (select count(*) from public.pets where id between 900021 and 900025) + (select count(*) from public.vaccines where id between 9900021 and 9900030)
  + (select count(*) from public.push_subscriptions where endpoint like '%/s/QAVR-%') + (select count(*) from public.vaccine_reminder_deliveries where vaccine_id between 9900021 and 9900030) c`))[0].c;
ok("cleanup: synthetic pets / vaccines / subscriptions / log rows removed", Number(leftover) === 0, { leftover });
await admin.end(); server.close(); fs.rmSync(tlsDir, { recursive: true, force: true });
console.log(`\n${pass} passed, ${fail} failed`); process.exitCode = fail ? 1 : 0;
