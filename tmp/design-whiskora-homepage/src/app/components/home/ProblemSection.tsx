import { motion } from "motion/react";
import { X, CheckCircle2 } from "lucide-react";
import { W, IMG } from "../../homeConstants";

const PROBLEMS = [
  { icon: "📂", title: "ข้อมูลกระจัดกระจาย", desc: "ประวัติสุขภาพ วัคซีน เอกสาร ต้องจัดการเองในหลายที่และอาจสูญหาย" },
  { icon: "❓", title: "ไม่รู้ที่มาของสัตว์เลี้ยง", desc: "ไม่มีทางยืนยันประวัติฟาร์ม พ่อแม่พันธุ์ หรือความถูกต้องของข้อมูลสุขภาพ" },
  { icon: "🔄", title: "การโอนสิทธิ์ที่ยุ่งยาก", desc: "การส่งมอบสัตว์เลี้ยงระหว่างเจ้าของไม่มีระบบรองรับ ไม่โปร่งใส ไม่ปลอดภัย" },
];

const SOLUTIONS = [
  { icon: "🪪", title: "เอกลักษณ์ดิจิทัล", desc: "ทุกสัตว์เลี้ยงมี Whiskora ID และ Digital ID Card พร้อม QR Code ที่ใช้ได้ตลอดชีวิต", color: W.pink },
  { icon: "🔍", title: "ตรวจสอบได้ 100%", desc: "ยืนยันฟาร์ม ประวัติสุขภาพ วัคซีน และสายพันธุ์ด้วยระบบ Verified ของ Whiskora", color: "#10B981" },
  { icon: "⚡", title: "โอนสิทธิ์ปลอดภัย", desc: "ระบบการโอนความเป็นเจ้าของแบบ Blockchain-ready ที่โปร่งใสและตรวจสอบได้", color: "#6366F1" },
];

const fadeUp = {
  initial: { opacity: 0, y: 48 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
};

export function ProblemSection() {
  return (
    <section style={{ background: W.cream, padding: "clamp(64px,10vw,120px) 0", overflow: "hidden" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 clamp(20px,4vw,48px)" }}>

        {/* Section label */}
        <motion.div
          {...fadeUp}
          transition={{ duration: 0.7 }}
          style={{ textAlign: "center", marginBottom: 80 }}
        >
          <span style={{
            fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.1em",
            color: W.pink, textTransform: "uppercase",
          }}>
            ปัญหาที่เราแก้
          </span>
          <h2 style={{
            fontSize: "clamp(2.2rem, 3.5vw, 4rem)",
            fontWeight: 800,
            color: W.ink,
            marginTop: 12, lineHeight: 1.1,
            letterSpacing: "-0.035em",
          }}>
            ชีวิตสัตว์เลี้ยงของคุณ<br />
            <span style={{ color: W.pink }}>สมควรได้รับมากกว่านี้</span>
          </h2>
        </motion.div>

        {/* Problem cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4" style={{ marginBottom: 80 }}
        >
          {PROBLEMS.map(({ icon, title, desc }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 48 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: i * 0.12, ease: W.ease }}
              viewport={{ once: true, margin: "-40px" }}
              style={{
                background: W.white,
                borderRadius: 24,
                padding: "32px 28px",
                border: `1px solid ${W.border}`,
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div style={{
                position: "absolute", top: 20, right: 20,
                width: 28, height: 28, borderRadius: "50%",
                background: "#FEF2F2",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <X size={14} color="#EF4444" />
              </div>
              <div style={{ fontSize: 40, marginBottom: 18 }}>{icon}</div>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: W.ink, marginBottom: 10 }}>{title}</h3>
              <p style={{ fontSize: "0.88rem", color: W.muted, lineHeight: 1.7 }}>{desc}</p>
            </motion.div>
          ))}
        </div>

        {/* Transition label */}
        <motion.div
          {...fadeUp}
          transition={{ duration: 0.6 }}
          style={{ textAlign: "center", marginBottom: 48 }}
        >
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 12,
            background: W.pinkBg,
            border: `1px solid rgba(232,70,119,0.2)`,
            borderRadius: 100, padding: "10px 24px",
          }}>
            <div style={{ width: 20, height: 20, borderRadius: "50%", background: W.pink, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <CheckCircle2 size={12} color={W.white} />
            </div>
            <span style={{ fontSize: "0.85rem", fontWeight: 700, color: W.pink }}>
              Whiskora แก้ปัญหาเหล่านี้ทั้งหมด
            </span>
          </div>
        </motion.div>

        {/* Solution cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          {SOLUTIONS.map(({ icon, title, desc, color }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 48, scale: 0.96 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.7, delay: i * 0.12, ease: W.ease }}
              viewport={{ once: true, margin: "-40px" }}
              style={{
                background: W.dark,
                borderRadius: 24,
                padding: "32px 28px",
                border: "1px solid rgba(255,255,255,0.06)",
                position: "relative",
                overflow: "hidden",
              }}
            >
              {/* Glow */}
              <div style={{
                position: "absolute", top: -40, right: -40,
                width: 160, height: 160, borderRadius: "50%",
                background: `radial-gradient(circle, ${color}20 0%, transparent 70%)`,
              }} />
              <div style={{ fontSize: 40, marginBottom: 18 }}>{icon}</div>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: W.white, marginBottom: 10 }}>{title}</h3>
              <p style={{ fontSize: "0.88rem", color: "rgba(255,255,255,0.5)", lineHeight: 1.7 }}>{desc}</p>
              <div style={{
                marginTop: 20,
                display: "inline-flex", alignItems: "center", gap: 6,
                fontSize: "0.72rem", fontWeight: 700, color: color,
              }}>
                <CheckCircle2 size={13} />
                ยืนยันแล้ว
              </div>
            </motion.div>
          ))}
        </div>

        {/* Pet photo strip */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: W.ease }}
          viewport={{ once: true }}
          className="hidden md:grid" style={{ marginTop: 80, borderRadius: 32, overflow: "hidden", height: 280, position: "relative", gridTemplateColumns: "1fr 1fr 1fr", gap: 3 }}
        >
          {[IMG.womanHug, IMG.tabbyCat, IMG.grooming].map((src, i) => (
            <div key={i} style={{ overflow: "hidden", position: "relative" }}>
              <motion.img
                src={src}
                alt=""
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.6 }}
              />
              <div style={{
                position: "absolute", inset: 0,
                background: "linear-gradient(to top, rgba(6,9,20,0.4) 0%, transparent 60%)",
              }} />
            </div>
          ))}
        </motion.div>

      </div>
    </section>
  );
}
