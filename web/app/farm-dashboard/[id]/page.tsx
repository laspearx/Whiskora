"use client";

import { useEffect, useState, Suspense } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import Link from "next/link";

// ─── Premium Icons ─────────────────────────────────────────────────────────
const Icon = {
  ArrowLeft: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>,
  Filter: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>,
  Male: () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="10" cy="14" r="5"/><line x1="13.5" y1="10.5" x2="21" y2="3"/><polyline points="16 3 21 3 21 8"/></svg>,
  Female: () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="10" r="5"/><line x1="12" y1="15" x2="12" y2="21"/><line x1="9" y1="18" x2="15" y2="18"/></svg>,
  TrendingUp: () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>,
  TrendingDown: () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 17 13.5 8.5 8.5 13.5 2 7"/><polyline points="16 17 22 17 22 11"/></svg>,
  ChevronRight: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>,
};

function FarmDashboardContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const farmId = params.id as string;
  const fromPage = searchParams.get("from") || "profile"; 

  const [farm, setFarm] = useState<import('@/lib/types').Farm | null>(null);
  const [allPets, setAllPets] = useState<import('@/lib/types').Pet[]>([]);
  const [allLitters, setAllLitters] = useState<import('@/lib/types').Litter[]>([]);
  const [transactions, setTransactions] = useState<import('@/lib/types').Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const [filterStatus, setFilterStatus] = useState("");
  const [filterGender, setFilterGender] = useState("");
  const [filterBreed, setFilterBreed] = useState("");

  const handleBackToParent = () => {
    if (fromPage === 'partner') router.push('/partner');
    else router.push('/profile');
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return router.push("/login");

        const { data: farmData } = await supabase.from("farms").select("*").eq("id", farmId).eq("user_id", session.user.id).single();
        if (!farmData) return router.push("/partner");
        setFarm(farmData);

        const { data: petsData } = await supabase.from("pets").select("*").eq("farm_id", farmId);
        if (petsData) setAllPets(petsData);

        const { data: txData } = await supabase.from("farm_transactions").select("*").eq("farm_id", farmId);
        if (txData) setTransactions(txData);

        const { data: littersData } = await supabase.from("litters")
          .select(`*, sire:pets!sire_id(name, image_url), dam:pets!dam_id(name, image_url)`)
          .eq("farm_id", farmId)
          .order("mating_date", { ascending: false });
        if (littersData) setAllLitters(littersData);

      } catch (error) {
        console.error("Error loading dashboard:", error);
      } finally {
        setLoading(false);
      }
    };
    if (farmId) fetchDashboardData();
  }, [farmId, router]);

  // 🌟 Derived Data
  const petStats = {
    breeders: allPets.filter(p => p.status === "พ่อพันธุ์ / แม่พันธุ์").length,
    kids: allPets.filter(p => p.status === "เด็ก").length,
    ready: allPets.filter(p => p.status === "พร้อมย้ายบ้าน").length,
    retired: allPets.filter(p => p.status === "ทำหมัน / ปลดระวาง").length,
  };

  const financeStats = {
    income: transactions.filter(t => t.transaction_type === "income").reduce((a, b) => a + Number(b.amount), 0),
    expense: transactions.filter(t => t.transaction_type === "expense").reduce((a, b) => a + Number(b.amount), 0),
  };
  const netProfit = financeStats.income - financeStats.expense;

  const activeLitters = allLitters.filter(l => l.status === "รอคลอด");

  // 🌟 Filters
  const filteredPets = allPets.filter(pet => {
    return (!filterStatus || pet.status === filterStatus) &&
           (!filterGender || (filterGender === 'male' ? (pet.gender === 'male' || pet.gender === 'ตัวผู้') : (pet.gender === 'female' || pet.gender === 'ตัวเมีย'))) &&
           (!filterBreed || (pet.breed && pet.breed.includes(filterBreed)));
  });

  const uniqueBreeds = Array.from(new Set(allPets.map(p => p.breed ? p.breed.split('(')[0].trim() : "ไม่ระบุ").filter(b => b !== "ไม่ระบุ")));

  // 🌟 Helper: Pregnancy Math
  const calculatePregnancyProgress = (matingDate: string, expectedDate: string) => {
    const start = new Date(matingDate).getTime();
    const end = new Date(expectedDate).getTime();
    const today = new Date().getTime();
    if (today >= end) return 100;
    if (today <= start) return 0;
    return Math.round(((today - start) / (end - start)) * 100);
  };

  const calculateDaysLeft = (expectedDate: string) => {
    const diffDays = Math.ceil((new Date(expectedDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? `${diffDays} วัน` : "ครบกำหนด!";
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-pink-500 font-bold animate-pulse uppercase tracking-widest text-sm">Loading Farm Data... 🐾</div>;
  if (!farm) return null;

  return (
    <div className="max-w-6xl mx-auto px-4 pt-6 md:pt-10 pb-24 animate-in fade-in duration-700 space-y-8 font-sans">
      
      {/* 🏡 Header & Farm Identity */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button onClick={handleBackToParent} className="w-10 h-10 flex items-center justify-center bg-white hover:bg-gray-50 text-gray-400 hover:text-gray-900 rounded-xl transition-colors shadow-sm border border-gray-100">
            <Icon.ArrowLeft />
          </button>
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">{farm.farm_name}</h1>
            <p className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-widest mt-0.5">Farm Management Dashboard</p>
          </div>
        </div>
        <Link href={`/farm-dashboard/${farmId}/pets/create?from=${fromPage}`} className="inline-flex items-center justify-center gap-2 text-sm font-bold text-white bg-gray-900 hover:bg-gray-800 px-5 py-2.5 rounded-xl transition-all shadow-md active:scale-95">
          + เพิ่มสมาชิกฟาร์ม
        </Link>
      </div>

      {/* 📊 Section 1: KPI Overview (Compact) */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-center">
          <p className="text-[9px] md:text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">พ่อแม่พันธุ์</p>
          <p className="text-xl md:text-2xl font-black text-purple-600">{petStats.breeders} <span className="text-xs font-medium text-purple-400">ตัว</span></p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-center">
          <p className="text-[9px] md:text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">เด็กๆ รอย้าย</p>
          <p className="text-xl md:text-2xl font-black text-blue-600">{petStats.kids + petStats.ready} <span className="text-xs font-medium text-blue-400">ตัว</span></p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-center">
          <p className="text-[9px] md:text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">รายรับรวม</p>
          <p className="text-xl md:text-2xl font-black text-green-500">฿{financeStats.income.toLocaleString()}</p>
        </div>
        <div className={`p-4 rounded-2xl border shadow-sm flex flex-col justify-center ${netProfit >= 0 ? 'bg-pink-50 border-pink-100' : 'bg-red-50 border-red-100'}`}>
          <p className={`text-[9px] md:text-[10px] font-bold uppercase tracking-widest mb-0.5 ${netProfit >= 0 ? 'text-pink-400' : 'text-red-400'}`}>กำไรสุทธิ</p>
          <p className={`text-xl md:text-2xl font-black ${netProfit >= 0 ? 'text-pink-600' : 'text-red-600'}`}>
            {netProfit >= 0 ? '' : '-'}฿{Math.abs(netProfit).toLocaleString()}
          </p>
        </div>
      </section>

      {/* 🍼 Section 2: ติดตามสถานะการตั้งครรภ์ (Compact Horizontal Row) */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-black text-gray-900 flex items-center gap-1.5"><span>💕</span> รอคลอด (Active)</h2>
          <Link href={`/farm-dashboard/${farmId}/litters/create?from=${fromPage}`} className="text-[10px] font-bold text-pink-500 bg-pink-50 px-3 py-1.5 rounded-md hover:bg-pink-100 transition">+ บันทึกผสมพันธุ์</Link>
        </div>

        <div className="space-y-3">
          {activeLitters.length === 0 ? (
            <div className="bg-white border border-gray-100 rounded-2xl py-6 text-center shadow-sm">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">ยังไม่มีครอกที่รอคลอด</p>
            </div>
          ) : (
            activeLitters.map((litter) => {
              const progress = calculatePregnancyProgress(litter.mating_date, litter.expected_birth_date);
              const isDue = progress >= 100;
              const daysLeft = calculateDaysLeft(litter.expected_birth_date);

              return (
                <div key={litter.id} className="bg-white p-3.5 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center gap-4 hover:border-pink-200 transition-all">
                  
                  {/* Left: Info & Parents */}
                  <div className="flex items-center justify-between md:justify-start md:w-[35%] gap-3 shrink-0">
                    <div className="text-center w-12">
                      <p className="text-[9px] text-gray-400 font-bold uppercase mb-0.5">Litter</p>
                      <p className="text-sm font-black text-gray-900 leading-none">{litter.litter_code || 'TBA'}</p>
                    </div>
                    <div className="flex items-center gap-2 bg-gray-50 px-2 py-1.5 rounded-xl border border-gray-100">
                      <div className="w-8 h-8 rounded-full bg-blue-100 overflow-hidden border border-blue-200">
                        {litter.sire?.image_url ? <img src={litter.sire.image_url} className="w-full h-full object-cover" /> : <div className="text-center mt-1.5 text-blue-400 text-[10px] font-bold">พ่อ</div>}
                      </div>
                      <span className="text-[10px] animate-pulse">❤️</span>
                      <div className="w-8 h-8 rounded-full bg-pink-100 overflow-hidden border border-pink-200">
                        {litter.dam?.image_url ? <img src={litter.dam.image_url} className="w-full h-full object-cover" /> : <div className="text-center mt-1.5 text-pink-400 text-[10px] font-bold">แม่</div>}
                      </div>
                    </div>
                  </div>

                  {/* Middle: Progress Bar */}
                  <div className="flex-1 w-full">
                    <div className="flex justify-between items-end text-[10px] font-bold mb-1.5 px-1">
                      <span className="text-gray-400">Due: <span className="text-gray-700">{new Date(litter.expected_birth_date).toLocaleDateString('en-GB')}</span></span>
                      <span className={isDue ? 'text-red-500 animate-pulse' : 'text-gray-900'}>{daysLeft} <span className="text-gray-400 font-medium">({progress}%)</span></span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${progress}%`, background: isDue ? '#EF4444' : '#E84677' }} />
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex gap-2 w-full md:w-auto shrink-0 justify-end mt-2 md:mt-0">
                    <Link href={`/farm-dashboard/${farmId}/litters/${litter.id}?from=${fromPage}`} className="px-3 py-2 bg-gray-50 text-gray-600 rounded-lg text-[11px] font-bold border border-gray-200 hover:bg-gray-100">
                      รายละเอียด
                    </Link>
                    <Link href={`/farm-dashboard/${farmId}/litters/${litter.id}/birth?from=${fromPage}`} className={`px-4 py-2 rounded-lg text-[11px] font-bold text-white shadow-sm transition-all ${isDue ? 'bg-red-500 hover:bg-red-600' : 'bg-pink-500 hover:bg-pink-600'}`}>
                      {isDue ? '🔥 บันทึกคลอด!' : 'บันทึกคลอด'}
                    </Link>
                  </div>

                </div>
              );
            })
          )}
        </div>
      </section>

      {/* 🧬 Section 3: Litter History & ROI (Compact Grid) */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-black text-gray-900 flex items-center gap-1.5"><span>📈</span> ประวัติครอก & ผลประกอบการ</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {allLitters.length === 0 ? (
            <div className="col-span-full py-8 text-center bg-white rounded-2xl border border-gray-100 shadow-sm">
              <p className="text-xs font-bold text-gray-400">ยังไม่มีประวัติการบรีด 🐾</p>
            </div>
          ) : (
            allLitters.map(litter => {
              const litterKittens = allPets.filter(p => p.litter_id === litter.id);
              const litterTxs = transactions.filter(t => t.litter_id === litter.id);
              
              const litterIncome = litterTxs.filter(t => t.transaction_type === 'income').reduce((a,b) => a + Number(b.amount), 0);
              const litterExpense = litterTxs.filter(t => t.transaction_type === 'expense').reduce((a,b) => a + Number(b.amount), 0);
              const litterProfit = litterIncome - litterExpense;
              const isBorn = litter.status !== "รอคลอด";

              return (
                <div key={litter.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col hover:shadow-md transition-shadow">
                  {/* Header */}
                  <div className="p-4 border-b border-gray-50 flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="flex -space-x-2">
                        <div className="w-8 h-8 rounded-full border border-white bg-blue-50 overflow-hidden z-10">
                          {litter.sire?.image_url ? <img src={litter.sire.image_url} className="w-full h-full object-cover"/> : <div className="text-center mt-1 text-[10px]">♂</div>}
                        </div>
                        <div className="w-8 h-8 rounded-full border border-white bg-pink-50 overflow-hidden z-0">
                          {litter.dam?.image_url ? <img src={litter.dam.image_url} className="w-full h-full object-cover"/> : <div className="text-center mt-1 text-[10px]">♀</div>}
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-black text-gray-900">{litter.litter_code || 'N/A'}</p>
                        <p className="text-[9px] font-bold text-gray-500">{litter.sire?.name || '?'} x {litter.dam?.name || '?'}</p>
                      </div>
                    </div>
                    <span className={`text-[9px] font-bold px-2 py-1 rounded bg-gray-50 ${isBorn ? 'text-green-600' : 'text-pink-500'}`}>
                      {litter.status}
                    </span>
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
                    {/* Kittens Avatars */}
                    {isBorn && (
                      <div>
                        <p className="text-[9px] font-bold text-gray-400 mb-1.5">ผลผลิต ({litterKittens.length} ตัว)</p>
                        <div className="flex flex-wrap gap-1">
                          {litterKittens.map(k => (
                            <div key={k.id} className="w-6 h-6 rounded-full overflow-hidden bg-gray-100 border border-gray-200" title={k.name}>
                              {k.image_url ? <img src={k.image_url} className="w-full h-full object-cover"/> : <span className="text-[8px] flex justify-center mt-1">🐾</span>}
                            </div>
                          ))}
                          {litterKittens.length === 0 && <span className="text-[10px] text-gray-300">ยังไม่มีข้อมูล</span>}
                        </div>
                      </div>
                    )}

                    {/* Inline ROI & Action */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                      <div className="flex gap-3">
                        <div>
                          <p className="text-[8px] font-bold text-gray-400">รายรับ</p>
                          <p className="text-[11px] font-black text-green-500">{litterIncome.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-[8px] font-bold text-gray-400">ต้นทุน</p>
                          <p className="text-[11px] font-black text-red-500">{litterExpense.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-[8px] font-bold text-gray-400">กำไรสุทธิ</p>
                          <p className={`text-[11px] font-black ${litterProfit >= 0 ? 'text-pink-500' : 'text-gray-500'}`}>{litterProfit > 0 ? '+' : ''}{litterProfit.toLocaleString()}</p>
                        </div>
                      </div>
                      <Link href={`/farm-dashboard/${farmId}/litters/${litter.id}?from=${fromPage}`} className="w-7 h-7 flex items-center justify-center bg-gray-50 text-gray-500 hover:bg-gray-900 hover:text-white rounded-full transition-colors">
                        <Icon.ChevronRight />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* 🐾 Section 4: Farm Directory & Filters (ทำเนียบสมาชิกแบบมีตัวกรอง) */}
      <section>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-4">
          <div>
            <h2 className="text-base font-black text-gray-900 flex items-center gap-1.5"><span>👥</span> Farm Directory</h2>
            <p className="text-[10px] font-bold text-gray-500 mt-0.5">สมาชิกทั้งหมด ({filteredPets.length} ตัว)</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            <div className="bg-gray-50 text-gray-400 p-2 rounded-lg"><Icon.Filter /></div>
            
            <select value={filterStatus} onChange={(e)=>setFilterStatus(e.target.value)} className="bg-white border border-gray-200 text-[10px] md:text-xs font-bold text-gray-700 px-2 py-1.5 rounded-lg outline-none focus:border-pink-300">
              <option value="">ทุกสถานะ</option>
              <option value="พ่อพันธุ์ / แม่พันธุ์">พ่อแม่พันธุ์</option>
              <option value="เด็ก">เด็กๆ (Baby)</option>
              <option value="พร้อมย้ายบ้าน">พร้อมย้ายบ้าน</option>
              <option value="ติดจอง">ติดจอง</option>
              <option value="ทำหมัน / ปลดระวาง">ปลดระวาง</option>
            </select>

            <select value={filterGender} onChange={(e)=>setFilterGender(e.target.value)} className="bg-white border border-gray-200 text-[10px] md:text-xs font-bold text-gray-700 px-2 py-1.5 rounded-lg outline-none focus:border-pink-300">
              <option value="">ทุกเพศ</option>
              <option value="male">ตัวผู้ (Male)</option>
              <option value="female">ตัวเมีย (Female)</option>
            </select>

            <select value={filterBreed} onChange={(e)=>setFilterBreed(e.target.value)} className="bg-white border border-gray-200 text-[10px] md:text-xs font-bold text-gray-700 px-2 py-1.5 rounded-lg outline-none focus:border-pink-300 max-w-[120px] truncate">
              <option value="">ทุกสายพันธุ์</option>
              {uniqueBreeds.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
        </div>

        {filteredPets.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center border border-dashed border-gray-200 text-gray-400 font-medium text-xs">
            ไม่พบสมาชิกที่ตรงกับเงื่อนไขการค้นหา
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredPets.map(pet => {
              const isMale = pet.gender === 'male' || pet.gender === 'ตัวผู้';
              const breedName = pet.breed ? pet.breed.split('(')[0].trim() : "ไม่ระบุ";

              return (
                <Link key={pet.id} href={`/pets/${pet.id}`} className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3 hover:border-pink-200 hover:shadow-md transition-all group">
                  <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 border border-gray-100 bg-gray-50 flex items-center justify-center">
                    {pet.image_url ? <img src={pet.image_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform" /> : <div className="text-gray-300 text-xl">🐾</div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-black text-gray-900 text-xs truncate group-hover:text-pink-600 transition-colors">{pet.name}</h3>
                    <p className="text-[9px] font-bold text-gray-400 truncate mb-1.5">{breedName}</p>
                    <div className="flex gap-1">
                      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${isMale ? 'bg-blue-50 text-blue-600' : 'bg-pink-50 text-pink-600'}`}>
                        {isMale ? <Icon.Male /> : <Icon.Female />} {isMale ? 'M' : 'F'}
                      </span>
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider bg-gray-100 text-gray-600">
                        {pet.status || 'N/A'}
                      </span>
                    </div>
                  </div>
                  <div className="text-gray-300 group-hover:text-gray-500 transition-colors px-1">
                    <Icon.ChevronRight />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

    </div>
  );
}

export default function FarmDashboardPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-gray-400 font-bold uppercase tracking-widest text-sm">Loading Farm Intelligence...</div>}>
      <FarmDashboardContent />
    </Suspense>
  );
}