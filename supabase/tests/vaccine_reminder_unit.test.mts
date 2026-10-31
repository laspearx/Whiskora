// node --test supabase/tests/vaccine_reminder_unit.test.mts   (node ≥ 22.18 strips the types)
// Pure helpers of the vaccine reminder Edge Function: Bangkok dates around midnight, payload, push error classes.
import { test } from "node:test";
import assert from "node:assert/strict";
import { bangkokDate, buildPayload, chunk, classifyPushError, timingSafeEqual } from "../functions/send-push-notifications/reminders.ts";

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

test("push errors: 404/410 expired, others failed, no status = network", () => {
  assert.deepEqual(classifyPushError({ statusCode: 410 }), { kind: "expired", status: 410 });
  assert.deepEqual(classifyPushError({ statusCode: 404 }), { kind: "expired", status: 404 });
  assert.deepEqual(classifyPushError({ statusCode: 500 }), { kind: "failed", status: 500 });
  assert.deepEqual(classifyPushError({ statusCode: 429 }), { kind: "failed", status: 429 });
  assert.deepEqual(classifyPushError(new Error("ETIMEDOUT")), { kind: "failed", status: "network" });
});

test("chunk + constant-time compare", () => {
  assert.deepEqual(chunk([1, 2, 3, 4, 5], 2), [[1, 2], [3, 4], [5]]);
  assert.deepEqual(chunk([], 3), []);
  assert.equal(timingSafeEqual("abc", "abc"), true);
  assert.equal(timingSafeEqual("abc", "abd"), false);
  assert.equal(timingSafeEqual("abc", "abcd"), false);
  assert.equal(timingSafeEqual("", "x"), false);
});
