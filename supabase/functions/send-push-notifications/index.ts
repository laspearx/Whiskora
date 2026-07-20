// Supabase Edge Function: sends Web Push notifications for upcoming vaccine reminders.
// Triggered daily via pg_cron at 01:00 UTC (08:00 Thailand time).
// Requires Supabase secrets: VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_EMAIL

import { createClient } from "jsr:@supabase/supabase-js@2";
import webpush from "npm:web-push@3";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY")!;
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY")!;
const VAPID_EMAIL = Deno.env.get("VAPID_EMAIL") || "mailto:admin@whiskora.pet";

Deno.serve(async (req) => {
  if (req.method !== "POST" && req.method !== "GET") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dayAfter = new Date(today);
  dayAfter.setDate(dayAfter.getDate() + 2);

  // Find vaccines due today or tomorrow
  const { data: vaccines, error: vacErr } = await supabase
    .from("vaccines")
    .select("pet_id, vaccine_name, next_due, pets!inner(name, user_id)")
    .gte("next_due", today.toISOString().split("T")[0])
    .lt("next_due", dayAfter.toISOString().split("T")[0]);

  if (vacErr || !vaccines?.length) {
    return new Response(JSON.stringify({ sent: 0 }), { status: 200, headers: { "Content-Type": "application/json" } });
  }

  // Group by user_id
  const byUser: Record<string, Array<{ petName: string; vaccineName: string; dueDate: string }>> = {};
  for (const v of vaccines) {
    const pet = Array.isArray(v.pets) ? v.pets[0] : v.pets;
    if (!pet?.user_id) continue;
    const uid = pet.user_id as string;
    byUser[uid] = byUser[uid] || [];
    byUser[uid].push({
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

    const isToday = new Date(events[0].dueDate).toDateString() === today.toDateString();
    const title = isToday ? "วันนี้มีกำหนดฉีดวัคซีน" : "พรุ่งนี้มีกำหนดฉีดวัคซีน";
    const petList = events.map((e) => `${e.petName} (${e.vaccineName})`).join(", ");
    const body = petList.length > 60 ? petList.slice(0, 57) + "..." : petList;

    const payload = JSON.stringify({
      title,
      body,
      icon: "/mini-logo.png",
      tag: "vaccine-reminder",
      url: "/profile",
    });

    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payload,
      );
      sent++;
    } catch (err: any) {
      // 410 Gone = subscription expired, remove it
      if (err?.statusCode === 410) {
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
