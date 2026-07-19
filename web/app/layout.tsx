import type { Metadata } from "next";
import "@/app/globals.css";
import RootChrome from "@/app/components/RootChrome";
import ClientProviders from "@/app/components/ClientProviders";

export const metadata: Metadata = {
  metadataBase: new URL("https://whiskora.pet"),
  applicationName: "Whiskora",
  title: {
    default: "Whiskora | Pet ID, QR Profile และฟาร์มสัตว์เลี้ยงคุณภาพ",
    template: "%s | Whiskora",
  },
  description:
    "Whiskora คือแพลตฟอร์มสัตว์เลี้ยงสำหรับสร้าง Pet ID ฟรี แชร์ QR Profile เก็บประวัติสุขภาพ เพ็ดดิกรี เอกสารสำคัญ และค้นหาฟาร์มสัตว์เลี้ยงที่ตรวจสอบได้",
  keywords: [
    "Whiskora",
    "Pet ID",
    "QR Profile สัตว์เลี้ยง",
    "บัตรประจำตัวสัตว์เลี้ยง",
    "โปรไฟล์สัตว์เลี้ยง",
    "ประวัติสุขภาพสัตว์เลี้ยง",
    "เพ็ดดิกรี",
    "ฟาร์มสัตว์เลี้ยง",
    "ฟาร์มแมว",
    "ฟาร์มสุนัข",
    "สัตว์เลี้ยงหาย",
  ],
  creator: "Whiskora",
  publisher: "Whiskora",
  category: "pet care",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  icons: {
    icon: "/mini-logo.png",
    apple: "/mini-logo.png",
  },
  openGraph: {
    title: "Whiskora | Pet ID, QR Profile และฟาร์มสัตว์เลี้ยงคุณภาพ",
    description:
      "สร้างบัตรประจำตัวสัตว์เลี้ยงฟรี จัดการประวัติสุขภาพและเอกสารสำคัญ พร้อมค้นหาฟาร์มคุณภาพในระบบ Whiskora",
    url: "https://whiskora.pet/th",
    siteName: "Whiskora",
    locale: "th_TH",
    type: "website",
    images: [
      {
        url: "/home/hero-visual-desktop-v1.png",
        width: 1600,
        height: 1000,
        alt: "Whiskora Pet ID และ QR Profile สำหรับสัตว์เลี้ยง",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Whiskora | Pet ID และ QR Profile สำหรับสัตว์เลี้ยง",
    description:
      "แพลตฟอร์มสำหรับโปรไฟล์สัตว์เลี้ยง ประวัติสุขภาพ เพ็ดดิกรี เอกสาร และฟาร์มสัตว์เลี้ยงที่ตรวจสอบได้",
    images: ["/home/hero-visual-desktop-v1.png"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Prompt:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <ClientProviders>
          <RootChrome>{children}</RootChrome>
        </ClientProviders>
      </body>
    </html>
  );
}
