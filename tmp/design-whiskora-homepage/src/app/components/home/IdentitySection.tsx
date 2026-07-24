import { useRef, useState } from "react";
import { motion, useScroll, useMotionValueEvent, AnimatePresence } from "motion/react";
import { QrCode, Heart, Syringe, CreditCard, GitBranch, ChevronDown } from "lucide-react";
import { W, IMG } from "../../homeConstants";
import verifiedImg from "../../../imports/Photoroom_20260428_155413.png";

const FEATURES = [
  { id: "qr", icon: <QrCode size={20} />, emoji: "🔲", title: "QR Code ประจำตัว", desc: "สแกน QR Code เพื่อเข้าถึงข้อมูลสัตว์เลี้ยงทั้งหมดทันที ไม่ว่าจะเป็นคลินิก กรูมมิ่ง หรือสถานการณ์ฉุกเฉิน", accent: W.pink },
  { id: "profile", icon: <Heart size={20} />, emoji: "🐾", title: "โปรไฟล์สัตว์เลี้ยง", desc: "สร้างโปรไฟล์ดิจิทัลที่สมบูรณ์ รวมรูปภาพ น้ำหนัก สายพันธุ์ และข้อมูลเฉพาะตัวทุกอย่างในที่เดียว", accent: "#6366F1" },
  { id: "health", icon: <Syringe size={20} />, emoji: "💉", title: "บันทึกสุขภาพ", desc: "ติดตามวัคซีน การถ่ายพยาธิ การตรวจสุขภาพ และยาที่ใช้อย่างเป็นระบบ พร้อมแจ้งเตือนอัตโนมัติ", accent: "#10B981" },
  { id: "card", icon: <CreditCard size={20} />, emoji: "🪪", title: "Pet ID Card", desc: "บัตรประจำตัวดิจิทัลพร้อม Whiskora Verified Badge ที่สวยงามและใช้งานได้จริงในทุกสถานการณ์", accent: W.pink },
  { id: "ownership", icon: <GitBranch size={20} />, emoji: "✅", title: "ระบบการเป็นเจ้าของ", desc: "โอนสิทธิ์อย่างปลอดภัย ดูประวัติผู้ครอบครอง และยืนยันความเป็นเจ้าของด้วยระบบที่โปร่งใส", accent: "#F59E0B" },
];

