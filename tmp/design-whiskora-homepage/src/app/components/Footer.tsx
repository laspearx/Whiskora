import { C } from "../constants";

const LINKS = {
  ผู้ใช้งาน: ["ลงทะเบียนฟรี", "โปรไฟล์สัตว์เลี้ยง", "Pet ID Card", "ค้นหาฟาร์ม", "ตลาดสัตว์เลี้ยง", "จองบริการ"],
  พาร์ทเนอร์: ["สมัครเป็นพาร์ทเนอร์", "Genesis Program", "ระบบจัดการ", "Verified Badge", "ราคาและแพ็กเกจ"],
  บริษัท: ["เกี่ยวกับ Whiskora", "ทีมงาน", "ข่าวสาร", "ร่วมงานกับเรา", "ติดต่อ", "Privacy Policy"],
};

export function Footer() {
  return (
    <footer style={{ background: C.ink, color: C.white, fontFamily: "'Prompt', sans-serif" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "64px 24px 0" }}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10" style={{ marginBottom: 56 }}>
          {/* Brand column */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
              <div style={{
                background: C.pink,
                width: 40, height: 40,
                borderRadius: 12,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <span style={{ fontSize: 22 }}>🐾</span>
              </div>
              <span style={{ fontWeight: 800, fontSize: "1.25rem", letterSpacing: "-0.02em" }}>Whiskora</span>
            </div>
            <p style={{ fontSize: "0.88rem", color: "rgba(255,255,255,0.5)", lineHeight: 1.8, marginBottom: 20, maxWidth: 260 }}>
              ศูนย์กลางของทุกชีวิตสัตว์เลี้ยง
            </p>
            <p style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.35)", lineHeight: 1.6, maxWidth: 240 }}>
              One platform, every pet life.
            </p>

            <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
              {["📘", "📸", "🐦", "▶️"].map((icon, i) => (
                <button key={i} style={{
                  width: 36, height: 36,
                  background: "rgba(255,255,255,0.07)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 10,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer",
                  fontSize: 16,
                  transition: "background 0.15s",
                }}
                  onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.12)"}
                  onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.07)"}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(LINKS).map(([group, links]) => (
            <div key={group}>
              <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "rgba(255,255,255,0.35)", marginBottom: 18, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                {group}
              </div>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
                {links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      style={{
                        color: "rgba(255,255,255,0.55)",
                        fontSize: "0.85rem",
                        textDecoration: "none",
                        transition: "color 0.15s",
                        fontFamily: "'Prompt', sans-serif",
                      }}
                      onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.color = C.white}
                      onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.55)"}
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div style={{
          borderTop: "1px solid rgba(255,255,255,0.08)",
          padding: "20px 0",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          flexWrap: "wrap",
        }}>
          <div style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.3)" }}>
            © 2026 Whiskora Thailand. All rights reserved.
          </div>
          <div style={{ display: "flex", gap: 20 }}>
            {["เงื่อนไขการใช้งาน", "นโยบายความเป็นส่วนตัว", "คุกกี้"].map((item) => (
              <a key={item} href="#" style={{
                fontSize: "0.75rem",
                color: "rgba(255,255,255,0.3)",
                textDecoration: "none",
                fontFamily: "'Prompt', sans-serif",
                transition: "color 0.15s",
              }}
                onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.6)"}
                onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.3)"}
              >
                {item}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
