"use client";

import Image from "next/image";
import { useEffect } from "react";
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

const trustStatements = [
  {
    title: "Profile-first data",
    desc: "ข้อมูลสำคัญผูกกับสัตว์เลี้ยงแต่ละตัว ไม่กระจัดกระจายตามแชตหรือรูปถ่าย",
  },
  {
    title: "Shareable by QR",
    desc: "แชร์ข้อมูลที่จำเป็นให้ผู้ดูแล ฟาร์ม หรือบริการสัตว์เลี้ยงเข้าถึงได้เร็วขึ้น",
  },
  {
    title: "Verification-ready",
    desc: "รองรับข้อมูลฟาร์ม เพ็ดดิกรี เอกสาร และความโปร่งใสก่อนรับเลี้ยงหรือซื้อขาย",
  },
  {
    title: "Care continuity",
    desc: "ช่วยให้ประวัติสุขภาพและการดูแลต่อเนื่อง ไม่หายไประหว่างเจ้าของหรือผู้ให้บริการ",
  },
];

const problemCards = [
  {
    title: "ประวัติสุขภาพอยู่หลายที่",
    desc: "วัคซีน ถ่ายพยาธิ ใบนัด และรูปเอกสารมักกระจายอยู่ในสมุด แชต อัลบั้มรูป หรือความจำของเจ้าของ",
    icon: "health",
  },
  {
    title: "ข้อมูลสำคัญถูกถามซ้ำ",
    desc: "คลินิก โรงแรม อาบน้ำตัดขน และผู้ดูแลต้องถามข้อมูลเดิมซ้ำทุกครั้งที่สัตว์เลี้ยงเปลี่ยนมือ",
    icon: "clinic",
  },
  {
    title: "ความน่าเชื่อถือของฟาร์มดูยาก",
    desc: "ผู้ซื้ออยากเห็นข้อมูลฟาร์ม สายเลือด สุขภาพ และความโปร่งใสก่อนตัดสินใจ แต่โพสต์ทั่วไปไม่พอ",
    icon: "breeder",
  },
  {
    title: "การส่งต่อเจ้าของขาดบริบท",
    desc: "เมื่อมีการรับเลี้ยง ซื้อขาย หรือฝากดูแล รายละเอียดสำคัญมักไม่ถูกส่งต่อครบถ้วน",
    icon: "transfer",
  },
] satisfies Array<{ title: string; desc: string; icon: IconName }>;

const productPillars = [
  {
    title: "Digital Pet Identity",
    benefit: "ตัวตนดิจิทัลของสัตว์เลี้ยงแต่ละตัว",
    desc: "สร้างโปรไฟล์และ Pet ID สำหรับเก็บข้อมูลพื้นฐาน รูปภาพ เจ้าของ และรายละเอียดที่จำเป็น",
    icon: "id",
  },
  {
    title: "Health Records",
    benefit: "สมุดสุขภาพที่ค้นหาและอัปเดตได้",
    desc: "เก็บประวัติวัคซีน ถ่ายพยาธิ การรักษา นัดหมาย และหมายเหตุสุขภาพไว้ในโปรไฟล์เดียว",
    icon: "health",
  },
  {
    title: "QR Public Profile",
    benefit: "แชร์ข้อมูลที่จำเป็นได้เร็ว",
    desc: "ใช้ QR Code เพื่อให้ผู้เกี่ยวข้องเข้าถึงหน้าโปรไฟล์สาธารณะตามข้อมูลที่เจ้าของเลือกแชร์",
    icon: "qr",
  },
  {
    title: "Verified Breeder Profile",
    benefit: "สร้างความโปร่งใสให้ฟาร์ม",
    desc: "ช่วยให้ฟาร์มแสดงข้อมูล พ่อแม่พันธุ์ ครอก และรายละเอียดที่ทำให้ผู้ซื้อมั่นใจขึ้น",
    icon: "shield",
  },
  {
    title: "Digital Pedigree",
    benefit: "สายเลือดและข้อมูลพ่อแม่พันธุ์เป็นระบบ",
    desc: "จัดเก็บผังสายเลือด ข้อมูลพ่อแม่ และข้อมูลฟาร์มสำหรับการเพาะพันธุ์ที่ต้องการมาตรฐาน",
    icon: "tree",
  },
  {
    title: "Service-ready Sharing",
    benefit: "พร้อมต่อยอดกับคลินิกและบริการ",
    desc: "วางโครงสร้างข้อมูลให้พร้อมสำหรับคลินิก โรงแรม อาบน้ำตัดขน และบริการสัตว์เลี้ยงในอนาคต",
    icon: "care",
  },
] satisfies Array<{ title: string; benefit: string; desc: string; icon: IconName }>;

