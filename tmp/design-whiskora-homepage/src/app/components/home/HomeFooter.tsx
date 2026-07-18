import { motion } from "motion/react";
import { W } from "../../homeConstants";
import logoImg from "../../../imports/Photoroom_20260428_155006-1.png";
import pawImg from "../../../imports/Photoroom_20260428_155346.png";

const LINKS = {
  ผู้ใช้งาน: ["ลงทะเบียน", "Pet Profile", "Pet ID Card", "Health Records", "ค้นหาฟาร์ม"],
  พาร์ทเนอร์: ["สมัครฟาร์ม", "สมัครคลินิก", "Genesis Program", "Verified Badge", "ราคา"],
  บริษัท: ["เกี่ยวกับเรา", "ทีมงาน", "ข่าวสาร", "ร่วมงาน", "ติดต่อ"],
};

export function HomeFooter() {
  return (
    <footer style={{ background: W.dark, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "72px 48px 40px" }}>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12" style={{ marginBottom: 64 }}
        >
          {/* Brand column */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                <img src={pawImg} alt="" style={{ width: 36, height: 36, objectFit: "contain" }} />
                <img
                  src={logoImg}
                  alt="Whiskora"
                  style={{ height: 26, objectFit: "contain", filter: "brightness(0) invert(1)" }}
                />
              </div>
              <p style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.4)", lineHeight: 1.8, maxWidth: 260, marginBottom: 24 }}>
                ศูนย์กลางของทุกชีวิตสัตว์เลี้ยง<br />
                <em style={{ color: "rgba(255,255,255,0.25)", fontSize: "0.8rem" }}>One platform, every pet life.</em>
              </p>

              {/* Social */}
              <div style={{ display: "flex", gap: 10 }}>
                {["📘", "📸", "🐦", "▶️"].map((icon, i) => (
                  <button
                    key={i}
                    style={{
                      width: 36, height: 36,
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: 10,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      cursor: "pointer", fontSize: 16,
                      transition: "background 0.2s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.12)"}
                    onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)"}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Link columns */}
          {Object.entries(LINKS).map(([group, links], gi) => (
            <motion.div
              key={group}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: gi * 0.1 }}
              viewport={{ once: true }}
            >
              <div style={{
                fontSize: "0.7rem", fontWeight: 700,
                color: "rgba(255,255,255,0.25)",
                letterSpacing: "0.1em", textTransform: "uppercase",
                marginBottom: 20,
              }}>
                {group}
              </div>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 12 }}>
                {links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      style={{
                        color: "rgba(255,255,255,0.45)",
                        fontSize: "0.85rem",
                        textDecoration: "none",
                        fontFamily: "'Prompt', sans-serif",
                        transition: "color 0.2s",
                      }}
                      onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.color = W.white}
                      onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.45)"}
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* Bottom bar */}
        <div style={{
          borderTop: "1px solid rgba(255,255,255,0.06)",
          paddingTop: 28,
          display: "flex", justifyContent: "space-between", alignItems: "center",
          flexWrap: "wrap", gap: 16,
        }}>
          <div style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.2)" }}>
            © 2026 Whiskora Thailand. All rights reserved.
          </div>
          <div style={{ display: "flex", gap: 24 }}>
            {["เงื่อนไขการใช้งาน", "นโยบายความเป็นส่วนตัว", "คุกกี้"].map((item) => (
              <a
                key={item}
                href="#"
                style={{
                  fontSize: "0.75rem",
                  color: "rgba(255,255,255,0.2)",
                  textDecoration: "none",
                  fontFamily: "'Prompt', sans-serif",
                  transition: "color 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.5)"}
                onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.2)"}
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
