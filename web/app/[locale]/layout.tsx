import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { metaMessages } from '@/lib/metadata';
import { I18nProvider } from '@/i18n/context';
import Navbar from '@/app/components/Navbar';
import Footer from '@/app/components/Footer';
import ScrollToTop from '@/app/components/ScrollToTop';
import BrowserChecker from '@/app/components/BrowserChecker';
import HtmlLang from '@/app/components/HtmlLang';

const locales = ['th', 'en'];

async function getMessages(locale: string) {
  if (locale === 'en') return (await import('@/messages/en.json')).default;
  return (await import('@/messages/th.json')).default;
}

// Site-wide title / description in the URL language (pages without their own metadata get the English site title on
// /en instead of the Thai root default). Pages add their own via generateMetadata + localeMetadata().
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const m = metaMessages(locale);
  // no canonical / hreflang here: the layout cannot know the page path (a canonical to '/th' would be wrong for every
  // sub-page) — pages set them through localeMetadata(locale, path, …)
  return {
    // absolute: the root layout's '%s | Whiskora' template must not wrap the site title itself
    title: { absolute: m.siteTitle, template: '%s | Whiskora' },
    description: m.siteDescription,
    openGraph: { locale: locale === 'en' ? 'en_GB' : 'th_TH', title: m.siteTitle, description: m.siteDescription },
  };
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
      <BrowserChecker />
      <ScrollToTop />
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 md:px-6 min-h-screen pb-20 md:pb-0">
        {children}
      </main>
      <Footer />
    </I18nProvider>
  );
}