const lifecycleSteps = [
  {
    title: "Create profile",
    desc: "เริ่มจากข้อมูลพื้นฐาน รูปภาพ เจ้าของ และรายละเอียดประจำตัว",
    icon: "id",
  },
  {
    title: "Record health",
    desc: "บันทึกวัคซีน ถ่ายพยาธิ การรักษา และเอกสารสำคัญ",
    icon: "health",
  },
  {
    title: "Share safely",
    desc: "แชร์ QR Profile ให้ผู้ดูแลหรือบริการที่จำเป็นต้องรู้ข้อมูล",
    icon: "qr",
  },
  {
    title: "Verify lineage",
    desc: "เชื่อมข้อมูลฟาร์ม เพ็ดดิกรี พ่อแม่พันธุ์ และความโปร่งใส",
    icon: "tree",
  },
  {
    title: "Transfer ownership",
    desc: "ส่งต่อข้อมูลสำคัญเมื่อสัตว์เลี้ยงย้ายบ้านหรือมีเจ้าของใหม่",
    icon: "transfer",
  },
  {
    title: "Continue care",
    desc: "ให้คลินิก บริการ และผู้ดูแลในอนาคตเข้าใจข้อมูลได้ต่อเนื่อง",
    icon: "clinic",
  },
] satisfies Array<{ title: string; desc: string; icon: IconName }>;

const userGroups = [
  {
    label: "For Pet Owners",
    title: "ดูแลข้อมูลสัตว์เลี้ยงโดยไม่ต้องจำทุกอย่างเอง",
    desc: "จัดเก็บประวัติสุขภาพ เอกสาร และ QR Profile เพื่อให้การดูแลประจำวัน ฝากเลี้ยง หรือเหตุฉุกเฉินง่ายขึ้น",
    icon: "owner",
  },
  {
    label: "For Breeders",
    title: "ทำให้ฟาร์มดูโปร่งใสและมีระบบมากกว่าโพสต์ขาย",
    desc: "แสดงข้อมูลฟาร์ม ครอก พ่อแม่พันธุ์ เพ็ดดิกรี และประวัติที่ช่วยสร้างความเชื่อมั่นกับผู้ซื้อ",
    icon: "breeder",
  },
  {
    label: "For Clinics & Services",
    title: "เห็นข้อมูลสำคัญเร็วขึ้น ลดคำถามซ้ำก่อนให้บริการ",
    desc: "ช่วยให้คลินิก โรงแรม อาบน้ำตัดขน และผู้ดูแลเข้าถึงข้อมูลพื้นฐานและประวัติที่เกี่ยวข้องได้เป็นระบบ",
    icon: "clinic",
  },
  {
    label: "For Pet Businesses",
    title: "เชื่อมบริการเข้ากับเจ้าของและโปรไฟล์สัตว์เลี้ยงจริง",
    desc: "รองรับการค้นหา บริการ และความต้องการของเจ้าของสัตว์เลี้ยงผ่านข้อมูลที่ชัดเจนกว่าเดิม",
    icon: "shop",
  },
] satisfies Array<{ label: string; title: string; desc: string; icon: IconName }>;

const featureShowcase = [
  {
    title: "Free Pet ID Card",
    desc: "บัตรประจำตัวดิจิทัลพร้อม QR สำหรับแชร์โปรไฟล์สัตว์เลี้ยง",
    icon: "id",
  },
  {
    title: "QR Public Pet Profile",
    desc: "หน้าโปรไฟล์สาธารณะที่เจ้าของเลือกข้อมูลที่ต้องการเปิดเผยได้",
    icon: "qr",
  },
  {
    title: "Digital Health Book",
    desc: "จัดเก็บวัคซีน ถ่ายพยาธิ นัดหมาย และประวัติการรักษา",
    icon: "health",
  },
  {
    title: "Documents",
    desc: "รวมสมุดวัคซีน ใบรับรองสุขภาพ เพ็ดดิกรี และเอกสารสำคัญ",
    icon: "doc",
  },
  {
    title: "Breeder Profile",
    desc: "โปรไฟล์ฟาร์มที่ช่วยสื่อสารข้อมูลอย่างเป็นระบบและตรวจสอบง่ายขึ้น",
    icon: "shield",
  },
  {
    title: "Digital Pedigree",
    desc: "จัดการสายเลือด พ่อแม่พันธุ์ และข้อมูลครอกสำหรับฟาร์ม",
    icon: "tree",
  },
] satisfies Array<{ title: string; desc: string; icon: IconName }>;

