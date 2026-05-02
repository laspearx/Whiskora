"use client";

import { useState, useEffect, Suspense } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

// 🌟 Component แยกสำหรับดึงข้อมูล
function AppointmentsList() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dateParam = searchParams.get("date"); // รับค่าวันที่จาก URL

  const [groupedAppointments, setGroupedAppointments] = useState<import('@/lib/types').VaccineGroup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAppointments = async () => {
      if (!dateParam) {
        setLoading(false);
        return;
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push("/login");
          return;
        }

        // 1. ดึงข้อมูลสัตว์เลี้ยงทั้งหมดของ User
        const { data: petsData } = await supabase
          .from("pets")
          .select("id, name, image_url")
          .eq("user_id", session.user.id);

        if (!petsData || petsData.length === 0) {
          setLoading(false);
          return;
        }

        const petIds = petsData.map((p) => p.id);

        // 2. ดึงข้อมูลนัดหมายของทุกตัว
        const { data: vacData } = await supabase
          .from("vaccines")
          .select("*")
          .in("pet_id", petIds);

        if (vacData) {
          // 3. กรองเฉพาะวันที่ตรงกัน
          const filteredAppts = vacData.filter(
            (a) => a.next_due && a.next_due.split("T")[0] === dateParam
          );

          // 4. เอาข้อมูลสัตว์เลี้ยงมาผูกรวมกับนัดหมาย
          const mergedData = filteredAppts.map((appt) => {
            const petInfo = petsData.find((p) => p.id === appt.pet_id);
            return { ...appt, pet: petInfo };
          });

          // 🌟 5. จัดกลุ่มข้อมูลตาม "ชื่อวัคซีน/บริการ"
          const groupedData = mergedData.reduce((acc: Record<string, import('@/lib/types').VaccineGroup>, current: import('@/lib/types').VaccineWithPet) => {
            const type = current.vaccine_name;
            if (!acc[type]) acc[type] = [];
            acc[type].push(current);
            return acc;
          }, {});

          // แปลง Object เป็น Array เพื่อให้ง่ายต่อการ map แสดงผล
          const finalGroupedArray = Object.keys(groupedData).map(key => {
            // เลือกอิโมจิให้ตรงกับประเภท
            let emoji = '💉';
            if (key.includes('เห็บ') || key.includes('หยด')) emoji = '💧';
            else if (key.includes('พยาธิ')) emoji = '💊';

            return {
              vaccineName: key,
              emoji: emoji,
              items: groupedData[key] // รายชื่อสัตว์เลี้ยงในบริการนี้
            };
          });

          setGroupedAppointments(finalGroupedArray);
        }
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, [dateParam, router]);

  // ฟังก์ชันแปลงวันที่
  const formattedDate = dateParam 
    ? new Date(dateParam).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })
    : 'ไม่ระบุวันที่';

  if (loading) return <div className="min-h-[50vh] flex items-center justify-center text-pink-500 font-bold animate-pulse">กำลังโหลดข้อมูลนัดหมาย... ⏳</div>;

  return (
    <div className="max-w-3xl mx-auto px-4 pt-4 md:pt-12 pb-20 animate-in fade-in duration-700 space-y-6">
      
      {/* 🌟 Header */}
      <div className="flex items-center gap-4">
        <Link href="/profile" className="p-2.5 bg-gray-50 hover:bg-pink-50 text-gray-400 hover:text-pink-600 rounded-xl transition shadow-sm border border-gray-100">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 md:w-6 md:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-xl md:text-2xl font-black text-gray-800 tracking-tight">รายการนัดหมาย</h1>
          <p className="text-sm text-pink-500 font-bold mt-0.5">📅 ประจำวันที่ {formattedDate}</p>
        </div>
      </div>

      {/* 🌟 รายการนัดหมาย (แบบจัดกลุ่มตามบริการ) */}
      <div className="space-y-6">
        {groupedAppointments.length === 0 ? (
          <div className="bg-white rounded-[2rem] border border-gray-100 p-10 text-center flex flex-col items-center justify-center shadow-sm">
            <span className="text-5xl mb-4">📭</span>
            <p className="text-gray-500 font-bold text-base">ไม่มีนัดหมายในวันนี้</p>
          </div>
        ) : (
          groupedAppointments.map((group, groupIdx) => (
            <div key={groupIdx} className="bg-white rounded-[2rem] border border-gray-100 p-6 md:p-8 shadow-sm">
              
              {/* หัวข้อกลุ่ม (ชื่อบริการ + อิโมจิ) */}
              <div className="flex items-center gap-3 mb-5 pb-4 border-b border-gray-50">
                <div className="w-10 h-10 bg-pink-50 text-pink-500 rounded-xl flex items-center justify-center text-lg border border-pink-100 shrink-0">
                  {group.emoji}
                </div>
                <h2 className="text-lg md:text-xl font-black text-gray-800 tracking-tight">
                  {group.vaccineName}
                </h2>
              </div>

              {/* รายชื่อสัตว์เลี้ยงในกลุ่มนี้ */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {group.items.map((appt, idx: number) => (
                  <Link 
                    key={idx} 
                    href={`/pets/${appt.cat_id}`} 
                    className="flex items-center gap-3 p-3 rounded-2xl border border-gray-50 bg-gray-50/50 hover:bg-white hover:border-pink-200 hover:shadow-sm transition-all group/card"
                  >
                    {/* รูปสัตว์เลี้ยง */}
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-white border-2 border-white shadow-sm shrink-0">
                      {appt.pet?.image_url ? (
                        <img src={appt.pet.image_url} alt={appt.pet.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-lg bg-pink-50">🐾</div>
                      )}
                    </div>

                    {/* ชื่อ */}
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">นัดของน้อง</p>
                      <h3 className="text-sm font-black text-gray-800 truncate group-hover/card:text-pink-600 transition-colors">
                        {appt.pet?.name || 'ไม่ทราบชื่อ'}
                      </h3>
                    </div>

                    {/* ลูกศรชี้เข้าสมุดพก */}
                    <div className="text-gray-300 group-hover/card:text-pink-400 transition-colors pr-2">
                       <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                       </svg>
                    </div>
                  </Link>
                ))}
              </div>

            </div>
          ))
        )}
      </div>

    </div>
  );
}

// 🌟 Export หลัก ครอบด้วย Suspense ตามกฎของ Next.js
export default function AllAppointmentsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-pink-500 font-bold animate-pulse">กำลังเตรียมข้อมูล... ⏳</div>}>
      <AppointmentsList />
    </Suspense>
  );
}