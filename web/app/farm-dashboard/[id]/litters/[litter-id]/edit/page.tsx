"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

interface Pet {
  id: number;
  name: string;
  gender: string;
}

export default function EditLitterPage() {
  const router = useRouter();
  const params = useParams();
  
  const farmId = params.id as string;
  const litterId = params['litter-id'] as string;

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [maleBreeders, setMaleBreeders] = useState<Pet[]>([]);
  const [femaleBreeders, setFemaleBreeders] = useState<Pet[]>([]);

  const [formData, setFormData] = useState({
    litter_code: '',
    sire_id: '',
    dam_id: '',
    mating_date: '',
    expected_birth_date: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return router.push('/login');

        // 1. ดึงข้อมูลครอกเดิม
        const { data: litterData, error: litterError } = await supabase
          .from('litters')
          .select('*')
          .eq('id', litterId)
          .single();

        if (litterError) throw litterError;

        if (litterData) {
          setFormData({
            litter_code: litterData.litter_code,
            sire_id: litterData.sire_id.toString(),
            dam_id: litterData.dam_id.toString(),
            mating_date: litterData.mating_date,
            expected_birth_date: litterData.expected_birth_date
          });
        }

        // 2. ดึงรายชื่อพ่อแม่พันธุ์ในฟาร์มนี้
        const { data: petsData } = await supabase
          .from('pets')
          .select('id, name, gender')
          .eq('farm_id', farmId)
          .in('status', ['พ่อพันธุ์ / แม่พันธุ์', 'พ่อพันธุ์', 'แม่พันธุ์']);

        if (petsData) {
          setMaleBreeders(petsData.filter(p => p.gender === 'male' || p.gender === 'ตัวผู้'));
          setFemaleBreeders(petsData.filter(p => p.gender === 'female' || p.gender === 'ตัวเมีย'));
        }

      } catch (error) {
        console.error('Error:', error);
        alert('ไม่พบข้อมูลครอกนี้ครับ');
        router.back();
      } finally {
        setIsLoading(false);
      }
    };

    if (litterId && farmId) fetchData();
  }, [litterId, farmId, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleMatingDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dateVal = e.target.value;
    if (dateVal) {
      const matingDate = new Date(dateVal);
      matingDate.setDate(matingDate.getDate() + 65);
      const expectedDate = matingDate.toISOString().split('T')[0];
      setFormData(prev => ({ ...prev, mating_date: dateVal, expected_birth_date: expectedDate }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const { error } = await supabase
        .from('litters')
        .update({
          litter_code: formData.litter_code,
          sire_id: parseInt(formData.sire_id),
          dam_id: parseInt(formData.dam_id),
          mating_date: formData.mating_date,
          expected_birth_date: formData.expected_birth_date
        })
        .eq('id', litterId);

      if (error) throw error;

      alert('🎉 อัปเดตข้อมูลการจับคู่เรียบร้อย!');
      router.push(`/farm-dashboard/${farmId}`);
    } catch (error: any) {
      alert('เกิดข้อผิดพลาด: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  // 🌟 ฟังก์ชันยกเลิกการบรีด (ลบข้อมูลเพื่อคืนรหัสครอก)
  const handleDelete = async () => {
    const confirmDelete = window.confirm(
      `⚠️ คุณต้องการยกเลิกการจับคู่ครอก "${formData.litter_code}" ใช่หรือไม่?\n\nข้อมูลจะถูกลบถาวรและรหัสครอกนี้จะถูกนำกลับมาใช้ใหม่ได้ทันที`
    );

    if (!confirmDelete) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('litters')
        .delete()
        .eq('id', litterId);

      if (error) throw error;

      alert('🗑️ ยกเลิกการจับคู่และคืนรหัสครอกเรียบร้อยแล้ว');
      router.push(`/farm-dashboard/${farmId}`);
    } catch (error: any) {
      alert('ล้มเหลว: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center text-pink-500 font-bold animate-pulse">กำลังโหลดข้อมูล... ⏳</div>;

  return (
    <div className="max-w-xl mx-auto pt-4 pb-8 md:pt-8 md:pb-12 px-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* 🔙 Header */}
      <div className="flex items-start gap-3 mb-6 md:mb-8">
        <button onClick={() => router.back()} className="mt-0.5 p-2.5 bg-white hover:bg-pink-50 text-gray-400 hover:text-pink-500 rounded-xl transition shadow-sm border border-gray-100 shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <div className="flex flex-col">
          <h1 className="text-xl md:text-2xl font-black text-gray-800 tracking-tight">แก้ไขการจับคู่</h1>
          <p className="text-xs md:text-sm font-bold text-pink-500 mt-1">Litter Code: {formData.litter_code}</p>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-pink-100 p-8 md:p-10">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* รหัสครอก */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">รหัสครอก (Litter Code)</label>
            <input 
              required
              type="text" 
              name="litter_code" 
              value={formData.litter_code} 
              onChange={handleChange} 
              className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3.5 outline-none focus:border-pink-300 focus:bg-white transition text-sm font-bold text-pink-600 text-center"
            />
          </div>

          {/* พ่อแม่พันธุ์ */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">♂ พ่อพันธุ์</label>
              <select name="sire_id" value={formData.sire_id} onChange={handleChange} className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3.5 outline-none focus:border-pink-300 transition text-sm font-bold text-gray-800 appearance-none cursor-pointer">
                {maleBreeders.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">♀ แม่พันธุ์</label>
              <select name="dam_id" value={formData.dam_id} onChange={handleChange} className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3.5 outline-none focus:border-pink-300 transition text-sm font-bold text-gray-800 appearance-none cursor-pointer">
                {femaleBreeders.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          </div>

          {/* วันที่ */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">วันที่บรีด</label>
              <input type="date" name="mating_date" value={formData.mating_date} onChange={handleMatingDateChange} className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-0 py-3.5 text-sm font-bold text-gray-800 outline-none focus:border-pink-300 text-center" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">กำหนดคลอด</label>
              <input type="date" name="expected_birth_date" value={formData.expected_birth_date} onChange={handleChange} className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-0 py-3.5 text-sm font-bold text-gray-800 outline-none focus:border-pink-300 text-center" />
            </div>
          </div>

          {/* กลุ่มปุ่มดำเนินการ */}
          <div className="pt-6 space-y-4">
            <button 
              type="submit" 
              disabled={isSaving} 
              className={`w-full py-4 rounded-2xl font-black text-white transition-all shadow-lg active:scale-[0.98] flex justify-center items-center gap-2 ${isSaving ? 'bg-gray-400 shadow-none' : 'bg-pink-500 hover:bg-pink-600 shadow-pink-200'}`}
            >
              {isSaving ? '⏳ กำลังบันทึก...' : '✨ บันทึกการเปลี่ยนแปลง'}
            </button>

            {/* 🌟 ปุ่มยกเลิกการจับคู่ (Delete) */}
            <button 
              type="button"
              onClick={handleDelete}
              disabled={isSaving}
              className="w-full py-3 text-sm font-bold text-gray-400 hover:text-red-500 transition-colors flex items-center justify-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              ยกเลิกการจับคู่บรีดนี้
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}