/* ─── Desktop sticky version ─── */
function DesktopIdentity() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ["start start", "end end"] });
  useMotionValueEvent(scrollYProgress, "change", (v) => setActive(Math.min(4, Math.floor(v * 5))));

  return (
    <div ref={containerRef} style={{ height: "500vh", position: "relative" }}>
      <div style={{ position: "sticky", top: 0, height: "100vh", background: "#070A18", display: "flex", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse 60% 60% at ${20 + active * 12}% 50%, ${FEATURES[active].accent}10 0%, transparent 70%)`, transition: "background 0.8s ease" }} />

        {/* Feature list */}
        <div style={{ flex: "0 0 42%", display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 40px 0 clamp(24px,5vw,80px)", zIndex: 2 }}>
          <div style={{ fontSize: "0.72rem", fontWeight: 700, color: W.pink, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 16 }}>Pet Identity System</div>
          <h2 style={{ fontSize: "clamp(1.8rem,3vw,3.5rem)", fontWeight: 800, color: W.white, lineHeight: 1.1, letterSpacing: "-0.035em", marginBottom: 40 }}>
            ชีวิตสัตว์เลี้ยง<br /><span style={{ color: FEATURES[active].accent, transition: "color 0.4s" }}>ครบในที่เดียว</span>
          </h2>
          {FEATURES.map(({ id, icon, title, desc, accent }, i) => (
            <div key={id} style={{ padding: "16px 18px", borderRadius: 14, cursor: "pointer", background: active === i ? `${accent}10` : "transparent", border: `1px solid ${active === i ? `${accent}30` : "transparent"}`, transition: "all 0.4s ease", marginBottom: 4 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 38, height: 38, borderRadius: 11, background: active === i ? accent : "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center", color: active === i ? W.white : "rgba(255,255,255,0.3)", flexShrink: 0, transition: "all 0.4s" }}>
                  {icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "0.9rem", fontWeight: 700, color: active === i ? W.white : "rgba(255,255,255,0.38)", transition: "color 0.4s" }}>{title}</div>
                  {active === i && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}
                      style={{ fontSize: "0.76rem", color: "rgba(255,255,255,0.48)", marginTop: 4, lineHeight: 1.6 }}>
                      {desc}
                    </motion.div>
                  )}
                </div>
              </div>
            </div>
          ))}
          <div style={{ display: "flex", gap: 6, marginTop: 28 }}>
            {FEATURES.map((_, i) => (
              <div key={i} style={{ flex: 1, height: 3, borderRadius: 4, background: i <= active ? FEATURES[active].accent : "rgba(255,255,255,0.1)", transition: "background 0.4s" }} />
            ))}
          </div>
        </div>

        {/* Phone mockup */}
        <div style={{ flex: "0 0 58%", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
          <div style={{ position: "absolute", width: 360, height: 360, borderRadius: "50%", background: `radial-gradient(circle, ${FEATURES[active].accent}15 0%, transparent 70%)`, transition: "background 0.8s" }} />
          <div style={{ width: 260, height: 520, background: "#0A0D1A", borderRadius: 38, border: "1.5px solid rgba(255,255,255,0.12)", overflow: "hidden", position: "relative", boxShadow: "0 40px 100px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.06) inset" }}>
            <div style={{ height: 34, background: FEATURES[active].accent, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px 0 22px", transition: "background 0.5s" }}>
              <span style={{ fontSize: "0.68rem", fontWeight: 700, color: W.white }}>9:41</span>
              <div style={{ width: 13, height: 6, border: "1.5px solid rgba(255,255,255,0.8)", borderRadius: 2, display: "flex", alignItems: "center", padding: "0.5px" }}>
                <div style={{ width: "70%", height: "100%", background: W.white, borderRadius: 1 }} />
              </div>
            </div>
            <div style={{ height: "calc(100% - 34px)", position: "relative", overflow: "hidden" }}>
              <AnimatePresence mode="wait">
                <motion.div key={active} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.35 }}
                  style={{ height: "100%", background: "#0D1225", padding: "18px 14px" }}>
                  <PhoneScreen index={active} accent={FEATURES[active].accent} />
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Mobile accordion version ─── */
function MobileIdentity() {
  const [open, setOpen] = useState(0);

  return (
    <div style={{ padding: "64px 0 64px", background: "#070A18" }}>
      <div style={{ padding: "0 20px", marginBottom: 40 }}>
        <span style={{ fontSize: "0.7rem", fontWeight: 700, color: W.pink, letterSpacing: "0.1em", textTransform: "uppercase" }}>Pet Identity System</span>
        <h2 style={{ fontSize: "2.2rem", fontWeight: 800, color: W.white, lineHeight: 1.1, letterSpacing: "-0.035em", marginTop: 10 }}>
          ชีวิตสัตว์เลี้ยง<br /><span style={{ color: W.pink }}>ครบในที่เดียว</span>
        </h2>
      </div>

      {/* Phone mockup at top */}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 32 }}>
        <div style={{ width: 220, height: 420, background: "#0A0D1A", borderRadius: 32, border: "1.5px solid rgba(255,255,255,0.12)", overflow: "hidden", boxShadow: "0 24px 60px rgba(0,0,0,0.5)" }}>
          <div style={{ height: 30, background: FEATURES[open].accent, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px", transition: "background 0.4s" }}>
            <span style={{ fontSize: "0.62rem", fontWeight: 700, color: W.white }}>9:41</span>
          </div>
          <div style={{ height: "calc(100% - 30px)", background: "#0D1225", padding: "14px 12px", overflow: "hidden" }}>
            <AnimatePresence mode="wait">
              <motion.div key={open} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
                <PhoneScreen index={open} accent={FEATURES[open].accent} />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Accordion features */}
      <div style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: 8 }}>
        {FEATURES.map(({ id, icon, title, desc, accent }, i) => (
          <div
            key={id}
            style={{
              background: open === i ? `${accent}12` : "rgba(255,255,255,0.04)",
              border: `1px solid ${open === i ? `${accent}30` : "rgba(255,255,255,0.08)"}`,
              borderRadius: 16, overflow: "hidden",
              transition: "all 0.3s",
            }}
          >
            <button
              onClick={() => setOpen(i)}
              style={{
                width: "100%", display: "flex", alignItems: "center", gap: 12,
                padding: "16px", background: "none", border: "none", cursor: "pointer",
                fontFamily: "'Prompt', sans-serif", textAlign: "left",
              }}
            >
              <div style={{ width: 36, height: 36, borderRadius: 10, background: open === i ? accent : "rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", color: open === i ? W.white : "rgba(255,255,255,0.4)", flexShrink: 0, transition: "all 0.3s" }}>
                {icon}
              </div>
              <span style={{ flex: 1, fontSize: "0.9rem", fontWeight: 700, color: open === i ? W.white : "rgba(255,255,255,0.5)", transition: "color 0.3s" }}>{title}</span>
              <ChevronDown size={16} color="rgba(255,255,255,0.3)" style={{ transform: open === i ? "rotate(180deg)" : "none", transition: "transform 0.3s" }} />
            </button>
            {open === i && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} transition={{ duration: 0.3 }}
                style={{ padding: "0 16px 16px", fontSize: "0.82rem", color: "rgba(255,255,255,0.5)", lineHeight: 1.7 }}>
                {desc}
              </motion.div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function IdentitySection() {
  return (
    <section id="identity" style={{ position: "relative" }}>
      <div className="hidden md:block"><DesktopIdentity /></div>
      <div className="md:hidden"><MobileIdentity /></div>
    </section>
  );
}

/* ─── Phone screen content ─── */
function PhoneScreen({ index, accent }: { index: number; accent: string }) {
  if (index === 0) return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
      <div style={{ fontSize: "0.62rem", color: "rgba(255,255,255,0.35)", letterSpacing: "0.05em" }}>SCAN PET PROFILE</div>
      <div style={{ width: 110, height: 110, background: W.white, borderRadius: 14, padding: 10, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 8px 24px rgba(0,0,0,0.4)" }}>
        <QrCode size={90} color={W.ink} />
      </div>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: "0.9rem", fontWeight: 800, color: W.white }}>Mochi</div>
        <div style={{ fontSize: "0.62rem", color: "rgba(255,255,255,0.35)", marginTop: 2 }}>WK-2024-0042</div>
        <div style={{ marginTop: 8, fontSize: "0.58rem", color: accent, background: `${accent}15`, padding: "3px 12px", borderRadius: 20 }}>Scottish Fold · Female</div>
      </div>
    </div>
  );
  if (index === 1) return (
    <div>
      <div style={{ display: "flex", gap: 10, alignItems: "center", background: "rgba(255,255,255,0.04)", borderRadius: 12, padding: "10px", marginBottom: 12 }}>
        <img src={IMG.kittenPink} alt="" style={{ width: 40, height: 40, borderRadius: 12, objectFit: "cover" }} />
        <div>
          <div style={{ fontSize: "0.88rem", fontWeight: 800, color: W.white }}>Mochi</div>
          <div style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.35)" }}>Scottish Fold</div>
          <div style={{ marginTop: 3, fontSize: "0.55rem", fontWeight: 700, color: "#10B981", background: "rgba(16,185,129,0.12)", padding: "1px 7px", borderRadius: 20, display: "inline-block" }}>● สุขภาพดี</div>
        </div>
      </div>
      {[["สายพันธุ์", "Scottish Fold"], ["เพศ", "เมีย"], ["อายุ", "2 ปี"], ["น้ำหนัก", "3.5 กก."]].map(([k, v]) => (
        <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,0.05)", fontSize: "0.68rem" }}>
          <span style={{ color: "rgba(255,255,255,0.3)" }}>{k}</span>
          <span style={{ color: W.white, fontWeight: 600 }}>{v}</span>
        </div>
      ))}
    </div>
  );
  if (index === 2) return (
    <div>
      <div style={{ fontSize: "0.78rem", fontWeight: 800, color: W.white, marginBottom: 12 }}>💉 วัคซีน</div>
      {[{ name: "FVRCP", ok: true }, { name: "Rabies", ok: true }, { name: "FeLV", ok: false }].map((item, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          <div style={{ width: 22, height: 22, borderRadius: 6, background: item.ok ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: item.ok ? "#10B981" : "#EF4444" }} />
          </div>
          <span style={{ flex: 1, fontSize: "0.7rem", fontWeight: 600, color: W.white }}>{item.name}</span>
          <span style={{ fontSize: "0.6rem", color: item.ok ? "#10B981" : "#EF4444" }}>{item.ok ? "✓" : "⚠"}</span>
        </div>
      ))}
    </div>
  );
  if (index === 3) return (
    <div style={{ background: `linear-gradient(135deg, #C53562, ${W.pink})`, borderRadius: 18, padding: "16px 14px", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: -20, right: -20, width: 80, height: 80, borderRadius: "50%", background: "rgba(255,255,255,0.08)" }} />
      <div style={{ fontSize: "0.55rem", fontWeight: 700, color: "rgba(255,255,255,0.75)", marginBottom: 10, letterSpacing: "0.05em" }}>WHISKORA PET ID</div>
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12 }}>
        <img src={IMG.kittenPink} alt="" style={{ width: 36, height: 36, borderRadius: 10, objectFit: "cover", border: "2px solid rgba(255,255,255,0.3)" }} />
        <div>
          <div style={{ fontSize: "0.95rem", fontWeight: 800, color: W.white }}>Mochi</div>
          <div style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.7)" }}>Scottish Fold · เมีย</div>
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: "0.58rem", color: "rgba(255,255,255,0.6)", fontFamily: "monospace" }}>WK-2024-0042</div>
        <div style={{ width: 24, height: 24, borderRadius: "50%", overflow: "hidden" }}>
          <img src={verifiedImg} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>
      </div>
    </div>
  );
  return (
    <div>
      <div style={{ fontSize: "0.78rem", fontWeight: 800, color: W.white, marginBottom: 12 }}>🌿 เจ้าของ</div>
      {[{ role: "ฟาร์มต้นทาง", name: "Paws & Co.", v: true }, { role: "เจ้าของ", name: "Sarah Chen", v: false }].map(({ role, name, v }) => (
        <div key={role} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(232,70,119,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>{v ? "🏡" : "👤"}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.3)" }}>{role}</div>
            <div style={{ fontSize: "0.72rem", fontWeight: 700, color: W.white }}>{name}</div>
          </div>
          {v && <span style={{ fontSize: "0.5rem", fontWeight: 700, color: "#10B981", background: "rgba(16,185,129,0.12)", padding: "2px 6px", borderRadius: 20 }}>VERIFIED</span>}
        </div>
      ))}
    </div>
  );
}
