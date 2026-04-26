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
  gold: '#D97706',    // สีทองสำหรับสถานะพร้อมย้ายบ้าน (ดูพรีเมียมขึ้น)
  goldSoft: '#FEF3C7',
};

// ─── Elegant Minimal Icons ──────────────────────────────────────────────────
const Icon = {
  Search: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>,
  ArrowLeft: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>,
  Farm: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  Male: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="10" cy="14" r="5"/><line x1="13.5" y1="10.5" x2="21" y2="3"/><polyline points="16 3 21 3 21 8"/></svg>,
  Female: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#E84677" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="10" r="5"/><line x1="12" y1="15" x2="12" y2="21"/><line x1="9" y1="18" x2="15" y2="18"/></svg>,
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
        .select("*, farms(farm_name)")
        .eq("status", "พร้อมย้ายบ้าน")
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

  const filteredPets = pets.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.breed?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.farms?.farm_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
                placeholder="ค้นหาชื่อน้อง, สายพันธุ์ หรือฟาร์ม..."
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
                  
                  {/* Premium Gold Status Badge */}
                  <div 
                    className="absolute top-3 right-3 text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider shadow-sm"
                    style={{ background: F.goldSoft, color: F.gold }}
                  >
                    พร้อมย้ายบ้าน
                  </div>
                </div>

                {/* Pet Details */}
                <div className="p-4 md:p-5 flex flex-col flex-1">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="text-lg font-bold text-gray-900 truncate group-hover:text-pink-600 transition-colors">
                      {pet.name}
                    </h3>
                    <span className="mt-1">
                      {pet.gender === 'male' || pet.gender === 'ตัวผู้' ? <Icon.Male /> : <Icon.Female />}
                    </span>
                  </div>
                  
                  <p className="text-xs font-medium text-gray-500 mb-4">
                    {pet.breed || pet.species}
                  </p>

                  <div className="mt-auto pt-4 border-t border-gray-100 flex flex-col gap-2">
                    <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                      <Icon.Farm />
                      <span className="truncate">{pet.farms?.farm_name}</span>
                    </div>
                    <div className="text-xl font-extrabold tracking-tight" style={{ color: F.ink }}>
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