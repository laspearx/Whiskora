"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function RegisterShopPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // 🌟 ข้อมูลฟอร์ม
  const [formData, setFormData] = useState({
    shop_name: '',
    phone: '',
    bio: '',
    image_url: ''
  });

  // 🌟 State สำหรับสัตว์ที่รองรับ (Multi-select)
  const [selectedSpecies, setSelectedSpecies] = useState<string[]>([]);

  // 🌟 รายการสัตว์ (ใช้ List เดียวกับหน้าโปรไฟล์เพื่อความสมูท)
  const speciesList = [
    { id: 'cat', label: 'แมว', emoji: '🐱' },
    { id: 'dog', label: 'หมา', emoji: '🐶' },
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // 🌟 ฟังก์ชันเลือก/ถอนการเลือกสัตว์
  const toggleSpecies = (id: string) => {
    setSelectedSpecies(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    if (selectedSpecies.length === 0) return alert('กรุณาเลือกสัตว์ที่ร้านรองรับอย่างน้อย 1 ประเภทครับ');
    
    setIsLoading(true);

    try {
      const { data, error } = await supabase
        .from('shops')
        .insert([{
          user_id: userId,
          shop_name: formData.shop_name,
          phone: formData.phone,
          bio: formData.bio,
          image_url: formData.image_url,
          // 🌟 ส่งค่า Array ของสัตว์ที่เลือกไปด้วย
          supported_species: selectedSpecies 
        }])
        .select()
        .single();

      if (error) throw error;

      alert('🛍️ เปิดร้าน Pet Shop สำเร็จ! ไปจัดการสต็อกสินค้ากันครับ');
      router.push(`/profile`); 
    } catch (error: unknown) {
      alert('Error: ' + (error instanceof Error ? error.message : 'กรุณาลองใหม่'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto pt-6 pb-20 px-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* 🔙 Header */}
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => router.back()} className="p-3 bg-white rounded-2xl shadow-sm border border-gray-100 text-gray-400 hover:text-teal-500 transition active:scale-90">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h1 className="text-2xl font-black text-gray-800 tracking-tight">เปิดร้าน Pet Shop 🛍️</h1>
          <p className="text-sm font-bold text-teal-500 italic">"เพราะเหล่าคนเลี้ยงสัตว์ ต้องการคุณ"</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* ข้อมูลทั่วไป */}
        <section className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-blue-50 space-y-5">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">ชื่อร้าน Pet Shop</label>
            <input required type="text" name="shop_name" placeholder="ชื่อร้านค้าของคุณ" value={formData.shop_name} onChange={handleChange} className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 outline-none focus:border-teal-300 focus:bg-white transition text-base font-bold text-gray-800" />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">เบอร์โทรศัพท์ติดต่อ</label>
            <input required type="tel" name="phone" placeholder="08X-XXX-XXXX" value={formData.phone} onChange={handleChange} className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 outline-none focus:border-teal-300 focus:bg-white transition text-base font-bold text-gray-800" />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">เกี่ยวกับร้าน / ที่อยู่ (Bio)</label>
            <textarea name="bio" rows={3} placeholder="ระบุรายละเอียดร้านค้าหรือที่อยู่เบื้องต้น..." value={formData.bio} onChange={handleChange} className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 outline-none focus:border-teal-300 focus:bg-white transition text-base font-bold text-gray-800" />
          </div>
        </section>

        {/* 🐱 ส่วนเลือกประเภทสัตว์ (Species Support) */}
        <section className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-teal-50">
          <label className="block text-sm font-bold text-gray-700 mb-1 ml-1">ร้านของคุณมีของสำหรับสัตว์ชนิดใดบ้าง?</label>
          <label className="block text-sm font-bold text-gray-500 mb-4 ml-1">(เลือกได้หลายอย่าง)</label>
          <div className="grid grid-cols-3 gap-3">
            {speciesList.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => toggleSpecies(s.id)}
                className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all ${
                  selectedSpecies.includes(s.id)
                    ? 'border-teal-500 bg-teal-50 text-teal-600 scale-[1.05] shadow-sm'
                    : 'border-gray-50 bg-gray-50 text-gray-400 hover:border-gray-200'
                }`}
              >
                <span className="text-2xl mb-1">{s.emoji}</span>
                <span className="text-[11px] font-black">{s.label}</span>
              </button>
            ))}
          </div>
        </section>

        <div className="pt-2">
          <button 
            type="submit" 
            disabled={isLoading}
            className={`w-full py-5 rounded-[2rem] font-black text-white transition-all shadow-xl active:scale-[0.98] flex justify-center items-center gap-2 ${isLoading ? 'bg-gray-300 shadow-none' : 'bg-teal-500 hover:bg-teal-600 shadow-teal-100'}`}
          >
            {isLoading ? '⏳ กำลังบันทึก...' : '🛍️ ยืนยันการเปิดร้าน'}
          </button>
        </div>

      </form>
    </div>
  );
}