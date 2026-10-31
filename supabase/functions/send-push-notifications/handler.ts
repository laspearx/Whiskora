// Request handling for send-push-notifications, free of Deno globals so tests can inject the database client,
// the push sender, the environment and the clock. See index.ts for the contract.

import type { SupabaseClient } from "jsr:@supabase/supabase-js@2";
import {
  bangkokDate, buildPayload, chunk, classifyPushError, safeCode, safeErrorName, timingSafeEqual, withElapsed, type ReminderItem,
} from "./reminders.ts";

export type PushSubscriptionKeys = { endpoint: string; keys: { p256dh: string; auth: string } };
export type Deps = {
  db: SupabaseClient;
  env: { CRON_SECRET?: string; VAPID_PUBLIC_KEY?: string; VAPID_PRIVATE_KEY?: string; VAPID_EMAIL: string };
  setVapidDetails: (email: string, publicKey: string, privateKey: string) => void;
  sendNotification: (sub: PushSubscriptionKeys, payload: string, options: { timeout: number }) => Promise<unknown>;
  now: () => number;
};

const PAGE = 1000;         // PostgREST max rows per request
const IN_CHUNK = 200;      // ids per .in() filter (keeps the URL short)
const SEND_CONCURRENCY = 10;
const PUSH_TIMEOUT_MS = 10_000;
const STUCK_AFTER_MS = 15 * 60 * 1000;

class StageError extends Error {
  stage: string;
  code: string | null;
  constructor(stage: string, code: string | null) { super(stage); this.stage = stage; this.code = code; }
}

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

function log(level: "info" | "error", event: Record<string, unknown>) {
  const line = JSON.stringify({ fn: "send-push-notifications", ...event });
  level === "error" ? console.error(line) : console.log(line);
}

// PostgREST error → StageError. Logged: our stage name + a sanitised code. Never the message / details / hint
// (PostgreSQL puts values there, e.g. "Key (endpoint)=(…)").
function check<T>(stage: string, res: { data: T | null; error: { code?: unknown } | null }): T {
  if (res.error) {
    const code = safeCode(res.error.code);
    log("error", { stage, code });
    throw new StageError(stage, code);
  }
  return res.data as T;
}

type Vaccine = { id: number; pet_id: number | null; vaccine_name: string | null; next_due: string };
type Pet = { id: number; name: string | null; user_id: string | null };
type Sub = { id: string; user_id: string; endpoint: string; p256dh: string; auth: string };
type Delivery = { id: number; subscription_id: string; vaccine_id: number; next_due: string; status: string; claimed_at: string };

async function dueVaccines(db: SupabaseClient, from: string, to: string): Promise<Vaccine[]> {
  const out: Vaccine[] = [];
  // page until an empty page: stays correct even if the project's max_rows is lower than PAGE
  for (let offset = 0; ; ) {
    const rows = check<Vaccine[]>("vaccines", await db.from("vaccines")
      .select("id, pet_id, vaccine_name, next_due")
      .gte("next_due", from).lt("next_due", to)
      .order("id").range(offset, offset + PAGE - 1));
    if (!rows.length) return out;
    out.push(...rows); offset += rows.length;
  }
}

async function byIdChunks<T>(stage: string, ids: (string | number)[], fetch: (part: (string | number)[], offset: number) => PromiseLike<{ data: T[] | null; error: any }>): Promise<T[]> {
  const out: T[] = [];
  for (const part of chunk(ids, IN_CHUNK)) {
    for (let offset = 0; ; ) {
      const rows = check<T[]>(stage, await fetch(part, offset));
      if (!rows.length) break;
      out.push(...rows); offset += rows.length;
    }
  }
  return out;
}

