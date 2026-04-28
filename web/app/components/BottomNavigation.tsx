"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function BottomNavigation() {
  const pathname = usePathname();

  // 🌟 ฟังก์ชันเช็คว่าหน้าปัจจุบันคือหน้าที่กำลัง Active อยู่หรือไม่
  const isActive = (path: string) => {
    if (path === '/' && pathname !== '/') return false;
    return pathname.startsWith(path);
  };

  const navItems = [
    {
      name: "หน้าหลัก",
      href: "/profile", // แก้ลิงก์ตามหน้าแรกของชัชได้เลย
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
      )
    },
    {
      name: "เด็กๆ",
      href: "/my-pets",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="4" r="2"/><circle cx="18" cy="8" r="2"/><circle cx="20" cy="16" r="2"/><path d="M9 10a5 5 0 0 1 5 5v3.5a3.5 3.5 0 0 1-6.84 1.045Q6.52 17.48 4.46 16.84A3.5 3.5 0 0 1 5.5 10Z"/></svg>
      )
    },
    {
      name: "ฟาร์ม",
      href: "/partner", // หรือ /farm-dashboard
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/></svg>
      )
    },
    {
      name: "บัญชี",
      href: "/finance", // แก้ลิงก์ตามหน้าการเงิน
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg> // เปลี่ยนไอคอนให้ตรงตามต้องการได้ครับ
      )
    },
    {
      name: "โปรไฟล์",
      href: "/settings", // แก้ลิงก์ตามหน้าตั้งค่า
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
      )
    }
  ];

  return (
    <nav className="fixed bottom-0 w-full bg-white border-t border-gray-100 pb-safe pt-2 px-4 z-50 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.05)]">
      <div className="max-w-md mx-auto flex justify-between items-center h-16">
        {navItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link 
              key={item.name} 
              href={item.href}
              className="flex flex-col items-center justify-center w-[20%] gap-1 transition-all"
            >
              <div className={`p-1.5 rounded-xl transition-all duration-300 ${active ? 'bg-pink-50 text-pink-500 scale-110' : 'text-gray-400 hover:text-gray-600'}`}>
                {item.icon}
              </div>
              <span className={`text-[10px] font-bold transition-all ${active ? 'text-pink-600' : 'text-gray-400'}`}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}