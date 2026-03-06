// app/pets/[id]/id-card/page.tsx

"use client";

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useParams, useRouter } from 'next/navigation';
import * as htmlToImage from 'html-to-image';

const THEMES = {
  pink: { primary: '#db2777', secondary: '#ec4899', bg: '#fdf2f8', circle1: '#fbcfe8', circle2: '#fce7f3' },
  blue: { primary: '#2563eb', secondary: '#3b82f6', bg: '#eff6ff', circle1: '#bfdbfe', circle2: '#dbeafe' },
  green: { primary: '#059669', secondary: '#10b981', bg: '#ecfdf5', circle1: '#a7f3d0', circle2: '#d1fae5' },
  purple: { primary: '#7c3aed', secondary: '#8b5cf6', bg: '#f5f3ff', circle1: '#ddd6fe', circle2: '#ede9fe' },
  yellow: { primary: '#d97706', secondary: '#f59e0b', bg: '#fffbeb', circle1: '#fde68a', circle2: '#fef3c7' },
};

const fetchImageAsBase64 = async (url: string) => {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    return url; 
  }
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
  
  const [cardImageUrl, setCardImageUrl] = useState<string | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  
  const [base64Avatar, setBase64Avatar] = useState<string | null>(null);
  const [base64Qr, setBase64Qr] = useState<string | null>(null);

  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
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

        if (petData.image_url) {
          const b64 = await fetchImageAsBase64(petData.image_url);
          setBase64Avatar(b64);
        }

        if (typeof window !== "undefined") {
          const publicProfileUrl = `${window.location.origin}/p/${petId}`;
          const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(publicProfileUrl)}`;
          try {
             const qrB64 = await fetchImageAsBase64(qrUrl);
             setBase64Qr(qrB64);
          } catch(e) {
             console.log("Error loading QR");
          }
        }

      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPetData();
  }, [petId, router]);

  useEffect(() => {
    if (loading || !pet) return;

    const generateImage = async () => {
      setIsGeneratingImage(true);
      try {
        await new Promise(resolve => setTimeout(resolve, 600)); 
        if (!cardRef.current) return;
        const dataUrl = await htmlToImage.toPng(cardRef.current, {
          quality: 1.0,
          pixelRatio: 3, 
          backgroundColor: '#ffffff',
          skipFonts: true, 
        });
        setCardImageUrl(dataUrl);
      } catch (error) {
        console.error('Error generating card image:', error);
      } finally {
        setIsGeneratingImage(false);
      }
    };

    generateImage();
  }, [loading, pet, profile, activeTheme, base64Qr, base64Avatar]);

  const handleShare = async () => {
    const publicProfileUrl = `${baseUrl}/p/${petId}`;
    const shareData = {
      title: `บัตรประจำตัวของ ${pet?.name} 🐾`,
      text: `ดูประวัติความน่ารักของ ${pet?.name} ได้ที่นี่เลย!`,
      url: publicProfileUrl
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(publicProfileUrl);
        alert("✅ คัดลอกลิงก์เรียบร้อยแล้ว ส่งให้คนอื่นสแกนดูได้เลย!");
      }
    } catch (err) {
      console.log("Share cancelled", err);
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
  const generate13DigitId = (uuid: string) => {
    let hash = 0;
    for (let i = 0; i < uuid.length; i++) { hash = uuid.charCodeAt(i) + ((hash << 5) - hash); }
    const absoluteHash = Math.abs(hash).toString();
    const paddedId = (absoluteHash + "1098765432109").substring(0, 13);
    return `${paddedId.substring(0,1)}-${paddedId.substring(1,5)}-${paddedId.substring(5,10)}-${paddedId.substring(10,12)}-${paddedId.substring(12,13)}`;
  };
  const safeFormatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleDateString('en-GB'); 
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-pink-500 font-bold animate-pulse">กำลังโหลดข้อมูล... 🐾</div>;
  if (!pet) return null;

  const formattedId = generate13DigitId(pet.id);
  const t = THEMES[activeTheme];

  return (
    <div className="max-w-md mx-auto px-4 pt-6 pb-20 animate-in fade-in duration-700 space-y-6">
      
      <div className="flex items-center justify-between">
         <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center bg-white hover:bg-gray-50 text-gray-400 rounded-xl transition shadow-sm border border-gray-100">
           <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
         </button>
         <div className="bg-white p-2 rounded-full shadow-sm border border-gray-100 flex gap-2">
          {(Object.keys(THEMES) as Array<keyof typeof THEMES>).map((colorKey) => (
            <button
              key={colorKey}
              onClick={() => { setActiveTheme(colorKey); setCardImageUrl(null); }} 
              className={`w-6 h-6 rounded-full transition-transform ${activeTheme === colorKey ? 'scale-110 ring-2 ring-offset-1 ring-gray-400' : ''}`}
              style={{ backgroundColor: THEMES[colorKey].primary }}
            />
          ))}
        </div>
      </div>

      <div>
        <h1 className="text-xl md:text-2xl font-black text-gray-800 tracking-tight text-center">บัตรประจำตัว 🪪</h1>
      </div>

      <div className="flex flex-col items-center drop-shadow-2xl relative min-h-[240px]">
        {(isGeneratingImage || !cardImageUrl) && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/80 backdrop-blur-sm rounded-[1.5rem]">
            <div className="flex flex-col items-center gap-2 text-pink-500">
              <span className="text-xs font-bold animate-pulse">กำลังวาดรูปบัตร...</span>
            </div>
          </div>
        )}

        {cardImageUrl && (
          <img 
            src={cardImageUrl} 
            alt="Pet ID Card" 
            className="w-full max-w-[380px] rounded-[1.5rem] animate-in fade-in duration-500 relative z-30"
            style={{ aspectRatio: '85.6 / 53.98' }}
          />
        )}

        <div 
          ref={cardRef} 
          className="w-full max-w-[380px] rounded-[1.5rem] overflow-hidden relative border select-none"
          style={{ 
            aspectRatio: '85.6 / 53.98', backgroundColor: '#ffffff', borderColor: '#e5e7eb',
            position: cardImageUrl ? 'absolute' : 'relative', opacity: cardImageUrl ? 0 : 1, zIndex: -1, pointerEvents: 'none',
          }} 
        >
          <div className="absolute inset-0 opacity-60" style={{ backgroundColor: t.bg }}></div>
          <div className="absolute top-0 right-0 w-44 h-44 rounded-full opacity-50 -mr-16 -mt-16" style={{ backgroundColor: t.circle1 }}></div>
          <div className="absolute bottom-0 left-0 w-36 h-36 rounded-full opacity-50 -ml-12 -mb-12" style={{ backgroundColor: t.circle2 }}></div>

          <div className="relative z-10 p-4 h-full flex flex-col justify-between">
            
            <div className="flex justify-between items-start mb-2 border-b border-gray-200/50 pb-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7">
                  <svg viewBox="0 0 100 100" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="50" cy="50" r="45" fill="none" stroke={t.secondary} strokeWidth="5" filter="url(#dropShadow)" />
                    <g transform="scale(0.7) translate(20, 20)">
                      <path d="M35,10 A10,10 0 1,1 55,10 A10,10 0 1,1 35,10 M15,35 A10,10 0 1,1 35,35 A10,10 0 1,1 15,35 M60,35 A10,10 0 1,1 80,35 A10,10 0 1,1 60,35 M30,50 C20,60 20,80 30,90 C40,100 55,100 65,90 C75,80 75,60 65,50 C55,40 40,40 30,50" fill={t.primary} />
                    </g>
                    <defs>
                      <filter id="dropShadow" x="-50%" y="-50%" width="200%" height="200%">
                        <feOffset result="offOut" in="SourceGraphic" dx="2" dy="2" />
                        <feColorMatrix result="matrixOut" in="offOut" type="matrix" values="0.8 0 0 0 0 0 0.8 0 0 0 0 0 0.8 0 0 0 0 0 0.5 0" />
                        <feGaussianBlur result="blurOut" in="matrixOut" stdDeviation="2" />
                        <feBlend in="SourceGraphic" in2="blurOut" mode="normal" />
                      </filter>
                    </defs>
                  </svg>
                </div>
                <div>
                  <h2 className="text-[12px] font-black tracking-wide leading-none" style={{ color: t.primary }}>WHISKORA</h2>
                  <p className="text-[6.5px] font-bold tracking-widest mt-0.5" style={{ color: '#6b7280' }}>PET IDENTIFICATION CARD</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[6px] font-bold uppercase tracking-widest" style={{ color: '#9ca3af' }}>Identification No.</p>
                <p className="text-[11px] font-black tracking-widest leading-tight mt-0.5" style={{ color: '#1f2937' }}>{formattedId}</p>
              </div>
            </div>
            
            <div className="flex gap-4 items-center">
              
              <div className="w-[88px] h-[110px] rounded-xl overflow-hidden border-[3px] shadow-sm shrink-0 relative bg-white" style={{ borderColor: t.circle1 }}>
                {base64Avatar ? (
                  <img src={base64Avatar} alt={pet.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl opacity-20">🐾</div>
                )}
              </div>

              <div className="flex-1 space-y-1.5">
                <div>
                  <p className="text-[7.5px] font-bold uppercase tracking-wider mb-0.5" style={{ color: t.secondary }}>ชื่อสัตว์เลี้ยง (Name)</p>
                  <p className="text-[16px] font-black leading-none" style={{ color: '#1f2937' }}>{pet.name}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                  <div>
                    <p className="text-[6.5px] font-bold text-gray-400 mb-0.5">สายพันธุ์ (Breed)</p>
                    <p className="text-[9px] font-black truncate" style={{ color: '#1f2937' }}>{extractThai(pet.breed)}</p>
                    <p className="text-[6px] font-bold text-gray-500 truncate">{extractEnglish(pet.breed)}</p>
                  </div>
                  <div>
                    <p className="text-[6.5px] font-bold text-gray-400 mb-0.5">สี (Color)</p>
                    <p className="text-[9px] font-black truncate" style={{ color: '#1f2937' }}>{extractThai(pet.color)}</p>
                    <p className="text-[6px] font-bold text-gray-500 truncate">{extractEnglish(pet.color)}</p>
                  </div>
                  <div>
                    <p className="text-[6.5px] font-bold text-gray-400 mb-0.5">เพศ (Gender)</p>
                    <p className="text-[9px] font-black" style={{ color: '#1f2937' }}>{pet.gender === 'male' || pet.gender === 'ตัวผู้' ? 'ตัวผู้ (Male)' : 'ตัวเมีย (Female)'}</p>
                  </div>
                  <div>
                    <p className="text-[6.5px] font-bold text-gray-400 mb-0.5">วันเกิด (DOB)</p>
                    <p className="text-[9px] font-black" style={{ color: '#1f2937' }}>{safeFormatDate(pet.birth_date || pet.birthdate)}</p>
                  </div>
                </div>

                <div className="pt-0.5">
                  <p className="text-[6.5px] font-bold text-gray-400 mb-0.5">เจ้าของ (Owner)</p>
                  <p className="text-[9px] font-black truncate" style={{ color: t.primary }}>{profile?.full_name || profile?.username || 'Whiskora User'}</p>
                  {profile?.address && (
                    <p className="text-[6px] font-medium leading-tight mt-0.5 line-clamp-2 pr-1" style={{ color: '#4b5563' }}>
                      {profile.address}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-between items-end border-t border-gray-200/50 pt-1.5 mt-1">
              <div className="text-[5.5px] font-bold tracking-widest pb-1" style={{ color: '#9ca3af' }}>SCAN TO VIEW PUBLIC PROFILE</div>
              <div className="w-10 h-10 bg-white p-0.5 rounded-lg shadow-sm border border-gray-200">
                {base64Qr && <img src={base64Qr} alt="QR Code" className="w-full h-full object-contain mix-blend-multiply opacity-90" />}
              </div>
            </div>

          </div>
        </div>
        
        <p className="text-[11px] font-bold text-pink-500 bg-pink-50 px-3 py-1.5 rounded-full mt-4 animate-bounce">
          💡 แตะค้างที่บัตรด้านบน เพื่อบันทึกรูปภาพ
        </p>

      </div>

      <div className="px-4 space-y-4 pt-2">
        <button 
          onClick={handleShare}
          className="w-full text-white font-black py-4 rounded-2xl transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
          style={{ backgroundColor: t.primary, boxShadow: `0 10px 15px -3px ${t.circle1}` }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
          แชร์ลิงก์หน้าโปรไฟล์ให้น้อง 🔗
        </button>
      </div>

    </div>
  );
}