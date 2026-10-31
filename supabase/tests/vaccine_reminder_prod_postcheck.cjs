// PRODUCTION postcheck for the vaccine reminder rollout — DRY RUN ONLY, never a sending run.
// Every authenticated call carries {"dry_run": true}. Checks: rejections (direct HTTP and via pg_net with the
// cron-shaped headers), dry run 200 with counts, no send-log rows written, subscriptions unchanged, table RLS / ACL,
// cron job 1 still inactive. Reads CRON_SECRET from ~/.whiskora/prod_cron_secret (never printed).
// usage: NODE_PATH=<dir with pg> PROD_ANON_KEY=<production anon JWT> node supabase/tests/vaccine_reminder_prod_postcheck.cjs
const { Client } = require("pg"); const fs = require("fs"); const os = require("os");
const url = fs.readFileSync(os.homedir() + "/.whiskora/prod_db_url", "utf8").trim();
if (!url.includes("vhudldcizmbpujedojei")) { console.error("refusing: not production"); process.exit(2); }
const SECRET = fs.readFileSync(os.homedir() + "/.whiskora/prod_cron_secret", "utf8").trim();
const ANON = process.env.PROD_ANON_KEY; if (!ANON) { console.error("set PROD_ANON_KEY"); process.exit(2); }
const FN = "https://vhudldcizmbpujedojei.supabase.co/functions/v1/send-push-notifications";
let pass = 0, fail = 0;
const ok = (n, c, i = {}) => { c ? pass++ : fail++; console.log(`${c ? "PASS" : "FAIL"} ${n} :: ${JSON.stringify(i)}`); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const DRY = '{"dry_run": true}';

(async () => {
  const c = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } }); await c.connect();
  const q = async (sql, p = []) => (await c.query(sql, p)).rows;
  const started = new Date().toISOString();
  const state = async () => (await q(`select (select count(*)::int from public.vaccine_reminder_deliveries) deliveries,
    (select count(*)::int from public.push_subscriptions) subs, (select active from cron.job where jobid = 1) cron_active,
    (select schedule from cron.job where jobid = 1) schedule`))[0];
  const before = await state();
  ok("before: cron job 1 inactive, schedule 0 1 * * *, 0 send-log rows", before.cron_active === false && before.schedule === "0 1 * * *" && before.deliveries === 0, before);

  // direct HTTP
  const call = async (headers, body = DRY, method = "POST") => {
    const r = await fetch(FN, { method, headers: { "Content-Type": "application/json", ...headers }, body: method === "POST" ? body : undefined });
    let j = null; try { j = JSON.parse(await r.text()); } catch {} return { status: r.status, j };
  };
  const A = { Authorization: `Bearer ${ANON}` };
  const s = [await call({}), await call({ Authorization: "Bearer abc.def.ghi" }), await call(A), await call({ ...A, "x-cron-secret": "wrong" }), await call({ ...A, "x-cron-secret": SECRET }, undefined, "GET")].map((x) => x.status);
  ok("HTTP: no key 401, bad JWT 401, JWT without secret 401, wrong secret 401, GET 405", JSON.stringify(s) === "[401,401,401,401,405]", { s });
  const live = await call({ ...A, "x-cron-secret": SECRET }, '{"as_of":"2026-01-01T00:00:00Z"}');
  ok("as_of without dry_run → 400 (cannot be used to force a sending run with another date)", live.status === 400, { status: live.status });
  const d = await call({ ...A, "x-cron-secret": SECRET });
  ok("HTTP dry run with the secret → 200, dry_run true, attempted/sent 0 sends", d.status === 200 && d.j?.dry_run === true && d.j?.sent === 0, d.j);

  // via pg_net, headers from Vault exactly as cron job 1 builds them
  const V = (n) => `(select decrypted_secret from vault.decrypted_secrets where name = '${n}')`;
  const CMD = (h) => `select net.http_post(url := '${FN}', headers := ${h}, body := '${DRY}'::jsonb, timeout_milliseconds := 60000) id`;
  const H = {
    none: `'{"Content-Type": "application/json"}'::jsonb`,
    jwtOnly: `jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || ${V("functions_anon_key")})`,
    wrong: `jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || ${V("functions_anon_key")}, 'x-cron-secret', 'wrong')`,
    cron: `jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || ${V("functions_anon_key")}, 'x-cron-secret', ${V("cron_secret")})`,
  };
  const viaNet = async (h) => {
    const id = (await q(CMD(h)))[0].id;
    for (let i = 0; i < 40; i++) { await sleep(1000); const r = await q(`select status_code, content from net._http_response where id = $1`, [id]); if (r.length) { let j = null; try { j = JSON.parse(r[0].content); } catch {} return { id, status: r[0].status_code, j }; } }
    return { id, status: "no response" };
  };
  const n = [await viaNet(H.none), await viaNet(H.jwtOnly), await viaNet(H.wrong)];
  ok("pg_net: no headers 401, JWT only 401, wrong secret 401", n.every((x) => x.status === 401), { s: n.map((x) => x.status) });
  const nd = await viaNet(H.cron);
  ok("pg_net with the cron job's Vault headers + dry run → 200 (read from net._http_response)", nd.status === 200 && nd.j?.dry_run === true && nd.j?.sent === 0, { status: nd.status, body: nd.j });

  const after = await state();
  ok("after: 0 send-log rows written, subscriptions unchanged, cron job 1 still inactive", after.deliveries === 0 && after.subs === before.subs && after.cron_active === false, after);
  const acl = (await q(`select relrowsecurity rls, (select count(*)::int from pg_policies where tablename = 'vaccine_reminder_deliveries') policies,
    (select count(*)::int from information_schema.role_table_grants where table_schema = 'public' and table_name = 'vaccine_reminder_deliveries' and grantee in ('anon', 'authenticated', 'PUBLIC')) api_grants
    from pg_class where oid = 'public.vaccine_reminder_deliveries'::regclass`))[0];
  ok("send log table: RLS on, 0 policies, 0 grants to anon / authenticated", acl.rls === true && acl.policies === 0 && acl.api_grants === 0, acl);
  const api = await fetch("https://vhudldcizmbpujedojei.supabase.co/rest/v1/vaccine_reminder_deliveries?select=id&limit=1", { headers: { apikey: ANON, Authorization: `Bearer ${ANON}` } });
  ok("API (anon) cannot read the send log", api.status === 401 || api.status === 403, { status: api.status });
  await c.end();
  console.log(`\nwindow ${started} → ${new Date().toISOString()}\n${pass} passed, ${fail} failed`); process.exitCode = fail ? 1 : 0;
})().catch((e) => { console.log("ERROR", String(e.message).slice(0, 200)); process.exitCode = 2; });
