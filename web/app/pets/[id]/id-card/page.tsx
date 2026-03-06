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

        // ดึงข้อมูลสัตว์เลี้ยง
        const { data: petData, error: petError } = await supabase
          .from('pets')
          .select('*')
          .eq('id', petId)
          .single();

        if (petError) throw petError;
        setPet(petData);

        // ดึงข้อมูลเจ้าของ (User)
        const { data: profileData } = await supabase
          .from('profiles')
          .select('username, full_name')
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

  // 📸 ฟังก์ชันแคปหน้าจอและเซฟเป็นรูปภาพ
  const handleDownloadImage = async () => {
    if (!cardRef.current) return;
    setSaving(true);
    
    try {
      // 🌟 ใช้ Dynamic Import เพื่อความปลอดภัย 100% บน Vercel
      const html2canvas = (await import('html2canvas')).default;

      const canvas = await html2canvas(cardRef.current, {
        scale: 3, 
        useCORS: true, 
        allowTaint: true, 
        backgroundColor: null, 
      } as any);

      // แปลง Canvas เป็น Data URL (รูปภาพ PNG)
      const image = canvas.toDataURL("image/png");

      // สร้างลิงก์จำลองเพื่อกดดาวน์โหลด
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

  if (loading) return <div className="min-h-screen flex items-center justify-center text-pink-500 font-bold animate-pulse">กำลังพิมพ์บัตรประชาชน... 🐾</div>;
  if (!pet) return null;

  // 🌟 [แก้ Error ตรงนี้] แปลง ID ให้เป็น String ก่อนเสมอเพื่อป้องกันเว็บแครช
  const safeIdString = String(pet.id || "0");
  const numericOnly = safeIdString.replace(/\D/g, ''); // ดึงมาเฉพาะตัวเลข
  const paddedId = (numericOnly + "1234567890123").substring(0, 13); // ถ้าเลขไม่ครบ 13 หลัก ให้เติมจนครบ
  const formattedId = `${paddedId.substring(0,1)}-${paddedId.substring(1,5)}-${paddedId.substring(5,10)}-${paddedId.substring(10,12)}-${paddedId.substring(12,13)}`;

  // 🌟 [แก้ Error ตรงนี้] ฟังก์ชันแปลงวันที่แบบปลอดภัย ป้องกัน RangeError
  const safeFormatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleDateString('th-TH');
  };

  return (
    <div className="max-w-md mx-auto px-4 pt-6 pb-20 animate-in fade-in duration-700 space-y-8">
      
      {/* 🔙 Header */}
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

      {/* 💳 ส่วนแสดงบัตร (ที่จะถูกแคปเจอร์) */}
      <div className="flex justify-center drop-shadow-2xl">
        <div 
          ref={cardRef} 
          className="w-full max-w-[380px] bg-white rounded-[1.5rem] overflow-hidden relative border border-gray-200"
          style={{ aspectRatio: '85.6 / 53.98' }} 
        >
          {/* พื้นหลังบัตร */}
          <div className="absolute inset-0 bg-gradient-to-br from-pink-50 via-white to-pink-100 opacity-90"></div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-pink-200 to-transparent rounded-full opacity-50 -mr-10 -mt-10"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-blue-200 to-transparent rounded-full opacity-50 -ml-10 -mb-10"></div>

          <div className="relative z-10 p-4 h-full flex flex-col">
            
            {/* หัวบัตร */}
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-1.5">
                <span className="text-lg">🐾</span>
                <div>
                  <h2 className="text-[10px] font-black text-pink-600 leading-none">WHISKORA</h2>
                  <p className="text-[6px] font-bold text-gray-400">PET IDENTIFICATION CARD</p>
                </div>
              </div>
              <p className="text-[8px] font-bold text-gray-400">เลขประจำตัวสัตว์เลี้ยง</p>
            </div>
            
            <div className="text-right mb-2">
              <p className="text-sm font-black text-gray-800 tracking-widest">{formattedId}</p>
            </div>

            {/* เนื้อหาบัตร */}
            <div className="flex gap-4">
              {/* รูปโปรไฟล์ */}
              <div className="w-[85px] h-[105px] bg-gray-100 rounded-lg overflow-hidden border-2 border-white shadow-sm shrink-0 relative">
                {pet.image_url ? (
                  <img src={pet.image_url} alt={pet.name} crossOrigin="anonymous" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-3xl opacity-20">🐾</div>
                )}
              </div>

              {/* ข้อมูล */}
              <div className="flex-1 space-y-1.5">
                <div>
                  <p className="text-[7px] font-bold text-pink-500 uppercase tracking-wider">ชื่อ (Name)</p>
                  <p className="text-base font-black text-gray-800 leading-none mt-0.5">{pet.name}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-1">
                  <div>
                    <p className="text-[7px] font-bold text-gray-400 uppercase">สายพันธุ์ (Breed)</p>
                    <p className="text-[9px] font-bold text-gray-800 truncate">{pet.breed || '-'}</p>
                  </div>
                  <div>
                    <p className="text-[7px] font-bold text-gray-400 uppercase">เพศ (Gender)</p>
                    <p className="text-[9px] font-bold text-gray-800">
                      {pet.gender === 'male' || pet.gender === 'ตัวผู้' ? 'ผู้ (Male)' : 'เมีย (Female)'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[7px] font-bold text-gray-400 uppercase">วันเกิด (DOB)</p>
                    <p className="text-[9px] font-bold text-gray-800">
                      {safeFormatDate(pet.birth_date || pet.birthdate)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[7px] font-bold text-gray-400 uppercase">สี (Color)</p>
                    <p className="text-[9px] font-bold text-gray-800 truncate">{pet.color || '-'}</p>
                  </div>
                </div>

                <div className="pt-1">
                  <p className="text-[7px] font-bold text-gray-400 uppercase">เจ้าของ (Owner)</p>
                  <p className="text-[10px] font-black text-pink-500 truncate">{profile?.full_name || profile?.username || 'ผู้ใช้ Whiskora'}</p>
                </div>
              </div>
            </div>

            {/* บาร์โค้ดตกแต่งด้านล่าง */}
            <div className="mt-auto flex justify-between items-end">
              <div className="text-[6px] font-bold text-gray-400">
                ออกโดย Whiskora App • ใช้เพื่อการสะสมเท่านั้น
              </div>
              <div className="font-[barcode] text-2xl text-gray-800 opacity-50 tracking-widest leading-none">
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