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
import { bangkokDate } from "../functions/send-push-notifications/reminders.ts";

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
type Res = { data: any; error: { code?: string; message?: string } | null };
function pgDb(client: any, inject: Record<string, boolean> = {}) {
  return { from: (table: string) => new Q(client, table, inject) } as unknown as Deps["db"];
}
class Q {
  c: any; t: string; inject: Record<string, boolean>; op = "select"; cols = "*"; ret = ""; where: string[] = []; params: unknown[] = [];
  orderBy = ""; off = 0; lim = 0; rows: any[] = []; conflict = ""; ignore = false; set: Record<string, unknown> = {};
  constructor(c: any, t: string, inject: Record<string, boolean>) { this.c = c; this.t = t; this.inject = inject; }
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
  delete() { this.op = "delete"; return this; }
  then(res: (r: Res) => unknown, rej: (e: unknown) => unknown) { return this.exec().then(res, rej); }
  async exec(): Promise<Res> {
    if (this.op === "upsert" && !this.ignore) throw new Error("adapter supports upsert with ignoreDuplicates only");
    if (this.inject[`${this.t}:${this.op}`]) return { data: null, error: { code: "XX000", message: `injected failure ${this.t}:${this.op}` } };
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
      return { data: r.rows, error: null };
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
  req.resume();
  const m = mode[tag] ?? "ok";
  if (m === "hang") { hanging.push(res); return; }
  res.statusCode = { ok: 201, fail500: 500, fail429: 429, gone410: 410, nf404: 404 }[m] ?? 500; res.end();
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
    sendNotification: (sub, payload, o) => {
      if (!sub.endpoint.startsWith(`https://127.0.0.1:`)) throw new Error("refusing non-loopback endpoint in test");
      return webpush.sendNotification(sub, payload, { ...o, agent: loopbackAgent });
    },
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
const deliveries = async () => Object.fromEntries((await q(`select split_part(s.endpoint, '/s/QAVR-', 2) t, string_agg(d.vaccine_id - 9900000 || ':' || d.status, ',' order by d.vaccine_id) v
  from public.vaccine_reminder_deliveries d join public.push_subscriptions s on s.id = d.subscription_id where d.vaccine_id between 9900021 and 9900030 group by 1`)).map((r: any) => [r.t, r.v]));
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
  await fixture(); await resetRuns();
  await q(`update public.push_subscriptions set endpoint = 'https://127.0.0.1:9/s/QAVR-B1' where endpoint like '%/s/QAVR-B1'`);
  mode["QAVR-A2"] = "hang";
  const t0 = Date.now();
  const n = await call(deps(db), {});
  ok("connection refused + push service hanging (10 s timeout) → failed as 'network', 502, claims released", n.status === 502 && n.j.failed === 2 && n.j.failed_status.network === 2 && (await deliveries()).B1 === undefined && (await deliveries()).A2 === undefined, { ...pick(n.j, "failed", "failed_status"), ms: Date.now() - t0 });
  hanging.forEach((res) => res.destroy()); hanging.length = 0;
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

// ---------- 10. no personal data in responses or logs ----------
{
  const all = logs.join("\n");
  const leaks = ["QA-VR", "127.0.0.1", "QAVR-", U.owner, U.buyer, U.stranger, "p256dh", vapid.privateKey, SECRET].filter((s) => all.includes(s));
  ok("handler logs: no names, user ids, endpoints, keys or secret", leaks.length === 0 && logs.length > 0, { lines: logs.length, leaks });
  const r = await call(deps(db), { dry_run: true });
  ok("response body: counts only", !["QA-VR", "127.0.0.1", U.owner, U.buyer].some((s) => r.text.includes(s)));
  ok("error logs carry the stage + code", logs.some((l) => l.includes('"stage":"pets"') && l.includes('"code":"XX000"')));
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
