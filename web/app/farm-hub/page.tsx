"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { speciesTh } from "@/lib/species";
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

const READY_STATUSES = ['พร้อมย้ายบ้าน', 'เปิดจอง'];

// ─── Elegant Minimal Icons ──────────────────────────────────────────────────
const Icon = {
  Search: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>,
  Farm: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  Pin: () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  Verified: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="#E84677"><path d="M12 2l2.4 1.8 3 .2.9 2.9 2.4 1.8-.9 2.9.9 2.9-2.4 1.8-.9 2.9-3 .2L12 22l-2.4-1.8-3-.2-.9-2.9L3.3 15l.9-2.9-.9-2.9 2.4-1.8.9-2.9 3-.2L12 2z"/><path d="M9.5 12.5l1.8 1.8 3.7-3.7" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  Male: () => <img src="/icons/icon-men.png" alt="male" style={{width:22,height:22,objectFit:'contain'}} />,
  Female: () => <img src="/icons/icon-women.png" alt="female" style={{width:22,height:22,objectFit:'contain'}} />,
  ImagePlaceholder: () => <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>,
};

type ViewMode = 'all' | 'ready' | 'pets';

export default function FarmHubPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('all');
  const [farms, setFarms] = useState<any[]>([]);
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
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [{ data: farmsData, error: farmsErr }, { data: petsData, error: petsErr }] = await Promise.all([
        supabase.from("farms").select("id, farm_name, cover_url, image_url, species, province, district, is_verified"),
        supabase.from("pets")
          .select("*, farms(farm_name, district, province)")
          .in("status", READY_STATUSES)
          .order("created_at", { ascending: false }),
      ]);
      if (farmsErr) throw farmsErr;
      if (petsErr) throw petsErr;
      setFarms(farmsData || []);
      setPets(petsData || []);
    } catch (error) {
      console.error("Error fetching pet market data:", error);
    } finally {
      setLoading(false);
    }
  };

  function farmLocation(farm: any): string {
    if (!farm) return '';
    const { province, district } = farm;
    if (province === 'กรุงเทพมหานคร') return district ? `เขต${district}` : 'กรุงเทพฯ';
    return province || '';
  }

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

  // ─── สัตว์เลี้ยงพร้อมขาย ───
  const q = searchQuery.toLowerCase().trim();
  const petTypeFiltered = activePetType === "ทั้งหมด" ? pets : pets.filter(p => p.species === activePetType);
  const filteredPets = !q ? petTypeFiltered : petTypeFiltered.filter(p =>
    p.breed?.toLowerCase().includes(q) ||
    p.farms?.farm_name?.toLowerCase().includes(q) ||
    p.farms?.address?.toLowerCase().includes(q) ||
    speciesTh(p.species)?.toLowerCase().includes(q)
  );

  // ─── ฟาร์มพาร์ทเนอร์ ───
  const readyCountForFarm = (farmId: number) =>
    petTypeFiltered.filter(p => p.farm_id === farmId).length;

  const farmTypeFiltered = activePetType === "ทั้งหมด" ? farms : farms.filter(f => f.species === activePetType);
  // ค้นหาฟาร์ม: จับคู่ทั้งชื่อ/จังหวัดฟาร์ม และสายพันธุ์/ชนิดสัตว์ของฟาร์ม (รวมถึงสัตว์พร้อมขายของฟาร์มนั้น)
  const searchedFarms = !q ? farmTypeFiltered : farmTypeFiltered.filter(f =>
    f.farm_name?.toLowerCase().includes(q) ||
    farmLocation(f).toLowerCase().includes(q) ||
    speciesTh(f.species)?.toLowerCase().includes(q) ||
    pets.some(p => p.farm_id === f.id && (
      p.breed?.toLowerCase().includes(q) || speciesTh(p.species)?.toLowerCase().includes(q)
    ))
  );

  const sortedFarms = [...searchedFarms].sort((a, b) => {
    const aComplete = !!(a.cover_url || a.image_url) && !!a.province;
    const bComplete = !!(b.cover_url || b.image_url) && !!b.province;
    if (aComplete !== bComplete) return aComplete ? -1 : 1;
    return readyCountForFarm(b.id) - readyCountForFarm(a.id);
  });

  const displayedFarms = viewMode === 'ready' ? sortedFarms.filter(f => readyCountForFarm(f.id) > 0) : sortedFarms;

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
        .mode-tab {
          flex: 1;
          padding: 8px 10px;
          border-radius: 10px;
          font-size: 12px;
          font-weight: 700;
          border: none;
          cursor: pointer;
          transition: all .18s ease;
          font-family: inherit;
          white-space: nowrap;
        }
      `}</style>

      <div className="max-w-6xl mx-auto px-4 pt-5 pb-24 animate-in fade-in duration-500" style={{ fontFamily: 'var(--font-ui)', color: F.ink }}>

        {/* 🔙 Header & Search */}
        <div className="mb-4 space-y-3">
          <div>
            <h1 className="text-xl md:text-2xl font-extrabold tracking-tight mb-0.5">ฟาร์มสัตว์เลี้ยง</h1>
            <p className="text-xs font-medium" style={{ color: F.muted }}>รวมฟาร์มพาร์ทเนอร์และเด็กๆ พร้อมย้ายบ้านจากฟาร์มคุณภาพ</p>
          </div>

          <div className="relative w-full">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"><Icon.Search /></span>
            <input
              type="text"
              placeholder="ค้นหาฟาร์ม, สายพันธุ์ หรือจังหวัด..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:border-pink-400 focus:ring-4 focus:ring-pink-50 font-medium text-sm transition-all outline-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* 🗂️ Group switcher: ฟาร์มทั้งหมด / ฟาร์มที่มีสัตว์พร้อมขาย / สัตว์พร้อมขาย */}
          <div className="flex gap-1.5 p-1 bg-gray-100 rounded-xl w-full">
            <button
              className="mode-tab"
              style={viewMode === 'all' ? { background: '#111827', color: 'white' } : { background: 'transparent', color: F.muted }}
              onClick={() => setViewMode('all')}
            >
              ฟาร์มทั้งหมด
            </button>
            <button
              className="mode-tab"
              style={viewMode === 'ready' ? { background: '#111827', color: 'white' } : { background: 'transparent', color: F.muted }}
              onClick={() => setViewMode('ready')}
            >
              ฟาร์มที่มีสัตว์พร้อมขาย
            </button>
            <button
              className="mode-tab"
              style={viewMode === 'pets' ? { background: '#111827', color: 'white' } : { background: 'transparent', color: F.muted }}
              onClick={() => setViewMode('pets')}
            >
              สัตว์พร้อมขาย
            </button>
          </div>

          {/* 🐾 Pet Type Pills — เล็กลงเพื่อประหยัดพื้นที่ */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {petTypes.map((type) => {
              const isActive = activePetType === type.value;
              return (
                <button
                  key={type.label}
                  onClick={() => setActivePetType(type.value)}
                  className={`px-3 py-1 rounded-lg text-[11px] font-semibold transition-all shrink-0 border ${
                    isActive
                    ? "bg-gray-900 text-white border-gray-900"
                    : "bg-white text-gray-500 border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {type.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* 📦 Content */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="aspect-square bg-gray-50 animate-pulse rounded-xl border border-gray-100"></div>
            ))}
          </div>
        ) : viewMode !== 'pets' ? (
          displayedFarms.length === 0 ? (
            <div className="py-24 text-center bg-gray-50 rounded-3xl border border-dashed border-gray-200">
              <div className="text-gray-300 mb-3 flex justify-center"><Icon.ImagePlaceholder /></div>
              <p className="text-gray-500 font-semibold">ไม่พบฟาร์มในขณะนี้</p>
              <p className="text-sm text-gray-400 mt-1">ลองเปลี่ยนคำค้นหา หรือประเภทสัตว์เลี้ยงดูนะครับ</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
              {displayedFarms.map((farm) => {
                const readyCount = readyCountForFarm(farm.id);
                const location = farmLocation(farm);
                const cover = farm.cover_url || farm.image_url;
                return (
                  <Link key={farm.id} href={`/farm/${farm.id}`} className="premium-card flex flex-col overflow-visible group">
                    <div className="relative">
                      <div className="aspect-[2/1] bg-gray-50 overflow-hidden border-b border-gray-100 rounded-t-[1.25rem]">
                        {cover ? (
                          <img
                            src={cover}
                            alt={farm.farm_name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300 bg-gray-50/50">
                            <Icon.ImagePlaceholder />
                          </div>
                        )}
                      </div>
                      <div className="absolute -bottom-4 left-3 w-9 h-9 rounded-full border-2 border-white overflow-hidden shadow-md" style={{ background: F.pinkSoft }}>
                        {farm.image_url ? (
                          <img src={farm.image_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <img src="/icons/icon-paw-circle-white.png" alt="" className="w-full h-full object-contain p-1.5" />
                        )}
                      </div>
                    </div>

                    <div className="pt-5 pb-2.5 px-2.5">
                      <div className="flex items-center gap-1 mb-1">
                        <h3 className="text-[12.5px] font-bold text-gray-900 truncate leading-tight">{farm.farm_name}</h3>
                        {farm.is_verified && <Icon.Verified />}
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-[10.5px] font-semibold truncate" style={{ color: readyCount > 0 ? F.pink : F.muted }}>
                          {readyCount > 0 ? `${readyCount} ตัวพร้อมขาย` : 'ไม่มีตัวพร้อมขาย'}
                        </div>
                        {location && (
                          <div className="flex items-center gap-0.5 text-[10px] font-medium text-gray-400 flex-shrink-0">
                            <Icon.Pin />
                            <span className="truncate max-w-[70px]">{location}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )
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
