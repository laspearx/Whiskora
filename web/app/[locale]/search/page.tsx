import ScopedMessages from '@/app/components/ScopedMessages';
import Page from '@/app/search/page';
import type { Metadata } from 'next';
import { localeMetadata, metaMessages } from '@/lib/metadata';

export default async function LocalePage({ params }: { params: Promise<{ locale: string } & Record<string, string>> }) {
  const { locale } = await params;
  return <ScopedMessages locale={locale} ns={['search']}><Page /></ScopedMessages>;
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string } & Record<string, string>> }): Promise<Metadata> {
  const { locale } = await params;
  const m = metaMessages(locale);
  return localeMetadata(locale, '/search', { title: m.searchTitle, description: m.searchDescription });
}
