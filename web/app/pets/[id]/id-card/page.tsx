"use client";

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useParams, useRouter } from 'next/navigation';

// 🎨 ข้อมูลธีมสีของบัตร
const THEMES = {
  pink: { primary: '#db2777', secondary: '#ec4899', bg: '#fdf2f8', circle1: '#fbcfe8', circle2: '#fce7f3' },
  blue: { primary: '#2563eb', secondary: '#3b82f6', bg: '#eff6ff', circle1: '#bfdbfe', circle2: '#dbeafe' },
  green: { primary: '#059669', secondary: '#10b981', bg: '#ecfdf5', circle1: '#a7f3d0', circle2: '#d1fae5' },
  purple: { primary: '#7c3aed', secondary: '#8b5cf6', bg: '#f5f3ff', circle1: '#ddd6fe', circle2: '#ede9fe' },
  yellow: { primary: '#d97706', secondary: '#f59e0b', bg: '#fffbeb', circle1: '#fde68a', circle2: '#fef3c7' },
};

export default function PetIdCardPage() {
  const router = useRouter();
  const params = useParams();
  const petId = params.id as string;

  const [pet, setPet] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [activeTheme, setActiveTheme] = useState<keyof typeof THEMES>('pink');
  const [baseUrl, setBaseUrl] = useState("");

  useEffect(() => {
    // เก็บ Base URL เพื่อเอาไปทำ QR Code
    if (typeof window !== "undefined") {
      setBaseUrl(window.location.origin);
    }

    const fetchPetData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return router.push('/login');

        const { data: petData, error: petError } = await supabase
          .from('pets')
          .select('*')
          .eq('id', petId)
          .single();

        if (petError) throw petError;
        setPet(petData);

        const { data: profileData } = await supabase
          .from('profiles')
          .select('username, full_name, address')
          .eq('id', petData.user_id)
          .single();
          
        if (profileData) setProfile(profileData);

      } catch (error) {
        console.error("Error:", error);
        alert("ไม่พบข้อมูลสัตว์เลี้ยงครับ");
        router.push('/profile');
      } finally {
        setLoading(false);
      }
    };

    fetchPetData();
  }, [petId, router]);

  // 🌟 ฟังก์ชันแชร์ลิงก์โปรไฟล์
  const handleShare = async () => {
    const petUrl = `${baseUrl}/pets/${petId}`;
    const shareData = {
      title: `บัตรประจำตัวของ ${pet?.name} 🐾`,
      text: `ดูประวัติความน่ารักของ ${pet?.name} ได้ที่นี่เลย!`,
      url: petUrl
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // ถ้าไม่รองรับการแชร์ ให้ก๊อปปี้ลิงก์แทน
        await navigator.clipboard.writeText(petUrl);
        alert("✅ คัดลอกลิงก์โปรไฟล์น้องเรียบร้อยแล้ว เอาไปแปะส่งให้เพื่อนได้เลย!");
      }
    } catch (err) {
      console.log("Share cancelled or failed", err);
    }
  };

  const extractEnglish = (text: string | null) => {
    if (!text) return '-';
    const match = text.match(/\(([^)]+)\)/);
    return match ? match[1] : text;
  };

  const extractThai = (text: string | null) => {
    if (!text) return '-';
    return text.split('(')[0].trim(); 
  };

  // 🌟 ฟังก์ชันแปลง UUID เป็นเลข 13 หลักแบบตายตัว (แทร็กได้)
  const generate13DigitId = (uuid: string) => {
    let hash = 0;
    for (let i = 0; i < uuid.length; i++) {
      hash = uuid.charCodeAt(i) + ((hash << 5) - hash);
    }
    const absoluteHash = Math.abs(hash).toString();
    const paddedId = (absoluteHash + "1098765432109").substring(0, 13);
    return `${paddedId.substring(0,1)}-${paddedId.substring(1,5)}-${paddedId.substring(5,10)}-${paddedId.substring(10,12)}-${paddedId.substring(12,13)}`;
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-pink-500 font-bold animate-pulse">กำลังพิมพ์บัตรประชาชน... 🐾</div>;
  if (!pet) return null;

  const formattedId = generate13DigitId(pet.id);
  const safeFormatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleDateString('en-GB'); 
  };

  const t = THEMES[activeTheme];
  const petProfileUrl = `${baseUrl}/pets/${petId}`;

  return (
    <div className="max-w-md mx-auto px-4 pt-6 pb-20 animate-in fade-in duration-700 space-y-6">
      
      {/* 🔙 Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center bg-white hover:bg-gray-50 text-gray-400 rounded-xl transition shadow-sm border border-gray-100">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h1 className="text-xl md:text-2xl font-black text-gray-800 tracking-tight">บัตรประจำตัว 🪪</h1>
          <p className="text-xs font-bold text-gray-500 mt-0.5">Pet Identification Card</p>
        </div>
      </div>

      {/* 🎨 แถบเลือกสี */}
      <div className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100 flex justify-center gap-3">
        {(Object.keys(THEMES) as Array<keyof typeof THEMES>).map((colorKey) => (
          <button
            key={colorKey}
            onClick={() => setActiveTheme(colorKey)}
            className={`w-8 h-8 rounded-full transition-transform ${activeTheme === colorKey ? 'scale-125 ring-2 ring-offset-2 ring-gray-800' : 'hover:scale-110'}`}
            style={{ backgroundColor: THEMES[colorKey].primary }}
            aria-label={`Select ${colorKey} theme`}
          />
        ))}
      </div>

      {/* 💳 ส่วนแสดงบัตร */}
      <div className="flex justify-center drop-shadow-2xl">
        <div 
          className="w-full max-w-[380px] rounded-[1.5rem] overflow-hidden relative border"
          style={{ aspectRatio: '85.6 / 53.98', backgroundColor: '#ffffff', borderColor: '#e5e7eb' }} 
        >
          {/* พื้นหลังตกแต่ง (เปลี่ยนสีตามธีม) */}
          <div className="absolute inset-0 opacity-60" style={{ backgroundColor: t.bg }}></div>
          <div className="absolute top-0 right-0 w-40 h-40 rounded-full opacity-50 -mr-16 -mt-16" style={{ backgroundColor: t.circle1 }}></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full opacity-50 -ml-12 -mb-12" style={{ backgroundColor: t.circle2 }}></div>

          <div className="relative z-10 p-4 h-full flex flex-col">
            
            {/* 📍 Header บัตร */}
            <div className="flex justify-between items-start mb-3 border-b border-gray-200/50 pb-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px]" style={{ backgroundColor: t.primary, color: 'white' }}>🐾</div>
                <div>
                  <h2 className="text-[11px] font-black tracking-wide leading-none" style={{ color: t.primary }}>WHISKORA</h2>
                  <p className="text-[6px] font-bold tracking-widest mt-0.5" style={{ color: '#6b7280' }}>PET IDENTIFICATION CARD</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[6px] font-bold uppercase tracking-widest" style={{ color: '#9ca3af' }}>Identification No.</p>
                <p className="text-[11px] font-black tracking-widest leading-tight" style={{ color: '#1f2937' }}>{formattedId}</p>
              </div>
            </div>
            
            {/* 📍 Content บัตร */}
            <div className="flex gap-4 items-center">
              {/* รูปโปรไฟล์ซ้ายมือ */}
              <div className="w-[85px] h-[105px] rounded-lg overflow-hidden border-2 shadow-sm shrink-0 relative bg-white" style={{ borderColor: t.circle1 }}>
                {pet.image_url ? (
                  <img src={pet.image_url} alt={pet.name} crossOrigin="anonymous" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-3xl opacity-20">🐾</div>
                )}
              </div>

              {/* ข้อมูลขวามือ */}
              <div className="flex-1 space-y-1.5">
                <div>
                  <p className="text-[7px] font-bold uppercase tracking-wider" style={{ color: t.secondary }}>ชื่อ (Name)</p>
                  <p className="text-[15px] font-black leading-none mt-0.5" style={{ color: '#1f2937' }}>{pet.name}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                  <div>
                    <p className="text-[6px] font-bold uppercase" style={{ color: '#9ca3af' }}>สายพันธุ์ (Breed)</p>
                    <p className="text-[8px] font-black truncate" style={{ color: '#374151' }}>{extractEnglish(pet.breed)}</p>
                    <p className="text-[5px] font-bold truncate" style={{ color: '#6b7280' }}>{extractThai(pet.breed)}</p>
                  </div>
                  <div>
                    <p className="text-[6px] font-bold uppercase" style={{ color: '#9ca3af' }}>สี (Color)</p>
                    <p className="text-[8px] font-black truncate" style={{ color: '#374151' }}>{extractEnglish(pet.color)}</p>
                    <p className="text-[5px] font-bold truncate" style={{ color: '#6b7280' }}>{extractThai(pet.color)}</p>
                  </div>
                  <div>
                    <p className="text-[6px] font-bold uppercase" style={{ color: '#9ca3af' }}>เพศ (Gender)</p>
                    <p className="text-[8px] font-black" style={{ color: '#374151' }}>
                      {pet.gender === 'male' || pet.gender === 'ตัวผู้' ? 'Male (♂)' : 'Female (♀)'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[6px] font-bold uppercase" style={{ color: '#9ca3af' }}>วันเกิด (DOB)</p>
                    <p className="text-[8px] font-black" style={{ color: '#374151' }}>
                      {safeFormatDate(pet.birth_date || pet.birthdate)}
                    </p>
                  </div>
                </div>

                <div className="pt-1">
                  <p className="text-[6px] font-bold uppercase" style={{ color: '#9ca3af' }}>เจ้าของ (Owner)</p>
                  <p className="text-[9px] font-black truncate" style={{ color: t.primary }}>{profile?.full_name || profile?.username || 'Whiskora User'}</p>
                  {profile?.address && (
                    <p className="text-[5px] font-bold leading-tight mt-0.5 line-clamp-2 w-[90%]" style={{ color: '#6b7280' }}>
                      {profile.address}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* 📍 Footer บัตร & 🌟 QR Code ของจริง */}
            <div className="mt-auto flex justify-between items-end border-t border-gray-200/50 pt-1.5">
              <div className="text-[5px] font-bold tracking-widest pb-1" style={{ color: '#9ca3af' }}>
                SCAN TO VIEW PROFILE
              </div>
              <div className="w-10 h-10 bg-white p-0.5 rounded-md shadow-sm border border-gray-200">
                {/* 🌟 ใช้ API เจน QR Code ฟรี ดึงลิงก์ไปหน้าโปรไฟล์สัตว์เลี้ยงจริง */}
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(petProfileUrl)}`} 
                  alt="QR Code" 
                  className="w-full h-full object-contain mix-blend-multiply opacity-80"
                />
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* 🔘 ปุ่มแชร์ (เปลี่ยนจากปุ่มโหลดรูป) */}
      <div className="px-4">
        <button 
          onClick={handleShare}
          className="w-full text-white font-black py-4 rounded-2xl transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
          style={{ backgroundColor: t.primary, boxShadow: `0 10px 15px -3px ${t.circle1}` }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          แชร์โปรไฟล์น้อง 🔗
        </button>
        <div className="bg-gray-50 rounded-xl p-4 mt-4 text-center border border-gray-100">
          <p className="text-[11px] md:text-xs font-bold text-gray-500">
            📸 <span className="text-gray-800">อยากเซฟรูปบัตร?</span><br/>
            คุณสามารถใช้มือถือ <span className="text-pink-500 underline">"แคปหน้าจอ (Screenshot)"</span> บัตรเก็บไว้ได้เลยครับ ภาพชัดเป๊ะแถมเอาไปสแกน QR Code ได้จริงด้วย!
          </p>
        </div>
      </div>

    </div>
  );
}