"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import PageLoader from "@/app/components/PageLoader";
import {
  getNotifPermission,
  getOrCreateSubscription,
  getExistingSubscription,
  registerSW,
  type NotifPermission,
} from "@/lib/push-client";

const F = {
  ink: "#111827", inkSoft: "#4B5563", muted: "#9CA3AF",
  pink: "#E84677", pinkSoft: "#FDF2F5", pinkBorder: "#FBCFE8",
  line: "#F3F4F6", lineMid: "#E5E7EB", paper: "#FFFFFF", bg: "#FDF6F8",
};

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notifPerm, setNotifPerm] = useState<NotifPermission>("default");
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push("/login?redirect=/profile/settings"); return; }
      setUser(session.user);
      await registerSW();
      const perm = getNotifPermission();
      setNotifPerm(perm);
      if (perm === "granted") {
        const sub = await getExistingSubscription();
        if (sub) {
          const { count } = await supabase
            .from("push_subscriptions")
            .select("*", { count: "exact", head: true })
            .eq("user_id", session.user.id)
            .eq("endpoint", sub.endpoint);
          setPushEnabled((count ?? 0) > 0);
        }
      }
      setLoading(false);
    };
    init();
  }, [router]);

  const handleTogglePush = useCallback(async () => {
    if (!user || pushLoading) return;
    setPushLoading(true);
    try {
      if (pushEnabled) {
        // Turn off — unsubscribe + delete from DB
        const sub = await getExistingSubscription();
        if (sub) {
          await sub.unsubscribe();
          await supabase.from("push_subscriptions").delete()
            .eq("user_id", user.id)
            .eq("endpoint", sub.endpoint);
        }
        setPushEnabled(false);
      } else {
        // Turn on — request permission + subscribe
        const permission = await Notification.requestPermission();
        setNotifPerm(permission as NotifPermission);
        if (permission !== "granted") return;
        const sub = await getOrCreateSubscription();
        if (!sub) return;
        const json = sub.toJSON();
        await supabase.from("push_subscriptions").upsert({
          user_id: user.id,
          endpoint: json.endpoint!,
          p256dh: (json.keys as Record<string, string>).p256dh,
          auth: (json.keys as Record<string, string>).auth,
          updated_at: new Date().toISOString(),
        }, { onConflict: "endpoint" });
        setPushEnabled(true);
      }
    } catch (err) {
      console.error("Push toggle error:", err);
    } finally {
      setPushLoading(false);
    }
  }, [user, pushEnabled, pushLoading]);

  const handleSignOut = async () => {
    setSigningOut(true);
    await supabase.auth.signOut();
    router.push("/");
  };

  if (loading) return <PageLoader />;

  const pushBlocked = notifPerm === "denied";
  const pushUnsupported = notifPerm === "unsupported";

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        .ps-page { font-family: inherit; color: ${F.ink}; min-height: 100vh; }
        .ps-body { max-width: 600px; margin: 0 auto; padding: 24px 20px 100px; }

        .ps-header { display: flex; align-items: center; gap: 14px; margin-bottom: 28px; }
        .ps-back { display: inline-flex; align-items: center; justify-content: center; width: 40px; height: 40px; border-radius: 12px; background: white; color: #6B7280; cursor: pointer; border: 1px solid #E5E7EB; flex-shrink: 0; transition: all .18s; }
        .ps-back:hover { background: #F9FAFB; color: ${F.ink}; transform: translateX(-1px); }
        .ps-back svg { flex-shrink: 0; }
        .ps-title { font-size: 24px; font-weight: 700; color: ${F.ink}; letter-spacing: -0.4px; }
        .ps-sub { font-size: 12px; font-weight: 600; color: ${F.muted}; margin-top: 2px; }

        .ps-section { margin-bottom: 20px; }
        .ps-section-label { font-size: 11px; font-weight: 700; color: ${F.muted}; letter-spacing: .07em; text-transform: uppercase; margin-bottom: 8px; padding-left: 4px; }

        .ps-card { background: white; border: 1px solid ${F.lineMid}; border-radius: 18px; overflow: hidden; }
        .ps-row { display: flex; align-items: center; gap: 14px; padding: 15px 18px; border-bottom: 1px solid ${F.line}; }
        .ps-row:last-child { border-bottom: none; }
        .ps-row-link { text-decoration: none; color: inherit; transition: background .15s; }
        .ps-row-link:hover { background: #FAFAFA; }
        .ps-row-icon { width: 38px; height: 38px; border-radius: 11px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .ps-row-icon.pink { background: ${F.pinkSoft}; color: ${F.pink}; }
        .ps-row-icon.gray { background: ${F.line}; color: ${F.inkSoft}; }
        .ps-row-icon.red { background: #FEF2F2; color: #EF4444; }
        .ps-row-icon.green { background: #F0FDF4; color: #16A34A; }
        .ps-row-icon svg { flex-shrink: 0; }
        .ps-row-text { flex: 1; min-width: 0; }
        .ps-row-title { display: block; font-size: 14px; font-weight: 600; color: ${F.ink}; }
        .ps-row-desc { display: block; font-size: 12px; color: ${F.muted}; margin-top: 1px; }
        .ps-row-desc.warn { color: #D97706; }
        .ps-row-chevron { color: ${F.muted}; flex-shrink: 0; }
        .ps-row-chevron svg { display: block; }

        /* Toggle */
        .ps-toggle { position: relative; width: 48px; height: 26px; flex-shrink: 0; }
        .ps-toggle input { opacity: 0; width: 0; height: 0; position: absolute; }
        .ps-toggle-track { position: absolute; inset: 0; border-radius: 13px; background: ${F.lineMid}; cursor: pointer; transition: background .2s; }
        .ps-toggle input:checked + .ps-toggle-track { background: ${F.pink}; }
        .ps-toggle-track::after { content: ''; position: absolute; width: 20px; height: 20px; border-radius: 50%; background: white; top: 3px; left: 3px; transition: transform .2s; box-shadow: 0 1px 4px rgba(0,0,0,.2); }
        .ps-toggle input:checked + .ps-toggle-track::after { transform: translateX(22px); }
        .ps-toggle input:disabled + .ps-toggle-track { opacity: .5; cursor: not-allowed; }

        /* Sign out */
        .ps-signout-btn { width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px; padding: 14px; background: white; border: 1.5px solid #FECACA; border-radius: 14px; color: #EF4444; font-size: 14px; font-weight: 700; font-family: inherit; cursor: pointer; transition: all .18s; margin-top: 8px; }
        .ps-signout-btn:hover { background: #FEF2F2; }
        .ps-signout-btn:disabled { opacity: .5; cursor: not-allowed; }
      `}</style>

      <div className="ps-page">
        <div className="ps-body">

          {/* Header */}
          <div className="ps-header">
            <button className="ps-back" onClick={() => router.push('/profile')} type="button" aria-label="ย้อนกลับ">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            </button>
            <div>
              <div className="ps-title">ตั้งค่า</div>
              <div className="ps-sub">จัดการบัญชีและการแจ้งเตือน</div>
            </div>
          </div>

          {/* Notifications */}
          <div className="ps-section">
            <div className="ps-section-label">การแจ้งเตือน</div>
            <div className="ps-card">
              <div className="ps-row">
                <div className={`ps-row-icon ${pushEnabled ? "pink" : "gray"}`}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    {pushEnabled
                      ? <><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></>
                      : <><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/><line x1="2" y1="2" x2="22" y2="22"/></>
                    }
                  </svg>
                </div>
                <div className="ps-row-text">
                  <span className="ps-row-title">การแจ้งเตือน Push</span>
                  {pushBlocked
                    ? <span className="ps-row-desc warn">ถูกบล็อกในเบราว์เซอร์ — แก้ที่ไอคอนแม่กุญแจใน address bar</span>
                    : pushUnsupported
                    ? <span className="ps-row-desc">เบราว์เซอร์นี้ไม่รองรับการแจ้งเตือน</span>
                    : <span className="ps-row-desc">{pushEnabled ? "รับการแจ้งเตือนจาก Whiskora" : "ไม่ได้รับการแจ้งเตือน"}</span>
                  }
                </div>
                {!pushBlocked && !pushUnsupported && (
                  <label className="ps-toggle" aria-label="เปิด/ปิดการแจ้งเตือน">
                    <input
                      type="checkbox"
                      checked={pushEnabled}
                      disabled={pushLoading}
                      onChange={handleTogglePush}
                    />
                    <span className="ps-toggle-track" />
                  </label>
                )}
              </div>

              <div className="ps-row" style={{ opacity: pushEnabled ? 1 : 0.45 }}>
                <div className="ps-row-icon green">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 2 4 4"/><path d="m17 7 3-3"/><path d="M19 9 8.7 19.3c-1 1-2.5 1-3.4 0l-.6-.6c-1-1-1-2.5 0-3.4L15 5"/><path d="m9 11 4 4"/><path d="m5 19-3 3"/><path d="m14 4 6 6"/></svg>
                </div>
                <div className="ps-row-text">
                  <span className="ps-row-title">เตือนวัคซีนล่วงหน้า 1 วัน</span>
                  <span className="ps-row-desc">แจ้งเตือนทุกเช้า 8:00 น.</span>
                </div>
                <label className="ps-toggle" aria-label="เตือนวัคซีน">
                  <input
                    type="checkbox"
                    checked={pushEnabled}
                    disabled={!pushEnabled || pushLoading}
                    onChange={handleTogglePush}
                  />
                  <span className="ps-toggle-track" />
                </label>
              </div>
            </div>

            {pushBlocked && (
              <p style={{ fontSize: 12, color: "#D97706", marginTop: 8, paddingLeft: 4, lineHeight: 1.6 }}>
                วิธีปลดบล็อก: กดไอคอนแม่กุญแจ (🔒) ใน address bar → Notifications → Allow
              </p>
            )}
          </div>

          {/* Account */}
          <div className="ps-section">
            <div className="ps-section-label">บัญชี</div>
            <div className="ps-card">
              <Link href="/profile/edit" className="ps-row ps-row-link">
                <div className="ps-row-icon gray">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                </div>
                <div className="ps-row-text">
                  <span className="ps-row-title">แก้ไขข้อมูลส่วนตัว</span>
                  <span className="ps-row-desc">ชื่อ, รูปโปรไฟล์, เบอร์โทร</span>
                </div>
                <span className="ps-row-chevron">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                </span>
              </Link>
              <Link href="/profile/connections" className="ps-row ps-row-link">
                <div className="ps-row-icon gray">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                </div>
                <div className="ps-row-text">
                  <span className="ps-row-title">บัญชีที่เชื่อมต่อ</span>
                  <span className="ps-row-desc">LINE, Google และอื่นๆ</span>
                </div>
                <span className="ps-row-chevron">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                </span>
              </Link>
            </div>
          </div>

          {/* Sign out */}
          <button
            type="button"
            className="ps-signout-btn"
            onClick={handleSignOut}
            disabled={signingOut}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            {signingOut ? "กำลังออกจากระบบ..." : "ออกจากระบบ"}
          </button>

        </div>
      </div>
    </>
  );
}
