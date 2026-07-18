import { Users, Settings, BadgeCheck, TrendingUp, Gift, ArrowRight } from "lucide-react";
import { C } from "../constants";

const PARTNER_TYPES = ["ฟาร์ม", "ร้านขายสัตว์เลี้ยง", "คลินิกสัตวแพทย์", "กรูมมิ่ง", "บอร์ดดิ้ง", "เทรนเนอร์"];

const BENEFITS = [
  { icon: <Users size={20} />, title: "เข้าถึงลูกค้าที่รักสัตว์", desc: "เชื่อมต่อกับฐานผู้ใช้หลักแสนคนที่มองหาบริการและสัตว์เลี้ยง" },
  { icon: <Settings size={20} />, title: "ระบบจัดการธุรกิจ", desc: "แดชบอร์ด CRM การจัดการนัดหมาย และรายงานสถิติครบครัน" },
  { icon: <BadgeCheck size={20} />, title: "โปรไฟล์พร้อม Verified Badge", desc: "สร้างความน่าเชื่อถือด้วย badge ยืนยันตัวตนจาก Whiskora" },
  { icon: <TrendingUp size={20} />, title: "โปรโมทผ่านแพลตฟอร์ม", desc: "การค้นพบแบบ organic และโอกาสโฆษณาตรงกลุ่มเป้าหมาย" },
  { icon: <Gift size={20} />, title: "ฟรีในช่วง Genesis Program", desc: "สมัครเลยเพื่อรับสิทธิ์ Genesis Partner ฟรีตลอดช่วง beta" },
];

export function PartnerSection() {
  return (
    <section style={{ padding: "0 24px 80px" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        <div style={{
          background: `linear-gradient(135deg, #1A0F13 0%, #2D1520 50%, #1A0F13 100%)`,
          borderRadius: 32,
          padding: "64px 56px",
          position: "relative",
          overflow: "hidden",
        }}>
          {/* Background texture blobs */}
          <div style={{
            position: "absolute", top: -100, right: -100, width: 500, height: 500,
            background: `radial-gradient(circle, ${C.pink}18 0%, transparent 65%)`,
            borderRadius: "50%",
          }} />
          <div style={{
            position: "absolute", bottom: -80, left: -60, width: 400, height: 400,
            background: `radial-gradient(circle, ${C.purple}15 0%, transparent 65%)`,
            borderRadius: "50%",
          }} />
          <div style={{
            position: "absolute", top: "40%", left: "40%",
            width: 300, height: 300,
            background: `radial-gradient(circle, ${C.sky}10 0%, transparent 70%)`,
            borderRadius: "50%",
          }} />

          <div style={{ position: "relative", zIndex: 1 }}>
            {/* Header */}
            <div style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: 40,
              marginBottom: 48,
              flexWrap: "wrap",
            }}>
              <div style={{ flex: 1, minWidth: 280 }}>
                <span style={{
                  display: "inline-block",
                  background: `${C.pink}22`,
                  color: C.pink,
                  fontSize: "0.78rem",
                  fontWeight: 600,
                  padding: "5px 14px",
                  borderRadius: 100,
                  marginBottom: 16,
                  border: `1px solid ${C.pink}33`,
                }}>
                  🤝 Partner Program
                </span>
                <h2 style={{ fontSize: "2.1rem", fontWeight: 800, color: C.white, lineHeight: 1.2, marginBottom: 12 }}>
                  ร่วมเป็นพาร์ทเนอร์<br />
                  <span style={{ color: C.pink }}>กับ Whiskora</span>
                </h2>
                <p style={{ fontSize: "0.95rem", color: "rgba(255,255,255,0.55)", lineHeight: 1.75, maxWidth: 440 }}>
                  เปิดรับธุรกิจที่เกี่ยวข้องกับสัตว์เลี้ยงทุกประเภท
                  เข้าร่วมได้เลยในช่วง Genesis Program ฟรี
                </p>
              </div>

              {/* Partner type pills */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "flex-end" }}>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
                  {PARTNER_TYPES.map((type) => (
                    <span key={type} style={{
                      background: "rgba(255,255,255,0.08)",
                      color: "rgba(255,255,255,0.7)",
                      fontSize: "0.78rem",
                      fontWeight: 500,
                      padding: "6px 14px",
                      borderRadius: 20,
                      border: "1px solid rgba(255,255,255,0.12)",
                      whiteSpace: "nowrap",
                    }}>
                      {type}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Benefits grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4" style={{ marginBottom: 40 }}>
              {BENEFITS.map(({ icon, title, desc }) => (
                <div key={title} style={{
                  background: "rgba(255,255,255,0.05)",
                  borderRadius: 18,
                  padding: "24px",
                  border: "1px solid rgba(255,255,255,0.08)",
                  transition: "background 0.2s",
                  cursor: "pointer",
                }}
                  onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.09)"}
                  onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.05)"}
                >
                  <div style={{
                    width: 44, height: 44,
                    background: `${C.pink}22`,
                    borderRadius: 12,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: C.pink,
                    marginBottom: 14,
                  }}>
                    {icon}
                  </div>
                  <div style={{ fontSize: "0.92rem", fontWeight: 700, color: C.white, marginBottom: 6 }}>{title}</div>
                  <div style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.45)", lineHeight: 1.65 }}>{desc}</div>
                </div>
              ))}
            </div>

            {/* CTA row */}
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 24,
              flexWrap: "wrap",
              paddingTop: 32,
              borderTop: "1px solid rgba(255,255,255,0.08)",
            }}>
              <div>
                <div style={{ fontSize: "0.88rem", color: "rgba(255,255,255,0.4)", marginBottom: 4 }}>
                  Genesis Program — ลงทะเบียนก่อนได้สิทธิ์พิเศษ
                </div>
                <div style={{ fontSize: "0.8rem", color: C.pink }}>
                  🎁 ฟรีตลอดช่วง beta · ไม่มีบัตรเครดิต
                </div>
              </div>
              <a href="#" style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                background: C.pink,
                color: C.white,
                borderRadius: 14,
                padding: "14px 32px",
                fontWeight: 700,
                fontSize: "1rem",
                textDecoration: "none",
                fontFamily: "'Prompt', sans-serif",
                boxShadow: `0 4px 24px ${C.pink}55`,
                whiteSpace: "nowrap",
              }}>
                สมัครเป็นพาร์ทเนอร์ <ArrowRight size={18} />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
