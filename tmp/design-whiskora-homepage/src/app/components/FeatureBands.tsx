import { ReactNode } from "react";
import { ShoppingCart, Stethoscope, QrCode, ArrowRight } from "lucide-react";
import { C, IMAGES } from "../constants";

const BANDS = [
  {
    id: "market",
    label: "🛒 Marketplace",
    title: "ตลาดสัตว์เลี้ยงออนไลน์",
    desc: "ซื้อขายสัตว์เลี้ยงจากฟาร์มที่ผ่านการยืนยัน พร้อมข้อมูลสายพันธุ์ สุขภาพ และประวัติสมบูรณ์ มีทั้งสัตว์เลี้ยงใหม่ สัตว์ต้องการบ้าน และอุปกรณ์ Pet",
    cta: "เข้าสู่ตลาด",
    accent: C.sky,
    accentLight: C.skyLight,
    icon: <ShoppingCart size={24} />,
    image: IMAGES.catCouch,
    reverse: false,
  },
  {
    id: "clinic",
    label: "🏥 Services",
    title: "คลินิกและบริการสัตว์เลี้ยง",
    desc: "จองนัดคลินิก บริการกรูมมิ่ง บอร์ดดิ้ง และเทรนเนอร์ผ่านแพลตฟอร์มเดียว พร้อมรีวิว ราคา และตารางนัดหมายออนไลน์",
    cta: "หาบริการใกล้ฉัน",
    accent: C.green,
    accentLight: C.greenLight,
    icon: <Stethoscope size={24} />,
    image: IMAGES.vetClinic,
    reverse: true,
  },
  {
    id: "petid",
    label: "🪪 Pet ID",
    title: "Pet ID Card พร้อม QR Code",
    desc: "สร้างบัตรประจำตัวดิจิทัลให้สัตว์เลี้ยงของคุณ บันทึกประวัติวัคซีน สุขภาพ และข้อมูลสำคัญ พร้อม QR Code ที่สแกนเพื่อเรียกดูข้อมูลได้ทันที",
    cta: "สร้าง Pet ID ฟรี",
    accent: C.purple,
    accentLight: C.purpleLight,
    icon: <QrCode size={24} />,
    image: null,
    reverse: false,
  },
];

export function FeatureBands() {
  return (
    <section style={{ padding: "0 24px 80px" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", display: "flex", flexDirection: "column", gap: 24 }}>
        {BANDS.map((band) => (
          <BandCard key={band.id} {...band} />
        ))}
      </div>
    </section>
  );
}

function BandCard({ label, title, desc, cta, accent, accentLight, icon, image, reverse }: {
  label: string; title: string; desc: string; cta: string; accent: string;
  accentLight: string; icon: ReactNode; image: string | null; reverse: boolean;
}) {
  return (
    <div style={{
      background: C.white,
      borderRadius: 28,
      overflow: "hidden",
      boxShadow: C.shadow,
      border: `1px solid ${C.borderLight}`,
    }}
      className={`flex flex-col ${reverse ? "md:flex-row-reverse" : "md:flex-row"}`}
    >
      {/* Content side */}
      <div style={{
        flex: 1,
        padding: "48px 48px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        minWidth: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <div style={{
            width: 40, height: 40,
            background: accentLight,
            borderRadius: 12,
            display: "flex", alignItems: "center", justifyContent: "center",
            color: accent,
          }}>
            {icon}
          </div>
          <span style={{ fontSize: "0.8rem", fontWeight: 600, color: accent }}>{label}</span>
        </div>

        <h3 style={{ fontSize: "1.75rem", fontWeight: 800, color: C.ink, marginBottom: 14, lineHeight: 1.2 }}>
          {title}
        </h3>
        <p style={{ fontSize: "0.92rem", color: C.grayText, lineHeight: 1.8, marginBottom: 28, maxWidth: 440 }}>
          {desc}
        </p>
        <a href="#" style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          background: accent,
          color: C.white,
          borderRadius: 12,
          padding: "12px 24px",
          fontWeight: 600,
          fontSize: "0.9rem",
          textDecoration: "none",
          fontFamily: "'Prompt', sans-serif",
          width: "fit-content",
          boxShadow: `0 4px 16px ${accent}44`,
          transition: "transform 0.2s",
        }}
          onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.transform = "translateX(4px)"}
          onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.transform = "none"}
        >
          {cta} <ArrowRight size={16} />
        </a>
      </div>

      {/* Visual side */}
      <div style={{
        flex: "0 0 420px",
        position: "relative",
        background: accentLight,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        minHeight: 240,
      }}>
        {image ? (
          <img src={image} alt={title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <PetIdMockup accent={accent} accentLight={accentLight} />
        )}
        {/* Subtle overlay for non-null images */}
        {image && (
          <div style={{
            position: "absolute",
            inset: 0,
            background: `linear-gradient(to ${reverse ? "right" : "left"}, rgba(255,250,252,0.15) 0%, transparent 50%)`,
          }} />
        )}
      </div>
    </div>
  );
}

function PetIdMockup({ accent, accentLight }: { accent: string; accentLight: string }) {
  return (
    <div style={{
      background: C.white,
      borderRadius: 24,
      padding: 24,
      width: 280,
      boxShadow: C.shadowMd,
      border: `1px solid ${C.border}`,
    }}>
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 16,
      }}>
        <div>
          <div style={{ fontSize: "0.65rem", color: C.grayText, fontWeight: 600, letterSpacing: "0.08em" }}>WHISKORA PET ID</div>
          <div style={{ fontSize: "1rem", fontWeight: 800, color: C.ink, marginTop: 4 }}>Mochi</div>
          <div style={{ fontSize: "0.75rem", color: C.grayText }}>Scottish Fold · Female · 2y</div>
        </div>
        <div style={{
          width: 56, height: 56,
          borderRadius: 16,
          background: accentLight,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 28,
        }}>
          🐱
        </div>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 8,
        marginBottom: 16,
        fontSize: "0.72rem",
      }}>
        {[
          ["วัคซีน", "ครบถ้วน ✓"],
          ["สุขภาพ", "ดีมาก ✓"],
          ["Chip ID", "#TH2024091"],
          ["ฟาร์ม", "Kitten Cloud"],
        ].map(([k, v]) => (
          <div key={k} style={{
            background: accentLight,
            borderRadius: 10,
            padding: "8px 10px",
          }}>
            <div style={{ color: C.grayText, fontSize: "0.65rem" }}>{k}</div>
            <div style={{ color: C.ink, fontWeight: 600, fontSize: "0.75rem" }}>{v}</div>
          </div>
        ))}
      </div>

      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        paddingTop: 12,
        borderTop: `1px solid ${C.borderLight}`,
      }}>
        <div style={{ fontSize: "0.68rem", color: C.grayText }}>สแกน QR เพื่อดูข้อมูล</div>
        <div style={{
          width: 48, height: 48,
          background: C.ink,
          borderRadius: 10,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <QrCode size={28} color={C.white} />
        </div>
      </div>
    </div>
  );
}
