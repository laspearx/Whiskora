"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { speciesTh } from "@/lib/species";
import { useRouter } from "next/navigation";
import Link from "next/link";

// ─── Premium CI Tokens ─────────────────────────────────────────────────────
const F = {
  ink: '#111827',
  inkSoft: '#4B5563',
  muted: '#9CA3AF',
  pink: '#E84677',
  pinkSoft: '#FDF2F5',
  line: '#E5E7EB',
  paper: '#FFFFFF',
  gold: '#D97706',
  goldSoft: '#FEF3C7',
  teal: '#0D9488',
  tealSoft: '#F0FDFA',
};

// ─── Elegant Minimal Icons ──────────────────────────────────────────────────
const Icon = {
  Search: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>,
  ArrowLeft: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>,
  Farm: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  Male: () => <img src="/icons/icon-men.png" alt="male" style={{width:22,height:22,objectFit:'contain'}} />,
  Female: () => <img src="/icons/icon-women.png" alt="female" style={{width:22,height:22,objectFit:'contain'}} />,
  ImagePlaceholder: () => <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>,
};

export default function FarmHubPage() {
  const router = useRouter();
  const [pets, setPets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activePetType, setActivePetType] = useState("ทั้งหมด");

  const petTypes = [
    { label: "ทั้งหมด", value: "ทั้งหมด" },
    { label: "แมว", value: "cat" },
    { label: "สุนัข", value: "dog" },
    { label: "กระต่าย", value: "rabbit" },
    { label: "นก", value: "bird" },
    { label: "สัตว์อื่นๆ", value: "other" },
  ];

  useEffect(() => {
    fetchAvailablePets();
  }, [activePetType]);

  const fetchAvailablePets = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("pets")
        .select("*, farms(farm_name, district, province)")
        .in("status", ["พร้อมย้ายบ้าน", "เปิดจอง"])
        .order("created_at", { ascending: false });

      if (activePetType !== "ทั้งหมด") {
        query = query.eq("species", activePetType);
      }

      const { data, error } = await query;
      if (error) throw error;
      setPets(data || []);
    } catch (error) {
      console.error("Error fetching pets:", error);
    } finally {
      setLoading(false);
    }
  };

  const q = searchQuery.toLowerCase().trim();
  const filteredPets = !q ? pets : pets.filter(p =>
    p.breed?.toLowerCase().includes(q) ||
    p.farms?.farm_name?.toLowerCase().includes(q) ||
    p.farms?.address?.toLowerCase().includes(q) ||
    speciesTh(p.species)?.toLowerCase().includes(q)
  );

  function calcAge(birthDate: string | null) {
    if (!birthDate) return null;
    const birth = new Date(birthDate);
    const now = new Date();
    let years = now.getFullYear() - birth.getFullYear();
    let months = now.getMonth() - birth.getMonth();
    if (months < 0) { years--; months += 12; }
    if (years > 0) return `${years} ปี${months > 0 ? ` ${months} เดือน` : ''}`;
    if (months > 0) return `${months} เดือน`;
    const days = Math.floor((now.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24));
    return days > 0 ? `${days} วัน` : null;
  }

  function farmLocation(farm: any): string {
    if (!farm) return '';
    const { province, district } = farm;
    if (province === 'กรุงเทพมหานคร') return district ? `เขต${district}` : 'กรุงเทพฯ';
    return province || '';
  }

  function thaiBreedName(breed: string | null, species?: string): string {
    if (!breed) return speciesTh(species) || '—';
    const hasThai = /[฀-๿]/.test(breed);
    if (!hasThai) return breed;
    const parts = breed.split('(');
    if (parts.length > 1) {
      const first = parts[0].trim();
      const inParens = parts[1].replace(')', '').trim();
      if (/[฀-๿]/.test(first)) return first;
      if (/[฀-๿]/.test(inParens)) return inParens;
      return first;
    }
    return breed;
  }

  return (
    <>
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        
        .premium-card {
          background: #ffffff;
          border: 1px solid ${F.line};
          border-radius: 1.25rem;
          transition: all 0.25s ease;
        }
        .premium-card:hover {
          border-color: #D1D5DB;
          box-shadow: 0 12px 30px rgba(0,0,0,0.05);
          transform: translateY(-2px);
        }
      `}</style>

      <div className="max-w-6xl mx-auto px-4 pt-8 pb-24 animate-in fade-in duration-500" style={{ fontFamily: 'var(--font-ui)', color: F.ink }}>
        
        {/* 🔙 Header & Search */}
        <div className="mb-10 space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="flex items-start gap-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2">Pet Market</h1>
                <p className="text-sm font-medium" style={{ color: F.muted }}>รวมเด็กๆ พร้อมย้ายบ้านจากฟาร์มคุณภาพ</p>
              </div>
            </div>
            
            <div className="relative w-full md:max-w-md">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"><Icon.Search /></span>
              <input 
                type="text" 
                placeholder="ค้นหาสายพันธุ์, ฟาร์ม หรือจังหวัด..."
                className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:border-pink-400 focus:ring-4 focus:ring-pink-50 font-medium text-sm transition-all outline-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* 🐾 Pet Type Pills (Match with Marketplace) */}
          <div className="flex gap-2.5 overflow-x-auto pb-2 no-scrollbar">
            {petTypes.map((type) => {
              const isActive = activePetType === type.value || (activePetType === "ทั้งหมด" && type.label === "ทั้งหมด");
              return (
                <button
                  key={type.label}
                  onClick={() => setActivePetType(type.value)}
                  className={`px-5 py-2 rounded-xl text-[13px] font-semibold transition-all shrink-0 border ${
                    isActive
                    ? "bg-gray-900 text-white border-gray-900 shadow-md shadow-gray-200" 
                    : "bg-white text-gray-500 border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {type.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* 📦 Pet Grid */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="aspect-square bg-gray-50 animate-pulse rounded-2xl border border-gray-100"></div>
            ))}
          </div>
        ) : filteredPets.length === 0 ? (
          <div className="py-24 text-center bg-gray-50 rounded-3xl border border-dashed border-gray-200">
            <div className="text-gray-300 mb-3 flex justify-center"><Icon.ImagePlaceholder /></div>
            <p className="text-gray-500 font-semibold">ไม่พบข้อมูลในขณะนี้</p>
            <p className="text-sm text-gray-400 mt-1">ลองเปลี่ยนคำค้นหา หรือประเภทสัตว์เลี้ยงดูนะครับ</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {filteredPets.map((pet) => (
              <Link 
                key={pet.id} 
                href={`/pets/${pet.id}`}
                className="premium-card flex flex-col overflow-hidden group"
              >
                {/* Pet Image Wrapper (1:1 Square) */}
                <div className="aspect-square bg-gray-50 relative overflow-hidden border-b border-gray-100">
                  {pet.image_url ? (
                    <img 
                      src={pet.image_url} 
                      alt={pet.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                      <Icon.ImagePlaceholder />
                    </div>
                  )}
                  
                  {/* Status Badge */}
                  <div
                    className="absolute top-3 right-3 text-[10px] font-bold px-2.5 py-1 rounded-md tracking-wider shadow-sm"
                    style={pet.status === 'เปิดจอง'
                      ? { background: F.tealSoft, color: F.teal }
                      : { background: F.goldSoft, color: F.gold }
                    }
                  >
                    {pet.status === 'เปิดจอง' ? 'เปิดจอง' : 'พร้อมย้ายเลย'}
                  </div>
                </div>

                {/* Pet Details */}
                <div className="p-3 md:p-4 flex flex-col flex-1">
                  {/* Breed + gender */}
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h3 className="text-sm font-bold text-gray-900 truncate leading-snug group-hover:text-pink-600 transition-colors">
                      {thaiBreedName(pet.breed, pet.species)}
                    </h3>
                    <span className="flex-shrink-0">
                      {pet.gender === 'male' || pet.gender === 'ตัวผู้' ? <Icon.Male /> : <Icon.Female />}
                    </span>
                  </div>

                  {/* Age */}
                  <p className="text-[11px] font-medium text-gray-400 mb-2 leading-tight">
                    {calcAge(pet.birth_date) ? `อายุ ${calcAge(pet.birth_date)}` : "ไม่ระบุอายุ"}
                  </p>

                  <div className="mt-auto pt-3 border-t border-gray-100 flex flex-col gap-1.5">
                    {/* Farm + location */}
                    <div className="flex items-center gap-1.5 text-[10px] font-semibold text-gray-400">
                      <Icon.Farm />
                      <span className="truncate font-semibold text-gray-600">{pet.farms?.farm_name}</span>
                      {farmLocation(pet.farms) && (
                        <span className="flex-shrink-0 text-gray-400">· {farmLocation(pet.farms)}</span>
                      )}
                    </div>
                    {/* Price */}
                    <div className="text-base md:text-lg font-extrabold tracking-tight" style={{ color: F.ink }}>
                      {pet.price ? `฿${pet.price.toLocaleString()}` : "สอบถามราคา"}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}