// Locale-aware page metadata (i18n Phase 1). Server-only helper for generateMetadata in app/[locale]/**:
// title / description from messages `meta`, canonical + hreflang alternates, Open Graph locale.
import type { Metadata } from 'next';
import th from '@/messages/th.json';
import en from '@/messages/en.json';

export const LOCALES = ['th', 'en'] as const;
type Meta = typeof th.meta;

export function metaMessages(locale: string): Meta {
  return (locale === 'en' ? en.meta : th.meta) as Meta;
}

/** path = the route without the locale prefix, e.g. '/farm-hub' ('' for home). */
export function localeMetadata(locale: string, path: string, page?: { title: string; description: string }): Metadata {
  const m = metaMessages(locale);
  const lang = locale === 'en' ? 'en' : 'th';
  const description = page?.description ?? m.siteDescription;
  return {
    ...(page ? { title: page.title } : {}),
    description,
    alternates: {
      canonical: `/${lang}${path}`,
      languages: { th: `/th${path}`, en: `/en${path}`, 'x-default': `/th${path}` },
    },
    openGraph: {
      locale: lang === 'en' ? 'en_GB' : 'th_TH',
      alternateLocale: lang === 'en' ? ['th_TH'] : ['en_GB'],
      ...(page ? { title: page.title } : {}),
      description,
    },
  };
}
