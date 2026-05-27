import "@/app/globals.css";

export const metadata = {
  metadataBase: new URL('https://whiskora.pet'),
  title: "Whiskora | แพลตฟอร์มสำหรับคนรักสัตว์เลี้ยง",
  description: "รวมตลาดสัตว์เลี้ยง คอมมูนิตี้ บริการ และระบบจัดการฟาร์มไว้ในที่เดียว",
  openGraph: {
    title: "Whiskora | แพลตฟอร์มสำหรับคนรักสัตว์เลี้ยง",
    description: "รวมตลาดสัตว์เลี้ยง คอมมูนิตี้ บริการ และระบบจัดการฟาร์มไว้ในที่เดียว",
    url: "https://whiskora.pet",
    siteName: "Whiskora",
    type: "website",
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
      <body>{children}</body>
    </html>
  );
}
