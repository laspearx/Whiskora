"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";

const F = {
  ink: '#111827', inkSoft: '#4B5563', muted: '#9CA3AF',
  pink: '#E84677', pinkSoft: '#FDF2F5', pinkBorder: '#FBCFE8',
  line: '#E5E7EB', paper: '#FFFFFF',
};

const Icon = {
  ArrowLeft: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>,
  Heart: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
  Users: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  Shield: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>,
  Book: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>,
  Map: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>,
  Star: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  ChevronRight: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>,
};

const missions = [
  {
    icon: <Icon.Heart />,
    color: '#FFF0F5',
    iconColor: F.pink,
    title: 'สร้างขึ้นเพื่อสัตว์เลี้ยงทุกตัว',
    desc: 'Whiskora เกิดจากความเชื่อว่าสัตว์เลี้ยงทุกตัวสมควรได้รับการดูแลที่ดีที่สุด เราสร้างเครื่องมือที่ช่วยให้เจ้าของสัตว์เลี้ยงดูแลน้องๆ ได้อย่างมีระบบและมีข้อมูลรองรับ',
  },
  {
    icon: <Icon.Users />,
    color: '#F0F4FF',
    iconColor: '#4F6EF7',
    title: 'ชุมชนที่เชื่อมต่อนักเพาะพันธุ์',
    desc: 'เป็นพื้นที่กลางที่นักเพาะพันธุ์มืออาชีพ ฟาร์ม และเจ้าของสัตว์เลี้ยงทั่วไปสามารถเชื่อมต่อ แลกเปลี่ยนข้อมูล และหาสัตว์เลี้ยงที่ตรงใจได้อย่างโปร่งใส',
  },
  {
    icon: <Icon.Shield />,
    color: '#F0FFF4',
    iconColor: '#16A34A',
    title: 'ความโปร่งใสและน่าเชื่อถือ',
    desc: 'ระบบยืนยันตัวตนและประวัติสัตว์เลี้ยงที่ตรวจสอบได้ช่วยให้ทุกการซื้อขายและการรับเลี้ยงเกิดขึ้นบนพื้นฐานของข้อมูลที่ถูกต้องและไว้วางใจได้',
  },
  {
    icon: <Icon.Book />,
    color: '#FFFBF0',
    iconColor: '#D97706',
    title: 'ความรู้ที่เข้าถึงได้',
    desc: 'รวบรวมองค์ความรู้ด้านสุขภาพ โภชนาการ และพฤติกรรมสัตว์เลี้ยงจากผู้เชี่ยวชาญ เพื่อให้ผู้เลี้ยงทุกคนสามารถตัดสินใจอย่างมีข้อมูลรองรับ',
  },
];

const features = [
  { emoji: '🐾', title: 'Pet Profile', desc: 'สร้างโปรไฟล์ดิจิทัลสำหรับสัตว์เลี้ยงแต่ละตัว พร้อมประวัติสุขภาพและวัคซีน', href: '/pets/add' },
  { emoji: '🏡', title: 'Farm & Breeder', desc: 'สร้างหน้าฟาร์มและจัดการครอกเพาะพันธุ์ได้อย่างมืออาชีพ', href: '/partner' },
  { emoji: '🪪', title: 'Pet ID Card', desc: 'บัตรดิจิทัลพร้อม QR Code ที่ให้ผู้อื่นสแกนดูข้อมูลสัตว์เลี้ยงได้ทันที', href: '/pet-id-card' },
  { emoji: '📚', title: 'Knowledge Base', desc: 'บทความและองค์ความรู้สำหรับผู้เลี้ยงสัตว์ทุกประเภท', href: '/pet-knowledge' },
  { emoji: '🧮', title: 'Pet Tools', desc: 'เครื่องมือคำนวณและช่วยตัดสินใจสำหรับผู้เลี้ยง เช่น อาหาร วัคซีน และการผสมพันธุ์', href: '/pet-tools' },
  { emoji: '💰', title: 'Finance Tracker', desc: 'บันทึกค่าใช้จ่ายสำหรับสัตว์เลี้ยง ดูสรุปรายเดือนและรายปีได้ง่ายๆ', href: '/profile/finance' },
];

