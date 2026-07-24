import { ReactNode } from "react";
import { Home, PawPrint, Plus, CreditCard, User, Bell, Signal, Wifi, Battery } from "lucide-react";
import { A } from "../../appConstants";
import pawImg from "../../../imports/Photoroom_20260428_155346.png";
import logoImg from "../../../imports/Photoroom_20260428_155006-1.png";

export type Screen = "dashboard" | "my-pets" | "add-pet" | "pet-detail" | "pet-id-card" | "public-profile" | "profile";

interface AppShellProps {
  screen: Screen;
  setScreen: (s: Screen) => void;
  children: ReactNode;
}

const NAV = [
  { id: "dashboard" as Screen, label: "Home", icon: <Home size={22} /> },
  { id: "my-pets" as Screen, label: "Pets", icon: <PawPrint size={22} /> },
  { id: "add-pet" as Screen, label: "Add", icon: <Plus size={22} />, isAction: true },
  { id: "pet-id-card" as Screen, label: "ID Card", icon: <CreditCard size={22} /> },
  { id: "profile" as Screen, label: "Profile", icon: <User size={22} /> },
];

const SCREEN_HEADER: Record<Screen, { title: string; bg: string; textColor: string }> = {
  dashboard: { title: "", bg: A.indigo, textColor: A.white },
  "my-pets": { title: "My Pets", bg: A.white, textColor: A.ink },
  "add-pet": { title: "Add New Pet", bg: A.white, textColor: A.ink },
  "pet-detail": { title: "", bg: "transparent", textColor: A.white },
  "pet-id-card": { title: "Pet ID Card", bg: A.white, textColor: A.ink },
  "public-profile": { title: "", bg: "transparent", textColor: A.white },
  profile: { title: "My Profile", bg: A.white, textColor: A.ink },
};

export function AppShell({ screen, setScreen, children }: AppShellProps) {
  const isFullBg = screen === "dashboard" || screen === "pet-detail" || screen === "public-profile";
  const hideNav = screen === "public-profile";

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #1E1B4B 0%, #312E81 50%, #1E1B4B 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px 16px",
      fontFamily: "'Prompt', 'Inter', sans-serif",
    }}>
      {/* Phone frame */}
      <div style={{
        width: 390,
        height: 844,
        background: A.surface,
        borderRadius: 48,
        overflow: "hidden",
        position: "relative",
        display: "flex",
        flexDirection: "column",
        boxShadow: "0 40px 120px rgba(0,0,0,0.4), 0 0 0 1.5px rgba(255,255,255,0.15) inset, 0 0 0 2px rgba(0,0,0,0.3)",
        flexShrink: 0,
      }}>
        {/* Status bar */}
        <StatusBar screen={screen} />

        {/* Scrollable content */}
        <div style={{
          flex: 1,
          overflowY: "auto",
          overflowX: "hidden",
          position: "relative",
          scrollbarWidth: "none",
          background: A.surface,
        }}>
          {children}
        </div>

        {/* Bottom navigation */}
        {!hideNav && <BottomNav screen={screen} setScreen={setScreen} />}

        {/* Home indicator */}
        <div style={{
          height: hideNav ? 0 : 20,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: A.white,
        }}>
          {!hideNav && <div style={{ width: 120, height: 4, background: A.border, borderRadius: 4 }} />}
        </div>
      </div>

      {/* Desktop side hints */}
      <div className="hidden lg:flex" style={{
        marginLeft: 40,
        flexDirection: "column",
        gap: 12,
        maxWidth: 280,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <img
            src={pawImg}
            alt=""
            style={{ width: 40, height: 40, objectFit: "contain", flexShrink: 0 }}
          />
          <img
            src={logoImg}
            alt="Whiskora"
            style={{ width: 120, objectFit: "contain", filter: "brightness(0) invert(1)" }}
          />
        </div>
        <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.88rem", lineHeight: 1.7 }}>
          Complete pet lifecycle management — from identity to health records, all in one platform.
        </p>
        <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 8 }}>
          {[
            ["🪪", "Digital Pet ID"],
            ["💉", "Vaccine Tracking"],
            ["📋", "Health Records"],
            ["✅", "Verified Ownership"],
          ].map(([icon, label]) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 10, color: "rgba(255,255,255,0.8)", fontSize: "0.82rem", fontWeight: 500 }}>
              <span style={{ fontSize: 16 }}>{icon}</span>
              {label}
            </div>
          ))}
        </div>
        <div style={{
          marginTop: 16,
          background: "rgba(255,255,255,0.08)",
          borderRadius: 12,
          padding: "12px 16px",
          color: "rgba(255,255,255,0.5)",
          fontSize: "0.72rem",
          lineHeight: 1.6,
        }}>
          Navigate using the bottom tab bar or tap any element to explore the full UI
        </div>
      </div>
    </div>
  );
}

