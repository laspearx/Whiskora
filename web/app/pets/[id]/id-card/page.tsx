"use client";

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useParams, useRouter } from 'next/navigation';

export default function PetIdCardPage() {
  const router = useRouter();
  const params = useParams();
  const petId = params.id as string;

  const [pet, setPet] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
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

        // 🌟 ดึงข้อมูลที่อยู่ (address) มาด้วย
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

  const handleDownloadImage = async () => {
    if (!cardRef.current) return;
    setSaving(true);
    
    try {
      const html2canvas = (await import('html2canvas')).default;

      // 🌟 แก้ปัญหา Type Error เรื่อง scale
      const options: any = {
        scale: 3, 
        useCORS: true, 
        allowTaint: true, 
        backgroundColor: '#ffffff',
      };

      const canvas = await html2canvas(cardRef.current, options);
      const image = canvas.toDataURL("image/png");

      const link = document.createElement("a");
      link.href = image;
      link.download = `whiskora-id-${pet?.name || 'pet'}.png`; 
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    } catch (error: any) {
      console.error("Error generating image:", error);
      alert(`โหลดรูปไม่สำเร็จครับ: ${error.message}`);
    } finally {
      setSaving(false);
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

  if (loading) return <div className="min-h-screen flex items-center justify-center text-pink-500 font-bold animate-pulse">กำลังพิมพ์บัตรประชาชน... 🐾</div>;
  if (!pet) return null;

  const safeIdString = String(pet.id || "0");
  const numericOnly = safeIdString.replace(/\D/g, ''); 
  const paddedId = (numericOnly + "1234567890123").substring(0, 13); 
  const formattedId = `${paddedId.substring(0,1)}-${paddedId.substring(1,5)}-${paddedId.substring(5,10)}-${paddedId.substring(10,12)}-${paddedId.substring(12,13)}`;

  const safeFormatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleDateString('en-GB'); 
  };

  return (
    <div className="max-w-md mx-auto px-4 pt-6 pb-20 animate-in fade-in duration-700 space-y-8">
      
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center bg-white hover:bg-pink-50 text-gray-400 hover:text-pink-600 rounded-xl transition shadow-sm border border-gray-100">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h1 className="text-xl md:text-2xl font-black text-gray-800 tracking-tight">บัตรประจำตัว 🪪</h1>
          <p className="text-xs font-bold text-gray-500 mt-0.5">Pet Identification Card</p>
        </div>
      </div>

      {/* 💳 ส่วนแสดงบัตร */}
      <div className="flex justify-center drop-shadow-2xl">
        {/* 🌟 บังคับใช้สี Hex Code ทั้งหมดในบัตร เพื่อป้องกัน html2canvas พัง! */}
        <div 
          ref={cardRef} 
          className="w-full max-w-[380px] rounded-[1.5rem] overflow-hidden relative border"
          style={{ aspectRatio: '85.6 / 53.98', backgroundColor: '#ffffff', borderColor: '#e5e7eb' }} 
        >
          {/* พื้นหลัง */}
          <div className="absolute inset-0 opacity-80" style={{ backgroundColor: '#fdf2f8' }}></div>
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-40 -mr-10 -mt-10" style={{ backgroundColor: '#fbcfe8' }}></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full opacity-40 -ml-10 -mb-10" style={{ backgroundColor: '#bfdbfe' }}></div>

          <div className="relative z-10 p-4 h-full flex flex-col">
            
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-1.5">
                <span className="text-lg">🐾</span>
                <div>
                  <h2 className="text-[10px] font-black leading-none" style={{ color: '#db2777' }}>WHISKORA</h2>
                  <p className="text-[6px] font-bold" style={{ color: '#9ca3af' }}>PET IDENTIFICATION CARD</p>
                </div>
              </div>
              <p className="text-[8px] font-bold" style={{ color: '#9ca3af' }}>Identification No.</p>
            </div>
            
            <div className="text-right mb-2">
              <p className="text-sm font-black tracking-widest" style={{ color: '#1f2937' }}>{formattedId}</p>
            </div>

            <div className="flex gap-4">
              <div className="w-[85px] h-[105px] rounded-lg overflow-hidden border-2 shadow-sm shrink-0 relative" style={{ backgroundColor: '#f3f4f6', borderColor: '#ffffff' }}>
                {pet.image_url ? (
                  <img src={pet.image_url} alt={pet.name} crossOrigin="anonymous" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-3xl opacity-20">🐾</div>
                )}
              </div>

              <div className="flex-1 space-y-1.5">
                <div>
                  <p className="text-[7px] font-bold uppercase tracking-wider" style={{ color: '#ec4899' }}>ชื่อ (Name)</p>
                  <p className="text-base font-black leading-none mt-0.5" style={{ color: '#1f2937' }}>{pet.name}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                  <div>
                    <p className="text-[7px] font-bold uppercase" style={{ color: '#9ca3af' }}>สายพันธุ์ (Breed)</p>
                    <p className="text-[9px] font-bold truncate" style={{ color: '#1f2937' }}>{extractEnglish(pet.breed)}</p>
                    <p className="text-[6px] font-bold truncate" style={{ color: '#9ca3af' }}>{extractThai(pet.breed)}</p>
                  </div>
                  
                  <div>
                    <p className="text-[7px] font-bold uppercase" style={{ color: '#9ca3af' }}>สี (Color)</p>
                    <p className="text-[9px] font-bold truncate" style={{ color: '#1f2937' }}>{extractEnglish(pet.color)}</p>
                    <p className="text-[6px] font-bold truncate" style={{ color: '#9ca3af' }}>{extractThai(pet.color)}</p>
                  </div>

                  <div>
                    <p className="text-[7px] font-bold uppercase" style={{ color: '#9ca3af' }}>เพศ (Gender)</p>
                    <p className="text-[9px] font-bold" style={{ color: '#1f2937' }}>
                      {pet.gender === 'male' || pet.gender === 'ตัวผู้' ? 'Male (♂)' : 'Female (♀)'}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-[7px] font-bold uppercase" style={{ color: '#9ca3af' }}>วันเกิด (DOB)</p>
                    <p className="text-[9px] font-bold" style={{ color: '#1f2937' }}>
                      {safeFormatDate(pet.birth_date || pet.birthdate)}
                    </p>
                  </div>
                </div>

                <div className="pt-0.5">
                  <p className="text-[7px] font-bold uppercase" style={{ color: '#9ca3af' }}>เจ้าของ (Owner)</p>
                  <p className="text-[10px] font-black truncate" style={{ color: '#ec4899' }}>{profile?.full_name || profile?.username || 'Whiskora User'}</p>
                  {/* 🌟 แสดงที่อยู่เจ้าของตรงนี้เลยครับ! */}
                  {profile?.address && (
                    <p className="text-[5px] font-bold leading-tight mt-0.5 line-clamp-2" style={{ color: '#6b7280' }}>
                      {profile.address}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-auto flex justify-between items-end">
              <div className="text-[6px] font-bold" style={{ color: '#9ca3af' }}>
                Issue By Whiskora App • For Collector's Edition Only
              </div>
              <div className="font-[barcode] text-2xl opacity-50 tracking-widest leading-none" style={{ color: '#1f2937' }}>
                ||| |||| | || |||||
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* 🔘 ปุ่มกดเซฟ */}
      <div className="px-4">
        <button 
          onClick={handleDownloadImage}
          disabled={saving}
          className="w-full bg-pink-500 hover:bg-pink-600 text-white font-black py-4 rounded-2xl transition-all shadow-lg shadow-pink-200 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {saving ? (
            "📸 กำลังล้างรูป..."
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              เซฟรูปบัตรลงเครื่อง
            </>
          )}
        </button>
        <p className="text-center text-xs font-bold text-gray-400 mt-4">
          💡 เคล็ดลับ: คุณสามารถแชร์รูปนี้อวดเพื่อนๆ ในโซเชียลได้เลย!
        </p>
      </div>

    </div>
  );
}