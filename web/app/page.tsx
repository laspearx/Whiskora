"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, MotionConfig } from "framer-motion";

// ─── Design tokens ────────────────────────────────────────────────────────────
const F = {
  ink:        '#1f1a1c',
  inkSoft:    '#4a3f44',
  muted:      '#8e7e84',
  pink:       '#e84677',
  pinkSoft:   '#fde2ea',
  pinkDeep:   '#c4325f',
  pinkBorder: '#fbcfe8',
  teal:       '#0d9488',
  tealSoft:   '#f0fdfa',
  tealBorder: '#99f6e4',
  sky:        '#5b8dc7',
  skySoft:    '#eff6ff',
  skyBorder:  '#bfdbfe',
  leaf:       '#5a9065',
  leafSoft:   '#dcfce7',
  sun:        '#e8a63a',
  sunSoft:    '#fef9c3',
  purple:     '#7c5cbf',
  purpleSoft: '#ede9fe',
  line:       '#f3dde3',
  lineMid:    '#e5e7eb',
  paper:      '#fdf0f3',
  cream:      '#fffafc',
  bg:         '#fdf6f8',
};

// ─── Animation variants ───────────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 22 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.52, ease: [0.2, 0.8, 0.2, 1] } },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
};

const vp = { once: true, margin: "-64px" as const };

// ─── SVG Icons ────────────────────────────────────────────────────────────────
const IdCardIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="5" width="20" height="14" rx="2"/>
    <circle cx="8" cy="12" r="2"/>
    <path d="M14 10h4"/><path d="M14 14h4"/>
  </svg>
);
const HeartPulseIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
  </svg>
);
const QrIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
    <rect x="3" y="14" width="7" height="7"/>
    <path d="M14 14h3v3h-3z"/><path d="M17 17h3v3h-3z"/><path d="M14 20h3"/>
  </svg>
);
const ShieldIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    <polyline points="9 12 11 14 15 10"/>
  </svg>
);
const TreeIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);
const ShareIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
  </svg>
);
const ArrowRightIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
  </svg>
);
const CheckIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const ClipboardIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 2H5a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2h-4"/>
    <rect x="9" y="2" width="6" height="4" rx="1"/>
    <path d="M9 12h6"/><path d="M9 16h4"/>
  </svg>
);
const PawIconDark = () => <img src="/icons/icon-paw-circle-white.png" alt="" style={{ width: '70%', height: '70%', objectFit: 'contain' }} />;
const PawIconLight = () => <img src="/paw.png" alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />;
const FarmIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
    <polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
);
const StethoscopeIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3"/>
    <path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4"/>
    <circle cx="20" cy="10" r="2"/>
  </svg>
);
const ShopIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
    <line x1="3" y1="6" x2="21" y2="6"/>
    <path d="M16 10a4 4 0 0 1-8 0"/>
  </svg>
);
const LockIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);