// qaUserId: QA run limited to ONE account — only that user's items are kept, the run is refused unless that user has
// exactly one subscription, and the notification is marked as a test. It can only narrow who receives.
async function run(deps: Deps, nowMs: number, dryRun: boolean, qaUserId: string | null = null) {
  const db = deps.db;
  const today = bangkokDate(nowMs, 0), tomorrow = bangkokDate(nowMs, 1), dayAfter = bangkokDate(nowMs, 2);
  const r = {
    outcome: "", dry_run: dryRun, qa_single_user: qaUserId !== null, date: today, window: [today, tomorrow],
    due: 0, orphan_skipped: 0, no_owner_skipped: 0, recipients: 0, recipients_without_subscription: 0,
    subscriptions: 0, already_sent_skipped: 0, stuck_claims: 0, uncertain_claims: 0,
    attempted: 0, sent: 0, failed: 0, uncertain: 0, expired_removed: 0,
    failed_status: {} as Record<string, number>, uncertain_reason: {} as Record<string, number>,
  };

  // 1. vaccines due today / tomorrow (Bangkok)
  const vaccines = await dueVaccines(db, today, dayAfter);
  r.due = vaccines.length;
  if (!vaccines.length) return { ...r, outcome: "no_due" };

  // 2. their pets, by id (service role; pets that no longer exist are simply absent)
  const petIds = [...new Set(vaccines.map((v) => v.pet_id).filter((id): id is number => id != null))];
  const pets = new Map((await byIdChunks<Pet>("pets", petIds, (part, offset) =>
    db.from("pets").select("id, name, user_id").in("id", part).order("id").range(offset, offset + PAGE - 1)))
    .map((p) => [p.id, p]));

  const byUser = new Map<string, ReminderItem[]>();
  for (const v of vaccines) {
    const pet = v.pet_id == null ? undefined : pets.get(v.pet_id);
    if (!pet) { r.orphan_skipped++; continue; }          // vaccine row points to a pet that does not exist
    if (!pet.user_id) { r.no_owner_skipped++; continue; }
    const items = byUser.get(pet.user_id) ?? [];
    items.push({ vaccineId: v.id, petId: pet.id, petName: pet.name || "สัตว์เลี้ยง", vaccineName: v.vaccine_name || "วัคซีน", dueDate: v.next_due });
    byUser.set(pet.user_id, items);
  }
  if (qaUserId !== null) for (const uid of [...byUser.keys()]) if (uid !== qaUserId) byUser.delete(uid);
  r.recipients = byUser.size;
  if (!byUser.size) return { ...r, outcome: "no_recipients" };

  // 3. the owners' push subscriptions
  const subs = await byIdChunks<Sub>("push_subscriptions", [...byUser.keys()], (part, offset) =>
    db.from("push_subscriptions").select("id, user_id, endpoint, p256dh, auth").in("user_id", part)
      .order("id").range(offset, offset + PAGE - 1));
  r.subscriptions = subs.length;
  if (qaUserId !== null && subs.length !== 1) return { ...r, outcome: "qa_guard_failed" };   // 0 or several devices
  r.recipients_without_subscription = [...byUser.keys()].filter((u) => !subs.some((s) => s.user_id === u)).length;
  if (!subs.length) return { ...r, outcome: "no_subscriptions" };

  // 4. what each subscription already has (sent, or claimed by another / an earlier run)
  const existing = await byIdChunks<Delivery>("deliveries_read", subs.map((s) => s.id), (part, offset) =>
    db.from("vaccine_reminder_deliveries").select("id, subscription_id, vaccine_id, next_due, status, claimed_at")
      .in("subscription_id", part).gte("next_due", today).order("id").range(offset, offset + PAGE - 1));
  const taken = new Set(existing.map((d) => `${d.subscription_id}|${d.vaccine_id}|${d.next_due}`));
  // 'sending' older than 15 min = crashed between claim and record; 'uncertain' = no answer from the push service.
  // Both stay taken (never re-sent automatically) and are reported for a person to look at.
  r.stuck_claims = existing.filter((d) => d.status === "sending" && nowMs - Date.parse(d.claimed_at) > STUCK_AFTER_MS).length;
  r.uncertain_claims = existing.filter((d) => d.status === "uncertain").length;

  const wanted: { sub: Sub; items: ReminderItem[] }[] = [];
  for (const sub of subs) {
    const items = byUser.get(sub.user_id) ?? [];
    const fresh = items.filter((i) => !taken.has(`${sub.id}|${i.vaccineId}|${i.dueDate}`));
    r.already_sent_skipped += items.length - fresh.length;
    if (fresh.length) wanted.push({ sub, items: fresh });
  }
  if (!wanted.length) return { ...r, outcome: "already_sent" };
  if (dryRun) {
    return { ...r, attempted: wanted.length, outcome: "would_send" };
  }

  // 5. claim before sending; only rows this run inserted are sent (a concurrent run gets nothing back for them)
  const claimRows = wanted.flatMap(({ sub, items }) => items.map((i) => ({
    subscription_id: sub.id, vaccine_id: i.vaccineId, next_due: i.dueDate, reminder_date: today, status: "sending",
  })));
  const claimed: Delivery[] = [];
  for (const part of chunk(claimRows, 500)) {
    claimed.push(...check<Delivery[]>("deliveries_claim", await db.from("vaccine_reminder_deliveries")
      .upsert(part, { onConflict: "subscription_id,vaccine_id,next_due", ignoreDuplicates: true })
      .select("id, subscription_id, vaccine_id, next_due, status, claimed_at")));
  }
  const claimIds = new Map(claimed.map((d) => [`${d.subscription_id}|${d.vaccine_id}|${d.next_due}`, d.id]));
  const jobs = wanted
    .map(({ sub, items }) => {
      const mine = items.filter((i) => claimIds.has(`${sub.id}|${i.vaccineId}|${i.dueDate}`));
      r.already_sent_skipped += items.length - mine.length;
      return { sub, items: mine, ids: mine.map((i) => claimIds.get(`${sub.id}|${i.vaccineId}|${i.dueDate}`)!) };
    })
    .filter((j) => j.items.length);

  // 6. send (bounded concurrency, timeout per push)
  const sentIds: number[] = [], releaseIds: number[] = [], uncertainIds: number[] = [], expiredSubs: string[] = [];
  for (const batch of chunk(jobs, SEND_CONCURRENCY)) {
    await Promise.all(batch.map(async (job) => {
      r.attempted++;
      const t0 = deps.now();
      try {
        await deps.sendNotification(
          { endpoint: job.sub.endpoint, keys: { p256dh: job.sub.p256dh, auth: job.sub.auth } },
          buildPayload(job.items, today, qaUserId !== null),
          { timeout: PUSH_TIMEOUT_MS },
        );
        r.sent++; sentIds.push(...job.ids);
      } catch (err) {
        const res = withElapsed(classifyPushError(err), deps.now() - t0, PUSH_TIMEOUT_MS);
        if (res.kind === "expired") { r.expired_removed++; expiredSubs.push(job.sub.id); return; }
        if (res.kind === "uncertain") {
          r.uncertain++; uncertainIds.push(...job.ids);
          r.uncertain_reason[res.label] = (r.uncertain_reason[res.label] ?? 0) + 1;
          // unrecognised error (also when read as a timeout by elapsed time): its type + code, never the message
          if (res.errName !== undefined) log("error", { stage: "push_unrecognised_error", label: res.label, error: res.errName, code: res.errCode });
          return;
        }
        r.failed++; releaseIds.push(...job.ids);       // rejected by the push service, or provably not sent
        r.failed_status[res.label] = (r.failed_status[res.label] ?? 0) + 1;
      }
    }));
  }
  if (r.failed || r.uncertain) {
    log("error", { stage: "push", attempted: r.attempted, failed: r.failed, failed_status: r.failed_status, uncertain: r.uncertain, uncertain_reason: r.uncertain_reason });
  }

  // 7. record: sent → 'sent'; clear failure → claim released (a later run may send it); uncertain → 'uncertain'
  //    (kept, not retried); expired → subscription removed (its rows cascade)
  for (const part of chunk(sentIds, IN_CHUNK)) {
    check("deliveries_mark_sent", await db.from("vaccine_reminder_deliveries")
      .update({ status: "sent", sent_at: new Date().toISOString() }).in("id", part));
  }
  for (const part of chunk(uncertainIds, IN_CHUNK)) {
    check("deliveries_mark_uncertain", await db.from("vaccine_reminder_deliveries").update({ status: "uncertain" }).in("id", part));
  }
  for (const part of chunk(releaseIds, IN_CHUNK)) {
    check("deliveries_release", await db.from("vaccine_reminder_deliveries").delete().in("id", part));
  }
  for (const part of chunk(expiredSubs, IN_CHUNK)) {
    check("subscriptions_expire", await db.from("push_subscriptions").delete().in("id", part));
  }

  const problems = r.failed + r.uncertain;
  const outcome = !jobs.length ? "already_sent"
    : problems === 0 ? "sent"
    : r.sent + r.expired_removed > 0 ? "partial_failure"
    : r.failed === 0 ? "uncertain" : "failed";
  return { ...r, outcome };
}

