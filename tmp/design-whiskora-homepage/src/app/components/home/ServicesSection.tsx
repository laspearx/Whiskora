import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import { W, IMG } from "../../homeConstants";

const SERVICES = [
  {
    cat: "คลินิกสัตวแพทย์",
    icon: "🏥",
    desc: "จองนัดคลินิกออนไลน์ ดูประวัติการรักษา และรับผลตรวจผ่านแอป",
    img: IMG.vet,
    count: "200+ คลินิก",
    color: "#10B981",
  },
  {
    cat: "กรูมมิ่ง",
    icon: "✂️",
    desc: "บริการอาบน้ำ ตัดขน และดูแลความสะอาดโดยผู้เชี่ยวชาญ",
    img: IMG.grooming,
    count: "350+ ร้าน",
    color: W.pink,
  },
  {
    cat: "บอร์ดดิ้ง",
    icon: "🏠",
    desc: "ฝากสัตว์เลี้ยงกับผู้ดูแลที่ผ่านการยืนยันจาก Whiskora",
    img: IMG.womanHug,
    count: "180+ โรงแรม",
    color: "#6366F1",
  },
  {
    cat: "เทรนเนอร์",
    icon: "🎓",
    desc: "ฝึกพฤติกรรมและทักษะสัตว์เลี้ยงกับผู้ฝึกสัตว์มืออาชีพ",
    img: IMG.corgi,
    count: "80+ เทรนเนอร์",
    color: "#F59E0B",
  },
];

export function ServicesSection() {
  return (
    <section id="services" style={{ background: W.dark, padding: "clamp(64px,10vw,120px) 0", overflow: "hidden" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 clamp(20px,4vw,48px)" }}>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          style={{
            display: "flex", justifyContent: "space-between", alignItems: "flex-end",
            marginBottom: 60, flexWrap: "wrap", gap: 24,
          }}
        >
          <div>
            <span style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.1em", color: W.pink, textTransform: "uppercase" }}>
              Services
            </span>
            <h2 style={{
              fontSize: "clamp(2.2rem, 3.5vw, 4rem)",
              fontWeight: 800, color: W.white,
              marginTop: 12, lineHeight: 1.1, letterSpacing: "-0.035em",
            }}>
              บริการสัตว์เลี้ยง<br />
              <span style={{ color: W.pink }}>ครบในที่เดียว</span>
            </h2>
          </div>
          <a href="#" style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            fontSize: "0.9rem", fontWeight: 700, color: "rgba(255,255,255,0.5)",
            textDecoration: "none", fontFamily: "'Prompt', sans-serif",
            transition: "color 0.2s",
          }}
            onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.color = W.white}
            onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.5)"}
          >
            ดูบริการทั้งหมด <ArrowRight size={16} />
          </a>
        </motion.div>

        {/* Service cards — 2x2 grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5"
        >
          {SERVICES.map(({ cat, icon, desc, img, count, color }, i) => (
            <motion.div
              key={cat}
              initial={{ opacity: 0, y: 48 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: i * 0.1, ease: W.ease }}
              viewport={{ once: true, margin: "-40px" }}
              style={{
                position: "relative",
                borderRadius: 28,
                overflow: "hidden",
                height: "clamp(220px,30vw,320px)",
                cursor: "pointer",
              }}
            >
              {/* Background image */}
              <motion.img
                src={img}
                alt={cat}
                style={{
                  position: "absolute", inset: 0,
                  width: "100%", height: "100%", objectFit: "cover",
                }}
                whileHover={{ scale: 1.06 }}
                transition={{ duration: 0.7 }}
              />

              {/* Gradient overlay */}
              <div style={{
                position: "absolute", inset: 0,
                background: `linear-gradient(to top, rgba(6,9,20,0.92) 0%, rgba(6,9,20,0.4) 60%, rgba(6,9,20,0.1) 100%)`,
              }} />

              {/* Top: category chip */}
              <div style={{
                position: "absolute", top: 20, left: 20,
                background: `${color}20`,
                backdropFilter: "blur(8px)",
                border: `1px solid ${color}30`,
                borderRadius: 20, padding: "6px 14px",
                display: "flex", alignItems: "center", gap: 6,
              }}>
                <span style={{ fontSize: 14 }}>{icon}</span>
                <span style={{ fontSize: "0.72rem", fontWeight: 700, color: W.white }}>{cat}</span>
              </div>

              {/* Top right: count */}
              <div style={{
                position: "absolute", top: 20, right: 20,
                background: "rgba(13,18,37,0.7)", backdropFilter: "blur(8px)",
                borderRadius: 20, padding: "5px 12px",
                fontSize: "0.62rem", fontWeight: 700, color: color,
              }}>
                {count}
              </div>

              {/* Bottom: content */}
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "24px 24px 28px" }}>
                <p style={{
                  fontSize: "0.88rem", color: "rgba(255,255,255,0.65)",
                  lineHeight: 1.6, marginBottom: 16,
                }}>
                  {desc}
                </p>
                <a
                  href="#"
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 8,
                    fontSize: "0.85rem", fontWeight: 700, color: W.white,
                    textDecoration: "none",
                    background: `${color}18`,
                    border: `1px solid ${color}30`,
                    borderRadius: 10, padding: "8px 16px",
                    fontFamily: "'Prompt', sans-serif",
                    transition: "background 0.2s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.background = `${color}28`}
                  onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.background = `${color}18`}
                >
                  ค้นหา{cat} <ArrowRight size={14} />
                </a>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
