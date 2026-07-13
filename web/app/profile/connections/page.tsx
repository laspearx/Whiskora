"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { UserIdentity } from "@supabase/supabase-js";

const F = {
  ink: '#111827', inkSoft: '#4B5563', muted: '#9CA3AF',
  pink: '#E84677', pinkSoft: '#FDF2F5',
  line: '#F3F4F6', lineMid: '#E5E7EB', paper: '#FFFFFF',
  green: '#06C755', greenDark: '#05b34d', greenSoft: '#f0fdf4',
};

const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const LineIcon = () => (
  <svg width="20" height="20" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M40 20.5C40 13.044 32.837 7 24 7S8 13.044 8 20.5c0 6.71 5.948 12.327 13.981 13.396.545.117 1.287.359 1.474.825.169.424.11 1.089.054 1.518l-.238 1.426c-.073.424-.334 1.659 1.454.904C26.726 37.576 40 29.977 40 20.5z" fill="white"/>
    <path d="M34.5 23.5h-4v-6h-1v7h5v-1zM22.5 17.5h-1v7h1v-7zM29.667 17.5h-1.084L26.5 21.29V17.5h-1v7h1v-3.79l2.083 3.79h1.084L27.333 21l2.334-3.5zM21.5 17.5h-4v7h4v-1h-3v-2h3v-1h-3v-2h3v-1z" fill="#06C755"/>
  </svg>
);

const PROVIDERS: { id: 'google' | 'line-login'; name: string; Icon: () => React.ReactElement; bg: string; color: string; iconBg: string }[] = [
  { id: 'google',     name: 'Google', Icon: GoogleIcon, bg: F.paper, color: F.inkSoft, iconBg: '#F8F9FA' },
  { id: 'line-login', name: 'LINE',   Icon: LineIcon,   bg: F.green,  color: '#fff',   iconBg: F.greenDark },
];