const trustLayer = [
  "Registered breeder profiles",
  "Transparent pet information",
  "Digital health and document records",
  "Review and verification readiness",
  "Clinic and service integration foundation",
];

const farmHighlights = [
  {
    title: "ข้อมูลฟาร์มที่อ่านง่าย",
    desc: "รวมข้อมูลฟาร์ม สายพันธุ์ ครอก พ่อแม่พันธุ์ และเอกสารสำคัญไว้ในโปรไฟล์เดียว",
    icon: "breeder",
  },
  {
    title: "ตรวจสอบก่อนตัดสินใจ",
    desc: "ช่วยให้ผู้รับสัตว์เลี้ยงเห็นข้อมูลสุขภาพ ประวัติวัคซีน และความโปร่งใสได้ชัดขึ้น",
    icon: "shield",
  },
  {
    title: "เชื่อมต่อกับเจ้าของใหม่",
    desc: "ส่งต่อข้อมูลที่จำเป็นพร้อม Pet ID เพื่อให้การดูแลต่อเนื่องหลังย้ายบ้าน",
    icon: "transfer",
  },
] satisfies Array<{ title: string; desc: string; icon: IconName }>;

const knowledgeHighlights = [
  {
    tag: "เริ่มเลี้ยงสัตว์",
    title: "รับลูกแมวหรือลูกสุนัขเข้าบ้าน ต้องเตรียมอะไรบ้าง",
    desc: "เช็กลิสต์แรกสำหรับบ้านใหม่ ค่าใช้จ่ายเบื้องต้น และข้อมูลที่ควรบันทึกตั้งแต่วันแรก",
  },
  {
    tag: "สุขภาพและวัคซีน",
    title: "สมุดวัคซีนสัตว์เลี้ยงควรมีข้อมูลอะไรบ้าง",
    desc: "อธิบายข้อมูลสุขภาพที่ควรเก็บ วิธีอ่านประวัติ และเหตุผลที่ข้อมูลดิจิทัลช่วยลดการตกหล่น",
  },
  {
    tag: "ฟาร์มและความโปร่งใส",
    title: "เลือกฟาร์มอย่างไรให้มั่นใจมากขึ้น",
    desc: "คำถามที่ควรถาม เอกสารที่ควรเห็น และข้อมูลที่ช่วยให้การรับสัตว์เลี้ยงรับผิดชอบขึ้น",
  },
] satisfies Array<{ tag: string; title: string; desc: string }>;

