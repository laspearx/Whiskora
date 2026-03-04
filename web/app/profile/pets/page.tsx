"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";

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

  if (loading) return <div className="min-h-screen flex items-center justify-center text-pink-500 font-bold animate-pulse">กำลังรวบรวมแก๊งแสบ... 🐾</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 pt-6 pb-20 animate-in fade-in duration-700">
      
<div className="flex items-center gap-4 mb-10">
  <button 
    onClick={() => router.push('/profile')} // 🌟 เปลี่ยนจาก router.back() หรือ farmId เป็นไประบุที่หน้าโปรไฟล์โดยตรง
    className="p-3 bg-white rounded-2xl shadow-sm border border-gray-100 text-gray-400 hover:text-pink-500 transition active:scale-90"
  >
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
    </svg>
  </button>
  <div>
    <h1 className="text-2xl font-black text-gray-800 tracking-tight">สัตว์เลี้ยงของฉัน 🐾</h1>
    <p className="text-sm font-bold text-pink-500">จัดการสมาชิกในบ้านและฟาร์มทั้งหมด</p>
  </div>
</div>

      {/* 🌟 ปรับระยะห่างระหว่างหมวดหมู่จาก space-y-10 เป็น space-y-16 */}
      <div className="space-y-16">
        
        {/* 🏠 หมวด: สัตว์เลี้ยงส่วนตัว */}
        <section className="animate-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center justify-between mb-5 px-2">
            <h2 className="text-lg font-black text-gray-700 flex items-center gap-2">
              <span>🏠</span> สัตว์เลี้ยงส่วนตัว ({personalPets.length})
            </h2>
            <Link href="/pets/create" className="text-[10px] font-bold text-pink-500 bg-pink-50 px-3 py-1.5 rounded-full hover:bg-pink-100 transition">+ สัตว์เลี้ยง</Link>
          </div>
          {personalPets.length === 0 ? (
            <div className="bg-gray-50/50 rounded-[2rem] p-10 text-center border-2 border-dashed border-gray-200 text-gray-400 font-bold text-sm">ไม่มีข้อมูลสัตว์เลี้ยงส่วนตัว</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {personalPets.map(pet => <PetGridCard key={pet.id} pet={pet} />)}
            </div>
          )}
        </section>

        {/* 🏡 หมวด: แยกตามฟาร์ม */}
        {Object.entries(farmPets).map(([farmId, farm]) => (
          <section key={farmId} className="animate-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center justify-between mb-5 px-2">
              <div className="flex items-center gap-3">
                <span className="w-1.5 h-6 bg-pink-400 rounded-full"></span>
                <h2 className="text-lg font-black text-gray-700 truncate">🏡 ฟาร์ม: {farm.name} ({farm.pets.length})</h2>
              </div>
              <Link href={`/farm-dashboard/${farmId}/pets/create`} className="text-[10px] font-bold text-pink-500 bg-pink-50 px-3 py-1.5 rounded-full hover:bg-pink-100 transition">+ สมาชิกฟาร์ม</Link>
            </div>
            {farm.pets.length === 0 ? (
              <div className="bg-gray-50/50 rounded-[2rem] p-10 text-center border-2 border-dashed border-gray-200 text-gray-400 font-bold text-sm">ยังไม่มีสมาชิกในฟาร์มนี้</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {farm.pets.map(pet => <PetGridCard key={pet.id} pet={pet} />)}
              </div>
            )}
          </section>
        ))}

      </div>
    </div>
  );
}

// --- Component การ์ดสัตว์เลี้ยง (จุดกึ่งกลางอุ้งเท้าตามที่เคยแก้) ---
function PetGridCard({ pet }: { pet: any }) {
  return (
    <Link 
      href={`/pets/${pet.id}`} 
      className="bg-white p-4 rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-4 hover:border-pink-200 hover:shadow-md transition-all active:scale-[0.98] group"
    >
      <div className="w-20 h-20 bg-pink-50 rounded-[1.5rem] overflow-hidden shrink-0 border-2 border-white shadow-sm flex items-center justify-center">
        {pet.image_url ? (
          <img src={pet.image_url} alt={pet.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
        ) : (
          <div className="w-full h-20 flex items-center justify-center text-3xl opacity-30 select-none">🐾</div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-black text-gray-800 text-base truncate">{pet.name}</h3>
        <p className="text-[11px] font-bold text-gray-400 truncate mb-2">{pet.breed || pet.species}</p>
        <span className={`inline-block text-[9px] font-black px-2.5 py-1 rounded-full ${
          pet.gender === 'male' || pet.gender === 'ตัวผู้' 
          ? 'bg-blue-50 text-blue-500 border border-blue-100' 
          : 'bg-pink-50 text-pink-500 border border-pink-100'
        }`}>
          {pet.gender === 'male' || pet.gender === 'ตัวผู้' ? '♂ ตัวผู้' : '♀ ตัวเมีย'}
        </span>
      </div>
      <div className="text-gray-200 group-hover:text-pink-300 transition-colors pr-2">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
      </div>
    </Link>
  );
}