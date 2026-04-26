import "@/app/globals.css";
import Navbar from "./components/Navbar";
import ScrollToTop from "./components/ScrollToTop";
import BrowserChecker from "./components/BrowserChecker";

export const metadata = {
  metadataBase: new URL('https://whiskora.pet'),
  title: "Whiskora | แพลตฟอร์มสำหรับคนรักสัตว์เลี้ยง",
  description: "รวมตลาดสัตว์เลี้ยง คอมมูนิตี้ บริการ และระบบจัดการฟาร์มไว้ในที่เดียว",
  openGraph: {
    title: "Whiskora | แพลตฟอร์มสำหรับคนรักสัตว์เลี้ยง",
    description: "รวมตลาดสัตว์เลี้ยง คอมมูนิตี้ บริการ และระบบจัดการฟาร์มไว้ในที่เดียว",
    url: "https://whiskora.pet",
    siteName: "Whiskora",
    locale: "th_TH",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=IBM+Plex+Sans+Thai:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <BrowserChecker />
        <ScrollToTop />
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 md:px-6 min-h-screen">
          {children}
        </main>
      </body>
    </html>
  );
}
