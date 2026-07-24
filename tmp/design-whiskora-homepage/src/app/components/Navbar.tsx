import { useState } from "react";
import { Menu, X } from "lucide-react";
import { C } from "../constants";

const NAV_LINKS = [
  "หน้าแรก", "โปรไฟล์", "ฟาร์ม", "ตลาดสัตว์เลี้ยง",
  "บริการ", "คอมมูนิตี้", "ความรู้", "Tools", "พาร์ทเนอร์",
];

interface NavbarProps {
  lang: "th" | "en";
  onLangChange: (l: "th" | "en") => void;
}

export function Navbar({ lang, onLangChange }: NavbarProps) {
  const [open, setOpen] = useState(false);

  return (
    <nav style={{
      background: "rgba(255,250,252,0.96)",
      backdropFilter: "blur(16px)",
      borderBottom: `1px solid ${C.borderLight}`,
      position: "sticky",
      top: 0,
      zIndex: 100,
      fontFamily: "'Prompt', sans-serif",
    }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 24px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 64 }}>

          {/* Logo */}
          <a href="#" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <div style={{
              background: `linear-gradient(135deg, ${C.pink}, #C53862)`,
              width: 38, height: 38, borderRadius: 11,
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: `0 2px 8px ${C.pinkMid}`,
            }}>
              <span style={{ fontSize: 20, lineHeight: 1 }}>🐾</span>
            </div>
            <span style={{ fontWeight: 700, fontSize: "1.2rem", color: C.ink, letterSpacing: "-0.02em" }}>
              Whiskora
            </span>
          </a>

          {/* Desktop nav */}
          <div className="hidden lg:flex" style={{ alignItems: "center", gap: 2 }}>
            {NAV_LINKS.map((label) => (
              <NavLink key={label} label={label} />
            ))}
          </div>

          {/* Right actions */}
          <div className="hidden lg:flex" style={{ alignItems: "center", gap: 10 }}>
            <LangToggle lang={lang} onLangChange={onLangChange} />
            <button style={{
              background: C.pink,
              color: C.white,
              border: "none",
              borderRadius: 10,
              padding: "8px 22px",
              fontWeight: 600,
              fontSize: "0.875rem",
              cursor: "pointer",
              fontFamily: "'Prompt', sans-serif",
              whiteSpace: "nowrap",
              boxShadow: `0 2px 12px ${C.pinkMid}`,
            }}>
              เข้าสู่ระบบ
            </button>
          </div>

          {/* Mobile hamburger */}
          <button
            className="lg:hidden"
            onClick={() => setOpen(!open)}
            style={{ background: "none", border: "none", cursor: "pointer", color: C.ink, padding: 4, display: "flex" }}
          >
            {open ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div style={{
          background: C.cream,
          borderTop: `1px solid ${C.borderLight}`,
          padding: "16px 24px 24px",
        }}>
          {NAV_LINKS.map((label) => (
            <a key={label} href="#" style={{
              display: "block",
              color: C.ink,
              fontSize: "0.95rem",
              fontWeight: 500,
              padding: "11px 12px",
              borderRadius: 10,
              textDecoration: "none",
              fontFamily: "'Prompt', sans-serif",
            }}>
              {label}
            </a>
          ))}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 16, paddingTop: 16, borderTop: `1px solid ${C.borderLight}` }}>
            <LangToggle lang={lang} onLangChange={onLangChange} />
            <button style={{
              background: C.pink,
              color: C.white,
              border: "none",
              borderRadius: 10,
              padding: "10px 0",
              fontWeight: 600,
              fontSize: "0.95rem",
              cursor: "pointer",
              flex: 1,
              fontFamily: "'Prompt', sans-serif",
            }}>
              เข้าสู่ระบบ
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}

function NavLink({ label }: { label: string }) {
  const [hovered, setHovered] = useState(false);
  return (
    <a
      href="#"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        color: hovered ? C.pink : C.inkMuted,
        background: hovered ? C.pinkLight : "transparent",
        fontSize: "0.82rem",
        fontWeight: 500,
        padding: "6px 10px",
        borderRadius: 8,
        textDecoration: "none",
        transition: "all 0.15s ease",
        whiteSpace: "nowrap",
        fontFamily: "'Prompt', sans-serif",
      }}
    >
      {label}
    </a>
  );
}

function LangToggle({ lang, onLangChange }: NavbarProps) {
  return (
    <div style={{
      display: "flex",
      background: C.surface,
      borderRadius: 8,
      padding: 2,
      gap: 2,
    }}>
      {(["th", "en"] as const).map((l) => (
        <button
          key={l}
          onClick={() => onLangChange(l)}
          style={{
            background: lang === l ? C.white : "transparent",
            color: lang === l ? C.pink : C.grayText,
            border: "none",
            borderRadius: 6,
            padding: "4px 10px",
            fontWeight: lang === l ? 600 : 400,
            fontSize: "0.8rem",
            cursor: "pointer",
            fontFamily: "'Prompt', sans-serif",
            boxShadow: lang === l ? C.shadow : "none",
            transition: "all 0.15s",
          }}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
