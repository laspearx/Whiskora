"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { speciesTh } from '@/lib/species';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import PageLoader from '@/app/components/PageLoader';

const F = {
  ink: '#111827', inkSoft: '#4B5563', muted: '#9CA3AF',
  pink: '#E84677', pinkSoft: '#FDF2F5', pinkBorder: '#FBCFE8',
  green: '#16A34A', greenSoft: '#F0FDF4',
  line: '#F3F4F6', lineMid: '#E5E7EB', paper: '#FFFFFF', bg: '#F9FAFB',
};

const Icon = {
  ArrowLeft: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>,
};

interface FarmRow {
  id: number;
  farm_name: string | null;
  image_url: string | null;
  species: string | null;
  owner_name: string | null;
  user_id: string | null;
  petCount: number;
}

export default function AdminFarmsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [farms, setFarms] = useState<FarmRow[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/login'); return; }
      const { data: prof } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();
      if (!prof || prof.role !== 'admin') { router.push('/'); return; }

      const [farmsRes, petsRes, profilesRes] = await Promise.all([
        supabase.from('farms').select('id, farm_name, image_url, species, owner_name, user_id'),
        supabase.from('pets').select('farm_id'),
        supabase.from('profiles').select('id, full_name, username'),
      ]);

      const allFarms = farmsRes.data || [];
      const allPets = petsRes.data || [];
      const profileMap = new Map((profilesRes.data || []).map((p: any) => [String(p.id), p]));

      const rows: FarmRow[] = allFarms.map((f: any) => {
        const prof = profileMap.get(String(f.user_id));
        return {
          id: f.id,
          farm_name: f.farm_name,
          image_url: f.image_url,
          species: f.species,
          owner_name: f.owner_name || prof?.full_name || prof?.username || null,
          user_id: f.user_id,
          petCount: allPets.filter((p: any) => String(p.farm_id) === String(f.id)).length,
        };
      });

      rows.sort((a, b) => b.petCount - a.petCount);
      setFarms(rows);
      setLoading(false);
    };
    load();
  }, [router]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return farms;
    return farms.filter(f =>
      f.farm_name?.toLowerCase().includes(q) ||
      f.owner_name?.toLowerCase().includes(q)
    );
  }, [farms, search]);

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

        .ad-farm-card { display: flex; align-items: center; gap: 14px; background: white; border: 1px solid ${F.lineMid}; border-radius: 14px; padding: 12px 16px; margin-bottom: 8px; text-decoration: none; color: inherit; transition: border-color .15s; }
        .ad-farm-card:hover { border-color: ${F.pinkBorder}; }
        .ad-farm-avatar { width: 52px; height: 52px; border-radius: 50%; object-fit: cover; background: ${F.line}; flex-shrink: 0; display: flex; align-items: center; justify-content: center; }
        .ad-farm-avatar img { width: 100%; height: 100%; object-fit: cover; border-radius: 50%; }
        .ad-farm-avatar-placeholder { width: 55%; height: 55%; opacity: .3; object-fit: contain; }
        .ad-farm-info { flex: 1; min-width: 0; }
        .ad-farm-name { font-size: 14px; font-weight: 700; color: ${F.ink}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .ad-farm-owner { font-size: 12px; color: ${F.muted}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .ad-farm-badges { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }
        .ad-badge { display: inline-flex; align-items: center; gap: 3px; padding: 4px 9px; border-radius: 7px; font-size: 11px; font-weight: 700; white-space: nowrap; }

        .ad-empty { text-align: center; padding: 48px 20px; color: ${F.muted}; font-size: 14px; }
      `}</style>

      <div className="ad-page">
        <div className="ad-body">

          <div className="ad-top">
            <button className="ad-back" onClick={() => router.push('/admin/dashboard')}><Icon.ArrowLeft /></button>
            <div>
              <div className="ad-title">ฟาร์มทั้งหมด</div>
              <div className="ad-sub">รายชื่อฟาร์มพาร์ทเนอร์ใน Whiskora</div>
            </div>
          </div>

          <div className="ad-search">
            <span className="ad-search-icon">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            </span>
            <input
              type="text"
              placeholder="ค้นหาชื่อฟาร์ม, เจ้าของ..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <div style={{ marginBottom: 14 }}>
            <span className="ad-count-chip">{filtered.length} ฟาร์ม</span>
          </div>

          {filtered.length === 0 ? (
            <div className="ad-empty">ไม่พบฟาร์มที่ตรงกับคำค้นหา</div>
          ) : (
            filtered.map(f => (
              <Link key={f.id} href={`/farm/${f.id}`} className="ad-farm-card">
                <div className="ad-farm-avatar">
                  {f.image_url
                    ? <img src={f.image_url} alt={f.farm_name || ''} />
                    : <img className="ad-farm-avatar-placeholder" src="/icons/icon-farm.png" alt="" />
                  }
                </div>
                <div className="ad-farm-info">
                  <div className="ad-farm-name">{f.farm_name || 'ไม่ระบุชื่อฟาร์ม'}</div>
                  <div className="ad-farm-owner">เจ้าของ: {f.owner_name || 'ไม่ระบุ'}</div>
                </div>
                <div className="ad-farm-badges">
                  {f.species && (
                    <span className="ad-badge" style={{ background: F.greenSoft, color: F.green }}>{speciesTh(f.species) || f.species}</span>
                  )}
                  <span className="ad-badge" style={{ background: F.pinkSoft, color: F.pink }}>{f.petCount} ตัว</span>
                </div>
              </Link>
            ))
          )}

        </div>
      </div>
    </>
  );
}
