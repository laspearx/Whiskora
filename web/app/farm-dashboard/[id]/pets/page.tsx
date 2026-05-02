"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import Link from "next/link";

export default function FarmPetsListPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams(); // 🌟 นำเข้า useSearchParams เพื่ออ่านค่า URL
  
  const farmId = params.id as string;
  const statusFilter = searchParams.get("status"); // 🌟 ดึงคำว่า "พร้อมย้ายบ้าน", "เด็ก" ฯลฯ ออกมาจาก URL

  const [pets, setPets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFarmPets = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push("/login");
          return;
        }

        // 🌟 เริ่มสร้างคำสั่งดึงข้อมูล
        let query = supabase
          .from("pets")
          .select("*")
          .eq("farm_id", farmId)
          .eq("user_id", session.user.id)
          .order("created_at", { ascending: false });

        // 🌟 ถ้า URL มีการส่ง status มาด้วย ให้เพิ่มเงื่อนไขการกรอง (Filter)
        if (statusFilter) {
          query = query.eq("status", statusFilter);
        }

        const { data: petsData, error } = await query;

        if (error) throw error;
        if (petsData) setPets(petsData);

      } catch (error) {
        console.error("Error fetching farm pets:", error);
        alert("ไม่สามารถดึงข้อมูลสัตว์เลี้ยงได้ครับ");
      } finally {
        setLoading(false);
      }
    };

    if (farmId) fetchFarmPets();
  }, [farmId, statusFilter, router]);

  // ฟังก์ชันคำนวณอายุจากวันเกิด
  const calculateAge = (birthDate: string) => {
    if (!birthDate) return "";
    const birth = new Date(birthDate);
    const today = new Date();
    let years = today.getFullYear() - birth.getFullYear();
    let months = today.getMonth() - birth.getMonth();
    
    if (months < 0 || (months === 0 && today.getDate() < birth.getDate())) {
      years--;
      months += 12;
    }
    if (today.getDate() < birth.getDate()) {
      months--;
    }
    if (years === 0 && months === 0) return "(อายุไม่ถึง 1 เดือน)";
    
    let ageStr = "(อายุ ";
    if (years > 0) ageStr += `${years} ปี `;
    if (months > 0) ageStr += `${months} เดือน`;
    ageStr = ageStr.trim() + ")";
    
    return ageStr;
  };

  // ฟังก์ชันแยกชื่อสายพันธุ์ ไทย-อังกฤษ ออกจากกัน
  const formatBreed = (breedStr: string) => {
    if (!breedStr) return { thai: 'พันธุ์ผสม / อื่นๆ', eng: '' };
    const parts = breedStr.split('(');
    if (parts.length > 1) {
      return { thai: parts[0].trim(), eng: `(${parts[1].trim()}` };
    }
    return { thai: breedStr.trim(), eng: '' };
  };

  if (loading) return <div className="min-h-[50vh] flex items-center justify-center text-pink-500 font-bold animate-pulse">กำลังโหลดสมาชิกในฟาร์ม... ⏳</div>;

  return (
    <div className="max-w-5xl mx-auto px-4 pt-6 md:pt-10 pb-20 animate-in fade-in duration-700 space-y-6">
      
      {/* 🔙 ปุ่มย้อนกลับ */}
      <div className="flex items-center gap-4 mb-2">
        <Link href={`/farm-dashboard/${farmId}`} className="p-2.5 bg-white hover:bg-pink-50 text-gray-400 hover:text-pink-600 rounded-xl transition shadow-sm border border-gray-100">
           <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
           </svg>
        </Link>
        <div>
          <h1 className="text-xl md:text-2xl font-black text-gray-800 tracking-tight">สัตว์เลี้ยงในฟาร์ม</h1>
          <p className="text-xs font-bold text-pink-500 mt-0.5">จัดการพ่อแม่พันธุ์และเด็กๆ ที่พร้อมย้ายบ้าน</p>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] p-6 md:p-10 border border-pink-100 shadow-sm">
        
        {/* Header ของ Section */}
        <div className="flex justify-between items-center mb-6 md:mb-8 gap-4">
          
          {/* ฝั่งซ้าย: หัวข้อ และ ปุ่มเลิกกรอง */}
          <div className="flex flex-col">
            <h2 className="text-lg md:text-xl font-black text-gray-800 tracking-tight">
              {statusFilter ? `${statusFilter}` : 'สมาชิกทั้งหมด'} <span className="text-pink-500">({pets.length})</span>
            </h2>
            
            {/* 🌟 ถ้ามีการกรองข้อมูล ให้แสดงปุ่มล้างตัวกรองด้านล่างหัวข้อ */}
            {statusFilter && (
              <Link 
                href={`/farm-dashboard/${farmId}/pets`} 
                className="inline-flex items-center gap-1.5 mt-1.5 text-[11px] font-bold text-gray-500 bg-gray-100 hover:bg-pink-100 hover:text-pink-600 px-3 py-1 rounded-full transition-colors w-fit"
              >
                ✖ เลิกกรอง (ดูทั้งหมด)
              </Link>
            )}
          </div>
          
          {/* ฝั่งขวา: ปุ่มเพิ่มสมาชิก (ล็อคให้อยู่บรรทัดเดียวกับหัวข้อ) */}
          <Link 
            href={`/farm-dashboard/${farmId}/pets/create`} 
            className="text-xs md:text-sm font-bold text-pink-500 hover:text-white hover:bg-pink-500 px-4 py-2 bg-pink-50 rounded-xl transition-all shrink-0 whitespace-nowrap"
          >
            + เพิ่มสมาชิกใหม่
          </Link>

        </div>

        {pets.length === 0 ? (
          // 📭 กรณีไม่มีข้อมูล
          <div className="bg-gray-50/50 rounded-[2rem] py-16 px-6 text-center flex flex-col items-center justify-center border-2 border-dashed border-gray-200">
            <div className="text-6xl opacity-30 mb-4">🐾</div>
            <h3 className="font-bold text-gray-700 text-lg">
              {statusFilter ? `ไม่พบสมาชิกสถานะ "${statusFilter}"` : 'ฟาร์มของคุณยังไม่มีสัตว์เลี้ยง'}
            </h3>
            {!statusFilter && (
              <>
                <p className="text-sm text-gray-400 mt-2 mb-6">เริ่มเพิ่มพ่อแม่พันธุ์หรือเด็กๆ ที่พร้อมย้ายบ้านได้เลย</p>
                <Link 
                  href={`/farm-dashboard/${farmId}/pets/create`} 
                  className="bg-gray-900 hover:bg-pink-500 text-white px-8 py-3.5 rounded-2xl font-bold transition-all shadow-md"
                >
                   เพิ่มสัตว์เลี้ยงตัวแรก
                </Link>
              </>
            )}
          </div>
        ) : (
          // 🐾 รายการสัตว์เลี้ยง
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pets.map((pet) => {
              const breed = formatBreed(pet.breed);

              return (
                <Link 
                  key={pet.id} 
                  href={`/pets/${pet.id}`} 
                  className="bg-white border border-gray-100 p-4 rounded-3xl shadow-sm flex gap-4 hover:border-pink-300 hover:shadow-md transition-all group"
                >
                  {/* รูป */}
                  <div className="w-20 h-20 md:w-24 md:h-24 bg-gray-50 rounded-2xl overflow-hidden shrink-0 border border-gray-100 self-center">
                    {pet.image_url ? (
                      <img src={pet.image_url} alt={pet.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-3xl">🐾</div>
                    )}
                  </div>

                  {/* ข้อมูล */}
                  <div className="flex-1 min-w-0 flex flex-col justify-center py-0.5">
                    
                    {/* แถว 1: ชื่อ + อายุ + ลูกศร */}
                    <div className="flex justify-between items-center mb-1.5">
                      <div className="flex items-baseline gap-1.5 truncate pr-2">
                        <h3 className="font-bold text-gray-800 text-base md:text-lg truncate">{pet.name}</h3>
                        {pet.birth_date && (
                          <span className="text-[11px] font-medium text-gray-400 shrink-0">
                            {calculateAge(pet.birth_date)}
                          </span>
                        )}
                      </div>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-300 group-hover:text-pink-400 transition-colors shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>

                    {/* แถว 2: Badge เพศ และ สถานะของฟาร์ม */}
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        pet.gender === 'female' || pet.gender === 'ตัวเมีย' 
                          ? 'bg-pink-50 text-pink-500 border-pink-100' 
                          : 'bg-blue-50 text-blue-500 border-blue-100'
                      }`}>
                        {pet.gender === 'female' || pet.gender === 'ตัวเมีย' ? '♀ ตัวเมีย' : '♂ ตัวผู้'}
                      </span>

                      {pet.status && (
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${
                          pet.status === 'พร้อมย้ายบ้าน' ? 'bg-green-50 text-green-600 border-green-100' : 
                          pet.status === 'จองแล้ว' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                          'bg-gray-50 text-gray-500 border-gray-200'
                        }`}>
                          {pet.status}
                        </span>
                      )}
                    </div>

                    {/* แถว 3: สายพันธุ์ & ราคา */}
                    <div className="flex justify-between items-end mt-auto pt-1">
                      <div className="flex flex-col truncate pr-2">
                        <span className="text-sm font-bold text-gray-700 truncate">{breed.thai}</span>
                        {breed.eng && (
                          <span className="text-[11px] font-medium text-gray-400 truncate mt-0.5">
                            {breed.eng}
                          </span>
                        )}
                      </div>
                      
                      {pet.price && (
                        <span className="text-sm font-black text-pink-500 shrink-0 mb-0.5">
                          ฿{Number(pet.price).toLocaleString()}
                        </span>
                      )}
                    </div>

                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}