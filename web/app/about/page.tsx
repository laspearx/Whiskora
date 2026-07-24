"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";

const F = {
  ink: '#1f1a1c', inkSoft: '#4a3f44', muted: '#8e7e84',
  pink: '#e84677', pinkSoft: '#fde2ea', pinkBorder: '#FBCFE8', pinkDeep: '#c4325f',
  cream: '#fffafc', paper: '#fdf0f3', line: '#f3dde3', lineMid: '#E5E7EB',
};

const missions = [
  {
    icon: '/icons/icon-paw-sparkle.png',
    title: 'สร้างขึ้นเพื่อสัตว์เลี้ยงทุกตัว',
    desc: 'Whiskora เกิดจากความเชื่อว่าสัตว์เลี้ยงทุกตัวสมควรได้รับการดูแลที่ดีที่สุด เราสร้างเครื่องมือที่ช่วยให้เจ้าของสัตว์เลี้ยงดูแลน้องๆ ได้อย่างมีระบบและมีข้อมูลรองรับ',
  },
  {
    icon: '/icons/icon-co-owner.png',
    title: 'ชุมชนที่เชื่อมต่อนักเพาะพันธุ์',
    desc: 'เป็นพื้นที่กลางที่นักเพาะพันธุ์มืออาชีพ ฟาร์ม และเจ้าของสัตว์เลี้ยงทั่วไปสามารถเชื่อมต่อ แลกเปลี่ยนข้อมูล และหาสัตว์เลี้ยงที่ตรงใจได้อย่างโปร่งใส',
  },
  {
    icon: '/icons/icon-verified-badge.png',
    title: 'ความโปร่งใสและน่าเชื่อถือ',
    desc: 'ระบบยืนยันตัวตนและประวัติสัตว์เลี้ยงที่ตรวจสอบได้ช่วยให้ทุกการซื้อขายและการรับเลี้ยงเกิดขึ้นบนพื้นฐานของข้อมูลที่ถูกต้องและไว้วางใจได้',
  },
  {
    icon: '/icons/icon-pet-records.png',
    title: 'ความรู้ที่เข้าถึงได้',
    desc: 'รวบรวมองค์ความรู้ด้านสุขภาพ โภชนาการ และพฤติกรรมสัตว์เลี้ยงจากผู้เชี่ยวชาญ เพื่อให้ผู้เลี้ยงทุกคนสามารถตัดสินใจอย่างมีข้อมูลรองรับ',
  },
];

const features = [
  { icon: '/icons/icon-my-pets.png', title: 'Pet Profile', desc: 'สร้างโปรไฟล์ดิจิทัลสำหรับสัตว์เลี้ยงแต่ละตัว พร้อมประวัติสุขภาพและวัคซีน', href: '/pets/create' },
  { icon: '/icons/icon-farm.png', title: 'Farm & Breeder', desc: 'สร้างหน้าฟาร์มและจัดการครอกเพาะพันธุ์ได้อย่างมืออาชีพ', href: '/partner' },
  { icon: '/icons/icon-pet-id-card.png', title: 'Pet ID Card', desc: 'บัตรดิจิทัลพร้อม QR Code ที่ให้ผู้อื่นสแกนดูข้อมูลสัตว์เลี้ยงได้ทันที', href: '/pet-id-card' },
  { icon: '/icons/icon-documents.png', title: 'Knowledge Base', desc: 'บทความและองค์ความรู้สำหรับผู้เลี้ยงสัตว์ทุกประเภท', href: '/pet-knowledge' },
  { icon: '/icons/icon-health.png', title: 'Pet Tools', desc: 'เครื่องมือคำนวณและช่วยตัดสินใจสำหรับผู้เลี้ยง เช่น อาหาร วัคซีน และการผสมพันธุ์', href: '/pet-tools' },
  { icon: '/icons/icon-wallet.png', title: 'Finance Tracker', desc: 'บันทึกค่าใช้จ่ายสำหรับสัตว์เลี้ยง ดูสรุปรายเดือนและรายปีได้ง่ายๆ', href: '/profile/finance' },
];

