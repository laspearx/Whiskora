"use client";

import { Link } from '@/i18n/navigation';
import { useLocale } from '@/i18n/context';

// โครงหน้าเท่านั้น — ยังไม่มีข้อกำหนดการใช้งานฉบับทางการ จึงไม่แต่งเนื้อหาทางกฎหมายขึ้นเอง
// เมื่อได้เอกสารที่ผ่านการตรวจแล้ว ให้แทนส่วน "อยู่ระหว่างจัดทำ" ด้วยเนื้อหาจริงพร้อมวันที่มีผล
const COPY = {
  th: {
    title: 'ข้อกำหนดการใช้งาน',
    status: 'อยู่ระหว่างจัดทำ',
    body: 'Whiskora กำลังจัดทำข้อกำหนดการใช้งานฉบับเต็ม เมื่อเผยแพร่แล้วหน้านี้จะแสดงเนื้อหาพร้อมวันที่มีผลบังคับใช้',
    meanwhile: 'ระหว่างนี้',
    privacy: 'อ่านนโยบายความเป็นส่วนตัว',
    privacyDesc: 'อธิบายว่าเราเก็บข้อมูลอะไร ใช้อย่างไร และสิทธิ์ของคุณ',
    contact: 'ติดต่อทีมงาน',
    contactDesc: 'หากมีคำถามเกี่ยวกับการใช้งานหรือเงื่อนไขของบริการ',
  },
  en: {
    title: 'Terms of Service',
    status: 'In preparation',
    body: 'Whiskora is preparing its full Terms of Service. Once published, this page will show the terms and their effective date.',
    meanwhile: 'In the meantime',
    privacy: 'Read the privacy policy',
    privacyDesc: 'What data we collect, how we use it, and your rights',
    contact: 'Contact the team',
    contactDesc: 'For questions about using the service',
  },
};

export default function TermsPage() {
  const locale = useLocale();
  const c = COPY[locale === 'en' ? 'en' : 'th'];

  return (
    <div className="max-w-3xl mx-auto px-1 md:px-4 pt-8 pb-24">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{c.title}</h1>
        <span className="rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-[11px] font-bold text-amber-700">{c.status}</span>
      </div>
      <p className="mt-3 text-sm md:text-[15px] leading-relaxed text-gray-600">{c.body}</p>

      <h2 className="mt-8 text-base font-bold text-gray-900">{c.meanwhile}</h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <Link href="/privacy" className="rounded-2xl border border-gray-100 bg-white p-4 hover:border-pink-200 transition-colors">
          <div className="text-sm font-bold text-pink-500">{c.privacy} →</div>
          <p className="mt-1 text-xs leading-relaxed text-gray-500">{c.privacyDesc}</p>
        </Link>
        <Link href="/contact" className="rounded-2xl border border-gray-100 bg-white p-4 hover:border-pink-200 transition-colors">
          <div className="text-sm font-bold text-pink-500">{c.contact} →</div>
          <p className="mt-1 text-xs leading-relaxed text-gray-500">{c.contactDesc}</p>
        </Link>
      </div>
    </div>
  );
}
