import { useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import { ArrowRight } from "lucide-react";
import { W, IMG } from "../../homeConstants";
import logoImg from "../../../imports/Photoroom_20260428_155006-1.png";
import verifiedImg from "../../../imports/Photoroom_20260428_155413.png";

export function CtaSection() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const imageScale = useTransform(scrollYProgress, [0, 0.5, 1], [1.06, 1, 1.04]);
  const imageY = useTransform(scrollYProgress, [0, 1], ["-5%", "5%"]);

  return (
    <section
      ref={ref}
      style={{
        position: "relative",
        height: "80vh",
        minHeight: 560,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      {/* Parallax BG image */}
      <motion.div
        style={{
          position: "absolute", inset: 0,
          scale: imageScale, y: imageY,
        }}
      >
        <img
          src={IMG.womanDog}
          alt="Pet owner"
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </motion.div>

      {/* Gradient overlay */}
      <div style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(to bottom, rgba(6,9,20,0.5) 0%, rgba(6,9,20,0.75) 100%)",
      }} />

      {/* Content */}
      <div style={{
        position: "relative", zIndex: 2,
        textAlign: "center",
        padding: "0 32px",
        maxWidth: 760,
      }}>
        {/* Verified badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: W.ease }}
          viewport={{ once: true }}
          style={{
            display: "flex", justifyContent: "center", marginBottom: 28,
          }}
        >
          <div style={{
            width: 64, height: 64, borderRadius: "50%",
            overflow: "hidden",
            boxShadow: `0 8px 40px ${W.pinkGlow}`,
            border: "2px solid rgba(232,70,119,0.4)",
          }}>
            <img src={verifiedImg} alt="Whiskora Verified" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.1, ease: W.ease }}
          viewport={{ once: true }}
          style={{
            fontSize: "clamp(2.5rem, 5vw, 5.5rem)",
            fontWeight: 800, color: W.white,
            lineHeight: 1.05, letterSpacing: "-0.04em",
            marginBottom: 24,
          }}
        >
          เริ่มต้นดูแล<br />
          <span style={{ color: W.pink }}>สัตว์เลี้ยงของคุณ</span><br />
          ในแบบใหม่
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.25, ease: W.ease }}
          viewport={{ once: true }}
          style={{
            fontSize: "1.05rem", color: "rgba(255,255,255,0.65)",
            lineHeight: 1.7, marginBottom: 40,
          }}
        >
          เข้าร่วมกับเจ้าของสัตว์เลี้ยงกว่า 5,000 คนที่เลือก Whiskora
          เพื่อสร้างอนาคตที่ดีกว่าให้กับสัตว์เลี้ยงที่รัก
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4, ease: W.ease }}
          viewport={{ once: true }}
          style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}
        >
          <a
            href="#"
            style={{
              background: W.pink, color: W.white,
              borderRadius: 14, padding: "16px 40px",
              fontSize: "1.05rem", fontWeight: 700,
              textDecoration: "none",
              fontFamily: "'Prompt', sans-serif",
              boxShadow: `0 8px 40px ${W.pinkGlow}`,
              display: "inline-flex", alignItems: "center", gap: 8,
              transition: "transform 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.transform = "translateY(-4px) scale(1.02)"}
            onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.transform = "none"}
          >
            เริ่มต้นฟรี <ArrowRight size={18} />
          </a>
          <a
            href="#"
            style={{
              color: "rgba(255,255,255,0.75)",
              border: "1.5px solid rgba(255,255,255,0.25)",
              borderRadius: 14, padding: "16px 32px",
              fontSize: "1.05rem", fontWeight: 600,
              textDecoration: "none",
              fontFamily: "'Prompt', sans-serif",
              background: "rgba(255,255,255,0.06)",
              backdropFilter: "blur(8px)",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.12)";
              (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.5)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)";
              (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.25)";
            }}
          >
            ดูวิดีโอแนะนำ
          </a>
        </motion.div>

        {/* Bottom logo */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          viewport={{ once: true }}
          style={{ marginTop: 48, display: "flex", justifyContent: "center" }}
        >
          <img
            src={logoImg}
            alt="Whiskora"
            style={{
              height: 28, objectFit: "contain",
              filter: "brightness(0) invert(1)",
              opacity: 0.4,
            }}
          />
        </motion.div>
      </div>
    </section>
  );
}
