"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useRouter, useParams } from 'next/navigation';

interface Pet {
  id: number;
  name: string;
  gender: string;
  status: string;
  months_rested?: number | null; 
}

// 🌟 ฟังก์ชันแปลงตัวอักษรเป็นตัวเลข (A=1, Z=26, AA=27)
const letterToNumber = (letters: string) => {
  let n = 0;
  for (let i = 0; i < letters.length; i++) {
    n = n * 26 + (letters.charCodeAt(i) - 64);
  }
  return n;
};

// 🌟 ฟังก์ชันแปลงตัวเลขกลับเป็นตัวอักษร (1=A, 26=Z, 27=AA)
const numberToLetter = (n: number) => {
  let result = '';
  while (n > 0) {
    let rem = (n - 1) % 26;
    result = String.fromCharCode(65 + rem) + result;
    n = Math.floor((n - 1) / 26);
  }
  return result;
};

export default function CreateLitterPage() {
  const router = useRouter();
  const params = useParams();
  const farmId = params.id as string; 

  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

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
    const fetchBreeders = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert('กรุณาเข้าสู่ระบบก่อน!');
        router.push('/login');
        return;
      }
      setUserId(session.user.id);

      const { data: petsData } = await supabase
        .from('pets')
        .select('id, name, gender, status')
        .eq('user_id', session.user.id)
        .eq('farm_id', farmId)
        .eq('status', 'พ่อพันธุ์ / แม่พันธุ์')
        .order('name');

      const { data: allLitters } = await supabase
        .from('litters')
        .select('dam_id, expected_birth_date, status')
        .eq('user_id', session.user.id);

      if (petsData) {
        const pregnantDamIds = new Set(); 
        const latestBirthMap = new Map(); 

        if (allLitters) {
          allLitters.forEach(litter => {
            if (litter.status === 'รอคลอด') {
              pregnantDamIds.add(litter.dam_id);
            } else {
              const existingDate = latestBirthMap.get(litter.dam_id);
              if (!existingDate || new Date(litter.expected_birth_date) > new Date(existingDate)) {
                latestBirthMap.set(litter.dam_id, litter.expected_birth_date);
              }
            }
          });
        }

        setMaleBreeders(petsData.filter(pet => pet.gender === 'male' || pet.gender === 'ตัวผู้'));
        
        const availableFemales = petsData
          .filter(pet => (pet.gender === 'female' || pet.gender === 'ตัวเมีย') && !pregnantDamIds.has(pet.id))
          .map(pet => {
            const lastBirth = latestBirthMap.get(pet.id);
            let monthsRested = null;
            if (lastBirth) {
              const birthDate = new Date(lastBirth);
              const today = new Date();
              const diffTime = today.getTime() - birthDate.getTime();
              const diffDays = diffTime / (1000 * 60 * 60 * 24);
              monthsRested = diffDays / 30.44; 
            }
            return { ...pet, months_rested: monthsRested };
          });

        setFemaleBreeders(availableFemales);
      }
    };

    if (farmId) fetchBreeders();
  }, [farmId, router]);

  const handleMatingDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dateVal = e.target.value;
    
    if (dateVal) {
      const matingDate = new Date(dateVal);
      matingDate.setDate(matingDate.getDate() + 65);
      const expectedDate = matingDate.toISOString().split('T')[0];
      
      setFormData(prev => ({ 
        ...prev, 
        mating_date: dateVal,
        expected_birth_date: expectedDate 
      }));
    } else {
      setFormData(prev => ({ 
        ...prev, 
        mating_date: '',
        expected_birth_date: '' 
      }));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    if (!formData.sire_id || !formData.dam_id) {
      alert('กรุณาเลือกพ่อพันธุ์และแม่พันธุ์ให้ครบถ้วนครับ');
      return;
    }

    setIsLoading(true);

    try {
      let finalLitterCode = formData.litter_code.trim();

      if (!finalLitterCode) {
        const { data: existingLitters } = await supabase
          .from('litters')
          .select('litter_code')
          .eq('user_id', userId)
          .eq('farm_id', farmId);
        
        let maxVal = 0;
        if (existingLitters) {
          existingLitters.forEach(l => {
            const code = l.litter_code;
            if (code && /^[A-Z]+$/.test(code)) {
              const val = letterToNumber(code);
              if (val > maxVal) maxVal = val;
            }
          });
        }
        finalLitterCode = numberToLetter(maxVal + 1);
      }

      const { error } = await supabase
        .from('litters')
        .insert([{
          litter_code: finalLitterCode,
          sire_id: parseInt(formData.sire_id),
          dam_id: parseInt(formData.dam_id),
          mating_date: formData.mating_date,
          expected_birth_date: formData.expected_birth_date,
          status: 'รอคลอด',
          user_id: userId,
          farm_id: farmId
        }]);

      if (error) throw error;

      alert(`💕 บันทึกการจับคู่ ครอก ${finalLitterCode} เรียบร้อย!`);
      router.push(`/farm-dashboard/${farmId}`);

    } catch (error: unknown) {
      alert('เกิดข้อผิดพลาด: ' + (error instanceof Error ? error.message : 'กรุณาลองใหม่'));
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const selectedDam = femaleBreeders.find(c => c.id.toString() === formData.dam_id);
  const isDamRestingTooShort = selectedDam && typeof selectedDam.months_rested === 'number' && selectedDam.months_rested < 6;

  return (
    <div className="max-w-xl mx-auto pt-4 pb-8 md:pt-8 md:pb-12 px-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* 🔙 ส่วน Header แบบใหม่ (เหมือนหน้าเพิ่มสมาชิก) */}
      <div className="flex items-start gap-3 mb-6 md:mb-8">
        <Link href={`/farm-dashboard/${farmId}`} className="mt-0.5 p-2.5 bg-white hover:bg-pink-50 text-gray-400 hover:text-pink-500 rounded-xl transition shadow-sm border border-gray-100 shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
        </Link>
        <div className="flex flex-col">
          <h1 className="text-xl md:text-2xl font-black text-gray-800 tracking-tight">บันทึกการจับคู่บรีด</h1>
          <p className="text-xs md:text-sm font-bold text-pink-500 mt-1">สร้างรหัสครอกและคำนวณวันกำหนดคลอด</p>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-pink-100 p-8 md:p-10 relative">
        
        {/* ไอคอนน่ารักๆ ด้านบนฟอร์ม */}
        <div className="flex justify-center mb-8">
          <div className="w-20 h-20 rounded-full flex items-center justify-center text-6xl">💗</div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* รหัสครอก */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">
              รหัสครอก (Litter Code) 
              <span className="text-[10px] text-gray-400 font-medium ml-2">* เว้นว่างไว้เพื่อรันอัตโนมัติ (A, B...)</span>
            </label>
            <input 
              type="text" 
              name="litter_code" 
              value={formData.litter_code} 
              onChange={handleChange} 
              placeholder="หากเว้นว่าง ระบบจะรันรหัสครอกให้อัตโนมัติ" 
              className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3.5 outline-none focus:border-pink-300 focus:bg-white transition text-sm font-bold text-gray-800"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* พ่อพันธุ์ */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">พ่อพันธุ์ (Sire) <span className="text-pink-500">*</span></label>
              <select 
                name="sire_id" 
                value={formData.sire_id} 
                onChange={handleChange} 
                required 
                className={`w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3.5 outline-none focus:border-pink-300 focus:bg-white transition text-sm font-bold appearance-none cursor-pointer ${formData.sire_id === '' ? 'text-gray-400' : 'text-gray-800'}`}
              >
                <option value="" disabled>เลือกพ่อพันธุ์</option>
                {maleBreeders.map(pet => (
                  <option key={pet.id} value={pet.id}>{pet.name}</option>
                ))}
              </select>
            </div>
            
            {/* แม่พันธุ์ */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">แม่พันธุ์ (Dam) <span className="text-pink-500">*</span></label>
              <select 
                name="dam_id" 
                value={formData.dam_id} 
                onChange={handleChange} 
                required 
                className={`w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3.5 outline-none focus:border-pink-300 focus:bg-white transition text-sm font-bold appearance-none cursor-pointer ${formData.dam_id === '' ? 'text-gray-400' : 'text-gray-800'}`}
              >
                <option value="" disabled>เลือกแม่พันธุ์</option>
                {femaleBreeders.map(pet => {
                  const isTooShort = typeof pet.months_rested === 'number' && pet.months_rested < 6;
                  let warningText = '';
                  if (isTooShort) {
                    const displayMonths = pet.months_rested! < 1 ? 'น้อยกว่า 1' : Math.floor(pet.months_rested!);
                    warningText = `( พักท้อง${displayMonths} เดือน)`;
                  }
                  return (
                    <option key={pet.id} value={pet.id}>
                      {pet.name} {warningText}
                    </option>
                  )
                })}
              </select>

              {/* แจ้งเตือนพักท้องน้อยไป (แสดงเนียนๆ ใต้ช่องกรอก) */}
              {isDamRestingTooShort && typeof selectedDam?.months_rested === 'number' && (
                <div className="mt-2 text-[11px] font-bold text-orange-500 bg-orange-50 px-3 py-2 rounded-xl animate-in fade-in">
                  ⚠️ แม่พันธุ์พักท้องมา {selectedDam.months_rested < 1 ? 'น้อยกว่า 1' : Math.floor(selectedDam.months_rested)} เดือน (ควรพัก 6 เดือนขึ้นไป)
                </div>
              )}
              {femaleBreeders.length === 0 && (
                <p className="mt-2 text-[11px] font-bold text-pink-500 ml-1">*แม่พันธุ์ในฟาร์มกำลังตั้งท้องทั้งหมด</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* วันที่เริ่มทับ */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">วันที่เริ่มทับ / บรีด <span className="text-pink-500">*</span></label>
              <input 
                type="date" 
                name="mating_date" 
                value={formData.mating_date} 
                onChange={handleMatingDateChange} 
                required 
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-0 py-3.5 outline-none focus:border-pink-300 focus:bg-white transition text-sm font-bold text-gray-800 text-center" 
              />
            </div>
            
            {/* วันกำหนดคลอด */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">📅 วันกำหนดคลอดโดยประมาณ (65 วัน)</label>
              <input 
                type="date" 
                name="expected_birth_date" 
                value={formData.expected_birth_date} 
                onChange={handleChange} 
                required 
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-0 py-3.5 outline-none focus:border-pink-300 focus:bg-white transition text-sm font-bold text-gray-800 text-center" 
              />
              <p className="text-[10px] sm:text-xs text-gray-400 mt-1.5 leading-tight font-medium">*แก้ได้หากหมอประเมินคลาดเคลื่อน (วันคลอดอาจ +- เป็น 62 - 68 วัน)</p>
            </div>
          </div>

          <div className="pt-4">
            <button 
              type="submit" 
              disabled={isLoading} 
              className={`w-full py-4 rounded-2xl font-black text-white transition-all shadow-lg active:scale-[0.98] flex justify-center items-center gap-2 ${isLoading ? 'bg-gray-400 shadow-none' : 'bg-pink-500 hover:bg-pink-600 shadow-pink-200'}`}
            >
              {isLoading ? '⏳ กำลังบันทึก...' : ' 🤍 ยืนยันบันทึกการจับคู่'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}