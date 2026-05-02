"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function RegisterServicePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    service_name: '',
    phone: '',
    category: '',
    bio: '',
    address: '',
    image_url: ''
  });

  const [selectedSpecies, setSelectedSpecies] = useState<string[]>([]);

  const serviceCategories = [
    { id: 'grooming', label: 'อาบน้ำตัดขน', emoji: '✂️', needAddress: true },
    { id: 'transport', label: 'รับส่งสัตว์เลี้ยง', emoji: '🚗', needAddress: false },
    { id: 'cat_hotel', label: 'โรงแรมสัตว์', emoji: '🏨', needAddress: true },
    { id: 'pet_care', label: 'บริการดูแลสัตว์เลี้ยง', emoji: '🦮', needAddress: false },
    { id: 'clinic', label: 'คลินิก หรือโรงพยาบาลสัตว์', emoji: '🏥', needAddress: true },

  ];

  // เช็คว่า Category ที่เลือกปัจจุบัน "ต้องการที่อยู่" หรือไม่
  const showAddressField = serviceCategories.find(c => c.id === formData.category)?.needAddress;

  const speciesList = [
  { id: "cat", label: "แมว", emoji: "🐱" },
  { id: "dog", label: "สุนัข", emoji: "🐶" }, 
  { id: "rabbit", label: "กระต่าย", emoji: "🐰" },
  { id: "hamster", label: "แฮมสเตอร์", emoji: "🐹" },
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

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return router.push('/login');
      setUserId(session.user.id);
    };
    checkUser();
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const toggleSpecies = (id: string) => {
    setSelectedSpecies(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    if (selectedSpecies.length === 0) return alert('กรุณาเลือกสัตว์ที่รองรับครับ');
    
    setIsLoading(true);

    try {
      const speciesString = selectedSpecies.join(',');

      const { error } = await supabase
        .from('services')
        .insert([{
          user_id: userId,
          service_name: formData.service_name,
          phone: formData.phone,
          category: formData.category,
          bio: formData.bio,
          address: showAddressField ? formData.address : null, // 🌟 บันทึกที่อยู่เฉพาะเมื่อจำเป็น
          supported_species: speciesString
        }]);

      if (error) throw error;

      alert('🐾 บันทึกข้อมูลบริการเรียบร้อยแล้ว!');
      router.push(`/profile`); 
    } catch (error: any) {
      alert('Error: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto pt-6 pb-20 px-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => router.back()} className="p-3 bg-white rounded-2xl shadow-sm border border-gray-100 text-gray-400 hover:text-blue-500 transition active:scale-90">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <div>
          <h1 className="text-2xl font-black text-gray-800 tracking-tight">เปิดบริการสัตว์เลี้ยง ✂️</h1>
          <p className="text-sm font-bold text-blue-500 italic">"ขยายบริการของคุณให้เข้าถึงคนรักสัตว์มากขึ้น"</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        <section className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-blue-50 space-y-5">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">ชื่อร้าน / ชื่อบริการ</label>
            <input required type="text" name="service_name" placeholder="ชื่อบริการของคุณ" value={formData.service_name} onChange={handleChange} className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 outline-none focus:border-blue-400 focus:bg-white transition text-base font-bold text-gray-800" />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">เลือกประเภทบริการ</label>
            <div className="relative">
              <select name="category" value={formData.category} onChange={handleChange} className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 outline-none focus:border-blue-400 focus:bg-white transition text-base font-bold text-gray-800 appearance-none cursor-pointer">
                {serviceCategories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.emoji} {cat.label}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-5 flex items-center pointer-events-none text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">เบอร์โทรศัพท์ติดต่อ</label>
            <input required type="tel" name="phone" placeholder="08X-XXX-XXXX" value={formData.phone} onChange={handleChange} className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 outline-none focus:border-blue-400 focus:bg-white transition text-base font-bold text-gray-800" />
          </div>

          {/* 🌟 ช่องกรอกที่อยู่ (แสดงเฉพาะบางบริการ) */}
          {showAddressField && (
            <div className="animate-in fade-in zoom-in-95 duration-300">
              <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">ที่ตั้งหน้าร้าน / พิกัดบริการ 📍</label>
              <textarea 
                required
                name="address" 
                rows={2} 
                placeholder="เลขที่, ถนน, แขวง/ตำบล..." 
                value={formData.address} 
                onChange={handleChange} 
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 outline-none focus:border-blue-400 focus:bg-white transition text-base font-bold text-gray-800" 
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">รายละเอียดบริการเพิ่มเติม</label>
            <textarea name="bio" rows={3} placeholder="อธิบายจุดเด่นหรือรายละเอียดของบริการ..." value={formData.bio} onChange={handleChange} className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 outline-none focus:border-blue-400 focus:bg-white transition text-base font-bold text-gray-800" />
          </div>
        </section>

        {/* ส่วนเลือกสัตว์ */}
        <section className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-blue-50">
          <label className="block text-sm font-bold text-gray-700 mb-4 ml-1">บริการนี้รองรับสัตว์ชนิดใดบ้าง?</label>
          <div className="grid grid-cols-3 gap-3">
            {speciesList.map((s) => (
              <button key={s.id} type="button" onClick={() => toggleSpecies(s.id)} className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all ${selectedSpecies.includes(s.id) ? 'border-blue-500 bg-blue-50 text-blue-600 scale-[1.05] shadow-sm' : 'border-gray-50 bg-gray-50 text-gray-400 hover:border-gray-200'}`}>
                <span className="text-2xl mb-1">{s.emoji}</span>
                <span className="text-[11px] font-black">{s.label}</span>
              </button>
            ))}
          </div>
        </section>

        <button type="submit" disabled={isLoading} className={`w-full py-5 rounded-[2rem] font-black text-white shadow-xl active:scale-[0.98] ${isLoading ? 'bg-gray-300' : 'bg-blue-500 hover:bg-blue-600 shadow-blue-100'}`}>
          {isLoading ? '⏳ กำลังบันทึก...' : '🐾 ยืนยันการสมัครบริการ'}
        </button>

      </form>
    </div>
  );
}