const seoFaqs = [
  {
    question: "Whiskora คืออะไร?",
    answer:
      "Whiskora คือแพลตฟอร์ม pet-tech ที่ช่วยเชื่อมข้อมูลสัตว์เลี้ยง เจ้าของ ฟาร์ม สุขภาพ เอกสาร เพ็ดดิกรี และ QR Profile ให้อยู่ในระบบเดียว เพื่อให้ดูแลและแชร์ข้อมูลได้ง่ายขึ้น",
  },
  {
    question: "Whiskora ต่างจากแค่สร้าง Pet ID อย่างไร?",
    answer:
      "Pet ID เป็นจุดเริ่มต้น แต่ Whiskora ออกแบบให้เป็นระบบข้อมูลสัตว์เลี้ยงระยะยาว ครอบคลุมสุขภาพ เอกสาร ฟาร์ม เพ็ดดิกรี การแชร์ QR และการต่อยอดกับบริการสัตว์เลี้ยง",
  },
  {
    question: "QR Profile สัตว์เลี้ยงใช้ทำอะไร?",
    answer:
      "QR Profile ช่วยให้เจ้าของแชร์ข้อมูลที่จำเป็น เช่น ข้อมูลพื้นฐาน เจ้าของ ประวัติสุขภาพ หรือเอกสารบางส่วน ให้ผู้ดูแลหรือผู้เกี่ยวข้องเข้าถึงได้รวดเร็ว",
  },
  {
    question: "ฟาร์มและผู้เพาะพันธุ์ใช้ Whiskora ได้อย่างไร?",
    answer:
      "ฟาร์มสามารถใช้ Whiskora เพื่อจัดการโปรไฟล์ฟาร์ม ข้อมูลสัตว์เลี้ยง ครอก พ่อแม่พันธุ์ เพ็ดดิกรี และข้อมูลที่ช่วยเพิ่มความโปร่งใสก่อนการตัดสินใจของผู้ซื้อ",
  },
  {
    question: "Whiskora เหมาะกับคลินิกหรือบริการสัตว์เลี้ยงไหม?",
    answer:
      "Whiskora วางโครงสร้างข้อมูลให้พร้อมสำหรับคลินิก โรงแรม อาบน้ำตัดขน และบริการสัตว์เลี้ยง เพื่อให้ดูข้อมูลสำคัญของสัตว์เลี้ยงได้เร็วขึ้นและลดการถามข้อมูลซ้ำ",
  },
  {
    question: "เริ่มใช้งาน Whiskora ต้องเสียค่าใช้จ่ายไหม?",
    answer:
      "เจ้าของสัตว์เลี้ยงสามารถเริ่มสร้างโปรไฟล์และ Pet ID ได้ฟรี เหมาะสำหรับการจัดข้อมูลพื้นฐาน แชร์ QR Profile และเริ่มเก็บประวัติสุขภาพของสัตว์เลี้ยง",
  },
];

