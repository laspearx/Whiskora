"use client";

import React from "react";
import { useRouter } from "next/navigation";

export default function CommunityComingSoonPage() {
  const router = useRouter();

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 text-center animate-in fade-in zoom-in duration-700">
      
      {/* 🌟 Visual Section */}
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-purple-200 blur-3xl rounded-full opacity-30 animate-pulse"></div>
        <div className="relative text-8xl md:text-9xl mb-4 transform hover:scale-110 transition-transform duration-500 cursor-default">
          💬
        </div>
        <div className="absolute -bottom-2 -right-2 text-4xl">🐶</div>
        <div className="absolute -top-2 -left-2 text-4xl">🐱</div>
      </div>

      {/* 📝 Text Content */}
      <h1 className="text-3xl md:text-5xl font-black text-gray-800 mb-4 tracking-tight">
        Whiskora <span className="text-purple-600">Community</span>
      </h1>
      
      <div className="inline-block bg-purple-50 px-6 py-2 rounded-full mb-6">
        <p className="text-purple-600 font-black text-sm md:text-base tracking-widest uppercase">
          COMING SOON • จะมาเร็วๆ นี้
        </p>
      </div>

      <p className="max-w-md mx-auto text-gray-500 font-medium leading-relaxed mb-10 text-sm md:text-base px-6">
        เตรียมพบกับพื้นที่แลกเปลี่ยนประสบการณ์ของคนรักสัตว์ 
        แหล่งรวมกูรูสายบรีด และพื้นที่อวดความน่ารักของเด็กๆ 
        <span className="block mt-2 font-bold text-gray-400 italic">"เพราะเราเชื่อว่ามิตรภาพที่ดี เริ่มต้นที่สัตว์เลี้ยง"</span>
      </p>

      {/* 🔙 Action Button */}
      <div className="flex flex-col sm:flex-row gap-4">
        <button 
          onClick={() => router.push('/')}
          className="px-10 py-4 bg-gray-900 text-white rounded-[1.5rem] font-black text-sm shadow-xl shadow-gray-200 hover:bg-purple-600 transition-all active:scale-95"
        >
          กลับสู่หน้าหลัก
        </button>
        
      </div>

      {/* ✨ Background Decoration */}
      <div className="fixed bottom-10 left-10 text-gray-100 -z-10 text-9xl font-black rotate-12 select-none">WHISKORA</div>
      <div className="fixed top-20 right-10 text-gray-100 -z-10 text-8xl font-black -rotate-12 select-none">SOCIAL</div>

    </div>
  );
}