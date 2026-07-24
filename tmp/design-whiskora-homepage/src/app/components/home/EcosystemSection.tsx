import { motion } from "motion/react";
import { W } from "../../homeConstants";
import pawImg from "../../../imports/Photoroom_20260428_155346.png";

const NODES = [
  { angle: 0,   label: "เจ้าของ",  icon: "👤", color: "#6366F1" },
  { angle: 60,  label: "ฟาร์ม",    icon: "🏡", color: W.pink },
  { angle: 120, label: "คลินิก",   icon: "🏥", color: "#10B981" },
  { angle: 180, label: "ร้านค้า",  icon: "🛒", color: "#F59E0B" },
  { angle: 240, label: "คอมมูนิตี้", icon: "💬", color: "#EC4899" },
  { angle: 300, label: "บริการ",   icon: "✂️", color: "#8B5CF6" },
];

const R = 180;
const CX = 300;
const CY = 260;

function toXY(angle: number, r: number) {
  const rad = (angle * Math.PI) / 180;
  return { x: CX + r * Math.cos(rad), y: CY - r * Math.sin(rad) };
}

export function EcosystemSection() {
  return (
    <section style={{ background: "#06070F", padding: "clamp(64px,10vw,120px) 0", overflow: "hidden" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 clamp(20px,4vw,48px)" }}>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          style={{ textAlign: "center", marginBottom: 80 }}
        >
          <span style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.1em", color: W.pink, textTransform: "uppercase" }}>
            Ecosystem
          </span>
          <h2 style={{
            fontSize: "clamp(2.2rem, 3.5vw, 4rem)",
            fontWeight: 800, color: W.white,
            marginTop: 12, lineHeight: 1.1, letterSpacing: "-0.035em",
          }}>
            สัตว์เลี้ยงของคุณ<br />
            <span style={{ color: W.pink }}>อยู่ตรงกลางทุกอย่าง</span>
          </h2>
          <p style={{ fontSize: "1rem", color: "rgba(255,255,255,0.45)", marginTop: 16, maxWidth: 520, margin: "16px auto 0" }}>
            Whiskora เชื่อมต่อทุกคนในชีวิตสัตว์เลี้ยงเข้าด้วยกัน
            ในระบบนิเวศดิจิทัลที่สมบูรณ์
          </p>
        </motion.div>

        {/* Visualization */}
        <div style={{ display: "flex", alignItems: "center", gap: "clamp(32px,6vw,80px)", flexWrap: "wrap", justifyContent: "center" }}>

          {/* SVG Network — hidden on mobile */}
          <motion.div
            className="hidden lg:block"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: W.ease }}
            viewport={{ once: true }}
            style={{ flex: "0 0 auto" }}
          >
            <svg width={600} height={520} viewBox="0 0 600 520" style={{ overflow: "visible" }}>
              {/* Subtle grid rings */}
              {[80, 140, 200].map((r) => (
                <circle
                  key={r}
                  cx={CX} cy={CY} r={r}
                  fill="none"
                  stroke="rgba(255,255,255,0.03)"
                  strokeWidth={1}
                />
              ))}

              {/* Connection lines */}
              {NODES.map(({ angle, color }, i) => {
                const { x, y } = toXY(angle, R - 28);
                return (
                  <motion.path
                    key={i}
                    d={`M ${CX},${CY} L ${x},${y}`}
                    stroke={color}
                    strokeWidth={1.5}
                    strokeOpacity={0.4}
                    fill="none"
                    initial={{ pathLength: 0 }}
                    whileInView={{ pathLength: 1 }}
                    transition={{ duration: 1, delay: 0.3 + i * 0.12, ease: "easeOut" }}
                    viewport={{ once: true }}
                  />
                );
              })}

              {/* Center: Pet node */}
              <motion.g
                initial={{ opacity: 0, scale: 0 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                viewport={{ once: true }}
              >
                {/* Outer glow ring */}
                <circle cx={CX} cy={CY} r={54} fill={`${W.pink}10`} />
                <circle cx={CX} cy={CY} r={46} fill={`${W.pink}18`} />
                <circle cx={CX} cy={CY} r={38} fill={W.dark} />
                <image
                  href={pawImg}
                  x={CX - 26} y={CY - 26}
                  width={52} height={52}
                  style={{ borderRadius: "50%" }}
                />
              </motion.g>

              {/* Surrounding nodes */}
              {NODES.map(({ angle, label, icon, color }, i) => {
                const { x, y } = toXY(angle, R);
                return (
                  <motion.g
                    key={i}
                    initial={{ opacity: 0, scale: 0 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, delay: 0.5 + i * 0.1 }}
                    viewport={{ once: true }}
                  >
                    {/* Node circle */}
                    <circle cx={x} cy={y} r={36} fill={W.darkCard} stroke={color} strokeWidth={1.5} strokeOpacity={0.6} />
                    {/* Icon */}
                    <text x={x} y={y - 4} textAnchor="middle" fontSize={20} dominantBaseline="middle">
                      {icon}
                    </text>
                    {/* Label */}
                    <text
                      x={x}
                      y={y + (angle < 60 || angle > 300 ? 54 : angle >= 60 && angle <= 120 ? -54 : angle >= 240 && angle <= 300 ? 54 : 54)}
                      textAnchor="middle"
                      fontSize={11}
                      fontWeight={600}
                      fill="rgba(255,255,255,0.6)"
                      fontFamily="'Prompt', sans-serif"
                    >
                      {label}
                    </text>
                  </motion.g>
                );
              })}
            </svg>
          </motion.div>

          {/* Text + features */}
          <div style={{ flex: "1 1 320px", maxWidth: 420 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {NODES.map(({ label, icon, color }, i) => (
                <motion.div
                  key={label}
                  initial={{ opacity: 0, x: 40 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: i * 0.1, ease: W.ease }}
                  viewport={{ once: true }}
                  style={{
                    display: "flex", alignItems: "center", gap: 16,
                    padding: "14px 16px",
                    background: "rgba(255,255,255,0.03)",
                    borderRadius: 14,
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <div style={{
                    width: 40, height: 40, borderRadius: 12,
                    background: `${color}15`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 20, flexShrink: 0,
                  }}>
                    {icon}
                  </div>
                  <div>
                    <div style={{ fontSize: "0.9rem", fontWeight: 700, color: W.white }}>{label}</div>
                    <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.35)", marginTop: 2 }}>
                      เชื่อมต่อกับสัตว์เลี้ยงของคุณ
                    </div>
                  </div>
                  <div style={{
                    marginLeft: "auto",
                    width: 8, height: 8, borderRadius: "50%",
                    background: color,
                    flexShrink: 0,
                  }} />
                </motion.div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
