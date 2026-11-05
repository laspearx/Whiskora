"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { I18nProvider } from "@/i18n/context";
import BrowserChecker from "@/app/components/BrowserChecker";
import Footer from "@/app/components/Footer";
import HtmlLang from "@/app/components/HtmlLang";
import Navbar from "@/app/components/Navbar";
import ScrollToTop from "@/app/components/ScrollToTop";

const localeRoutePattern = /^\/(th|en)(\/|$)/;
const farmWorkspacePattern = /^\/farm-dashboard\//;

export default function RootChrome({ children, messages }: { children: ReactNode; messages: Record<string, unknown> }) {
  const pathname = usePathname();

  // '/_not-found' = the prerendered 404 (app/not-found.tsx): it brings its own TH / EN shell. Wrapping it in the Thai
  // chrome here made the server HTML differ from the client (which sees the real /th|/en URL) → hydration error #418.
  if (localeRoutePattern.test(pathname) || farmWorkspacePattern.test(pathname) || pathname === '/_not-found') {
    return <>{children}</>;
  }

  return (
    <I18nProvider locale="th" messages={messages}>
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
