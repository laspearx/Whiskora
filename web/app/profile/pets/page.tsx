"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { speciesTh } from "@/lib/species";
import { useRouter } from "next/navigation";
import Link from "next/link";

// ─── Premium CI Tokens ─────────────────────────────────────────────────────
const F = {
  ink: '#111827',      // Gray-900
  inkSoft: '#4B5563',  // Gray-600
  muted: '#9CA3AF',    // Gray-400
  pink: '#E84677',     // Brand Primary
  pinkSoft: '#FDF2F5', 
  line: '#E5E7EB',     // Gray-200
  paper: '#FFFFFF',
};

// ─── Elegant Minimal Icons ──────────────────────────────────────────────────
const Icon = {
  ArrowLeft: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>,
  Home: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  Building: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/></svg>,
  ChevronRight: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>,
  Male: () => <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="10" cy="14" r="5"/><line x1="13.5" y1="10.5" x2="21" y2="3"/><polyline points="16 3 21 3 21 8"/></svg>,
  Female: () => <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="10" r="5"/><line x1="12" y1="15" x2="12" y2="21"/><line x1="9" y1="18" x2="15" y2="18"/></svg>,
};

export default function MyPetsSummaryPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [personalPets, setPersonalPets] = useState<any[]>([]);
  const [farmPets, setFarmPets] = useState<Record<string, { name: string, pets: any[] }>>({});

  useEffect(() => {
    const fetchAllPets = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return router.push("/login");
        const uid = session.user.id;

        const { data: farms } = await supabase.from("farms").select("id, farm_name").eq("user_id", uid);
        const { data: pets } = await supabase.from("pets").select("*").eq("user_id", uid).order("created_at", { ascending: false });

        if (pets) {
          const personal: any[] = [];
          const groupedFarms: Record<string, { name: string, pets: any[] }> = {};
          farms?.forEach(f => { groupedFarms[f.id] = { name: f.farm_name, pets: [] }; });

          pets.forEach(pet => {
            if (!pet.farm_id || pet.farm_id === "PERSONAL") {
              personal.push(pet);
            } else if (groupedFarms[pet.farm_id]) {
              groupedFarms[pet.farm_id].pets.push(pet);
            } else {
              personal.push(pet);
            }
          });
          setPersonalPets(personal);
          setFarmPets(groupedFarms);
        }
      } catch (error: any) {
        console.error("Error fetching pets:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAllPets();
  }, [router]);

  if (loading) return (
    <div className="min-h-[50vh] flex items-center justify-center text-sm font-semibold tracking-widest text-gray-400 animate-pulse uppercase">
      Loading Pet Gallery...
    </div>
  );

  return (
    <>
      <style>{`
        .premium-card {
          background: #ffffff;
          border: 1px solid ${F.line};
          border-radius: 1.25rem;
          box-shadow: 0 1px 3px rgba(0,0,0,0.02);
          transition: all 0.2s ease-in-out;
        }
        .premium-card:hover {
          border-color: #D1D5DB;
          box-shadow: 0 10px 30px rgba(0,0,0,0.04);
        }
      `}</style>

      <div className="max-w-4xl mx-auto px-4 pt-8 md:pt-12 pb-24 animate-in fade-in duration-500 space-y-6" style={{ color: F.ink }}>
        
        {/* 📋 Page Header */}
        <div className="px-1 mb-2 flex items-center gap-3">
          <button
            onClick={() => router.push('/profile')}
            aria-label="ย้อนกลับ"
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-white text-gray-700 shrink-0 transition-all hover:bg-gray-50 hover:text-gray-900 active:scale-95"
            style={{ border: '1px solid #E5E7EB', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
          >
            <Icon.ArrowLeft />
          </button>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-1">My Pets</h1>
            <p className="text-sm font-medium" style={{ color: F.muted }}>จัดการสมาชิกในบ้านและฟาร์มทั้งหมดของคุณ</p>
          </div>
        </div>

        {/* 🏠 Section: Personal Pets */}
        <section className="premium-card p-6">
          <div className="flex justify-between items-center mb-5">
            <h3 className="font-bold text-gray-900 flex items-center gap-2 text-base">
              <span className="text-gray-400"><Icon.Home /></span> สัตว์เลี้ยงส่วนตัว
              <span className="text-xs font-medium text-gray-400 ml-1">({personalPets.length})</span>
            </h3>
            <Link 
              href="/pets/create" 
              className="text-sm font-semibold hover:text-pink-600 transition-colors"
              style={{ color: F.inkSoft }}
            >
              + เพิ่มสมาชิก
            </Link>
          </div>
          
          <div className="space-y-3">
            {personalPets.length === 0 ? (
              <div className="p-8 text-center text-sm font-medium border border-dashed rounded-xl bg-gray-50" style={{ borderColor: F.line, color: F.muted }}>
                ยังไม่มีข้อมูลสัตว์เลี้ยง
              </div>
            ) : (
              personalPets.map(pet => <PetBusinessLink key={pet.id} pet={pet} />)
            )}
          </div>
        </section>

        {/* 🏡 Sections: Farm Pets */}
        {Object.entries(farmPets).map(([farmId, farm]) => (
          <section key={farmId} className="premium-card p-6">
            <div className="flex justify-between items-center mb-5">
              <h3 className="font-bold text-gray-900 flex items-center gap-2 text-base min-w-0">
                <span className="text-gray-400 shrink-0"><Icon.Building /></span> 
                <span className="truncate">{farm.name}</span>
                <span className="text-xs font-medium text-gray-400 ml-1 shrink-0">({farm.pets.length})</span>
              </h3>
              <Link 
                href={`/farm-dashboard/${farmId}/pets/create`} 
                className="text-sm font-semibold hover:text-blue-600 transition-colors shrink-0"
                style={{ color: F.inkSoft }}
              >
                + เพิ่มสมาชิก
              </Link>
            </div>
            
            <div className="space-y-3">
              {farm.pets.length === 0 ? (
                <div className="p-8 text-center text-sm font-medium border border-dashed rounded-xl bg-gray-50" style={{ borderColor: F.line, color: F.muted }}>
                  ยังไม่มีสมาชิกในฟาร์มนี้
                </div>
              ) : (
                farm.pets.map(pet => <PetBusinessLink key={pet.id} pet={pet} />)
              )}
            </div>
          </section>
        ))}

      </div>
    </>
  );
}

// ─── Refined Helper Component (เลียนแบบ BusinessLink เด๊ะๆ) ───────────────────────
function PetBusinessLink({ pet }: { pet: any }) {
  const isMale = pet.gender === 'male' || pet.gender === 'ตัวผู้';

  const formatBreed = (rawBreed?: string | null) => {
    if (!rawBreed) return { th: "ไม่ระบุสายพันธุ์", en: null };
    const parts = rawBreed.split('(');
    if (parts.length > 1) {
      return { th: parts[0].trim(), en: `(${parts[1].trim()}` };
    }
    return { th: rawBreed, en: null };
  };
  const breedParts = formatBreed(pet.breed || speciesTh(pet.species) || null);

  return (
    <Link 
      href={`/pets/${pet.id}`} 
      className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 bg-white hover:bg-gray-50 hover:border-gray-200 transition-all group"
    >
      {/* รูปภาพ */}
      <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 border border-gray-100 bg-gray-50 flex items-center justify-center">
        {pet.image_url ? (
          <img src={pet.image_url} alt={pet.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="text-gray-300 text-lg">🐾</div>
        )}
      </div>

      {/* ข้อมูล */}
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <div className="flex items-center gap-2 mb-1">
          {/* Badge เพศ */}
          <span className={`text-[10px] font-medium border px-2 py-0.5 rounded-md bg-white shrink-0 flex items-center gap-1 ${
            isMale ? 'text-blue-500 border-blue-200' : 'text-pink-500 border-pink-200'
          }`}>
            <span className="shrink-0">{isMale ? <Icon.Male /> : <Icon.Female />}</span>
            {isMale ? 'Male' : 'Female'}
          </span>
          {/* ชื่อสัตว์เลี้ยง */}
          <p className="font-semibold text-sm text-gray-900 truncate">{pet.name}</p>
        </div>
        
        {/* 🌟 ชื่อสายพันธุ์แยกบรรทัดไทย-อังกฤษ */}
        <div className="flex flex-col">
          <span className="text-[11px] sm:text-xs text-gray-500 font-medium truncate">{breedParts.th}</span>
          {breedParts.en && (
            <span className="text-[10px] text-gray-400 truncate mt-[1px]">{breedParts.en}</span>
          )}
        </div>
      </div>

      {/* ลูกศรขวา */}
      <span className="text-gray-300 group-hover:text-gray-900 transition-colors shrink-0">
        <Icon.ChevronRight />
      </span>
    </Link>
  );
}