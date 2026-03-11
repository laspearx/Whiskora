"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function Home() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });
  }, []);

  const handleIDCardClick = () => {
    if (!session) router.push("/login");
    else router.push("/pets/create");
  };

  const handleStartFarm = () => {
    if (!session) router.push("/login");
    else router.push("/register-farm");
  };

  return (
    <>
      {/* 🌟 ฝัง CSS เฉพาะหน้านี้เลย ข้ามตัวเช็คของ Tailwind หมดปัญหา Error 100% */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(3deg); }
          50% { transform: translateY(-15px) rotate(5deg); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
      `}} />

      <div className="space-y-10 py-6 animate-in fade-in duration-1000">
        
        {/* 🌟 Hero Section */}
        <section className="px-4 max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-pink-500 via-rose-500 to-pink-600 rounded-[2.5rem] p-8 md:p-12 text-white shadow-2xl shadow-pink-200 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl group-hover:bg-white/20 transition-all duration-700"></div>
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-pink-300/20 rounded-full -ml-10 -mb-10 blur-2xl"></div>
            
            <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
              <div className="flex-1 text-center md:text-left space-y-4">
                <span className="bg-white/20 backdrop-blur-md text-[10px] md:text-xs font-black px-4 py-1.5 rounded-full uppercase tracking-widest inline-block border border-white/30">
                  New Feature ✨
                </span>
                <h1 className="text-3xl md:text-5xl font-black leading-tight tracking-tight">
                  สร้างบัตรประจำตัว <br />
                  <span className="text-pink-100">ให้น้องๆ สุดคิวท์ 🪪</span>
                </h1>
                <p className="text-pink-50/80 text-sm md:text-base font-medium max-w-md mx-auto md:mx-0">
                  อวดความน่ารักของลูกๆ ด้วยบัตร Pet ID Card ระดับ Collector's Edition พร้อมเก็บประวัติสุขภาพไว้ในที่เดียว
                </p>
                
                <div className="pt-4 flex flex-col sm:flex-row gap-3">
                  <button 
                    onClick={handleIDCardClick}
                    className="bg-white text-pink-600 hover:bg-pink-50 font-black py-4 px-8 rounded-2xl transition-all shadow-xl shadow-pink-900/20 active:scale-95 flex items-center justify-center gap-2"
                  >
                    <span className="text-xl">🐾</span> เริ่มสร้างบัตรฟรี
                  </button>
                </div>
              </div>

              {/* 🌟 ส่วนแสดงกราฟิกบัตรจำลอง (Mockup) */}
              <div className="w-full max-w-[280px] md:max-w-[320px] relative animate-float">
                 <div className="bg-white/10 backdrop-blur-md p-2 rounded-3xl border border-white/20 shadow-2xl transition-transform duration-500">
                    <div className="bg-white rounded-2xl p-4 text-gray-800">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-2">
                           {/* 🌟 เปลี่ยนอิโมจิเป็นรูปโลโก้ของชัช (mini-logo.png) */}
                           <div className="w-6 h-6 flex items-center justify-center">
                             <img src="/mini-logo.png" alt="Whiskora Logo" className="w-full h-full object-contain" />
                           </div>
                           <div className="text-[8px] font-black text-pink-500 mt-0.5">WHISKORA</div>
                        </div>
                        <div className="text-[10px] font-black text-gray-300 mt-0.5">ID CARD</div>
                      </div>
                      <div className="flex gap-3">
                        <div className="w-16 h-20 bg-gray-100 rounded-lg"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-3 w-20 bg-gray-100 rounded"></div>
                          <div className="h-2 w-full bg-gray-50 rounded"></div>
                          <div className="h-2 w-16 bg-gray-50 rounded"></div>
                        </div>
                      </div>
                    </div>
                 </div>
              </div>
            </div>
          </div>
        </section>

        {/* 🔍 ส่วนค้นหา */}
        <section className="max-w-4xl mx-auto px-4">
          <div className="flex items-center bg-white rounded-2xl p-2 shadow-sm border border-gray-100 focus-within:ring-2 ring-pink-100 transition-all">
            <span className="pl-3 text-lg opacity-40">🔍</span>
            <input 
              type="text" 
              placeholder="ค้นหาฟาร์ม หรือบริการ..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && searchQuery.trim()) {
                  router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
                }
              }}
              className="w-full bg-transparent outline-none px-3 py-2 text-sm text-gray-700 font-medium"
            />
            <button 
              onClick={() => {
                if (searchQuery.trim()) {
                  router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
                }
              }}
              className="bg-gray-900 hover:bg-black text-white font-bold py-2.5 px-6 rounded-xl transition text-sm"
            >
              ค้นหา
            </button>
          </div>
        </section>

        {/* 🏠 หมวดหมู่ยอดฮิต */}
        <section className="max-w-4xl mx-auto px-4">
          <h2 className="text-lg font-black text-gray-800 tracking-tight mb-4 flex items-center gap-2">
             <span className="w-2 h-6 bg-pink-500 rounded-full"></span>
             บริการอื่นๆ
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Link href="/marketplace?pet=dog" className="bg-white p-5 rounded-[2rem] border border-gray-100 hover:border-pink-300 transition-all text-center group shadow-sm">
               <div className="text-4xl mb-3 group-hover:scale-110 transition duration-300">🐶</div>
               <h3 className="font-bold text-gray-800 text-sm">ตามหาสุนัข</h3>
            </Link>

            <Link href="/marketplace?pet=cat" className="bg-white p-5 rounded-[2rem] border border-gray-100 hover:border-pink-300 transition-all text-center group shadow-sm">
               <div className="text-4xl mb-3 group-hover:scale-110 transition duration-300">🐱</div>
               <h3 className="font-bold text-gray-800 text-sm">ตามหาแมว</h3>
            </Link>

            <Link href="/service-hub?category=คลินิก/โรงพยาบาล" className="bg-white p-5 rounded-[2rem] border border-gray-100 hover:border-pink-300 transition-all text-center group shadow-sm">
               <div className="text-4xl mb-3 group-hover:scale-110 transition duration-300">🏥</div>
               <h3 className="font-bold text-gray-800 text-sm">คลินิก</h3>
            </Link>

            <Link href="/service-hub?category=อาบน้ำ-ตัดขน" className="bg-white p-5 rounded-[2rem] border border-gray-100 hover:border-pink-300 transition-all text-center group shadow-sm">
               <div className="text-4xl mb-3 group-hover:scale-110 transition duration-300">✂️</div>
               <h3 className="font-bold text-gray-800 text-sm">กรูมมิ่ง</h3>
            </Link>
          </div>
        </section>

        {/* 🏗️ Partner Banner */}
        <section className="max-w-4xl mx-auto px-4 pb-10">
          <div className="bg-gray-900 rounded-[2.5rem] p-8 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden shadow-xl">
            <div className="absolute right-0 bottom-0 w-32 h-32 bg-pink-500/10 rounded-full -mr-16 -mb-16"></div>
            <div className="text-center md:text-left">
              <h2 className="text-xl font-black text-white mb-1">ร่วมเป็นพาร์ทเนอร์กับเรา 🤝</h2>
              <p className="text-gray-400 text-xs font-bold">เปิดฟาร์ม ร้านค้า หรือคลินิกของคุณบน Whiskora</p>
            </div>
            <button 
              onClick={handleStartFarm}
              className="w-full md:w-auto bg-white hover:bg-gray-100 text-gray-900 font-black py-3 px-8 rounded-2xl transition shadow-lg text-sm"
            >
              สมัครเลยฟรี
            </button>
          </div>
        </section>
      </div>
    </>
  );
}