// ─── FAQ data ─────────────────────────────────────────────────────────────────
const faqs = [
  {
    q: "Whiskora คืออะไร?",
    a: "Whiskora คือแพลตฟอร์ม pet-tech สำหรับสร้าง Pet ID ดิจิทัล บันทึกประวัติสุขภาพและวัคซีน จัดการสายพันธุ์ และแชร์โปรไฟล์สัตว์เลี้ยงผ่าน QR Code ได้อย่างปลอดภัย พร้อมระบบฟาร์มและบรีดเดอร์ที่ตรวจสอบได้",
  },
  {
    q: "Pet ID Card คืออะไร ใช้ทำอะไรได้บ้าง?",
    a: "Pet ID Card คือบัตรประจำตัวดิจิทัลสำหรับสัตว์เลี้ยงของคุณ ประกอบด้วยชื่อ สายพันธุ์ รูปภาพ และ QR Code ที่ชี้ไปยังโปรไฟล์สาธารณะของน้อง สามารถแชร์บนโซเชียลหรือแสดงให้คลินิก กรูมมิ่ง หรือผู้ดูแลสแกนดูข้อมูลได้ทันที",
  },
  {
    q: "ใช้ Whiskora ฟรีหรือเปล่า?",
    a: "ฟีเจอร์หลักทั้งหมดฟรีตลอดชีพ — สร้าง Pet ID ดูแลสุขภาพ บันทึกวัคซีน และแชร์โปรไฟล์ QR ไม่ต้องบัตรเครดิต ไม่มีค่าสมัครสมาชิกรายเดือน",
  },
  {
    q: "บรีดเดอร์และฟาร์มสัตว์เลี้ยงใช้ Whiskora ได้อย่างไร?",
    a: "บรีดเดอร์สามารถสร้างโปรไฟล์ฟาร์มที่ตรวจสอบได้ บันทึกประวัติสุขภาพและวัคซีนของสัตว์ในฟาร์ม สร้างผังสายเลือด (Pedigree) และโอนกรรมสิทธิ์ให้ผู้ซื้อผ่านระบบดิจิทัล ทำให้ผู้ซื้อมั่นใจในความโปร่งใสของข้อมูลก่อนตัดสินใจ",
  },
  {
    q: "ข้อมูลสัตว์เลี้ยงของฉันปลอดภัยแค่ไหน?",
    a: "คุณควบคุมการมองเห็นข้อมูลได้เต็มที่ — ตั้งได้ 3 ระดับ: สาธารณะ (เห็นได้ทุกคนผ่าน QR), ลิงก์เฉพาะ (เห็นได้เฉพาะผู้ที่มีลิงก์), และส่วนตัว ข้อมูลอ่อนไหวเช่น microchip, ที่อยู่, และหมายเหตุสุขภาพจะไม่ถูกเปิดเผยสาธารณะ",
  },
  {
    q: "Whiskora รองรับสัตว์เลี้ยงประเภทอะไรบ้าง?",
    a: "รองรับ 14 ประเภท ได้แก่ แมว สุนัข กระต่าย หนูแฮมสเตอร์ นก เต่า งู กิ้งก่า ปลา กระรอก เม่น ชูการ์ไกลเดอร์ แมวน้ำ และสัตว์อื่นๆ",
  },
];

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function Home() {
  return (
    <MotionConfig reducedMotion="user">
      <style>{`
        /* ── FAQ accordion ────────────────────────────────── */
        .hp-faq-item summary {
          list-style: none; cursor: pointer; user-select: none;
          display: flex; justify-content: space-between; align-items: center;
          gap: 16px; padding: 22px 0;
        }
        .hp-faq-item summary::-webkit-details-marker { display: none; }
        .hp-faq-chevron { transition: transform .25s ease; flex-shrink: 0; }
        .hp-faq-item[open] .hp-faq-chevron { transform: rotate(180deg); }
        .hp-faq-body { padding: 0 0 22px; }
        .hp-faq-item { border-bottom: 1px solid ${F.line}; }
        .hp-faq-item:first-child { border-top: 1px solid ${F.line}; }

        /* ── Lifecycle connector line ─────────────────────── */
        .hp-lifecycle-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 0;
          position: relative;
        }
        .hp-lifecycle-grid::before {
          content: '';
          position: absolute;
          top: 28px;
          left: calc(10% + 20px);
          right: calc(10% + 20px);
          height: 2px;
          background: ${F.pinkBorder};
          z-index: 0;
        }

        /* ── Buttons ──────────────────────────────────────── */
        .hp-btn-pink {
          display: inline-flex; align-items: center; gap: 8px;
          background: ${F.pink}; color: #fff;
          padding: 13px 26px; border-radius: 14px;
          font-weight: 700; font-size: 15px; border: none; cursor: pointer;
          text-decoration: none; font-family: inherit;
          box-shadow: 0 4px 16px rgba(232,70,119,.25);
          transition: background .15s, transform .15s, box-shadow .15s;
        }
        .hp-btn-pink:hover {
          background: ${F.pinkDeep}; transform: translateY(-1px);
          box-shadow: 0 8px 24px rgba(232,70,119,.35);
        }
        .hp-btn-outline {
          display: inline-flex; align-items: center; gap: 8px;
          background: #fff; color: ${F.inkSoft};
          padding: 13px 26px; border-radius: 14px;
          font-weight: 600; font-size: 15px; border: 1.5px solid ${F.lineMid};
          cursor: pointer; text-decoration: none; font-family: inherit;
          transition: border-color .15s, background .15s, color .15s;
        }
        .hp-btn-outline:hover {
          border-color: ${F.pink}; color: ${F.pink}; background: ${F.pinkSoft};
        }
        .hp-btn-ghost {
          display: inline-flex; align-items: center; gap: 6px;
          background: transparent; color: ${F.pink};
          padding: 0; border: none; cursor: pointer;
          font-weight: 700; font-size: 14px; font-family: inherit;
          text-decoration: none; transition: gap .15s;
        }
        .hp-btn-ghost:hover { gap: 10px; }

        /* ── Feature card hover ───────────────────────────── */
        .hp-feature-card {
          transition: transform .22s, box-shadow .22s;
        }
        .hp-feature-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 16px 36px rgba(31,26,28,.08) !important;
        }

        /* ── Responsive ───────────────────────────────────── */
        @media (max-width: 900px) {
          .hp-lifecycle-grid {
            grid-template-columns: 1fr !important;
          }
          .hp-lifecycle-grid::before { display: none; }
          .hp-lifecycle-step { flex-direction: row !important; text-align: left !important; }
          .hp-lifecycle-step-dot { margin: 0 !important; }
          .hp-grid-2 { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 600px) {
          .hp-grid-3 { grid-template-columns: 1fr !important; }
          .hp-grid-2 { grid-template-columns: 1fr !important; }
          .hp-hero-btns { flex-direction: column !important; align-items: stretch !important; }
          .hp-hero-btns a, .hp-hero-btns button { width: 100%; justify-content: center; }
          .hp-feature-split { flex-direction: column !important; }
          .hp-feature-split-img { display: none !important; }
        }
      `}</style>

      {/* ── JSON-LD FAQPage ──────────────────────────────────────────── */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": faqs.map(f => ({
              "@type": "Question",
              "name": f.q,
              "acceptedAnswer": { "@type": "Answer", "text": f.a },
            })),
          }),
        }}
      />

      <div style={{ color: F.ink, fontFamily: 'var(--font-ui)', paddingBottom: 80 }}>

        {/* ══════════════════════════════════════════════════ 2. PROBLEM / INSIGHT */}
        <section style={{ paddingTop: 40 }}>
          <motion.div initial="hidden" whileInView="visible" viewport={vp} variants={staggerContainer}>
            <motion.div variants={fadeUp} style={{ marginBottom: 36 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: F.pink, marginBottom: 8 }}>
                ทำไมต้องมี Whiskora?
              </div>
              <h2 style={{ fontSize: 'clamp(22px, 3.5vw, 30px)', fontWeight: 800, letterSpacing: -0.5, margin: 0 }}>
                ปัญหาที่เจ้าของสัตว์เลี้ยง<br />เจอทุกวัน
              </h2>
            </motion.div>

            <motion.div
              variants={staggerContainer}
              className="hp-grid-3"
              style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}
            >
              {[
                {
                  icon: <ClipboardIcon />,
                  color: F.pink, bg: F.pinkSoft,
                  title: 'ประวัติสุขภาพกระจายอยู่ทุกที่',
                  desc: 'กระดาษ โน้ต ไลน์ รูปถ่าย — ไม่มีใครรู้ว่าน้องฉีดวัคซีนอะไรบ้าง เมื่อไหร่ หรือตรวจโรคอะไรไปแล้ว',
                },
                {
                  icon: <ShieldIcon />,
                  color: F.sky, bg: F.skySoft,
                  title: 'บรีดเดอร์ไม่มีหลักฐานที่ตรวจสอบได้',
                  desc: 'ตัดสินใจยาก ไม่รู้ว่าฟาร์มไหนน่าเชื่อถือ สายพันธุ์จริงหรือเปล่า หรือสัตว์เคยตรวจโรคหรือยัง',
                },
                {
                  icon: <ShareIcon />,
                  color: F.teal, bg: F.tealSoft,
                  title: 'ทุกที่ขอข้อมูลซ้ำทุกครั้ง',
                  desc: 'คลินิก กรูมมิ่ง ที่ฝากเลี้ยง — ข้อมูลเดิม คำถามเดิม ต้องตอบซ้ำไม่จบ ทั้งที่มีอยู่ในมือถืออยู่แล้ว',
                },
              ].map(item => (
                <motion.div
                  key={item.title}
                  variants={fadeUp}
                  className="hp-feature-card"
                  style={{ background: '#fff', border: `1px solid ${F.line}`, borderRadius: 20, padding: 28 }}
                >
                  <div style={{ width: 46, height: 46, borderRadius: 14, background: item.bg, display: 'grid', placeItems: 'center', color: item.color, marginBottom: 18 }}>
                    {item.icon}
                  </div>
                  <h3 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 10px', lineHeight: 1.4 }}>{item.title}</h3>
                  <p style={{ fontSize: 13, color: F.inkSoft, lineHeight: 1.75, margin: 0 }}>{item.desc}</p>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </section>

        {/* ══════════════════════════════════════════════════ 3. PRODUCT PILLARS */}
        <section style={{ paddingTop: 72 }}>
          <motion.div initial="hidden" whileInView="visible" viewport={vp} variants={staggerContainer}>
            <motion.div variants={fadeUp} style={{ marginBottom: 40, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: F.pink, marginBottom: 8 }}>
                  สิ่งที่ Whiskora ทำได้
                </div>
                <h2 style={{ fontSize: 'clamp(22px, 3.5vw, 30px)', fontWeight: 800, letterSpacing: -0.5, margin: 0 }}>
                  ศูนย์กลางข้อมูลสัตว์เลี้ยง<br />ที่เชื่อถือได้
                </h2>
              </div>
              <Link href="/register" className="hp-btn-ghost">
                เริ่มใช้งานฟรี <ArrowRightIcon />
              </Link>
            </motion.div>

            <motion.div
              variants={staggerContainer}
              className="hp-grid-3"
              style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}
            >
              {[
                {
                  icon: <IdCardIcon />, color: F.pink, bg: F.pinkSoft,
                  title: 'Pet ID ดิจิทัล',
                  desc: 'บัตรประจำตัวพร้อม QR Code แชร์ได้ทุกช่องทาง สแกนเพื่อดูข้อมูลน้องได้ทันที',
                },
                {
                  icon: <HeartPulseIcon />, color: F.sky, bg: F.skySoft,
                  title: 'สมุดสุขภาพออนไลน์',
                  desc: 'วัคซีน ผลตรวจ น้ำหนัก และโน้ตสุขภาพ บันทึกครบในที่เดียว ค้นหาได้ทุกเมื่อ',
                },
                {
                  icon: <QrIcon />, color: F.teal, bg: F.tealSoft,
                  title: 'โปรไฟล์ QR สาธารณะ',
                  desc: 'ตั้งระดับการเข้าถึง 3 ระดับ — สาธารณะ ลิงก์เฉพาะ หรือส่วนตัว แชร์ได้อย่างปลอดภัย',
                },
                {
                  icon: <ShieldIcon />, color: F.purple, bg: F.purpleSoft,
                  title: 'โปรไฟล์ฟาร์มยืนยัน',
                  desc: 'ฟาร์มที่ผ่านการตรวจสอบเอกสาร บันทึกประวัติสุขภาพ และให้ข้อมูลสายพันธุ์โปร่งใส',
                },
                {
                  icon: <TreeIcon />, color: F.sun, bg: F.sunSoft,
                  title: 'ผังสายเลือดดิจิทัล',
                  desc: 'Pedigree ย้อนหลังหลายรุ่น พร้อมระบบโอนกรรมสิทธิ์ที่บันทึกไว้ในประวัติสัตว์',
                },
                {
                  icon: <ShareIcon />, color: F.leaf, bg: F.leafSoft,
                  title: 'ข้อมูลพร้อมแชร์กับบริการ',
                  desc: 'คลินิก กรูมมิ่ง ฝากเลี้ยง — แชร์ข้อมูลผ่าน QR ได้ทันที ไม่ต้องเล่าซ้ำทุกครั้ง',
                },
              ].map(item => (
                <motion.div
                  key={item.title}
                  variants={fadeUp}
                  className="hp-feature-card"
                  style={{ background: '#fff', border: `1px solid ${F.line}`, borderRadius: 18, padding: 24 }}
                >
                  <div style={{ width: 44, height: 44, borderRadius: 13, background: item.bg, display: 'grid', placeItems: 'center', color: item.color, marginBottom: 14 }}>
                    {item.icon}
                  </div>
                  <h3 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 8px' }}>{item.title}</h3>
                  <p style={{ fontSize: 13, color: F.inkSoft, lineHeight: 1.7, margin: 0 }}>{item.desc}</p>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </section>

        {/* ══════════════════════════════════════════════════ 4. LIFECYCLE */}
        <section style={{ paddingTop: 72 }}>
          <motion.div initial="hidden" whileInView="visible" viewport={vp} variants={staggerContainer}>
            <motion.div variants={fadeUp} style={{ textAlign: 'center', marginBottom: 48 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: F.pink, marginBottom: 8 }}>
                ทุกช่วงชีวิต เชื่อมต่อกัน
              </div>
              <h2 style={{ fontSize: 'clamp(22px, 3.5vw, 30px)', fontWeight: 800, letterSpacing: -0.5, margin: '0 auto', maxWidth: 420 }}>
                จากวันแรกถึงตลอดชีวิต<br />Whiskora อยู่เคียงข้าง
              </h2>
            </motion.div>

            <motion.div variants={staggerContainer} className="hp-lifecycle-grid">
              {[
                { n: '01', icon: <PawIconDark />, label: 'สร้างโปรไฟล์', sub: 'บันทึกข้อมูลพื้นฐาน รูปภาพ และสายพันธุ์' },
                { n: '02', icon: <HeartPulseIcon />, label: 'บันทึกสุขภาพ', sub: 'วัคซีน ผลตรวจ น้ำหนัก บันทึกต่อเนื่อง' },
                { n: '03', icon: <ShareIcon />, label: 'แชร์กับผู้ดูแล', sub: 'QR ให้คลินิกหรือ Co-owner ดูข้อมูลได้' },
                { n: '04', icon: <ShieldIcon />, label: 'ยืนยันสายพันธุ์', sub: 'Pedigree เชื่อมฟาร์มต้นกำเนิด' },
                { n: '05', icon: <TreeIcon />, label: 'โอนกรรมสิทธิ์', sub: 'บันทึกประวัติการเปลี่ยนเจ้าของ' },
              ].map((step, i) => (
                <motion.div
                  key={step.n}
                  variants={fadeUp}
                  className="hp-lifecycle-step"
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 12, padding: '0 8px', position: 'relative', zIndex: 1 }}
                >
                  <div
                    className="hp-lifecycle-step-dot"
                    style={{ width: 56, height: 56, borderRadius: '50%', background: i === 0 ? F.pink : '#fff', border: `2px solid ${i === 0 ? F.pink : F.pinkBorder}`, display: 'grid', placeItems: 'center', color: i === 0 ? '#fff' : F.pink }}
                  >
                    {step.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: 1.5, color: F.muted, marginBottom: 4 }}>STEP {step.n}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: F.ink, marginBottom: 4 }}>{step.label}</div>
                    <div style={{ fontSize: 11, color: F.muted, lineHeight: 1.6 }}>{step.sub}</div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </section>

        {/* ══════════════════════════════════════════════════ 5. USER GROUPS */}
        <section style={{ paddingTop: 72 }}>
          <motion.div initial="hidden" whileInView="visible" viewport={vp} variants={staggerContainer}>
            <motion.div variants={fadeUp} style={{ marginBottom: 40 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: F.pink, marginBottom: 8 }}>
                สำหรับทุกคนในระบบนิเวศสัตว์เลี้ยง
              </div>
              <h2 style={{ fontSize: 'clamp(22px, 3.5vw, 30px)', fontWeight: 800, letterSpacing: -0.5, margin: 0 }}>
                ไม่ว่าจะเป็นใคร<br />Whiskora มีสำหรับคุณ
              </h2>
            </motion.div>

            <motion.div
              variants={staggerContainer}
              className="hp-grid-2"
              style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}
            >
              {[
                {
                  icon: <PawIconLight />, color: F.pink, bg: 'transparent',
                  label: 'เจ้าของสัตว์เลี้ยง',
                  desc: 'สร้าง Pet ID ฟรี บันทึกประวัติสุขภาพ แชร์โปรไฟล์ QR และดูแลน้องได้อย่างมืออาชีพ',
                  benefits: ['Pet ID + QR Profile ฟรี', 'สมุดสุขภาพครบ', 'เชิญ Co-owner ร่วมดูแล'],
                  cta: 'เริ่มใช้งานฟรี', href: '/register',
                },
                {
                  icon: <FarmIcon />, color: F.purple, bg: F.purpleSoft,
                  label: 'ฟาร์มและบรีดเดอร์',
                  desc: 'สร้างโปรไฟล์ฟาร์มที่ตรวจสอบได้ จัดการลูกสัตว์ทั้งฟาร์ม และเชื่อมผังสายเลือดได้ทันที',
                  benefits: ['โปรไฟล์ฟาร์มยืนยัน', 'จัดการ Pedigree', 'บันทึกสุขภาพทั้งฟาร์ม'],
                  cta: 'เปิดฟาร์ม', href: '/partner',
                },
                {
                  icon: <StethoscopeIcon />, color: F.teal, bg: F.tealSoft,
                  label: 'คลินิกและบริการ',
                  desc: 'ดูข้อมูลสัตว์เลี้ยงที่แม่นยำผ่าน QR ลดคำถามซ้ำ และบันทึกประวัติการรักษาได้ทันที',
                  benefits: ['สแกน QR ดูข้อมูลได้เลย', 'ลดงานเอกสาร', 'ข้อมูลอัปเดตสม่ำเสมอ'],
                  cta: 'ลงทะเบียนพาร์ทเนอร์', href: '/partner',
                },
                {
                  icon: <ShopIcon />, color: F.sky, bg: F.skySoft,
                  label: 'ร้านค้าสัตว์เลี้ยง',
                  desc: 'เชื่อมต่อธุรกิจกับผู้เลี้ยงสัตว์ที่มีข้อมูลครบถ้วน เพิ่มความน่าเชื่อถือและฐานลูกค้า',
                  benefits: ['โปรโมทบนแพลตฟอร์ม', 'เข้าถึงกลุ่มเป้าหมาย', 'ฟรีในช่วง Genesis Program'],
                  cta: 'เข้าร่วมโปรแกรม', href: '/partner',
                },
              ].map(g => (
                <motion.div
                  key={g.label}
                  variants={fadeUp}
                  className="hp-feature-card"
                  style={{ background: '#fff', border: `1px solid ${F.line}`, borderRadius: 22, padding: 28 }}
                >
                  <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 16 }}>
                    <div style={{ width: 48, height: 48, borderRadius: 15, background: g.bg, display: 'grid', placeItems: 'center', color: g.color, flexShrink: 0 }}>
                      {g.icon}
                    </div>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: F.ink, marginBottom: 6 }}>{g.label}</div>
                      <p style={{ fontSize: 13, color: F.inkSoft, lineHeight: 1.65, margin: 0 }}>{g.desc}</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 20 }}>
                    {g.benefits.map(b => (
                      <div key={b} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: F.inkSoft }}>
                        <span style={{ width: 18, height: 18, borderRadius: '50%', background: g.bg, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: g.color, flexShrink: 0 }}>
                          <CheckIcon />
                        </span>
                        {b}
                      </div>
                    ))}
                  </div>
                  <Link href={g.href} className="hp-btn-ghost" style={{ color: g.color }}>
                    {g.cta} <ArrowRightIcon />
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </section>

        {/* ══════════════════════════════════════════════════ 6. FEATURE SHOWCASE */}
        <section style={{ paddingTop: 72 }}>
          <motion.div initial="hidden" whileInView="visible" viewport={vp} variants={staggerContainer}>
            <motion.div variants={fadeUp} style={{ marginBottom: 44 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: F.pink, marginBottom: 8 }}>
                ฟีเจอร์หลัก
              </div>
              <h2 style={{ fontSize: 'clamp(22px, 3.5vw, 30px)', fontWeight: 800, letterSpacing: -0.5, margin: 0 }}>
                ดูว่า Whiskora<br />ทำอะไรได้บ้าง
              </h2>
            </motion.div>

            {/* Feature 1: Pet ID Card */}
            <motion.div
              variants={fadeUp}
              className="hp-feature-split"
              style={{ display: 'flex', gap: 48, alignItems: 'center', marginBottom: 56 }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: F.pinkSoft, color: F.pinkDeep, fontSize: 11, fontWeight: 700, letterSpacing: 1.2, padding: '4px 12px', borderRadius: 999, marginBottom: 16 }}>
                  <IdCardIcon /> Pet ID Card
                </div>
                <h3 style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.3, margin: '0 0 14px' }}>
                  บัตรประจำตัวดิจิทัล<br />พร้อม QR Code
                </h3>
                <p style={{ fontSize: 14, color: F.inkSoft, lineHeight: 1.8, margin: '0 0 24px' }}>
                  สร้างบัตร ID สวยงามสำหรับน้องแต่ละตัว พร้อม QR Code ที่ชี้ไปยังโปรไฟล์สาธารณะ แชร์บนโซเชียลหรือพิมพ์ติดกรง ผู้ดูแลสแกนเพื่อดูข้อมูลได้ทันที
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
                  {['เลือกธีมบัตรได้หลายแบบ', 'QR Code เชื่อมโปรไฟล์จริง', 'ดาวน์โหลดและแชร์ได้เลย'].map(b => (
                    <div key={b} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: F.inkSoft }}>
                      <span style={{ width: 20, height: 20, borderRadius: '50%', background: F.pinkSoft, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: F.pink, flexShrink: 0 }}>
                        <CheckIcon />
                      </span>
                      {b}
                    </div>
                  ))}
                </div>
                <Link href="/pet-id-card" className="hp-btn-pink">
                  ดูตัวอย่างบัตร <ArrowRightIcon />
                </Link>
              </div>
              <div className="hp-feature-split-img" style={{ flex: '0 0 auto', width: 'min(42%, 340px)' }}>
                <Image
                  src="/id-card/pet-id-card-bg-premium-pink-v1.png"
                  alt="ตัวอย่าง Pet ID Card จาก Whiskora"
                  width={340}
                  height={220}
                  style={{ width: '100%', height: 'auto', borderRadius: 18 }}
                />
              </div>
            </motion.div>

            {/* Feature 2: QR Public Profile */}
            <motion.div
              variants={fadeUp}
              className="hp-feature-split"
              style={{ display: 'flex', gap: 48, alignItems: 'center', flexDirection: 'row-reverse', marginBottom: 56 }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: F.tealSoft, color: F.teal, fontSize: 11, fontWeight: 700, letterSpacing: 1.2, padding: '4px 12px', borderRadius: 999, marginBottom: 16 }}>
                  <QrIcon /> QR Public Profile
                </div>
                <h3 style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.3, margin: '0 0 14px' }}>
                  โปรไฟล์สาธารณะ<br />ที่คุณควบคุมได้
                </h3>
                <p style={{ fontSize: 14, color: F.inkSoft, lineHeight: 1.8, margin: '0 0 24px' }}>
                  แสดงข้อมูลน้องต่อสาธารณะได้อย่างปลอดภัย ตั้งระดับการเข้าถึงได้ 3 ระดับ ข้อมูลอ่อนไหวจะไม่ถูกเปิดเผยโดยอัตโนมัติ
                </p>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 28 }}>
                  {['สาธารณะ', 'ลิงก์เฉพาะ', 'ส่วนตัว'].map((level, i) => (
                    <span key={level} style={{ padding: '6px 14px', borderRadius: 999, fontSize: 12, fontWeight: 700, background: i === 0 ? F.tealSoft : '#fff', color: i === 0 ? F.teal : F.muted, border: `1px solid ${i === 0 ? F.tealBorder : F.lineMid}` }}>
                      {level}
                    </span>
                  ))}
                </div>
                <Link href="/register" className="hp-btn-outline" style={{ borderColor: F.tealBorder, color: F.teal }}>
                  ทดลองใช้งาน <ArrowRightIcon />
                </Link>
              </div>
              <div
                className="hp-feature-split-img"
                style={{ flex: '0 0 auto', width: 'min(42%, 340px)', background: F.tealSoft, borderRadius: 20, padding: 32, display: 'flex', flexDirection: 'column', gap: 12, border: `1px solid ${F.tealBorder}` }}
              >
                {[
                  { label: 'ชื่อ', value: 'มีมี่', visible: true },
                  { label: 'สายพันธุ์', value: 'Scottish Fold', visible: true },
                  { label: 'วัคซีนครั้งล่าสุด', value: '12 มิ.ย. 2568', visible: true },
                  { label: 'microchip', value: '●●●●●●●●', visible: false },
                  { label: 'ที่อยู่เจ้าของ', value: '●●●●●●', visible: false },
                ].map(row => (
                  <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#fff', borderRadius: 10, fontSize: 12 }}>
                    <span style={{ color: F.muted, fontWeight: 600 }}>{row.label}</span>
                    <span style={{ fontWeight: 700, color: row.visible ? F.ink : F.lineMid, display: 'flex', alignItems: 'center', gap: 6 }}>
                      {!row.visible && <LockIcon />}
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Feature 3: Health Records */}
            <motion.div
              variants={fadeUp}
              className="hp-feature-split"
              style={{ display: 'flex', gap: 48, alignItems: 'center' }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: F.skySoft, color: F.sky, fontSize: 11, fontWeight: 700, letterSpacing: 1.2, padding: '4px 12px', borderRadius: 999, marginBottom: 16 }}>
                  <HeartPulseIcon /> สมุดสุขภาพดิจิทัล
                </div>
                <h3 style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.3, margin: '0 0 14px' }}>
                  ประวัติสุขภาพครบ<br />ในที่เดียว
                </h3>
                <p style={{ fontSize: 14, color: F.inkSoft, lineHeight: 1.8, margin: '0 0 24px' }}>
                  บันทึกวัคซีน ผลตรวจเลือด น้ำหนัก การรักษา และโน้ตสำคัญ พร้อมดูประวัติย้อนหลังทุกครั้งที่ต้องการ ไม่ต้องพึ่งความจำ
                </p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 28 }}>
                  {['วัคซีน', 'ผลตรวจ', 'น้ำหนัก', 'กิจกรรม', 'เอกสาร'].map(tag => (
                    <span key={tag} style={{ padding: '5px 12px', borderRadius: 999, fontSize: 12, fontWeight: 600, background: F.skySoft, color: F.sky, border: `1px solid ${F.skyBorder}` }}>
                      {tag}
                    </span>
                  ))}
                </div>
                <Link href="/register" className="hp-btn-outline" style={{ borderColor: F.skyBorder, color: F.sky }}>
                  เริ่มบันทึกสุขภาพ <ArrowRightIcon />
                </Link>
              </div>
              <div
                className="hp-feature-split-img"
                style={{ flex: '0 0 auto', width: 'min(42%, 340px)', background: F.skySoft, borderRadius: 20, padding: 28, border: `1px solid ${F.skyBorder}` }}
              >
                <div style={{ fontSize: 12, fontWeight: 700, color: F.sky, marginBottom: 14, letterSpacing: 1 }}>VACCINE HISTORY</div>
                {[
                  { name: 'FVRCP (Feline 3)', date: '12 มิ.ย. 68', next: '12 มิ.ย. 69', status: 'ปัจจุบัน' },
                  { name: 'Rabies', date: '1 มี.ค. 68', next: '1 มี.ค. 69', status: 'ปัจจุบัน' },
                  { name: 'FeLV', date: '15 ม.ค. 68', next: '15 ม.ค. 69', status: 'ปัจจุบัน' },
                ].map(v => (
                  <div key={v.name} style={{ background: '#fff', borderRadius: 10, padding: '12px 14px', marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: F.ink }}>{v.name}</div>
                      <div style={{ fontSize: 10, color: F.muted, marginTop: 2 }}>ฉีดล่าสุด: {v.date}</div>
                    </div>
                    <span style={{ padding: '3px 8px', background: F.leafSoft, color: F.leaf, borderRadius: 999, fontSize: 10, fontWeight: 700 }}>{v.status}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        </section>

        {/* ══════════════════════════════════════════════════ 7. TRUST */}
        <section style={{ paddingTop: 72 }}>
          <motion.div initial="hidden" whileInView="visible" viewport={vp} variants={staggerContainer}>
            <motion.div
              variants={fadeUp}
              style={{ background: F.ink, borderRadius: 26, padding: 'clamp(32px, 5vw, 52px)', position: 'relative', overflow: 'hidden' }}
            >
              {/* Background decorations */}
              <div style={{ position: 'absolute', top: -80, right: -60, width: 280, height: 280, background: 'radial-gradient(circle,rgba(232,70,119,.18) 0%,transparent 70%)', pointerEvents: 'none' }} />
              <div style={{ position: 'absolute', bottom: -60, left: -40, width: 200, height: 200, background: 'radial-gradient(circle,rgba(13,148,136,.12) 0%,transparent 70%)', pointerEvents: 'none' }} />

              <div style={{ position: 'relative', zIndex: 2 }}>
                <motion.div variants={fadeUp}>
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: F.pink, marginBottom: 10 }}>
                    ความน่าเชื่อถือคือพื้นฐาน
                  </div>
                  <h2 style={{ fontSize: 'clamp(22px, 3.5vw, 28px)', fontWeight: 800, letterSpacing: -0.5, color: '#fff', margin: '0 0 36px' }}>
                    ข้อมูลที่ถูกต้อง โปร่งใส<br />
                    <span style={{ color: F.pinkSoft }}>ตรวจสอบได้ทุกขั้นตอน</span>
                  </h2>
                </motion.div>

                <motion.div
                  variants={staggerContainer}
                  className="hp-grid-2"
                  style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}
                >
                  {[
                    {
                      icon: <LockIcon />, color: F.pink,
                      title: 'ข้อมูลสาธารณะถูกควบคุมโดยเจ้าของ',
                      desc: 'เจ้าของตั้งระดับการมองเห็นได้เอง ข้อมูลอ่อนไหวไม่เผยแพร่โดยอัตโนมัติ',
                    },
                    {
                      icon: <ShieldIcon />, color: F.teal,
                      title: 'ฟาร์มที่ยืนยันแล้วผ่านการตรวจสอบเอกสาร',
                      desc: 'ฟาร์มทุกแห่งต้องยืนยันตัวตนและสถานที่จริง ไม่รับฟาร์มนิรนาม',
                    },
                    {
                      icon: <ClipboardIcon />, color: F.sky,
                      title: 'บันทึกสุขภาพจากฟาร์ม ไม่ใช่แค่คำบอกเล่า',
                      desc: 'ประวัติสุขภาพและวัคซีนบันทึกในระบบตั้งแต่อยู่ที่ฟาร์ม ผู้ซื้อเห็นได้ทันที',
                    },
                    {
                      icon: <ShareIcon />, color: F.purple,
                      title: 'พร้อมเชื่อมต่อกับคลินิกและบริการ',
                      desc: 'โครงสร้างพื้นฐานสำหรับการผสานข้อมูลสัตว์เลี้ยงกับผู้ให้บริการในอนาคต',
                    },
                  ].map(t => (
                    <motion.div
                      key={t.title}
                      variants={fadeUp}
                      style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, padding: '20px 22px', display: 'flex', gap: 14, alignItems: 'flex-start' }}
                    >
                      <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(255,255,255,0.08)', display: 'grid', placeItems: 'center', color: t.color, flexShrink: 0 }}>
                        {t.icon}
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 6 }}>{t.title}</div>
                        <div style={{ fontSize: 12, color: 'rgba(255,255,255,.6)', lineHeight: 1.65 }}>{t.desc}</div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>

                <motion.div variants={fadeUp} style={{ marginTop: 32, display: 'flex', alignItems: 'center', gap: 16 }}>
                  <Image src="/verified.png" alt="Whiskora Verified" width={48} height={48} style={{ opacity: 0.9 }} />
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,.6)', margin: 0, maxWidth: 380, lineHeight: 1.7 }}>
                    ฟาร์มที่ผ่านการตรวจสอบจาก Whiskora จะได้รับตราสัญลักษณ์ Verified แสดงบนโปรไฟล์
                  </p>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        </section>

        {/* ══════════════════════════════════════════════════ 8. FAQ */}
        <section style={{ paddingTop: 72 }}>
          <motion.div initial="hidden" whileInView="visible" viewport={vp} variants={staggerContainer}>
            <motion.div variants={fadeUp} style={{ marginBottom: 36 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: F.pink, marginBottom: 8 }}>
                FAQ
              </div>
              <h2 style={{ fontSize: 'clamp(22px, 3.5vw, 30px)', fontWeight: 800, letterSpacing: -0.5, margin: 0 }}>
                คำถามที่พบบ่อย
              </h2>
            </motion.div>

            <motion.div variants={fadeUp}>
              {faqs.map((faq) => (
                <details key={faq.q} className="hp-faq-item">
                  <summary>
                    <span style={{ fontSize: 15, fontWeight: 700, color: F.ink, lineHeight: 1.5 }}>{faq.q}</span>
                    <span className="hp-faq-chevron" style={{ color: F.muted, display: 'flex', flexShrink: 0 }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="6 9 12 15 18 9"/>
                      </svg>
                    </span>
                  </summary>
                  <p className="hp-faq-body" style={{ fontSize: 14, color: F.inkSoft, lineHeight: 1.8, margin: 0 }}>{faq.a}</p>
                </details>
              ))}
            </motion.div>
          </motion.div>
        </section>

        {/* ══════════════════════════════════════════════════ 9. FINAL CTA */}
        <section style={{ paddingTop: 72 }}>
          <motion.div initial="hidden" whileInView="visible" viewport={vp} variants={fadeUp}>
            <div
              style={{
                background: `linear-gradient(135deg, ${F.pink} 0%, #f06d98 55%, #f8a5c2 100%)`,
                borderRadius: 26, padding: 'clamp(40px, 6vw, 64px)',
                textAlign: 'center', position: 'relative', overflow: 'hidden',
                boxShadow: '0 20px 48px rgba(232,70,119,.18)',
              }}
            >
              <div style={{ position: 'absolute', top: -80, right: -60, width: 280, height: 280, background: 'radial-gradient(circle,rgba(255,255,255,.2) 0%,transparent 70%)', pointerEvents: 'none' }} />
              <div style={{ position: 'absolute', bottom: -60, left: -40, width: 200, height: 200, background: 'radial-gradient(circle,rgba(255,255,255,.12) 0%,transparent 70%)', pointerEvents: 'none' }} />

              <div style={{ position: 'relative', zIndex: 2 }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)', color: '#fff', fontSize: 11, fontWeight: 700, letterSpacing: 1.4, padding: '5px 14px', borderRadius: 999, border: '1px solid rgba(255,255,255,0.3)', marginBottom: 20 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff', display: 'inline-block' }} />
                  FREE FOREVER
                </span>

                <h2 style={{ fontSize: 'clamp(24px, 4.5vw, 38px)', fontWeight: 900, letterSpacing: -1, color: '#fff', margin: '0 0 16px', lineHeight: 1.15 }}>
                  เริ่มต้นฟรีวันนี้<br />
                  <span style={{ color: 'rgba(255,255,255,.85)', fontSize: '0.75em', fontWeight: 700 }}>ไม่ต้องบัตรเครดิต ไม่มีค่าสมัคร</span>
                </h2>
                <p style={{ fontSize: 15, color: 'rgba(255,255,255,.85)', margin: '0 0 32px', maxWidth: 440, marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.7 }}>
                  สร้าง Pet ID ฟรี เพิ่มสัตว์เลี้ยงได้ไม่จำกัด บันทึกประวัติสุขภาพ และแชร์โปรไฟล์ QR ได้ทันที
                </p>

                <div className="hp-hero-btns" style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                  <Link
                    href="/register"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#fff', color: F.pink, padding: '14px 28px', borderRadius: 14, fontWeight: 800, fontSize: 15, textDecoration: 'none', boxShadow: '0 8px 24px rgba(0,0,0,.12)', fontFamily: 'inherit', transition: 'transform .15s, box-shadow .15s' }}
                  >
                    สร้าง Pet ID ฟรี <ArrowRightIcon />
                  </Link>
                  <Link
                    href="/partner"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', color: '#fff', padding: '14px 28px', borderRadius: 14, fontWeight: 700, fontSize: 15, textDecoration: 'none', border: '1.5px solid rgba(255,255,255,0.4)', fontFamily: 'inherit' }}
                  >
                    สำหรับฟาร์มและบรีดเดอร์
                  </Link>
                </div>

                <p style={{ fontSize: 12, color: 'rgba(255,255,255,.6)', marginTop: 24, marginBottom: 0 }}>
                  มีบัญชีแล้ว?{' '}
                  <Link href="/login" style={{ color: 'rgba(255,255,255,.85)', fontWeight: 700, textDecoration: 'underline' }}>
                    เข้าสู่ระบบ
                  </Link>
                </p>
              </div>
            </div>
          </motion.div>
        </section>

      </div>
    </MotionConfig>
  );
}
