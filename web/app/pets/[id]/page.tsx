"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

// ─── Premium CI Tokens ─────────────────────────────────────────────────────
const F = {
  ink: '#111827',
  inkSoft: '#4B5563',
  muted: '#9CA3AF',
  pink: '#E84677',
  pinkSoft: '#FDF2F5',
  teal: '#0D9488',
  tealSoft: '#F0FDFA',
  line: '#E5E7EB',
  paper: '#FFFFFF',
};

// ─── Elegant Minimal Icons ──────────────────────────────────────────────────
const Icon = {
  ArrowLeft: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>,
  Edit: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  Paw: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="4" r="2"/><circle cx="18" cy="8" r="2"/><circle cx="20" cy="16" r="2"/><path d="M9 10a5 5 0 0 1 5 5v3.5a3.5 3.5 0 0 1-6.84 1.045Q6.52 17.48 4.46 16.84A3.5 3.5 0 0 1 5.5 10Z"/></svg>,
  Male: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="10" cy="14" r="5"/><line x1="13.5" y1="10.5" x2="21" y2="3"/><polyline points="16 3 21 3 21 8"/></svg>,
  Female: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="10" r="5"/><line x1="12" y1="15" x2="12" y2="21"/><line x1="9" y1="18" x2="15" y2="18"/></svg>,
  Dna: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 15c6.667-6 13.333 0 20-6"/><path d="M9 22c1.798-1.598 3.597-1.198 5.397 0"/><path d="M9 2c1.798 1.598 3.597 1.198 5.397 0"/><path d="M2 9c6.667 6 13.333 0 20 6"/><path d="M12 10v4"/><path d="M16 11v2"/><path d="M8 11v2"/></svg>,
  HeartPulse: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/><path d="M3.22 12H9.5l.5-1 2 4.5 2-7 1.5 3.5h5.27"/></svg>,
  Timeline: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg>,
  User: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  Gallery: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>,
  Alert: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
  Syringe: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 2 4 4"/><path d="m17 7 3-3"/><path d="M19 9 8.7 19.3c-1 1-2.5 1-3.4 0l-.6-.6c-1-1-1-2.5 0-3.4L15 5"/><path d="m9 11 4 4"/><path d="m5 19-3 3"/><path d="m14 4 6 6"/></svg>,
  IDCard: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><line x1="7" y1="8" x2="17" y2="8"/><line x1="7" y1="12" x2="17" y2="12"/><line x1="7" y1="16" x2="12" y2="16"/></svg>,
};

