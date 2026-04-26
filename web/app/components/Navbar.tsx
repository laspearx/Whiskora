"use client";

import Link from 'next/link';
// 🌟 เพิ่ม useRef เข้ามา
import { useState, useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase'; 

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [session, setSession] = useState<any>(null); 
  const pathname = usePathname();
  const router = useRouter(); 
  
  // 🌟 สร้าง Ref สำหรับอ้างอิงพื้นที่ของ Navbar
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // 🌟 useEffect สำหรับตรวจจับการคลิกนอก Navbar
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // ถ้า Navbar มีอยู่จริง และ จุดที่คลิก "ไม่ได้อยู่ข้างใน" Navbar
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setIsOpen(false); // สั่งหุบเมนู
      }
    };

    // เปิดเรดาร์ตรวจจับการคลิก
    document.addEventListener("mousedown", handleClickOutside);
    
    // ปิดเรดาร์เมื่อ Component ถูกทำลาย (ทำความสะอาด Memory)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const isActive = (path: string) => pathname === path;

  const handleProtectedAction = (path: string) => {
    if (!session) {
      router.push('/login'); 
    } else {
      router.push(path); 
    }
    setIsOpen(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    router.push('/login'); 
  };

  return (
    // 🌟 ใส่ ref={navRef} ที่ตัวคลุมชั้นนอกสุด เพื่อกำหนดอาณาเขต
    <nav ref={navRef} className="bg-white shadow-sm sticky top-0 z-50 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="flex justify-between items-center h-16">
          
          {/* โลโก้เว็บ */}
          <Link href="/" className="text-2xl font-pink text-pink-500 tracking-tight">
            Whiskora
          </Link>

          {/* เมนูสำหรับจอคอม (Desktop) */}
          <div className="hidden md:flex gap-6 items-center font-medium text-gray-600 text-sm">
            <Link href="/" className={`hover:text-pink-500 transition ${isActive('/') ? 'text-pink-500 font-bold underline underline-offset-8 decoration-2' : ''}`}>หน้าแรก</Link>
            
            <button onClick={() => handleProtectedAction('/profile')} className={`hover:text-pink-500 transition ${isActive('/profile') ? 'text-pink-500 font-bold' : ''}`}>โปรไฟล์ของฉัน</button>
            <Link href="/marketplace" className={`hover:text-pink-500 transition ${isActive('/marketplace') ? 'text-pink-500 font-bold' : ''}`}>ร้านเพ็ทช็อป</Link>
            <Link href="/service-hub" className={`hover:text-pink-500 transition ${isActive('/service-hub') ? 'text-pink-500 font-bold' : ''}`}>บริการต่างๆ</Link>
            <Link href="/community" className={`hover:text-pink-500 transition ${isActive('/community') ? 'text-pink-500 font-bold' : ''}`}>คอมมูนิตี้</Link>            
            <Link href="/farm-hub" className={`hover:text-pink-500 transition ${isActive('/farm-hub') ? 'text-pink-500 font-bold' : ''}`}>ตลาดสัตว์เลี้ยง</Link>
            <Link href="/partner" className={`hover:text-pink-500 transition ${isActive('/partner') ? 'text-pink-500 font-bold' : ''}`}>พาร์ทเนอร์ของเรา</Link>
            
            {session ? (
              <button onClick={handleLogout} className="ml-2 text-red-400 hover:text-red-600 font-bold transition">ออกจากระบบ</button>
            ) : (
              <Link href="/login" className="ml-2 text-pink-500 font-bold transition">เข้าสู่ระบบ</Link>
            )}
          </div>

          {/* ส่วนปุ่มด้านขวาสำหรับมือถือ */}
          <div className="md:hidden flex items-center gap-2">
            <button 
              onClick={() => handleProtectedAction('/profile')}
              className="flex items-center justify-center w-10 h-10 bg-pink-50 text-pink-500 rounded-lg hover:bg-pink-100 transition shadow-sm border border-pink-100"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </button>

            <button 
              onClick={() => setIsOpen(!isOpen)}
              className="flex items-center justify-center w-10 h-10 bg-gray-100 text-gray-800 rounded-lg focus:outline-none transition-colors border border-gray-200"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /> 
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" /> 
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* เมนู Dropdown สำหรับมือถือ */}
        {isOpen && (
          <div className="md:hidden absolute top-14 right-4 w-48 bg-white rounded-2xl shadow-xl border border-pink-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex flex-col py-2">
              <Link href="/" onClick={() => setIsOpen(false)} className={`px-4 py-2.5 text-sm font-medium transition ${isActive('/') ? 'text-pink-500 bg-pink-50 font-bold' : 'text-gray-600 hover:text-pink-500 hover:bg-gray-50'}`}>หน้าแรก</Link>
              
              <button onClick={() => handleProtectedAction('/profile')} className={`px-4 py-2.5 text-left text-sm font-medium transition ${isActive('/profile') ? 'text-pink-500 bg-pink-50 font-bold' : 'text-gray-600 hover:text-pink-500 hover:bg-gray-50'}`}>โปรไฟล์ของฉัน</button>
              <Link href="/marketplace" onClick={() => setIsOpen(false)} className={`px-4 py-2.5 text-sm font-medium transition ${isActive('/marketplace') ? 'text-pink-500 bg-pink-50 font-bold' : 'text-gray-600 hover:text-pink-500 hover:bg-gray-50'}`}>ร้านเพ็ทช็อป</Link>
              <Link href="/service-hub" onClick={() => setIsOpen(false)} className={`px-4 py-2.5 text-sm font-medium transition ${isActive('/service-hub') ? 'text-pink-500 bg-pink-50 font-bold' : 'text-gray-600 hover:text-pink-500 hover:bg-gray-50'}`}>บริการต่างๆ</Link>
              <Link href="/community" onClick={() => setIsOpen(false)} className={`px-4 py-2.5 text-sm font-medium transition ${isActive('/community') ? 'text-pink-500 bg-pink-50 font-bold' : 'text-gray-600 hover:text-pink-500 hover:bg-gray-50'}`}>คอมมูนิตี้</Link>
              <Link href="/farm-hub" onClick={() => setIsOpen(false)} className={`px-4 py-2.5 text-sm font-medium transition ${isActive('/farm-hub') ? 'text-pink-500 bg-pink-50 font-bold' : 'text-gray-600 hover:text-pink-500 hover:bg-gray-50'}`}>ตลาดสัตว์เลี้ยง</Link>
              <Link href="/partner" onClick={() => setIsOpen(false)} className={`px-4 py-2.5 text-sm font-medium transition ${isActive('/partner') ? 'text-pink-500 bg-pink-50 font-bold' : 'text-gray-600 hover:text-pink-500 hover:bg-gray-50'}`}>พาร์ทเนอร์ของเรา</Link>
              
              <div className="border-t border-gray-100 mt-1 pt-1">
                {session ? (
                  <button onClick={handleLogout} className="w-full text-left px-4 py-2.5 text-sm font-bold text-red-500 hover:bg-red-50 transition">ออกจากระบบ</button>
                ) : (
                  <Link href="/login" onClick={() => setIsOpen(false)} className="w-full block px-4 py-2.5 text-sm font-bold text-pink-500 hover:bg-pink-50 transition">เข้าสู่ระบบ</Link>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}