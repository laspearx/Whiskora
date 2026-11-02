// node --test supabase/tests/line_auth_unit.test.mts   (node ≥ 22.18 strips the types) — no network, no Supabase.
// H2: LINE login decisions + backfill planning.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { decideLine, placeholderEmail, withLineId } from "../../web/lib/lineAuth.ts";
import { plan } from "../scripts/line_identity_backfill.mjs";

const L = "U0123456789abcdef0123456789abcdef";
test("login: exactly one account with app_metadata.line_id → that account", () => {
  assert.deepEqual(decideLine({ lineUserId: L, mode: "login", linkUid: "", ids: ["u1"] }), { action: "login", userId: "u1" });
});
test("login: no account → create with the PLACEHOLDER email, never a LINE email", () => {
  const d = decideLine({ lineUserId: L, mode: "login", linkUid: "", ids: [] });
  assert.deepEqual(d, { action: "create", email: `line_${L}@line.whiskora.internal` });
  assert.equal(placeholderEmail(L), d.action === "create" ? d.email : "");
});
test("two accounts claim the LINE id → conflict, never a guess", () => {
  assert.deepEqual(decideLine({ lineUserId: L, mode: "login", linkUid: "", ids: ["u1", "u2"] }), { action: "error", code: "LINE_ACCOUNT_CONFLICT" });
  assert.deepEqual(decideLine({ lineUserId: L, mode: "link", linkUid: "u1", ids: ["u1", "u2"] }), { action: "error", code: "LINE_ACCOUNT_CONFLICT" });
});
test("link: free LINE id → link to the verified caller; owned by caller → already linked; owned by another → refused", () => {
  assert.deepEqual(decideLine({ lineUserId: L, mode: "link", linkUid: "me", ids: [] }), { action: "link", userId: "me" });
  assert.deepEqual(decideLine({ lineUserId: L, mode: "link", linkUid: "me", ids: ["me"] }), { action: "already_linked" });
  assert.deepEqual(decideLine({ lineUserId: L, mode: "link", linkUid: "me", ids: ["other"] }), { action: "error", code: "LINE_LINKED_TO_OTHER" });
});
test("link mode without a verified uid is refused (no silent fallback to login)", () => {
  assert.deepEqual(decideLine({ lineUserId: L, mode: "link", linkUid: "", ids: [] }), { action: "error", code: "LINE_LINK_UNAUTHORIZED" });
});
test("invalid LINE ids refused (missing, non-string, unsafe charset, too long)", () => {
  for (const v of [undefined, null, 42, "", "a b", "x@y", "U".repeat(129), "../x"]) assert.equal(decideLine({ lineUserId: v, mode: "login", linkUid: "", ids: [] }).action, "error", String(v));
});
test("withLineId keeps existing app_metadata keys", () => {
  assert.deepEqual(withLineId({ provider: "email", providers: ["email"] }, L), { provider: "email", providers: ["email"], line_id: L });
});
test("callback source: no email lookup, no user_metadata lookup, no listUsers, no id_token parsing", () => {
  const s = fs.readFileSync(new URL("../../web/app/api/auth/line/callback/route.ts", import.meta.url), "utf8");
  for (const bad of ["listUsers", "u.email ===", "user_metadata?.line_id", "id_token", "await tokenRes.text()", "await verifyRes.text()"]) assert.ok(!s.includes(bad), bad);
  assert.ok(s.includes("find_auth_user_by_line_id"));
  const r = fs.readFileSync(new URL("../../web/app/api/auth/line/route.ts", import.meta.url), "utf8");
  assert.ok(r.includes("scope: 'profile openid',") && !r.includes("openid email"));
});
test("backfill plan: copies unique legacy ids, skips already-set, reports conflicts, never writes conflicts", () => {
  const users = [
    { id: "a1", user_metadata: { line_id: "Uaaa" }, app_metadata: { provider: "email" } },     // write
    { id: "b1", user_metadata: { line_id: "Ubbb" }, app_metadata: {} },                        // conflict (also b2)
    { id: "b2", user_metadata: { line_id: "Ubbb" }, app_metadata: {} },
    { id: "c1", user_metadata: { line_id: "Uccc" }, app_metadata: { line_id: "Uccc" } },       // already
    { id: "d1", user_metadata: { line_id: "Uxxx" }, app_metadata: { line_id: "Uddd" } },       // conflict (differs)
    { id: "e1", user_metadata: {}, app_metadata: {} },                                          // nothing
    { id: "f1", user_metadata: { line_id: "bad id!" }, app_metadata: {} },                     // invalid
    { id: "g1", user_metadata: { line_id: "Uccc" }, app_metadata: {} },                         // conflict with c1's app_metadata
  ];
  const p = plan(users);
  assert.deepEqual(p.write.map((w) => [w.id, w.line_id]), [["a1", "Uaaa"]]);
  assert.equal(p.write[0].app_metadata.provider, "email");
  assert.equal(p.skipAlready, 1); assert.equal(p.invalid, 1);
  assert.deepEqual(p.conflicts.map((c) => c.id).sort(), ["b1", "b2", "d1", "g1"]);
});
