import { useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import { ArrowDown, QrCode, Activity } from "lucide-react";
import { W, IMG } from "../../homeConstants";
import verifiedImg from "../../../imports/Photoroom_20260428_155413.png";
import pawImg from "../../../imports/Photoroom_20260428_155346.png";
import logoImg from "../../../imports/Photoroom_20260428_155006-1.png";

export function HeroSection() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const imageY = useTransform(scrollYProgress, [0, 1], ["0%", "20%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.75], [1, 0]);

  return (
    <section
      ref={ref}
      style={{
        height: "100svh",
        minHeight: 600,
        position: "relative",
        overflow: "hidden",
        background: W.dark,
        display: "flex",
        alignItems: "center",
      }}
    >
      {/* Full-bleed parallax image — always covers full section */}
      <motion.div style={{ position: "absolute", inset: "-15% 0 -15% 0", y: imageY, zIndex: 0 }}>
        <img
          src={IMG.heroMain}
          alt="Pet owner"
          style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 30%" }}
        />
      </motion.div>

      {/* Gradient overlay — stronger on mobile center, lighter left on desktop */}
      <div style={{
        position: "absolute", inset: 0, zIndex: 1,
        background: "linear-gradient(to bottom, rgba(6,9,20,0.55) 0%, rgba(6,9,20,0.75) 100%)",
      }} />
      <div className="hidden md:block" style={{
        position: "absolute", inset: 0, zIndex: 1,
        background: "linear-gradient(to right, rgba(6,9,20,0.92) 0%, rgba(6,9,20,0.6) 52%, rgba(6,9,20,0.15) 100%)",
      }} />

      {/* Content — full width on mobile, 55% on desktop */}
      <motion.div
        style={{
          position: "relative", zIndex: 10,
          width: "100%",
          padding: "0 clamp(20px, 5vw, 80px)",
          y: opacity,
        }}
      >
        <div style={{ maxWidth: 640 }} className="mx-auto md:mx-0">

          {/* Logo on mobile only */}
          <motion.div
            className="flex md:hidden"
            style={{ justifyContent: "center", marginBottom: 24 }}
            initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <img
              src={logoImg}
              alt="Whiskora"
              style={{ height: 28, objectFit: "contain", filter: "brightness(0) invert(1)" }}
            />
          </motion.div>

          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3, ease: W.ease }}
            style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20, justifyContent: "center" }}
            className="justify-center md:justify-start"
          >
            <img src={pawImg} alt="" style={{ width: 22, height: 22, objectFit: "contain" }} />
            <span style={{
              fontSize: "0.72rem", fontWeight: 600, color: "rgba(255,255,255,0.6)",
              letterSpacing: "0.1em", textTransform: "uppercase",
            }}>
              Pet Identity & Ecosystem Platform
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.45, ease: W.ease }}
            style={{
              fontSize: "clamp(2.8rem, 8vw, 6.5rem)",
              fontWeight: 800,
              color: W.white,
              lineHeight: 1.04,
              letterSpacing: "-0.04em",
              marginBottom: 20,
              textAlign: "center",
            }}
            className="text-center md:text-left"
          >
            ทุกชีวิต<br />
            <span style={{ color: W.pink }}>สัตว์เลี้ยง</span><br />
            มีตัวตน
          </motion.h1>

          {/* Sub */}
          <motion.p
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.65, ease: W.ease }}
            style={{
              fontSize: "clamp(0.9rem, 2.5vw, 1.05rem)",
              color: "rgba(255,255,255,0.65)",
              lineHeight: 1.8, marginBottom: 32,
              textAlign: "center",
            }}
            className="text-center md:text-left md:max-w-xl"
          >
            Whiskora สร้างระบบเอกลักษณ์ดิจิทัลสำหรับสัตว์เลี้ยงทุกตัว
            พร้อมระบบนิเวศที่เชื่อมต่อเจ้าของ ฟาร์ม คลินิก และทุกคนในชีวิตสัตว์เลี้ยง
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.8, ease: W.ease }}
            style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}
            className="justify-center md:justify-start"
          >
            <a
              href="#"
              style={{
                background: W.pink, color: W.white,
                borderRadius: 14, padding: "14px 32px",
                fontSize: "clamp(0.9rem, 2.5vw, 1rem)", fontWeight: 700,
                textDecoration: "none", fontFamily: "'Prompt', sans-serif",
                boxShadow: `0 6px 32px ${W.pinkGlow}`,
                display: "inline-flex", alignItems: "center", gap: 8,
                whiteSpace: "nowrap", transition: "transform 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.transform = "translateY(-3px)"}
              onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.transform = "none"}
            >
              เริ่มต้นฟรี
            </a>
            <a
              href="#identity"
              style={{
                color: "rgba(255,255,255,0.85)",
                border: "1.5px solid rgba(255,255,255,0.25)",
                borderRadius: 14, padding: "14px 24px",
                fontSize: "clamp(0.9rem, 2.5vw, 1rem)", fontWeight: 600,
                textDecoration: "none", fontFamily: "'Prompt', sans-serif",
                background: "rgba(255,255,255,0.06)",
                backdropFilter: "blur(8px)",
                whiteSpace: "nowrap",
              }}
            >
              ดูฟีเจอร์
            </a>
          </motion.div>

          {/* Trust row */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1.0 }}
            style={{ display: "flex", justifyContent: "center", gap: 28, marginTop: 36 }}
            className="justify-center md:justify-start"
          >
            {[
              { n: "1,200+", label: "ฟาร์มยืนยัน" },
              { n: "5,000+", label: "สัตว์เลี้ยง" },
              { n: "100%", label: "ปลอดภัย" },
            ].map(({ n, label }) => (
              <div key={label} style={{ textAlign: "center" }}>
                <div style={{ fontSize: "clamp(1rem, 3vw, 1.2rem)", fontWeight: 800, color: W.white }}>{n}</div>
                <div style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.4)", marginTop: 2 }}>{label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </motion.div>

      {/* Floating cards — desktop only */}
      <motion.div
        className="hidden lg:block"
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, delay: 1.2, ease: W.ease }}
        style={{
          position: "absolute", bottom: "22%", right: "6%", zIndex: 10,
          background: "rgba(13,18,37,0.85)", backdropFilter: "blur(20px)",
          borderRadius: 20, padding: "16px 20px",
          border: "1px solid rgba(255,255,255,0.1)",
          minWidth: 200, boxShadow: "0 24px 64px rgba(0,0,0,0.4)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: W.pink, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <QrCode size={18} color={W.white} />
          </div>
          <div>
            <div style={{ fontSize: "0.62rem", color: "rgba(255,255,255,0.45)", fontWeight: 600 }}>WHISKORA ID</div>
            <div style={{ fontSize: "0.85rem", fontWeight: 800, color: W.white }}>WK-2024-0042</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <img
            src="https://images.unsplash.com/photo-1515002246390-7bf7e8f87b54?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=80&w=60&h=60"
            alt="Mochi"
            style={{ width: 36, height: 36, borderRadius: 10, objectFit: "cover" }}
          />
          <div>
            <div style={{ fontSize: "0.8rem", fontWeight: 700, color: W.white }}>Mochi</div>
            <div style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.5)" }}>Scottish Fold · Female</div>
          </div>
        </div>
      </motion.div>

      <motion.div
        className="hidden lg:block"
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, delay: 1.4, ease: W.ease }}
        style={{
          position: "absolute", top: "22%", right: "4%", zIndex: 10,
          background: "rgba(13,18,37,0.85)", backdropFilter: "blur(20px)",
          borderRadius: 16, padding: "14px 18px",
          border: "1px solid rgba(255,255,255,0.1)",
          boxShadow: "0 16px 48px rgba(0,0,0,0.35)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(16,185,129,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Activity size={16} color="#10B981" />
          </div>
          <div>
            <div style={{ fontSize: "0.62rem", color: "rgba(255,255,255,0.45)" }}>สถานะสุขภาพ</div>
            <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#10B981" }}>● สุขภาพดี</div>
          </div>
        </div>
        <div style={{ background: "rgba(16,185,129,0.08)", borderRadius: 8, padding: "5px 10px", fontSize: "0.66rem", color: "rgba(255,255,255,0.45)" }}>
          วัคซีนครบ · ตรวจล่าสุด 15 เม.ย.
        </div>
      </motion.div>

      <motion.div
        className="hidden lg:flex"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.7, delay: 1.6 }}
        style={{
          position: "absolute", top: "46%", right: "4%", zIndex: 10,
          flexDirection: "column", alignItems: "center", gap: 6,
        }}
      >
        <div style={{ width: 56, height: 56, borderRadius: "50%", overflow: "hidden", boxShadow: `0 8px 32px ${W.pinkGlow}`, border: `2px solid rgba(232,70,119,0.5)` }}>
          <img src={verifiedImg} alt="Whiskora Verified" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>
        <span style={{ fontSize: "0.6rem", fontWeight: 700, color: W.pink, background: "rgba(232,70,119,0.12)", padding: "3px 10px", borderRadius: 20, border: "1px solid rgba(232,70,119,0.2)" }}>
          VERIFIED
        </span>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        style={{ position: "absolute", bottom: 28, left: "50%", transform: "translateX(-50%)", display: "flex", flexDirection: "column", alignItems: "center", gap: 6, zIndex: 20 }}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        transition={{ delay: 1.8, duration: 0.6 }}
      >
        <span style={{ fontSize: "0.62rem", color: "rgba(255,255,255,0.35)", letterSpacing: "0.12em", fontFamily: "'Prompt', sans-serif" }}>SCROLL</span>
        <motion.div animate={{ y: [0, 7, 0] }} transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}>
          <ArrowDown size={16} color="rgba(255,255,255,0.3)" />
        </motion.div>
      </motion.div>
    </section>
  );
}
