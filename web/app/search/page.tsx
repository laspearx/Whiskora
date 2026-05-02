"use client";

import { useEffect, useState, Suspense } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function SearchResults() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  
  const [farms, setFarms] = useState<import('@/lib/types').Farm[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchResults = async () => {
      setIsLoading(true);
      try {
        // ค้นหาฟาร์มที่มีชื่อตรงกับคำค้นหา (ใช้ ilike เพื่อให้ค้นหาแบบตัวพิมพ์เล็ก/ใหญ่ได้หมด)
        const { data, error } = await supabase
          .from('farms')
          .select('*')
          .ilike('farm_name', `%${query}%`);
          
        if (error) throw error;
        setFarms(data || []);
      } catch (error) {
        console.error("Error searching farms:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (query) {
      fetchResults();
    } else {
      setFarms([]);
      setIsLoading(false);
    }
  }, [query]);

  return (
    <div className="max-w-4xl mx-auto px-4 pt-8 pb-20 animate-in fade-in duration-500">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center bg-white hover:bg-pink-50 text-gray-400 hover:text-pink-600 rounded-xl transition shadow-sm border border-gray-100">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <div>
          <h1 className="text-2xl font-black text-gray-800 tracking-tight">ผลการค้นหา</h1>
          <p className="text-sm font-bold text-pink-500">คำค้นหา: "{query}"</p>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-20 text-pink-500 font-bold animate-pulse">กำลังค้นหาฟาร์ม... 🐾</div>
      ) : farms.length === 0 ? (
        <div className="bg-white rounded-[2rem] p-10 text-center border border-gray-100 shadow-sm">
          <div className="text-5xl mb-4 opacity-50">🕵️‍♀️</div>
          <h2 className="text-lg font-black text-gray-800 mb-1">ไม่พบฟาร์มที่คุณค้นหา</h2>
          <p className="text-sm font-medium text-gray-400">ลองใช้คำค้นหาอื่นดูอีกครั้งนะครับ</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {farms.map((farm) => (
            <Link href={`/farm/${farm.id}`} key={farm.id} className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm hover:border-pink-300 hover:shadow-md transition-all group flex items-center gap-4">
              <div className="w-16 h-16 bg-pink-50 rounded-2xl flex items-center justify-center text-2xl shrink-0 group-hover:scale-110 transition-transform">
                🏡
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-black text-gray-800 text-lg truncate group-hover:text-pink-600 transition-colors">{farm.farm_name}</h3>
                <p className="text-xs font-bold text-gray-400 truncate mt-0.5">{farm.description || 'ฟาร์มสัตว์เลี้ยงบน Whiskora'}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-pink-500 font-bold">กำลังโหลด...</div>}>
      <SearchResults />
    </Suspense>
  );
}