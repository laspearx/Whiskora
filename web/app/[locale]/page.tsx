"use client";

import { useEffect } from "react";
import NextLink from "next/link";
import { useRouter } from "@/i18n/navigation";

type IconName =
  | "id"
  | "health"
  | "qr"
  | "shield"
  | "tree"
  | "doc"
  | "transfer"
  | "clinic"
  | "shop"
  | "owner"
  | "breeder"
  | "care"
  | "search";

const ICON_SRC: Record<IconName, string> = {
  id:       '/icons/icon-pet-id-card.png',
  health:   '/icons/icon-health.png',
  qr:       '/icons/icon-qr-code.png',
  shield:   '/icons/icon-verified-badge.png',
  tree:     '/icons/icon-breeding.png',
  doc:      '/icons/icon-documents.png',
  transfer: '/icons/icon-pet-transfer.png',
  clinic:   '/icons/icon-vet-care.png',
  shop:     '/icons/icon-shop.png',
  owner:    '/icons/icon-my-pets.png',
  breeder:  '/icons/icon-farm.png',
  care:     '/icons/icon-vet-care.png',
  search:   '/icons/icon-scan.png',
};

function IconImg({ name, size = 48 }: { name: IconName; size?: number }) {
  return <img src={ICON_SRC[name]} alt="" width={size} height={size} style={{ objectFit: 'contain', display: 'block' }} aria-hidden="true" />;
}

const siteUrl = "https://whiskora.pet";

// ─── ช่วยอะไร: ปัญหาจริงที่ Whiskora แก้ ─────────────────────────────────
const problemCards = [
  {
    title: "ประวัติสุขภาพอยู่หลายที่",
    desc: "วัคซีน น้ำหนัก ใบนัด และรูปเอกสารกระจายอยู่ในสมุด แชต และอัลบั้มรูป",
    icon: "health",
  },
  {
    title: "ต้องเล่าข้อมูลเดิมซ้ำ",
    desc: "ทุกครั้งที่ฝากเลี้ยง พาไปหาหมอ หรือเปลี่ยนผู้ดูแล ต้องบอกข้อมูลชุดเดิมใหม่",
    icon: "clinic",
  },
  {
    title: "ดูข้อมูลฟาร์มยาก",
    desc: "ผู้รับเลี้ยงอยากเห็นข้อมูลฟาร์ม พ่อแม่พันธุ์ และสุขภาพก่อนตัดสินใจ แต่โพสต์ขายทั่วไปไม่พอ",
    icon: "breeder",
  },
  {
    title: "ย้ายบ้านแล้วข้อมูลหาย",
    desc: "เมื่อสัตว์มีเจ้าของใหม่ ประวัติที่ฟาร์มหรือเจ้าของเดิมเก็บไว้มักไม่ถูกส่งต่อ",
    icon: "transfer",
  },
] satisfies Array<{ title: string; desc: string; icon: IconName }>;

// ─── ประโยชน์สำหรับเจ้าของ (ทุกข้อเปิดใช้งานแล้ว) ──────────────────────────
const ownerFeatures = [
  {
    title: "บัตร Pet ID พร้อม QR",
    desc: "สร้างบัตรประจำตัวดิจิทัล ดาวน์โหลดเก็บในโทรศัพท์หรือพิมพ์ใช้งานได้",
    icon: "id",
  },
  {
    title: "หน้าโปรไฟล์เมื่อสแกน QR",
    desc: "คนที่สแกนเห็นโปรไฟล์ได้โดยไม่ต้องสมัคร และเห็นเฉพาะข้อมูลที่เปิดไว้",
    icon: "qr",
  },
  {
    title: "สมุดสุขภาพ วัคซีน และน้ำหนัก",
    desc: "บันทึกวัคซีน นัดหมาย น้ำหนัก และกิจกรรมดูแลไว้ในโปรไฟล์เดียว",
    icon: "health",
  },
  {
    title: "เอกสารสำคัญ",
    desc: "เก็บรูปสมุดวัคซีน ใบรับรอง และเอกสารอื่นของสัตว์เลี้ยงแต่ละตัว",
    icon: "doc",
  },
] satisfies Array<{ title: string; desc: string; icon: IconName }>;

// ─── ประโยชน์สำหรับฟาร์ม (ทุกข้อเปิดใช้งานแล้ว) ─────────────────────────────
const farmFeatures = [
  {
    title: "โปรไฟล์ฟาร์มและสัตว์พร้อมย้ายบ้าน",
    desc: "แสดงข้อมูลฟาร์มและรายการที่พร้อมย้ายบ้านหรือเปิดจองในหน้ารวมฟาร์ม",
    icon: "breeder",
  },
  {
    title: "ครอก พ่อแม่พันธุ์ และสายเลือด",
    desc: "บันทึกการผสม การคลอด น้ำหนักลูก และผังสายเลือดที่เชื่อมกันอัตโนมัติ",
    icon: "tree",
  },
  {
    title: "รับจองและโอนเจ้าของ",
    desc: "ผู้สนใจส่งคำขอจองได้ และโอนโปรไฟล์ให้เจ้าของใหม่กดยอมรับเอง",
    icon: "transfer",
  },
  {
    title: "ยืนยันตัวตนฟาร์ม",
    desc: "ส่งเอกสารให้ทีมงานตรวจ เมื่อผ่านแล้วฟาร์มจะได้ตรา \"ฟาร์มยืนยันตัวตนแล้ว\"",
    icon: "shield",
  },
] satisfies Array<{ title: string; desc: string; icon: IconName }>;

// ─── กำลังพัฒนา: แยกจากฟีเจอร์ที่ใช้ได้แล้วให้ชัด ───────────────────────────
const roadmapItems = [
  "จองคลินิกและบริการผ่าน Whiskora",
  "คอมมูนิตี้คนรักสัตว์",
  "บทความความรู้ฉบับเต็ม",
];

