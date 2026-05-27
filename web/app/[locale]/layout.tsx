import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import Navbar from '@/app/components/Navbar';
import Footer from '@/app/components/Footer';
import ScrollToTop from '@/app/components/ScrollToTop';
import BrowserChecker from '@/app/components/BrowserChecker';
import HtmlLang from '@/app/components/HtmlLang';

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as 'th' | 'en')) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <HtmlLang />
      <BrowserChecker />
      <ScrollToTop />
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 md:px-6 min-h-screen">
        {children}
      </main>
      <Footer />
    </NextIntlClientProvider>
  );
}
