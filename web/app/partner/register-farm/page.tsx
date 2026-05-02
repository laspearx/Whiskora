"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

// 🌟 ตัวเลือกสัตว์เลี้ยงอื่นๆ
const other_pets = [
  { id: "rabbit", label: "กระต่าย", emoji: "🐰" },
  { id: "hamster", label: "หนูแฮมสเตอร์", emoji: "🐹" },
  { id: "bird", label: "นก", emoji: "🦜" },
  { id: "squirrel", label: "กระรอก", emoji: "🐿️" },
  { id: "hedgehog", label: "เม่นแคระ", emoji: "🦔" },
  { id: "fish", label: "ปลา", emoji: "🐟" },
  { id: "turtle", label: "เต่า", emoji: "🐢" },
  { id: "frog", label: "กบ", emoji: "🐸" },
  { id: "lizard", label: "กิ้งก่า", emoji: "🦎" },
  { id: "snake", label: "งู", emoji: "🐍" },
  { id: "raccoon", label: "แร็กคูน", emoji: "🦝" },
  { id: "other", label: "สัตว์อื่นๆ", emoji: "🐾" },
];

export default function RegisterFarmPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  // 🌟 เพิ่ม State สำหรับซับหมวดหมู่และช่องพิมพ์เอง
  const [formData, setFormData] = useState({
    farmName: '',
    species: '',
    subSpecies: '', // เก็บค่าสัตว์แปลกที่เลือก
    customSpecies: '', // เก็บข้อความที่พิมพ์เอง
    phone: '',
    bio: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // ดักการเลือกประเภท
    if (!formData.species) {
      alert('กรุณาเลือกชนิดสัตว์ที่เพาะพันธุ์หลักด้วยครับ');
      return;
    }

    // 🌟 จัดการคำนวณว่าสุดท้ายแล้วจะบันทึกคำว่าอะไรลง Database
    let finalSpecies = formData.species;
    
    if (formData.species === 'other') {
      if (!formData.subSpecies) {
        alert('กรุณาเลือกชนิดสัตว์แปลกด้วยครับ');
        return;
      }
      
      if (formData.subSpecies === 'other') {
        if (!formData.customSpecies.trim()) {
          alert('กรุณาระบุชื่อสัตว์แปลกที่ต้องการด้วยครับ');
          return;
        }
        finalSpecies = formData.customSpecies.trim(); // เอาคำที่พิมพ์เองไปบันทึก
      } else {
        // หาชื่อภาษาไทยจาก list มาบันทึก จะได้แสดงผลสวยๆ (เช่น บันทึกคำว่า "กระต่าย")
        const selectedPet = other_pets.find(p => p.id === formData.subSpecies);
        finalSpecies = selectedPet ? selectedPet.label : formData.subSpecies;
      }
    }

    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/login');
        return;
      }

      // 🌟 บันทึกลงตาราง farms พร้อมกับ finalSpecies ที่ประมวลผลแล้ว
      const { error } = await supabase
        .from('farms')
        .insert([{
          user_id: session.user.id,
          farm_name: formData.farmName,
          species: finalSpecies,
          phone: formData.phone,
          bio: formData.bio
        }]);

      if (error) throw error;

      alert('🎉 ยินดีด้วย! เปิดฟาร์มใหม่เรียบร้อยแล้ว');
      router.push('/partner'); 
      router.refresh(); 
    } catch (error: unknown) {
      console.error('Error registering farm:', error);
      alert(`เกิดข้อผิดพลาด: ${error instanceof Error ? error.message : 'กรุณาลองใหม่'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto py-8 md:py-12 px-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* 🔙 Header + ย้อนกลับตามประวัติจริง */}
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => router.back()} 
          className="p-3 bg-white rounded-2xl shadow-sm border border-gray-100 text-gray-400 hover:text-indigo-500 transition active:scale-90"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h1 className="text-2xl font-black text-gray-800 tracking-tight">เปิดฟาร์มสัตว์เลี้ยง 🏡</h1>
          <p className="text-sm font-bold text-pink-500 italic">"ฟาร์มบรีดสัตว์เลี้ยงที่น่ารักเพื่อคนรักสัตว์"</p>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-pink-100 p-8 md:p-10">
        
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* ชื่อฟาร์ม */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">ชื่อฟาร์มของคุณ <span className="text-pink-500">*</span></label>
            <input 
              required
              type="text" 
              placeholder="เช่น Happy Paw Cattery"
              className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3.5 outline-none focus:border-pink-300 focus:bg-white transition text-sm font-bold text-gray-800"
              value={formData.farmName}
              onChange={(e) => setFormData({...formData, farmName: e.target.value})}
            />
          </div>

          {/* 🌟 ชนิดสัตว์หลัก */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">ชนิดสัตว์ที่เพาะพันธุ์ <span className="text-pink-500">*</span></label>
            <select 
              required
              value={formData.species}
              className={`w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3.5 outline-none focus:border-pink-300 focus:bg-white transition text-sm font-bold appearance-none cursor-pointer ${formData.species === '' ? 'text-gray-400' : 'text-gray-800'}`}
              // ถ้ารีเซ็ตตัวหลัก ต้องเคลียร์ค่าตัวย่อยด้วย
              onChange={(e) => setFormData({...formData, species: e.target.value, subSpecies: '', customSpecies: ''})}
            >
              <option value="" disabled>เลือกประเภท</option>
              <option value="cat">🐱 แมว (Cat)</option>
              <option value="dog">🐶 สุนัข (Dog)</option>
              <option value="other">🐾 อื่นๆ (Other)</option>
            </select>
          </div>

          {/* 🌟 Dropdown: เลือกชนิดสัตว์แปลก (โชว์เฉพาะเมื่อเลือก "อื่นๆ") */}
          {formData.species === 'other' && (
            <div className="animate-in fade-in slide-in-from-top-2">
              <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">ระบุชนิดสัตว์<span className="text-pink-500">*</span></label>
              <div className="relative">
                <select 
                  required
                  value={formData.subSpecies}
                  className={`w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3.5 outline-none focus:border-pink-300 focus:bg-white transition text-sm font-bold appearance-none cursor-pointer ${formData.subSpecies === '' ? 'text-gray-400' : 'text-gray-800'}`}
                  onChange={(e) => setFormData({...formData, subSpecies: e.target.value, customSpecies: ''})}
                >
                  <option value="" disabled>เลือกชนิดสัตว์</option>
                  {other_pets.map(pet => (
                    <option key={pet.id} value={pet.id}>{pet.emoji} {pet.label}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-5 text-gray-400">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                </div>
              </div>
            </div>
          )}

          {/* 🌟 ช่องพิมพ์เอง: (โชว์เฉพาะเมื่อเลือก "สัตว์แปลกอื่นๆ") */}
          {formData.species === 'other' && formData.subSpecies === 'other' && (
            <div className="animate-in fade-in slide-in-from-top-2">
              <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">พิมพ์ชนิดสัตว์ของคุณ <span className="text-pink-500">*</span></label>
              <input 
                required
                type="text" 
                placeholder="เช่น ชินชิลล่า, เฟอร์เรท, แมงมุม"
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3.5 outline-none focus:border-pink-300 focus:bg-white transition text-sm font-bold text-gray-800"
                value={formData.customSpecies}
                onChange={(e) => setFormData({...formData, customSpecies: e.target.value})}
              />
            </div>
          )}

          {/* เบอร์โทรศัพท์ */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">เบอร์โทรศัพท์ติดต่อฟาร์ม <span className="text-pink-500">*</span></label>
            <input 
              required
              type="tel" 
              placeholder="08X-XXX-XXXX"
              className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3.5 outline-none focus:border-pink-300 focus:bg-white transition text-sm font-bold text-gray-800"
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
            />
          </div>

          {/* คำอธิบายสั้นๆ */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">แนะนำฟาร์มของคุณสั้นๆ</label>
            <textarea 
              rows={3}
              placeholder="บอกเล่าเกี่ยวกับประสบการณ์ ความตั้งใจ หรือสายพันธุ์ที่เพาะ..."
              className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3.5 outline-none focus:border-pink-300 focus:bg-white transition text-sm font-medium text-gray-800 resize-none"
              value={formData.bio}
              onChange={(e) => setFormData({...formData, bio: e.target.value})}
            ></textarea>
          </div>

          <div className="pt-4">
            <button 
              disabled={loading}
              type="submit"
              className={`w-full py-4 rounded-2xl font-black text-white transition-all shadow-lg active:scale-[0.98] flex justify-center items-center gap-2 ${loading ? 'bg-gray-400 shadow-none' : 'bg-pink-500 hover:bg-pink-600 shadow-pink-200'}`}
            >
              {loading ? '⏳ กำลังบันทึกข้อมูล...' : '🏡 ยืนยันการสมัครเปิดฟาร์ม'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}