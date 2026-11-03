import ScopedMessages from '@/app/components/ScopedMessages';
import HomePage from './_home/HomePage';

// Home (client component in _home/) with only the namespaces it uses; title / description come from the layout.
export default async function LocaleHome({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <ScopedMessages locale={locale} ns={['landing']}><HomePage /></ScopedMessages>;
}
