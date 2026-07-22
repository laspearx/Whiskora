"use client";

import Image from "next/image";
import { useTranslations } from '@/i18n/context';
import { Link } from '@/i18n/navigation';
import { APP_VERSION } from '@/lib/version';

const F = {
  ink: '#111827',
  inkSoft: '#4B5563',
  muted: '#9CA3AF',
  pink: '#E84677',
  line: '#E5E7EB',
};

export default function Footer() {
  const t = useTranslations('footer');

  const footerSections = [
    {
      title: t('sectionUsers'),
      links: [
        { label: t('findFarm'), href: '/farm-hub' },
        { label: t('bookClinic'), href: '/service-hub' },
        { label: t('petIdCard'), href: '/pet-id-card' },
        { label: t('petKnowledge'), href: '/pet-knowledge' },
        { label: t('petTools'), href: '/pet-tools' },
        { label: t('community'), href: '/community' },
      ],
    },
    {
      title: t('sectionPartners'),
      links: [
        { label: t('openFarm'), href: '/partner/register-farm' },
        { label: t('openShop'), href: '/partner/register-shop' },
        { label: t('genesisProgram'), href: '/partner' },
        { label: t('proPricing'), href: '/partner' },
      ],
    },
    {
      title: t('sectionCompany'),
      links: [
        { label: t('aboutUs'), href: '/about' },
        { label: t('privacy'), href: '/privacy' },
        { label: t('terms'), href: '/' },
        { label: t('contact'), href: '/' },
      ],
    },
  ];

  return (
    <footer className="w-full max-w-7xl mx-auto px-5 md:px-6 mt-0 md:mt-10 pt-8 md:pt-12 pb-24 md:pb-10" style={{ borderTop: `1px solid ${F.line}` }}>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-10 md:gap-10">

        <div className="col-span-2 md:col-span-1 space-y-4 md:-mt-4">
          <div className="flex items-center gap-2">
            <Image src="/logo.png" alt="Whiskora Logo" width={140} height={40} className="h-auto" />
          </div>
          <p style={{ fontSize: 13, color: F.inkSoft, lineHeight: 1.6 }} className="max-w-xs">
            {t('tagline')} <br />
            <span className="opacity-70">{t('taglineSub')}</span>
          </p>
        </div>

        {footerSections.map((section) => (
          <div key={section.title} className="space-y-4">
            <h4 style={{ fontSize: 11, letterSpacing: '0.1em', color: F.muted }} className="font-bold uppercase">
              {section.title}
            </h4>
            <ul className="space-y-2.5">
              {section.links.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href as any}
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

      <div className="mt-6 md:mt-8 pt-6 flex flex-col md:flex-row justify-between items-center gap-4 border-t border-gray-50" style={{ fontSize: 11, color: F.muted }}>
        <div className="flex items-center gap-2">
          <span>{t('copyright')}</span>
          <span className="opacity-30">|</span>
          <span>{t('madeIn')}</span>
        </div>
        <div className="flex items-center gap-6">
          <span>{t('pdpa')}</span>
          <span className="opacity-50">V{APP_VERSION}</span>
        </div>
      </div>
    </footer>
  );
}
