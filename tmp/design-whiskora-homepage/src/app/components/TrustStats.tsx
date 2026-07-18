import { ShieldCheck, Heart, Leaf, Gift } from "lucide-react";
import { C } from "../constants";

const STATS = [
  { icon: <ShieldCheck size={28} />, value: "1,200+", label: "ฟาร์มคุณภาพ", color: C.pink, bg: C.pinkLight },
  { icon: <Heart size={28} />, value: "5,000+", label: "สัตว์เลี้ยงที่ลงทะเบียน", color: C.sky, bg: C.skyLight },
  { icon: <Leaf size={28} />, value: "10+", label: "ประเภทสัตว์", color: C.green, bg: C.greenLight },
  { icon: <Gift size={28} />, value: "ฟรี", label: "สำหรับผู้เลี้ยง", color: C.purple, bg: C.purpleLight },
];

export function TrustStats() {
  return (
    <section style={{ background: C.cream, padding: "0 24px 72px" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>

        {/* Stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4" style={{ marginBottom: 40 }}>
          {STATS.map(({ icon, value, label, color, bg }) => (
            <div
              key={label}
              style={{
                background: C.white,
                borderRadius: 20,
                padding: "24px 28px",
                display: "flex",
                alignItems: "center",
                gap: 16,
                boxShadow: C.shadow,
                border: `1px solid ${C.borderLight}`,
              }}
            >
              <div style={{
                width: 56, height: 56, flexShrink: 0,
                background: bg,
                borderRadius: 16,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: color,
              }}>
                {icon}
              </div>
              <div>
                <div style={{ fontSize: "1.6rem", fontWeight: 800, color: C.ink, lineHeight: 1 }}>{value}</div>
                <div style={{ fontSize: "0.82rem", color: C.grayText, marginTop: 4, fontWeight: 500 }}>{label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Trust message banner */}
        <div style={{
          background: `linear-gradient(135deg, ${C.pinkLight} 0%, ${C.skyLight} 100%)`,
          borderRadius: 24,
          padding: "36px 40px",
          display: "flex",
          alignItems: "center",
          gap: 32,
          flexWrap: "wrap",
          border: `1px solid ${C.pinkMid}`,
        }}>
          <div style={{
            width: 64, height: 64, flexShrink: 0,
            background: C.white,
            borderRadius: 20,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: C.shadow,
          }}>
            <ShieldCheck size={32} color={C.pink} />
          </div>
          <div style={{ flex: 1, minWidth: 260 }}>
            <div style={{ fontSize: "1.1rem", fontWeight: 700, color: C.ink, marginBottom: 8 }}>
              ทุกฟาร์มผ่านการยืนยันตัวตนจาก Whiskora
            </div>
            <p style={{ fontSize: "0.88rem", color: C.inkMuted, lineHeight: 1.75, margin: 0 }}>
              เรารวบรวมข้อมูลประวัติสุขภาพ ประวัติวัคซีน สายพันธุ์ และข้อมูลผู้เพาะพันธุ์
              อย่างโปร่งใส พร้อมรีวิวจากผู้ใช้จริงเพื่อให้คุณตัดสินใจได้อย่างมั่นใจ
            </p>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {["ยืนยันตัวตน", "ประวัติสุขภาพ", "รีวิวจริง"].map((tag) => (
              <span key={tag} style={{
                background: C.white,
                color: C.pink,
                fontSize: "0.78rem",
                fontWeight: 600,
                padding: "6px 14px",
                borderRadius: 100,
                border: `1px solid ${C.pinkMid}`,
                whiteSpace: "nowrap",
              }}>
                ✓ {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
