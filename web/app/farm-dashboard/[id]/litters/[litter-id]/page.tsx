"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

export default function LitterDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const farmId = params.id as string;
  const litterId = params['litter-id'] as string;

  const [litter, setLitter] = useState<any>(null);
  const [sire, setSire] = useState<any>(null);
  const [dam, setDam] = useState<any>(null);
  const [babies, setBabies] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLitterDetails = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return router.push('/login');

        // 1. ดึงข้อมูลครอก
        const { data: litterData, error: litterError } = await supabase
          .from('litters')
          .select('*')
          .eq('id', litterId)
          .single();

        if (litterError) throw litterError;
        setLitter(litterData);

        // 2. ดึงข้อมูลพ่อและแม่
        const { data: parentsData } = await supabase
          .from('pets')
          .select('*')
          .in('id', [litterData.sire_id, litterData.dam_id]);

        if (parentsData) {
          setSire(parentsData.find(p => p.id === litterData.sire_id));
          setDam(parentsData.find(p => p.id === litterData.dam_id));
        }

        // 3. ดึงรายชื่อลูกๆ ที่เกิดจากครอกนี้
        const { data: babiesData } = await supabase
          .from('pets')
          .select('*')
          .eq('litter_id', litterId)
          .order('id', { ascending: true });

        if (babiesData) setBabies(babiesData);

      } catch (error) {
        console.error('Error:', error);
        alert('ไม่พบข้อมูลครอกนี้ครับ');
        router.push(`/farm-dashboard/${farmId}`);
      } finally {
        setIsLoading(false);
      }
    };

    if (litterId) fetchLitterDetails();
  }, [litterId, farmId, router]);

  if (isLoading) return <div className="min-h-screen flex items-center justify-center text-pink-500 font-bold animate-pulse">กำลังโหลดข้อมูลครอก... ⏳</div>;
  if (!litter) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 pt-6 pb-20 animate-in fade-in duration-700 space-y-6">
      
      {/* 🔙 Navigation Bar */}
      <div className="flex justify-between items-center bg-white p-3 rounded-2xl shadow-sm border border-gray-100 sticky top-4 z-20">
        <button onClick={() => router.back()} className="text-gray-400 hover:text-pink-500 font-bold flex items-center gap-2 px-3 py-2 rounded-xl transition-all hover:bg-pink-50 text-sm">
          ← ย้อนกลับ
        </button>
        <div className="flex gap-2">
          {litter.status === 'รอคลอด' && (
            <Link href={`/farm-dashboard/${farmId}/litters/${litterId}/birth`} className="bg-pink-500 text-white hover:bg-pink-600 px-4 py-2 rounded-xl font-black text-xs transition shadow-sm shadow-pink-100">
              ✨ คลอดแล้ว
            </Link>
          )}
          <Link href={`/farm-dashboard/${farmId}/litters/${litterId}/edit`} className="bg-gray-50 text-gray-500 border border-gray-200 hover:border-pink-300 hover:text-pink-500 px-4 py-2 rounded-xl font-bold text-xs transition">
            ✎ แก้ไข
          </Link>
        </div>
      </div>

      {/* 🏆 Litter Header */}
      <div className="bg-white rounded-[2.5rem] border border-pink-100 p-8 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-pink-50 rounded-bl-full opacity-50 -z-0"></div>
        <div className="relative z-10">
          <h1 className="text-2xl md:text-3xl font-black text-gray-800 flex items-center gap-3">
            🐾 ครอก <span className="text-pink-500">{litter.litter_code}</span>
          </h1>
          <div className="flex flex-wrap gap-2 mt-4">
            <span className={`px-3 py-1 text-[10px] font-black rounded-full border ${litter.status === 'คลอดแล้ว' ? 'bg-green-50 text-green-600 border-green-200' : 'bg-orange-50 text-orange-600 border-orange-200'}`}>
               สถานะ: {litter.status}
            </span>
            <span className="px-3 py-1 bg-gray-50 text-gray-500 text-[10px] font-bold rounded-full border border-gray-100">
               บรีดเมื่อ: {new Date(litter.mating_date).toLocaleDateString('th-TH')}
            </span>
          </div>
        </div>
      </div>

      {/* 👨‍👩‍👦 พ่อแม่พันธุ์ */}
      <div className="bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-sm">
        <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-8 text-center">Parental Match</h2>
        <div className="flex items-center justify-center gap-6 md:gap-12">
          {/* พ่อ */}
          <Link href={`/pets/${sire?.id}`} className="flex flex-col items-center group">
            <div className="w-20 h-20 md:w-28 md:h-28 rounded-full border-4 border-white shadow-md overflow-hidden bg-blue-50 group-hover:scale-105 transition-transform">
              {sire?.image_url ? <img src={sire.image_url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-3xl">♂</div>}
            </div>
            <p className="mt-3 font-black text-gray-800 text-sm md:text-base">{sire?.name || 'ไม่ทราบชื่อพ่อ'}</p>
            <span className="text-[10px] font-bold text-blue-400">SIRE</span>
          </Link>

          <div className="text-2xl animate-pulse text-pink-200">❤️</div>

          {/* แม่ */}
          <Link href={`/pets/${dam?.id}`} className="flex flex-col items-center group">
            <div className="w-20 h-20 md:w-28 md:h-28 rounded-full border-4 border-white shadow-md overflow-hidden bg-pink-50 group-hover:scale-105 transition-transform">
              {dam?.image_url ? <img src={dam.image_url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-3xl">♀</div>}
            </div>
            <p className="mt-3 font-black text-gray-800 text-sm md:text-base">{dam?.name || 'ไม่ทราบชื่อแม่'}</p>
            <span className="text-[10px] font-bold text-pink-400">DAM</span>
          </Link>
        </div>
      </div>

      {/* 🍼 รายชื่อลูกๆ */}
      <div className="space-y-4">
        <h2 className="text-lg font-black text-gray-800 flex items-center gap-2 px-2">
          <span>🍼</span> สมาชิกในครอก ({babies.length})
        </h2>
        {babies.length === 0 ? (
          <div className="bg-gray-50/50 rounded-[2rem] py-12 text-center border-2 border-dashed border-gray-200">
            <p className="text-gray-400 font-bold">ยังไม่มีข้อมูลการคลอด</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {babies.map(baby => (
              <Link key={baby.id} href={`/pets/${baby.id}`} className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm hover:border-pink-300 transition-all group">
                <div className="aspect-square rounded-2xl bg-gray-50 overflow-hidden mb-3">
                  {baby.image_url ? <img src={baby.image_url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-2xl">🐾</div>}
                </div>
                <h4 className="font-black text-gray-800 text-sm truncate">{baby.name}</h4>
                <div className="flex items-center justify-between mt-1">
                  <span className={`text-[10px] font-bold ${baby.gender === 'male' || baby.gender === 'ตัวผู้' ? 'text-blue-500' : 'text-pink-500'}`}>
                    {baby.gender === 'male' || baby.gender === 'ตัวผู้' ? '♂ ผู้' : '♀ เมีย'}
                  </span>
                  <span className="text-[9px] text-gray-400 font-bold">{baby.weight}g</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}