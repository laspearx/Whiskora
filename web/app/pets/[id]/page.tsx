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

  // 🌟 ฟังก์ชันใหม่: แยกภาษาไทยและอังกฤษออกจากกัน
  const splitThaiEnglish = (text: string | null) => {
    if (!text) return { th: '-', en: null };
    const parts = text.split('(');
    if (parts.length > 1) {
      return {
        th: parts[0].trim(),
        en: `(${parts[1].trim()}` // เก็บวงเล็บไว้ด้วย
      };
    }
    return { th: text, en: null };
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

      const { data: vaccineData } = await supabase
        .from('vaccines')
        .select('*')
        .eq('pet_id', petId)
        .order('date_given', { ascending: false }); 
        
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
    if (!birthDate) return 'ไม่ระบุอายุ';
    const dob = new Date(birthDate);
    if (isNaN(dob.getTime())) return 'ไม่ระบุอายุ';
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

  const getGroupedVaccines = () => {
    const uniqueTypes = [...new Set(vaccines.map(v => v.vaccine_name))];
    return uniqueTypes.map(type => {
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

  // 🌟 เตรียมข้อมูลสายพันธุ์และสี
  const breedData = splitThaiEnglish(pet.breed);
  const colorData = splitThaiEnglish(pet.color);

  return (
    <div className="min-h-screen bg-gray-50 pb-20 animate-in fade-in duration-700">

      <div className="max-w-3xl mx-auto px-4 mt-4 md:mt-8 space-y-6">
        
        {/* 🔙 Header */}
        <div className="flex items-center gap-4">
          <button 
            onClick={() => {
              if (pet?.farm_id && pet.farm_id !== 'PERSONAL') {
                router.push(`/farm-dashboard/${pet.farm_id}/pets`); 
              } else {
                router.push('/profile/pets'); 
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
        
        {/* 🌟 Pet Hero Card */}
        <div className="bg-white rounded-[2rem] border border-gray-100 p-6 shadow-sm">
          
          <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
            
            {/* 📸 รูปโปรไฟล์น้อง */}
            <div className="w-28 h-28 md:w-32 md:h-32 shrink-0 relative rounded-full overflow-hidden bg-gray-50 border-4 border-pink-50 shadow-sm">
              {pet.image_url ? (
                <img src={pet.image_url} alt={pet.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-5xl">🐾</div>
              )}
            </div>
            
            {/* 📝 ข้อมูลหลัก & ปุ่ม Action */}
            <div className="flex-1 w-full text-center md:text-left space-y-5">
              
              <div className="flex flex-col md:flex-row justify-between items-center md:items-start gap-4">
                <div>
                  <div className="flex items-center justify-center md:justify-start gap-3 mb-1">
                    <h1 className="text-2xl md:text-3xl font-black text-gray-800 tracking-tight">{pet.name}</h1>
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black tracking-wider uppercase ${
                      pet.gender === 'male' || pet.gender === 'ตัวผู้' ? 'bg-blue-50 text-blue-500' : 'bg-pink-50 text-pink-500'
                    }`}>
                      {pet.gender === 'male' || pet.gender === 'ตัวผู้' ? '♂ Male' : '♀ Female'}
                    </span>
                  </div>
                  <p className="text-sm font-bold text-gray-400">
                    {pet.species === 'cat' ? '🐱 แมว' : pet.species === 'dog' ? '🐶 หมา' : `🐾 ${pet.species || 'ไม่ระบุ'}`}
                  </p>
                </div>

                {/* 🔘 ปุ่มจัดการ */}
                <div className="flex items-center gap-2">
                  <Link href={`/pets/${pet.id}/edit`} className="bg-gray-50 hover:bg-gray-100 text-gray-600 px-4 py-2.5 rounded-xl font-bold transition-all border border-gray-100 text-xs flex items-center gap-2">
                    แก้ไข ✎
                  </Link>
                  <Link href={`/pets/${pet.id}/id-card`} className="bg-pink-50 hover:bg-pink-100 text-pink-600 px-4 py-2.5 rounded-xl font-black transition-all border border-pink-100 text-xs flex items-center gap-2">
                    <span className="text-base leading-none">🪪</span> บัตรประจำตัว
                  </Link>
                </div>
              </div>

              {/* 📊 กล่องข้อมูล (Grid ปรับปรุงใหม่) */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-left">
                
                {/* 🌟 สายพันธุ์ */}
                <div className="bg-gray-50/50 border border-gray-100 rounded-2xl p-3 flex flex-col justify-center">
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">สายพันธุ์</p>
                  <p className="text-sm font-black text-gray-800 truncate">{breedData.th}</p>
                  {breedData.en && <p className="text-xs font-bold text-gray-500 truncate">{breedData.en}</p>}
                </div>

                {/* 🌟 สี */}
                <div className="bg-gray-50/50 border border-gray-100 rounded-2xl p-3 flex flex-col justify-center">
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">สี</p>
                  <p className="text-sm font-black text-gray-800 truncate">{colorData.th}</p>
                  {colorData.en && <p className="text-xs font-bold text-gray-500 truncate">{colorData.en}</p>}
                </div>

                {/* วันเกิด */}
                <div className="bg-gray-50/50 border border-gray-100 rounded-2xl p-3 flex flex-col justify-center">
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">วันเกิด</p>
                  <p className="text-sm font-black text-gray-800 truncate">{(pet.birth_date || pet.birthdate) ? new Date(pet.birth_date || pet.birthdate).toLocaleDateString('th-TH') : '-'}</p>
                </div>

                {/* อายุ */}
                <div className="bg-gray-50/50 border border-gray-100 rounded-2xl p-3 flex flex-col justify-center">
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">อายุ</p>
                  <p className="text-xs font-black text-pink-500 truncate">{calculateAgeDetail(pet.birth_date || pet.birthdate)}</p>
                </div>

              </div>

              {/* ⚠️ ข้อมูลเพิ่มเติม */}
              {(pet.allergies || pet.traits) && (
                <div className="flex flex-col sm:flex-row gap-3 text-left pt-2">
                  {pet.traits && (
                    <div className="flex-1 bg-blue-50/50 border border-blue-100 rounded-2xl p-3.5">
                      <p className="text-[10px] text-blue-400 font-bold uppercase tracking-wider mb-1">📝 หมายเหตุ / นิสัย</p>
                      <p className="text-sm font-bold text-blue-900">{pet.traits}</p>
                    </div>
                  )}
                  {pet.allergies && (
                    <div className="flex-1 bg-red-50/50 border border-red-100 rounded-2xl p-3.5">
                      <p className="text-[10px] text-red-400 font-bold uppercase tracking-wider mb-1">⚠️ สิ่งที่แพ้</p>
                      <p className="text-sm font-bold text-red-900">{pet.allergies}</p>
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>
        </div>

        {/* 🌟 Vaccine Section */}
        <div className="bg-white rounded-[2rem] border border-gray-100 p-6 md:p-8 shadow-sm">
          
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