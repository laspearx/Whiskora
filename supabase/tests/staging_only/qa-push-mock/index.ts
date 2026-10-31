// whiskora-staging ONLY — mock Web Push endpoint for testing send-push-notifications end to end.
// Never deploy to production (refuses to run there). Deployed with verify_jwt off because a push service request
// carries "Authorization: vapid …", not a Supabase JWT. It only answers tags present in qa_push_mock_modes (else 404,
// nothing recorded), records size + whether the body was aes128gcm and VAPID-signed (never the payload), then
// answers per mode: ok 201, fail500, fail429, gone410, hang (no answer for 20 s → the sender times out).
import { createClient } from "jsr:@supabase/supabase-js@2";

const URL_ = Deno.env.get("SUPABASE_URL") ?? "";
const db = createClient(URL_, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "", { auth: { persistSession: false } });

Deno.serve(async (req) => {
  if (!URL_.includes("wpxcukrwmegwzfccbbga")) return new Response(null, { status: 404 });
  const tag = new URL(req.url).pathname.split("/").pop() ?? "";
  if (req.method !== "POST" || !/^QAVR-[A-Z0-9]{1,8}$/.test(tag)) return new Response(null, { status: 404 });
  const { data } = await db.from("qa_push_mock_modes").select("mode").eq("tag", tag).maybeSingle();
  if (!data) return new Response(null, { status: 404 });
  const body = new Uint8Array(await req.arrayBuffer());
  await db.from("qa_push_mock_hits").insert({
    tag, bytes: body.length,
    aes128gcm: req.headers.get("content-encoding") === "aes128gcm",
    vapid: (req.headers.get("authorization") ?? "").startsWith("vapid t="),
  });
  if (data.mode === "hang") { await new Promise((r) => setTimeout(r, 20_000)); return new Response(null, { status: 201 }); }
  const status = { ok: 201, fail500: 500, fail429: 429, gone410: 410 }[data.mode as string] ?? 500;
  return new Response(null, { status });
});
