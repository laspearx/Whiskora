// whiskora-staging only. End-to-end checks of the DEPLOYED Edge Function send-push-notifications on staging:
// real gateway (JWT), real secrets (set by the owner in the dashboard), real PostgREST with the service role
// (claim + record in vaccine_reminder_deliveries), pg_net calls shaped like the cron job, and pg_cron semantics.
// Pushes go only to the staging mock qa-push-mock (supabase/tests/staging_only/), never to a real push service:
// every subscription on staging is checked to point at the mock before any non-dry run.
//
// usage: NODE_PATH=<dir with pg> STAGING_ANON_KEY=<staging anon JWT> node supabase/tests/vaccine_reminder_deployed_staging.cjs
// Reads CRON_SECRET from ~/.whiskora/staging_cron_secret (never printed). Prints statuses / counts only.
// Vault: creates cron_secret + functions_anon_key only if they do not exist, and deletes only those it created.
// If either name already exists, the pg_net / cron part is skipped (existing secrets are never read or changed).
const { Client, types } = require("pg");
const fs = require("fs"); const os = require("os");
types.setTypeParser(1082, (v) => v); types.setTypeParser(20, (v) => Number(v));

const url = fs.readFileSync(os.homedir() + "/.whiskora/staging_db_url", "utf8").trim();
if (!url.includes("wpxcukrwmegwzfccbbga")) { console.error("refusing: not staging"); process.exit(2); }
const SECRET = fs.readFileSync(os.homedir() + "/.whiskora/staging_cron_secret", "utf8").trim();
const ANON = process.env.STAGING_ANON_KEY; if (!ANON) { console.error("set STAGING_ANON_KEY"); process.exit(2); }
const SB = "https://wpxcukrwmegwzfccbbga.supabase.co";
const FN = `${SB}/functions/v1/send-push-notifications`;
const MOCK = `${SB}/functions/v1/qa-push-mock`;
const U = { owner: "a0000000-0000-4000-8000-000000000001", buyer: "a0000000-0000-4000-8000-000000000005", stranger: "a0000000-0000-4000-8000-000000000006" };
const SUBS = { A1: U.owner, A2: U.owner, B1: U.buyer };

