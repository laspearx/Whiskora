import { User, Syringe, Activity, DollarSign, GitBranch, FolderOpen, CreditCard, ArrowRight } from "lucide-react";
import { C } from "../constants";

const FEATURES = [
  { icon: <User size={22} />, label: "Pet Profile", desc: "โปรไฟล์สัตว์เลี้ยงครบถ้วน", color: C.pink, bg: C.pinkLight },
  { icon: <Syringe size={22} />, label: "Vaccine Records", desc: "ประวัติวัคซีนและการนัดหมาย", color: C.green, bg: C.greenLight },
  { icon: <Activity size={22} />, label: "Health Timeline", desc: "ติดตามสุขภาพตลอดชีวิต", color: C.sky, bg: C.skyLight },
  { icon: <DollarSign size={22} />, label: "Finance Tracker", desc: "ติดตามค่าใช้จ่ายสัตว์เลี้ยง", color: C.yellow, bg: C.yellowLight },
  { icon: <GitBranch size={22} />, label: "Pedigree", desc: "ข้อมูลสายเลือดและพันธุกรรม", color: C.purple, bg: C.purpleLight },
  { icon: <FolderOpen size={22} />, label: "Document Storage", desc: "เก็บเอกสารสำคัญทั้งหมด", color: "#E8784A", bg: "#FFF1EA" },
  { icon: <CreditCard size={22} />, label: "Digital ID Card", desc: "บัตรประจำตัวดิจิทัล + QR", color: C.ink, bg: C.surface },
];

export function MemberFeatures() {
  return (
    <section style={{ padding: "0 24px 80px" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        <div style={{
          background: `linear-gradient(135deg, ${C.ink} 0%, #3D2030 100%)`,
          borderRadius: 32,
          padding: "56px 48px",
          position: "relative",
          overflow: "hidden",
        }}>
          {/* Background decoration */}
          <div style={{
            position: "absolute", top: -80, right: -80, width: 400, height: 400,
            background: `radial-gradient(circle, ${C.pink}22 0%, transparent 70%)`,
            borderRadius: "50%",
          }} />
          <div style={{
            position: "absolute", bottom: -60, left: -40, width: 300, height: 300,
            background: `radial-gradient(circle, ${C.sky}18 0%, transparent 70%)`,
            borderRadius: "50%",
          }} />

          <div style={{ position: "relative", zIndex: 1 }}>
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 24, marginBottom: 40, flexWrap: "wrap" }}>
              <div>
                <span style={{
                  display: "inline-block",
                  background: `${C.pink}22`,
                  color: C.pink,
                  fontSize: "0.78rem",
                  fontWeight: 600,
                  padding: "5px 14px",
                  borderRadius: 100,
                  marginBottom: 14,
                  border: `1px solid ${C.pink}33`,
                }}>
                  👤 สำหรับสมาชิก
                </span>
                <h2 style={{ fontSize: "1.9rem", fontWeight: 800, color: C.white, marginBottom: 8, lineHeight: 1.2 }}>
                  ทุกสิ่งที่คุณต้องการ<br />
                  <span style={{ color: C.pink }}>ในแอปเดียว</span>
                </h2>
                <p style={{ fontSize: "0.92rem", color: "rgba(255,255,255,0.6)", maxWidth: 400, lineHeight: 1.7 }}>
                  ลงทะเบียนฟรีเพื่อเข้าถึงทุกฟีเจอร์สำหรับผู้เลี้ยงสัตว์
                </p>
              </div>
              <a href="#" style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                background: C.pink,
                color: C.white,
                borderRadius: 14,
                padding: "14px 28px",
                fontWeight: 700,
                fontSize: "1rem",
                textDecoration: "none",
                fontFamily: "'Prompt', sans-serif",
                boxShadow: `0 4px 20px ${C.pink}55`,
                whiteSpace: "nowrap",
                flexShrink: 0,
              }}>
                เริ่มใช้งานฟรี <ArrowRight size={18} />
              </a>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {FEATURES.map(({ icon, label, desc, color, bg }) => (
                <div key={label} style={{
                  background: "rgba(255,255,255,0.06)",
                  borderRadius: 18,
                  padding: "20px 18px",
                  border: "1px solid rgba(255,255,255,0.08)",
                  backdropFilter: "blur(8px)",
                  transition: "background 0.2s",
                  cursor: "pointer",
                }}
                  onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.1)"}
                  onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)"}
                >
                  <div style={{
                    width: 44, height: 44,
                    background: bg,
                    borderRadius: 13,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: color,
                    marginBottom: 12,
                    opacity: 0.95,
                  }}>
                    {icon}
                  </div>
                  <div style={{ fontSize: "0.88rem", fontWeight: 700, color: C.white, marginBottom: 4 }}>{label}</div>
                  <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.5)", lineHeight: 1.5 }}>{desc}</div>
                </div>
              ))}

              {/* Final CTA tile */}
              <div style={{
                background: `linear-gradient(135deg, ${C.pink} 0%, #C53862 100%)`,
                borderRadius: 18,
                padding: "20px 18px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                cursor: "pointer",
                boxShadow: `0 4px 20px ${C.pink}44`,
              }}>
                <div style={{ fontSize: "1.5rem", lineHeight: 1 }}>🐾</div>
                <div>
                  <div style={{ fontSize: "0.88rem", fontWeight: 700, color: C.white, marginBottom: 4 }}>และอีกมากมาย</div>
                  <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.75)" }}>ฟีเจอร์ใหม่ทุกเดือน</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
