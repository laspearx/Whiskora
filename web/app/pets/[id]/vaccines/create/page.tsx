"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

export default function CreateVaccinePage() {
  const router = useRouter();
  const params = useParams();
  const petId = params.id as string;

  const [petName, setPetName] = useState<string>("");
  
  // 🌟 ปรับให้ค่าเริ่มต้นเป็นค่าว่าง เพื่อบังคับให้แสดงคำว่า "เลือกประเภท..."
  const [selectedType, setSelectedType] = useState("");
  const [customVaccineName, setCustomVaccineName] = useState("");
  
  // ตั้งค่าเริ่มต้นวันที่ฉีดให้เป็น "วันนี้" อัตโนมัติ
  const [dateGiven, setDateGiven] = useState(() => new Date().toLocaleDateString('en-CA')); 
  const [nextDue, setNextDue] = useState("");
  
  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchPetData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push("/login");
          return;
        }

        // ดึงชื่อสัตว์เลี้ยงมาแสดง เพื่อให้รู้ว่ากำลังเพิ่มวัคซีนให้ใคร
        const { data, error } = await supabase
          .from("pets")
          .select("name")
          .eq("id", petId)
          .eq("user_id", session.user.id)
          .single();

        if (error || !data) {
          alert("ไม่พบข้อมูลสัตว์เลี้ยง หรือคุณไม่มีสิทธิ์เข้าถึง");
          router.push("/profile");
          return;
        }

        setPetName(data.name);
      } catch (error) {
        console.error("Error fetching pet:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (petId) fetchPetData();
  }, [petId, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 🌟 เช็คว่าผู้ใช้ได้เลือกประเภทแล้วหรือยัง
    if (!selectedType) {
      alert("กรุณาเลือกประเภทบริการด้วยครับ");
      return;
    }

    // 🌟 กำหนดชื่อวัคซีนที่จะบันทึก ถ้าเลือก "อื่นๆ" ให้เอาข้อความที่พิมพ์เองมาใช้
    const finalVaccineName = selectedType === "วัคซีนเพิ่มเติม" ? customVaccineName : selectedType;

    if (!finalVaccineName || !dateGiven) {
      alert("กรุณากรอกชื่อบริการและวันที่รับบริการให้ครบถ้วนครับ");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from("vaccines")
        .insert([{
          pet_id: petId, // 🌟 เปลี่ยนจาก pet_id เป็น cat_id ให้ตรงกับ Database ของชัช
          vaccine_name: finalVaccineName,
          date_given: dateGiven,
          next_due: nextDue || null
        }]);

      if (error) throw error;

      alert("💉 บันทึกประวัติวัคซีนเรียบร้อยแล้ว!");
      router.push(`/pets/${petId}`); 
      router.refresh(); 
    } catch (error: any) {
      console.error("Error saving vaccine:", error);
      alert(`เกิดข้อผิดพลาด: ${error.message}`);
      setSaving(false);
    }
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center text-teal-500 font-bold animate-pulse">กำลังดึงข้อมูล... ⏳</div>;

  // 🌟 ฟังก์ชันเพิ่มนัดหมายลง Google Calendar
  const addVaccineToGoogleCalendar = async (
    petName: string, 
    vaccineName: string, 
    nextDueDate: string // รับค่าเป็น YYYY-MM-DD เช่น '2026-04-15'
  ) => {
    try {
      // 1. ดึง session ปัจจุบันออกมา เพื่อหา provider_token (กุญแจ Google)
      const { data: { session } } = await supabase.auth.getSession();
      
      // 🔑 provider_token จะมีค่าก็ต่อเมื่อลูกค้าล็อกอินด้วย Google เท่านั้น
      const providerToken = session?.provider_token; 

      if (!providerToken) {
        alert("ไม่สามารถบันทึกได้: กรุณาล็อกอินด้วย Google ใหม่อีกครั้งเพื่อรับสิทธิ์เข้าถึงปฏิทินครับ 🥲");
        return false;
      }

      // 2. คำนวณวันสิ้นสุด (Google แบบ All-day event ต้องตั้งวัน end ให้บวกเพิ่มไปอีก 1 วันเสมอ)
      const startDate = new Date(nextDueDate);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 1);
      const endString = endDate.toISOString().split('T')[0];

      // 3. เตรียมข้อมูลกล่องนัดหมายที่จะส่งไปปฏิทิน
      const event = {
        summary: `💉 นัดฉีดวัคซีน ${vaccineName} ให้น้อง ${petName}`,
        description: `แจ้งเตือนอัตโนมัติจากแอป Whiskora 🐾\nถึงเวลาพาน้อง ${petName} ไปรับวัคซีน ${vaccineName} แล้วครับ!`,
        start: {
          date: nextDueDate, // วันที่เริ่ม
          timeZone: 'Asia/Bangkok',
        },
        end: {
          date: endString,   // วันที่สิ้นสุด (+1 วัน)
          timeZone: 'Asia/Bangkok',
        },
        // แถม! ตั้งค่าให้แจ้งเตือนล่วงหน้า 1 วัน และ 9 โมงเช้าของวันนั้น
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'popup', minutes: 24 * 60 }, // เตือนล่วงหน้า 1 วัน
            { method: 'popup', minutes: 60 * 9 },  // เตือนตอน 9 โมงเช้า
          ],
        },
      };

      // 4. 🚀 ยิง API เข้า Google Calendar โดยตรง!
      const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${providerToken}`, // เอากุญแจมาเสียบตรงนี้
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Google API Error:", errorData);
        throw new Error('บันทึกลงปฏิทินไม่สำเร็จ โทเคนอาจจะหมดอายุ');
      }

      alert("✅ บันทึกนัดหมายลง Google Calendar เรียบร้อยแล้ว! ลองเช็คในแอปปฏิทินได้เลย 📅");
      return true;

    } catch (error) {
      console.error("Calendar Error:", error);
      alert("เกิดข้อผิดพลาด หรือเซสชั่น Google หมดอายุ กรุณาล็อกอินใหม่อีกครั้งครับ");
      return false;
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 pt-4 md:pt-12 pb-10 animate-in fade-in duration-700">
      
      {/* 🌟 ส่วน Header */}
      <div className="flex items-center gap-3 mb-5 md:mb-8 max-w-xl mx-auto">
        <Link href={`/pets/${petId}`} className="p-2 bg-white hover:bg-teal-50 text-gray-400 hover:text-teal-600 rounded-xl transition shadow-sm border border-gray-100">
           <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 md:w-6 md:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
           </svg>
        </Link>
        <div>
          <h1 className="text-xl md:text-3xl font-black text-gray-800 tracking-tight">เพิ่มประวัติวัคซีน</h1>
          <p className="text-xs text-teal-500 font-bold mt-0.5">สมุดพกของน้อง {petName}</p>
        </div>
      </div>

      <div className="max-w-xl mx-auto"> 
        <form onSubmit={handleSubmit} className="bg-white rounded-[2.5rem] p-6 md:p-10 shadow-sm border border-teal-50 space-y-6 md:space-y-8">
          
          <div className="flex justify-center mb-2">
            <div className="w-20 h-20 bg-teal-50 text-teal-500 rounded-full flex items-center justify-center text-4xl shadow-sm border-4 border-white">
              💉
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-400 uppercase ml-1 tracking-wider">ประเภทบริการ *</label>
                <div className="relative">
                  <select 
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    className={`w-full px-5 py-3.5 rounded-2xl bg-gray-50 border border-gray-100 outline-none focus:border-teal-300 focus:bg-white transition-all text-sm font-bold appearance-none cursor-pointer ${selectedType === "" ? "text-gray-400" : "text-gray-800"}`}
                  >
                    {/* 🌟 เพิ่ม option สำหรับให้เลือก และบังคับไม่ให้เลือกซ้ำ */}
                    <option value="" disabled>เลือกประเภท</option>
                    <option value="วัคซีนรวม">วัคซีนรวม</option>
                    <option value="วัคซีนพิษสุนัขบ้า">วัคซีนพิษสุนัขบ้า</option>
                    <option value="หยดหลังป้องกันเห็บหมัด">หยดหลังป้องกันเห็บหมัด</option>
                    <option value="ถ่ายพยาธิ">ถ่ายพยาธิ</option>
                    <option value="วัคซีนเพิ่มเติม">วัคซีนเพิ่มเติม</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-5 text-gray-400">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                  </div>
                </div>
              </div>

              {/* 🌟 แสดงช่องให้พิมพ์เองเฉพาะตอนเลือกข้อ 5 */}
              {selectedType === "วัคซีนเพิ่มเติม" && (
                <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2">
                  <label className="text-xs font-bold text-gray-400 uppercase ml-1 tracking-wider">ระบุชื่อบริการ / วัคซีน *</label>
                  <input 
                    type="text" 
                    value={customVaccineName} 
                    onChange={(e) => setCustomVaccineName(e.target.value)} 
                    required={selectedType === "วัคซีนเพิ่มเติม"}
                    className="w-full px-5 py-3.5 rounded-2xl bg-gray-50 border border-teal-100 outline-none focus:border-teal-400 focus:bg-white transition-all text-sm font-bold text-teal-800" 
                    placeholder="เช่น วัคซีนลิวคีเมีย" 
                  />
                </div>
              )}
            </div>

            {/* วันที่ฉีด และ วันนัดครั้งถัดไป */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-400 uppercase ml-1 tracking-wider">วันที่รับบริการ *</label>
                <div className="relative">
                  <input 
                    type="date" 
                    value={dateGiven} 
                    onChange={(e) => setDateGiven(e.target.value)} 
                    required
                    className="w-full h-[48px] px-4 py-3 rounded-2xl bg-gray-50 border border-gray-100 outline-none focus:border-teal-300 text-sm font-medium text-gray-800 appearance-none block min-w-0 text-center" 
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-400 uppercase ml-1 tracking-wider">วันนัดครั้งถัดไป <span className="text-gray-300 font-normal">(ถ้ามี)</span></label>
                <div className="relative">
                  <input 
                    type="date" 
                    value={nextDue} 
                    onChange={(e) => setNextDue(e.target.value)} 
                    className="w-full h-[48px] px-4 py-3 rounded-2xl bg-gray-50 border border-gray-100 outline-none focus:border-teal-300 text-sm font-medium text-gray-800 appearance-none block min-w-0 text-center" 
                  />
                </div>
              </div>
            </div>
          </div>

          <hr className="border-gray-50" />

          {/* ปุ่มบันทึก */}
          <div className="flex gap-3 pt-2">
            <Link href={`/pets/${petId}`} className="flex-1 text-center py-3.5 rounded-xl font-bold text-gray-400 bg-gray-100 hover:bg-gray-200 transition text-sm">
              ยกเลิก
            </Link>
            <button 
              type="submit" 
              disabled={saving} 
              className="flex-[2] py-3.5 rounded-xl font-bold text-white bg-teal-500 hover:bg-teal-600 shadow-lg shadow-teal-200 transition-all active:scale-95 disabled:opacity-50 text-sm flex justify-center items-center gap-2"
            >
              {saving ? "⏳ กำลังบันทึก..." : "💾 บันทึกประวัติ"}
            </button>
          </div>
          
        </form>
      </div>
    </div>
  );
}