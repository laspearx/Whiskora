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
  Users: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  Paw: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M11.5 7.5C11.5 8.88 10.38 10 9 10S6.5 8.88 6.5 7.5 7.62 5 9 5s2.5 1.12 2.5 2.5zM17.5 7.5C17.5 8.88 16.38 10 15 10s-2.5-1.12-2.5-2.5S13.62 5 15 5s2.5 1.12 2.5 2.5zM4.5 13C4.5 14.38 3.38 15.5 2 15.5S-.5 14.38-.5 13 .62 10.5 2 10.5 4.5 11.62 4.5 13zM22 13c0 1.38-1.12 2.5-2.5 2.5S17 14.38 17 13s1.12-2.5 2.5-2.5S22 11.62 22 13zM17.34 14.86c-.87-1.02-1.6-1.89-2.48-2.91-.46-.54-1.05-1.08-1.75-1.32-.11-.04-.22-.07-.33-.09-.25-.04-.52-.04-.78-.04s-.53 0-.79.05c-.11.02-.22.05-.33.09-.7.24-1.28.78-1.75 1.32-.87 1.02-1.6 1.89-2.48 2.91-1.31 1.31-2.92 2.76-2.62 4.79.29 1.02.94 1.99 2.04 2.5.63.29 1.33.4 2.03.4h.08c.3 0 .59-.02.89-.07l.06-.01c.61-.1 1.2-.29 1.8-.56.59.27 1.19.47 1.8.56l.06.01c.3.05.59.07.89.07h.08c.7 0 1.4-.11 2.03-.4 1.1-.51 1.75-1.48 2.04-2.5.3-2.03-1.31-3.48-2.62-4.79z"/></svg>,
  Farm: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  Shop: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>,
  Service: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>,
  ChevronDown: () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>,
  ChevronUp: () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6"/></svg>,
  ChevronRight: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>,
};

interface UserRow {
  id: string;
  full_name: string | null;
  username: string | null;
  email: string | null;
  avatar_url: string | null;
  created_at: string;
  petCount: number;
  farmCount: number;
  shopCount: number;
  serviceCount: number;
  farmNames: string[];
  shopNames: string[];
  serviceNames: string[];
}

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });

const fmtDateShort = (iso: string) =>
  new Date(iso).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });

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

      if (statsRes.data) {
        setTotalUsers(Number(statsRes.data.users) || 0);
        setTotalPets(Number(statsRes.data.pets) || 0);
        setTotalFarms(Number(statsRes.data.farms) || 0);
        setTotalShops(Number(statsRes.data.shops) || 0);
        setTotalServices(Number(statsRes.data.services) || 0);
      }

      const rows: UserRow[] = (usersRes.data || []).map((p: any) => ({
        id:           p.id,
        full_name:    p.full_name,
        username:     p.username,
        email:        p.email,
        avatar_url:   p.avatar_url,
        created_at:   p.created_at,
        petCount:     Number(p.pet_count)     || 0,
        farmCount:    Number(p.farm_count)    || 0,
        shopCount:    Number(p.shop_count)    || 0,
        serviceCount: Number(p.service_count) || 0,
        farmNames:    p.farm_names    || [],
        shopNames:    p.shop_names    || [],
        serviceNames: p.service_names || [],
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
      u.serviceNames.some(n => n.toLowerCase().includes(q))
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
        .ad-stat-icon { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; }
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
        .ad-user-head { display: flex; align-items: center; gap: 12px; padding: 14px 16px; cursor: pointer; }
        .ad-avatar { width: 42px; height: 42px; border-radius: 50%; object-fit: cover; background: ${F.line}; flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-size: 16px; font-weight: 700; color: ${F.muted}; }
        .ad-avatar img { width: 100%; height: 100%; object-fit: cover; border-radius: 50%; }
        .ad-user-info { flex: 1; min-width: 0; }
        .ad-user-name { font-size: 14px; font-weight: 700; color: ${F.ink}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .ad-user-email { font-size: 11px; color: ${F.muted}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
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
              { icon: <Icon.Users />, num: totalUsers,    label: 'ผู้ใช้งาน\nทั้งหมด',   color: F.blue,    bg: F.blueSoft },
              { icon: <Icon.Paw />,   num: totalPets,     label: 'สัตว์เลี้ยง\nในระบบ',   color: F.pink,    bg: F.pinkSoft },
              { icon: <Icon.Farm />,  num: totalFarms,    label: 'ฟาร์ม',                  color: F.green,   bg: F.greenSoft },
              { icon: <Icon.Shop />,  num: totalShops,    label: 'ร้านค้า',                color: F.amber,   bg: F.amberSoft },
              { icon: <Icon.Service />, num: totalServices, label: 'บริการ',               color: F.purple,  bg: F.purpleSoft },
            ].map((s, i) => (
              <div key={i} className="ad-stat">
                <div className="ad-stat-icon" style={{ background: s.bg, color: s.color }}>{s.icon}</div>
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
              placeholder="ค้นหาชื่อ, อีเมล, ชื่อฟาร์ม..."
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
                      <div className="ad-user-email">{u.email || '—'}</div>
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
                      <span className="ad-badge-date">{u.created_at ? fmtDate(u.created_at) : '—'}</span>
                    </div>

                    <div className="ad-chevron">{isOpen ? <Icon.ChevronUp /> : <Icon.ChevronDown />}</div>
                  </div>

                  {isOpen && (
                    <div className="ad-user-detail">
                      <div className="ad-detail-row">
                        <div className="ad-detail-label">สมัครสมาชิก</div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: F.inkSoft }}>
                          {u.created_at ? fmtDate(u.created_at) : '—'}
                        </div>
                      </div>

                      <div className="ad-detail-row">
                        <div className="ad-detail-label">สัตว์เลี้ยง ({u.petCount} ตัว)</div>
                        {u.petCount > 0 ? (
                          <div className="ad-detail-items">
                            <span className="ad-detail-item" style={{ background: F.pinkSoft, color: F.pink }}>
                              {u.petCount} ตัวในระบบ
                            </span>
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