const seoFaqs = [
  {
    question: "Whiskora คืออะไร?",
    answer:
      "Whiskora คือระบบเก็บข้อมูลสัตว์เลี้ยงที่รวม Pet ID, QR Profile, ประวัติสุขภาพ เอกสาร และข้อมูลฟาร์มไว้ในที่เดียว เพื่อให้ดูแลและแชร์ข้อมูลได้ง่ายขึ้น",
  },
  {
    question: "เริ่มใช้งาน Whiskora ต้องเสียค่าใช้จ่ายไหม?",
    answer:
      "เจ้าของสัตว์เลี้ยงสร้างโปรไฟล์และบัตร Pet ID ได้ฟรี ส่วนฟาร์ม ร้านค้า และบริการเปิดใช้ได้ฟรีในช่วง Genesis Program",
  },
  {
    question: "คนที่สแกน QR จะเห็นข้อมูลอะไรบ้าง?",
    answer:
      "เห็นหน้าโปรไฟล์สาธารณะของสัตว์เลี้ยง ข้อมูลสุขภาพ สายเลือด และเอกสารจะแสดงตามระดับสิทธิ์ที่เจ้าของหรือฟาร์มตั้งไว้ และไม่แสดงที่อยู่ของเจ้าของ",
  },
  {
    question: "ตรา \"ฟาร์มยืนยันตัวตนแล้ว\" หมายถึงอะไร?",
    answer:
      "หมายถึงทีม Whiskora ตรวจเอกสารยืนยันตัวตนของเจ้าของฟาร์มแล้ว ตรานี้ไม่ได้รับรองสุขภาพหรือสายเลือดของสัตว์แต่ละตัว ฟาร์มที่ยังไม่ผ่านจะแสดงว่ายังไม่ยืนยันตัวตน",
  },
  {
    question: "QR ติดตามตำแหน่งสัตว์เลี้ยงได้ไหม?",
    answer:
      "ไม่ได้ QR เป็นลิงก์ไปหน้าโปรไฟล์ ไม่ใช่อุปกรณ์ GPS ผู้ที่พบสัตว์เลี้ยงต้องสแกนเองจึงจะเห็นข้อมูล",
  },
  {
    question: "คลินิกหรือร้านบริการใช้ Whiskora ได้แล้วหรือยัง?",
    answer:
      "ผู้ให้บริการลงทะเบียนหน้าร้านได้แล้ว ส่วนการจองบริการผ่านเว็บยังอยู่ระหว่างพัฒนา ระหว่างนี้เจ้าของแชร์ข้อมูลสัตว์เลี้ยงให้คลินิกดูผ่าน QR ได้",
  },
];

const homeJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${siteUrl}/#organization`,
      name: "Whiskora",
      url: siteUrl,
      logo: `${siteUrl}/logo.png`,
      description:
        "แพลตฟอร์ม pet-tech สำหรับ Pet ID, QR Profile, ประวัติสุขภาพ, เพ็ดดิกรี, เอกสารสำคัญ, ฟาร์มสัตว์เลี้ยง และการแชร์ข้อมูลสัตว์เลี้ยงที่เชื่อถือได้",
    },
    {
      "@type": "WebSite",
      "@id": `${siteUrl}/#website`,
      url: siteUrl,
      name: "Whiskora",
      inLanguage: ["th-TH", "en"],
      publisher: { "@id": `${siteUrl}/#organization` },
      potentialAction: {
        "@type": "SearchAction",
        target: `${siteUrl}/th/search?q={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@type": "WebPage",
      "@id": `${siteUrl}/th#webpage`,
      url: `${siteUrl}/th`,
      name: "Whiskora | Trusted Pet Identity, Health Records และ QR Profile",
      description:
        "Whiskora คือแพลตฟอร์มสัตว์เลี้ยงที่เชื่อม Pet ID, QR Profile, ประวัติสุขภาพ, ฟาร์ม, เพ็ดดิกรี, เอกสาร และการแชร์ข้อมูลสัตว์เลี้ยงไว้ในระบบเดียว",
      isPartOf: { "@id": `${siteUrl}/#website` },
      about: { "@id": `${siteUrl}/#organization` },
      primaryImageOfPage: {
        "@type": "ImageObject",
        url: `${siteUrl}/home/hero-visual-desktop-v1.png`,
      },
    },
    {
      "@type": "WebApplication",
      "@id": `${siteUrl}/th#webapp`,
      name: "Whiskora",
      url: `${siteUrl}/th`,
      applicationCategory: "LifestyleApplication",
      operatingSystem: "Web",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "THB",
      },
      featureList: [...ownerFeatures, ...farmFeatures].map((feature) => feature.title),
    },
    {
      "@type": "FAQPage",
      "@id": `${siteUrl}/th#faq`,
      mainEntity: seoFaqs.map((faq) => ({
        "@type": "Question",
        name: faq.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: faq.answer,
        },
      })),
    },
    {
      "@type": "BreadcrumbList",
      "@id": `${siteUrl}/th#breadcrumb`,
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Whiskora",
          item: `${siteUrl}/th`,
        },
      ],
    },
  ],
};

function PawIcon({ color = "#e84677" }: { color?: string }) {
  if (color === "#fff") {
    return <img src="/icons/icon-paw-circle-white.png" aria-hidden="true" alt="" width={25} height={25} style={{ objectFit: 'contain', flexShrink: 0 }} />;
  }
  return <img src="/paw.png" aria-hidden="true" alt="" width={25} height={25} style={{ objectFit: 'contain', flexShrink: 0 }} />;
}


