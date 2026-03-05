"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function BulkAddVaccinePage() {
  const router = useRouter();
  const [pets, setPets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // 🌟 Form States
  const [vaccineName, setVaccineName] = useState("");
  const [dateGiven, setDateGiven] = useState(new Date().toISOString().split("T")[0]); // ค่าเริ่มต้นคือวันนี้
  const [nextDue, setNextDue] = useState("");
  const [notes, setNotes] = useState("");
  
  // 🌟 State สำหรับเก็บ ID ของสัตว์เลี้ยงที่ถูกเลือก
  const [selectedPetIds, setSelectedPetIds] = useState<string[]>([]);

  useEffect(() => {
    const fetchPets = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return router.push("/login");

        // ดึงข้อมูลสัตว์เลี้ยงทั้งหมดของผู้ใช้นี้
        const { data: petsData, error } = await supabase
          .from("pets")
          .select("id, name, image_url")
          .eq("user_id", session.user.id)
          .order("name", { ascending: true });

        if (error) throw error;
        if (petsData) setPets(petsData);

      } catch (error) {
        console.error("Error fetching pets:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPets();
  }, [router]);

  // ฟังก์ชันเลือก/ยกเลิกเลือก สัตว์เลี้ยง
  const togglePetSelection = (petId: string) => {
    setSelectedPetIds((prev) => 
      prev.includes(petId) 
        ? prev.filter(id => id !== petId) // ถ้ามีอยู่แล้วให้เอาออก
        : [...prev, petId] // ถ้ายังไม่มีให้เพิ่มเข้าไป
    );
  };

  // ฟังก์ชันเลือกทั้งหมด
  const selectAllPets = () => {
    if (selectedPetIds.length === pets.length) {
      setSelectedPetIds([]); // ถ้าเลือกครบแล้วกดอีกที คือยกเลิกทั้งหมด
    } else {
      setSelectedPetIds(pets.map(p => p.id)); // เลือกทุกคน
    }
  };

  // บันทึกข้อมูล
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedPetIds.length === 0) {
      alert("กรุณาเลือกสัตว์เลี้ยงอย่างน้อย 1 ตัวครับ 🐾");
      return;
    }
    if (!vaccineName || !dateGiven) {
      alert("กรุณากรอกชื่อวัคซีนและวันที่ฉีดให้ครบถ้วนครับ");
      return;
    }

    setSubmitting(true);

    try {
      // 🌟 สร้าง Array ของข้อมูลที่จะ Insert เข้า Database
      const insertData = selectedPetIds.map(petId => ({
        pet_id: petId,
        vaccine_name: vaccineName,
        date_given: dateGiven,
        next_due: nextDue || null, // ถ้าไม่ได้ใส่วันนัดครั้งหน้า ให้เป็น null
        notes: notes || null
      }));

      // สั่ง Insert รวดเดียวเลย!
      const { error } = await supabase.from("vaccines").insert(insertData);

      if (error) throw error;

      alert(`บันทึกวัคซีนให้เด็กๆ ${selectedPetIds.length} ตัว สำเร็จแล้ว! 🎉`);
      router.push("/profile"); // กลับหน้าโปรไฟล์

    } catch (error: any) {
      console.error("Error inserting vaccines:", error);
      alert("เกิดข้อผิดพลาด: " + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-pink-500 font-bold animate-pulse">กำลังเรียกเด็กๆ มารวมตัว... 🐾</div>;

  return (
    <div className="max-w-3xl mx-auto px-4 pt-6 pb-24 animate-in fade-in duration-700 space-y-8">
      
      {/* 🔙 Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center bg-white hover:bg-pink-50 text-gray-400 hover:text-pink-600 rounded-xl transition shadow-sm border border-gray-100">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h1 className="text-xl md:text-2xl font-black text-gray-800 tracking-tight">เพิ่มวัคซีน/บริการ แบบกลุ่ม 💉</h1>
          <p className="text-xs font-bold text-gray-500 mt-0.5">บันทึกข้อมูลให้สัตว์เลี้ยงหลายตัวพร้อมกัน</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* 📝 ส่วนที่ 1: ข้อมูลวัคซีน */}
        <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-gray-100 space-y-5">
          <h2 className="text-lg font-black text-pink-500 flex items-center gap-2 mb-2">
            <span>📝</span> ข้อมูลวัคซีน/ยา
          </h2>

          <div>
            <label className="block text-xs font-bold text-gray-400 mb-1.5 uppercase tracking-widest">ชื่อวัคซีน / ยาหยดเห็บหมัด <span className="text-red-500">*</span></label>
            <input 
              type="text" 
              required
              placeholder="เช่น วัคซีนรวม, หยด Revolution" 
              value={vaccineName}
              onChange={(e) => setVaccineName(e.target.value)}
              className="w-full px-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-pink-200 focus:border-pink-300 outline-none transition-all text-sm font-bold text-gray-700"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-gray-400 mb-1.5 uppercase tracking-widest">วันที่ได้รับ <span className="text-red-500">*</span></label>
              <input 
                type="date" 
                required
                value={dateGiven}
                onChange={(e) => setDateGiven(e.target.value)}
                className="w-full px-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-pink-200 outline-none transition-all text-sm font-bold text-gray-700"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 mb-1.5 uppercase tracking-widest">วันนัดครั้งถัดไป</label>
              <input 
                type="date" 
                value={nextDue}
                onChange={(e) => setNextDue(e.target.value)}
                className="w-full px-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-pink-200 outline-none transition-all text-sm font-bold text-gray-700"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 mb-1.5 uppercase tracking-widest">บันทึกเพิ่มเติม</label>
            <textarea 
              rows={2}
              placeholder="เช่น ทำที่คลินิก..., น้ำหนักโดยเฉลี่ย" 
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-pink-200 outline-none transition-all text-sm font-bold text-gray-700 resize-none"
            />
          </div>
        </div>

        {/* 🐾 ส่วนที่ 2: เลือกสัตว์เลี้ยง */}
        <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-black text-pink-500 flex items-center gap-2">
              <span>🐾</span> เลือกเด็กๆ ที่ได้รับวัคซีน
            </h2>
            <button 
              type="button" 
              onClick={selectAllPets}
              className="text-xs font-bold px-3 py-1.5 bg-pink-50 text-pink-500 hover:bg-pink-100 rounded-lg transition"
            >
              {selectedPetIds.length === pets.length ? "ยกเลิกทั้งหมด" : "เลือกทั้งหมด"}
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {pets.map(pet => {
              const isSelected = selectedPetIds.includes(pet.id);
              return (
                <div 
                  key={pet.id} 
                  onClick={() => togglePetSelection(pet.id)}
                  className={`cursor-pointer p-3 rounded-2xl border-2 transition-all relative group flex flex-col items-center text-center ${isSelected ? 'border-pink-500 bg-pink-50 shadow-sm' : 'border-gray-100 hover:border-pink-200 bg-white'}`}
                >
                  {/* ติ๊กถูก */}
                  <div className={`absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center transition-all ${isSelected ? 'bg-pink-500 text-white scale-100' : 'bg-gray-200 text-transparent scale-0 group-hover:scale-100'}`}>
                    ✓
                  </div>
                  
                  <div className="w-14 h-14 md:w-16 md:h-16 rounded-full overflow-hidden bg-gray-100 mb-2 border-2 border-white shadow-sm">
                    {pet.image_url ? <img src={pet.image_url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-2xl opacity-20">🐾</div>}
                  </div>
                  <h3 className={`text-xs md:text-sm font-black truncate w-full px-1 ${isSelected ? 'text-pink-600' : 'text-gray-700'}`}>
                    {pet.name}
                  </h3>
                </div>
              );
            })}
          </div>
        </div>

        {/* 🔘 ปุ่ม Submit */}
        <button 
          type="submit" 
          disabled={submitting || selectedPetIds.length === 0}
          className="w-full bg-gray-900 hover:bg-black text-white font-black py-4 rounded-2xl transition-all shadow-lg active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 text-sm md:text-base flex items-center justify-center gap-2 sticky bottom-6 z-10"
        >
          {submitting ? "กำลังบันทึกข้อมูล... ⏳" : `บันทึกวัคซีนให้ ${selectedPetIds.length} ตัว 💉`}
        </button>

      </form>
    </div>
  );
}