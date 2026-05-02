"use client";

import { useEffect, useState } from "react";

export default function BrowserChecker() {
  const [isInApp, setIsInApp] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent || navigator.vendor || (window as Window & { opera?: string }).opera || "";
    // เช็คว่าเข้าผ่าน LINE, FB Messenger, Instagram หรือแอปแชทอื่นๆ หรือไม่
    const isLine = ua.indexOf("Line") > -1;
    const isFB = ua.indexOf("FBAN") > -1 || ua.indexOf("FBAV") > -1;
    const isInstagram = ua.indexOf("Instagram") > -1;

    if (isLine || isFB || isInstagram) {
      setIsInApp(true);
    }
  }, []);

  if (!isInApp) return null;

  return (
    <div className="fixed top-0 left-0 w-full z-[9999] animate-in slide-in-from-top duration-500">
      <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white px-4 py-3 shadow-2xl flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">⚠️</span>
          <div className="text-xs md:text-sm font-bold leading-tight">
            <p>คุณกำลังใช้งานผ่านแอปแชท ซึ่งอาจทำให้ล็อกอินผ่าน Google ไม่ได้</p>
            <p className="opacity-90 font-medium">กรุณากดปุ่ม <span className="underline">"..."</span> หรือ <span className="underline">"ลูกศร"</span> แล้วเลือก <span className="bg-white/20 px-1.5 rounded">"เปิดด้วยเบราว์เซอร์ปกติ"</span></p>
          </div>
        </div>
        <button 
          onClick={() => setIsInApp(false)}
          className="bg-black/10 hover:bg-black/20 p-2 rounded-full transition"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>
    </div>
  );
}