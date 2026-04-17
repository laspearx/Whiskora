"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { petService } from "@/services/pet.service";
import type { PetWithFarm } from "@/types";

export default function FarmHubPage() {
  const router = useRouter();
  const [pets, setPets] = useState<PetWithFarm[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    petService
      .getAvailablePets()
      .then(setPets)
      .catch((error) => console.error("Error fetching available pets:", error))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-pink-500 font-bold animate-pulse">กำลังเปิดตลาดสัตว์เลี้ยง... 🐾</div>;

  return (
    <div className="max-w-6xl mx-auto px-4 pt-6 pb-20 animate-in fade-in duration-700">
      
      {/* 🔙 Header */}
      <div className="flex items-center gap-4 mb-10">
        <button onClick={() => router.back()} className="p-3 bg-white rounded-2xl shadow-sm border border-gray-100 text-gray-400 hover:text-pink-500 transition active:scale-90">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <div>
          <h1 className="text-2xl font-black text-gray-800 tracking-tight">Whiskora Market 🛍️</h1>
          <p className="text-sm font-bold text-pink-500">รวมเด็กๆ พร้อมย้ายบ้านจากฟาร์มคุณภาพ</p>
        </div>
      </div>

      {/* 🐾 รายการสัตว์เลี้ยง */}
      {pets.length === 0 ? (
        <div className="bg-gray-50 rounded-[2.5rem] py-20 text-center border-2 border-dashed border-gray-200">
          <div className="text-6xl mb-4 opacity-20">🐾</div>
          <p className="font-bold text-gray-400">ตอนนี้ยังไม่มีสัตว์เลี้ยงที่พร้อมขายในระบบ</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {pets.map((pet) => (
            <div key={pet.id} className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden hover:shadow-xl hover:border-pink-200 transition-all group">
              {/* รูปภาพ */}
              <div className="aspect-[4/3] bg-pink-50 relative overflow-hidden">
                {pet.image_url ? (
                  <img src={pet.image_url} alt={pet.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-5xl opacity-20">🐾</div>
                )}
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-[10px] font-black text-green-600 shadow-sm">
                  พร้อมย้ายบ้าน ✨
                </div>
              </div>

              {/* ข้อมูล */}
              <div className="p-6">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-black text-gray-800 truncate">{pet.name}</h3>
                  <span className="text-pink-500 font-black text-lg">
                    {pet.price ? `฿${pet.price.toLocaleString()}` : "สอบถามราคา"}
                  </span>
                </div>
                
                <p className="text-xs font-bold text-gray-400 mb-4">
                  {pet.breed || pet.species} • {pet.gender === 'male' || pet.gender === 'ตัวผู้' ? '♂ ตัวผู้' : '♀ ตัวเมีย'}
                </p>

                <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-pink-100 rounded-full flex items-center justify-center text-[10px]">🏡</div>
                    <span className="text-[11px] font-bold text-gray-600 truncate max-w-[120px]">
                      {pet.farms?.farm_name}
                    </span>
                  </div>
                  <Link 
                    href={`/pets/${pet.id}`} 
                    className="bg-gray-900 text-white px-4 py-2 rounded-xl text-[11px] font-bold hover:bg-pink-500 transition-colors"
                  >
                    ดูรายละเอียด
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}