const searchIntents = [
  "Pet ID สัตว์เลี้ยง",
  "QR Profile สัตว์เลี้ยง",
  "สมุดสุขภาพสัตว์เลี้ยงออนไลน์",
  "ประวัติวัคซีนสัตว์เลี้ยง",
  "ฟาร์มแมวและฟาร์มสุนัข",
  "เพ็ดดิกรีสัตว์เลี้ยง",
  "โอนเจ้าของสัตว์เลี้ยง",
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
      featureList: productPillars.map((pillar) => pillar.title),
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
        <section className="hero-section" aria-label="Whiskora homepage hero">
          <div className="hero-inner">
            <div className="hero-copy-block">
              <div className="eyebrow">
                <PawIcon />
                TRUSTED PET LIFE PLATFORM
              </div>
              <h1 className="hero-title">
                ข้อมูลสัตว์เลี้ยงที่เชื่อถือได้
                <span>สำหรับทุกช่วงชีวิต</span>
              </h1>
              <p className="hero-copy">
                Whiskora เชื่อม Pet ID, QR Profile, ประวัติสุขภาพ, ฟาร์ม, เพ็ดดิกรี และเอกสารสำคัญไว้ในระบบเดียว เพื่อให้เจ้าของ ฟาร์ม คลินิก และบริการสัตว์เลี้ยงดูแลต่อเนื่องได้ง่ายขึ้น
              </p>
              <div className="hero-actions">
                <button className="primary-btn" onClick={() => router.push("/register")}>
                  <PawIcon color="#fff" />
                  สร้าง Pet ID ฟรี
                </button>
                <button className="secondary-btn" onClick={() => document.getElementById("platform-pillars")?.scrollIntoView({ behavior: "smooth" })}>
                  สำรวจ Whiskora
                </button>
              </div>
              <div className="hero-product-note" aria-label="Whiskora core product areas">
                <div><IconImg name="qr" size={24} /> QR Public Profile</div>
                <div><IconImg name="health" size={24} /> Health Records</div>
                <div><IconImg name="shield" size={24} /> Breeder Trust</div>
              </div>
            </div>
            <Image
              src="/verified.png"
              alt="Whiskora Verified"
              width={300}
              height={300}
              className="verified-seal"
            />
          </div>
        </section>

        <section className="trust-strip" aria-label="Whiskora trust principles">
          {trustStatements.map((item) => (
            <article className="trust-item" key={item.title} data-reveal>
              <h3>{item.title}</h3>
              <p>{item.desc}</p>
            </article>
          ))}
        </section>

        <section className="content-section" id="real-problems">
          <div className="section-inner">
            <SectionHeader
              eyebrow="REAL PET DATA PROBLEMS"
              title="ข้อมูลสัตว์เลี้ยงไม่ควรหายไป"
              highlight="ระหว่างสมุด แชต และความจำ"
              copy="Whiskora เริ่มจากปัญหาที่เจ้าของ ฟาร์ม และผู้ให้บริการเจอจริง: ข้อมูลสำคัญอยู่หลายที่ ส่งต่อไม่ครบ และตรวจสอบยากในจังหวะที่ต้องใช้"
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

        <section className="platform-band" aria-label="Whiskora platform introduction">
          <div className="section-inner">
            <div className="platform-copy" data-reveal="panel">
              <div className="eyebrow">
                <IconImg name="shield" size={20} />
                ONE PLATFORM, EVERY PET LIFE
              </div>
              <h2 className="section-title">
                Whiskora คือระบบกลาง
                <span>ของข้อมูลสัตว์เลี้ยงที่ไว้ใจได้</span>
              </h2>
              <p className="section-copy">
                จากโปรไฟล์แรกของลูกสัตว์ ไปจนถึงประวัติสุขภาพ ฟาร์ม เพ็ดดิกรี การส่งต่อเจ้าของ และการดูแลกับบริการต่าง ๆ Whiskora ทำให้ข้อมูลเดินทางไปพร้อมกับสัตว์เลี้ยงอย่างเป็นระบบ
              </p>
              <div className="platform-proof">
                <div><IconImg name="id" size={24} /> เริ่มจาก Pet ID และโปรไฟล์ฟรี</div>
                <div><IconImg name="health" size={24} /> เก็บข้อมูลสุขภาพและเอกสารต่อเนื่อง</div>
                <div><IconImg name="tree" size={24} /> รองรับสายเลือด ฟาร์ม และครอก</div>
                <div><IconImg name="clinic" size={24} /> พร้อมต่อยอดกับคลินิกและบริการ</div>
              </div>
              <button className="primary-btn" onClick={() => router.push("/register")}>
                เริ่มสร้างโปรไฟล์สัตว์เลี้ยง
              </button>
            </div>
          </div>
        </section>

        <section className="section-inner farm-directory-section" id="farm-directory" aria-labelledby="farm-directory-title">
          <div className="farm-story-panel" data-reveal="panel">
            <div className="farm-story-copy">
              <SectionHeader
                id="farm-directory-title"
                eyebrow="VERIFIED FARM DIRECTORY"
                title="ฟาร์มคุณภาพควรถูกค้นเจอ"
                highlight="ด้วยข้อมูลที่ตรวจสอบได้"
                copy="ทุกฟาร์มในไดเรกทอรีผ่านการตรวจสอบข้อมูลก่อนขึ้นแสดง เป็นพื้นที่คัดกรองที่ไว้ใจได้ ไม่ใช่แค่หน้ารวมโพสต์ขายสัตว์เลี้ยงทั่วไป"
              />
              <div className="farm-story-proof">
                {farmHighlights.map((item) => (
                  <article className="farm-proof-card" key={item.title} data-reveal>
                    <div className="icon-box">
                      <IconImg name={item.icon} />
                    </div>
                    <h3>{item.title}</h3>
                    <p>{item.desc}</p>
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
            </div>
          </div>
        </section>

        <section className="content-section" id="platform-pillars">
          <div className="section-inner">
            <SectionHeader
              eyebrow="WHAT WHISKORA MAKES POSSIBLE"
              title="เครื่องมือหลักที่เชื่อม"
              highlight="ตัวตน สุขภาพ ฟาร์ม และการดูแล"
              copy="แต่ละฟีเจอร์ถูกออกแบบให้เข้าใจง่ายสำหรับผู้ใช้ทั่วไป และยังมีโครงสร้างข้อมูลที่พร้อมขยายไปสู่ระบบฟาร์ม คลินิก และบริการสัตว์เลี้ยง"
            />
            <div className="pillar-grid">
              {productPillars.map((pillar) => (
                <article className="pillar-card" key={pillar.title} data-reveal>
                  <div className="icon-box">
                    <IconImg name={pillar.icon} />
                  </div>
                  <h3>{pillar.title}</h3>
                  <div className="pillar-benefit">{pillar.benefit}</div>
                  <p>{pillar.desc}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section-inner lifecycle-section" id="pet-lifecycle" aria-labelledby="lifecycle-title">
          <div className="lifecycle-header">
            <SectionHeader
              id="lifecycle-title"
              eyebrow="EVERY STAGE OF PET LIFE"
              title="ระบบเดียวที่เดินไปพร้อม"
              highlight="ทุกช่วงชีวิตของสัตว์เลี้ยง"
              copy="Whiskora ไม่ใช่แค่การกรอกข้อมูลครั้งเดียว แต่เป็นโครงสร้างข้อมูลที่ติดตามการดูแลสัตว์เลี้ยงต่อเนื่องในทุกช่วงชีวิต ทั้งน่าเชื่อถือและใช้งานได้จริง"
            />
          </div>
          <div className="lifecycle-grid">
            {lifecycleSteps.map((step, index) => (
              <article className="lifecycle-step" key={step.title} data-reveal>
                <span className="step-index">{index + 1}</span>
                <IconImg name={step.icon} />
                <h3>{step.title}</h3>
                <p>{step.desc}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="content-section" id="user-groups">
          <div className="section-inner">
            <SectionHeader
              eyebrow="BUILT FOR THE PET ECOSYSTEM"
              title="ไม่ใช่แค่เจ้าของสัตว์เลี้ยง"
              highlight="แต่เชื่อมทั้งระบบรอบตัวสัตว์"
              copy="เจ้าของสัตว์เลี้ยง ฟาร์ม และผู้ให้บริการ ต่างเข้าถึงข้อมูลชุดเดียวกันได้ในมุมมองที่เหมาะกับงานของตัวเอง"
            />
            <div className="audience-grid">
              {userGroups.map((group) => (
                <article className="audience-card" key={group.label} data-reveal>
                  <div className="icon-box">
                    <IconImg name={group.icon} />
                  </div>
                  <div className="audience-label">{group.label}</div>
                  <h3>{group.title}</h3>
                  <p>{group.desc}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section-inner feature-showcase" id="feature-showcase" aria-labelledby="feature-showcase-title">
          <div className="product-preview" aria-label="Whiskora product preview" data-reveal="panel">
            <div className="preview-phone">
              <div className="preview-screen">
                <div className="pet-hero-card">
                  <div className="pet-avatar" />
                  <div className="pet-name">LUNA</div>
                  <div className="pet-sub">Scottish Fold / Verified Pet</div>
                </div>
                <div className="preview-tabs">
                  <span>Profile</span>
                  <span>Health</span>
                  <span>Pedigree</span>
                  <span>Docs</span>
                </div>
                <div className="preview-list">
                  {[
                    ["Birth Date", "10 Mar 2024"],
                    ["Breed", "Scottish Fold"],
                    ["Last Vaccine", "Updated"],
                    ["Owner Contact", "Shared by QR"],
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
                      <p>แชร์ข้อมูลที่จำเป็นให้ผู้ดูแลหรือบริการสัตว์เลี้ยงเข้าถึงได้เร็วขึ้น</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <SectionHeader
              id="feature-showcase-title"
              eyebrow="FEATURE SHOWCASE"
              title="เริ่มจาก Pet ID ฟรี"
              highlight="แล้วต่อยอดเป็นโปรไฟล์ชีวิตจริง"
              copy="ฟีเจอร์สำคัญถูกเขียนให้ผู้ใช้เข้าใจทันทีว่าช่วยอะไร ไม่ใช่แค่รายชื่อเมนูในระบบ"
            />
            <div className="feature-grid">
              {featureShowcase.map((feature) => (
                <article className="feature-card" key={feature.title} data-reveal>
                  <div className="icon-box">
                    <IconImg name={feature.icon} />
                  </div>
                  <h3>{feature.title}</h3>
                  <p>{feature.desc}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section-inner trust-section" aria-labelledby="trust-title" data-reveal="panel">
          <Image
            src="/verified.png"
            alt="Whiskora Verified"
            width={300}
            height={300}
            className="seal-image"
          />
          <div>
            <SectionHeader
              id="trust-title"
              eyebrow="TRUST LAYER"
              title="ความน่าเชื่อถือที่ค่อย ๆ สะสม"
              highlight="จากข้อมูลที่โปร่งใสและตรวจสอบง่าย"
              copy="Whiskora ไม่ขายความน่าเชื่อถือด้วยคำโฆษณา แต่สร้างพื้นที่ให้ข้อมูลฟาร์ม สุขภาพ เอกสาร และประวัติของสัตว์เลี้ยงถูกจัดเก็บและแชร์อย่างมีระบบ"
            />
            <div className="trust-layer-list">
              {trustLayer.map((item) => (
                <div className="trust-layer-card" key={item} data-reveal>
                  <IconImg name="shield" size={24} />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="knowledge-preview-section" id="knowledge-preview" aria-labelledby="knowledge-preview-title">
          <div className="section-inner">
            <SectionHeader
              id="knowledge-preview-title"
              eyebrow="PET KNOWLEDGE CENTER"
              title="ความรู้สัตว์เลี้ยงที่พาคนใช้ข้อมูลจริง"
              highlight="ไม่ใช่บทความลอย ๆ"
              copy="บทความแต่ละชิ้นโยงกลับไปยัง Pet ID วัคซีน ฟาร์ม และการดูแลต่อเนื่อง ให้ความรู้ที่อ่านแล้วใช้ได้จริงกับสัตว์เลี้ยงของคุณ"
            />
            <div className="knowledge-layout">
              <article className="knowledge-featured" data-reveal="panel">
                <div className="knowledge-featured-content">
                  <span className="article-tag">Pet ID & Care Continuity</span>
                  <h3>ข้อมูลอะไรควรอยู่ในโปรไฟล์สัตว์เลี้ยง เพื่อให้ดูแลต่อได้จริง</h3>
                  <p>
                    ใช้บทความเป็นประตูให้เจ้าของเข้าใจว่าการสร้างโปรไฟล์ไม่ใช่แค่ทำบัตรสวย ๆ แต่คือการจัดระเบียบข้อมูลสุขภาพ เอกสาร และการแชร์กับคนที่ดูแลสัตว์เลี้ยง
                  </p>
                  <div className="farm-story-actions">
                    <button className="primary-btn" onClick={() => router.push("/pet-knowledge")}>
                      อ่านบทความทั้งหมด
                    </button>
                  </div>
                </div>
              </article>
              <div className="knowledge-list">
                {knowledgeHighlights.map((article) => (
                  <article className="knowledge-card" key={article.title} data-reveal>
                    <span className="article-tag">{article.tag}</span>
                    <h3>{article.title}</h3>
                    <p>{article.desc}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="section-inner faq-section" id="faq" aria-labelledby="whiskora-faq-title">
          <SectionHeader
            id="whiskora-faq-title"
            eyebrow="ANSWERS FOR SEARCH AND AI"
            title="คำตอบสำคัญเกี่ยวกับ"
            highlight="Whiskora, Pet ID และ QR Profile"
            copy="รวมคำถามที่คนถามบ่อยเกี่ยวกับ Whiskora พร้อมคำตอบจากข้อมูลจริงในระบบ ให้เจอสิ่งที่ต้องการรู้ได้เร็วขึ้น"
          />
          <div className="intent-chips" aria-label="หัวข้อที่ผู้ใช้มักค้นหา">
            {searchIntents.map((intent) => (
              <span className="intent-chip" key={intent}>
                {intent}
              </span>
            ))}
          </div>
          <div className="faq-grid">
            {seoFaqs.map((faq) => (
              <article className="faq-card" key={faq.question} data-reveal>
                <h3>{faq.question}</h3>
                <p>{faq.answer}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="cta-band" aria-label="Start using Whiskora" data-reveal="panel">
          <div className="section-inner">
            <h2>เริ่มต้นจากโปรไฟล์สัตว์เลี้ยงหนึ่งตัว</h2>
            <p>
              สร้าง Pet ID ฟรี แล้วค่อย ๆ เติมข้อมูลสุขภาพ เอกสาร และรายละเอียดที่ทำให้การดูแลสัตว์เลี้ยงของคุณต่อเนื่องและน่าเชื่อถือขึ้น
            </p>
            <div className="cta-actions">
              <button className="secondary-btn" onClick={() => router.push("/register")}>
                <PawIcon />
                สร้าง Pet ID ฟรี
              </button>
              <button className="secondary-btn" onClick={() => router.push("/pet-id-card")}>
                ดูตัวอย่าง Pet ID
              </button>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
