"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

export default function PublicFarmProfile() {
  const router = useRouter();
  const params = useParams();
  const farmId = params.id as string;

  const [farm, setFarm] = useState<any>(null);
  const [pets, setPets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchFarmProfile = async () => {
      try {
        const { data: farmData, error: farmError } = await supabase
          .from('farms')
          .select('*')
          .eq('id', farmId)
          .single();
          
        if (farmError) throw farmError;
        setFarm(farmData);

        // 🌟 ดึงข้อมูลสัตว์เลี้ยง โดยเผื่อคำศัพท์สถานะต่างๆ ไว้ให้ครบ
        const { data: petsData } = await supabase
          .from('pets')
          .select('id, name, breed, image_url, gender, status, price')
          .eq('farm_id', farmId)
          .in('status', ['พ่อแม่พันธุ์', 'พ่อพันธุ์', 'แม่พันธุ์', 'พร้อมย้าย', 'พร้อมย้ายบ้าน']);
          
        if (petsData) setPets(petsData);

      } catch (error) {
        console.error("Error fetching farm:", error);
        alert("ไม่พบข้อมูลฟาร์มนี้ครับ");
        router.push('/');
      } finally {
        setIsLoading(false);
      }
    };

    if (farmId) fetchFarmProfile();
  }, [farmId, router]);

  if (isLoading) return <div className="min-h-screen flex items-center justify-center text-pink-500 font-bold animate-pulse">กำลังเปิดประตูฟาร์ม... 🏡</div>;
  if (!farm) return null;

  return (
    <div className="min-h-screen bg-gray-50 pb-20 animate-in fade-in duration-700">
      
      <div className="h-48 md:h-64 bg-gradient-to-r from-pink-400 to-rose-400 relative">
        <button onClick={() => router.back()} className="absolute top-6 left-4 md:left-8 w-10 h-10 flex items-center justify-center bg-white/30 backdrop-blur-md hover:bg-white/50 text-white rounded-xl transition">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
        </button>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-8 -mt-16 relative z-10">
        <div className="bg-white rounded-[2.5rem] p-6 md:p-10 shadow-xl shadow-pink-100/50 border border-gray-100">
          <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start text-center sm:text-left">
            <div className="w-24 h-24 md:w-32 md:h-32 bg-white rounded-full border-4 border-white shadow-lg flex items-center justify-center text-4xl shrink-0 -mt-12 sm:-mt-16 overflow-hidden">
               🏡
            </div>
            
            <div className="flex-1 space-y-2">
              <h1 className="text-2xl md:text-4xl font-black text-gray-800 tracking-tight">{farm.farm_name}</h1>
              <p className="text-sm font-bold text-gray-500">{farm.description || 'ฟาร์มคุณภาพบนระบบ Whiskora'}</p>
              
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-2">
                <span className="bg-pink-50 text-pink-600 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5">
                  📞 {farm.phone || 'ไม่ระบุเบอร์โทร'}
                </span>
                <span className="bg-gray-50 text-gray-600 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5">
                  📍 {farm.address || 'ไม่ระบุที่อยู่'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10">
          <h2 className="text-xl font-black text-gray-800 mb-6 flex items-center gap-2">
            🐾 สมาชิกในฟาร์ม ({pets.length})
          </h2>
          
          {pets.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 text-center border border-gray-100">
              <p className="text-gray-400 font-bold">ยังไม่มีข้อมูลพ่อแม่พันธุ์ หรือเด็กๆ ที่พร้อมย้ายในตอนนี้ครับ</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {pets.map(pet => {
                // 🌟 ตัวแปรเช็คสถานะน้อง
                const isReadyToMove = pet.status === 'พร้อมย้าย' || pet.status === 'พร้อมย้ายบ้าน';
                const isBreeder = pet.status === 'พ่อแม่พันธุ์' || pet.status === 'พ่อพันธุ์' || pet.status === 'แม่พันธุ์';

                return (
                  <Link href={`/p/${pet.id}`} key={pet.id} className="bg-white rounded-3xl p-4 border border-gray-100 shadow-sm flex flex-col items-center text-center hover:border-pink-300 hover:shadow-md transition-all group">
                    <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-50 mb-3 group-hover:scale-105 transition-transform">
                      {pet.image_url ? (
                        <img src={pet.image_url} alt={pet.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-3xl">🐾</div>
                      )}
                    </div>
                    <h3 className="font-black text-gray-800">{pet.name}</h3>
                    <p className="text-[10px] font-bold text-gray-400 mt-1 truncate w-full">{pet.breed || 'ไม่ระบุสายพันธุ์'}</p>

                    <div className="mt-3 w-full">
                      {isReadyToMove && (
                        <div className="bg-pink-50 rounded-xl py-1.5 px-2">
                          <p className="text-[9px] text-pink-400 font-bold uppercase tracking-wider">พร้อมย้ายบ้าน</p>
                          <p className="text-sm font-black text-pink-600">
                            {pet.price ? `฿${pet.price.toLocaleString()}` : 'ติดต่อสอบถาม'}
                          </p>
                        </div>
                      )}
                      
                      {isBreeder && (
                        <div className="bg-blue-50 rounded-xl py-1.5 px-2">
                          <p className="text-xs font-black text-blue-500 mt-1">👑 พ่อแม่พันธุ์</p>
                        </div>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}