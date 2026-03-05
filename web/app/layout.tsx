import "./globals.css";
import Navbar from "./components/Navbar";
import ScrollToTop from "./components/ScrollToTop";
import BrowserChecker from "./components/BrowserChecker";

export const metadata = {
  title: "Whiskora | แพลตฟอร์มสำหรับคนรักสัตว์เลี้ยง",
  description: "รวมตลาดสัตว์เลี้ยง คอมมูนิตี้ บริการ และระบบจัดการฟาร์มไว้ในที่เดียว",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th">
      <body className="bg-gray-50 text-gray-900 font-sans">
        
        {/* 🌟 เช็ค Browser และแจ้งเตือนผู้ใช้ */}
        <BrowserChecker /> 
        
        <ScrollToTop /> 
        <Navbar />
        
        <main className="max-w-7xl mx-auto p-4 md:p-6 min-h-screen">
          {children}
        </main>

      </body>
    </html>
  );
}