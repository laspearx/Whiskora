"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import PageLoader from '@/app/components/PageLoader';

const F = {
  ink: '#111827', inkSoft: '#4B5563', muted: '#9CA3AF',
  pink: '#E84677', pinkSoft: '#FDF2F5', pinkBorder: '#FBCFE8',
  line: '#F3F4F6', lineMid: '#E5E7EB', paper: '#FFFFFF', bg: '#F9FAFB',
};

const Icon = {
  ArrowLeft: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>,
};

interface ServiceRow {
  id: number;
  service_name: string | null;
  image_url: string | null;
  owner_name: string | null;
  user_id: string | null;
}

export default function AdminServicesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/login'); return; }
      const { data: prof } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();
      if (!prof || prof.role !== 'admin') { router.push('/'); return; }

      const [servicesRes, profilesRes] = await Promise.all([
        supabase.from('services').select('id, service_name, image_url, owner_name, user_id'),
        supabase.from('profiles').select('id, full_name, username'),
      ]);

      const profileMap = new Map((profilesRes.data || []).map((p: any) => [String(p.id), p]));

      const rows: ServiceRow[] = (servicesRes.data || []).map((s: any) => {
        const prof = profileMap.get(String(s.user_id));
        return {
          id: s.id,
          service_name: s.service_name,
          image_url: s.image_url,
          owner_name: s.owner_name || prof?.full_name || prof?.username || null,
          user_id: s.user_id,
        };
      });

      setServices(rows);
      setLoading(false);
    };
    load();
  }, [router]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return services;
    return services.filter(s =>
      s.service_name?.toLowerCase().includes(q) ||
      s.owner_name?.toLowerCase().includes(q)
    );
  }, [services, search]);

  if (loading) return <PageLoader />;

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        .ad-page { font-family: inherit; min-height: 100vh; background: ${F.bg}; color: ${F.ink}; }
        .ad-body { max-width: 900px; margin: 0 auto; padding: 24px 16px 80px; }

        .ad-top { display: flex; align-items: center; gap: 14px; margin-bottom: 24px; }
        .ad-back { display: inline-flex; align-items: center; justify-content: center; width: 40px; height: 40px; border-radius: 12px; background: white; color: #6B7280; cursor: pointer; border: 1px solid ${F.lineMid}; box-shadow: 0 1px 2px rgba(0,0,0,0.05); transition: all .18s; flex-shrink: 0; }
        .ad-back:hover { background: ${F.line}; color: ${F.ink}; transform: translateX(-1px); }
        .ad-title { font-size: 22px; font-weight: 700; color: ${F.ink}; }
        .ad-sub { font-size: 12px; color: ${F.muted}; margin-top: 2px; }

        .ad-count-chip { font-size: 11px; font-weight: 700; padding: 2px 9px; border-radius: 999px; background: ${F.pinkSoft}; color: ${F.pink}; }

        .ad-search { position: relative; margin-bottom: 16px; }
        .ad-search-icon { position: absolute; left: 13px; top: 50%; transform: translateY(-50%); color: ${F.muted}; pointer-events: none; }
        .ad-search input { width: 100%; padding: 10px 14px 10px 38px; border: 1px solid ${F.lineMid}; border-radius: 12px; font-size: 14px; font-family: inherit; background: white; color: ${F.ink}; outline: none; transition: border-color .15s; }
        .ad-search input:focus { border-color: ${F.pink}; }

        .ad-service-card { display: flex; align-items: center; gap: 14px; background: white; border: 1px solid ${F.lineMid}; border-radius: 14px; padding: 12px 16px; margin-bottom: 8px; }
        .ad-service-avatar { width: 52px; height: 52px; border-radius: 50%; object-fit: cover; background: ${F.line}; flex-shrink: 0; display: flex; align-items: center; justify-content: center; }
        .ad-service-avatar img { width: 100%; height: 100%; object-fit: cover; border-radius: 50%; }
        .ad-service-avatar-placeholder { width: 55%; height: 55%; opacity: .3; object-fit: contain; }
        .ad-service-info { flex: 1; min-width: 0; }
        .ad-service-name { font-size: 14px; font-weight: 700; color: ${F.ink}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .ad-service-owner { font-size: 12px; color: ${F.muted}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

        .ad-empty { text-align: center; padding: 48px 20px; color: ${F.muted}; font-size: 14px; }
      `}</style>

      <div className="ad-page">
        <div className="ad-body">

          <div className="ad-top">
            <button className="ad-back" onClick={() => router.push('/admin/dashboard')}><Icon.ArrowLeft /></button>
            <div>
              <div className="ad-title">บริการทั้งหมด</div>
              <div className="ad-sub">รายชื่อสถานบริการพาร์ทเนอร์ใน Whiskora</div>
            </div>
          </div>

          <div className="ad-search">
            <span className="ad-search-icon">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            </span>
            <input
              type="text"
              placeholder="ค้นหาชื่อสถานบริการ, เจ้าของ..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <div style={{ marginBottom: 14 }}>
            <span className="ad-count-chip">{filtered.length} แห่ง</span>
          </div>

          {filtered.length === 0 ? (
            <div className="ad-empty">ไม่พบบริการที่ตรงกับคำค้นหา</div>
          ) : (
            filtered.map(s => (
              <div key={s.id} className="ad-service-card">
                <div className="ad-service-avatar">
                  {s.image_url
                    ? <img src={s.image_url} alt={s.service_name || ''} />
                    : <img className="ad-service-avatar-placeholder" src="/icons/icon-service.png" alt="" />
                  }
                </div>
                <div className="ad-service-info">
                  <div className="ad-service-name">{s.service_name || 'ไม่ระบุชื่อสถานบริการ'}</div>
                  <div className="ad-service-owner">เจ้าของ: {s.owner_name || 'ไม่ระบุ'}</div>
                </div>
              </div>
            ))
          )}

        </div>
      </div>
    </>
  );
}
