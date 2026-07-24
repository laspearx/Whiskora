import { useRef } from "react";
import { motion } from "motion/react";
import { ArrowRight, Star } from "lucide-react";
import { W, IMG } from "../../homeConstants";
import verifiedImg from "../../../imports/Photoroom_20260428_155413.png";

const FARMS = [
  {
    name: "Paws & Co. Cattery",
    breed: "Scottish Fold · Persian",
    location: "กรุงเทพฯ",
    rating: 4.9,
    reviews: 238,
    pets: 24,
    img: IMG.tabbyCat,
    badge: true,
  },
  {
    name: "Golden Paws Farm",
    breed: "Golden Retriever · Labrador",
    location: "เชียงใหม่",
    rating: 4.8,
    reviews: 176,
    pets: 18,
    img: IMG.goldenPuppy,
    badge: true,
  },
  {
    name: "White Cloud Cattery",
    breed: "Persian · Ragdoll",
    location: "กรุงเทพฯ",
    rating: 5.0,
    reviews: 92,
    pets: 16,
    img: IMG.whitePersian,
    badge: true,
  },
  {
    name: "Corgi Kingdom",
    breed: "Pembroke Welsh Corgi",
    location: "ปทุมธานี",
    rating: 4.7,
    reviews: 114,
    pets: 12,
    img: IMG.corgi,
    badge: true,
  },
  {
    name: "Kitten Studio",
    breed: "Munchkin · British Shorthair",
    location: "กรุงเทพฯ",
    rating: 4.8,
    reviews: 88,
    pets: 20,
    img: IMG.kittenPink,
    badge: false,
  },
];

export function FarmsSection() {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <section id="farms" style={{ background: W.cream, padding: "clamp(64px,10vw,120px) 0", overflow: "hidden" }}>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
        style={{
          maxWidth: 1280, margin: "0 auto",
          padding: "0 clamp(20px,4vw,48px)",
          display: "flex", justifyContent: "space-between", alignItems: "flex-end",
          marginBottom: 56,
          flexWrap: "wrap", gap: 24,
        }}
      >
        <div>
          <span style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.1em", color: W.pink, textTransform: "uppercase" }}>
            Featured Farms
          </span>
          <h2 style={{
            fontSize: "clamp(2.2rem, 3.5vw, 4rem)",
            fontWeight: 800, color: W.ink,
            marginTop: 12, lineHeight: 1.1, letterSpacing: "-0.035em",
          }}>
            ฟาร์มคุณภาพ<br />
            <span style={{ color: W.pink }}>ที่ผ่านการยืนยัน</span>
          </h2>
        </div>
        <a
          href="#"
          style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            fontSize: "0.9rem", fontWeight: 700, color: W.pink,
            textDecoration: "none", borderBottom: `1.5px solid ${W.pink}`,
            paddingBottom: 3, fontFamily: "'Prompt', sans-serif",
          }}
        >
          ดูฟาร์มทั้งหมด <ArrowRight size={16} />
        </a>
      </motion.div>

      {/* Horizontal scroll track */}
      <div style={{ position: "relative" }}>
        {/* Gradient fades */}
        <div style={{
          position: "absolute", left: 0, top: 0, bottom: 0, width: 80,
          background: `linear-gradient(to right, ${W.cream}, transparent)`,
          zIndex: 10, pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute", right: 0, top: 0, bottom: 0, width: 80,
          background: `linear-gradient(to left, ${W.cream}, transparent)`,
          zIndex: 10, pointerEvents: "none",
        }} />

        <div
          ref={scrollRef}
          style={{
            display: "flex",
            gap: 20,
            overflowX: "auto",
            padding: "8px clamp(16px,5vw,64px) 24px",
            scrollbarWidth: "none",
            cursor: "grab",
          }}
        >
          {FARMS.map((farm, i) => (
            <FarmCard key={farm.name} farm={farm} index={i} />
          ))}
        </div>
      </div>

      {/* Scroll hint */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        viewport={{ once: true }}
        style={{
          display: "flex", justifyContent: "center",
          marginTop: 8, gap: 8,
        }}
      >
        {FARMS.map((_, i) => (
          <div
            key={i}
            style={{
              width: i === 0 ? 24 : 8,
              height: 4,
              borderRadius: 4,
              background: i === 0 ? W.pink : W.border,
              transition: "all 0.3s",
            }}
          />
        ))}
      </motion.div>
    </section>
  );
}