function SectionHeader({
  eyebrow,
  title,
  highlight,
  copy,
  id,
}: {
  eyebrow: string;
  title: string;
  highlight?: string;
  copy: string;
  id?: string;
}) {
  return (
    <div className="section-header" data-reveal>
      <div className="eyebrow">
        <PawIcon />
        {eyebrow}
      </div>
      <h2 className="section-title" id={id}>
        {title}
        {highlight && <span>{highlight}</span>}
      </h2>
      <p className="section-copy">{copy}</p>
    </div>
  );
}

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const revealItems = Array.from(document.querySelectorAll<HTMLElement>(".home-page [data-reveal]"));
    if (!revealItems.length) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion || !("IntersectionObserver" in window)) {
      revealItems.forEach((item) => item.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      {
        threshold: 0.14,
        rootMargin: "0px 0px -10% 0px",
      }
    );

    revealItems.forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <style>{`
        .home-page {
          --ink: #1f1a1c;
          --ink-soft: #4a3f44;
          --muted: #8e7e84;
          --line: #f3dde3;
          --pink: #e84677;
          --pink-strong: #c4325f;
          --pink-soft: #fde2ea;
          --blue: #407fb7;
          --green: #5c8f6b;
          --gold: #d9922f;
          color: var(--ink);
          background:
            linear-gradient(180deg, #fff 0%, #fff8fb 28%, #fff 58%, #fff7fb 100%),
            #fff;
          overflow-x: clip;
        }

        .home-page button {
          font: inherit;
        }

        .home-page [data-reveal] {
          opacity: 1;
          transform: none;
        }

        @media (prefers-reduced-motion: no-preference) {
          .home-page [data-reveal] {
            opacity: 0;
            transform: translate3d(0, 26px, 0);
            transition:
              opacity .68s cubic-bezier(.22, 1, .36, 1),
              transform .68s cubic-bezier(.22, 1, .36, 1);
            will-change: opacity, transform;
          }

          .home-page [data-reveal="panel"] {
            transform: translate3d(0, 30px, 0) scale(.985);
          }

          .home-page [data-reveal].is-visible {
            opacity: 1;
            transform: translate3d(0, 0, 0) scale(1);
          }

          .trust-item:nth-child(2),
          .problem-card:nth-child(2),
          .pillar-card:nth-child(2),
          .audience-card:nth-child(2),
          .feature-card:nth-child(2),
          .faq-card:nth-child(2),
          .farm-proof-card:nth-child(2),
          .knowledge-card:nth-child(2),
          .lifecycle-step:nth-child(2),
          .trust-layer-card:nth-child(2) {
            transition-delay: .06s;
          }

          .trust-item:nth-child(3),
          .problem-card:nth-child(3),
          .pillar-card:nth-child(3),
          .audience-card:nth-child(3),
          .feature-card:nth-child(3),
          .faq-card:nth-child(3),
          .farm-proof-card:nth-child(3),
          .knowledge-card:nth-child(3),
          .lifecycle-step:nth-child(3),
          .trust-layer-card:nth-child(3) {
            transition-delay: .12s;
          }

          .trust-item:nth-child(4),
          .problem-card:nth-child(4),
          .pillar-card:nth-child(4),
          .audience-card:nth-child(4),
          .feature-card:nth-child(4),
          .faq-card:nth-child(4),
          .lifecycle-step:nth-child(4),
          .trust-layer-card:nth-child(4) {
            transition-delay: .18s;
          }

          .pillar-card:nth-child(5),
          .feature-card:nth-child(5),
          .lifecycle-step:nth-child(5),
          .trust-layer-card:nth-child(5) {
            transition-delay: .24s;
          }

          .pillar-card:nth-child(6),
          .feature-card:nth-child(6),
          .lifecycle-step:nth-child(6) {
            transition-delay: .3s;
          }
        }

        .section-inner,
        .hero-inner {
          width: min(100% - 56px, 1320px);
          margin: 0 auto;
        }

        .hero-section {
          width: 100%;
          min-height: 760px;
          position: relative;
          isolation: isolate;
          background:
            linear-gradient(90deg, rgba(255,255,255,.99) 0%, rgba(255,255,255,.96) 36%, rgba(255,255,255,.55) 62%, rgba(255,248,252,.1) 100%),
            url("/home/hero-visual-desktop-v1.png") center bottom / 100% auto no-repeat,
            #fffafc;
        }

        .hero-inner {
          min-height: 760px;
          display: flex;
          align-items: center;
          padding: 56px 0 110px;
        }

        .hero-copy-block {
          width: min(690px, 100%);
        }

        .eyebrow {
          width: max-content;
          max-width: 100%;
          display: inline-flex;
          align-items: center;
          gap: 9px;
          border-radius: 999px;
          background: rgba(255,255,255,.9);
          color: var(--pink);
          padding: 8px 16px;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: .04em;
          box-shadow: 0 12px 26px rgba(239,62,123,.1);
        }

        .hero-title {
          margin: 20px 0 16px;
          max-width: 720px;
          font-size: clamp(46px, 5.2vw, 76px);
          line-height: 1.1;
          letter-spacing: 0;
          font-weight: 700;
          color: var(--ink);
        }

        .hero-title span,
        .section-title span {
          display: block;
          color: var(--pink);
        }

        .hero-copy,
        .section-copy {
          color: var(--ink-soft);
          font-size: 17px;
          line-height: 1.76;
          margin: 0;
        }

        .hero-copy {
          max-width: 610px;
        }

        .hero-actions,
        .cta-actions {
          display: flex;
          gap: 14px;
          flex-wrap: wrap;
          margin-top: 28px;
        }

        .primary-btn,
        .secondary-btn {
          min-height: 54px;
          border-radius: 16px;
          padding: 0 26px;
          border: 0;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: transform .18s ease, box-shadow .18s ease, background .18s ease;
          white-space: nowrap;
        }

        .primary-btn {
          color: #fff;
          background: var(--pink);
          box-shadow: 0 18px 36px rgba(239, 62, 123, .24);
        }

        .secondary-btn {
          color: var(--pink);
          background: rgba(255, 255, 255, .92);
          border: 1px solid rgba(239, 62, 123, .26);
          box-shadow: 0 12px 28px rgba(239, 62, 123, .08);
        }

        .primary-btn:hover,
        .secondary-btn:hover {
          transform: translateY(-2px);
        }

        .hero-product-note {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 10px;
          margin-top: 28px;
          max-width: 620px;
        }

        .hero-product-note div {
          min-height: 58px;
          border-radius: 16px;
          border: 1px solid rgba(239,62,123,.16);
          background: rgba(255,255,255,.84);
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          color: #4c435b;
          font-size: 12px;
          font-weight: 600;
          backdrop-filter: blur(8px);
        }

        .verified-seal {
          position: absolute;
          right: clamp(18px, 7vw, 110px);
          bottom: 42px;
          width: 112px;
          height: auto;
          filter: drop-shadow(0 18px 24px rgba(239,62,123,.2));
          transform: rotate(-9deg);
        }

        .trust-strip {
          width: min(100% - 56px, 1320px);
          margin: -46px auto 0;
          position: relative;
          z-index: 4;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          border-radius: 20px;
          border: 1px solid var(--line);
          background: rgba(255,255,255,.96);
          box-shadow: 0 20px 42px rgba(59,35,70,.1);
          overflow: hidden;
        }

        .trust-item {
          min-height: 128px;
          padding: 22px;
          border-right: 1px solid #f3dde3;
          display: grid;
          align-content: center;
          gap: 8px;
        }

        .trust-item:last-child {
          border-right: 0;
        }

        .trust-item h3 {
          margin: 0;
          color: var(--ink);
          font-size: 16px;
          font-weight: 700;
          line-height: 1.35;
        }

        .trust-item p {
          margin: 0;
          color: var(--muted);
          font-size: 13px;
          line-height: 1.58;
        }

        .content-section {
          padding: 92px 0 0;
        }

        .section-header {
          display: grid;
          gap: 14px;
          max-width: 850px;
        }

        .section-header.centered {
          margin: 0 auto;
          text-align: center;
          justify-items: center;
        }

        .section-title {
          margin: 0;
          color: var(--ink);
          font-size: clamp(32px, 3.4vw, 46px);
          line-height: 1.22;
          letter-spacing: 0;
          font-weight: 700;
        }

        .problem-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-top: 28px;
        }

        .problem-card,
        .pillar-card,
        .audience-card,
        .feature-card,
        .faq-card,
        .trust-layer-card {
          border: 1px solid var(--line);
          background: rgba(255,255,255,.95);
          box-shadow: 0 16px 34px rgba(59,35,70,.06);
        }

        .problem-card {
          min-height: 250px;
          border-radius: 18px;
          padding: 24px;
          display: grid;
          align-content: start;
          gap: 14px;
        }

        .icon-box {
          width: 52px;
          height: 52px;
          display: grid;
          place-items: center;
        }

        .problem-card h3,
        .pillar-card h3,
        .audience-card h3,
        .feature-card h3,
        .faq-card h3 {
          margin: 0;
          color: var(--ink);
          font-size: 18px;
          font-weight: 700;
          line-height: 1.45;
        }

        .problem-card p,
        .pillar-card p,
        .audience-card p,
        .feature-card p,
        .faq-card p {
          margin: 0;
          color: var(--muted);
          font-size: 14px;
          line-height: 1.72;
        }

        .platform-band {
          margin-top: 92px;
          padding: 88px 0;
          background:
            linear-gradient(90deg, rgba(255,255,255,.98) 0%, rgba(255,255,255,.85) 42%, rgba(255,255,255,.22) 76%),
            url("/home/farm-promo-visual-desktop-v1.png") center bottom / 100% auto no-repeat,
            #fffafc;
        }

        .platform-copy {
          width: min(620px, 100%);
        }

        .platform-proof {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
          margin: 26px 0 30px;
        }

        .platform-proof div {
          min-height: 58px;
          border-radius: 15px;
          border: 1px solid rgba(239,62,123,.18);
          background: rgba(255,255,255,.82);
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 14px;
          color: #43384f;
          font-size: 13px;
          font-weight: 600;
          backdrop-filter: blur(8px);
        }

        .farm-directory-section {
          margin-top: 92px;
          padding: 0;
        }

        .farm-story-panel {
          position: relative;
          min-height: 560px;
          border-radius: 30px;
          overflow: hidden;
          border: 1px solid var(--line);
          background:
            linear-gradient(90deg, rgba(255,255,255,.98) 0%, rgba(255,255,255,.92) 42%, rgba(255,255,255,.26) 72%, rgba(255,255,255,.04) 100%),
            url("/home/farm-promo-visual-desktop-v1.png") center bottom / 100% auto no-repeat,
            #fffafc;
          box-shadow: 0 28px 68px rgba(59,35,70,.1);
        }

        .farm-story-copy {
          width: min(610px, 100%);
          padding: clamp(34px, 5vw, 64px);
          position: relative;
          z-index: 2;
        }

        .farm-story-proof {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 14px;
          margin-top: 28px;
        }

        .farm-proof-card {
          min-height: 184px;
          border-radius: 18px;
          border: 1px solid rgba(239,62,123,.16);
          background: rgba(255,255,255,.9);
          box-shadow: 0 16px 36px rgba(59,35,70,.08);
          padding: 22px;
          display: grid;
          align-content: start;
          gap: 12px;
          backdrop-filter: blur(10px);
        }

        .farm-proof-card h3 {
          margin: 0;
          color: var(--ink);
          font-size: 17px;
          font-weight: 700;
          line-height: 1.42;
        }

        .farm-proof-card p {
          margin: 0;
          color: var(--muted);
          font-size: 13px;
          line-height: 1.68;
        }

        .farm-story-actions {
          display: flex;
          gap: 14px;
          flex-wrap: wrap;
          margin-top: 28px;
        }

        .pillar-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin-top: 28px;
        }

        .pillar-card {
          min-height: 250px;
          border-radius: 18px;
          padding: 24px;
          display: grid;
          align-content: start;
          gap: 12px;
        }

        .pillar-benefit {
          color: var(--pink);
          font-size: 13px;
          font-weight: 700;
          line-height: 1.45;
        }

        .lifecycle-section {
          margin-top: 72px;
          border-radius: 24px;
          border: 1px solid var(--line);
          background: #fff;
          box-shadow: 0 18px 38px rgba(59,35,70,.06);
          overflow: hidden;
        }

        .lifecycle-header {
          padding: 34px 34px 0;
        }

        .lifecycle-grid {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          border-top: 1px solid #f3dde3;
          margin-top: 30px;
        }

        .lifecycle-step {
          min-height: 210px;
          padding: 24px 18px;
          border-right: 1px solid #f3dde3;
          display: grid;
          align-content: start;
          gap: 12px;
        }

        .lifecycle-step:last-child {
          border-right: 0;
        }

        .step-index {
          width: 30px;
          height: 30px;
          border-radius: 999px;
          display: grid;
          place-items: center;
          background: #fde2ea;
          color: var(--pink);
          font-size: 13px;
          font-weight: 700;
        }

        .lifecycle-step h3 {
          margin: 0;
          font-size: 16px;
          line-height: 1.36;
          font-weight: 700;
        }

        .lifecycle-step p {
          margin: 0;
          color: var(--muted);
          font-size: 13px;
          line-height: 1.62;
        }

        .audience-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
          margin-top: 28px;
        }

        .audience-card {
          min-height: 248px;
          border-radius: 20px;
          padding: 26px;
          display: grid;
          align-content: start;
          gap: 14px;
        }

        .audience-label {
          color: var(--pink);
          font-size: 12px;
          font-weight: 700;
          letter-spacing: .04em;
          text-transform: uppercase;
        }

        .feature-showcase {
          margin-top: 72px;
          display: grid;
          grid-template-columns: minmax(320px, 420px) 1fr;
          gap: 28px;
          align-items: start;
        }

        .product-preview {
          position: sticky;
          top: 88px;
          border: 1px solid var(--line);
          border-radius: 26px;
          background: linear-gradient(180deg, #fff, #fdf0f3);
          box-shadow: 0 24px 52px rgba(59,35,70,.12);
          padding: 24px;
        }

        .preview-phone {
          max-width: 320px;
          margin: 0 auto;
          border-radius: 38px;
          background: #171321;
          padding: 10px;
          box-shadow: 0 22px 34px rgba(36,28,49,.16);
        }

        .preview-screen {
          min-height: 520px;
          border-radius: 30px;
          background: #fff;
          overflow: hidden;
        }

        .pet-hero-card {
          padding: 30px 18px 22px;
          text-align: center;
          background:
            linear-gradient(180deg, #ffe4ef, #fff);
        }

        .pet-avatar {
          width: 88px;
          height: 88px;
          margin: 0 auto 12px;
          border-radius: 999px;
          border: 6px solid #fff;
          background:
            radial-gradient(circle at 43% 36%, #3c2a24 0 3%, transparent 4%),
            radial-gradient(circle at 59% 36%, #3c2a24 0 3%, transparent 4%),
            radial-gradient(circle at 51% 55%, #f3c89e 0 10%, transparent 11%),
            radial-gradient(circle at 50% 32%, #d4925c 0 31%, transparent 32%),
            #f4d1b1;
          box-shadow: 0 12px 20px rgba(239,62,123,.16);
        }

        .pet-name {
          color: var(--pink);
          font-size: 21px;
          font-weight: 700;
        }

        .pet-sub {
          color: #756b7d;
          font-size: 11px;
          font-weight: 600;
          margin-top: 3px;
        }

        .preview-tabs {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          border-bottom: 1px solid #fde2ea;
        }

        .preview-tabs span {
          min-height: 42px;
          display: grid;
          place-items: center;
          color: #8b7d8e;
          font-size: 10px;
          font-weight: 700;
        }

        .preview-tabs span:first-child {
          color: var(--pink);
          border-bottom: 2px solid var(--pink);
        }

        .preview-list {
          padding: 16px 16px 20px;
        }

        .preview-row {
          min-height: 42px;
          border-bottom: 1px solid #fde2ea;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          color: #5f5368;
          font-size: 12px;
        }

        .preview-row strong {
          color: var(--ink);
          text-align: right;
        }

        .qr-block {
          margin-top: 18px;
          min-height: 92px;
          border-radius: 18px;
          background: #fdf0f3;
          display: grid;
          grid-template-columns: 78px 1fr;
          gap: 12px;
          align-items: center;
          padding: 14px;
        }

        .qr-mark {
          width: 72px;
          height: 72px;
          border-radius: 12px;
          background:
            linear-gradient(90deg, #222 8px, transparent 8px 16px, #222 16px 24px, transparent 24px),
            linear-gradient(#222 8px, transparent 8px 16px, #222 16px 24px, transparent 24px),
            #fff;
          background-size: 24px 24px;
          border: 8px solid #fff;
        }

        .qr-block h4 {
          margin: 0;
          color: var(--ink);
          font-size: 13px;
          font-weight: 700;
        }

        .qr-block p {
          margin: 4px 0 0;
          color: var(--muted);
          font-size: 11px;
          line-height: 1.5;
        }

        .feature-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
        }

        .feature-card {
          min-height: 204px;
          border-radius: 18px;
          padding: 24px;
          display: grid;
          align-content: start;
          gap: 13px;
        }

        .trust-section {
          margin-top: 72px;
          border-radius: 24px;
          border: 1px solid var(--line);
          background:
            linear-gradient(90deg, #fdf0f3, #fff);
          box-shadow: 0 18px 38px rgba(59,35,70,.06);
          padding: 36px;
          display: grid;
          grid-template-columns: 240px 1fr;
          gap: 34px;
          align-items: center;
        }

        .seal-image {
          width: min(210px, 100%);
          height: auto;
          margin: 0 auto;
          display: block;
          transform: rotate(-8deg);
          filter: drop-shadow(0 18px 28px rgba(239,62,123,.16));
        }

        .trust-layer-list {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
          margin-top: 24px;
        }

        .trust-layer-card {
          min-height: 64px;
          border-radius: 15px;
          padding: 14px;
          display: flex;
          align-items: center;
          gap: 10px;
          color: #43384f;
          font-size: 13px;
          font-weight: 700;
        }

        .knowledge-preview-section {
          margin-top: 92px;
          padding: 76px 0;
          background: #0b1020;
          color: #fff;
        }

        .knowledge-preview-section .section-header {
          max-width: 760px;
        }

        .knowledge-preview-section .section-title {
          color: #fff;
        }

        .knowledge-preview-section .section-copy {
          color: rgba(255,255,255,.62);
        }

        .knowledge-layout {
          display: grid;
          grid-template-columns: minmax(0, .92fr) minmax(360px, 1fr);
          gap: 26px;
          align-items: stretch;
          margin-top: 34px;
        }

        .knowledge-featured {
          min-height: 430px;
          border-radius: 26px;
          overflow: hidden;
          position: relative;
          border: 1px solid rgba(255,255,255,.1);
          background:
            linear-gradient(180deg, rgba(11,16,32,.08) 0%, rgba(11,16,32,.88) 100%),
            url("/home/hero-visual-desktop-v1.png") right bottom / auto 100% no-repeat,
            #151a2d;
          box-shadow: 0 26px 60px rgba(0,0,0,.24);
        }

        .knowledge-featured-content {
          position: absolute;
          inset: auto 0 0 0;
          padding: 34px;
          max-width: 620px;
        }

        .article-tag {
          width: max-content;
          max-width: 100%;
          display: inline-flex;
          align-items: center;
          min-height: 30px;
          border-radius: 999px;
          padding: 0 12px;
          background: rgba(239,62,123,.16);
          border: 1px solid rgba(239,62,123,.28);
          color: #ff8cb5;
          font-size: 12px;
          font-weight: 700;
        }

        .knowledge-featured h3,
        .knowledge-card h3 {
          margin: 12px 0 0;
          color: #fff;
          font-weight: 700;
          line-height: 1.36;
        }

        .knowledge-featured h3 {
          max-width: 560px;
          font-size: clamp(25px, 2.8vw, 38px);
        }

        .knowledge-featured p,
        .knowledge-card p {
          margin: 12px 0 0;
          color: rgba(255,255,255,.62);
          line-height: 1.72;
        }

        .knowledge-list {
          display: grid;
          gap: 14px;
        }

        .knowledge-card {
          min-height: 132px;
          border-radius: 20px;
          border: 1px solid rgba(255,255,255,.1);
          background: rgba(255,255,255,.045);
          padding: 22px;
          box-shadow: 0 18px 42px rgba(0,0,0,.12);
        }

        .knowledge-card h3 {
          font-size: 18px;
        }

        .knowledge-card p {
          font-size: 13px;
        }

        .faq-section {
          margin-top: 72px;
        }

        .intent-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 22px;
        }

        .intent-chip {
          border-radius: 999px;
          border: 1px solid rgba(239,62,123,.18);
          background: #fdf0f3;
          color: #c4325f;
          font-size: 12px;
          font-weight: 600;
          padding: 9px 13px;
        }

        .faq-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
          margin-top: 24px;
        }

        .faq-card {
          min-height: 168px;
          border-radius: 18px;
          padding: 22px;
        }

        .faq-card h3 {
          font-size: 17px;
        }

        .faq-card p {
          margin-top: 10px;
        }

        .cta-band {
          margin-top: 76px;
          background:
            linear-gradient(135deg, #e84677, #d83269);
          color: #fff;
          padding: 54px 24px 64px;
          text-align: center;
        }

        .cta-band h2 {
          margin: 0;
          font-size: clamp(30px, 4vw, 46px);
          font-weight: 700;
          line-height: 1.28;
        }

        .cta-band p {
          margin: 10px auto 0;
          max-width: 680px;
          font-size: 17px;
          line-height: 1.7;
          font-weight: 500;
        }

        .cta-actions {
          justify-content: center;
        }

        #for-farms .farm-story-actions { margin-top: 24px; }
        .roadmap-box {
          margin-top: 28px;
          border: 1px dashed rgba(239,62,123,.3);
          border-radius: 20px;
          background: rgba(255,255,255,.7);
          padding: 18px 20px;
        }
        .roadmap-title { color: var(--muted); font-size: 13px; font-weight: 700; margin-bottom: 8px; }
        .roadmap-box ul { margin: 0; padding-left: 18px; color: var(--ink-soft); font-size: 14px; line-height: 1.8; }

        @media (max-width: 1120px) {
          .section-inner,
          .hero-inner,
          .trust-strip {
            width: min(100% - 32px, 920px);
          }

          .hero-section {
            min-height: 680px;
            background:
              linear-gradient(90deg, rgba(255,255,255,.99) 0%, rgba(255,255,255,.95) 45%, rgba(255,255,255,.42) 74%),
              url("/home/hero-visual-desktop-v1.png") center bottom / 100% auto no-repeat,
              #fffafc;
          }

          .hero-inner {
            min-height: 680px;
          }

          .hero-title {
            max-width: 620px;
          }

          .trust-strip,
          .problem-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .trust-item:nth-child(2) {
            border-right: 0;
          }

          .trust-item:nth-child(-n + 2) {
            border-bottom: 1px solid #f3dde3;
          }

          .pillar-grid,
          .lifecycle-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .lifecycle-step {
            border-bottom: 1px solid #f3dde3;
          }

          .lifecycle-step:nth-child(2n) {
            border-right: 0;
          }

          .lifecycle-step:nth-last-child(-n + 2) {
            border-bottom: 0;
          }

          .feature-showcase,
          .trust-section,
          .knowledge-layout {
            grid-template-columns: 1fr;
          }

          .product-preview {
            position: relative;
            top: auto;
          }

          .farm-story-panel {
            min-height: 760px;
            background:
              linear-gradient(180deg, rgba(255,255,255,.99) 0%, rgba(255,255,255,.96) 48%, rgba(255,255,255,.42) 75%, rgba(255,255,255,.04) 100%),
              url("/home/farm-promo-visual-desktop-v1.png") center bottom / 100% auto no-repeat,
              #fffafc;
          }

          .farm-story-copy {
            width: 100%;
          }

          .farm-story-proof {
            grid-template-columns: 1fr;
            max-width: 540px;
          }
        }

        @media (max-width: 760px) {
          @media (prefers-reduced-motion: no-preference) {
            .home-page [data-reveal],
            .home-page [data-reveal="panel"] {
              transform: translate3d(0, 18px, 0);
              transition-duration: .54s;
              transition-delay: 0s;
            }

            .home-page [data-reveal].is-visible {
              transform: translate3d(0, 0, 0);
            }
          }

          .hero-section {
            min-height: 800px;
            background:
              linear-gradient(180deg, rgba(255,255,255,1) 0%, rgba(255,255,255,.98) 48%, rgba(255,255,255,.52) 66%, rgba(255,255,255,.08) 84%),
              url("/home/hero-visual-mobile-v1.png") center bottom / 100% auto no-repeat,
              #fffafc;
          }

          .hero-inner,
          .section-inner {
            width: min(100% - 24px, 520px);
          }

          .hero-inner {
            min-height: 800px;
            align-items: flex-start;
            padding: 28px 0 34px;
          }

          .hero-copy-block {
            text-align: center;
            margin: 0 auto;
          }

          .eyebrow {
            margin: 0 auto;
            font-size: 10px;
            padding: 7px 12px;
          }

          .hero-title {
            font-size: clamp(35px, 10vw, 44px);
            line-height: 1.1;
            margin-top: 16px;
          }

          .hero-copy,
          .section-copy {
            font-size: 14px;
            line-height: 1.72;
          }

          .hero-actions,
          .cta-actions {
            justify-content: center;
            gap: 10px;
          }

          .primary-btn,
          .secondary-btn {
            min-height: 50px;
            width: 100%;
            padding: 0 18px;
            font-size: 14px;
          }

          .hero-product-note {
            display: none;
          }

          .home-page .trust-item[data-reveal] {
            opacity: 1;
            transform: none;
          }

          .verified-seal {
            width: 78px;
            right: 18px;
            bottom: 20px;
          }

          .trust-strip {
            width: min(100% - 24px, 520px);
            margin-top: -28px;
            grid-template-columns: 1fr;
            border-radius: 18px;
          }

          .trust-item {
            min-height: auto;
            padding: 18px;
            border-right: 0;
            border-bottom: 1px solid #f3dde3;
          }

          .trust-item:last-child {
            border-bottom: 0;
          }

          .content-section {
            padding-top: 52px;
          }

          .section-header {
            text-align: left;
          }

          .section-title {
            font-size: clamp(29px, 8vw, 36px);
          }

          .problem-grid,
          .pillar-grid,
          .audience-grid,
          .feature-grid,
          .faq-grid,
          .trust-layer-list,
          .platform-proof,
          .farm-story-proof {
            grid-template-columns: 1fr;
          }

          .problem-card,
          .pillar-card,
          .audience-card,
          .feature-card {
            min-height: auto;
            padding: 22px;
          }

          .platform-band {
            margin-top: 54px;
            padding: 46px 0 420px;
            background:
              linear-gradient(180deg, rgba(255,255,255,1) 0%, rgba(255,255,255,.96) 50%, rgba(255,255,255,.3) 75%, rgba(255,255,255,.08) 92%),
              url("/home/farm-promo-visual-mobile-v1.png") center bottom / 100% auto no-repeat,
              #fffafc;
          }

          .lifecycle-section,
          .feature-showcase,
          .trust-section,
          .faq-section,
          .farm-directory-section,
          .knowledge-preview-section {
            margin-top: 54px;
          }

          .farm-story-panel {
            min-height: 780px;
            border-radius: 22px;
            background:
              linear-gradient(180deg, rgba(255,255,255,1) 0%, rgba(255,255,255,.96) 45%, rgba(255,255,255,.38) 72%, rgba(255,255,255,.04) 94%),
              url("/home/farm-promo-visual-mobile-v1.png") center bottom / 100% auto no-repeat,
              #fffafc;
          }

          .farm-story-copy {
            padding: 26px 20px 330px;
          }

          .farm-proof-card {
            min-height: auto;
            padding: 20px;
          }

          .farm-story-actions {
            justify-content: stretch;
          }

          .knowledge-preview-section {
            padding: 52px 0;
          }

          .knowledge-featured {
            min-height: 440px;
            border-radius: 22px;
            background:
              linear-gradient(180deg, rgba(11,16,32,.08) 0%, rgba(11,16,32,.9) 100%),
              url("/home/hero-visual-mobile-v1.png") center bottom / 100% auto no-repeat,
              #151a2d;
          }

          .knowledge-featured-content {
            padding: 24px;
          }

          .knowledge-card {
            min-height: auto;
            padding: 20px;
          }

          .lifecycle-header {
            padding: 24px 22px 0;
          }

          .lifecycle-grid {
            grid-template-columns: 1fr;
          }

          .lifecycle-step,
          .lifecycle-step:nth-child(2n) {
            min-height: auto;
            border-right: 0;
            border-bottom: 1px solid #f3dde3;
            padding: 22px;
          }

          .lifecycle-step:last-child {
            border-bottom: 0;
          }

          .preview-phone {
            max-width: 300px;
          }

          .preview-screen {
            min-height: 500px;
          }

          .trust-section {
            padding: 26px 20px;
            text-align: left;
          }

          .seal-image {
            width: 150px;
          }

          .faq-card {
            min-height: auto;
          }

          .cta-band {
            margin-top: 56px;
            padding: 42px 24px 50px;
          }
        }

        @media (max-width: 420px) {
          .hero-section {
            min-height: 770px;
          }

          .hero-inner {
            min-height: 770px;
          }

          .hero-title {
            font-size: 33px;
          }

          .platform-band {
            padding-bottom: 380px;
          }

          .farm-story-panel {
            min-height: 750px;
          }

          .farm-story-copy {
            padding-bottom: 300px;
          }
        }
      `}</style>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(homeJsonLd).replace(/</g, "\\u003c"),
        }}
      />

      <main className="home-page">
        {/* 1. ช่วยอะไร */}
        <section className="hero-section" aria-label="Whiskora homepage hero">
          <div className="hero-inner">
            <div className="hero-copy-block">
              <div className="eyebrow">
                <PawIcon />
                PET ID · QR PROFILE · HEALTH RECORDS
              </div>
              <h1 className="hero-title">
                เก็บข้อมูลสัตว์เลี้ยงไว้ที่เดียว
                <span>แชร์ได้ด้วย QR</span>
              </h1>
              <p className="hero-copy">
                สร้าง Pet ID ฟรี บันทึกวัคซีน น้ำหนัก และเอกสาร แล้วให้คนที่ดูแลสแกน QR เพื่อดูข้อมูลที่คุณอนุญาต สำหรับทั้งเจ้าของและฟาร์ม
              </p>
              <div className="hero-actions">
                <button className="primary-btn" onClick={() => router.push("/register")}>
                  <PawIcon color="#fff" />
                  สร้าง Pet ID ฟรี
                </button>
                {/* หน้า preview ไม่มี locale prefix (middleware ข้าม) จึงใช้ next/link ตรงๆ แทน router ที่เติม /th */}
                <NextLink className="secondary-btn" href="/pet-id-card-preview" style={{ textDecoration: "none" }}>
                  ดูตัวอย่าง Pet ID
                </NextLink>
              </div>
              <div className="hero-product-note" aria-label="สิ่งที่ใช้ได้ทันที">
                <div><IconImg name="id" size={24} /> บัตร Pet ID ฟรี</div>
                <div><IconImg name="qr" size={24} /> โปรไฟล์ QR</div>
                <div><IconImg name="health" size={24} /> สมุดสุขภาพ</div>
              </div>
            </div>
          </div>
        </section>

        <section className="content-section" id="real-problems">
          <div className="section-inner">
            <SectionHeader
              eyebrow="WHY WHISKORA"
              title="ข้อมูลสัตว์เลี้ยงไม่ควรหายไป"
              highlight="ระหว่างสมุด แชต และความจำ"
              copy="Whiskora รวมข้อมูลที่ต้องใช้บ่อยไว้กับสัตว์เลี้ยงแต่ละตัว เปิดดูและส่งต่อได้ในจังหวะที่ต้องใช้"
            />
            <div className="problem-grid">
              {problemCards.map((problem) => (
                <article className="problem-card" key={problem.title} data-reveal>
                  <div className="icon-box">
                    <IconImg name={problem.icon} />
                  </div>
                  <h3>{problem.title}</h3>
                  <p>{problem.desc}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* 2. ตัวอย่างระบบ */}
        <section className="section-inner feature-showcase" id="product-preview" aria-labelledby="product-preview-title">
          <div className="product-preview" aria-label="ตัวอย่างหน้าโปรไฟล์ (ข้อมูลสาธิต)" data-reveal="panel">
            <div className="preview-phone">
              <div className="preview-screen">
                <div className="pet-hero-card">
                  <div className="pet-avatar" />
                  <div className="pet-name">LUNA</div>
                  <div className="pet-sub">Scottish Fold · ข้อมูลสาธิต</div>
                </div>
                <div className="preview-tabs">
                  <span>Profile</span>
                  <span>Health</span>
                  <span>Pedigree</span>
                  <span>Docs</span>
                </div>
                <div className="preview-list">
                  {[
                    ["วันเกิด", "10 มี.ค. 2567"],
                    ["สายพันธุ์", "Scottish Fold"],
                    ["วัคซีนล่าสุด", "บันทึกแล้ว"],
                    ["ติดต่อเจ้าของ", "ตามที่เจ้าของเลือก"],
                  ].map(([label, value]) => (
                    <div className="preview-row" key={label}>
                      <span>{label}</span>
                      <strong>{value}</strong>
                    </div>
                  ))}
                  <div className="qr-block">
                    <div className="qr-mark" />
                    <div>
                      <h4>QR Public Profile</h4>
                      <p>สแกนแล้วเห็นเฉพาะข้อมูลที่เจ้าของเปิดไว้</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <SectionHeader
              id="product-preview-title"
              eyebrow="SEE IT IN ACTION"
              title="ดูหน้าตาจริงก่อนสมัคร"
              highlight="บัตร Pet ID และหน้าโปรไฟล์ QR"
              copy="ลองดูบัตรตัวอย่าง เลือกธีม และดูว่าคนที่สแกน QR จะเห็นอะไร โดยใช้ข้อมูลสาธิตทั้งหมด ไม่ต้องเข้าสู่ระบบ"
            />
            <div className="farm-story-actions">
              <NextLink className="primary-btn" href="/pet-id-card-preview" style={{ textDecoration: "none" }}>
                ดูตัวอย่าง Pet ID
              </NextLink>
              <button className="secondary-btn" onClick={() => router.push("/register")}>
                สร้างของจริงฟรี
              </button>
            </div>
          </div>
        </section>

        {/* 3. ประโยชน์สำหรับเจ้าของ */}
        <section className="content-section" id="for-owners">
          <div className="section-inner">
            <SectionHeader
              eyebrow="FOR PET OWNERS"
              title="สำหรับเจ้าของสัตว์เลี้ยง"
              highlight="ใช้ได้แล้ววันนี้"
              copy="เริ่มจากโปรไฟล์หนึ่งตัว แล้วค่อยเติมข้อมูลสุขภาพและเอกสารเมื่อสะดวก"
            />
            <div className="audience-grid">
              {ownerFeatures.map((feature) => (
                <article className="audience-card" key={feature.title} data-reveal>
                  <div className="icon-box">
                    <IconImg name={feature.icon} />
                  </div>
                  <div className="audience-label">พร้อมใช้งาน</div>
                  <h3>{feature.title}</h3>
                  <p>{feature.desc}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* 4. ประโยชน์สำหรับฟาร์ม */}
        <section className="content-section" id="for-farms">
          <div className="section-inner">
            <SectionHeader
              eyebrow="FOR BREEDERS & FARMS"
              title="สำหรับฟาร์มและผู้เพาะพันธุ์"
              highlight="ข้อมูลที่ผู้รับเลี้ยงตรวจดูได้"
              copy="ฟาร์มที่มีตรา “ฟาร์มยืนยันตัวตนแล้ว” ผ่านการตรวจเอกสารยืนยันตัวตนจากทีมงาน ส่วนฟาร์มที่ยังไม่ผ่านจะแสดงสถานะให้เห็นชัดทุกหน้า"
            />
            <div className="audience-grid">
              {farmFeatures.map((feature) => (
                <article className="audience-card" key={feature.title} data-reveal>
                  <div className="icon-box">
                    <IconImg name={feature.icon} />
                  </div>
                  <div className="audience-label">พร้อมใช้งาน</div>
                  <h3>{feature.title}</h3>
                  <p>{feature.desc}</p>
                </article>
              ))}
            </div>
            <div className="farm-story-actions">
              <button className="primary-btn" onClick={() => router.push("/farm-hub")}>
                ดูฟาร์มในระบบ
              </button>
              <button className="secondary-btn" onClick={() => router.push("/partner/register-farm")}>
                สมัครฟาร์มกับ Whiskora
              </button>
            </div>
            <div className="roadmap-box" data-reveal>
              <div className="roadmap-title">กำลังพัฒนา (ยังไม่เปิดใช้งาน)</div>
              <ul>
                {roadmapItems.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </div>
          </div>
        </section>

        <section className="section-inner faq-section" id="faq" aria-labelledby="whiskora-faq-title">
          <SectionHeader
            id="whiskora-faq-title"
            eyebrow="FAQ"
            title="คำถามที่พบบ่อย"
            copy="คำตอบสั้นๆ ก่อนเริ่มใช้งาน หากมีคำถามเพิ่มเติม ติดต่อทีมงานได้จากหน้าติดต่อ"
          />
          <div className="faq-grid">
            {seoFaqs.map((faq) => (
              <article className="faq-card" key={faq.question} data-reveal>
                <h3>{faq.question}</h3>
                <p>{faq.answer}</p>
              </article>
            ))}
          </div>
        </section>

        {/* 5. เริ่มใช้งาน */}
        <section className="cta-band" aria-label="Start using Whiskora" data-reveal="panel">
          <div className="section-inner">
            <h2>เริ่มต้นจากโปรไฟล์สัตว์เลี้ยงหนึ่งตัว</h2>
            <p>
              สร้าง Pet ID ฟรี แล้วค่อย ๆ เติมข้อมูลสุขภาพและเอกสาร เมื่อพร้อมก็แชร์ QR ให้คนที่ดูแลสัตว์เลี้ยงของคุณ
            </p>
            <div className="cta-actions">
              <button className="secondary-btn" onClick={() => router.push("/register")}>
                <PawIcon />
                สร้าง Pet ID ฟรี
              </button>
              <NextLink className="secondary-btn" href="/pet-id-card-preview" style={{ textDecoration: "none" }}>
                ดูตัวอย่าง Pet ID
              </NextLink>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