export default function ConnectionsPage() {
  const router = useRouter();
  const [identities, setIdentities] = useState<UserIdentity[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [unlinked, setUnlinked] = useState<string | null>(null);

  const refreshIdentities = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setIdentities(user?.identities ?? []);
  };

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push(`/login?redirect=${encodeURIComponent('/profile/connections')}`); return; }
      await refreshIdentities();
      setLoading(false);
    };
    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === 'USER_UPDATED') await refreshIdentities();
    });
    return () => subscription.unsubscribe();
  }, [router]);

  const handleLink = async (provider: 'google' | 'line-login') => {
    setError("");
    setUnlinked(null);
    setActionLoading(provider);
    const { error } = await supabase.auth.linkIdentity({
      provider: provider as any,
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent('/profile/connections')}`,
      },
    });
    if (error) {
      if (error.message.includes('identity_already_exists') || error.message.includes('already linked')) {
        setError('บัญชีนี้เชื่อมต่อกับผู้ใช้ Whiskora คนอื่นอยู่แล้ว');
      } else if (error.message.includes('manual_linking_disabled')) {
        setError('ฟีเจอร์นี้ยังไม่เปิดใช้งาน กรุณาติดต่อทีมงาน');
      } else {
        setError(error.message);
      }
      setActionLoading(null);
    }
    // no error = OAuth redirect เกิดขึ้นอัตโนมัติ
  };

  const handleUnlink = async (provider: string) => {
    setError("");
    setUnlinked(null);
    const identity = identities.find(i => i.provider === provider);
    if (!identity) return;
    const socialCount = identities.filter(i => i.provider !== 'email').length;
    if (socialCount <= 1 && !identities.some(i => i.provider === 'email')) {
      setError('ไม่สามารถยกเลิกได้ เนื่องจากเป็นช่องทางเข้าสู่ระบบเพียงช่องทางเดียว');
      return;
    }
    setActionLoading(provider);
    const { error } = await supabase.auth.unlinkIdentity(identity);
    if (error) {
      setError(error.message);
    } else {
      await refreshIdentities();
      setUnlinked(provider);
    }
    setActionLoading(null);
  };

  const isLinked = (provider: string) => identities.some(i => i.provider === provider);
  const getIdentityEmail = (provider: string) => {
    const id = identities.find(i => i.provider === provider);
    return id?.identity_data?.email as string | undefined;
  };
  const hasEmailAuth = identities.some(i => i.provider === 'email');
  const canUnlink = (provider: string) => {
    const linkedSocials = identities.filter(i => i.provider !== 'email');
    return hasEmailAuth || linkedSocials.length > 1;
  };

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        .cn-page { font-family: inherit; min-height: 100vh; color: ${F.ink}; }
        .cn-body { max-width: 600px; margin: 0 auto; padding: 24px 20px 60px; }
        .cn-header { display: flex; align-items: center; gap: 14px; margin-bottom: 28px; }
        .cn-back { display: inline-flex; align-items: center; justify-content: center; width: 40px; height: 40px; border-radius: 12px; background: white; color: #6B7280; cursor: pointer; border: 1px solid ${F.lineMid}; box-shadow: 0 1px 2px rgba(0,0,0,0.05); transition: all .18s; flex-shrink: 0; text-decoration: none; }
        .cn-back:hover { background: #F9FAFB; color: ${F.ink}; transform: translateX(-1px); }
        .cn-title { font-size: 24px; font-weight: 700; color: ${F.ink}; letter-spacing: -0.4px; }
        .cn-sub { font-size: 12px; font-weight: 600; color: ${F.muted}; margin-top: 2px; }
        .cn-card { background: white; border: 1px solid ${F.line}; border-radius: 20px; overflow: hidden; }
        .cn-row { display: flex; align-items: center; gap: 14px; padding: 18px 20px; border-bottom: 1px solid ${F.line}; }
        .cn-row:last-child { border-bottom: none; }
        .cn-icon-wrap { width: 44px; height: 44px; border-radius: 14px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .cn-info { flex: 1; min-width: 0; }
        .cn-provider-name { font-size: 15px; font-weight: 700; color: ${F.ink}; }
        .cn-provider-email { font-size: 12px; font-weight: 500; color: ${F.muted}; margin-top: 1px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .cn-badge { display: inline-flex; align-items: center; gap: 4px; padding: 3px 8px; border-radius: 20px; font-size: 11px; font-weight: 700; }
        .cn-badge-on { background: #DCFCE7; color: #16a34a; }
        .cn-badge-off { background: ${F.line}; color: ${F.muted}; }
        .cn-btn { padding: 9px 16px; border-radius: 12px; font-size: 13px; font-weight: 700; border: none; cursor: pointer; transition: all .18s; font-family: inherit; white-space: nowrap; }
        .cn-btn-link { background: ${F.pinkSoft}; color: ${F.pink}; }
        .cn-btn-link:hover { background: #FCE7EF; }
        .cn-btn-unlink { background: ${F.line}; color: ${F.inkSoft}; }
        .cn-btn-unlink:hover { background: #FEE2E2; color: #DC2626; }
        .cn-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .cn-alert { margin-top: 16px; padding: 13px 16px; border-radius: 14px; font-size: 13px; font-weight: 600; }
        .cn-alert-err { background: #FEF2F2; color: #DC2626; border: 1px solid #FECACA; }
        .cn-alert-ok  { background: #F0FDF4; color: #16a34a; border: 1px solid #BBF7D0; }
        .cn-note { margin-top: 20px; padding: 14px 16px; background: #FFFBEB; border: 1px solid #FDE68A; border-radius: 14px; font-size: 12px; font-weight: 500; color: #92400E; line-height: 1.6; }
        .cn-loading { min-height: 60vh; display: flex; align-items: center; justify-content: center; }
        .cn-spinner { width: 32px; height: 32px; border-radius: 50%; border: 3px solid #FBCFE8; border-top-color: ${F.pink}; animation: cnspin 1s linear infinite; }
        @keyframes cnspin { to { transform: rotate(360deg); } }
      `}</style>

      <div className="cn-page">
        <div className="cn-body">
          <div className="cn-header">
            <Link href="/profile/edit" className="cn-back" aria-label="ย้อนกลับ">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="m15 18-6-6 6-6"/>
              </svg>
            </Link>
            <div>
              <h1 className="cn-title">บัญชีที่เชื่อมต่อ</h1>
              <p className="cn-sub">เข้าสู่ระบบจากช่องทางไหนก็ได้</p>
            </div>
          </div>

          {loading ? (
            <div className="cn-loading"><div className="cn-spinner" /></div>
          ) : (
            <>
              <div className="cn-card">
                {PROVIDERS.map(({ id, name, Icon, bg, iconBg }) => {
                  const linked = isLinked(id);
                  const email = getIdentityEmail(id);
                  const busy = actionLoading === id;
                  return (
                    <div key={id} className="cn-row">
                      <div className="cn-icon-wrap" style={{ background: linked ? (id === 'line-login' ? F.green : '#F8F9FA') : F.line }}>
                        <Icon />
                      </div>
                      <div className="cn-info">
                        <div className="cn-provider-name">{name}</div>
                        {linked && email && <div className="cn-provider-email">{email}</div>}
                        {!linked && <div className="cn-provider-email">ยังไม่ได้เชื่อมต่อ</div>}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                        <span className={`cn-badge ${linked ? 'cn-badge-on' : 'cn-badge-off'}`}>
                          {linked ? (
                            <>
                              <svg width="9" height="9" viewBox="0 0 12 12" fill="none"><polyline points="2 6 5 9 10 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                              เชื่อมแล้ว
                            </>
                          ) : 'ยังไม่เชื่อม'}
                        </span>
                        {linked ? (
                          <button
                            className="cn-btn cn-btn-unlink"
                            onClick={() => handleUnlink(id)}
                            disabled={busy || !canUnlink(id)}
                            title={!canUnlink(id) ? 'ไม่สามารถยกเลิกช่องทางเดียวที่มีได้' : undefined}
                          >
                            {busy ? '...' : 'ยกเลิก'}
                          </button>
                        ) : (
                          <button
                            className="cn-btn cn-btn-link"
                            onClick={() => handleLink(id)}
                            disabled={!!actionLoading}
                          >
                            {busy ? '...' : 'เชื่อมต่อ'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {error && <div className="cn-alert cn-alert-err">{error}</div>}
              {unlinked && <div className="cn-alert cn-alert-ok">ยกเลิกการเชื่อมต่อ {unlinked} สำเร็จ</div>}

              <div className="cn-note">
                หากมีช่องทางเชื่อมต่อเพียงช่องเดียว จะไม่สามารถยกเลิกได้ เพื่อป้องกันการสูญหายของบัญชี
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
