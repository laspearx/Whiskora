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
    <footer className="w-full max-w-7xl mx-auto px-5 md:px-6 mt-10 md:mt-16 pt-8 md:pt-12 pb-20 md:pb-24" style={{ borderTop: `1px solid ${F.line}` }}>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-10 md:gap-10">
        
        {/* Brand Section */}
        <div className="col-span-2 md:col-span-1 space-y-4 md:-mt-4">
          <div className="flex items-center gap-2">
            <Image 
              src="/logo.png" 
              alt="Whiskora Logo" 
              width={140}
              height={40}
              className="h-auto"
            />
          </div>
          <p style={{ fontSize: 13, color: F.inkSoft, lineHeight: 1.6 }} className="max-w-xs">
            ศูนย์กลางของทุกชีวิตสัตว์เลี้ยง <br />
            <span className="opacity-70">One platform, every pet life.</span>
          </p>
        </div>

        {/* Links Sections */}
        {footerSections.map((section) => (
          <div key={section.title} className="space-y-4">
            <h4 style={{ fontSize: 11, letterSpacing: '0.1em', color: F.muted }} className="font-bold uppercase">
              {section.title}
            </h4>
            <ul className="space-y-2.5">
              {section.links.map((link) => (
                <li key={link.label}>
                  <Link 
                    href={link.href} 
                    className="text-[13px] transition-colors hover:text-pink-500 block"
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
      <div className="mt-6 md:mt-8 pt-6 flex flex-col md:flex-row justify-between items-center gap-4 border-t border-gray-50" style={{ fontSize: 11, color: F.muted }}>
        <div className="flex items-center gap-2">
          <span>© 2026 Whiskora</span>
          <span className="opacity-30">|</span>
          <span>Made in Bangkok</span>
        </div>
        <div className="flex items-center gap-6">
          <span>PDPA compliant</span>
          <span className="opacity-50">V1.1.4</span>
        </div>
      </div>
    </footer>
  );
}