function StatusBar({ screen }: { screen: Screen }) {
  const isDark = screen === "dashboard" || screen === "pet-detail" || screen === "public-profile";
  const bg = isDark ? A.indigo : A.white;
  const textColor = isDark ? A.white : A.ink;

  return (
    <div style={{
      height: 44,
      background: bg,
      display: "flex",
      alignItems: "flex-end",
      justifyContent: "space-between",
      padding: "0 24px 8px",
      flexShrink: 0,
      zIndex: 10,
    }}>
      <span style={{ fontSize: "0.82rem", fontWeight: 700, color: textColor, letterSpacing: "-0.02em" }}>9:41</span>
      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
        <Signal size={14} color={textColor} />
        <Wifi size={14} color={textColor} />
        <div style={{
          width: 22, height: 11,
          border: `1.5px solid ${textColor}`,
          borderRadius: 3,
          position: "relative",
          display: "flex",
          alignItems: "center",
          padding: "1px 1px",
        }}>
          <div style={{ flex: 1, height: "100%", background: textColor, borderRadius: 1 }} />
          <div style={{
            position: "absolute", right: -5, top: "50%", transform: "translateY(-50%)",
            width: 3, height: 5, background: textColor, borderRadius: "0 1px 1px 0",
          }} />
        </div>
      </div>
    </div>
  );
}

function BottomNav({ screen, setScreen }: { screen: Screen; setScreen: (s: Screen) => void }) {
  return (
    <div style={{
      height: 72,
      background: A.white,
      borderTop: `1px solid ${A.border}`,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-around",
      padding: "0 8px",
      flexShrink: 0,
      boxShadow: "0 -4px 20px rgba(0,0,0,0.06)",
    }}>
      {NAV.map(({ id, label, icon, isAction }) => {
        const active = screen === id;
        if (isAction) {
          return (
            <button
              key={id}
              onClick={() => setScreen(id)}
              style={{
                width: 52, height: 52,
                background: `linear-gradient(135deg, ${A.indigo}, ${A.indigoDark})`,
                border: "none",
                borderRadius: 18,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: A.white,
                cursor: "pointer",
                boxShadow: `0 4px 16px ${A.indigo}55`,
                marginTop: -16,
              }}
            >
              {icon}
            </button>
          );
        }
        return (
          <button
            key={id}
            onClick={() => setScreen(id)}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 3,
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "6px 12px",
              color: active ? A.indigo : A.grayLight,
              fontFamily: "'Prompt', sans-serif",
            }}
          >
            <div style={{ position: "relative" }}>
              {icon}
              {active && (
                <div style={{
                  position: "absolute",
                  bottom: -4, left: "50%", transform: "translateX(-50%)",
                  width: 4, height: 4,
                  background: A.indigo,
                  borderRadius: "50%",
                }} />
              )}
            </div>
            <span style={{ fontSize: "0.62rem", fontWeight: active ? 600 : 500 }}>{label}</span>
          </button>
        );
      })}
    </div>
  );
}
