"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";

// ─── Premium CI Tokens ─────────────────────────────────────────────────────
const F = {
  ink: '#111827',
  inkSoft: '#4B5563',
  muted: '#9CA3AF',
  pink: '#E84677',
  pinkSoft: '#FDF2F5',
  line: '#E5E7EB',
  paper: '#FFFFFF',
};

// ─── Minimal Icons ─────────────────────────────────────────────────────────
const Icon = {
  ArrowLeft: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>,
  Check: () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
};

export default function BulkAddVaccinePage() {
  const router = useRouter();

  // 🌟 Form States
  const [selectedType, setSelectedType] = useState("");
  const [customVaccineName, setCustomVaccineName] = useState("");
  const [dateGiven, setDateGiven] = useState(() => new Date().toLocaleDateString('en-CA')); 
  const [nextDue, setNextDue] = useState("");
  
  // 🌟 States สำหรับจัดการสัตว์เลี้ยง
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

  // 🌟 เลือก/ยกเลิกเลือก สัตว์เลี้ยง
  const togglePetSelection = (petId: string) => {
    setSelectedPetIds((prev) => 
      prev.includes(petId) 
        ? prev.filter(id => id !== petId)
        : [...prev, petId]
    );
  };

  // 🌟 เลือกทั้งหมด
  const selectAllPets = () => {
    if (selectedPetIds.length === pets.length) {
      setSelectedPetIds([]);
    } else {
      setSelectedPetIds(pets.map(p => p.id));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedType) return alert("กรุณาเลือกประเภทบริการด้วยครับ");
    if (selectedPetIds.length === 0) return alert("กรุณาเลือกเด็กๆ อย่างน้อย 1 ตัวครับ 🐾");

    const finalVaccineName = selectedType === "วัคซีนเพิ่มเติม" ? customVaccineName : selectedType;

    if (!finalVaccineName || !dateGiven) return alert("กรุณากรอกชื่อบริการและวันที่รับบริการให้ครบถ้วนครับ");

    setSaving(true);
    try {
      // 🌟 ใช้ cat_id ตามโครงสร้างเดิมของชัช
      const insertData = selectedPetIds.map(petId => ({
        cat_id: petId, 
        vaccine_name: finalVaccineName,
        date_given: dateGiven,
        next_due: nextDue || null
      }));

      const { error } = await supabase.from("vaccines").insert(insertData);
      if (error) throw error;

      router.push(`/profile`); 
      router.refresh(); 
    } catch (error: any) {
      console.error("Error saving vaccine:", error);
      alert(`เกิดข้อผิดพลาด: ${error.message}`);
      setSaving(false);
    }
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center text-pink-500 font-bold animate-pulse">กำลังดึงข้อมูล... ⏳</div>;

  return (
    <>
      <style>{`
        .premium-input {
          width: 100%; padding: 0.875rem 1.25rem; background: #f9fafb; border: 1px solid #f3f4f6;
          border-radius: 1rem; font-size: 0.875rem; font-weight: 600; color: ${F.ink};
          outline: none; transition: all 0.2s;
        }
        .premium-input:focus { border-color: ${F.pink}; background: #ffffff; box-shadow: 0 0 0 3px ${F.pinkSoft}; }
        .premium-label {
          display: block; font-size: 0.65rem; font-weight: 800; color: ${F.muted};
          text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.375rem; margin-left: 0.25rem;
        }
      `}</style>

      <div className="max-w-3xl mx-auto px-4 pt-6 md:pt-10 pb-24 animate-in fade-in duration-700" style={{ fontFamily: 'var(--font-ui)' }}>
        
        {/* 🌟 Header */}
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center bg-white hover:bg-gray-50 text-gray-400 hover:text-gray-900 rounded-xl transition-all border border-gray-100 shadow-sm">
             <Icon.ArrowLeft />
          </button>
          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight" style={{ color: F.ink }}>เพิ่มประวัติให้หลายตัว</h1>
            <p className="text-xs font-bold mt-1" style={{ color: F.muted }}>เลือกเด็กๆ ที่ไปรับบริการพร้อมกัน</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-[2rem] p-6 md:p-8 shadow-sm border border-gray-100 space-y-10">
          
          {/* 📝 Section 1: รายละเอียดการรับบริการ */}
          <section className="space-y-5">
            <h2 className="text-base font-extrabold flex items-center gap-2" style={{ color: F.ink }}>
              <span className="text-pink-500">📝</span> รายละเอียดการรับบริการ
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="premium-label">ประเภทบริการ / วัคซีน *</label>
                <div className="relative">
                  <select 
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    className={`premium-input appearance-none cursor-pointer ${selectedType === "" ? "text-gray-400" : "text-gray-800"}`}
                  >
                    <option value="" disabled>เลือกประเภทบริการ</option>
                    <option value="วัคซีนรวม">วัคซีนรวม</option>
                    <option value="วัคซีนพิษสุนัขบ้า">วัคซีนพิษสุนัขบ้า</option>
                    <option value="หยดหลังป้องกันเห็บหมัด">หยดหลังป้องกันเห็บหมัด</option>
                    <option value="ถ่ายพยาธิ">ถ่ายพยาธิ</option>
                    <option value="วัคซีนเพิ่มเติม">วัคซีนเพิ่มเติม (พิมพ์ระบุเอง)</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-5 text-gray-400">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                  </div>
                </div>
              </div>

              {selectedType === "วัคซีนเพิ่มเติม" && (
                <div className="animate-in fade-in slide-in-from-top-2">
                  <label className="premium-label">ระบุชื่อบริการ / วัคซีน *</label>
                  <input 
                    type="text" 
                    value={customVaccineName} 
                    onChange={(e) => setCustomVaccineName(e.target.value)} 
                    required={selectedType === "วัคซีนเพิ่มเติม"}
                    className="premium-input" 
                    placeholder="เช่น วัคซีนลิวคีเมีย" 
                  />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="premium-label">วันที่รับบริการ *</label>
                  <input type="date" value={dateGiven} onChange={(e) => setDateGiven(e.target.value)} required className="premium-input h-[48px]" />
                </div>
                <div>
                  <label className="premium-label">วันนัดครั้งถัดไป <span className="font-medium text-gray-300">(ถ้ามี)</span></label>
                  <input type="date" value={nextDue} onChange={(e) => setNextDue(e.target.value)} className="premium-input h-[48px]" />
                </div>
              </div>
            </div>
          </section>

          <hr className="border-gray-50" />

          {/* 🐾 Section 2: เลือกสมาชิก */}
          <section className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-extrabold flex items-center gap-2" style={{ color: F.ink }}>
                  <span className="text-pink-500">🐾</span> เลือกสมาชิก
                </h2>
                <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-widest">เลือกเด็กๆ ที่ไปรับบริการด้วยกัน *</p>
              </div>
              <button 
                type="button" 
                onClick={selectAllPets}
                className="text-[10px] md:text-xs font-extrabold px-3.5 py-1.5 rounded-lg transition-colors"
                style={{ backgroundColor: F.pinkSoft, color: F.pink }}
              >
                {selectedPetIds.length === pets.length ? "ยกเลิกทั้งหมด" : "เลือกทั้งหมด"}
              </button>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-y-6 gap-x-4">
              {pets.map(pet => {
                const isSelected = selectedPetIds.includes(pet.id);
                return (
                  <div 
                    key={pet.id} 
                    onClick={() => togglePetSelection(pet.id)}
                    className="cursor-pointer group flex flex-col items-center text-center relative"
                  >
                    <div className="relative mb-2">
                      {/* Avatar Image */}
                      <div className={`w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden bg-gray-50 flex items-center justify-center transition-all duration-200 border-2 ${isSelected ? 'border-transparent' : 'border-gray-100 group-hover:border-pink-200'}`} 
                           style={isSelected ? { boxShadow: `0 0 0 2px #ffffff, 0 0 0 4px ${F.pink}` } : {}}>
                        {pet.image_url ? (
                          <img src={pet.image_url} className="w-full h-full object-cover" />
                        ) : (
                          <div className="text-2xl opacity-20">🐾</div>
                        )}
                      </div>
                      
                      {/* Checkmark Badge */}
                      <div className={`absolute top-0 right-0 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center transition-transform duration-200 ${isSelected ? 'scale-100' : 'scale-0'}`} style={{ backgroundColor: F.pink, color: '#fff' }}>
                        <Icon.Check />
                      </div>
                    </div>
                    
                    <h3 className={`text-xs font-bold truncate w-full px-1 ${isSelected ? 'text-gray-900' : 'text-gray-400 group-hover:text-gray-600'}`}>
                      {pet.name}
                    </h3>
                  </div>
                );
              })}
            </div>
          </section>

          {/* 🔘 Action Buttons */}
          <div className="flex gap-3 pt-6 border-t border-gray-50">
            <button 
              type="button" 
              onClick={() => router.back()} 
              className="flex-1 py-4 rounded-xl font-bold text-gray-500 bg-white border border-gray-200 hover:bg-gray-50 transition text-sm"
            >
              ยกเลิก
            </button>
            <button 
              type="submit" 
              disabled={saving || selectedPetIds.length === 0} 
              className="flex-[2] py-4 rounded-xl font-bold text-white transition-all active:scale-95 disabled:opacity-50 text-sm flex justify-center items-center shadow-lg"
              style={{ backgroundColor: F.ink }}
            >
              {saving ? "กำลังบันทึก..." : `💾 บันทึกประวัติ (${selectedPetIds.length} ตัว)`}
            </button>
          </div>
          
        </form>
      </div>
    </>
  );
}