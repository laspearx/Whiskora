// Pure helpers for send-push-notifications (no Deno / network APIs, so they can be unit-tested with node).

const DAY_MS = 24 * 60 * 60 * 1000;
const BANGKOK_OFFSET_MS = 7 * 60 * 60 * 1000; // Asia/Bangkok = UTC+7, no DST

// วันที่ตามเวลาไทย (YYYY-MM-DD) ไม่พึ่ง timezone ของเครื่องที่รัน
export function bangkokDate(nowMs: number, offsetDays = 0): string {
  return new Date(nowMs + BANGKOK_OFFSET_MS + offsetDays * DAY_MS).toISOString().slice(0, 10);
}

export function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

// เทียบ secret แบบใช้เวลาคงที่ (ไม่รั่วความยาวส่วนที่ตรงกันผ่านเวลา)
export function timingSafeEqual(a: string, b: string): boolean {
  const enc = new TextEncoder();
  const x = enc.encode(a), y = enc.encode(b);
  let diff = x.length ^ y.length;
  for (let i = 0; i < Math.max(x.length, y.length); i++) diff |= (x[i] ?? 0) ^ (y[i] ?? 0);
  return diff === 0;
}

export type ReminderItem = { vaccineId: number; petId: number; petName: string; vaccineName: string; dueDate: string };

export function buildPayload(items: ReminderItem[], today: string, test = false): string {
  const dueToday = items.some((e) => e.dueDate === today);
  // test = QA run: the title says so, and its own tag never replaces a real reminder on the device
  const title = (test ? "[ทดสอบ] " : "") + (dueToday ? "วันนี้มีกำหนดฉีดวัคซีน" : "พรุ่งนี้มีกำหนดฉีดวัคซีน");
  const petList = items
    .map((e) => `${e.petName} (${e.vaccineName}${e.dueDate === today ? " วันนี้" : " พรุ่งนี้"})`)
    .join(", ");
  const body = petList.length > 80 ? petList.slice(0, 77) + "..." : petList;
  // ตัวเดียว → เปิดหน้าวัคซีนของตัวนั้น, หลายตัว → หน้ารวมวัคซีน
  const petIds = [...new Set(items.map((e) => e.petId))];
  const url = petIds.length === 1 ? `/pets/${petIds[0]}/vaccines` : "/pets/vaccines/all";
  // tag ตามวันที่: ถ้ามีการแจ้งเตือนเพิ่มในวันเดียวกัน อุปกรณ์จะแทนที่อันเดิม ไม่ซ้อนหลายอัน
  return JSON.stringify({ title, body, icon: "/mini-logo.png", tag: `${test ? "vaccine-reminder-test" : "vaccine-reminder"}-${today}`, url });
}

// --- push results -------------------------------------------------------------------------------------------
// clear:     the push service answered with a status (RFC 8030: anything but 2xx = not accepted) → 404/410 expired,
//            other statuses rejected; or we know nothing left this side (request could not be built, connect refused /
//            DNS / TLS) → not_delivered. Safe to release the claim; a later run may try again.
// uncertain: the request may have reached the push service but no answer came back (timeout, connection reset or
//            closed after sending, unknown errors). The claim is kept as 'uncertain' and NOT retried automatically.
export class PushNotSentError extends Error {
  reason: string;
  constructor(reason: string) { super(reason); this.name = "PushNotSentError"; this.reason = reason; }
}

const NOT_SENT_CODES = new Set([
  "ECONNREFUSED", "ENOTFOUND", "EAI_AGAIN", "EHOSTUNREACH", "ENETUNREACH",
  "CERT_HAS_EXPIRED", "DEPTH_ZERO_SELF_SIGNED_CERT", "SELF_SIGNED_CERT_IN_CHAIN", "UNABLE_TO_VERIFY_LEAF_SIGNATURE",
  "ERR_TLS_CERT_ALTNAME_INVALID",
]);

export type PushResult =
  | { kind: "expired"; label: string }
  | { kind: "rejected"; label: string }
  | { kind: "not_delivered"; label: string }
  | { kind: "uncertain"; label: string; errName?: string; errCode?: string | null };

// labels are fixed strings or numeric statuses only — never the error message (it can hold the endpoint)
export function classifyPushError(err: unknown): PushResult {
  if (err instanceof PushNotSentError) return { kind: "not_delivered", label: err.reason };
  const e = err as { statusCode?: unknown; code?: unknown; message?: unknown } | null;
  const status = e?.statusCode;
  if (typeof status === "number" && Number.isInteger(status) && status >= 100 && status <= 599) {
    if (status === 404 || status === 410) return { kind: "expired", label: String(status) };
    return { kind: "rejected", label: String(status) };
  }
  const code = typeof e?.code === "string" ? e.code : "";
  if (NOT_SENT_CODES.has(code)) return { kind: "not_delivered", label: "connect_failed" };
  const msg = typeof e?.message === "string" ? e.message : "";
  if (code === "ETIMEDOUT" || code === "ESOCKETTIMEDOUT" || /socket timeout|timed out/i.test(msg)) return { kind: "uncertain", label: "timeout" };
  if (code === "ECONNRESET" || code === "EPIPE" || /socket hang up|connection (reset|closed)/i.test(msg)) return { kind: "uncertain", label: "connection_lost" };
  // unknown: keep the error's type and code (both pattern-checked) so it can be identified later — never the message
  return { kind: "uncertain", label: "unknown", errName: safeErrorName(err), errCode: safeErrCode(code) };
}

// the request ran until our own timeout → treat an unrecognised error as a timeout (runtimes word it differently)
export function withElapsed(res: PushResult, elapsedMs: number, timeoutMs: number): PushResult {
  return res.kind === "uncertain" && res.label === "unknown" && elapsedMs >= timeoutMs * 0.95 ? { ...res, label: "timeout" } : res;
}

type WebPushLike = {
  generateRequestDetails: (sub: unknown, payload: string, options: object) => unknown;
  sendNotification: (sub: unknown, payload: string, options: object) => Promise<unknown>;
};
// Builds the request first (keys, payload encryption, VAPID): a failure there provably sent nothing.
export function makeSender(wp: WebPushLike, extraOptions: object = {}) {
  return async (sub: { endpoint: string; keys: { p256dh: string; auth: string } }, payload: string, options: { timeout: number }) => {
    const opts = { ...options, ...extraOptions };
    try { wp.generateRequestDetails(sub, payload, opts); } catch { throw new PushNotSentError("request_build_failed"); }
    return wp.sendNotification(sub, payload, opts);
  };
}

// --- log hygiene ----------------------------------------------------------------------------------------------
// Only SQLSTATE (5 chars) or PostgREST codes pass; anything else becomes "other". Messages are never logged.
export function safeCode(code: unknown): string | null {
  if (code == null || code === "") return null;
  return typeof code === "string" && /^(PGRST\d{3}|[0-9A-Z]{5})$/.test(code) ? code : "other";
}
export function safeErrCode(code: unknown): string | null {
  if (code == null || code === "") return null;
  return typeof code === "string" && /^[A-Z][A-Z0-9_]{1,40}$/.test(code) ? code : "other";
}
export function safeErrorName(e: unknown): string {
  const n = (e as { name?: unknown })?.name;
  return typeof n === "string" && /^[A-Za-z]{1,40}$/.test(n) ? n : typeof e;
}
