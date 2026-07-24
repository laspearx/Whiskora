"use client";

import { Link } from '@/i18n/navigation';

const F = {
  ink: "#1f1a1c", inkSoft: "#4a3f44", muted: "#8e7e84",
  pink: "#e84677", pinkSoft: "#fde2ea",
};

export default function NotFound() {
  return (
    <div style={{ minHeight: "55vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "48px 20px" }}>
      <div style={{ width: 84, height: 84, borderRadius: "999px", background: F.pinkSoft, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 22 }}>
        <img src="/icons/icon-paw-pink.png" alt="" style={{ width: 40, height: 40, objectFit: "contain" }} />
      </div>
      <h1 style={{ fontSize: 20, fontWeight: 700, color: F.ink, marginBottom: 8 }}>ส่วนนี้กำลังพัฒนาอยู่</h1>
      <p style={{ fontSize: 13.5, color: F.muted, lineHeight: 1.7, maxWidth: 340, marginBottom: 26 }}>
        ขออภัยด้วยนะ ฟีเจอร์นี้ของ Whiskora ยังไม่พร้อมใช้งาน
        แต่กำลังพัฒนาอยู่และจะเปิดให้ใช้งานเร็วๆ นี้
      </p>
      <Link
        href="/"
        style={{
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          padding: "13px 32px", borderRadius: "999px", background: F.pink, color: "white",
          fontWeight: 700, fontSize: 14, textDecoration: "none",
          boxShadow: "0 4px 14px rgba(232,70,119,0.3)",
        }}
      >
        กลับหน้าแรก
      </Link>
    </div>
  );
}
