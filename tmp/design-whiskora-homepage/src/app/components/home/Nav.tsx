import { useState, useEffect } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import { Menu, X } from "lucide-react";
import { W } from "../../homeConstants";
import logoImg from "../../../imports/Photoroom_20260428_155006-1.png";

const LINKS = [
  { label: "หน้าแรก", href: "#" },
  { label: "ฟาร์ม", href: "#farms" },
  { label: "บริการ", href: "#services" },
  { label: "ความรู้", href: "#knowledge" },
  { label: "พาร์ทเนอร์", href: "#partner" },
];

export function Nav() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { scrollY } = useScroll();

  useEffect(() => {
    return scrollY.on("change", (v) => setScrolled(v > 60));
  }, [scrollY]);

  return (
    <>
      <motion.header
        style={{
          position: "fixed",
          top: 0, left: 0, right: 0,
          zIndex: 100,
          fontFamily: "'Prompt', sans-serif",
        }}
        initial={{
          backgroundColor: "rgba(0,0,0,0)",
          backdropFilter: "blur(0px)",
          boxShadow: "0px 0px 0px rgba(0,0,0,0)",
        }}
        animate={{
          backgroundColor: scrolled ? "rgba(255,250,252,0.97)" : "rgba(0,0,0,0)",
          backdropFilter: scrolled ? "blur(20px)" : "blur(0px)",
          boxShadow: scrolled ? "0px 1px 40px rgba(0,0,0,0.08)" : "0px 0px 0px rgba(0,0,0,0)",
        }}
        transition={{ duration: 0.35, ease: "easeOut" }}
      >
        <div style={{ maxWidth: 1440, margin: "0 auto", padding: "0 clamp(16px,4vw,48px)", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          {/* Logo */}
          <motion.a
            href="#"
            style={{ display: "flex", alignItems: "center" }}
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <img
              src={logoImg}
              alt="Whiskora"
              style={{
                height: 30,
                objectFit: "contain",
                filter: scrolled ? "none" : "brightness(0) invert(1)",
                transition: "filter 0.3s ease",
              }}
            />
          </motion.a>

          {/* Desktop links */}
          <motion.nav
            className="hidden md:flex"
            style={{ alignItems: "center", gap: 8 }}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            {LINKS.map((l) => (
              <a
                key={l.label}
                href={l.href}
                style={{
                  padding: "8px 14px",
                  borderRadius: 10,
                  fontSize: "0.88rem",
                  fontWeight: 500,
                  color: scrolled ? W.inkMid : "rgba(255,255,255,0.82)",
                  textDecoration: "none",
                  transition: "color 0.2s, background 0.2s",
                  fontFamily: "'Prompt', sans-serif",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.color = W.pink;
                  (e.currentTarget as HTMLElement).style.background = scrolled ? W.pinkBg : "rgba(232,70,119,0.12)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.color = scrolled ? W.inkMid : "rgba(255,255,255,0.82)";
                  (e.currentTarget as HTMLElement).style.background = "transparent";
                }}
              >
                {l.label}
              </a>
            ))}
          </motion.nav>

          {/* CTA */}
          <motion.div
            className="hidden md:flex"
            style={{ alignItems: "center", gap: 12 }}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <a
              href="#"
              style={{
                fontSize: "0.85rem",
                fontWeight: 600,
                color: scrolled ? W.inkMid : "rgba(255,255,255,0.75)",
                textDecoration: "none",
                fontFamily: "'Prompt', sans-serif",
                transition: "color 0.2s",
              }}
            >
              เข้าสู่ระบบ
            </a>
            <a
              href="#"
              style={{
                background: W.pink,
                color: W.white,
                borderRadius: 12,
                padding: "9px 22px",
                fontSize: "0.85rem",
                fontWeight: 700,
                textDecoration: "none",
                fontFamily: "'Prompt', sans-serif",
                boxShadow: `0 4px 20px ${W.pinkGlow}`,
                transition: "transform 0.2s, box-shadow 0.2s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
                (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 28px ${W.pinkGlow}`;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.transform = "none";
                (e.currentTarget as HTMLElement).style.boxShadow = `0 4px 20px ${W.pinkGlow}`;
              }}
            >
              เริ่มต้นฟรี
            </a>
          </motion.div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden"
            onClick={() => setOpen(!open)}
            style={{
              background: "none", border: "none", cursor: "pointer",
              color: scrolled ? W.ink : W.white,
              display: "flex", alignItems: "center",
            }}
          >
            {open ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile menu */}
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              background: "rgba(255,250,252,0.98)",
              backdropFilter: "blur(20px)",
              borderTop: `1px solid ${W.border}`,
              padding: "20px 24px 28px",
            }}
          >
            {LINKS.map((l) => (
              <a
                key={l.label}
                href={l.href}
                style={{
                  display: "block",
                  padding: "12px 0",
                  color: W.inkMid,
                  fontSize: "1rem",
                  fontWeight: 500,
                  textDecoration: "none",
                  borderBottom: `1px solid ${W.border}`,
                  fontFamily: "'Prompt', sans-serif",
                }}
              >
                {l.label}
              </a>
            ))}
            <a
              href="#"
              style={{
                display: "block",
                marginTop: 16,
                background: W.pink,
                color: W.white,
                borderRadius: 12,
                padding: "13px",
                textAlign: "center",
                fontSize: "0.95rem",
                fontWeight: 700,
                textDecoration: "none",
                fontFamily: "'Prompt', sans-serif",
              }}
            >
              เริ่มต้นฟรี
            </a>
          </motion.div>
        )}
      </motion.header>
    </>
  );
}
