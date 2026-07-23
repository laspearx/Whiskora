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
  line: '#F3F4F6', lineMid: '#E5E7EB', paper: '#FFFFFF', bg: '#F9FAFB',
};

const Icon = {
  ArrowLeft: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>,
};

interface PetRow {
  id: number;
  name: string | null;
  species: string | null;
  breed: string | null;
  gender: string | null;
  image_url: string | null;
}

export default function AdminPetsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [pets, setPets] = useState<PetRow[]>([]);
  const [search, setSearch] = useState('');
  const [speciesFilter, setSpeciesFilter] = useState('');
  const [breedFilter, setBreedFilter] = useState('');

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/login'); return; }
      const { data: prof } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();
      if (!prof || prof.role !== 'admin') { router.push('/'); return; }

      const { data } = await supabase
        .from('pets')
        .select('id, name, species, breed, gender, image_url')
        .order('id', { ascending: false });

      setPets(data || []);
      setLoading(false);
    };
    load();
  }, [router]);

  const speciesOptions = useMemo(() => {
    const set = new Set(pets.map(p => p.species).filter(Boolean) as string[]);
    return Array.from(set).sort();
  }, [pets]);

  const breedOptions = useMemo(() => {
    const scoped = speciesFilter ? pets.filter(p => p.species === speciesFilter) : pets;
    const set = new Set(scoped.map(p => p.breed).filter(Boolean) as string[]);
    return Array.from(set).sort();
  }, [pets, speciesFilter]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return pets.filter(p => {
      if (speciesFilter && p.species !== speciesFilter) return false;
      if (breedFilter && p.breed !== breedFilter) return false;
      if (q && !(p.name?.toLowerCase().includes(q) || p.breed?.toLowerCase().includes(q))) return false;
      return true;
    });
  }, [pets, search, speciesFilter, breedFilter]);

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

        .ad-filters { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 16px; }
        .ad-search { position: relative; flex: 1; min-width: 180px; }
        .ad-search-icon { position: absolute; left: 13px; top: 50%; transform: translateY(-50%); color: ${F.muted}; pointer-events: none; }
        .ad-search input { width: 100%; padding: 10px 14px 10px 38px; border: 1px solid ${F.lineMid}; border-radius: 12px; font-size: 14px; font-family: inherit; background: white; color: ${F.ink}; outline: none; transition: border-color .15s; }
        .ad-search input:focus { border-color: ${F.pink}; }
        .ad-select { padding: 10px 32px 10px 14px; border: 1px solid ${F.lineMid}; border-radius: 12px; font-size: 13px; font-family: inherit; background: white; color: ${F.ink}; outline: none; cursor: pointer; appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%239CA3AF' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 10px center; }
        .ad-select:focus { border-color: ${F.pink}; }

        .ad-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 12px; }
        .ad-pet-card { background: white; border: 1px solid ${F.lineMid}; border-radius: 16px; overflow: hidden; text-decoration: none; color: inherit; transition: border-color .15s, transform .15s; display: block; }
        .ad-pet-card:hover { border-color: ${F.pinkBorder}; transform: translateY(-2px); }
        .ad-pet-photo { width: 100%; aspect-ratio: 1; background: ${F.line}; display: flex; align-items: center; justify-content: center; }
        .ad-pet-photo img { width: 100%; height: 100%; object-fit: cover; }
        .ad-pet-photo-placeholder { width: 40%; height: 40%; opacity: .3; object-fit: contain; }
        .ad-pet-info { padding: 10px 12px 12px; }
        .ad-pet-name { font-size: 13px; font-weight: 700; color: ${F.ink}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .ad-pet-meta { font-size: 11px; color: ${F.muted}; margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

        .ad-empty { text-align: center; padding: 48px 20px; color: ${F.muted}; font-size: 14px; }
      `}</style>

      <div className="ad-page">
        <div className="ad-body">

          <div className="ad-top">
            <button className="ad-back" onClick={() => router.push('/admin/dashboard')}><Icon.ArrowLeft /></button>
            <div>
              <div className="ad-title">สัตว์เลี้ยงทั้งหมด</div>
              <div className="ad-sub">รายชื่อสัตว์เลี้ยงในระบบ Whiskora</div>
            </div>
          </div>

          <div className="ad-filters">
            <div className="ad-search">
              <span className="ad-search-icon">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              </span>
              <input
                type="text"
                placeholder="ค้นหาชื่อสัตว์, สายพันธุ์..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <select className="ad-select" value={speciesFilter} onChange={e => { setSpeciesFilter(e.target.value); setBreedFilter(''); }}>
              <option value="">ทุกประเภท</option>
              {speciesOptions.map(s => <option key={s} value={s}>{speciesTh(s) || s}</option>)}
            </select>
            <select className="ad-select" value={breedFilter} onChange={e => setBreedFilter(e.target.value)}>
              <option value="">ทุกสายพันธุ์</option>
              {breedOptions.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>

          <div style={{ marginBottom: 14 }}>
            <span className="ad-count-chip">{filtered.length} ตัว</span>
          </div>

          {filtered.length === 0 ? (
            <div className="ad-empty">ไม่พบสัตว์เลี้ยงที่ตรงกับเงื่อนไข</div>
          ) : (
            <div className="ad-grid">
              {filtered.map(p => (
                <Link key={p.id} href={`/pets/${p.id}`} className="ad-pet-card">
                  <div className="ad-pet-photo">
                    {p.image_url
                      ? <img src={p.image_url} alt={p.name || ''} />
                      : <img className="ad-pet-photo-placeholder" src="/icons/icon-paw-pink.png" alt="" />
                    }
                  </div>
                  <div className="ad-pet-info">
                    <div className="ad-pet-name">{p.name || 'ไม่ระบุชื่อ'}</div>
                    <div className="ad-pet-meta">{speciesTh(p.species) || p.species || '—'}{p.breed ? ` · ${p.breed}` : ''}</div>
                  </div>
                </Link>
              ))}
            </div>
          )}

        </div>
      </div>
    </>
  );
}
