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
    <div className="max-w-3xl mx-auto px-4 pt-6 pb-20 animate-in fade-in duration-700 space-y-5 md:space-y-6">
      
      {/* 🔙 Header (ปรับเป็นแบบเดียวกับหน้า Dashboard) */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => router.back()} 
            className="flex items-center justify-center w-10 h-10 bg-white hover:bg-pink-50 text-gray-400 hover:text-pink-600 rounded-xl transition shadow-sm border border-gray-100 flex-shrink-0"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-xl md:text-2xl font-black text-gray-800 tracking-tight flex items-center gap-2">
              🐾 ครอก <span className="text-pink-500">{litter.litter_code || 'ไม่ระบุ'}</span>
            </h1>
            <p className="text-[10px] md:text-xs font-bold text-gray-500 mt-0.5">รายละเอียดข้อมูลครอก</p>
          </div>
        </div>
        
        <Link href={`/farm-dashboard/${farmId}/litters/${litterId}/edit`} className="bg-white text-gray-500 border border-gray-200 hover:border-pink-300 hover:text-pink-500 px-3 py-2 md:px-4 rounded-xl font-bold text-xs transition shadow-sm flex items-center gap-1.5">
          <span>✎</span> <span className="hidden sm:inline">แก้ไข</span>
        </Link>
      </div>

      {/* 📋 Status & Info Card (ดีไซน์ใหม่ กระชับขึ้น) */}
      <div className="bg-white p-4 md:p-5 rounded-[1.5rem] border border-gray-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center border-4 flex-shrink-0 ${litter.status === 'คลอดแล้ว' ? 'bg-green-50 border-green-100 text-green-500' : 'bg-orange-50 border-orange-100 text-orange-500'}`}>
            <span className="text-xl">{litter.status === 'คลอดแล้ว' ? '🎉' : '⏳'}</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${litter.status === 'คลอดแล้ว' ? 'bg-green-50 text-green-600 border-green-200' : 'bg-orange-50 text-orange-600 border-orange-200'}`}>
                สถานะ: {litter.status}
              </span>
            </div>
            <p className="text-[11px] font-bold text-gray-500 mt-1.5 flex gap-2">
              <span>ทับ: {new Date(litter.mating_date).toLocaleDateString('th-TH')}</span>
              <span className="text-gray-300">|</span>
              <span className={litter.status === 'คลอดแล้ว' ? 'text-green-500' : 'text-pink-500'}>
                {litter.status === 'คลอดแล้ว' && litter.actual_birth_date ? `คลอด: ${new Date(litter.actual_birth_date).toLocaleDateString('th-TH')}` : `กำหนด: ${new Date(litter.expected_birth_date).toLocaleDateString('th-TH')}`}
              </span>
            </p>
          </div>
        </div>
        
        {litter.status === 'รอคลอด' && (
          <Link href={`/farm-dashboard/${farmId}/litters/${litterId}/birth`} className="bg-pink-500 text-white hover:bg-pink-600 px-5 py-2.5 rounded-xl font-black text-xs transition shadow-sm text-center shrink-0 w-full sm:w-auto">
            ✨ บันทึกคลอด
          </Link>
        )}
      </div>

      {/* 👨‍👩‍👦 พ่อแม่พันธุ์ (Parental Match - ย่อส่วนลง) */}
      <div className="bg-white rounded-[1.5rem] border border-gray-100 p-5 shadow-sm">
        <h2 className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-4 text-center">Parental Match</h2>
        <div className="flex items-center justify-center gap-6 md:gap-10">
          {/* พ่อ */}
          <Link href={`/pets/${sire?.id}`} className="flex flex-col items-center group w-20 md:w-24">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-full border-[3px] border-white shadow-sm overflow-hidden bg-blue-50 group-hover:scale-105 transition-transform">
              {sire?.image_url ? <img src={sire.image_url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-2xl">♂</div>}
            </div>
            <p className="mt-2 font-black text-gray-800 text-xs md:text-sm truncate w-full text-center">{sire?.name || 'ไม่ระบุ'}</p>
            <span className="text-[9px] font-bold text-blue-400">SIRE</span>
          </Link>

          <div className="text-xl animate-pulse text-pink-300">❤️</div>

          {/* แม่ */}
          <Link href={`/pets/${dam?.id}`} className="flex flex-col items-center group w-20 md:w-24">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-full border-[3px] border-white shadow-sm overflow-hidden bg-pink-50 group-hover:scale-105 transition-transform">
              {dam?.image_url ? <img src={dam.image_url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-2xl">♀</div>}
            </div>
            <p className="mt-2 font-black text-gray-800 text-xs md:text-sm truncate w-full text-center">{dam?.name || 'ไม่ระบุ'}</p>
            <span className="text-[9px] font-bold text-pink-400">DAM</span>
          </Link>
        </div>
      </div>

      {/* 🍼 รายชื่อลูกๆ (ปรับ Grid ให้สวยงามขึ้น) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
           <h2 className="text-sm md:text-base font-black text-gray-800 flex items-center gap-1.5">
             <span>🍼</span> สมาชิกในครอก
           </h2>
           <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">{babies.length} ตัว</span>
        </div>
        
        {babies.length === 0 ? (
          <div className="bg-white rounded-[1.5rem] py-10 text-center border border-gray-100 shadow-sm">
            <p className="text-xs font-bold text-gray-400">ยังไม่มีข้อมูลสมาชิกในครอก</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4">
            {babies.map(baby => (
              <Link key={baby.id} href={`/pets/${baby.id}`} className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm hover:border-pink-300 transition-all group relative">
                <div className="aspect-square rounded-xl bg-gray-50 overflow-hidden mb-2.5 relative">
                  {baby.image_url ? <img src={baby.image_url} className="w-full h-full object-cover group-hover:scale-105 transition-transform" /> : <div className="w-full h-full flex items-center justify-center text-3xl opacity-10">🐾</div>}
                  <div className="absolute top-1.5 right-1.5 bg-white/90 backdrop-blur rounded-md px-1.5 py-0.5 text-[8px] font-bold shadow-sm text-gray-600">
                    {baby.weight ? `${baby.weight}g` : '-'}
                  </div>
                </div>
                <h4 className="font-black text-gray-800 text-[11px] md:text-xs truncate mb-1.5">{baby.name || 'ยังไม่ตั้งชื่อ'}</h4>
                <div className="flex items-center justify-between">
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${baby.gender === 'male' || baby.gender === 'ตัวผู้' ? 'bg-blue-50 text-blue-500' : 'bg-pink-50 text-pink-500'}`}>
                    {baby.gender === 'male' || baby.gender === 'ตัวผู้' ? '♂ ผู้' : '♀ เมีย'}
                  </span>
                  <span className="text-[9px] font-bold text-gray-400 truncate max-w-[50px] text-right">{baby.status || 'เด็ก'}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}