export async function handleRequest(req: Request, deps: Deps): Promise<Response> {
  const { CRON_SECRET, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_EMAIL } = deps.env;
  if (req.method !== "POST") return json(405, { error: "method_not_allowed" });
  if (!CRON_SECRET) {
    log("error", { stage: "config", missing: ["CRON_SECRET"] });
    return json(500, { error: "misconfigured" });
  }
  if (!timingSafeEqual(req.headers.get("x-cron-secret") ?? "", CRON_SECRET)) {
    return json(401, { error: "unauthorized" });
  }

  let body: { dry_run?: unknown; as_of?: unknown; qa_only_user_id?: unknown } = {};
  try { const text = await req.text(); body = text.trim() ? JSON.parse(text) : {}; } catch { return json(400, { error: "invalid_json" }); }
  const dryRun = body.dry_run === true;
  let qaUserId: string | null = null;
  if (body.qa_only_user_id !== undefined) {
    if (typeof body.qa_only_user_id !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(body.qa_only_user_id)) {
      return json(400, { error: "invalid_qa_only_user_id" });
    }
    qaUserId = body.qa_only_user_id;
  }
  let nowMs = deps.now();
  if (body.as_of !== undefined) {
    if (!dryRun) return json(400, { error: "as_of_requires_dry_run" });
    nowMs = Date.parse(String(body.as_of));
    if (Number.isNaN(nowMs)) return json(400, { error: "invalid_as_of" });
  }

  if (!dryRun) {
    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
      log("error", { stage: "config", missing: [!VAPID_PUBLIC_KEY && "VAPID_PUBLIC_KEY", !VAPID_PRIVATE_KEY && "VAPID_PRIVATE_KEY"].filter(Boolean) });
      return json(500, { error: "misconfigured" });
    }
    try { deps.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY); }
    catch { log("error", { stage: "config", message: "invalid VAPID details" }); return json(500, { error: "misconfigured" }); }
  }

  try {
    const result = await run(deps, nowMs, dryRun, qaUserId);
    if (result.outcome === "qa_guard_failed") { log("error", { stage: "qa_guard", subscriptions: result.subscriptions }); return json(409, result); }
    const problem = result.failed > 0 || result.uncertain > 0;
    log(problem ? "error" : "info", { summary: result });
    // any failed / uncertain push → 502 so pg_net shows a non-2xx; a later run skips what was sent or is uncertain
    return json(problem ? 502 : 200, result);
  } catch (e) {
    if (e instanceof StageError) return json(500, { error: "query_failed", stage: e.stage, code: e.code });
    log("error", { stage: "unexpected", error: safeErrorName(e) });   // the name only, never the message
    return json(500, { error: "internal_error" });
  }
}
