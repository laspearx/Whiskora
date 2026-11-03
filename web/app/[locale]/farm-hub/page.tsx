import type { Metadata } from 'next';
import { localeMetadata, metaMessages } from '@/lib/metadata';
export { default } from '@/app/farm-hub/page';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const m = metaMessages(locale);
  return localeMetadata(locale, '/farm-hub', { title: m.farmHubTitle, description: m.farmHubDescription });
}