export default function PetDetailPage() {
  const router = useRouter();
  const params = useParams();
  const petId = params.id as string;

  const [pet, setPet] = useState<any>(null);
  const [vaccines, setVaccines] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [owner, setOwner] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 🌟 Formatting Helpers
  const displayVal = (val: any, suffix = '') => val ? `${val}${suffix}` : '-';
  const parseGallery = (urls: string) => {
    if (!urls) return [];
    try { return JSON.parse(urls); } catch { return urls.split(','); }
  };

  useEffect(() => {
    if (petId) fetchPetData();
  }, [petId]);

  const fetchPetData = async () => {
    try {
      setIsLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return router.push('/login');

      // 🌟 Fetch Pet + Nested Pedigree Logic
      const { data: petData, error: petError } = await supabase
        .from('pets')
        .select(`
          *,
          sire:sire_id(id, name, image_url, breed, sire:sire_id(id, name), dam:dam_id(id, name)),
          dam:dam_id(id, name, image_url, breed, sire:sire_id(id, name), dam:dam_id(id, name)),
          farm:farm_id(farm_name)
        `)
        .eq('id', petId)
        .single();
      
      if (petError) throw petError;
      setPet(petData);

      // Fetch Owner (User)
      if (petData.user_id) {
        const { data: ownerData } = await supabase.from('users').select('full_name, avatar_url, phone').eq('id', petData.user_id).single();
        if (ownerData) setOwner(ownerData);
      }

      // Fetch Vaccines
      const { data: vaccineData } = await supabase.from('vaccines').select('*').eq('pet_id', petId).order('date_given', { ascending: false });
      if (vaccineData) setVaccines(vaccineData);

      // Fetch Activities
      const { data: activityData } = await supabase.from('pet_activities').select('*').eq('pet_id', petId).order('activity_date', { ascending: false });
      if (activityData) setActivities(activityData);

    } catch (error) {
      console.error("Fetch Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateAge = (birthDate: string | null) => {
    if (!birthDate) return '-';
    const dob = new Date(birthDate);
    const today = new Date();
    let years = today.getFullYear() - dob.getFullYear();
    let months = today.getMonth() - dob.getMonth();
    if (months < 0) { years--; months += 12; }
    if (years === 0 && months === 0) return 'เพิ่งเกิด';
    return `${years > 0 ? years + ' ปี ' : ''}${months > 0 ? months + ' เดือน' : ''}`;
  };

  // 🌟 Logic: ผสมข้อมูลเข้าด้วยกันสำหรับ Master Timeline
  const generateCombinedTimeline = () => {
    const timeline: any[] = [];

    // 1. เพิ่มวันเกิด
    if (pet?.birth_date) {
      timeline.push({
        id: 'birth',
        date: pet.birth_date,
        title: '🎉 เกิด / รับมาเลี้ยง',
        description: `ยินดีต้อนรับ ${pet.name} เข้าสู่ระบบ!`,
        type: 'กำเนิด',
        color: 'bg-pink-400'
      });
    }

    // 2. เพิ่มประวัติวัคซีน
    vaccines.forEach(v => {
      timeline.push({
        id: `vac-${v.id}`,
        date: v.date_given,
        title: `💉 วัคซีน: ${v.vaccine_name}`,
        description: v.notes || 'รับวัคซีนเรียบร้อย',
        type: 'วัคซีน',
        color: 'bg-teal-400'
      });
    });

    // 3. เพิ่มกิจกรรมทั่วไป (หาหมอ, หยดยา, ฯลฯ)
    activities.forEach(a => {
      // ตั้งสีจุดไข่ปลาตามประเภทกิจกรรม
      let color = 'bg-orange-400'; 
      if (a.activity_type === 'หาหมอ' || a.activity_type?.includes('หมอ')) color = 'bg-red-400';
      if (a.activity_type === 'หยดเห็บหมัด' || a.activity_type?.includes('พยาธิ')) color = 'bg-blue-400';

      timeline.push({
        id: `act-${a.id}`,
        date: a.activity_date,
        title: a.title,
        description: a.description,
        type: a.activity_type || 'ทั่วไป',
        color: color
      });
    });

    // เรียงลำดับจากเหตุการณ์ล่าสุด -> เก่าสุด
    timeline.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return timeline;
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center text-pink-500 font-bold animate-pulse uppercase tracking-widest text-sm">Loading Profile...</div>;
  if (!pet) return <div className="min-h-screen flex items-center justify-center font-bold text-gray-400">ไม่พบข้อมูลสัตว์เลี้ยง</div>;

  const isMale = pet.gender === 'male' || pet.gender === 'ตัวผู้';
  const galleryImages = parseGallery(pet.gallery_urls);
  const combinedTimeline = generateCombinedTimeline();

  return (
    <div className="min-h-screen pb-24 bg-gray-50" style={{ fontFamily: 'var(--font-ui)', color: F.ink }}>

      {/* 🔙 Top Bar */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded-full transition-colors -ml-2">
            <Icon.ArrowLeft />
          </button>
          <span className="font-extrabold text-gray-900 tracking-tight">ข้อมูลสัตว์เลี้ยง</span>
          <div className="w-10"></div> {/* Spacer */}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 mt-6 space-y-6">

        {/* 📸 HERO CARD: รูปประจำตัว & ชื่อ */}
        <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100">
          <div className="flex flex-col items-center text-center">
            <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full overflow-hidden bg-gray-100 shadow-md mb-4 border-4 border-white relative">
              {pet.image_url ? (
                <img src={pet.image_url} className="w-full h-full object-cover" alt={pet.name} />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-pink-50 text-pink-200">
                  <Icon.Paw />
                </div>
              )}
              {/* Badge เพศลอยทับรูป */}
              <div className={`absolute bottom-1 right-1 w-8 h-8 rounded-full flex items-center justify-center border-2 border-white shadow-sm ${isMale ? 'bg-blue-100 text-blue-600' : 'bg-pink-100 text-pink-600'}`}>
                {isMale ? <Icon.Male /> : <Icon.Female />}
              </div>
            </div>

            <h1 className="text-3xl font-black text-gray-900 tracking-tight">{pet.name}</h1>
            <p className="text-sm font-bold text-gray-500 mt-1">
              {pet.breed || 'ไม่ระบุสายพันธุ์'} • อายุ {calculateAge(pet.birth_date)} 
            </p>
            {pet.farm && <p className="text-sm font-bold text-pink-500 mt-1">🏡 {pet.farm.farm_name}</p>}

            <div className="mt-4 inline-flex items-center px-4 py-1.5 rounded-full text-xs font-bold bg-green-50 text-green-600 border border-green-100 uppercase tracking-widest">
              {pet.status || 'Active'}
            </div>
          </div>
        </div>

        {/* 🎛️ Action Buttons (Pills) */}
        <div className="grid grid-cols-3 gap-3">
          <Link href={`/pets/${pet.id}/edit`} className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-white border border-gray-100 hover:border-pink-200 hover:shadow-sm transition-all text-gray-700 active:scale-95 text-center">
            <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-600"><Icon.Edit /></div>
            <span className="text-xs font-bold">แก้ไขประวัติ</span>
          </Link>
          <Link href={`/pets/${pet.id}/vaccines`} className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-white border border-gray-100 hover:border-teal-200 hover:shadow-sm transition-all text-gray-700 active:scale-95 text-center">
            <div className="w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center text-teal-600"><Icon.Syringe /></div>
            <span className="text-xs font-bold">สมุดสุขภาพ</span>
          </Link>
          <Link href={`/pets/${pet.id}/id-card`} className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-white border border-gray-100 hover:border-pink-200 hover:shadow-sm transition-all text-gray-700 active:scale-95 text-center">
            <div className="w-10 h-10 rounded-full bg-pink-50 flex items-center justify-center text-pink-500"><Icon.IDCard /></div>
            <span className="text-xs font-bold">ID Card</span>
          </Link>
        </div>

        {/* 📋 1. ข้อมูลพื้นฐาน (Basic Info) */}
        <div className="bg-white rounded-[2rem] p-6 sm:p-8 border border-gray-100 shadow-sm">
          <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-6 flex items-center gap-2">
            <span className="p-2 bg-gray-50 text-gray-500 rounded-xl"><Icon.Paw /></span> ข้อมูลพื้นฐาน
          </h3>
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {[
              { label: 'วันเกิด', val: pet.birth_date ? new Date(pet.birth_date).toLocaleDateString('th-TH') : '-' },
              { label: 'น้ำหนัก', val: displayVal(pet.weight, ' กก.') },
              { label: 'สี (Color)', val: displayVal(pet.color) },
              { label: 'แพทเทิร์น', val: displayVal(pet.pattern) },
              { label: 'ลักษณะขน', val: displayVal(pet.coat) },
              { label: 'สีตา', val: displayVal(pet.eye_color) },
              { label: 'Microchip No.', val: pet.microchip_number || '-' },
              { label: 'Pedigree No.', val: pet.pedigree_number || '-' },
            ].map((item, idx) => (
              <div key={idx} className={`bg-gray-50 p-4 rounded-2xl border border-gray-100 ${idx >= 6 ? 'col-span-2 sm:col-span-1' : ''}`}>
                <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">{item.label}</p>
                <p className={`text-sm font-bold text-gray-900 ${idx >= 6 ? 'font-mono' : ''}`}>{item.val}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 🧬 2. ประวัติสายเลือด (Perfect Flexbox Tree) */}
        <div className="bg-white rounded-[2rem] p-6 sm:p-8 border border-gray-100 shadow-sm overflow-hidden">
          <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-4 flex items-center gap-2">
            <span className="p-2 bg-blue-50 text-blue-500 rounded-xl"><Icon.Dna /></span> ประวัติสายเลือด (Pedigree)
          </h3>
          
          <div className="overflow-x-auto custom-scrollbar pb-4 -mx-6 px-6 sm:mx-0 sm:px-0">
            <div className="min-w-max flex items-center py-4">
              
              {/* ─── Gen 1: สัตว์เลี้ยง (Subject) ─── */}
              <div className="flex flex-col justify-center z-10">
                <div className="bg-white border-2 border-pink-100 p-4 rounded-[1.5rem] shadow-sm flex flex-col items-center w-36">
                  <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-50 border-2 border-white shadow-sm mb-2.5 shrink-0 flex items-center justify-center">
                    {pet.image_url ? <img src={pet.image_url} className="w-full h-full object-cover"/> : <span className="text-gray-300"><Icon.Paw /></span>}
                  </div>
                  <span className="text-[9px] font-bold text-pink-500 bg-pink-50 px-2 py-1 rounded mb-1 uppercase tracking-wider">สัตว์เลี้ยง</span>
                  <p className="text-sm font-black text-gray-900 w-full truncate text-center">{pet.name}</p>
                </div>
              </div>

              {/* เส้นเชื่อม Gen 1 ไปแกนกลาง Gen 2 */}
              <div className="w-8 h-[2px] bg-gray-200 shrink-0"></div>

              {/* ─── แกนกลาง Gen 2 & Gen 3 ─── */}
              <div className="flex flex-col">

                {/* --- สายเลือดฝั่งพ่อ (Sire Branch) --- */}
                <div className="flex items-center relative py-6">
                  <div className="absolute left-0 top-1/2 bottom-0 w-[2px] bg-gray-200"></div>
                  <div className="w-8 h-[2px] bg-gray-200 shrink-0"></div>

                  <Link href={pet.sire ? `/pets/${pet.sire.id}` : '#'} className={`flex items-center gap-3 bg-white p-3 rounded-2xl w-48 sm:w-56 z-10 transition-all ${pet.sire ? 'border border-blue-100 shadow-sm hover:border-blue-300' : 'border border-dashed border-gray-200'}`}>
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-blue-50 border border-blue-100 shrink-0 flex items-center justify-center">
                      {pet.sire?.image_url ? <img src={pet.sire.image_url} className="w-full h-full object-cover"/> : <span className="text-blue-300 font-bold">♂</span>}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[9px] text-blue-500 font-bold uppercase mb-0.5 flex items-center gap-1"><Icon.Male /> พ่อ (Sire)</p>
                      <p className="text-sm font-black text-gray-900 truncate">{pet.sire?.name || 'ไม่ระบุ'}</p>
                    </div>
                  </Link>

                  <div className="w-8 h-[2px] bg-gray-200 shrink-0"></div>

                  {/* Sire's Parents (Gen 3) */}
                  <div className="flex flex-col">
                    <div className="flex items-center relative py-3">
                      <div className="absolute left-0 top-1/2 bottom-0 w-[2px] bg-gray-200"></div>
                      <div className="w-8 h-[2px] bg-gray-200 shrink-0"></div>
                      <div className="bg-white border border-gray-100 p-3 rounded-xl shadow-sm z-10 w-32 sm:w-40">
                        <p className="text-[9px] text-blue-400 font-bold uppercase mb-0.5">ปู่ (Grandsire)</p>
                        <p className="text-xs font-bold text-gray-800 truncate">{pet.paternal_grandsire || pet.sire?.sire?.name || 'ไม่ระบุ'}</p>
                      </div>
                    </div>
                    <div className="flex items-center relative py-3">
                      <div className="absolute left-0 top-0 bottom-1/2 w-[2px] bg-gray-200"></div>
                      <div className="w-8 h-[2px] bg-gray-200 shrink-0"></div>
                      <div className="bg-white border border-gray-100 p-3 rounded-xl shadow-sm z-10 w-32 sm:w-40">
                        <p className="text-[9px] text-pink-400 font-bold uppercase mb-0.5">ย่า (Granddam)</p>
                        <p className="text-xs font-bold text-gray-800 truncate">{pet.paternal_granddam || pet.sire?.dam?.name || 'ไม่ระบุ'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* --- สายเลือดฝั่งแม่ (Dam Branch) --- */}
                <div className="flex items-center relative py-6">
                  <div className="absolute left-0 top-0 bottom-1/2 w-[2px] bg-gray-200"></div>
                  <div className="w-8 h-[2px] bg-gray-200 shrink-0"></div>

                  <Link href={pet.dam ? `/pets/${pet.dam.id}` : '#'} className={`flex items-center gap-3 bg-white p-3 rounded-2xl w-48 sm:w-56 z-10 transition-all ${pet.dam ? 'border border-pink-100 shadow-sm hover:border-pink-300' : 'border border-dashed border-gray-200'}`}>
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-pink-50 border border-pink-100 shrink-0 flex items-center justify-center">
                      {pet.dam?.image_url ? <img src={pet.dam.image_url} className="w-full h-full object-cover"/> : <span className="text-pink-300 font-bold">♀</span>}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[9px] text-pink-500 font-bold uppercase mb-0.5 flex items-center gap-1"><Icon.Female /> แม่ (Dam)</p>
                      <p className="text-sm font-black text-gray-900 truncate">{pet.dam?.name || 'ไม่ระบุ'}</p>
                    </div>
                  </Link>

                  <div className="w-8 h-[2px] bg-gray-200 shrink-0"></div>

                  {/* Dam's Parents (Gen 3) */}
                  <div className="flex flex-col">
                    <div className="flex items-center relative py-3">
                      <div className="absolute left-0 top-1/2 bottom-0 w-[2px] bg-gray-200"></div>
                      <div className="w-8 h-[2px] bg-gray-200 shrink-0"></div>
                      <div className="bg-white border border-gray-100 p-3 rounded-xl shadow-sm z-10 w-32 sm:w-40">
                        <p className="text-[9px] text-blue-400 font-bold uppercase mb-0.5">ตา (Grandsire)</p>
                        <p className="text-xs font-bold text-gray-800 truncate">{pet.maternal_grandsire || pet.dam?.sire?.name || 'ไม่ระบุ'}</p>
                      </div>
                    </div>
                    <div className="flex items-center relative py-3">
                      <div className="absolute left-0 top-0 bottom-1/2 w-[2px] bg-gray-200"></div>
                      <div className="w-8 h-[2px] bg-gray-200 shrink-0"></div>
                      <div className="bg-white border border-gray-100 p-3 rounded-xl shadow-sm z-10 w-32 sm:w-40">
                        <p className="text-[9px] text-pink-400 font-bold uppercase mb-0.5">ยาย (Granddam)</p>
                        <p className="text-xs font-bold text-gray-800 truncate">{pet.maternal_granddam || pet.dam?.dam?.name || 'ไม่ระบุ'}</p>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>

        {/* 🏥 3. ข้อมูลสุขภาพ (Health Profile) */}
        <div className="bg-white rounded-[2rem] p-6 sm:p-8 border border-gray-100 shadow-sm">
          <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-6 flex items-center gap-2">
            <span className="p-2 bg-red-50 text-red-500 rounded-xl"><Icon.HeartPulse /></span> ข้อมูลสุขภาพ
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex justify-between items-center">
              <span className="text-xs font-bold text-gray-500">กรุ๊ปเลือด</span>
              <span className="text-sm font-black text-red-500">{pet.blood_type || '-'}</span>
            </div>
            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex justify-between items-center">
              <span className="text-xs font-bold text-gray-500">สถานะทำหมัน</span>
              <span className="text-sm font-bold text-gray-900">{pet.is_neutered ? 'ทำแล้ว' : 'ยังไม่ทำ'}</span>
            </div>
            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 sm:col-span-2 flex justify-between items-center">
              <span className="text-xs font-bold text-gray-500">โรคประจำตัว</span>
              <span className="text-sm font-bold text-gray-900">{pet.chronic_diseases || 'ไม่มี'}</span>
            </div>
          </div>

          {/* Warnings (Allergies / Notes) */}
          {(pet.allergies || pet.traits || pet.health_notes) && (
            <div className="space-y-3">
              {pet.allergies && (
                <div className="bg-red-50 p-4 rounded-2xl border border-red-100">
                  <p className="text-[10px] font-bold text-red-500 uppercase flex items-center gap-1 mb-1.5"><Icon.Alert /> สิ่งที่แพ้ (Allergies)</p>
                  <p className="text-xs font-bold text-red-900 leading-relaxed">{pet.allergies}</p>
                </div>
              )}
              {(pet.traits || pet.health_notes) && (
                <div className="bg-yellow-50 p-4 rounded-2xl border border-yellow-100">
                  <p className="text-[10px] font-bold text-yellow-600 uppercase flex items-center gap-1 mb-1.5"><Icon.Edit /> หมายเหตุ / นิสัย</p>
                  <p className="text-xs font-bold text-yellow-900 leading-relaxed">{pet.traits} {pet.health_notes}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ⏳ 4. ไทม์ไลน์กิจกรรม (Unified Master Timeline) */}
        <div className="bg-white rounded-[2rem] p-6 sm:p-8 border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
              <span className="p-2 bg-orange-50 text-orange-500 rounded-xl"><Icon.Timeline /></span> ไทม์ไลน์บันทึกทั้งหมด
            </h3>
            <button className="text-[10px] font-bold text-pink-500 bg-pink-50 px-3 py-1.5 rounded-lg hover:bg-pink-100 transition-colors">+ เพิ่มกิจกรรม</button>
          </div>
          
          {combinedTimeline.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-xs font-bold border-2 border-dashed border-gray-100 rounded-3xl">ยังไม่มีบันทึกข้อมูลใดๆ</div>
          ) : (
            <div className="relative border-l-2 border-gray-100 ml-3 pl-6 space-y-8">
              {combinedTimeline.map((item) => (
                <div key={item.id} className="relative group">
                  {/* จุดไข่ปลาเปลี่ยนสีตามประเภท */}
                  <div className={`absolute -left-[31px] top-1 w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm group-hover:scale-150 transition-transform ${item.color}`} />
                  
                  <p className="text-[10px] font-bold text-gray-400 mb-1">{new Date(item.date).toLocaleDateString('th-TH')}</p>
                  <p className="text-sm font-bold text-gray-900">{item.title}</p>
                  {item.description && <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">{item.description}</p>}
                  
                  <span className="inline-block mt-2 text-[9px] font-bold uppercase px-2 py-1 bg-gray-50 border border-gray-100 text-gray-500 rounded-md">
                    {item.type}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 🖼️ 5. แกลลอรี่ (Gallery) */}
        {galleryImages.length > 0 && (
          <div className="bg-white rounded-[2rem] p-6 sm:p-8 border border-gray-100 shadow-sm">
            <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-6 flex items-center gap-2">
              <span className="p-2 bg-purple-50 text-purple-500 rounded-xl"><Icon.Gallery /></span> แกลลอรี่
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {galleryImages.map((img: string, i: number) => (
                <div key={i} className="aspect-square rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
                  <img src={img} className="w-full h-full object-cover hover:scale-110 transition-transform duration-500" />
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}