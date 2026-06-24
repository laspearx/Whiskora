"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { I18nProvider } from "@/i18n/context";
import BrowserChecker from "@/app/components/BrowserChecker";
import Footer from "@/app/components/Footer";
import HtmlLang from "@/app/components/HtmlLang";
import Navbar from "@/app/components/Navbar";
import ScrollToTop from "@/app/components/ScrollToTop";
import thMessages from "@/messages/th.json";

const localeRoutePattern = /^\/(th|en)(\/|$)/;

export default function RootChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  if (localeRoutePattern.test(pathname)) {
    return <>{children}</>;
  }

  return (
    <I18nProvider locale="th" messages={thMessages as Record<string, any>}>
      <HtmlLang />
      <BrowserChecker />
      <ScrollToTop />
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 md:px-6 min-h-screen">
        {children}
      </main>
      <Footer />
    </I18nProvider>
  );
}
