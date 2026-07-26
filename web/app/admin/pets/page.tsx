"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { speciesTh, SPECIES_LIST } from '@/lib/species';
import { sanitizeOrTerm } from '@/lib/adminSearch';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import PageLoader from '@/app/components/PageLoader';
import Pagination from '@/app/components/admin/Pagination';

const F = {
  ink: '#111827', inkSoft: '#4B5563', muted: '#9CA3AF',
  pink: '#E84677', pinkSoft: '#FDF2F5', pinkBorder: '#FBCFE8',
  line: '#F3F4F6', lineMid: '#E5E7EB', paper: '#FFFFFF', bg: '#F9FAFB',
};

const Icon = {
  ArrowLeft: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>,
};

const PAGE_SIZE = 24;

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
  const [fetching, setFetching] = useState(false);
  const [pets, setPets] = useState<PetRow[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [speciesFilter, setSpeciesFilter] = useState('');
  const [page, setPage] = useState(0);

  const fetchPets = useCallback(async (q: string, species: string, p: number) => {
    setFetching(true);
    let query = supabase
      .from('pets')
      .select('id, name, species, breed, gender, image_url', { count: 'exact' })
      .order('id', { ascending: false })
      .range(p * PAGE_SIZE, p * PAGE_SIZE + PAGE_SIZE - 1);

    if (species) query = query.eq('species', species);

    const safeQ = sanitizeOrTerm(q);
    if (safeQ) query = query.or(`name.ilike.%${safeQ}%,breed.ilike.%${safeQ}%,pet_code.ilike.%${safeQ}%`);

    const { data, count, error } = await query;
    if (!error && data) {
      setPets(data);
      setTotalCount(count || 0);
    }
    setFetching(false);
  }, []);

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/login'); return; }
      const { data: prof } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();
      if (!prof || prof.role !== 'admin') { router.push('/'); return; }

      await fetchPets('', '', 0);
      setLoading(false);
    };
    load();
  }, [router, fetchPets]);

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput);
      setPage(0);
      if (!loading) fetchPets(searchInput, speciesFilter, 0);
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  const changeSpecies = (value: string) => {
    setSpeciesFilter(value);
    setPage(0);
    fetchPets(search, value, 0);
  };

  const changePage = (next: number) => {
    setPage(next);
    fetchPets(search, speciesFilter, next);
  };

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
                placeholder="ค้นหาชื่อสัตว์, สายพันธุ์, รหัส..."
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
              />
            </div>
            <select className="ad-select" value={speciesFilter} onChange={e => changeSpecies(e.target.value)}>
              <option value="">ทุกประเภท</option>
              {SPECIES_LIST.map(s => <option key={s.id} value={s.id}>{s.th}</option>)}
            </select>
          </div>

          <div style={{ marginBottom: 14 }}>
            <span className="ad-count-chip">{totalCount.toLocaleString()} ตัว</span>
          </div>

          {fetching ? (
            <div className="ad-empty">กำลังค้นหา...</div>
          ) : pets.length === 0 ? (
            <div className="ad-empty">ไม่พบสัตว์เลี้ยงที่ตรงกับเงื่อนไข</div>
          ) : (
            <div className="ad-grid">
              {pets.map(p => (
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

          <Pagination page={page} pageSize={PAGE_SIZE} totalCount={totalCount} onChange={changePage} />

        </div>
      </div>
    </>
  );
}
