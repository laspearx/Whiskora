import { useState, ReactNode } from "react";
import { Home, ShoppingBag, Scissors, Users, BookOpen, Wrench } from "lucide-react";
import { C } from "../constants";

const TILES = [
  { icon: <Home size={28} />, label: "ฟาร์ม", color: C.pink, bg: C.pinkLight, desc: "ฟาร์มมาตรฐาน" },
  { icon: <ShoppingBag size={28} />, label: "ตลาดสัตว์เลี้ยง", color: C.sky, bg: C.skyLight, desc: "ซื้อ-ขาย" },
  { icon: <Scissors size={28} />, label: "บริการ", color: C.green, bg: C.greenLight, desc: "คลินิก · กรูมมิ่ง" },
  { icon: <Users size={28} />, label: "คอมมูนิตี้", color: C.purple, bg: C.purpleLight, desc: "ชุมชนคนรักสัตว์" },
  { icon: <BookOpen size={28} />, label: "ความรู้", color: C.yellow, bg: C.yellowLight, desc: "บทความ · คู่มือ" },
  { icon: <Wrench size={28} />, label: "Tools", color: "#E8784A", bg: "#FFF1EA", desc: "คำนวณ · ติดตาม" },
];

export function QuickAccess() {
  return (
    <section style={{ padding: "0 24px 64px" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
          {TILES.map(({ icon, label, color, bg, desc }) => (
            <TileCard key={label} icon={icon} label={label} color={color} bg={bg} desc={desc} />
          ))}
        </div>
      </div>
    </section>
  );
}

function TileCard({ icon, label, color, bg, desc }: {
  icon: ReactNode; label: string; color: string; bg: string; desc: string;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? color : C.white,
        border: `1.5px solid ${hovered ? color : C.borderLight}`,
        borderRadius: 20,
        padding: "24px 16px",
        cursor: "pointer",
        textAlign: "center",
        fontFamily: "'Prompt', sans-serif",
        transition: "all 0.2s ease",
        transform: hovered ? "translateY(-4px)" : "none",
        boxShadow: hovered ? `0 8px 28px ${color}33` : C.shadow,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 10,
      }}
    >
      <div style={{
        width: 56, height: 56,
        background: hovered ? "rgba(255,255,255,0.2)" : bg,
        borderRadius: 16,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: hovered ? C.white : color,
        transition: "all 0.2s",
      }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: "0.88rem", fontWeight: 700, color: hovered ? C.white : C.ink, lineHeight: 1.3 }}>{label}</div>
        <div style={{ fontSize: "0.7rem", color: hovered ? "rgba(255,255,255,0.75)" : C.grayText, marginTop: 3 }}>{desc}</div>
      </div>
    </button>
  );
}
