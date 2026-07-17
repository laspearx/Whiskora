"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import QRCode from "qrcode";

const F = {
  pink: "#e84677",
  pinkSoft: "#fde2ea",
  pinkDeep: "#c4325f",
  ink: "#1f1a1c",
  muted: "#8e7e84",
  line: "#f3dde3",
};

type QrStep = null | "choose" | "select" | "show";

export default function BottomNavigation() {
  const pathname = usePathname();
  const [qrStep, setQrStep] = useState<QrStep>(null);
  const [pets, setPets] = useState<any[]>([]);
  const [selectedPet, setSelectedPet] = useState<any>(null);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [loadingPets, setLoadingPets] = useState(false);

  const isActive = (path: string) => {
    if (path === "/" && pathname !== "/") return false;
    return pathname.startsWith(path);
  };

  const openModal = () => setQrStep("choose");

  const closeModal = () => {
    setQrStep(null);
    setSelectedPet(null);
    setQrDataUrl("");
  };

  const handleShowMyQr = async () => {
    setLoadingPets(true);
    setQrStep("select");
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session) {
      const { data } = await supabase
        .from("pets")
        .select("id, name, image_url")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false });
      if (data) setPets(data);
    }
    setLoadingPets(false);
  };

  const handleSelectPet = async (pet: any) => {
    setSelectedPet(pet);
    setQrStep("show");
    const url = `${window.location.origin}/pets/${pet.id}`;
    const dataUrl = await QRCode.toDataURL(url, {
      width: 260,
      margin: 2,
      color: { dark: "#1f1a1c", light: "#ffffff" },
    });
    setQrDataUrl(dataUrl);
  };

  const leftItems = [
    {
      name: "หน้าหลัก",
      href: "/profile",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      ),
    },
    {
      name: "สัตว์เลี้ยง",
      href: "/my-pets",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="4" r="2" />
          <circle cx="18" cy="8" r="2" />
          <circle cx="20" cy="16" r="2" />
          <path d="M9 10a5 5 0 0 1 5 5v3.5a3.5 3.5 0 0 1-6.84 1.045Q6.52 17.48 4.46 16.84A3.5 3.5 0 0 1 5.5 10Z" />
        </svg>
      ),
    },
  ];

  const rightItems = [
    {
      name: "บริการ",
      href: "/service-hub",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 3h7v7H3z" />
          <path d="M14 3h7v7h-7z" />
          <path d="M3 14h7v7H3z" />
          <path d="M17 14v7" />
          <path d="M14 17h7" />
        </svg>
      ),
    },
    {
      name: "โปรไฟล์",
      href: "/settings",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      ),
    },
  ];

  return (
    <>
      {qrStep && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 300,
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
          }}
        >
          <div
            onClick={closeModal}
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(0,0,0,0.48)",
              backdropFilter: "blur(4px)",
            }}
          />
          <div
            style={{
              position: "relative",
              background: "white",
              borderRadius: "24px 24px 0 0",
              padding: "8px 20px 48px",
              maxHeight: "82vh",
              overflowY: "auto",
              animation: "qr-sheet-up 0.28s cubic-bezier(0.32,0.72,0,1) both",
            }}
          >
            <style>{`
              @keyframes qr-sheet-up {
                from { transform: translateY(100%); }
                to { transform: translateY(0); }
              }
            `}</style>

            <div
              style={{
                width: 40,
                height: 4,
                background: "#e5e7eb",
                borderRadius: 999,
                margin: "12px auto 20px",
              }}
            />

            {qrStep === "choose" && (
              <>
                <h2 style={{ margin: "0 0 20px", fontSize: 20, fontWeight: 700, color: F.ink, textAlign: "center" }}>
                  QR สัตว์เลี้ยง
                </h2>
                <div style={{ display: "grid", gap: 12 }}>
                  <button
                    onClick={handleShowMyQr}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 16,
                      padding: "16px 20px",
                      border: `2px solid ${F.pink}`,
                      borderRadius: 18,
                      background: F.pinkSoft,
                      cursor: "pointer",
                      textAlign: "left",
                      width: "100%",
                    }}
                  >
                    <div
                      style={{
                        width: 52,
                        height: 52,
                        borderRadius: 14,
                        background: F.pink,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="7" height="7" rx="1" />
                        <rect x="14" y="3" width="7" height="7" rx="1" />
                        <rect x="3" y="14" width="7" height="7" rx="1" />
                        <path d="M14 14h3v3" />
                        <path d="M17 21v-4h4" />
                      </svg>
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 16, color: F.ink }}>โชว์ QR สัตว์เลี้ยงของฉัน</div>
                      <div style={{ fontSize: 13, color: F.muted, marginTop: 3 }}>ให้คนอื่นสแกนเพื่อดูข้อมูลสัตว์เลี้ยง</div>
                    </div>
                  </button>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 16,
                      padding: "16px 20px",
                      border: "2px solid #e5e7eb",
                      borderRadius: 18,
                      background: "#fafafa",
                      textAlign: "left",
                      opacity: 0.7,
                      position: "relative",
                    }}
                  >
                    <div
                      style={{
                        width: 52,
                        height: 52,
                        borderRadius: 14,
                        background: "#f3f4f6",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={F.muted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 7V5a2 2 0 0 1 2-2h2" />
                        <path d="M17 3h2a2 2 0 0 1 2 2v2" />
                        <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
                        <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
                        <rect x="7" y="7" width="10" height="10" rx="1" />
                      </svg>
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 16, color: F.ink }}>สแกน QR สัตว์เลี้ยงของคนอื่น</div>
                      <div style={{ fontSize: 13, color: F.muted, marginTop: 3 }}>เร็วๆ นี้</div>
                    </div>
                    <div
                      style={{
                        position: "absolute",
                        top: 12,
                        right: 14,
                        background: "#e5e7eb",
                        color: "#6b7280",
                        fontSize: 10,
                        fontWeight: 600,
                        padding: "2px 8px",
                        borderRadius: 999,
                      }}
                    >
                      เร็วๆ นี้
                    </div>
                  </div>
                </div>
              </>
            )}

            {qrStep === "select" && (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                  <button
                    onClick={() => setQrStep("choose")}
                    style={{ background: "none", border: "none", cursor: "pointer", padding: 6, borderRadius: 999, lineHeight: 0 }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={F.ink} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m15 18-6-6 6-6" />
                    </svg>
                  </button>
                  <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: F.ink }}>เลือกสัตว์เลี้ยง</h2>
                </div>

                {loadingPets ? (
                  <div style={{ textAlign: "center", padding: "40px 0", color: F.muted, fontSize: 14 }}>กำลังโหลด...</div>
                ) : pets.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "40px 0", color: F.muted, fontSize: 14 }}>
                    ยังไม่มีสัตว์เลี้ยงในบัญชี
                  </div>
                ) : (
                  <div style={{ display: "grid", gap: 10 }}>
                    {pets.map((pet) => (
                      <button
                        key={pet.id}
                        onClick={() => handleSelectPet(pet)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 14,
                          padding: "12px 16px",
                          border: `1.5px solid ${F.line}`,
                          borderRadius: 16,
                          background: "white",
                          cursor: "pointer",
                          textAlign: "left",
                          width: "100%",
                          transition: "border-color 0.15s ease, background 0.15s ease",
                        }}
                      >
                        <div
                          style={{
                            width: 52,
                            height: 52,
                            borderRadius: 13,
                            overflow: "hidden",
                            background: F.pinkSoft,
                            flexShrink: 0,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          {pet.image_url ? (
                            <img src={pet.image_url} alt={pet.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          ) : (
                            <img src="/icons/icon-paw-circle-white.png" alt="" style={{ width: 30, height: 30, objectFit: "contain" }} />
                          )}
                        </div>
                        <span style={{ fontWeight: 600, fontSize: 16, color: F.ink }}>{pet.name || "ยังไม่มีชื่อ"}</span>
                        <svg style={{ marginLeft: "auto", flexShrink: 0 }} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={F.muted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="m9 18 6-6-6-6" />
                        </svg>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}

            {qrStep === "show" && selectedPet && (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
                  <button
                    onClick={() => { setQrStep("select"); setQrDataUrl(""); }}
                    style={{ background: "none", border: "none", cursor: "pointer", padding: 6, borderRadius: 999, lineHeight: 0 }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={F.ink} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m15 18-6-6 6-6" />
                    </svg>
                  </button>
                  <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: F.ink }}>
                    QR ของ {selectedPet.name || "สัตว์เลี้ยง"}
                  </h2>
                </div>

                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
                  {qrDataUrl ? (
                    <div
                      style={{
                        padding: 20,
                        background: "white",
                        border: `2px solid ${F.line}`,
                        borderRadius: 24,
                        boxShadow: "0 12px 32px rgba(232,70,119,.12)",
                      }}
                    >
                      <img src={qrDataUrl} alt={`QR Code สำหรับ ${selectedPet.name}`} style={{ width: 220, height: 220, display: "block" }} />
                    </div>
                  ) : (
                    <div
                      style={{
                        width: 260,
                        height: 260,
                        background: F.pinkSoft,
                        borderRadius: 24,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: F.muted,
                        fontSize: 14,
                      }}
                    >
                      กำลังสร้าง QR...
                    </div>
                  )}

                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontWeight: 700, fontSize: 16, color: F.ink, marginBottom: 6 }}>
                      {selectedPet.name || "สัตว์เลี้ยง"}
                    </div>
                    <p style={{ margin: 0, fontSize: 13, color: F.muted, lineHeight: 1.6 }}>
                      ให้คนอื่นสแกน QR นี้เพื่อดูข้อมูลของ {selectedPet.name}
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <nav
        className="fixed bottom-0 w-full bg-white border-t border-gray-100 z-50 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.05)]"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)", overflow: "visible" }}
      >
        <div className="max-w-md mx-auto flex justify-between items-center px-4" style={{ height: 60, overflow: "visible" }}>
          {leftItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                className="flex flex-col items-center justify-center gap-0.5 transition-all"
                style={{ width: "20%", paddingTop: 6 }}
              >
                <div
                  className={`p-1.5 rounded-xl transition-all duration-300 ${
                    active ? "bg-pink-50 text-pink-500 scale-110" : "text-gray-400 hover:text-gray-600"
                  }`}
                >
                  {item.icon}
                </div>
                <span className={`text-[10px] font-bold transition-all ${active ? "text-pink-600" : "text-gray-400"}`}>
                  {item.name}
                </span>
              </Link>
            );
          })}

          <div
            className="flex flex-col items-center"
            style={{ width: "20%", position: "relative", top: -18 }}
          >
            <button
              onClick={openModal}
              aria-label="QR สัตว์เลี้ยง"
              style={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                background: `linear-gradient(135deg, ${F.pink} 0%, #f06d98 100%)`,
                boxShadow: "0 6px 20px rgba(232,70,119,.45)",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "transform 0.16s ease, box-shadow 0.16s ease",
              }}
            >
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
                <path d="M14 14h3v3" />
                <path d="M17 21v-4h4" />
              </svg>
            </button>
            <span className="text-[10px] font-bold text-gray-400" style={{ marginTop: 4 }}>
              QR
            </span>
          </div>

          {rightItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                className="flex flex-col items-center justify-center gap-0.5 transition-all"
                style={{ width: "20%", paddingTop: 6 }}
              >
                <div
                  className={`p-1.5 rounded-xl transition-all duration-300 ${
                    active ? "bg-pink-50 text-pink-500 scale-110" : "text-gray-400 hover:text-gray-600"
                  }`}
                >
                  {item.icon}
                </div>
                <span className={`text-[10px] font-bold transition-all ${active ? "text-pink-600" : "text-gray-400"}`}>
                  {item.name}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
