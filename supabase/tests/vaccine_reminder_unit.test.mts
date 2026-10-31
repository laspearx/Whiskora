// node --test supabase/tests/vaccine_reminder_unit.test.mts   (node ≥ 22.18 strips the types)
// Pure helpers of the vaccine reminder Edge Function: Bangkok dates around midnight, payload, push error classes.
import { test } from "node:test";
import assert from "node:assert/strict";
import { bangkokDate, buildPayload, chunk, classifyPushError, makeSender, PushNotSentError, safeCode, safeErrorName, timingSafeEqual } from "../functions/send-push-notifications/reminders.ts";

test("Bangkok date flips at 17:00 UTC, not at UTC midnight", () => {
  assert.equal(bangkokDate(Date.parse("2026-10-31T16:59:59Z")), "2026-10-31"); // 23:59:59 BKK
  assert.equal(bangkokDate(Date.parse("2026-10-31T17:00:00Z")), "2026-11-01"); // 00:00 BKK
  assert.equal(bangkokDate(Date.parse("2026-10-31T01:00:00Z")), "2026-10-31"); // cron 08:00 BKK
  assert.equal(bangkokDate(Date.parse("2026-10-30T23:30:00Z")), "2026-10-31"); // 06:30 BKK, UTC still the 30th
  assert.equal(bangkokDate(Date.parse("2026-12-31T17:00:00Z"), 1), "2027-01-02"); // year end + offset
  assert.equal(bangkokDate(Date.parse("2028-02-28T17:00:00Z"), 1), "2028-03-01"); // leap year
});

test("payload: title by any item due today, per-item day label, single pet → its page, tag per date", () => {
  const a = { vaccineId: 1, petId: 7, petName: "Mali", vaccineName: "Rabies", dueDate: "2026-11-01" };
  const b = { vaccineId: 2, petId: 7, petName: "Mali", vaccineName: "FVRCP", dueDate: "2026-10-31" };
  const p1 = JSON.parse(buildPayload([a], "2026-10-31"));
  assert.equal(p1.title, "พรุ่งนี้มีกำหนดฉีดวัคซีน"); assert.equal(p1.url, "/pets/7/vaccines"); assert.equal(p1.tag, "vaccine-reminder-2026-10-31");
  assert.match(p1.body, /Rabies พรุ่งนี้/);
  const p2 = JSON.parse(buildPayload([a, b], "2026-10-31"));
  assert.equal(p2.title, "วันนี้มีกำหนดฉีดวัคซีน"); assert.match(p2.body, /FVRCP วันนี้/);
  const p3 = JSON.parse(buildPayload([a, { ...b, petId: 8 }], "2026-10-31"));
  assert.equal(p3.url, "/pets/vaccines/all");
  const long = JSON.parse(buildPayload(Array.from({ length: 10 }, (_, i) => ({ ...a, vaccineId: i, petName: "P" + i })), "2026-10-31"));
  assert.ok(long.body.length <= 80 && long.body.endsWith("..."));
});

test("push results: an answer from the push service or a provable non-send is clear; no answer is uncertain", () => {
  assert.deepEqual(classifyPushError({ statusCode: 410 }), { kind: "expired", label: "410" });
  assert.deepEqual(classifyPushError({ statusCode: 404 }), { kind: "expired", label: "404" });
  assert.deepEqual(classifyPushError({ statusCode: 500 }), { kind: "rejected", label: "500" });
  assert.deepEqual(classifyPushError({ statusCode: 429 }), { kind: "rejected", label: "429" });
  assert.deepEqual(classifyPushError({ statusCode: 400 }), { kind: "rejected", label: "400" });
  assert.deepEqual(classifyPushError(new PushNotSentError("request_build_failed")), { kind: "not_delivered", label: "request_build_failed" });
  assert.deepEqual(classifyPushError(Object.assign(new Error("connect"), { code: "ECONNREFUSED" })), { kind: "not_delivered", label: "connect_failed" });
  assert.deepEqual(classifyPushError(Object.assign(new Error("dns"), { code: "ENOTFOUND" })), { kind: "not_delivered", label: "connect_failed" });
  assert.deepEqual(classifyPushError(new Error("Socket timeout")), { kind: "uncertain", label: "timeout" });       // web-push timeout
  assert.deepEqual(classifyPushError(Object.assign(new Error("x"), { code: "ETIMEDOUT" })), { kind: "uncertain", label: "timeout" });
  assert.deepEqual(classifyPushError(Object.assign(new Error("socket hang up"), { code: "ECONNRESET" })), { kind: "uncertain", label: "connection_lost" });
  assert.deepEqual(classifyPushError(new Error("something else")), { kind: "uncertain", label: "unknown" });
  assert.deepEqual(classifyPushError(null), { kind: "uncertain", label: "unknown" });
  assert.deepEqual(classifyPushError({ statusCode: "500" }), { kind: "uncertain", label: "unknown" });          // not a real status
  // labels never carry the message
  const r = classifyPushError(Object.assign(new Error("https://push.example/SECRET-ENDPOINT"), { code: "ECONNRESET" }));
  assert.ok(!JSON.stringify(r).includes("SECRET"));
});

test("makeSender: a request that cannot be built (bad keys) is reported as not sent, nothing goes out", async () => {
  let sent = 0;
  const wp = { generateRequestDetails: () => { throw new Error("p256dh should be 65 bytes SECRET"); }, sendNotification: async () => { sent++; } };
  await assert.rejects(makeSender(wp)({ endpoint: "https://x", keys: { p256dh: "a", auth: "b" } }, "{}", { timeout: 1 }), (e: unknown) => e instanceof PushNotSentError && (e as PushNotSentError).reason === "request_build_failed");
  assert.equal(sent, 0);
  const seen: object[] = [];
  const ok = { generateRequestDetails: (_s: unknown, _p: string, o: object) => { seen.push(o); }, sendNotification: async (_s: unknown, _p: string, o: object) => { seen.push(o); } };
  await makeSender(ok, { agent: "A" })({ endpoint: "https://x", keys: { p256dh: "a", auth: "b" } }, "{}", { timeout: 5 });
  assert.deepEqual(seen, [{ timeout: 5, agent: "A" }, { timeout: 5, agent: "A" }]);
});

test("log hygiene: only real codes / plain error names pass", () => {
  assert.equal(safeCode("42501"), "42501");
  assert.equal(safeCode("PGRST200"), "PGRST200");
  assert.equal(safeCode("XX000"), "XX000");
  assert.equal(safeCode(null), null);
  assert.equal(safeCode("Key (endpoint)=(https://secret)"), "other");
  assert.equal(safeCode("user@example.com"), "other");
  assert.equal(safeCode(42501), "other");
  assert.equal(safeErrorName(new TypeError("secret")), "TypeError");
  assert.equal(safeErrorName({ name: "https://secret.example" }), "object");
  assert.equal(safeErrorName("plain string with secret"), "string");
});

test("chunk + constant-time compare", () => {
  assert.deepEqual(chunk([1, 2, 3, 4, 5], 2), [[1, 2], [3, 4], [5]]);
  assert.deepEqual(chunk([], 3), []);
  assert.equal(timingSafeEqual("abc", "abc"), true);
  assert.equal(timingSafeEqual("abc", "abd"), false);
  assert.equal(timingSafeEqual("abc", "abcd"), false);
  assert.equal(timingSafeEqual("", "x"), false);
});
