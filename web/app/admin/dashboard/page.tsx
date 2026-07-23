"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import PageLoader from '@/app/components/PageLoader';

const F = {
  ink: '#111827', inkSoft: '#4B5563', muted: '#9CA3AF',
  pink: '#E84677', pinkSoft: '#FDF2F5', pinkBorder: '#FBCFE8',
  green: '#16A34A', greenSoft: '#F0FDF4', greenBorder: '#BBF7D0',
  blue: '#2563EB', blueSoft: '#EFF6FF', blueBorder: '#BFDBFE',
  purple: '#7C3AED', purpleSoft: '#F3E8FF',
  amber: '#D97706', amberSoft: '#FFFBEB',
  red: '#DC2626', redSoft: '#FEF2F2',
  line: '#F3F4F6', lineMid: '#E5E7EB', paper: '#FFFFFF', bg: '#F9FAFB',
};

const Icon = {
  ArrowLeft: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>,
  ChevronDown: () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>,
  ChevronUp: () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6"/></svg>,
};

// ── ไอคอนช่องทางสมัคร: โลโก้จริงของแต่ละผู้ให้บริการ (เหมือนหน้า profile/connections) ──
const ProviderIcon = {
  google: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  ),
  line: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path fill="#06C755" d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/>
    </svg>
  ),
  email: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={F.muted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
  ),
};

const PROVIDER_LABEL: Record<string, string> = { google: 'Google', line: 'LINE', email: 'อีเมล' };

interface UserRow {
  id: string;
  full_name: string | null;
  username: string | null;
  email: string | null;
  avatar_url: string | null;
  created_at: string;
  signupProvider: string;
  petCount: number;
  farmCount: number;
  shopCount: number;
  serviceCount: number;
  petNames: string[];
  farmNames: string[];
  shopNames: string[];
  serviceNames: string[];
}

