import type { Metadata } from 'next';
import { localeMetadata, metaMessages } from '@/lib/metadata';
export { default } from '@/app/search/page';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const m = metaMessages(locale);
  return localeMetadata(locale, '/search', { title: m.searchTitle, description: m.searchDescription });
}
