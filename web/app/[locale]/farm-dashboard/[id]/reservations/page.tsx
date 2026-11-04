import ScopedMessages from '@/app/components/ScopedMessages';
import Page from '@/app/farm-dashboard/[id]/reservations/page';

export default async function LocalePage({ params }: { params: Promise<{ locale: string } & Record<string, string>> }) {
  const { locale } = await params;
  return <ScopedMessages locale={locale} ns={['reservations']}><Page /></ScopedMessages>;
}
