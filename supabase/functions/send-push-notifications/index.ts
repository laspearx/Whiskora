// Supabase Edge Function: sends Web Push notifications for upcoming vaccine reminders.
// Triggered daily via pg_cron at 01:00 UTC (08:00 Thailand time).
// Requires Supabase secrets: VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_EMAIL
// Optional secret: CRON_SECRET — when set, callers must send "x-cron-secret: <value>"
// (the anon key alone is public, so without this anyone could trigger a send run).

import { createClient } from "jsr:@supabase/supabase-js@2";
import webpush from "npm:web-push@3";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY")!;
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY")!;
const VAPID_EMAIL = Deno.env.get("VAPID_EMAIL") || "mailto:admin@whiskora.pet";
const CRON_SECRET = Deno.env.get("CRON_SECRET");

// วันที่ตามเวลาไทย (Asia/Bangkok, UTC+7 ไม่มี DST) — ไม่พึ่ง timezone ของเครื่องที่รัน
function bangkokDate(offsetDays = 0): string {
  const d = new Date(Date.now() + 7 * 60 * 60 * 1000 + offsetDays * 24 * 60 * 60 * 1000);
  return d.toISOString().split("T")[0];
}

Deno.serve(async (req) => {
  if (req.method !== "POST" && req.method !== "GET") {
    return new Response("Method Not Allowed", { status: 405 });
  }
  if (CRON_SECRET && req.headers.get("x-cron-secret") !== CRON_SECRET) {
    return new Response("Unauthorized", { status: 401 });
  }

  webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  const todayStr = bangkokDate(0);
  const dayAfterStr = bangkokDate(2);

  // Find vaccines due today or tomorrow
  const { data: vaccines, error: vacErr } = await supabase
    .from("vaccines")
    .select("pet_id, vaccine_name, next_due, pets!inner(name, user_id)")
    .gte("next_due", todayStr)
    .lt("next_due", dayAfterStr);

  if (vacErr || !vaccines?.length) {
    return new Response(JSON.stringify({ sent: 0 }), { status: 200, headers: { "Content-Type": "application/json" } });
  }

  // Group by user_id
  const byUser: Record<string, Array<{ petId: number; petName: string; vaccineName: string; dueDate: string }>> = {};
  for (const v of vaccines) {
    const pet = Array.isArray(v.pets) ? v.pets[0] : v.pets;
    if (!pet?.user_id) continue;
    const uid = pet.user_id as string;
    byUser[uid] = byUser[uid] || [];
    byUser[uid].push({
      petId: v.pet_id,
      petName: pet.name || "สัตว์เลี้ยง",
      vaccineName: v.vaccine_name || "วัคซีน",
      dueDate: v.next_due,
    });
  }

  const userIds = Object.keys(byUser);
  if (!userIds.length) {
    return new Response(JSON.stringify({ sent: 0 }), { status: 200, headers: { "Content-Type": "application/json" } });
  }

  // Get push subscriptions for those users
  const { data: subs } = await supabase
    .from("push_subscriptions")
    .select("user_id, endpoint, p256dh, auth")
    .in("user_id", userIds);

  if (!subs?.length) {
    return new Response(JSON.stringify({ sent: 0 }), { status: 200, headers: { "Content-Type": "application/json" } });
  }

  let sent = 0;
  const failed: string[] = [];

  for (const sub of subs) {
    const events = byUser[sub.user_id];
    if (!events) continue;

    // ระบุวันต่อรายการ (เดิมดูจากรายการแรกอย่างเดียว ทำให้ชื่อเรื่องผิดเมื่อมีทั้งวันนี้และพรุ่งนี้)
    const dueToday = events.filter((e) => e.dueDate === todayStr);
    const title = dueToday.length > 0 ? "วันนี้มีกำหนดฉีดวัคซีน" : "พรุ่งนี้มีกำหนดฉีดวัคซีน";
    const petList = events
      .map((e) => `${e.petName} (${e.vaccineName}${e.dueDate === todayStr ? " วันนี้" : " พรุ่งนี้"})`)
      .join(", ");
    const body = petList.length > 80 ? petList.slice(0, 77) + "..." : petList;
    // ตัวเดียว → เปิดหน้าวัคซีนของตัวนั้น, หลายตัว → หน้ารวมวัคซีน
    const petIds = [...new Set(events.map((e) => e.petId))];
    const url = petIds.length === 1 ? `/pets/${petIds[0]}/vaccines` : "/pets/vaccines/all";

    const payload = JSON.stringify({
      title,
      body,
      icon: "/mini-logo.png",
      // tag ตามวันที่: ถ้า cron รันซ้ำในวันเดียวกัน อุปกรณ์จะแทนที่การแจ้งเตือนเดิม ไม่ซ้อนหลายอัน
      tag: `vaccine-reminder-${todayStr}`,
      url,
    });

    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payload,
      );
      sent++;
    } catch (err: any) {
      // 404/410 = subscription no longer exists on the push service, remove it
      if (err?.statusCode === 410 || err?.statusCode === 404) {
        failed.push(sub.endpoint);
      }
    }
  }

  // Clean up expired subscriptions
  if (failed.length) {
    await supabase.from("push_subscriptions").delete().in("endpoint", failed);
  }

  return new Response(JSON.stringify({ sent, expired: failed.length }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
