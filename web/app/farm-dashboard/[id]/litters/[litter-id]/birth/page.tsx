"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

interface KittenForm {
  tempId: number;
  name: string;
  gender: string;
  weight: string;
}

export default function BornLitterPage() {
  const router = useRouter();
  const params = useParams();
  
  // 🌟 ดึงค่า ID ให้ตรงกับโครงสร้างโฟลเดอร์
  const farmId = params.id as string;
  const litterId = params['litter-id'] as string;

  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [litterInfo, setLitterInfo] = useState<import('@/lib/types').Litter | null>(null);

  const [actualBirthDate, setActualBirthDate] = useState(new Date().toISOString().split('T')[0]);
  const [kittens, setKittens] = useState<KittenForm[]>([
    { tempId: Date.now(), name: '', gender: 'male', weight: '' }
  ]);

  useEffect(() => {
    const fetchLitterData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push('/login');
          return;
        }
        setUserId(session.user.id);

        // ดึงข้อมูลครอก พร้อมข้อมูลสายพันธุ์และประเภทสัตว์จากพ่อแม่
        const { data, error } = await supabase
          .from('litters')
          .select(`
            *,
            dam:pets!dam_id(name, breed, species),
            sire:pets!sire_id(name, breed, species)
          `)
          .eq('id', litterId)
          .single();

        if (error || !data) {
          alert('ไม่พบข้อมูลครอกนี้');
          router.push(`/farm-dashboard/${farmId}`);
          return;
        }

        setLitterInfo(data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsFetching(false);
      }
    };

    if (litterId) fetchLitterData();
  }, [litterId, farmId, router]);

  const addKitten = () => {
    setKittens([...kittens, { tempId: Date.now(), name: '', gender: 'male', weight: '' }]);
  };

  const removeKitten = (tempId: number) => {
    if (kittens.length === 1) return; 
    setKittens(kittens.filter(k => k.tempId !== tempId));
  };

  const updateKitten = (tempId: number, field: string, value: string) => {
    setKittens(kittens.map(k => k.tempId === tempId ? { ...k, [field]: value } : k));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !litterInfo) return;

    setIsLoading(true);

    try {
      // 1. อัปเดตสถานะครอกเป็น 'คลอดแล้ว'
      const { error: litterError } = await supabase
        .from('litters')
        .update({ status: 'คลอดแล้ว' })
        .eq('id', litterId);

      if (litterError) throw litterError;

      // 2. เตรียมข้อมูลลูกๆ เพื่อบันทึกลงตาราง pets (สืบทอดสายพันธุ์จากแม่)
      const petsData = kittens.map((k, index) => ({
        user_id: userId,
        farm_id: farmId,
        litter_id: parseInt(litterId),
        name: k.name || `ลูก${litterInfo.dam?.name || ''} (${litterInfo.litter_code}) #${index + 1}`,
        gender: k.gender,
        status: 'เด็ก', // 🌟 ปรับสถานะให้ตรงกับระบบฟาร์ม
        birth_date: actualBirthDate,
        weight: k.weight ? parseFloat(k.weight) : null,
        species: litterInfo.dam?.species || litterInfo.sire?.species || null,
        breed: litterInfo.dam?.breed || litterInfo.sire?.breed || null,
      }));

      const { error: petsError } = await supabase
        .from('pets')
        .insert(petsData);

      if (petsError) throw petsError;

      alert(`🎉 บันทึกสมาชิกใหม่ทั้ง ${kittens.length} ตัว เรียบร้อยแล้ว!`);
      router.push(`/farm-dashboard/${farmId}`);

    } catch (error: unknown) {
      alert('เกิดข้อผิดพลาด: ' + (error instanceof Error ? error.message : 'กรุณาลองใหม่'));
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) return <div className="min-h-screen flex items-center justify-center text-pink-500 font-bold animate-pulse">กำลังเตรียมข้อมูลครอก... ⏳</div>;

  return (
    <div className="max-w-2xl mx-auto pt-6 pb-20 px-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* 🔙 Header */}
      <div className="flex items-start gap-3 mb-6 md:mb-8">
        <Link href={`/farm-dashboard/${farmId}`} className="mt-0.5 p-2.5 bg-white hover:bg-pink-50 text-gray-400 hover:text-pink-500 rounded-xl transition shadow-sm border border-gray-100 shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
        </Link>
        <div className="flex flex-col">
          <h1 className="text-xl md:text-2xl font-black text-gray-800 tracking-tight">บันทึกข้อมูลแรกเกิด</h1>
          <p className="text-xs md:text-sm font-bold text-pink-500 mt-1">ครอกรหัส: {litterInfo?.litter_code} ( แม่: {litterInfo?.dam?.name} • พ่อ: {litterInfo?.sire?.name} )</p>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-pink-100 p-8 md:p-10 relative overflow-hidden">
        
        <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
          
          {/* วันที่คลอด */}
          <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100">
            <label className="block text-sm font-bold text-gray-700 mb-3 ml-1">📅 วันที่คลอดจริง</label>
            <input 
              type="date" 
              value={actualBirthDate}
              onChange={(e) => setActualBirthDate(e.target.value)}
              required
              className="w-full bg-white border border-gray-100 rounded-2xl px-0 py-3.5 outline-none focus:border-pink-300 transition text-sm font-bold text-gray-800 text-center" 
            />
          </div>

          <div className="space-y-5">
            <div className="flex justify-between items-center px-2">
              <h3 className="font-black text-gray-800 tracking-tight">รายการเด็กๆ ({kittens.length})</h3>
              <span className="text-[10px] font-black text-pink-500 uppercase tracking-widest bg-pink-50 px-3 py-1 rounded-full">Newborn List</span>
            </div>

            {/* วนลูปการ์ดลูกแมว */}
            <div className="space-y-4">
              {kittens.map((kitten, index) => (
                <div key={kitten.tempId} className="relative bg-white p-6 rounded-[2rem] border-2 border-gray-50 hover:border-pink-100 transition-all shadow-sm group">
                  {kittens.length > 1 && (
                    <button 
                      type="button" 
                      onClick={() => removeKitten(kitten.tempId)}
                      className="absolute top-4 right-4 text-gray-300 hover:text-red-500 transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </button>
                  )}
                  
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 bg-pink-500 text-white rounded-full flex items-center justify-center text-xs font-black shadow-sm">
                      {index + 1}
                    </div>
                    <span className="font-black text-gray-700 text-sm">ข้อมูลเด็กน้อย</span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* ชื่อ */}
                    <div>
                      <label className="block text-[11px] font-bold text-gray-400 mb-1.5 ml-1">ชื่อ (เว้นได้)</label>
                      <input 
                        type="text" 
                        placeholder="เช่น จิ๋ว"
                        value={kitten.name}
                        onChange={(e) => updateKitten(kitten.tempId, 'name', e.target.value)}
                        className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-sm font-bold text-gray-800 outline-none focus:bg-white focus:border-pink-200 transition"
                      />
                    </div>
                    {/* เพศ */}
                    <div>
                      <label className="block text-[11px] font-bold text-gray-400 mb-1.5 ml-1">เพศ <span className="text-pink-500">*</span></label>
                      <div className="flex gap-2">
                        <button 
                          type="button" 
                          onClick={() => updateKitten(kitten.tempId, 'gender', 'male')}
                          className={`flex-1 py-2.5 text-xs font-black rounded-xl border transition-all ${kitten.gender === 'male' || kitten.gender === 'ตัวผู้' ? 'bg-blue-500 border-blue-500 text-white shadow-md shadow-blue-100' : 'bg-gray-50 border-gray-100 text-gray-400 hover:bg-white'}`}
                        >
                          ♂ ตัวผู้
                        </button>
                        <button 
                          type="button" 
                          onClick={() => updateKitten(kitten.tempId, 'gender', 'female')}
                          className={`flex-1 py-2.5 text-xs font-black rounded-xl border transition-all ${kitten.gender === 'female' || kitten.gender === 'ตัวเมีย' ? 'bg-pink-500 border-pink-500 text-white shadow-md shadow-pink-100' : 'bg-gray-50 border-gray-100 text-gray-400 hover:bg-white'}`}
                        >
                          ♀ ตัวเมีย
                        </button>
                      </div>
                    </div>
                    {/* น้ำหนัก */}
                    <div className="md:col-span-2">
                      <label className="block text-[11px] font-bold text-gray-400 mb-1.5 ml-1">น้ำหนักแรกเกิด (กรัม)</label>
                      <input 
                        type="number" 
                        placeholder="เช่น 50"
                        value={kitten.weight}
                        onChange={(e) => updateKitten(kitten.tempId, 'weight', e.target.value)}
                        className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-sm font-bold text-gray-800 outline-none focus:bg-white focus:border-pink-200 transition"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* ปุ่มเพิ่มตัวเลือก */}
            <button 
              type="button" 
              onClick={addKitten}
              className="w-full border-2 border-dashed border-gray-200 text-gray-400 hover:border-pink-300 hover:text-pink-500 hover:bg-pink-50 font-black py-4 rounded-[2rem] transition-all text-sm flex justify-center items-center gap-2 group"
            >
              <span className="text-xl group-hover:scale-125 transition-transform">+</span> เพิ่มเด็กๆ อีกตัว
            </button>
          </div>

          <div className="pt-6">
            <button 
              type="submit" 
              disabled={isLoading} 
              className={`w-full py-4 rounded-2xl font-black text-white transition-all shadow-xl active:scale-[0.98] flex justify-center items-center gap-2 ${isLoading ? 'bg-gray-300 shadow-none' : 'bg-teal-500 hover:bg-teal-600 shadow-teal-100'}`}
            >
              {isLoading ? '⏳ กำลังเซฟข้อมูล...' : `✨ ยืนยันบันทึกเด็กๆ ทั้ง ${kittens.length} ตัวเข้าฟาร์ม`}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}