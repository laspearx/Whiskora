import type { Metadata } from 'next';
import ScopedMessages from '@/app/components/ScopedMessages';
import { localeMetadata, metaMessages } from '@/lib/metadata';
import Page from '@/app/service-hub/page';

export default async function LocalePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <ScopedMessages locale={locale} ns={['serviceHub']}><Page /></ScopedMessages>;
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const m = metaMessages(locale);
  return localeMetadata(locale, '/service-hub', { title: m.serviceHubTitle, description: m.serviceHubDescription });
}