const stats = [
  { value: '5,000+', label: 'สัตว์เลี้ยงที่ลงทะเบียน' },
  { value: '1,200+', label: 'นักเพาะพันธุ์และฟาร์ม' },
  { value: '10+', label: 'ประเภทสัตว์เลี้ยง' },
  { value: '100%', label: 'ฟรี ไม่มีค่าใช้จ่าย' },
];

export default function AboutPage() {
  const router = useRouter();

  return (
    <>
      <style>{`
        .ab-page { font-family: inherit; min-height: 100vh; background: #FFFAFC; }
        .ab-wrap { max-width: 680px; margin: 0 auto; padding: 24px 20px 80px; }

        .ab-topbar { display: flex; align-items: center; gap: 14px; margin-bottom: 32px; }
        .ab-back { display: inline-flex; align-items: center; justify-content: center; width: 40px; height: 40px; border-radius: 12px; background: white; color: #6B7280; cursor: pointer; border: 1px solid #E5E7EB; box-shadow: 0 1px 2px rgba(0,0,0,0.05); transition: all .18s; flex-shrink: 0; }
        .ab-back:hover { background: #F9FAFB; color: #111827; transform: translateX(-1px); }
        .ab-head h1 { font-size: 22px; font-weight: 800; color: ${F.ink}; }
        .ab-head p { font-size: 12px; font-weight: 600; color: ${F.muted}; margin-top: 2px; text-transform: uppercase; letter-spacing: 0.1em; }

        /* hero */
        .ab-hero { background: linear-gradient(135deg, ${F.pink} 0%, #F472B6 100%); border-radius: 28px; padding: 36px 28px; text-align: center; margin-bottom: 28px; position: relative; overflow: hidden; }
        .ab-hero::before { content: ''; position: absolute; top: -40px; right: -40px; width: 160px; height: 160px; background: rgba(255,255,255,0.08); border-radius: 50%; }
        .ab-hero::after { content: ''; position: absolute; bottom: -30px; left: -30px; width: 120px; height: 120px; background: rgba(255,255,255,0.06); border-radius: 50%; }
        .ab-hero-logo { font-size: 36px; font-weight: 900; color: white; letter-spacing: -1px; margin-bottom: 8px; position: relative; z-index: 1; }
        .ab-hero-tagline { font-size: 15px; font-weight: 600; color: rgba(255,255,255,0.9); line-height: 1.6; position: relative; z-index: 1; max-width: 380px; margin: 0 auto; }

        /* stats */
        .ab-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 28px; }
        .ab-stat { background: white; border: 1.5px solid ${F.line}; border-radius: 16px; padding: 14px 10px; text-align: center; }
        .ab-stat-val { font-size: 18px; font-weight: 900; color: ${F.pink}; }
        .ab-stat-label { font-size: 10px; font-weight: 600; color: ${F.muted}; margin-top: 2px; line-height: 1.3; }

        /* section title */
        .ab-section-title { font-size: 17px; font-weight: 800; color: ${F.ink}; margin-bottom: 14px; }

        /* missions */
        .ab-missions { display: flex; flex-direction: column; gap: 12px; margin-bottom: 28px; }
        .ab-mission { display: flex; gap: 14px; background: white; border: 1.5px solid ${F.line}; border-radius: 18px; padding: 18px; align-items: flex-start; }
        .ab-mission-icon { width: 46px; height: 46px; border-radius: 14px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .ab-mission-title { font-size: 14px; font-weight: 800; color: ${F.ink}; margin-bottom: 5px; }
        .ab-mission-desc { font-size: 12.5px; font-weight: 500; color: ${F.inkSoft}; line-height: 1.6; }

        /* features */
        .ab-features { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 28px; }
        .ab-feat { background: white; border: 1.5px solid ${F.line}; border-radius: 18px; padding: 16px; text-decoration: none; color: inherit; transition: all .18s; display: flex; flex-direction: column; gap: 8px; }
        .ab-feat:hover { border-color: #FBCFE8; transform: translateY(-2px); box-shadow: 0 6px 16px rgba(232,70,119,0.1); }
        .ab-feat-emoji { font-size: 26px; }
        .ab-feat-title { font-size: 13px; font-weight: 800; color: ${F.ink}; }
        .ab-feat-desc { font-size: 11px; font-weight: 500; color: ${F.muted}; line-height: 1.5; }
        .ab-feat-link { display: flex; align-items: center; gap: 3px; font-size: 11px; font-weight: 700; color: ${F.pink}; margin-top: auto; }

        /* founder note */
        .ab-note { background: linear-gradient(135deg, #FFF0F5, #FFFAFC); border: 1.5px solid #FBCFE8; border-radius: 20px; padding: 22px 24px; margin-bottom: 24px; }
        .ab-note-quote { font-size: 22px; color: ${F.pink}; margin-bottom: 8px; }
        .ab-note-text { font-size: 13px; font-weight: 500; color: ${F.inkSoft}; line-height: 1.7; margin-bottom: 14px; }
        .ab-note-sig { font-size: 12px; font-weight: 700; color: ${F.pink}; }

        @media (max-width: 480px) {
          .ab-wrap { padding: 16px 14px 60px; }
          .ab-stats { grid-template-columns: repeat(2, 1fr); }
          .ab-features { grid-template-columns: 1fr 1fr; }
          .ab-hero { padding: 28px 20px; }
        }
      `}</style>

      <div className="ab-page">
        <div className="ab-wrap">

          <div className="ab-topbar">
            <button onClick={() => router.back()} className="ab-back"><Icon.ArrowLeft /></button>
            <div className="ab-head">
              <h1>เกี่ยวกับ Whiskora</h1>
              <p>About Us</p>
            </div>
          </div>

          {/* Hero */}
          <div className="ab-hero">
            <div className="ab-hero-logo">whiskora 🐾</div>
            <p className="ab-hero-tagline">
              แพลตฟอร์มดิจิทัลสำหรับผู้รักสัตว์เลี้ยง<br />
              เชื่อมต่อ ดูแล และบริหารจัดการสัตว์เลี้ยงของคุณในที่เดียว
            </p>
          </div>

          {/* Stats */}
          <div className="ab-stats">
            {stats.map((s, i) => (
              <div key={i} className="ab-stat">
                <div className="ab-stat-val">{s.value}</div>
                <div className="ab-stat-label">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Missions */}
          <div className="ab-section-title">ทำไม Whiskora ถึงเกิดขึ้น?</div>
          <div className="ab-missions">
            {missions.map((m, i) => (
              <div key={i} className="ab-mission">
                <div className="ab-mission-icon" style={{ background: m.color, color: m.iconColor }}>
                  {m.icon}
                </div>
                <div>
                  <div className="ab-mission-title">{m.title}</div>
                  <div className="ab-mission-desc">{m.desc}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Features */}
          <div className="ab-section-title">สิ่งที่ทำได้บน Whiskora</div>
          <div className="ab-features">
            {features.map((f, i) => (
              <Link key={i} href={f.href} className="ab-feat">
                <div className="ab-feat-emoji">{f.emoji}</div>
                <div className="ab-feat-title">{f.title}</div>
                <div className="ab-feat-desc">{f.desc}</div>
                <div className="ab-feat-link">ลองเลย <Icon.ChevronRight /></div>
              </Link>
            ))}
          </div>

          {/* Founder Note */}
          <div className="ab-note">
            <div className="ab-note-quote">"</div>
            <p className="ab-note-text">
              Whiskora สร้างขึ้นจากความรักที่มีต่อสัตว์เลี้ยง เราเชื่อว่าทุกน้องแมว น้องหมา
              และสัตว์เลี้ยงทุกชนิดสมควรได้รับการดูแลที่ดีที่สุด เราจึงสร้างเครื่องมือที่ช่วยให้
              การดูแลสัตว์เลี้ยงเป็นเรื่องง่าย สนุก และมีระบบ
              ไม่ว่าคุณจะเป็นเจ้าของสัตว์เลี้ยงมือใหม่ หรือนักเพาะพันธุ์มืออาชีพ
              Whiskora พร้อมเป็นผู้ช่วยที่เชื่อถือได้ของคุณเสมอ
            </p>
            <div className="ab-note-sig">— ทีมงาน Whiskora 🐾</div>
          </div>

        </div>
      </div>
    </>
  );
}