function FarmCard({ farm, index }: { farm: typeof FARMS[0]; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 48 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: index * 0.1, ease: W.ease }}
      viewport={{ once: true }}
      whileHover={{ y: -8 }}
      style={{
        flex: "0 0 clamp(260px,75vw,320px)",
        background: W.white,
        borderRadius: 28,
        overflow: "hidden",
        boxShadow: "0 4px 32px rgba(0,0,0,0.08)",
        border: `1px solid ${W.border}`,
        cursor: "pointer",
      }}
    >
      {/* Image */}
      <div style={{ position: "relative", height: 240, overflow: "hidden" }}>
        <motion.img
          src={farm.img}
          alt={farm.name}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.6 }}
        />
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 50%)",
        }} />

        {/* Badges on image */}
        <div style={{
          position: "absolute", top: 14, left: 14, right: 14,
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          {farm.badge && (
            <div style={{
              display: "flex", alignItems: "center", gap: 5,
              background: "rgba(10,13,26,0.7)", backdropFilter: "blur(8px)",
              borderRadius: 20, padding: "5px 10px 5px 5px",
            }}>
              <div style={{ width: 20, height: 20, borderRadius: "50%", overflow: "hidden" }}>
                <img src={verifiedImg} alt="V" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
              <span style={{ fontSize: "0.6rem", fontWeight: 700, color: W.white }}>Verified</span>
            </div>
          )}
          <div style={{
            background: "rgba(10,13,26,0.7)", backdropFilter: "blur(8px)",
            borderRadius: 20, padding: "4px 10px",
            fontSize: "0.62rem", fontWeight: 700, color: W.white,
            marginLeft: "auto",
          }}>
            📍 {farm.location}
          </div>
        </div>

        {/* Rating on image */}
        <div style={{
          position: "absolute", bottom: 12, left: 14,
          display: "flex", alignItems: "center", gap: 4,
          background: "rgba(10,13,26,0.7)", backdropFilter: "blur(8px)",
          borderRadius: 20, padding: "5px 10px",
        }}>
          <Star size={11} fill="#F59E0B" color="#F59E0B" />
          <span style={{ fontSize: "0.72rem", fontWeight: 800, color: W.white }}>{farm.rating}</span>
          <span style={{ fontSize: "0.62rem", color: "rgba(255,255,255,0.5)" }}>({farm.reviews})</span>
        </div>
      </div>

      {/* Info */}
      <div style={{ padding: "20px 22px 24px" }}>
        <h3 style={{ fontSize: "1.05rem", fontWeight: 800, color: W.ink, marginBottom: 4 }}>{farm.name}</h3>
        <p style={{ fontSize: "0.8rem", color: W.muted, marginBottom: 14 }}>{farm.breed}</p>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{
            fontSize: "0.72rem", color: W.pink, fontWeight: 700,
            background: W.pinkBg, padding: "4px 12px", borderRadius: 20,
          }}>
            {farm.pets} สัตว์เลี้ยง
          </span>
          <a
            href="#"
            style={{
              fontSize: "0.78rem", fontWeight: 700, color: W.pink,
              textDecoration: "none",
              display: "flex", alignItems: "center", gap: 4,
              fontFamily: "'Prompt', sans-serif",
            }}
          >
            ดูโปรไฟล์ <ArrowRight size={13} />
          </a>
        </div>
      </div>
    </motion.div>
  );
}
