// node --test supabase/tests/line_auth_unit.test.mts   (node ≥ 22.18 strips the types) — no network, no Supabase.
// H2: LINE login decisions + backfill planning.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { decideLine, decideLegacy, placeholderEmail, withLineId } from "../../web/lib/lineAuth.ts";
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
test("legacy adoption: only a verified server-made account for exactly this LINE id", () => {
  const L2 = "Uvictim";
  assert.deepEqual(decideLegacy(L2, [{ user_id: "v", line_id: L2, class: "verified" }]), { action: "adopt", userId: "v" });
  // a forged claim (user_metadata on someone else's account) is unverified: neither adopted nor blocking
  assert.deepEqual(decideLegacy(L2, [{ user_id: "v", line_id: L2, class: "verified" }, { user_id: "attacker", line_id: L2, class: "unverified" }]), { action: "adopt", userId: "v" });
  assert.deepEqual(decideLegacy(L2, [{ user_id: "attacker", line_id: L2, class: "unverified" }]), { action: "create" });
  // a verified row for ANOTHER id is never adopted
  assert.deepEqual(decideLegacy(L2, [{ user_id: "x", line_id: "Uother", class: "verified" }]), { action: "create" });
  // conflicts / two verified holders block
  assert.deepEqual(decideLegacy(L2, [{ user_id: "a", line_id: L2, class: "conflict" }]), { action: "error", code: "LINE_ACCOUNT_CONFLICT" });
  assert.deepEqual(decideLegacy(L2, [{ user_id: "a", line_id: L2, class: "verified" }, { user_id: "b", line_id: L2, class: "verified" }]), { action: "error", code: "LINE_ACCOUNT_CONFLICT" });
  assert.deepEqual(decideLegacy(L2, []), { action: "create" });
});
test("backfill plan: writes ONLY verified rows; unverified / conflict / already never written", () => {
  const rows = [
    { user_id: "v1", line_id: "Uaaa", class: "verified", reason: "server-made LINE signup" },
    { user_id: "f1", line_id: "Uaaa", class: "unverified", reason: "claim only in user_metadata (user-writable)" }, // forged
    { user_id: "f2", line_id: "Ufree", class: "unverified", reason: "claim only in user_metadata (user-writable)" },
    { user_id: "p1", line_id: "Upw", class: "unverified", reason: "placeholder email with a password" },
    { user_id: "c1", line_id: "Udup", class: "conflict", reason: "LINE id held by more than one trusted account" },
    { user_id: "a1", line_id: "Uok", class: "already", reason: "app_metadata set" },
    { user_id: "x1", line_id: "bad id!", class: "verified", reason: "?" },                         // unsafe id → invalid
    { user_id: "d1", line_id: "Uzzz", class: "verified" }, { user_id: "d2", line_id: "Uzzz", class: "verified" }, // dup in report
  ];
  const p = plan(rows);
  assert.deepEqual(p.write, [{ id: "v1", line_id: "Uaaa" }]);
  assert.deepEqual(p.unverified.map((u) => u.id).sort(), ["f1", "f2", "p1"]);
  assert.deepEqual(p.conflicts.map((c) => c.id).sort(), ["c1", "d1", "d2"]);
  assert.equal(p.already, 1); assert.equal(p.invalid, 1);
});
test("backfill script source: reads the server evidence, never user_metadata", () => {
  const src = fs.readFileSync(new URL("../scripts/line_identity_backfill.mjs", import.meta.url), "utf8");
  assert.ok(src.includes("rpc('legacy_line_evidence')"));
  assert.ok(!/user_metadata\?*\.line_id/.test(src.replace(/^\/\/.*$/gm, "")), "no user_metadata.line_id read outside comments");
});
