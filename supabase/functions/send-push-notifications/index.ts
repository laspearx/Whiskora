// Supabase Edge Function: sends Web Push notifications for vaccines due today or tomorrow (Asia/Bangkok).
// Triggered daily via pg_cron at 01:00 UTC (08:00 Thailand time). POST only.
// Secrets: CRON_SECRET (required — callers must send "x-cron-secret"; missing secret = 500, never open),
//          VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_EMAIL (required unless dry_run).
// Deploy WITH JWT verification (default; do not pass --no-verify-jwt): the gateway also needs a valid key.
// Body (optional JSON): {"dry_run": true} → read only, nothing sent or written; {"dry_run": true, "as_of": "<ISO>"}
// evaluates the window for another moment (dry run only).
//
// Reads are batched: vaccines in the window (paged), then their pets by id, then the owners' subscriptions —
// no PostgREST embed (vaccines.pet_id has no FK to pets). Vaccines whose pet no longer exists are skipped and
// counted only. Each (subscription, vaccine, next_due) is claimed in vaccine_reminder_deliveries before sending,
// so a retry does not re-send what a recipient already got. Logs and responses carry counts and status codes
// only — no names, user ids, endpoints or keys.

import { createClient } from "jsr:@supabase/supabase-js@2";
import webpush from "npm:web-push@3";
import { handleRequest } from "./handler.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

Deno.serve((req) => {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.error(JSON.stringify({ fn: "send-push-notifications", stage: "config", missing: ["SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY"] }));
    return new Response(JSON.stringify({ error: "misconfigured" }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
  return handleRequest(req, {
    db: createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } }),
    env: {
      CRON_SECRET: Deno.env.get("CRON_SECRET"),
      VAPID_PUBLIC_KEY: Deno.env.get("VAPID_PUBLIC_KEY"),
      VAPID_PRIVATE_KEY: Deno.env.get("VAPID_PRIVATE_KEY"),
      VAPID_EMAIL: Deno.env.get("VAPID_EMAIL") || "mailto:admin@whiskora.pet",
    },
    setVapidDetails: (email, pub, priv) => webpush.setVapidDetails(email, pub, priv),
    sendNotification: (sub, payload, options) => webpush.sendNotification(sub, payload, options),
    now: () => Date.now(),
  });
});
