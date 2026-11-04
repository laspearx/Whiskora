import ScopedMessages from '@/app/components/ScopedMessages';
import Page from '@/app/farm-hub/page';
import type { Metadata } from 'next';
import { localeMetadata, metaMessages } from '@/lib/metadata';

export default async function LocalePage({ params }: { params: Promise<{ locale: string } & Record<string, string>> }) {
  const { locale } = await params;
  return <ScopedMessages locale={locale} ns={['farmHub']}><Page /></ScopedMessages>;
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string } & Record<string, string>> }): Promise<Metadata> {
  const { locale } = await params;
  const m = metaMessages(locale);
  return localeMetadata(locale, '/farm-hub', { title: m.farmHubTitle, description: m.farmHubDescription });
}
