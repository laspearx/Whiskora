"use client";

import { useState, useEffect, Suspense } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import Link from "next/link";

// 🌟 ต้องแยก Component เนื้อหาออกมาเพื่อใช้ Suspense ครอบ (ป้องกัน Error ของ Next.js ตอนใช้ useSearchParams)
function VaccineTimeline() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  
  const petId = params.id as string;
  const filterType = searchParams.get("type"); // ดึงประเภทวัคซีนจาก URL (ถ้ามี)

  const [petName, setPetName] = useState<string>("");
  const [records, setRecords] = useState<import('@/lib/types').Vaccine[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push("/login");
          return;
        }

        // 1. ดึงชื่อสัตว์เลี้ยง
        const { data: petData, error: petError } = await supabase
          .from("pets")
          .select("name")
          .eq("id", petId)
          .eq("user_id", session.user.id)
          .single();

        if (petError || !petData) throw petError;
        setPetName(petData.name);

        // 2. ดึงข้อมูลประวัติวัคซีน
        let query = supabase
          .from("vaccines")
          .select("*")
          .eq("pet_id", petId)
          .order("date_given", { ascending: false }); // เรียงจากล่าสุดไปเก่าสุด

        // ถ้ามีการส่ง type มาจากหน้าก่อน ให้กรองเฉพาะประเภทนั้น
        if (filterType) {
          query = query.eq("vaccine_name", filterType);
        }

        const { data: vaccineData, error: vacError } = await query;
        if (vacError) throw vacError;
        
        if (vaccineData) setRecords(vaccineData);

      } catch (error) {
        console.error("Error fetching timeline:", error);
        alert("ไม่สามารถดึงข้อมูลประวัติได้ครับ");
        router.push(`/pets/${petId}`);
      } finally {
        setIsLoading(false);
      }
    };

    if (petId) fetchHistory();
  }, [petId, filterType, router]);

  if (isLoading) {
    return <div className="min-h-[60vh] flex items-center justify-center text-teal-500 font-bold animate-pulse">กำลังจัดเตรียมข้อมูล... ⏳</div>;
  }

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-700">
      
      {/* 🌟 Header & ปุ่มย้อนกลับ */}
      <div>
        <div className="flex items-center gap-4">
          <Link href={`/pets/${petId}`} className="p-2.5 bg-gray-50 hover:bg-teal-50 text-gray-400 hover:text-teal-600 rounded-xl transition shadow-sm border border-gray-100">
             <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 md:w-6 md:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
             </svg>
          </Link>
          <div>
            <h1 className="text-xl md:text-2xl font-black text-gray-800 tracking-tight">ประวัติสมุดพก</h1>
            <p className="text-xs text-teal-500 font-bold mt-0.5">สมุดพกของน้อง {petName}</p>
          </div>
        </div>

        {/* ถ้ามี Filter ให้แสดงป้ายบอก และปุ่มล้าง Filter */}
        {filterType && (
          <div className="flex items-center gap-2 bg-teal-50 px-4 py-2 rounded-xl border border-teal-100 w-fit mt-3 sm:mt-0">
            <span className="text-[10px] text-teal-600 font-bold uppercase tracking-wider">กำลังดู:</span>
            <span className="text-xs font-black text-teal-700">{filterType}</span>
            <Link href={`/pets/${petId}/vaccines`} className="ml-2 bg-white text-gray-400 hover:text-red-500 rounded-full p-1 transition shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </Link>
          </div>
        )}
      </div>

      {/* 🌟 Timeline Section */}
      <div className="bg-white rounded-[2rem] border border-gray-100 p-6 md:p-8 shadow-sm relative">
        {records.length === 0 ? (
          <div className="text-center py-16 flex flex-col items-center justify-center">
            <span className="text-4xl mb-3">📭</span>
            <p className="text-gray-400 font-bold text-sm">ยังไม่มีประวัติในหมวดหมู่นี้</p>
            <Link href={`/pets/${petId}/vaccines/create`} className="mt-4 text-xs bg-teal-500 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-teal-600 transition shadow-lg shadow-teal-200">
              + เพิ่มประวัติใหม่
            </Link>
          </div>
        ) : (
          <div className="relative border-l-2 border-teal-100 ml-4 md:ml-6 space-y-8 pb-4">
            {records.map((record, index) => (
              <div key={record.id} className="relative pl-6 md:pl-8 group">
                
                {/* วงกลมบนเส้น Timeline */}
                <div className={`absolute -left-[11px] top-1.5 w-5 h-5 rounded-full border-4 border-white shadow-sm transition-all duration-300
                  ${index === 0 ? 'bg-teal-500 ring-4 ring-teal-50' : 'bg-gray-300 group-hover:bg-teal-400'}
                `}></div>
                
                {/* การ์ดข้อมูล */}
                <div className={`bg-white p-5 rounded-2xl border transition-all duration-300 shadow-sm
                  ${index === 0 ? 'border-teal-200 shadow-md ring-1 ring-teal-50' : 'border-gray-100 hover:border-teal-100'}
                `}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                    <div>
                      <h3 className="text-sm font-black text-gray-800">{record.vaccine_name}</h3>
                      <p className="text-xs text-gray-500 font-medium mt-0.5">
                        <span className="font-bold text-gray-400 mr-1">วันที่รับบริการ:</span> 
                        {new Date(record.date_given).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </p>
                    </div>
                    
                    {/* Badge แสดงสถานะล่าสุด (อันแรกสุด) */}
                    {index === 0 && (
                      <span className="inline-block bg-teal-50 text-teal-600 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border border-teal-100 self-start sm:self-auto">
                        ล่าสุด ✨
                      </span>
                    )}
                  </div>

                  {/* วันนัดหมายครั้งถัดไป */}
                  <div className="bg-gray-50/70 rounded-xl p-3.5 border border-gray-100 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center text-lg border border-gray-100 shrink-0">
                      📅
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase mb-0.5">วันนัดครั้งถัดไป</p>
                      {record.next_due ? (
                        <p className="text-xs font-black text-orange-500">
                          {new Date(record.next_due).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                      ) : (
                        <p className="text-xs font-bold text-gray-400">- ไม่มีการนัดหมาย -</p>
                      )}
                    </div>
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// 🌟 Default Export: ครอบเนื้อหาด้วย Suspense เพื่อให้รองรับ useSearchParams ตามหลักการของ Next.js 13+
export default function VaccinesHistoryPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 pt-4 md:pt-12 pb-20">
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-teal-500 font-bold animate-pulse">กำลังโหลดหน้าต่าง...</div>}>
        <VaccineTimeline />
      </Suspense>
    </div>
  );
}