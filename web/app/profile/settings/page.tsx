"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import PageLoader from "@/app/components/PageLoader";

const F = {
  ink: "#111827", inkSoft: "#4B5563", muted: "#9CA3AF",
  pink: "#E84677", pinkSoft: "#FDF2F5", pinkBorder: "#FBCFE8",
  line: "#F3F4F6", lineMid: "#E5E7EB", paper: "#FFFFFF", bg: "#fffafc",
  green: "#16A34A", greenSoft: "#F0FDF4",
  lineGreen: "#06C755", lineGreenSoft: "#E8FAF0",
};

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<"line" | "email" | null>(null);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push("/login?redirect=/profile/settings"); return; }
      setUser(session.user);

      const { data: prof } = await supabase
        .from("profiles")
        .select("notif_line, notif_email, email")
        .eq("id", session.user.id)
        .single();
      setProfile(prof);
      setLoading(false);
    };
    init();
  }, [router]);

  const toggle = useCallback(async (field: "notif_line" | "notif_email") => {
    if (!user || !profile || saving) return;
    const key = field === "notif_line" ? "line" : "email";
    setSaving(key as any);
    const next = !profile[field];
    const { error } = await supabase
      .from("profiles")
      .update({ [field]: next })
      .eq("id", user.id);
    if (!error) setProfile((p: any) => ({ ...p, [field]: next }));
    setSaving(null);
  }, [user, profile, saving]);

  const handleSignOut = async () => {
    setSigningOut(true);
    await supabase.auth.signOut();
    router.push("/");
  };

  if (loading) return <PageLoader />;

  const lineId: string | undefined = user?.user_metadata?.line_id;
  const email: string | undefined = profile?.email ?? user?.email;
  const hasRealEmail = !!email && !email.includes("@line.whiskora.internal");
  const hasAnyChannel = !!lineId || hasRealEmail;

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
        .ps-row-icon.line-green { background: ${F.lineGreenSoft}; color: ${F.lineGreen}; }
        .ps-row-icon.green { background: ${F.greenSoft}; color: ${F.green}; }
        .ps-row-icon svg { flex-shrink: 0; }
        .ps-row-text { flex: 1; min-width: 0; }
        .ps-row-title { display: block; font-size: 14px; font-weight: 600; color: ${F.ink}; }
        .ps-row-desc { display: block; font-size: 12px; color: ${F.muted}; margin-top: 1px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .ps-row-chevron { color: ${F.muted}; flex-shrink: 0; }
        .ps-row-chevron svg { display: block; }

        .ps-toggle { position: relative; width: 48px; height: 26px; flex-shrink: 0; }
        .ps-toggle input { opacity: 0; width: 0; height: 0; position: absolute; }
        .ps-toggle-track { position: absolute; inset: 0; border-radius: 13px; background: ${F.lineMid}; cursor: pointer; transition: background .2s; }
        .ps-toggle input:checked + .ps-toggle-track { background: ${F.pink}; }
        .ps-toggle-track::after { content: ''; position: absolute; width: 20px; height: 20px; border-radius: 50%; background: white; top: 3px; left: 3px; transition: transform .2s; box-shadow: 0 1px 4px rgba(0,0,0,.2); }
        .ps-toggle input:checked + .ps-toggle-track::after { transform: translateX(22px); }
        .ps-toggle input:disabled + .ps-toggle-track { opacity: .5; cursor: not-allowed; }

        .ps-notice { display: flex; gap: 12px; align-items: flex-start; background: #FFF7ED; border: 1px solid #FED7AA; border-radius: 14px; padding: 14px 16px; }
        .ps-notice-icon { width: 34px; height: 34px; border-radius: 10px; background: #FFEDD5; color: #EA580C; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .ps-notice-title { font-size: 13px; font-weight: 700; color: #9A3412; }
        .ps-notice-desc { font-size: 12px; color: #C2410C; margin-top: 3px; line-height: 1.6; }
        .ps-notice a { color: #EA580C; font-weight: 700; }

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

            {!hasAnyChannel ? (
              <div className="ps-notice">
                <div className="ps-notice-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                </div>
                <div>
                  <div className="ps-notice-title">ยังไม่มีช่องทางการแจ้งเตือน</div>
                  <div className="ps-notice-desc">
                    เชื่อม LINE หรือเพิ่มอีเมลก่อนเพื่อรับการแจ้งเตือน —{" "}
                    <Link href="/profile/connections">ตั้งค่าบัญชีที่เชื่อมต่อ</Link>
                  </div>
                </div>
              </div>
            ) : (
              <div className="ps-card">
                {lineId && (
                  <div className="ps-row">
                    <div className="ps-row-icon line-green">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/></svg>
                    </div>
                    <div className="ps-row-text">
                      <span className="ps-row-title">แจ้งเตือนผ่าน LINE</span>
                      <span className="ps-row-desc">{profile?.notif_line ? "เปิดอยู่ — รับข้อความจาก Whiskora Bot" : "ปิดอยู่"}</span>
                    </div>
                    <label className="ps-toggle" aria-label="เปิด/ปิดแจ้งเตือน LINE">
                      <input
                        type="checkbox"
                        checked={profile?.notif_line ?? true}
                        disabled={saving === "line"}
                        onChange={() => toggle("notif_line")}
                      />
                      <span className="ps-toggle-track" />
                    </label>
                  </div>
                )}

                {hasRealEmail && (
                  <div className="ps-row">
                    <div className="ps-row-icon green">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                    </div>
                    <div className="ps-row-text">
                      <span className="ps-row-title">แจ้งเตือนทาง Email</span>
                      <span className="ps-row-desc">{email}</span>
                    </div>
                    <label className="ps-toggle" aria-label="เปิด/ปิดแจ้งเตือน Email">
                      <input
                        type="checkbox"
                        checked={profile?.notif_email ?? true}
                        disabled={saving === "email"}
                        onChange={() => toggle("notif_email")}
                      />
                      <span className="ps-toggle-track" />
                    </label>
                  </div>
                )}
              </div>
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
