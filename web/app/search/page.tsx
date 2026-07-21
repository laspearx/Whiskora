"use client";

import React, { useEffect, useState, Suspense } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { speciesTh } from '@/lib/species';
import PageLoader from '@/app/components/PageLoader';

const F = {
  ink: '#111827', inkSoft: '#4B5563', muted: '#9CA3AF',
  pink: '#E84677', pinkSoft: '#FDF2F5', pinkBorder: '#FBCFE8',
  line: '#F3F4F6', lineMid: '#E5E7EB', paper: '#FFFFFF', bg: '#FDF6F8',
};

const Icon = {
  ArrowLeft: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>,
  Chevron: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>,
};

function SearchResults() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';

  const [farms, setFarms] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchResults = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase.from('farms').select('*').ilike('farm_name', `%${query}%`);
        if (error) throw error;
        setFarms(data || []);
      } catch (error) {
        console.error("Error searching farms:", error);
      } finally { setIsLoading(false); }
    };
    if (query) fetchResults();
    else { setFarms([]); setIsLoading(false); }
  }, [query]);

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        .sr-page { font-family: inherit; min-height: 100vh; color: ${F.ink}; }
        .sr-body { max-width: 760px; margin: 0 auto; padding: 24px 20px 80px; }
        .sr-header { display: flex; align-items: center; gap: 14px; margin-bottom: 24px; }
        .sr-back { display: inline-flex; align-items: center; justify-content: center; width: 40px; height: 40px; border-radius: 12px; background: white; color: #6B7280; cursor: pointer; border: 1px solid #E5E7EB; box-shadow: 0 1px 2px rgba(0,0,0,0.05); transition: all .18s ease; flex-shrink: 0; }
        .sr-back:hover { background: #F9FAFB; color: #111827; transform: translateX(-1px); }
        .sr-title { font-family: inherit; font-size: 23px; font-weight: 700; color: ${F.ink}; line-height: 1.1; letter-spacing: -0.4px; }
        .sr-sub { font-size: 13px; font-weight: 700; color: ${F.pink}; margin-top: 2px; }
        .sr-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 14px; }
        .sr-card { display: flex; align-items: center; gap: 14px; background: white; padding: 16px; border-radius: 18px; border: 1px solid ${F.line}; text-decoration: none; transition: all .18s; }
        .sr-card:hover { border-color: ${F.pinkBorder}; box-shadow: 0 6px 20px rgba(232,70,119,0.1); transform: translateY(-1px); }
        .sr-card-avatar { width: 60px; height: 60px; border-radius: 16px; overflow: hidden; background: ${F.pinkSoft}; display: flex; align-items: center; justify-content: center; font-size: 26px; flex-shrink: 0; }
        .sr-card-avatar img { width: 100%; height: 100%; object-fit: cover; }
        .sr-card-info { flex: 1; min-width: 0; }
        .sr-card-name { font-family: inherit; font-size: 16px; font-weight: 700; color: ${F.ink}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .sr-card-meta { font-size: 12px; font-weight: 600; color: ${F.muted}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 2px; }
        .sr-card-arrow { color: ${F.muted}; flex-shrink: 0; display: flex; }
        .sr-card:hover .sr-card-arrow { color: ${F.pink}; }
        .sr-empty { background: white; border: 1px solid ${F.line}; border-radius: 24px; padding: 48px 24px; text-align: center; }
        .sr-empty-emoji { font-size: 48px; opacity: 0.6; margin-bottom: 12px; }
        .sr-empty-title { font-family: inherit; font-size: 18px; font-weight: 700; color: ${F.ink}; margin-bottom: 4px; }
        .sr-empty-text { font-size: 14px; font-weight: 500; color: ${F.muted}; }
      `}</style>

      <div className="sr-page">
        <div className="sr-body">
          <div className="sr-header">
            <button className="sr-back" onClick={() => router.back()} aria-label="ย้อนกลับ"><Icon.ArrowLeft /></button>
            <div>
              <h1 className="sr-title">ผลการค้นหา</h1>
              <p className="sr-sub">คำค้นหา: "{query}"</p>
            </div>
          </div>

          {isLoading ? (
            <PageLoader />
          ) : farms.length === 0 ? (
            <div className="sr-empty">
              <div className="sr-empty-emoji"><img src="/icons/icon-scan.png" alt="" style={{width:52,height:52,objectFit:'contain',opacity:0.3}} /></div>
              <h2 className="sr-empty-title">ไม่พบฟาร์มที่คุณค้นหา</h2>
              <p className="sr-empty-text">ลองใช้คำค้นหาอื่นดูอีกครั้งนะครับ</p>
            </div>
          ) : (
            <div className="sr-grid">
              {farms.map((farm) => (
                <Link href={`/farm/${farm.id}`} key={farm.id} className="sr-card">
                  <div className="sr-card-avatar">
                    {farm.image_url ? <img src={farm.image_url} alt={farm.farm_name} /> : '🏡'}
                  </div>
                  <div className="sr-card-info">
                    <div className="sr-card-name">{farm.farm_name}</div>
                    <div className="sr-card-meta">{farm.bio || `ฟาร์ม${speciesTh(farm.species) || 'สัตว์เลี้ยง'}บน Whiskora`}</div>
                  </div>
                  <span className="sr-card-arrow"><Icon.Chevron /></span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <SearchResults />
    </Suspense>
  );
}
