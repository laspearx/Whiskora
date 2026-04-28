"use client";

import Link from "next/link";
import Image from "next/image";

// ─── Premium CI Tokens ──────────────────────────────────
const F = {
  ink: '#111827',
  inkSoft: '#4B5563',
  muted: '#9CA3AF',
  pink: '#E84677',
  line: '#E5E7EB',
};

export default function Footer() {
  const footerSections = [
    { title: 'ผู้ใช้งาน', links: [{ label: 'ค้นหาฟาร์ม', href: '/farm-hub' }, { label: 'จองคลินิก', href: '/service-hub' }, { label: 'Pet ID Card', href: '/profile/pets' }, { label: 'คอมมูนิตี้', href: '/community' }] },
    { title: 'พาร์ทเนอร์', links: [{ label: 'เปิดฟาร์ม', href: '/partner' }, { label: 'เปิดร้านค้า', href: '/partner' }, { label: 'Genesis Program', href: '/partner' }, { label: 'ราคา PRO', href: '/partner' }] },
    { title: 'บริษัท', links: [{ label: 'เกี่ยวกับเรา', href: '/' }, { label: 'นโยบายความเป็นส่วนตัว', href: '/' }, { label: 'ข้อกำหนด', href: '/' }, { label: 'ติดต่อ', href: '/' }] },
  ];

  return (
    <footer className="w-full max-w-7xl mx-auto px-4 md:px-6 mt-20 pt-16 pb-28" style={{ borderTop: `1px solid ${F.line}` }}>
      
      {/* Grid Layout: ปรับเป็น 1 คอลัมน์ในมือถือ และ 4 คอลัมน์ในคอม */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
        
        {/* Brand Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 font-extrabold text-xl">
            <Image 
              src="/mini-logo.png" // พาธรูปภาพ อ้างอิงจากโฟลเดอร์ public
              alt="Whiskora Mini Logo" // ข้อความอธิบายรูปภาพ (สำคัญสำหรับ SEO)
              width={30} // 📏 กำหนดความกว้าง (ปรับขนาดได้ตามต้องการ)
              height={30} // 📏 กำหนดความสูง (ปรับขนาดได้ตามต้องการ)
              className="object-contain" // ช่วยให้รูปไม่เบี้ยว
            />
          </div>
          <p style={{ fontSize: 13, color: F.inkSoft, lineHeight: 1.6 }} className="max-w-xs">
            ศูนย์กลางของทุกชีวิตสัตว์เลี้ยง — One platform, every pet life.
          </p>
        </div>

        {/* Links Sections */}
        {footerSections.map((section) => (
          <div key={section.title}>
            <h4 style={{ fontSize: 12, letterSpacing: '0.1em', color: F.muted }} className="font-bold uppercase mb-5">
              {section.title}
            </h4>
            <ul className="space-y-3">
              {section.links.map((link) => (
                <li key={link.label}>
                  <Link 
                    href={link.href} 
                    className="text-[13px] transition-colors hover:text-pink-500"
                    style={{ color: F.inkSoft }}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Bottom Bar */}
      <div className="mt-16 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left" style={{ borderTop: `1px solid ${F.line}`, fontSize: 12, color: F.muted }}>
        <span>© 2026 Whiskora · Made in Bangkok</span>
        <div className="flex justify-center gap-6">
          <span>PDPA compliant</span>
          <span className="opacity-50">Whiskora v1.4.0</span>
        </div>
      </div>
    </footer>
  );
}