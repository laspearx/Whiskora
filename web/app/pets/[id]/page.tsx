"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

export default function PetDetailPage() {
  const router = useRouter();
  const params = useParams();
  const petId = params.id as string;

  const [pet, setPet] = useState<any>(null);
  const [vaccines, setVaccines] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const formatBreed = (breedStr: string) => {
    if (!breedStr) return { th: "ไม่ระบุสายพันธุ์", en: "" };
    const parts = breedStr.split('(');
    if (parts.length > 1) {
      return { th: parts[0].trim(), en: "(" + parts[1].trim() };
    }
    return { th: breedStr, en: "" };
  };

  useEffect(() => {
    if (petId) fetchPetData();
  }, [petId]);

  const fetchPetData = async () => {
    try {
      setIsLoading(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }

      const { data: petData, error: petError } = await supabase
        .from('pets') 
        .select('*')
        .eq('id', petId)
        .eq('user_id', session.user.id) 
        .single();
        
      if (petError) throw petError;
      setPet(petData);

      // 🌟 ดึงข้อมูลวัคซีน (เปลี่ยนจาก pet_id เป็น cat_id ตามฐานข้อมูลของชัช)
      const { data: vaccineData } = await supabase
        .from('vaccines')
        .select('*')
        .eq('pet_id', petId)
        .order('date_given', { ascending: false }); // ดึงโดยเรียงจากใหม่ไปเก่า
        
      if (vaccineData) setVaccines(vaccineData);

    } catch (error) {
      console.error("Fetch Data Error:", error);
      alert('ไม่พบข้อมูลสัตว์เลี้ยงตัวนี้ครับ หรือคุณอาจจะไม่มีสิทธิ์เข้าถึง');
      router.push('/profile');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateAgeDetail = (birthDate: string | null) => {
    if (!birthDate) return 'ไม่ระบุวันเกิด';
    const dob = new Date(birthDate);
    const today = new Date();
    
    let years = today.getFullYear() - dob.getFullYear();
    let months = today.getMonth() - dob.getMonth();
    let days = today.getDate() - dob.getDate();

    if (days < 0) {
      months--;
      const lastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
      days += lastMonth.getDate();
    }
    if (months < 0) {
      years--;
      months += 12;
    }

    const ageParts = [];
    if (years > 0) ageParts.push(`${years} ปี`);
    if (months > 0) ageParts.push(`${months} เดือน`);
    if (days > 0) ageParts.push(`${days} วัน`);

    if (ageParts.length === 0) return "เพิ่งเกิดวันนี้";
    return ageParts.join(' ');
  };

  // 🌟 ฟังก์ชันจัดกลุ่มวัคซีน (ดึงประเภทที่ไม่ซ้ำกัน และหารายการล่าสุดของแต่ละประเภท)
  const getGroupedVaccines = () => {
    const uniqueTypes = [...new Set(vaccines.map(v => v.vaccine_name))];
    return uniqueTypes.map(type => {
      // เนื่องจากเรา order descending มาแล้ว ตัวแรกที่เจอ (index 0) คือตัวล่าสุด
      const records = vaccines.filter(v => v.vaccine_name === type);
      return {
        name: type,
        latestRecord: records[0],
        totalCount: records.length
      };
    });
  };

  const groupedVaccines = getGroupedVaccines();

  if (isLoading) return <div className="min-h-screen flex items-center justify-center text-pink-500 font-bold animate-pulse">🐾 WHISKORA...</div>;
  if (!pet) return null;

  const breeds = formatBreed(pet.breed);

  return (
    <div className="min-h-screen bg-white pb-20 animate-in fade-in duration-700">

      <div className="max-w-3xl mx-auto px-4 mt-4 md:mt-8 space-y-6">
        
        {/* 🔙 Header แบบใหม่ (ย้ายโค้ดปุ่มที่หลุดเข้ามาใส่ตรงนี้) */}
        <div className="flex items-center gap-4">
          <button 
            onClick={() => {
              if (pet?.farm_id && pet.farm_id !== 'PERSONAL') {
                router.push(`/farm-dashboard/${pet.farm_id}/pets`); // กลับไปลิสต์สมาชิกฟาร์ม
              } else {
                router.push('/profile/pets'); // สัตว์เลี้ยงส่วนตัว ให้กลับหน้าสรุปสัตว์เลี้ยงโปรไฟล์
              }
            }}
            className="w-10 h-10 flex items-center justify-center bg-white hover:bg-pink-50 text-gray-400 hover:text-pink-600 rounded-xl transition shadow-sm border border-gray-100"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-xl md:text-2xl font-black text-gray-800 tracking-tight">โปรไฟล์สัตว์เลี้ยง</h1>
          </div>
        </div>
        
        {/* Pet Hero Card */}
        <div className="bg-white rounded-[2.5rem] border border-gray-100 p-6 md:p-8 flex flex-col md:flex-row gap-6 md:gap-10 items-center md:items-start relative shadow-sm">
          
          <Link href={`/pets/${pet.id}/edit`} className="absolute top-5 right-5 text-xs bg-blue-50 text-blue-500 hover:bg-blue-100 px-4 py-2 rounded-xl font-bold transition-all border border-blue-100 shadow-sm">
            แก้ไขข้อมูล ✎
          </Link>

          <div className="w-32 h-32 md:w-36 md:h-36 shrink-0 relative rounded-full overflow-hidden bg-gray-50 border-4 border-white shadow-md mt-6 md:mt-0">
            {pet.image_url ? (
              <img src={pet.image_url} alt={pet.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-5xl">🐾</div>
            )}
          </div>
          
          <div className="flex-1 w-full text-center md:text-left">
            <div className="flex flex-col md:flex-row md:items-center gap-2 mb-2">
              <h1 className="text-2xl md:text-3xl font-black text-gray-800">{pet.name}</h1>
              <span className={`inline-block px-3 py-0.5 rounded-full text-xs font-bold border self-center md:self-auto ${
                pet.gender === 'male' || pet.gender === 'ตัวผู้' ? 'bg-blue-50 text-blue-500 border-blue-100' : 'bg-pink-50 text-pink-500 border-pink-100'
              }`}>
                {pet.gender === 'male' || pet.gender === 'ตัวผู้' ? '♂ ตัวผู้' : '♀ ตัวเมีย'}
              </span>
            </div>

            <div className="mb-4">
              <p className="text-gray-700 font-bold text-base leading-tight">{breeds.th}</p>
              <p className="text-gray-400 font-medium text-xs mt-0.5 leading-relaxed">{breeds.en}</p>
            </div>
            
            <div className="space-y-3">
              <div className="flex flex-col md:flex-row gap-4 md:gap-8 items-center md:items-start">
                <div className="w-full md:w-auto text-center md:text-left">
                  <p className="text-xs text-gray-400 font-bold uppercase mb-0.5">วันเกิด & อายุละเอียด</p>
                  <p className="text-gray-700 font-bold text-sm">
                    {(pet.birth_date || pet.birthdate) ? new Date(pet.birth_date || pet.birthdate).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }) : 'ไม่ระบุ'} 
                    <span className="text-pink-500 ml-1.5 font-black">({calculateAgeDetail(pet.birth_date || pet.birthdate)})</span>
                  </p>
                </div>

                <div className="w-full md:w-auto text-center md:text-left">
                  <p className="text-xs text-gray-400 font-bold uppercase mb-0.5">ประเภทสัตว์เลี้ยง</p>
                  <p className="text-gray-700 font-black text-sm">
                    {pet.species === 'cat' ? '🐱 แมว' : pet.species === 'dog' ? '🐶 หมา' : `🐾 ${pet.species || 'ไม่ระบุ'}`}
                  </p>
                </div>
              </div>

              {(pet.allergies || pet.traits) && (
                 <div className="flex flex-col md:flex-row gap-4 md:gap-8">                  
                    {pet.traits && (
                    <div className="w-full md:w-auto text-center md:text-left mt-2">
                      <p className="text-xs text-gray-400 font-bold uppercase mb-0.5">หมายเหตุ</p>
                      <p className="text-gray-600 font-bold text-sm">{pet.traits}</p>
                    </div>
                  )}
                  {pet.allergies && (
                    <div className="w-full md:w-auto text-center md:text-left mt-2">
                      <p className="text-xs text-red-400 font-bold uppercase mb-0.5">สิ่งที่แพ้</p>
                      <p className="text-red-600 font-bold text-sm">{pet.allergies}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 🌟 ปุ่มสร้างบัตรประจำตัวสัตว์เลี้ยง (เพิ่มใหม่) */}
            <div className="mt-6">
              <Link 
                href={`/pets/${pet.id}/id-card`} 
                className="flex items-center justify-center gap-2 w-full md:w-auto px-6 py-3.5 bg-gradient-to-r from-pink-500 to-rose-500 text-white font-black rounded-2xl transition-all shadow-lg shadow-pink-200 hover:scale-[1.02] active:scale-95 text-sm"
              >
                <span className="text-lg">🪪</span> สร้างบัตรประจำตัวน้อง {pet.name}
              </Link>
            </div>

          </div>
        </div>

        {/* 🌟 Vaccine Section (Updated Layout) */}
        <div className="bg-white rounded-[2rem] border border-gray-100 p-6 md:p-8 shadow-sm">
          
          {/* Header & Buttons */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <h2 className="text-lg font-black text-teal-600 flex items-center gap-2">
              💉 สมุดวัคซีน
            </h2>
            <div className="flex gap-2 w-full sm:w-auto">
              <Link href={`/pets/${pet.id}/vaccines`} className="flex-1 sm:flex-none text-center text-xs bg-gray-50 text-gray-600 px-4 py-2.5 rounded-lg font-bold hover:bg-gray-100 transition-all border border-gray-100">
                📋 ดูประวัติทั้งหมด
              </Link>
              <Link href={`/pets/${pet.id}/vaccines/create`} className="flex-1 sm:flex-none text-center text-xs bg-teal-50 text-teal-600 px-4 py-2.5 rounded-lg font-bold hover:bg-teal-100 transition-all">
                + เพิ่มประวัติ
              </Link>
            </div>
          </div>

          {groupedVaccines.length === 0 ? (
            <div className="text-center py-10 text-gray-300 font-bold text-sm border-2 border-dashed border-gray-50 rounded-2xl uppercase tracking-widest">
              ยังไม่มีข้อมูลในสมุดพก
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {groupedVaccines.map((group, idx) => (
                <Link key={idx} href={`/pets/${pet.id}/vaccines?type=${encodeURIComponent(group.name)}`} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-4 hover:border-teal-300 hover:shadow-md transition-all group block">
                  
                  {/* หัวการ์ด */}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-teal-50 text-teal-500 rounded-xl flex items-center justify-center text-lg shrink-0 border border-teal-50 group-hover:scale-110 transition-transform">
                      {group.name.includes('เห็บ') ? '💧' : group.name.includes('พยาธิ') ? '💊' : '💉'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-gray-800 text-sm truncate">{group.name}</p>
                      <p className="text-[10px] text-gray-400 font-bold mt-0.5">บันทึกประวัติแล้ว {group.totalCount} ครั้ง</p>
                    </div>
                    <div className="text-gray-300 group-hover:text-teal-400 transition-colors">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>

                  {/* สรุปข้อมูลล่าสุด */}
                  <div className="bg-gray-50/50 rounded-xl p-3 flex justify-between items-center border border-gray-50">
                    <div>
                      <p className="text-[9px] text-gray-400 font-bold uppercase mb-0.5">ฉีดล่าสุด</p>
                      <p className="text-xs font-bold text-gray-700">{new Date(group.latestRecord.date_given).toLocaleDateString('th-TH')}</p>
                    </div>
                    
                    {group.latestRecord.next_due ? (
                      <div className="text-right">
                        <p className="text-[9px] text-orange-400 font-bold uppercase mb-0.5">นัดครั้งต่อไป</p>
                        <p className="text-xs font-black text-orange-500">{new Date(group.latestRecord.next_due).toLocaleDateString('th-TH')}</p>
                      </div>
                    ) : (
                      <div className="text-right">
                        <p className="text-[9px] text-gray-400 font-bold uppercase mb-0.5">นัดครั้งต่อไป</p>
                        <p className="text-xs font-bold text-gray-400">-</p>
                      </div>
                    )}
                  </div>

                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}