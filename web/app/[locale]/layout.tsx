import { notFound } from 'next/navigation';
import { I18nProvider } from '@/i18n/context';
import Navbar from '@/app/components/Navbar';
import Footer from '@/app/components/Footer';
import ScrollToTop from '@/app/components/ScrollToTop';
import HtmlLang from '@/app/components/HtmlLang';

const locales = ['th', 'en'];

async function getMessages(locale: string) {
  if (locale === 'en') return (await import('@/messages/en.json')).default;
  return (await import('@/messages/th.json')).default;
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!locales.includes(locale)) {
    notFound();
  }

  const messages = await getMessages(locale);

  return (
    <I18nProvider locale={locale} messages={messages as Record<string, any>}>
      <HtmlLang />
      <ScrollToTop />
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 md:px-6 min-h-screen pb-20 md:pb-0">
        {children}
      </main>
      <Footer />
    </I18nProvider>
  );
}
