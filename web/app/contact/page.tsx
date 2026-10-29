"use client";

import { Link } from '@/i18n/navigation';
import { useLocale } from '@/i18n/context';

// อีเมลเดียวกับที่ประกาศไว้ในหน้านโยบายความเป็นส่วนตัว — ไม่เพิ่มช่องทางที่ยังไม่มีจริง
const CONTACT_EMAIL = "whiskora.pet@gmail.com";

const COPY = {
  th: {
    title: 'ติดต่อ Whiskora',
    intro: 'ส่งคำถาม แจ้งปัญหาการใช้งาน หรือขอใช้สิทธิ์เกี่ยวกับข้อมูลส่วนบุคคลได้ทางอีเมลด้านล่าง',
    emailLabel: 'อีเมล',
    emailHint: 'โปรดระบุอีเมลบัญชีและลิงก์หน้าที่เกี่ยวข้อง เพื่อให้ทีมงานตรวจสอบได้เร็วขึ้น',
    topics: 'หัวข้อที่ช่วยได้',
    items: [
      { title: 'ปัญหาการใช้งานหรือบัญชี', desc: 'เข้าสู่ระบบไม่ได้ ข้อมูลไม่บันทึก หรือหน้าแสดงผลผิดปกติ' },
      { title: 'ข้อมูลส่วนบุคคล', desc: 'ขอดู แก้ไข หรือลบข้อมูล ตามนโยบายความเป็นส่วนตัว', href: '/privacy', cta: 'อ่านนโยบายความเป็นส่วนตัว' },
      { title: 'ฟาร์ม ร้านค้า และบริการ', desc: 'สมัครพาร์ทเนอร์ หรือสอบถามการยืนยันตัวตนฟาร์ม', href: '/partner', cta: 'ไปหน้าพาร์ทเนอร์' },
      { title: 'แจ้งข้อมูลไม่ถูกต้อง', desc: 'พบโปรไฟล์สัตว์หรือฟาร์มที่ข้อมูลไม่ตรงความจริง แนบลิงก์หน้านั้นมาในอีเมล' },
    ],
  },
  en: {
    title: 'Contact Whiskora',
    intro: 'Send questions, report a problem, or make a personal-data request by email.',
    emailLabel: 'Email',
    emailHint: 'Please include your account email and a link to the related page so we can check faster.',
    topics: 'We can help with',
    items: [
      { title: 'Account or app problems', desc: 'Cannot sign in, data not saving, or a page looks wrong' },
      { title: 'Personal data', desc: 'Request access, correction, or deletion under our privacy policy', href: '/privacy', cta: 'Read the privacy policy' },
      { title: 'Farms, shops and services', desc: 'Partner sign-up or farm identity verification questions', href: '/partner', cta: 'Go to partners' },
      { title: 'Report incorrect information', desc: 'A pet or farm profile looks inaccurate — include the page link in your email' },
    ],
  },
};

export default function ContactPage() {
  const locale = useLocale();
  const c = COPY[locale === 'en' ? 'en' : 'th'];

  return (
    <div className="max-w-3xl mx-auto px-1 md:px-4 pt-8 pb-24">
      <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{c.title}</h1>
      <p className="mt-3 text-sm md:text-[15px] leading-relaxed text-gray-600">{c.intro}</p>

      <div className="mt-6 rounded-2xl border border-pink-100 bg-white p-5">
        <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400">{c.emailLabel}</div>
        <a href={`mailto:${CONTACT_EMAIL}`} className="mt-1 block text-lg font-bold text-pink-500 break-all hover:underline">
          {CONTACT_EMAIL}
        </a>
        <p className="mt-2 text-xs leading-relaxed text-gray-500">{c.emailHint}</p>
      </div>

      <h2 className="mt-8 text-base font-bold text-gray-900">{c.topics}</h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {c.items.map(item => (
          <div key={item.title} className="rounded-2xl border border-gray-100 bg-white p-4">
            <div className="text-sm font-bold text-gray-800">{item.title}</div>
            <p className="mt-1 text-xs leading-relaxed text-gray-500">{item.desc}</p>
            {item.href && (
              <Link href={item.href} className="mt-2 inline-block text-xs font-bold text-pink-500 hover:underline">
                {item.cta} →
              </Link>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
