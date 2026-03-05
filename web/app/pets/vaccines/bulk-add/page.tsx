"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function BulkAddVaccinePage() {
  const router = useRouter();

  // 🌟 Form States (เหมือนหน้าเพิ่มวัคซีนเดี่ยว)
  const [selectedType, setSelectedType] = useState("");
  const [customVaccineName, setCustomVaccineName] = useState("");
  const [dateGiven, setDateGiven] = useState(() => new Date().toLocaleDateString('en-CA')); 
  const [nextDue, setNextDue] = useState("");
  
  // 🌟 States สำหรับจัดการสัตว์เลี้ยงแบบกลุ่ม
  const [pets, setPets] = useState<any[]>([]);
  const [selectedPetIds, setSelectedPetIds] = useState<string[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchPets = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push("/login");
          return;
        }

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
        setIsLoading(false);
      }
    };

    fetchPets();
  }, [router]);

  // 🌟 ฟังก์ชันเลือก/ยกเลิกเลือก สัตว์เลี้ยง
  const togglePetSelection = (petId: string) => {
    setSelectedPetIds((prev) => 
      prev.includes(petId) 
        ? prev.filter(id => id !== petId) // ถ้ามีอยู่แล้วให้เอาออก
        : [...prev, petId] // ถ้ายังไม่มีให้เพิ่มเข้าไป
    );
  };

  // 🌟 ฟังก์ชันเลือกทั้งหมด
  const selectAllPets = () => {
    if (selectedPetIds.length === pets.length) {
      setSelectedPetIds([]); // ยกเลิกทั้งหมด
    } else {
      setSelectedPetIds(pets.map(p => p.id)); // เลือกทุกคน
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // เช็คการเลือกประเภทบริการ
    if (!selectedType) {
      alert("กรุณาเลือกประเภทบริการด้วยครับ");
      return;
    }

    // เช็คการเลือกสัตว์เลี้ยง
    if (selectedPetIds.length === 0) {
      alert("กรุณาเลือกเด็กๆ อย่างน้อย 1 ตัวครับ 🐾");
      return;
    }

    const finalVaccineName = selectedType === "วัคซีนเพิ่มเติม" ? customVaccineName : selectedType;

    if (!finalVaccineName || !dateGiven) {
      alert("กรุณากรอกชื่อบริการและวันที่รับบริการให้ครบถ้วนครับ");
      return;
    }

    setSaving(true);
    try {
      // 🌟 สร้าง Array ของข้อมูลที่จะ Insert เข้า Database (ปรับใช้ cat_id ตาม Database ของชัช)
      const insertData = selectedPetIds.map(petId => ({
        cat_id: petId, // 🌟 ใช้ cat_id ให้ตรงกับโครงสร้าง DB ของชัช (ถ้าใช้ pet_id ก็แก้ตรงนี้ได้เลย)
        vaccine_name: finalVaccineName,
        date_given: dateGiven,
        next_due: nextDue || null
      }));

      const { error } = await supabase.from("vaccines").insert(insertData);

      if (error) throw error;

      alert(`💉 บันทึกประวัติวัคซีนให้เด็กๆ ${selectedPetIds.length} ตัว เรียบร้อยแล้ว!`);
      router.push(`/profile`); 
      router.refresh(); 
    } catch (error: any) {
      console.error("Error saving vaccine:", error);
      alert(`เกิดข้อผิดพลาด: ${error.message}`);
      setSaving(false);
    }
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center text-teal-500 font-bold animate-pulse">กำลังดึงข้อมูล... ⏳</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 pt-4 md:pt-12 pb-10 animate-in fade-in duration-700">
      
      {/* 🌟 ส่วน Header */}
      <div className="flex items-center gap-3 mb-5 md:mb-8 max-w-2xl mx-auto">
        <Link href={`/profile`} className="p-2 bg-white hover:bg-teal-50 text-gray-400 hover:text-teal-600 rounded-xl transition shadow-sm border border-gray-100">
           <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 md:w-6 md:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
           </svg>
        </Link>
        <div>
          <h1 className="text-xl md:text-3xl font-black text-gray-800 tracking-tight">เพิ่มวัคซีนแบบกลุ่ม</h1>
          <p className="text-xs text-teal-500 font-bold mt-0.5">บันทึกข้อมูลให้สัตว์เลี้ยงหลายตัวพร้อมกัน</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto"> 
        <form onSubmit={handleSubmit} className="bg-white rounded-[2.5rem] p-6 md:p-10 shadow-sm border border-teal-50 space-y-6 md:space-y-8">
          
          <div className="flex justify-center mb-2">
            <div className="w-20 h-20 bg-teal-50 text-teal-500 rounded-full flex items-center justify-center text-4xl shadow-sm border-4 border-white">
              💉
            </div>
          </div>

          <div className="space-y-6">
            
            {/* 📝 เลือกประเภทบริการ */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-400 uppercase ml-1 tracking-wider">ประเภทบริการ *</label>
                <div className="relative">
                  <select 
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    className={`w-full px-5 py-3.5 rounded-2xl bg-gray-50 border border-gray-100 outline-none focus:border-teal-300 focus:bg-white transition-all text-sm font-bold appearance-none cursor-pointer ${selectedType === "" ? "text-gray-400" : "text-gray-800"}`}
                  >
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

              {/* 🌟 แสดงช่องให้พิมพ์เองเฉพาะตอนเลือกวัคซีนเพิ่มเติม */}
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

            {/* 📅 วันที่ฉีด และ วันนัดครั้งถัดไป */}
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

            <hr className="border-gray-50 my-6" />

            {/* 🐾 ส่วนเลือกสัตว์เลี้ยง (ดีไซน์กลมกลืนกับหน้า Teal) */}
            <div className="space-y-4">
              <div className="flex items-center justify-between ml-1">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">เลือกเด็กๆ ที่รับบริการ *</label>
                <button 
                  type="button" 
                  onClick={selectAllPets}
                  className="text-[10px] md:text-xs font-bold px-3 py-1.5 bg-teal-50 text-teal-600 hover:bg-teal-100 rounded-lg transition"
                >
                  {selectedPetIds.length === pets.length ? "ยกเลิกทั้งหมด" : "เลือกทั้งหมด"}
                </button>
              </div>

              <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                {pets.map(pet => {
                  const isSelected = selectedPetIds.includes(pet.id);
                  return (
                    <div 
                      key={pet.id} 
                      onClick={() => togglePetSelection(pet.id)}
                      className={`cursor-pointer p-3 rounded-2xl border-2 transition-all relative group flex flex-col items-center text-center ${isSelected ? 'border-teal-400 bg-teal-50 shadow-sm' : 'border-gray-100 hover:border-teal-200 bg-white'}`}
                    >
                      {/* ติ๊กถูก */}
                      <div className={`absolute top-1.5 right-1.5 w-4 h-4 md:w-5 md:h-5 rounded-full flex items-center justify-center text-[10px] md:text-xs transition-all ${isSelected ? 'bg-teal-500 text-white scale-100' : 'bg-gray-200 text-transparent scale-0 group-hover:scale-100'}`}>
                        ✓
                      </div>
                      
                      <div className="w-12 h-12 md:w-16 md:h-16 rounded-full overflow-hidden bg-white mb-2 border border-gray-100 shadow-sm">
                        {pet.image_url ? <img src={pet.image_url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-xl opacity-20">🐾</div>}
                      </div>
                      <h3 className={`text-[10px] md:text-xs font-black truncate w-full ${isSelected ? 'text-teal-700' : 'text-gray-600'}`}>
                        {pet.name}
                      </h3>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          <hr className="border-gray-50" />

          {/* 🔘 ปุ่มบันทึก */}
          <div className="flex gap-3 pt-2">
            <Link href={`/profile`} className="flex-1 text-center py-3.5 rounded-xl font-bold text-gray-400 bg-gray-100 hover:bg-gray-200 transition text-sm">
              ยกเลิก
            </Link>
            <button 
              type="submit" 
              disabled={saving || selectedPetIds.length === 0} 
              className="flex-[2] py-3.5 rounded-xl font-bold text-white bg-teal-500 hover:bg-teal-600 shadow-lg shadow-teal-200 transition-all active:scale-95 disabled:opacity-50 text-sm flex justify-center items-center gap-2"
            >
              {saving ? "⏳ กำลังบันทึก..." : `💾 บันทึกให้ ${selectedPetIds.length} ตัว`}
            </button>
          </div>
          
        </form>
      </div>
    </div>
  );
}