const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString('th-TH', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

export default function AdminDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalPets, setTotalPets] = useState(0);
  const [totalFarms, setTotalFarms] = useState(0);
  const [totalShops, setTotalShops] = useState(0);
  const [totalServices, setTotalServices] = useState(0);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/login'); return; }
      const { data: prof } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();
      if (!prof || prof.role !== 'admin') { router.push('/'); return; }

      const [statsRes, usersRes] = await Promise.all([
        supabase.rpc('admin_get_stats'),
        supabase.rpc('admin_get_users'),
      ]);

      const stats = statsRes.data || {};
      setTotalUsers(stats.users || 0);
      setTotalPets(stats.pets || 0);
      setTotalFarms(stats.farms || 0);
      setTotalShops(stats.shops || 0);
      setTotalServices(stats.services || 0);

      const rows: UserRow[] = (usersRes.data || []).map((u: any) => ({
        id:             u.id,
        full_name:      u.full_name,
        username:       u.username,
        email:          u.email,
        avatar_url:     u.avatar_url,
        created_at:     u.created_at,
        signupProvider: u.signup_provider || 'email',
        petCount:       u.pet_count || 0,
        farmCount:      u.farm_count || 0,
        shopCount:      u.shop_count || 0,
        serviceCount:   u.service_count || 0,
        petNames:       u.pet_names || [],
        farmNames:      u.farm_names || [],
        shopNames:      u.shop_names || [],
        serviceNames:   u.service_names || [],
      }));

      setUsers(rows);
      setLoading(false);
    };
    load();
  }, [router]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return users;
    return users.filter(u =>
      u.full_name?.toLowerCase().includes(q) ||
      u.username?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.farmNames.some(n => n.toLowerCase().includes(q)) ||
      u.shopNames.some(n => n.toLowerCase().includes(q)) ||
      u.serviceNames.some(n => n.toLowerCase().includes(q)) ||
      u.petNames.some(n => n.toLowerCase().includes(q))
    );
  }, [users, search]);

  if (loading) return <PageLoader />;

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        .ad-page { font-family: inherit; min-height: 100vh; background: ${F.bg}; color: ${F.ink}; }
        .ad-body { max-width: 860px; margin: 0 auto; padding: 24px 16px 80px; }

        .ad-top { display: flex; align-items: center; gap: 14px; margin-bottom: 24px; }
        .ad-back { display: inline-flex; align-items: center; justify-content: center; width: 40px; height: 40px; border-radius: 12px; background: white; color: #6B7280; cursor: pointer; border: 1px solid ${F.lineMid}; box-shadow: 0 1px 2px rgba(0,0,0,0.05); transition: all .18s; flex-shrink: 0; }
        .ad-back:hover { background: ${F.line}; color: ${F.ink}; transform: translateX(-1px); }
        .ad-title { font-size: 22px; font-weight: 700; color: ${F.ink}; }
        .ad-sub { font-size: 12px; color: ${F.muted}; margin-top: 2px; }

        /* Stats grid */
        .ad-stats { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 24px; }
        @media (min-width: 520px) { .ad-stats { grid-template-columns: repeat(3, 1fr); } }
        @media (min-width: 720px) { .ad-stats { grid-template-columns: repeat(5, 1fr); } }
        .ad-stat { background: white; border: 1px solid ${F.lineMid}; border-radius: 16px; padding: 16px 14px 14px; display: flex; flex-direction: column; align-items: center; gap: 8px; }
        .ad-stat-icon { width: 48px; height: 48px; border-radius: 14px; display: flex; align-items: center; justify-content: center; }
        .ad-stat-icon img { width: 30px; height: 30px; object-fit: contain; }
        .ad-stat-num { font-size: 28px; font-weight: 800; line-height: 1; }
        .ad-stat-label { font-size: 11px; font-weight: 600; color: ${F.muted}; text-align: center; line-height: 1.3; }

        /* Section head */
        .ad-sec-head { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 14px; }
        .ad-sec-title { font-size: 15px; font-weight: 700; color: ${F.ink}; }
        .ad-count-chip { font-size: 11px; font-weight: 700; padding: 2px 9px; border-radius: 999px; background: ${F.pinkSoft}; color: ${F.pink}; }

        /* Search */
        .ad-search { position: relative; margin-bottom: 14px; }
        .ad-search-icon { position: absolute; left: 13px; top: 50%; transform: translateY(-50%); color: ${F.muted}; pointer-events: none; }
        .ad-search input { width: 100%; padding: 10px 14px 10px 38px; border: 1px solid ${F.lineMid}; border-radius: 12px; font-size: 14px; font-family: inherit; background: white; color: ${F.ink}; outline: none; transition: border-color .15s; }
        .ad-search input:focus { border-color: ${F.pink}; }

        /* User cards */
        .ad-user-card { background: white; border: 1px solid ${F.lineMid}; border-radius: 14px; margin-bottom: 8px; overflow: hidden; transition: border-color .15s; }
        .ad-user-card:hover { border-color: #D1D5DB; }
        .ad-user-head { display: flex; align-items: center; gap: 12px; padding: 14px 16px; cursor: pointer; flex-wrap: wrap; }
        .ad-avatar { width: 42px; height: 42px; border-radius: 50%; object-fit: cover; background: ${F.line}; flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-size: 16px; font-weight: 700; color: ${F.muted}; }
        .ad-avatar img { width: 100%; height: 100%; object-fit: cover; border-radius: 50%; }
        .ad-user-info { flex: 1; min-width: 120px; }
        .ad-user-name { font-size: 14px; font-weight: 700; color: ${F.ink}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .ad-user-meta { display: flex; align-items: center; gap: 5px; }
        .ad-user-email { font-size: 11px; color: ${F.muted}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .ad-provider-badge { display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; width: 16px; height: 16px; }
        .ad-user-badges { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; flex-shrink: 0; }
        .ad-badge { display: inline-flex; align-items: center; gap: 3px; padding: 3px 8px; border-radius: 7px; font-size: 10px; font-weight: 700; white-space: nowrap; }
        .ad-badge-date { font-size: 10px; font-weight: 500; color: ${F.muted}; white-space: nowrap; flex-shrink: 0; }
        .ad-chevron { color: ${F.muted}; flex-shrink: 0; margin-left: 4px; }

        /* Expanded detail */
        .ad-user-detail { border-top: 1px solid ${F.line}; padding: 14px 16px; background: #FAFAFA; display: grid; gap: 12px; }
        .ad-detail-row { display: flex; flex-direction: column; gap: 4px; }
        .ad-detail-label { font-size: 10px; font-weight: 700; color: ${F.muted}; text-transform: uppercase; letter-spacing: 0.06em; }
        .ad-detail-items { display: flex; flex-wrap: wrap; gap: 6px; }
        .ad-detail-item { font-size: 12px; font-weight: 600; padding: 4px 10px; border-radius: 8px; }
        .ad-no-content { font-size: 12px; color: ${F.muted}; font-style: italic; }
        .ad-provider-row { display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 600; color: ${F.inkSoft}; }

        /* Empty */
        .ad-empty { text-align: center; padding: 48px 20px; color: ${F.muted}; font-size: 14px; }
      `}</style>

      <div className="ad-page">
        <div className="ad-body">

          {/* Header */}
          <div className="ad-top">
            <button className="ad-back" onClick={() => router.back()}><Icon.ArrowLeft /></button>
            <div>
              <div className="ad-title">แดชบอร์ดหลังบ้าน</div>
              <div className="ad-sub">ข้อมูลผู้ใช้งานและพาร์ทเนอร์ทั้งหมด</div>
            </div>
          </div>

          {/* Stats */}
          <div className="ad-stats">
            {[
              { icon: '/icons/icon-nav-profile.png', num: totalUsers,    label: 'ผู้ใช้งาน\nทั้งหมด',   color: F.blue,    bg: F.blueSoft },
              { icon: '/icons/icon-my-pets.png',      num: totalPets,     label: 'สัตว์เลี้ยง\nในระบบ',   color: F.pink,    bg: F.pinkSoft },
              { icon: '/icons/icon-farm.png',         num: totalFarms,    label: 'ฟาร์ม',                  color: F.green,   bg: F.greenSoft },
              { icon: '/icons/icon-shop.png',         num: totalShops,    label: 'ร้านค้า',                color: F.amber,   bg: F.amberSoft },
              { icon: '/icons/icon-service.png',      num: totalServices, label: 'บริการ',               color: F.purple,  bg: F.purpleSoft },
            ].map((s, i) => (
              <div key={i} className="ad-stat">
                <div className="ad-stat-icon" style={{ background: s.bg }}><img src={s.icon} alt="" /></div>
                <div className="ad-stat-num" style={{ color: s.color }}>{s.num.toLocaleString()}</div>
                <div className="ad-stat-label" style={{ whiteSpace: 'pre-line' }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* User list */}
          <div className="ad-sec-head">
            <span className="ad-sec-title">รายชื่อผู้ใช้งาน</span>
            <span className="ad-count-chip">{filtered.length} คน</span>
          </div>

          <div className="ad-search">
            <span className="ad-search-icon">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            </span>
            <input
              type="text"
              placeholder="ค้นหาชื่อ, อีเมล, ชื่อฟาร์ม, ชื่อสัตว์..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {filtered.length === 0 ? (
            <div className="ad-empty">ไม่พบผู้ใช้ที่ตรงกับคำค้นหา</div>
          ) : (
            filtered.map(u => {
              const name = u.full_name || u.username || u.email?.split('@')[0] || 'ไม่ระบุชื่อ';
              const initial = name[0]?.toUpperCase() || '?';
              const isOpen = expandedUser === u.id;
              const bizCount = u.farmCount + u.shopCount + u.serviceCount;
              const ProviderIconComp = ProviderIcon[u.signupProvider as keyof typeof ProviderIcon] || ProviderIcon.email;

              return (
                <div key={u.id} className="ad-user-card">
                  <div className="ad-user-head" onClick={() => setExpandedUser(isOpen ? null : u.id)}>
                    {/* Avatar */}
                    <div className="ad-avatar">
                      {u.avatar_url
                        ? <img src={u.avatar_url} alt={name} />
                        : initial}
                    </div>

                    {/* Info */}
                    <div className="ad-user-info">
                      <div className="ad-user-name">{name}</div>
                      <div className="ad-user-meta">
                        <span className="ad-provider-badge" title={`สมัครผ่าน ${PROVIDER_LABEL[u.signupProvider] || u.signupProvider}`}><ProviderIconComp /></span>
                        <span className="ad-user-email">{u.email || '—'}</span>
                      </div>
                    </div>

                    {/* Badges */}
                    <div className="ad-user-badges">
                      {u.petCount > 0 && (
                        <span className="ad-badge" style={{ background: F.pinkSoft, color: F.pink }}>
                          {u.petCount} สัตว์
                        </span>
                      )}
                      {bizCount > 0 && (
                        <span className="ad-badge" style={{ background: F.blueSoft, color: F.blue }}>
                          {bizCount} ธุรกิจ
                        </span>
                      )}
                      <span className="ad-badge-date">{u.created_at ? fmtDateTime(u.created_at) : '—'}</span>
                    </div>

                    <div className="ad-chevron">{isOpen ? <Icon.ChevronUp /> : <Icon.ChevronDown />}</div>
                  </div>

                  {isOpen && (
                    <div className="ad-user-detail">
                      <div className="ad-detail-row">
                        <div className="ad-detail-label">สมัครสมาชิก</div>
                        <div className="ad-provider-row">
                          <ProviderIconComp />
                          {u.created_at ? fmtDateTime(u.created_at) : '—'} · ผ่าน {PROVIDER_LABEL[u.signupProvider] || u.signupProvider}
                        </div>
                      </div>

                      <div className="ad-detail-row">
                        <div className="ad-detail-label">สัตว์เลี้ยง ({u.petCount} ตัว)</div>
                        {u.petNames.length > 0 ? (
                          <div className="ad-detail-items">
                            {u.petNames.map((n, i) => (
                              <span key={i} className="ad-detail-item" style={{ background: F.pinkSoft, color: F.pink }}>{n}</span>
                            ))}
                          </div>
                        ) : (
                          <div className="ad-no-content">ยังไม่มีสัตว์เลี้ยง</div>
                        )}
                      </div>

                      {u.farmCount > 0 && (
                        <div className="ad-detail-row">
                          <div className="ad-detail-label">ฟาร์ม ({u.farmCount})</div>
                          <div className="ad-detail-items">
                            {u.farmNames.map((n, i) => (
                              <span key={i} className="ad-detail-item" style={{ background: F.greenSoft, color: F.green }}>{n}</span>
                            ))}
                          </div>
                        </div>
                      )}

                      {u.shopCount > 0 && (
                        <div className="ad-detail-row">
                          <div className="ad-detail-label">ร้านค้า ({u.shopCount})</div>
                          <div className="ad-detail-items">
                            {u.shopNames.map((n, i) => (
                              <span key={i} className="ad-detail-item" style={{ background: F.amberSoft, color: F.amber }}>{n}</span>
                            ))}
                          </div>
                        </div>
                      )}

                      {u.serviceCount > 0 && (
                        <div className="ad-detail-row">
                          <div className="ad-detail-label">บริการ ({u.serviceCount})</div>
                          <div className="ad-detail-items">
                            {u.serviceNames.map((n, i) => (
                              <span key={i} className="ad-detail-item" style={{ background: F.purpleSoft, color: F.purple }}>{n}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}

        </div>
      </div>
    </>
  );
}
