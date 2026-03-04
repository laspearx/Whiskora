"use client";

import React, { useEffect, useState, Suspense } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import Link from "next/link";

// 🌟 แยกส่วน Content ออกมาเพื่อให้ใช้ useSearchParams ได้อย่างปลอดภัย
function FarmDashboardContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const farmId = params.id as string;
  
  // 🌟 ดึงค่าจาก URL ว่าเรามาจากหน้าไหน (profile หรือ partner)
  const fromPage = searchParams.get("from") || "profile"; 

  const [farm, setFarm] = useState<any>(null);
  const [petStats, setPetStats] = useState({ breeders: 0, kids: 0, ready: 0, retired: 0, booked: 0 });
  const [financeStats, setFinanceStats] = useState({ income: 0, expense: 0, profit: 0 });
  const [activeLitters, setActiveLitters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 🌟 ฟังก์ชันย้อนกลับที่แม่นยำ (แก้ Error 'Cannot find name' แล้วครับ)
  const handleBackToParent = () => {
    if (fromPage === 'partner') {
      router.push('/partner');
    } else {
      router.push('/profile');
    }
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return router.push("/login");

        const { data: farmData } = await supabase
          .from("farms")
          .select("*")
          .eq("id", farmId)
          .eq("user_id", session.user.id)
          .single();

        if (!farmData) {
          alert("ไม่พบข้อมูลฟาร์ม");
          return router.push("/partner");
        }
        setFarm(farmData);

        const { data: petsData } = await supabase
          .from("pets")
          .select("status")
          .eq("farm_id", farmId);

        if (petsData) {
          const stats = { breeders: 0, kids: 0, ready: 0, retired: 0, booked: 0 };
          petsData.forEach(pet => {
            if (pet.status === "พ่อพันธุ์ / แม่พันธุ์") stats.breeders++;
            else if (pet.status === "เด็ก") stats.kids++;
            else if (pet.status === "พร้อมย้ายบ้าน") stats.ready++;
            else if (pet.status === "ทำหมัน / ปลดระวาง") stats.retired++;
            else if (pet.status === "ติดจอง") stats.booked++;
          });
          setPetStats(stats);
        }

        const { data: txData } = await supabase
          .from("farm_transactions")
          .select("transaction_type, amount")
          .eq("farm_id", farmId);

        if (txData) {
          let totalIncome = 0;
          let totalExpense = 0;
          txData.forEach(tx => {
            if (tx.transaction_type === "income") totalIncome += Number(tx.amount);
            else if (tx.transaction_type === "expense") totalExpense += Number(tx.amount);
          });
          setFinanceStats({ income: totalIncome, expense: totalExpense, profit: totalIncome - totalExpense });
        }

        const { data: littersData } = await supabase
          .from("litters")
          .select(`*, sire:pets!sire_id(name, image_url), dam:pets!dam_id(name, image_url)`)
          .eq("farm_id", farmId)
          .eq("status", "รอคลอด")
          .order("expected_birth_date", { ascending: true });
          
        if (littersData) setActiveLitters(littersData);

      } catch (error) {
        console.error("Error loading dashboard:", error);
      } finally {
        setLoading(false);
      }
    };

    if (farmId) fetchDashboardData();
  }, [farmId, router]);

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
    return diffDays > 0 ? `เหลืออีก ${diffDays} วัน` : "ถึงกำหนดแล้ว!";
  };

  if (loading) return <div className="min-h-[50vh] flex items-center justify-center text-pink-500 font-bold animate-pulse">กำลังโหลดแดชบอร์ด... ⏳</div>;
  if (!farm) return null;

  return (
    <div className="max-w-5xl mx-auto px-4 pt-6 md:pt-10 pb-20 animate-in fade-in duration-700 space-y-8">
      
      {/* 🏡 Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={handleBackToParent} 
            className="p-2.5 bg-white hover:bg-pink-50 text-gray-400 hover:text-pink-600 rounded-xl transition shadow-sm border border-gray-100"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-xl md:text-2xl font-black text-gray-800 tracking-tight">{farm.farm_name}</h1>
            <p className="text-xs font-bold text-pink-500 mt-0.5">แดชบอร์ดการจัดการฟาร์ม</p>
          </div>
        </div>
        <Link href={`/farm-dashboard/${farmId}/pets/create?from=${fromPage}`} className="hidden md:flex text-sm font-bold text-white bg-pink-500 hover:bg-pink-600 px-5 py-2.5 rounded-xl transition shadow-lg shadow-pink-200">
          + เพิ่มสมาชิก
        </Link>
      </div>

      {/* 📊 Section 1: สรุปสมาชิก */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-black text-gray-800 flex items-center gap-2"><span>🐾</span> สรุปสมาชิกฟาร์ม</h2>
          <Link href={`/farm-dashboard/${farmId}/pets?from=${fromPage}`} className="text-xs font-bold text-gray-400 hover:text-pink-500 transition">ดูทั้งหมด ➔</Link>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <Link href={`/farm-dashboard/${farmId}/pets?status=พ่อพันธุ์ / แม่พันธุ์&from=${fromPage}`} className="bg-white p-4 md:p-5 rounded-[1.5rem] border border-gray-100 shadow-sm hover:border-purple-300 transition-all group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-purple-50 rounded-full -mr-6 -mt-6 opacity-50"></div>
            <p className="text-xs font-bold text-pink-500 relative z-10">พ่อแม่พันธุ์</p>
            <div className="mt-2 flex items-end gap-2 relative z-10">
              <span className="text-3xl font-black text-pink-600">{petStats.breeders}</span>
              <span className="text-xs font-medium text-pink-400 mb-1">ตัว</span>
            </div>
          </Link>

          <Link href={`/farm-dashboard/${farmId}/pets?status=เด็ก&from=${fromPage}`} className="bg-white p-4 md:p-5 rounded-[1.5rem] border border-gray-100 shadow-sm hover:border-blue-300 transition-all group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-blue-50 rounded-full -mr-6 -mt-6 opacity-50"></div>
            <p className="text-xs font-bold text-blue-500 relative z-10">เด็กๆ รอย้าย</p>
            <div className="mt-2 flex items-end gap-2 relative z-10">
              <span className="text-3xl font-black text-blue-800">{petStats.kids}</span>
              <span className="text-xs font-medium text-blue-400 mb-1">ตัว</span>
            </div>
          </Link>

          <Link href={`/farm-dashboard/${farmId}/pets?status=พร้อมย้ายบ้าน&from=${fromPage}`} className="bg-white p-4 md:p-5 rounded-[1.5rem] border border-green-100 shadow-sm hover:border-green-300 transition-all group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-green-100 rounded-full -mr-6 -mt-6 opacity-50"></div>
            <p className="text-xs font-bold text-green-600 relative z-10">พร้อมย้ายบ้าน 🌟</p>
            <div className="mt-2 flex items-end gap-2 relative z-10">
              <span className="text-3xl font-black text-green-600">{petStats.ready}</span>
              <span className="text-xs font-medium text-green-500 mb-1">ตัว</span>
            </div>
          </Link>

          <Link href={`/farm-dashboard/${farmId}/pets?status=ทำหมัน / ปลดระวาง&from=${fromPage}`} className="bg-white p-4 md:p-5 rounded-[1.5rem] border border-gray-100 shadow-sm hover:border-gray-300 transition-all group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-red-50 rounded-full -mr-6 -mt-6 opacity-50"></div>
            <p className="text-xs font-bold text-red-500 relative z-10">ปลดระวาง</p>
            <div className="mt-2 flex items-end gap-2 relative z-10">
              <span className="text-3xl font-black text-red-600">{petStats.retired}</span>
              <span className="text-xs font-medium text-red-400 mb-1">ตัว</span>
            </div>
          </Link>
        </div>
      </section>

      {/* 💰 Section 2: การเงิน */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-black text-gray-800 flex items-center gap-2"><span>📊</span> ภาพรวมการเงิน</h2>
          <Link href={`/farm-dashboard/${farmId}/finance?from=${fromPage}`} className="text-xs font-bold text-gray-400 hover:text-pink-500 transition">จัดการบัญชี ➔</Link>
        </div>
        <div className="grid grid-cols-3 gap-3 md:gap-4 mb-4">
          <div className="bg-white p-4 rounded-[1.5rem] border border-gray-100 text-center">
            <p className="text-[10px] font-bold text-gray-400 uppercase">รายรับ</p>
            <p className="text-base font-black text-green-500 mt-1">฿{financeStats.income.toLocaleString()}</p>
          </div>
          <div className="bg-white p-4 rounded-[1.5rem] border border-gray-100 text-center">
            <p className="text-[10px] font-bold text-gray-400 uppercase">รายจ่าย</p>
            <p className="text-base font-black text-red-500 mt-1">฿{financeStats.expense.toLocaleString()}</p>
          </div>
          <div className={`p-4 rounded-[1.5rem] border text-center ${financeStats.profit >= 0 ? 'bg-pink-50 border-pink-100' : 'bg-red-50 border-red-100'}`}>
            <p className={`text-[10px] font-bold uppercase ${financeStats.profit >= 0 ? 'text-pink-400' : 'text-red-400'}`}>กำไร</p>
            <p className={`text-base font-black mt-1 ${financeStats.profit >= 0 ? 'text-pink-600' : 'text-red-600'}`}>฿{financeStats.profit.toLocaleString()}</p>
          </div>
        </div>
      </section>

      {/* 🍼 Section 3: ติดตามการตั้งครรภ์ */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-black text-gray-800 flex items-center gap-2"><span>💕</span> ติดตามการบรีด</h2>
          <Link href={`/farm-dashboard/${farmId}/litters/create?from=${fromPage}`} className="text-xs font-bold text-pink-500 bg-pink-50 px-3 py-1.5 rounded-lg hover:bg-pink-100 transition">+ บันทึกผสมพันธุ์</Link>
        </div>

        <div className="bg-white border-pink-100">
          {activeLitters.length === 0 ? (
            <div className="py-12 text-center flex flex-col items-center">
              <div className="text-4xl opacity-30 mb-2">❤️</div>
              <p className="text-sm font-bold text-gray-500">ยังไม่มีการตั้งท้องในขณะนี้</p>
            </div>
          ) : (
            <div className="space-y-2">
              {activeLitters.map((litter) => {
              const progress = calculatePregnancyProgress(litter.mating_date, litter.expected_birth_date);
              const isDue = progress >= 100;
              const daysLeft = calculateDaysLeft(litter.expected_birth_date);
              let daysLeftColor = isDue ? "text-red-600 animate-pulse font-black" : "text-gray-500";

              return (
                <div key={litter.id} className="bg-white p-5 md:p-6 rounded-[1.5rem] shadow-sm border border-gray-100 hover:border-pink-300 transition-all flex flex-col relative">
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-[11px] font-black bg-pink-50 text-pink-500 px-3 py-1 rounded-full border border-pink-100">
                      ครอก {litter.litter_code || 'ไม่ระบุ'}
                    </span>
                    <Link 
                      href={`/farm-dashboard/${farmId}/litters/${litter.id}/edit?from=${fromPage}`}
                      className="text-[11px] font-bold text-gray-400 hover:text-pink-500 bg-gray-50 hover:bg-pink-50 px-3 py-1.5 rounded-full transition-colors flex items-center gap-1"
                    >
                      ✎ แก้ไข
                    </Link>
                  </div>

                  <div className="flex items-center justify-center gap-4 md:gap-8 mb-6">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-14 h-14 md:w-16 md:h-16 rounded-full border-2 border-blue-100 overflow-hidden bg-blue-50">
                        {litter.sire?.image_url ? <img src={litter.sire.image_url} alt="Sire" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-xl text-blue-400 font-bold">♂</div>}
                      </div>
                      <span className="text-xs font-bold text-blue-400 truncate max-w-[90px] text-center">{litter.sire?.name || "ไม่ระบุพ่อ"}</span>
                    </div>
                    <div className="text-pink-300 text-lg md:text-xl font-bold mb-5">💗</div>
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-14 h-14 md:w-16 md:h-16 rounded-full border-2 border-pink-100 overflow-hidden bg-pink-50">
                        {litter.dam?.image_url ? <img src={litter.dam.image_url} alt="Dam" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-xl text-pink-400 font-bold">♀</div>}
                      </div>
                      <span className="text-xs font-bold text-pink-400 truncate max-w-[90px] text-center">{litter.dam?.name || "ไม่ระบุแม่"}</span>
                    </div>
                  </div>

                  <div className="w-full mb-5">
                    <div className="flex justify-between items-end mb-2 text-xs font-bold text-gray-500">
                      <div>
                        <p>บรีดเมื่อ : <span className="text-gray-700">{new Date(litter.mating_date).toLocaleDateString('th-TH')}</span></p>
                        <p className="mt-0.5">กำหนดคลอด : <span className="text-pink-500">{new Date(litter.expected_birth_date).toLocaleDateString('th-TH')}</span></p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-gray-400">สถานะบรีด {progress}%</p>
                        <p className={`text-sm md:text-base font-black ${daysLeftColor}`}>{daysLeft}</p>
                      </div>
                    </div>
                    <div className="w-full h-3.5 bg-gray-100 rounded-full overflow-hidden border border-gray-100 shadow-inner">
    <div 
      className="h-full rounded-full transition-all duration-1000 ease-out" 
      style={{ 
        width: `${progress}%`, 
        background: 'linear-gradient(90deg, #10B981 0%, #F59E0B 50%, #EF4444 100%)',
        // 🔥 เคล็ดลับคือตรงนี้: กำหนดขนาด Background ให้กว้างเท่ากับตัวแม่ (100%) เสมอ
        backgroundSize: `${(100 / (progress || 1)) * 100}% 100%` 
      }} 
    />
  </div>
</div>

                  <div className="flex justify-center mt-auto">
                    <Link 
                      href={`/farm-dashboard/${farmId}/litters/${litter.id}/birth?from=${fromPage}`} 
                      className={`w-full md:w-3/4 text-center py-3.5 rounded-2xl text-sm font-black transition-all shadow-sm active:scale-[0.98] ${isDue ? 'bg-green-500 text-white hover:bg-green-600' : 'bg-pink-500 text-white hover:bg-pink-600'}`}
                    >
                      {isDue ? '✨ บันทึกคลอดเลย!' : '✨ คลอดแล้ว'}
                    </Link>
                  </div>
                </div>
              );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

// 🌟 ตัวหลักที่ส่งออก
export default function FarmDashboardPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-pink-500 font-bold">🐾 Loading Whiskora...</div>}>
      <FarmDashboardContent />
    </Suspense>
  );
}