let pass = 0, fail = 0;
const ok = (n, c, i = {}) => { c ? pass++ : fail++; console.log(`${c ? "PASS" : "FAIL"} ${n} :: ${JSON.stringify(i)}`); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const pick = (j, ...k) => Object.fromEntries(k.map((x) => [x, j?.[x]]));

(async () => {
  const db = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } }); await db.connect();
  const q = async (sql, p = []) => (await db.query(sql, p)).rows;
  const started = new Date().toISOString();
  const createdVault = [];
  const today = (await q(`select (now() at time zone 'Asia/Bangkok')::date::text d`))[0].d;
  const add = async (n) => (await q(`select ($1::date + $2::int)::text d`, [today, n]))[0].d;
  const [d1, d2, dm1] = [await add(1), await add(2), await add(-1)];

  // ---------- fixture (synthetic; same shape as vaccine_reminder_staging.mts, endpoints = staging mock) ----------
  async function cleanup() {
    await q(`delete from public.push_subscriptions where endpoint like $1`, [`${MOCK}/QAVR-%`]);
    await q(`delete from public.vaccines where id between 9900021 and 9900030`);
    await q(`delete from public.pets where id between 900021 and 900025`);
    await q(`delete from public.qa_push_mock_hits`); await q(`delete from public.qa_push_mock_modes`);
  }
  async function fixture() {
    await cleanup();
    if (!(await q(`select 1 from public.profiles where id = $1`, [U.owner])).length) throw new Error("refusing: staging QA seed not found");
    if ((await q(`select 1 from public.pets where id = 900029`)).length) throw new Error("orphan pet id unexpectedly exists");
    await q(`insert into public.pets (id, name, species, user_id, status, is_public) values
      (900021, 'QA-VR Pet A1', 'cat', $1, 'ไม่ขาย', false), (900022, 'QA-VR Pet A2', 'cat', $1, 'ไม่ขาย', false),
      (900023, 'QA-VR Pet B', 'cat', $2, 'ไม่ขาย', false), (900024, 'QA-VR Pet C', 'cat', $3, 'ไม่ขาย', false),
      (900025, 'QA-VR Pet NoOwner', 'cat', null, 'ไม่ขาย', false)`, [U.owner, U.buyer, U.stranger]);
    await q(`insert into public.vaccines (id, pet_id, vaccine_name, next_due) values
      (9900021, 900021, 'QA-VR today', $1), (9900022, 900022, 'QA-VR tomorrow', $2), (9900023, 900021, 'QA-VR day after', $3),
      (9900024, 900021, 'QA-VR yesterday', $4), (9900025, 900023, 'QA-VR B today', $1), (9900026, 900024, 'QA-VR C tomorrow', $2),
      (9900027, 900025, 'QA-VR no owner', $1), (9900028, 900029, 'QA-VR orphan', $1), (9900029, 900021, 'QA-VR no date', null)`, [today, d1, d2, dm1]);
    const crypto = require("crypto");
    for (const [tag, uid] of Object.entries(SUBS)) {
      const e = crypto.createECDH("prime256v1"); e.generateKeys();
      await q(`insert into public.push_subscriptions (user_id, endpoint, p256dh, auth) values ($1, $2, $3, $4)`,
        [uid, `${MOCK}/QAVR-${tag}`, e.getPublicKey("base64url"), crypto.randomBytes(16).toString("base64url")]);
      await q(`insert into public.qa_push_mock_modes (tag, mode) values ($1, 'ok')`, [`QAVR-${tag}`]);
    }
  }
  const mode = (tag, m) => q(`update public.qa_push_mock_modes set mode = $2 where tag = $1`, [`QAVR-${tag}`, m]);
  const resetRuns = async () => { await q(`delete from public.vaccine_reminder_deliveries where vaccine_id between 9900021 and 9900030`); await q(`delete from public.qa_push_mock_hits`); await q(`update public.qa_push_mock_modes set mode = 'ok'`); };
  const hits = async () => Object.fromEntries((await q(`select replace(tag, 'QAVR-', '') t, count(*)::int n, bool_and(aes128gcm and vapid) enc from public.qa_push_mock_hits group by tag`)).map((r) => [r.t, r.enc ? r.n : `${r.n}!unencrypted`]));
  const deliveries = async () => Object.fromEntries((await q(`select replace(split_part(s.endpoint, '/qa-push-mock/', 2), 'QAVR-', '') t,
      string_agg(d.vaccine_id - 9900000 || ':' || d.status, ',' order by d.vaccine_id) v
    from public.vaccine_reminder_deliveries d join public.push_subscriptions s on s.id = d.subscription_id
    where d.vaccine_id between 9900021 and 9900030 group by 1`)).map((r) => [r.t, r.v]));
  // never let a non-dry run reach anything but the mock
  async function onlyMockSubscriptions() {
    const other = Number((await q(`select count(*) c from public.push_subscriptions where endpoint not like $1`, [`${MOCK}/QAVR-%`]))[0].c);
    if (other) throw new Error(`refusing: ${other} staging subscription(s) point outside the mock`);
  }
  async function call(body, headers = { Authorization: `Bearer ${ANON}`, "x-cron-secret": SECRET }, method = "POST") {
    if (method === "POST" && !(body && body.dry_run === true)) await onlyMockSubscriptions();
    const r = await fetch(FN, { method, headers: { "Content-Type": "application/json", ...headers }, body: method === "POST" ? JSON.stringify(body ?? {}) : undefined });
    const text = await r.text(); let j = null; try { j = JSON.parse(text); } catch {}
    return { status: r.status, j };
  }

  try {
    const realSubs = Number((await q(`select count(*) c from public.push_subscriptions`))[0].c);
    ok("staging has no other push subscriptions before the test", realSubs === 0, { realSubs });
    await fixture(); await onlyMockSubscriptions();
    const realDue = Number((await q(`select count(*) c from public.vaccines where next_due >= $1 and next_due < $2 and id not between 9900021 and 9900030`, [today, d2]))[0].c);
    ok("no other staging vaccine in the window (exact counts)", realDue === 0, { realDue });

    // ---------- 1. gateway + function auth (direct HTTP) ----------
    const noAuth = await call({ dry_run: true }, {});
    const badJwt = await call({ dry_run: true }, { Authorization: "Bearer abc.def.ghi", "x-cron-secret": SECRET });
    const noSecret = await call({ dry_run: true }, { Authorization: `Bearer ${ANON}` });
    const wrong = await call({ dry_run: true }, { Authorization: `Bearer ${ANON}`, "x-cron-secret": SECRET + "x" });
    const get = await call(undefined, { Authorization: `Bearer ${ANON}`, "x-cron-secret": SECRET }, "GET");
    const asOfLive = await call({ as_of: `${today}T01:00:00Z` });
    ok("no key 401 (gateway), bad JWT 401, valid JWT without / with wrong secret 401, GET 405, as_of without dry_run 400",
      noAuth.status === 401 && badJwt.status === 401 && noSecret.status === 401 && noSecret.j?.error === "unauthorized" && wrong.status === 401 && get.status === 405 && asOfLive.status === 400,
      { s: [noAuth.status, badJwt.status, noSecret.status, wrong.status, get.status, asOfLive.status] });

    // ---------- 2. dry run: reads through real PostgREST, writes and sends nothing ----------
    await resetRuns();
    const dry = await call({ dry_run: true });
    ok("dry run (deployed): 200 would_send, due 6, orphan 1, no-owner 1, recipients 3 (1 without subscription), 3 devices",
      dry.status === 200 && dry.j.outcome === "would_send" && dry.j.due === 6 && dry.j.orphan_skipped === 1 && dry.j.no_owner_skipped === 1
        && dry.j.recipients === 3 && dry.j.recipients_without_subscription === 1 && dry.j.attempted === 3 && dry.j.sent === 0,
      pick(dry.j, "outcome", "due", "orphan_skipped", "no_owner_skipped", "recipients", "attempted"));
    const midnight = await call({ dry_run: true, as_of: new Date(Date.parse(`${today}T00:00:00+07:00`) - 1000).toISOString() });
    ok("dry run as_of 23:59:59 BKK the evening before → window [yesterday, today], due 5", midnight.j?.window?.[0] === dm1 && midnight.j?.due === 5, pick(midnight.j, "window", "due"));
    ok("dry runs: 0 send-log rows, 0 mock hits", Object.keys(await deliveries()).length === 0 && Object.keys(await hits()).length === 0);

    // ---------- 3. real run: claim + record through real PostgREST with the service role ----------
    const r1 = await call({});
    const h1 = await hits();
    ok("real run → 200 sent 3; mock got 1 encrypted, VAPID-signed push per device", r1.status === 200 && r1.j.outcome === "sent" && r1.j.sent === 3 && h1.A1 === 1 && h1.A2 === 1 && h1.B1 === 1,
      { ...pick(r1.j, "outcome", "sent", "attempted"), hits: h1 });
    const d = await deliveries();
    ok("send log written by the function (service role via PostgREST): A1/A2 = 21,22 sent; B1 = 25 sent", d.A1 === "21:sent,22:sent" && d.A2 === "21:sent,22:sent" && d.B1 === "25:sent", d);
    const r2 = await call({});
    const h2 = await hits();
    ok("second run → 200 already_sent, 0 attempts, mock hits unchanged", r2.status === 200 && r2.j.outcome === "already_sent" && r2.j.attempted === 0 && h2.A1 === 1 && h2.A2 === 1 && h2.B1 === 1, { ...pick(r2.j, "outcome", "attempted", "already_sent_skipped"), hits: h2 });

    // ---------- 4. push service errors, retry only what clearly failed ----------
    await resetRuns(); await mode("A2", "fail500"); await mode("B1", "fail429");
    const p1 = await call({});
    ok("A2 500 + B1 429 → 502 partial_failure, claims released, A1 recorded", p1.status === 502 && p1.j.outcome === "partial_failure" && p1.j.failed === 2 && p1.j.failed_status["500"] === 1 && p1.j.failed_status["429"] === 1 && JSON.stringify(await deliveries()) === JSON.stringify({ A1: "21:sent,22:sent" }),
      { ...pick(p1.j, "outcome", "failed", "failed_status"), d: await deliveries() });
    await mode("A2", "ok"); await mode("B1", "ok");
    const p2 = await call({});
    const hp = await hits();
    ok("retry → only A2 and B1 sent; A1 not sent again (1 push total)", p2.status === 200 && p2.j.attempted === 2 && p2.j.sent === 2 && hp.A1 === 1 && hp.A2 === 2 && hp.B1 === 2, { ...pick(p2.j, "attempted", "sent"), hits: hp });

    // ---------- 5. expired subscription ----------
    await resetRuns(); await mode("B1", "gone410");
    const e1 = await call({});
    const left = (await q(`select replace(split_part(endpoint, '/qa-push-mock/', 2), 'QAVR-', '') t from public.push_subscriptions where endpoint like $1 order by 1`, [`${MOCK}/QAVR-%`])).map((x) => x.t);
    ok("410 → subscription B1 deleted (expired_removed 1), A1/A2 sent, 200", e1.status === 200 && e1.j.expired_removed === 1 && e1.j.sent === 2 && JSON.stringify(left) === '["A1","A2"]', { ...pick(e1.j, "outcome", "expired_removed", "sent"), left });
    await fixture();

    // ---------- 6. uncertain: the mock receives the message and never answers (function times out after 10 s) ----------
    await resetRuns(); await mode("A2", "hang");
    const t0 = Date.now();
    const u1 = await call({});
    const du = await deliveries(), hu = await hits();
    ok("no answer after delivery → uncertain (timeout), 502, A2 claims kept as 'uncertain'; A1/B1 sent",
      u1.status === 502 && u1.j.uncertain === 1 && u1.j.uncertain_reason?.timeout === 1 && u1.j.failed === 0 && u1.j.sent === 2 && du.A2 === "21:uncertain,22:uncertain" && hu.A2 === 1,
      { ...pick(u1.j, "outcome", "uncertain", "uncertain_reason", "sent"), d: du, hits: hu, ms: Date.now() - t0 });
    await mode("A2", "ok");
    const u2 = await call({});
    const hu2 = await hits();
    ok("next run → A2 NOT sent again (still 1 delivery), uncertain_claims 2 reported, 200 already_sent",
      u2.status === 200 && u2.j.attempted === 0 && u2.j.uncertain_claims === 2 && hu2.A2 === 1, { ...pick(u2.j, "outcome", "attempted", "uncertain_claims"), hits: hu2 });

    // ---------- 7. a real database error through PostgREST → 500 + stage + code, nothing sent ----------
    await resetRuns();
    try {
      await q(`revoke select on public.pets from service_role`);
      const qe = await call({});
      ok("service role loses SELECT on pets → 500 query_failed stage pets code 42501, 0 pushes, 0 rows",
        qe.status === 500 && qe.j.stage === "pets" && qe.j.code === "42501" && Object.keys(await hits()).length === 0 && Object.keys(await deliveries()).length === 0, qe.j);
    } finally {
      await q(`grant select on public.pets to service_role`);
    }
    const sr = (await q(`select string_agg(privilege_type, ',' order by privilege_type) p from information_schema.role_table_grants where table_schema = 'public' and table_name = 'pets' and grantee = 'service_role'`))[0].p;
    ok("service_role grants on pets restored exactly", sr === "DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE", { sr });

    // ---------- 8. pg_net, shaped like the cron job (secrets from Vault, never literal in SQL) ----------
    const existing = Number((await q(`select count(*) c from vault.secrets where name in ('cron_secret', 'functions_anon_key')`))[0].c);
    ok("Vault has no cron_secret / functions_anon_key yet (nothing existing is touched)", existing === 0, { existing });
    if (existing) throw new Error("vault names already exist — skipping pg_net / cron part");
    for (const [name, value] of [["cron_secret", SECRET], ["functions_anon_key", ANON]]) {
      createdVault.push((await q(`select vault.create_secret($1, $2, 'staging QA: vaccine reminder cron test (temporary)') id`, [value, name]))[0].id);
    }
    const VAULT = (n) => `(select decrypted_secret from vault.decrypted_secrets where name = '${n}')`;
    const CMD = (headers, body) => `select net.http_post(url := '${FN}', headers := ${headers}, body := '${body}'::jsonb, timeout_milliseconds := 60000)`;
    const H = {
      none: `'{"Content-Type": "application/json"}'::jsonb`,
      anonOnly: `jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || ${VAULT("functions_anon_key")})`,
      wrongSecret: `jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || ${VAULT("functions_anon_key")}, 'x-cron-secret', 'wrong-secret')`,
      plan: `jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || ${VAULT("functions_anon_key")}, 'x-cron-secret', ${VAULT("cron_secret")})`,
    };
    async function viaNet(sql) {
      const id = (await q(sql))[0].http_post;
      for (let i = 0; i < 40; i++) { await sleep(1000); const r = await q(`select status_code, content from net._http_response where id = $1`, [id]); if (r.length) { let j = null; try { j = JSON.parse(r[0].content); } catch {} return { status: r[0].status_code, j }; } }
      return { status: "no response" };
    }
    await resetRuns();
    const n1 = await viaNet(CMD(H.none, "{}")), n2 = await viaNet(CMD(H.anonOnly, "{}")), n3 = await viaNet(CMD(H.wrongSecret, "{}"));
    ok("pg_net: no headers (today's production command) 401, JWT without secret 401, JWT + wrong secret 401", n1.status === 401 && n2.status === 401 && n3.status === 401, { s: [n1.status, n2.status, n3.status] });
    const n4 = await viaNet(CMD(H.plan, '{"dry_run": true}'));
    ok("pg_net with the planned headers (Vault) + dry_run → 200 would_send; 0 rows, 0 hits", n4.status === 200 && n4.j?.outcome === "would_send" && Object.keys(await deliveries()).length === 0 && Object.keys(await hits()).length === 0, { status: n4.status, outcome: n4.j?.outcome });
    const n5 = await viaNet(CMD(H.plan, "{}"));
    ok("pg_net with the planned headers, real run → 200 sent 3 (to the mock)", n5.status === 200 && n5.j?.sent === 3, { status: n5.status, ...pick(n5.j, "outcome", "sent") });

    // ---------- 9. pg_cron "succeeded" = the SQL ran and the HTTP request was queued, not that the function worked ----------
    await resetRuns();
    const before = Number((await q(`select coalesce(max(id), 0) m from net._http_response`))[0].m);
    const since = (await q(`select now() t`))[0].t;
    const jobW = (await q(`select cron.schedule('qa-vr-cron-wrong-secret', '* * * * *', $1) id`, [CMD(H.wrongSecret, "{}")]))[0].id;
    const jobD = (await q(`select cron.schedule('qa-vr-cron-dry-run', '* * * * *', $1) id`, [CMD(H.plan, '{"dry_run": true}')]))[0].id;
    let runs = [];
    for (let i = 0; i < 100 && runs.length < 2; i++) { await sleep(2000); runs = await q(`select jobid, status, return_message from cron.job_run_details where jobid = any($1) and start_time >= $2`, [[jobW, jobD], since]); }
    await q(`select cron.unschedule('qa-vr-cron-wrong-secret')`); await q(`select cron.unschedule('qa-vr-cron-dry-run')`);
    await sleep(8000);
    const resp = await q(`select status_code, content from net._http_response where id > $1 order by id`, [before]);
    const w = runs.find((r) => Number(r.jobid) === Number(jobW)), dr = runs.find((r) => Number(r.jobid) === Number(jobD));
    const statuses = resp.map((r) => r.status_code).sort();
    ok("cron run with a WRONG secret is still recorded 'succeeded' while the function answered 401",
      w?.status === "succeeded" && statuses.includes(401), { cron: w?.status, msg: w?.return_message, responses: statuses });
    ok("cron run with the planned headers (dry run) 'succeeded' and the function answered 200 would_send",
      dr?.status === "succeeded" && resp.some((r) => r.status_code === 200 && JSON.parse(r.content).outcome === "would_send"), { cron: dr?.status });
    const leftJobs = Number((await q(`select count(*) c from cron.job where jobname like 'qa-vr-%'`))[0].c);
    ok("temporary cron jobs removed; no cron job left on staging for the function", leftJobs === 0 && Number((await q(`select count(*) c from cron.job where command ilike '%send-push-notifications%'`))[0].c) === 0, { leftJobs });
  } catch (e) {
    ok("unexpected error in the test run", false, { error: String(e.message).slice(0, 200) });
  } finally {
    await q(`grant select on public.pets to service_role`).catch(() => {});
    await q(`select cron.unschedule(jobname) from cron.job where jobname like 'qa-vr-%'`).catch(() => {});
    await q(`delete from public.vaccine_reminder_deliveries where vaccine_id between 9900021 and 9900030`).catch(() => {});
    await cleanup().catch(() => {});
    for (const id of createdVault) await q(`delete from vault.secrets where id = $1`, [id]).catch(() => {});
    const vaultLeft = Number((await q(`select count(*) c from vault.secrets where id = any($1::uuid[])`, [createdVault]))[0].c);
    ok("temporary Vault secrets deleted (only the ones this run created)", vaultLeft === 0, { created: createdVault.length, left: vaultLeft });
    const leftover = Number((await q(`select (select count(*) from public.pets where id between 900021 and 900025) + (select count(*) from public.vaccines where id between 9900021 and 9900030)
      + (select count(*) from public.push_subscriptions) + (select count(*) from public.vaccine_reminder_deliveries) + (select count(*) from public.qa_push_mock_hits) c`))[0].c);
    ok("cleanup: synthetic pets / vaccines / subscriptions / send log / mock hits = 0", leftover === 0, { leftover });
    await db.end();
    console.log(`\nwindow ${started} → ${new Date().toISOString()}\n${pass} passed, ${fail} failed`); process.exitCode = fail ? 1 : 0;
  }
})();
