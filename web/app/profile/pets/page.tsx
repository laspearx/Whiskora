"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
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
};

// ─── Elegant Minimal Icons ──────────────────────────────────────────────────
const Icon = {
  ArrowLeft: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>,
  Home: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  Building: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/></svg>,
  Plus: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
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
      } catch (error) {
        console.error("Error fetching pets:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAllPets();
  }, [router]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center text-sm font-semibold tracking-widest text-gray-400 animate-pulse uppercase">
      Loading Pet Gallery...
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto px-4 pt-10 pb-24 animate-in fade-in duration-700" style={{ fontFamily: 'var(--font-ui)', color: F.ink }}>
      
      {/* 🔙 Sleek Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div className="flex items-start gap-4">
          <button 
            onClick={() => router.push('/profile')} 
            className="mt-1 p-2 bg-white rounded-xl shadow-sm border border-gray-100 text-gray-400 hover:text-gray-900 hover:bg-gray-50 transition-colors"
          >
            <Icon.ArrowLeft />
          </button>
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2">My Pets</h1>
            <p className="text-sm font-medium" style={{ color: F.muted }}>จัดการสมาชิกในบ้านและฟาร์มทั้งหมดของคุณ</p>
          </div>
        </div>
      </div>

      <div className="space-y-20">
        
        {/* 🏠 หมวด: สัตว์เลี้ยงส่วนตัว */}
        <section className="animate-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center justify-between mb-6 px-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gray-50 text-gray-600 flex items-center justify-center border border-gray-100">
                <Icon.Home />
              </div>
              <h2 className="text-xl font-bold text-gray-900">
                สัตว์เลี้ยงส่วนตัว <span className="text-gray-400 font-medium ml-1">({personalPets.length})</span>
              </h2>
            </div>
            <Link 
              href="/pets/create" 
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all border border-gray-200 bg-white text-gray-600 hover:bg-gray-50">
              <Icon.Plus /> เพิ่มสัตว์เลี้ยง
            </Link>
          </div>
          
          {personalPets.length === 0 ? (
            <div className="bg-gray-50/50 rounded-2xl p-12 text-center border border-dashed border-gray-200 text-gray-400 font-medium text-sm">
              ไม่มีข้อมูลสัตว์เลี้ยงส่วนตัวในขณะนี้
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {personalPets.map(pet => <PetGridCard key={pet.id} pet={pet} />)}
            </div>
          )}
        </section>

        {/* 🏡 หมวด: แยกตามฟาร์ม */}
        {Object.entries(farmPets).map(([farmId, farm]) => (
          <section key={farmId} className="animate-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center justify-between mb-6 px-1">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gray-50 text-gray-600 flex items-center justify-center border border-gray-100">
                  <Icon.Building />
                </div>
                <h2 className="text-xl font-bold text-gray-900 truncate max-w-[200px] md:max-w-md">
                  ฟาร์ม: {farm.name} <span className="text-gray-400 font-medium ml-1">({farm.pets.length})</span>
                </h2>
              </div>
              <Link 
                href={`/farm-dashboard/${farmId}/pets/create`} 
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
              >
                <Icon.Plus /> เพิ่มสมาชิกฟาร์ม
              </Link>
            </div>
            
            {farm.pets.length === 0 ? (
              <div className="bg-gray-50/50 rounded-2xl p-12 text-center border border-dashed border-gray-200 text-gray-400 font-medium text-sm">
                ยังไม่มีสมาชิกในฟาร์มนี้
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {farm.pets.map(pet => <PetGridCard key={pet.id} pet={pet} />)}
              </div>
            )}
          </section>
        ))}

      </div>
    </div>
  );
}

// ─── Refined Pet Card Component ───────────────────────────────────────────────
function PetGridCard({ pet }: { pet: any }) {
  const isMale = pet.gender === 'male' || pet.gender === 'ตัวผู้';

  // 🌟 ฟังก์ชันจัดการชื่อสายพันธุ์ (ตัดแยกไทยและอังกฤษให้อยู่คนละบรรทัด)
  const formatBreed = (rawBreed: string | null) => {
    if (!rawBreed) return { th: "ไม่ระบุสายพันธุ์", en: null };
    const parts = rawBreed.split('(');
    if (parts.length > 1) {
      return { 
        th: parts[0].trim(), 
        en: `(${parts[1].trim()}` // เก็บวงเล็บเอาไว้ด้วย
      };
    }
    return { th: rawBreed, en: null };
  };

  const breedParts = formatBreed(pet.breed || pet.species);

  return (
    <Link 
      href={`/pets/${pet.id}`} 
      className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 hover:border-pink-200 hover:shadow-xl hover:shadow-gray-100 transition-all group relative"
    >
      {/* Pet Image Container */}
      <div className="w-20 h-20 rounded-2xl overflow-hidden shrink-0 border border-gray-100 bg-gray-50 flex items-center justify-center relative shadow-inner">
        {pet.image_url ? (
          <img 
            src={pet.image_url} 
            alt={pet.name} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
          />
        ) : (
          <div className="text-gray-200 select-none scale-150">🐾</div>
        )}
      </div>

      {/* Pet Info */}
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <h3 className="font-bold text-gray-900 text-base truncate mb-1 group-hover:text-pink-600 transition-colors">
          {pet.name}
        </h3>
        
        {/* 🌟 สายพันธุ์ที่ถูกแยกบรรทัด */}
        <div className="mb-2">
          <p className="text-xs font-bold text-gray-500 truncate">
            {breedParts.th}
          </p>
          {breedParts.en && (
            <p className="text-[10px] font-medium text-gray-400 truncate">
              {breedParts.en}
            </p>
          )}
        </div>
        
        {/* Sleek Gender Badge */}
        <div>
            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider ${
            isMale 
            ? 'bg-blue-50 text-blue-600 border border-blue-100' 
            : 'bg-pink-50 text-pink-600 border border-pink-100'
            }`}>
            <span className="shrink-0">{isMale ? <Icon.Male /> : <Icon.Female />}</span>
            {isMale ? 'Male' : 'Female'}
            </div>
        </div>
      </div>

      {/* Subtle Interaction Icon */}
      <div className="text-gray-200 group-hover:text-gray-400 transition-colors shrink-0">
        <Icon.ChevronRight />
      </div>
    </Link>
  );
}