export default function AboutPage() {
  const router = useRouter();

  return (
    <>
      <style>{`
        @keyframes page-rise {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .ab-page { font-family: inherit; min-height: 100vh; color: ${F.ink}; }
        .ab-wrap { max-width: 680px; margin: 0 auto; padding: 24px 0 80px; animation: page-rise .45s ease both; }

        /* Header */
        .ab-header { display: flex; align-items: center; gap: 14px; margin-bottom: 24px; }
        .ab-back { width: 38px; height: 38px; border-radius: 12px; border: 1px solid ${F.line}; background: white; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: transform .15s, background .15s; flex: 0 0 auto; color: ${F.ink}; }
        .ab-back:hover { transform: translateY(-1px); background: ${F.paper}; }
        .ab-header-text h1 { margin: 0; font-size: 22px; font-weight: 700; color: ${F.ink}; line-height: 1.2; }
        .ab-header-text p { margin: 3px 0 0; font-size: 13px; color: ${F.muted}; }

        /* Hero card */
        .ab-hero {
          background: linear-gradient(135deg, ${F.pink} 0%, #f472b6 100%);
          border-radius: 22px;
          padding: 32px 24px 28px;
          text-align: center;
          margin-bottom: 14px;
          position: relative;
          overflow: hidden;
        }
        .ab-hero::before { content: ''; position: absolute; top: -40px; right: -40px; width: 150px; height: 150px; background: rgba(255,255,255,0.08); border-radius: 50%; }
        .ab-hero::after { content: ''; position: absolute; bottom: -28px; left: -28px; width: 110px; height: 110px; background: rgba(255,255,255,0.06); border-radius: 50%; }
        .ab-hero-logo-wrap { display: flex; align-items: center; justify-content: center; gap: 10px; margin-bottom: 12px; position: relative; z-index: 1; }
        .ab-hero-logo-img { width: 52px; height: 52px; object-fit: contain; filter: brightness(0) invert(1); }
        .ab-hero-logo-text { font-size: 30px; font-weight: 900; color: white; letter-spacing: -0.5px; }
        .ab-hero-tagline { font-size: 14px; font-weight: 500; color: rgba(255,255,255,0.9); line-height: 1.65; position: relative; z-index: 1; max-width: 360px; margin: 0 auto; }

        /* Section label */
        .ab-section-label {
          font-size: 11px; font-weight: 700; color: ${F.muted};
          text-transform: uppercase; letter-spacing: 0.08em;
          margin: 20px 0 10px;
          display: flex; align-items: center; gap: 8px;
        }
        .ab-section-label::after { content: ''; flex: 1; height: 1px; background: ${F.line}; }

        /* Mission cards */
        .ab-mission {
          display: flex; gap: 14px; align-items: flex-start;
          background: rgba(255,255,255,.94);
          border: 1px solid ${F.line};
          border-radius: 18px;
          padding: 18px;
          margin-bottom: 10px;
          box-shadow: 0 4px 14px rgba(31,26,28,.03);
        }
        .ab-mission-icon { width: 48px; height: 48px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; }
        .ab-mission-icon img { width: 48px; height: 48px; object-fit: contain; }
        .ab-mission-title { font-size: 14px; font-weight: 700; color: ${F.ink}; margin-bottom: 5px; }
        .ab-mission-desc { font-size: 12.5px; color: ${F.inkSoft}; line-height: 1.65; }

        /* Feature grid */
        .ab-features { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px; }
        .ab-feat {
          background: rgba(255,255,255,.94);
          border: 1px solid ${F.line};
          border-radius: 18px;
          padding: 16px;
          text-decoration: none; color: inherit;
          transition: transform .15s, border-color .15s, box-shadow .15s;
          display: flex; flex-direction: column; gap: 8px;
          box-shadow: 0 4px 14px rgba(31,26,28,.03);
        }
        .ab-feat:hover { border-color: ${F.pinkBorder}; transform: translateY(-2px); box-shadow: 0 6px 18px rgba(232,70,119,0.09); }
        .ab-feat-icon { width: 40px; height: 40px; object-fit: contain; }
        .ab-feat-title { font-size: 13px; font-weight: 700; color: ${F.ink}; }
        .ab-feat-desc { font-size: 11.5px; color: ${F.muted}; line-height: 1.55; flex: 1; }
        .ab-feat-link { display: flex; align-items: center; gap: 4px; font-size: 11px; font-weight: 700; color: ${F.pink}; margin-top: 4px; }

        /* Founder note */
        .ab-note {
          background: rgba(255,255,255,.94);
          border: 1px solid ${F.line};
          border-radius: 18px;
          padding: 22px;
          margin-top: 6px;
          box-shadow: 0 4px 14px rgba(31,26,28,.03);
        }
        .ab-note-header { display: flex; align-items: center; gap: 12px; margin-bottom: 14px; }
        .ab-note-header img { width: 40px; height: 40px; object-fit: contain; }
        .ab-note-header-text { font-size: 14px; font-weight: 700; color: ${F.ink}; }
        .ab-note-header-sub { font-size: 12px; color: ${F.muted}; margin-top: 1px; }
        .ab-note-text { font-size: 13px; color: ${F.inkSoft}; line-height: 1.75; border-left: 3px solid ${F.pinkBorder}; padding-left: 14px; }
        .ab-note-sig { font-size: 12px; font-weight: 700; color: ${F.pink}; margin-top: 14px; }

        @media (max-width: 560px) {
          .ab-wrap { padding: 16px 0 80px; }
          .ab-hero { border-radius: 16px; padding: 24px 18px 22px; }
          .ab-features { grid-template-columns: 1fr 1fr; }
        }
      `}</style>

      <div className="ab-page">
        <div className="ab-wrap">

          {/* Header */}
          <div className="ab-header">
            <button className="ab-back" onClick={() => router.back()} aria-label="ย้อนกลับ">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="m15 18-6-6 6-6"/>
              </svg>
            </button>
            <div className="ab-header-text">
              <h1>เกี่ยวกับ Whiskora</h1>
              <p>แพลตฟอร์มดิจิทัลสำหรับผู้รักสัตว์เลี้ยง</p>
            </div>
          </div>

          {/* Hero */}
          <div className="ab-hero">
            <div className="ab-hero-logo-wrap">
              <img src="/mini-logo.png" alt="Whiskora" className="ab-hero-logo-img" />
              <span className="ab-hero-logo-text">whiskora</span>
            </div>
            <p className="ab-hero-tagline">
              เชื่อมต่อ ดูแล และบริหารจัดการสัตว์เลี้ยงของคุณในที่เดียว
            </p>
          </div>

          {/* Missions */}
          <div className="ab-section-label">ทำไม Whiskora ถึงเกิดขึ้น</div>
          {missions.map((m, i) => (
            <div key={i} className="ab-mission">
              <div className="ab-mission-icon">
                <img src={m.icon} alt="" />
              </div>
              <div>
                <div className="ab-mission-title">{m.title}</div>
                <div className="ab-mission-desc">{m.desc}</div>
              </div>
            </div>
          ))}

          {/* Features */}
          <div className="ab-section-label">สิ่งที่ทำได้บน Whiskora</div>
          <div className="ab-features">
            {features.map((f, i) => (
              <Link key={i} href={f.href} className="ab-feat">
                <img src={f.icon} alt="" className="ab-feat-icon" />
                <div className="ab-feat-title">{f.title}</div>
                <div className="ab-feat-desc">{f.desc}</div>
                <div className="ab-feat-link">
                  ลองเลย
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                </div>
              </Link>
            ))}
          </div>

          {/* Founder Note */}
          <div className="ab-note">
            <div className="ab-note-header">
              <img src="/icons/icon-paw-sparkle.png" alt="" />
              <div>
                <div className="ab-note-header-text">จากทีมงาน Whiskora</div>
                <div className="ab-note-header-sub">Genesis Program</div>
              </div>
            </div>
            <p className="ab-note-text">
              Whiskora สร้างขึ้นจากความรักที่มีต่อสัตว์เลี้ยง เราเชื่อว่าทุกน้องแมว น้องหมา
              และสัตว์เลี้ยงทุกชนิดสมควรได้รับการดูแลที่ดีที่สุด เราจึงสร้างเครื่องมือที่ช่วยให้
              การดูแลสัตว์เลี้ยงเป็นเรื่องง่าย สนุก และมีระบบ
              ไม่ว่าคุณจะเป็นเจ้าของสัตว์เลี้ยงมือใหม่ หรือนักเพาะพันธุ์มืออาชีพ
              Whiskora พร้อมเป็นผู้ช่วยที่เชื่อถือได้ของคุณเสมอ
            </p>
            <div className="ab-note-sig">— ทีมงาน Whiskora</div>
          </div>

        </div>
      </div>
    </>
  );
}
