"use client"; // 🌟 ต้องใส่เพื่อให้ใช้ Logic เช็คการล็อกอินได้

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function Home() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);

  // เช็คสถานะการล็อกอิน
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });
  }, []);

  // 🌟 ฟังก์ชันเช็คก่อนไปหน้าสมัครฟาร์ม
  const handleStartFarm = () => {
    if (!session) {
      router.push("/login");
    } else {
      router.push("/register-farm");
    }
  };

  return (
    <div className="space-y-8 py-6 animate-in fade-in duration-1000">
      
      {/* 🌟 Hero Section */}
      <section className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-[2rem] p-6 md:p-10 text-center shadow-sm border border-pink-100 relative overflow-hidden max-w-4xl mx-4 lg:mx-auto">
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] text-[15rem] pointer-events-none select-none">🐾</div>
        
        <div className="relative z-10 max-w-2xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight leading-tight mb-3">
            ให้เราช่วยตามหา <br className="md:hidden" />
            <span className="text-pink-500">สิ่งที่คุณต้องการสิ</span>
          </h1>
          <p className="text-gray-500 text-sm md:text-base mb-6 font-medium px-4">
            Whiskora ศูนย์รวมฟาร์มสัตว์เลี้ยงคุณภาพ คลินิก บริการ และคอมมูนิตี้ที่ครบครัน
          </p>
          
          <div className="flex items-center bg-white rounded-xl p-1.5 shadow-sm border border-pink-100 max-w-lg mx-auto focus-within:ring-2 ring-pink-200 transition-all">
            <span className="pl-3 text-lg opacity-70">🔍</span>
            <input 
              type="text" 
              placeholder="ค้นหาสายพันธุ์ หรือบริการ..." 
              className="w-full bg-transparent outline-none px-3 py-2 text-sm text-gray-700 placeholder-gray-400"
            />
            <button className="bg-gray-900 hover:bg-black text-white font-bold py-2 px-5 rounded-lg transition text-sm">
              ค้นหา
            </button>
          </div>
        </div>
      </section>

      {/* 🌟 หมวดหมู่ยอดฮิต */}
      <section className="max-w-4xl mx-auto px-4">
        <div className="flex justify-between items-end mb-4">
          <h2 className="text-lg md:text-xl font-bold text-gray-800 tracking-tight">หมวดหมู่ยอดฮิต</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* 🐶 ชี้ไป Marketplace พร้อมส่งค่า pet=dog */}
        <Link href="/marketplace?pet=dog" className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 hover:border-pink-300 hover:shadow-md transition text-center group">
           <div className="text-3xl md:text-4xl mb-2 group-hover:scale-110 transition duration-300">🐶</div>
           <h3 className="font-bold text-gray-800 text-base">สุนัข</h3>
           <p className="text-xs text-gray-500 mt-0.5">ฟาร์ม & หาบ้าน</p>
        </Link>

        {/* 🐱 ชี้ไป Marketplace พร้อมส่งค่า pet=cat */}
        <Link href="/marketplace?pet=cat" className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 hover:border-pink-300 hover:shadow-md transition text-center group">
           <div className="text-3xl md:text-4xl mb-2 group-hover:scale-110 transition duration-300">🐱</div>
           <h3 className="font-bold text-gray-800 text-base">แมว</h3>
           <p className="text-xs text-gray-500 mt-0.5">ฟาร์ม & หาบ้าน</p>
        </Link>

        {/* 🏥 เปลี่ยนจาก /services เป็น /service-hub */}
        <Link href="/service-hub" className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 hover:border-pink-300 hover:shadow-md transition text-center group">
           <div className="text-3xl md:text-4xl mb-2 group-hover:scale-110 transition duration-300">🏥</div>
           <h3 className="font-bold text-gray-800 text-base">คลินิก</h3>
           <p className="text-xs text-gray-500 mt-0.5">รักษาสัตว์</p>
        </Link>

        {/* ✂️ เปลี่ยนจาก /services เป็น /service-hub และส่งค่าหมวดหมู่ */}
        <Link href="/service-hub" className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 hover:border-pink-300 hover:shadow-md transition text-center group">
           <div className="text-3xl md:text-4xl mb-2 group-hover:scale-110 transition duration-300">✂️</div>
           <h3 className="font-bold text-gray-800 text-base">กรูมมิ่ง</h3>
           <p className="text-xs text-gray-500 mt-0.5">อาบน้ำตัดขน</p>
        </Link>
        </div>
      </section>

      {/* 🌟 ป้ายแบนเนอร์ชวนเปิดฟาร์ม (เพิ่ม Logic ตรวจสอบการล็อกอิน) */}
      <section className="max-w-4xl mx-auto px-4 pb-8">
        <div className="bg-gray-900 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-4 md:gap-6 relative overflow-hidden">
          <div className="absolute -right-8 -bottom-8 text-[8rem] opacity-5 pointer-events-none">✨</div>
          <div className="relative z-10 text-center md:text-left">
            <h2 className="text-lg sm:text-xl font-black text-white mb-1.5">เปิดฟาร์มสัตว์เลี้ยงบน Whiskora</h2>
            <p className="text-gray-400 text-xs sm:text-sm font-medium">จัดการสายพันธุ์และเข้าถึงคนรักสัตว์ได้ฟรี</p>
          </div>
          <div className="relative z-10 w-full md:w-auto mt-2 md:mt-0">
            {/* เปลี่ยนจาก Link เป็น button เพื่อใส่ Logic */}
            <button 
              onClick={handleStartFarm}
              className="block w-full md:w-auto text-center bg-pink-500 hover:bg-pink-600 text-white font-bold py-2.5 px-6 rounded-xl transition shadow-sm text-sm"
            >
              สมัครเปิดฟาร์มฟรี
            </button>
          </div>
        </div>
      </section>

    </div>
  );
}