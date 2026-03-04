"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function ScrollToTop() {
  const pathname = usePathname();

  useEffect(() => {
    // เมื่อ pathname เปลี่ยน (เปลี่ยนหน้า) ให้เลื่อนขึ้นบนสุดทันที
    window.scrollTo(0, 0);
  }, [pathname]);

  return null; // Component นี้ไม่ต้องแสดงผลอะไรออกมา
}