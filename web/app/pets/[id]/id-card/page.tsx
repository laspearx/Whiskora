"use client";

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useParams, useRouter } from 'next/navigation';
import * as htmlToImage from 'html-to-image';

// ─── Premium Vertical Card Themes ──────────────────────────────────────────
const PREMIUM_THEMES = {
  obsidian: { id: 'obsidian', name: 'Obsidian Gold', bg: '#111315', text: '#FFFFFF', accent: '#D4AF37', card: '#1A1D20', label: '#8B9298', border: '#2C3136' },
  pearl: { id: 'pearl', name: 'Pearl Rose', bg: '#F8F9FA', text: '#111827', accent: '#E84677', card: '#FFFFFF', label: '#6B7280', border: '#E5E7EB' },
  sapphire: { id: 'sapphire', name: 'Sapphire Silver', bg: '#0F172A', text: '#FFFFFF', accent: '#94A3B8', card: '#1E293B', label: '#64748B', border: '#334155' },
};

// ─── Icons ─────────────────────────────────────────────────────────────────
const Icon = {
  ArrowLeft: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>,
  Share: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>,
  Microchip: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/></svg>,
};

// ฟังก์ชันแปลงรูปภาพเป็น Base64 เพื่อให้ html-to-image วาดรูปได้ไม่ติดปัญหา CORS
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

  const [pet, setPet] = useState<import('@/lib/types').Pet | null>(null);
  const [profile, setProfile] = useState<import('@/lib/types').UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [activeTheme, setActiveTheme] = useState<keyof typeof PREMIUM_THEMES>('obsidian');
  const [baseUrl, setBaseUrl] = useState("");
  
  const [cardImageUrl, setCardImageUrl] = useState<string | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  
  const [base64Avatar, setBase64Avatar] = useState<string | null>(null);
  const [base64Qr, setBase64Qr] = useState<string | null>(null);
  const [base64Logo, setBase64Logo] = useState<string | null>(null);

  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setBaseUrl(window.location.origin);
    }

    const fetchPetData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return router.push('/login');

        const { data: petData, error: petError } = await supabase.from('pets').select('*').eq('id', petId).single();
        if (petError) throw petError;
        setPet(petData);

        const { data: profileData } = await supabase.from('profiles').select('username, full_name, address').eq('id', petData.user_id).single();
        if (profileData) setProfile(profileData);

        // ดึงโลโก้
        const logoB64 = await fetchImageAsBase64('/mini-logo.png');
        setBase64Logo(logoB64);

        // ดึงรูปโปรไฟล์สัตว์เลี้ยง
        if (petData.image_url) {
          const b64 = await fetchImageAsBase64(petData.image_url);
          setBase64Avatar(b64);
        }

        // สร้าง QR Code ลิ้งค์ไปยังหน้า Public Profile
        if (typeof window !== "undefined") {
          const publicProfileUrl = `${window.location.origin}/p/${petId}`;
          const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(publicProfileUrl)}&margin=0`;
          try {
             const qrB64 = await fetchImageAsBase64(qrUrl);
             setBase64Qr(qrB64);
          } catch(e) { console.log("Error loading QR"); }
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
        // หน่วงเวลาเล็กน้อยเพื่อให้ภาพและฟอนต์โหลดครบ
        await new Promise(resolve => setTimeout(resolve, 800)); 
        if (!cardRef.current) return;
        
        const dataUrl = await htmlToImage.toPng(cardRef.current, {
          quality: 1.0,
          pixelRatio: 3, // ความละเอียดสูงเพื่อความคมชัด
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
  }, [loading, pet, profile, activeTheme, base64Qr, base64Avatar, base64Logo]);

  const handleShare = async () => {
    const publicProfileUrl = `${baseUrl}/p/${petId}`;
    const shareData = {
      title: `${pet?.name} - Whiskora Official Pass 🐾`,
      text: `ดูโปรไฟล์แบบเต็มของ ${pet?.name} ได้ที่นี่เลย!`,
      url: publicProfileUrl
    };

    try {
      if (navigator.share) await navigator.share(shareData);
      else {
        await navigator.clipboard.writeText(publicProfileUrl);
        alert("✅ คัดลอกลิงก์เรียบร้อยแล้ว ส่งให้คนอื่นกดดูได้เลย!");
      }
    } catch (err) { console.log("Share cancelled", err); }
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
    return `${paddedId.substring(0,1)} ${paddedId.substring(1,5)} ${paddedId.substring(5,10)} ${paddedId.substring(10,12)} ${paddedId.substring(12,13)}`;
  };

  const safeFormatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleDateString('en-GB'); 
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-sm font-semibold tracking-widest text-gray-400 animate-pulse uppercase">Loading Pass...</div>;
  if (!pet) return null;

  const formattedId = generate13DigitId(pet.id);
  const t = PREMIUM_THEMES[activeTheme];

  return (
    <div className="max-w-md mx-auto px-4 pt-6 pb-24 animate-in fade-in duration-700 space-y-6 font-sans">
      
      {/* 🔙 Header & Theme Selector */}
      <div className="flex items-center justify-between">
        <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center bg-white hover:bg-gray-50 text-gray-400 hover:text-gray-900 rounded-xl transition-colors shadow-sm border border-gray-100">
          <Icon.ArrowLeft />
        </button>
        <div className="bg-white p-2 rounded-xl shadow-sm border border-gray-100 flex gap-2">
          {(Object.keys(PREMIUM_THEMES) as Array<keyof typeof PREMIUM_THEMES>).map((key) => (
            <button
              key={key}
              onClick={() => { setActiveTheme(key); setCardImageUrl(null); }} 
              className={`w-6 h-6 rounded-full transition-all border-2 ${activeTheme === key ? 'scale-110 shadow-sm' : 'scale-90 border-transparent opacity-60 hover:opacity-100'}`}
              style={{ backgroundColor: PREMIUM_THEMES[key].bg, borderColor: activeTheme === key ? PREMIUM_THEMES[key].accent : 'transparent' }}
              title={PREMIUM_THEMES[key].name}
            />
          ))}
        </div>
      </div>

      <div className="text-center px-4">
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-gray-900">Pet Digital Pass</h1>
        <p className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-gray-400 mt-1">Whiskora Verified Identification</p>
      </div>

      {/* 💳 Card Display Area */}
      <div className="flex flex-col items-center relative min-h-[500px]">
        
        {/* Loading Overlay */}
        {(isGeneratingImage || !cardImageUrl) && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/50 backdrop-blur-sm rounded-3xl">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-4 border-pink-200 border-t-pink-500 rounded-full animate-spin"></div>
              <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Generating Pass...</span>
            </div>
          </div>
        )}

        {/* 🌟 รูปที่โชว์ให้ผู้ใช้เห็นและกดเซฟได้ */}
        {cardImageUrl && (
          <img 
            src={cardImageUrl} 
            alt="Pet ID Pass" 
            className="w-full max-w-[320px] rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] animate-in fade-in zoom-in-95 duration-500 relative z-30"
          />
        )}

        {/* 🛠️ The Hidden DOM Element สำหรับให้ html-to-image จับภาพ */}
        <div 
          ref={cardRef} 
          className="w-[320px] h-[520px] rounded-3xl overflow-hidden relative flex flex-col p-6 shadow-2xl"
          style={{ 
            backgroundColor: t.bg, border: `1px solid ${t.border}`, color: t.text,
            position: cardImageUrl ? 'absolute' : 'relative', opacity: cardImageUrl ? 0 : 1, zIndex: -1, pointerEvents: 'none',
          }} 
        >
          {/* Decorative Glow */}
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10 blur-3xl -mr-20 -mt-20" style={{ background: t.accent }}></div>

          {/* 1. Header */}
          <div className="flex justify-between items-center z-10">
            <div className="flex items-center gap-2">
                <div className="w-6 h-6 flex items-center justify-center shrink-0">
                    {base64Logo ? (
                        <img src={base64Logo} alt="Logo" className="w-full h-full object-contain" />
                    ) : (
                        <div className="text-[10px]">🐾</div>
                    )}
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black tracking-[0.2em] uppercase leading-none" style={{ color: t.accent }}>WHISKORA</span>
                  <span className="text-[6px] font-bold tracking-widest uppercase mt-0.5" style={{ color: t.label }}>Pet Identification</span>
                </div>
            </div>
            <div className="opacity-80" style={{ color: t.accent }}><Icon.Microchip /></div>
          </div>

          {/* 2. Photo & Name */}
          <div className="flex flex-col items-center mt-8 z-10">
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 shadow-[0_0_20px_rgba(0,0,0,0.2)] mb-4 relative" style={{ borderColor: t.accent, backgroundColor: t.card }}>
              {base64Avatar ? (
                <img src={base64Avatar} alt={pet.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl opacity-20">🐾</div>
              )}
            </div>
            <h1 className="text-3xl font-black tracking-tight mb-0.5 text-center" style={{ color: t.text }}>{pet.name}</h1>
            <p className="text-[9px] font-bold uppercase tracking-widest" style={{ color: t.label }}>
              {pet.species === 'cat' ? 'Feline' : pet.species === 'dog' ? 'Canine' : 'Pet'} / {pet.gender === 'male' || pet.gender === 'ตัวผู้' ? 'Male' : 'Female'}
            </p>
          </div>

          {/* 3. Details Grid */}
          <div className="w-full mt-8 rounded-2xl p-4 grid grid-cols-2 gap-y-4 gap-x-2 z-10" style={{ backgroundColor: t.card, border: `1px solid ${t.border}` }}>
            <div>
              <p className="text-[7px] font-bold uppercase tracking-widest mb-1" style={{ color: t.label }}>Breed</p>
              <p className="text-[10px] font-bold truncate" style={{ color: t.text }}>{extractThai(pet.breed)}</p>
            </div>
            <div>
              <p className="text-[7px] font-bold uppercase tracking-widest mb-1" style={{ color: t.label }}>Color</p>
              <p className="text-[10px] font-bold truncate" style={{ color: t.text }}>{extractThai(pet.color)}</p>
            </div>
            <div>
              <p className="text-[7px] font-bold uppercase tracking-widest mb-1" style={{ color: t.label }}>Birth Date</p>
              <p className="text-[10px] font-bold" style={{ color: t.text }}>{safeFormatDate(pet.birth_date || pet.birthdate)}</p>
            </div>
            <div>
              <p className="text-[7px] font-bold uppercase tracking-widest mb-1" style={{ color: t.label }}>Status</p>
              <p className="text-[10px] font-bold" style={{ color: t.accent }}>Verified</p>
            </div>
          </div>

          {/* 4. Footer (Owner & QR) */}
          <div className="mt-auto pt-5 flex justify-between items-end z-10">
            <div className="flex flex-col gap-3">
              <div>
                <p className="text-[7px] font-bold uppercase tracking-widest mb-0.5" style={{ color: t.label }}>Owner</p>
                <p className="text-[11px] font-bold truncate w-40" style={{ color: t.text }}>{profile?.full_name || profile?.username || 'Whiskora User'}</p>
              </div>
              <div>
                <p className="text-[7px] font-bold uppercase tracking-widest mb-0.5" style={{ color: t.label }}>ID Number</p>
                <p className="text-[10px] font-black tracking-widest font-mono" style={{ color: t.text }}>{formattedId}</p>
              </div>
            </div>
            <div className="w-[60px] h-[60px] bg-white p-1 rounded-lg flex-shrink-0 flex items-center justify-center shadow-md">
              {base64Qr ? (
                <img src={base64Qr} alt="QR Code" className="w-full h-full object-contain mix-blend-multiply" />
              ) : (
                <div className="w-full h-full bg-gray-100 animate-pulse rounded"></div>
              )}
            </div>
          </div>

        </div>

      </div>

      {/* User Actions */}
      <div className="space-y-4 pt-2">
        <p className="text-[10px] font-bold text-gray-400 text-center uppercase tracking-widest bg-gray-50 py-2 rounded-lg border border-gray-100">
          📱 แตะค้างที่บัตรเพื่อบันทึกรูปลงเครื่อง
        </p>
        
        <button 
          onClick={handleShare}
          className="w-full text-white font-bold py-4 rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg hover:opacity-90"
          style={{ background: '#111827' }} 
        >
          <Icon.Share />
          แชร์ลิงก์ให้คนอื่นสแกน
        </button>
      </div>

    </div>
  );
}