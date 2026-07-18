import { ReactNode } from "react";
import { MapPin, Syringe, BookOpen, Star, RefreshCw, BadgeCheck, ArrowRight } from "lucide-react";
import { C, IMAGES } from "../constants";

const FEATURES = [
  { icon: <MapPin size={22} />, title: "ยืนยันตัวตนและสถานที่", desc: "ข้อมูลผู้เพาะพันธุ์และที่อยู่ฟาร์มผ่านการยืนยันจริง", color: C.pink, bg: C.pinkLight },
  { icon: <Syringe size={22} />, title: "ประวัติสุขภาพและวัคซีน", desc: "บันทึกวัคซีน การตรวจสุขภาพ ครบถ้วนและเปิดเผย", color: C.green, bg: C.greenLight },
  { icon: <BookOpen size={22} />, title: "ข้อมูลสายพันธุ์โปร่งใส", desc: "ข้อมูลพันธุกรรม ประวัติสายเลือด Pedigree ครบ", color: C.sky, bg: C.skyLight },
  { icon: <Star size={22} />, title: "รีวิวจากผู้ใช้จริง", desc: "รีวิวและคะแนนจากผู้ซื้อที่ผ่านการยืนยัน", color: C.yellow, bg: C.yellowLight },
  { icon: <RefreshCw size={22} />, title: "ติดตามหลังการซื้อ", desc: "ช่องทางติดต่อและรับประกันหลังซื้อจากฟาร์ม", color: C.purple, bg: C.purpleLight },
  { icon: <BadgeCheck size={22} />, title: "Verified Badge", desc: "แสดงสถานะ Verified อย่างชัดเจนบนโปรไฟล์ฟาร์ม", color: C.pink, bg: C.pinkLight },
];

export function FarmHub() {
  return (
    <section style={{ padding: "0 24px 80px" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>

        <div style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: 16,
          marginBottom: 40,
          flexWrap: "wrap",
        }}>
          <div>
            <span style={{
              display: "inline-block",
              background: C.pinkLight,
              color: C.pink,
              fontSize: "0.78rem",
              fontWeight: 600,
              padding: "5px 14px",
              borderRadius: 100,
              marginBottom: 12,
              border: `1px solid ${C.pinkMid}`,
            }}>
              🏡 Farm Hub
            </span>
            <h2 style={{ fontSize: "2rem", fontWeight: 800, color: C.ink, marginBottom: 8, lineHeight: 1.2 }}>
              ฟาร์มสัตว์เลี้ยงมาตรฐาน
            </h2>
            <p style={{ fontSize: "0.95rem", color: C.grayText, maxWidth: 540, lineHeight: 1.7 }}>
              Whiskora รวบรวมฟาร์มและผู้เพาะพันธุ์ที่ผ่านการยืนยัน
              พร้อมข้อมูลครบถ้วนเพื่อความไว้วางใจของคุณ
            </p>
          </div>
          <a href="#" style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            background: C.pink,
            color: C.white,
            border: "none",
            borderRadius: 12,
            padding: "12px 24px",
            fontWeight: 600,
            fontSize: "0.9rem",
            cursor: "pointer",
            textDecoration: "none",
            fontFamily: "'Prompt', sans-serif",
            boxShadow: `0 4px 16px ${C.pinkMid}`,
            whiteSpace: "nowrap",
            flexShrink: 0,
          }}>
            ค้นหาฟาร์มทั้งหมด <ArrowRight size={16} />
          </a>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {FEATURES.map(({ icon, title, desc, color, bg }) => (
            <FeatureCard key={title} icon={icon} title={title} desc={desc} color={color} bg={bg} />
          ))}
        </div>

        {/* Farm image preview cards */}
        <div className="hidden md:grid grid-cols-3 gap-4" style={{ marginTop: 32 }}>
          {[
            { img: IMAGES.goldenSnow, name: "Golden Paws Farm", breed: "Golden Retriever", rating: "4.9", reviews: "238 รีวิว" },
            { img: IMAGES.catTabby, name: "Tabby Kingdom", breed: "Scottish Fold · Munchkin", rating: "4.8", reviews: "179 รีวิว" },
            { img: IMAGES.kittenPortrait, name: "Kitten Cloud", breed: "Persian · Ragdoll", rating: "5.0", reviews: "92 รีวิว" },
          ].map(({ img, name, breed, rating, reviews }) => (
            <div key={name} style={{
              background: C.white,
              borderRadius: 20,
              overflow: "hidden",
              boxShadow: C.shadow,
              border: `1px solid ${C.borderLight}`,
              cursor: "pointer",
              transition: "transform 0.2s, box-shadow 0.2s",
            }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.transform = "translateY(-4px)";
                (e.currentTarget as HTMLElement).style.boxShadow = C.shadowMd;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.transform = "none";
                (e.currentTarget as HTMLElement).style.boxShadow = C.shadow;
              }}
            >
              <div style={{ position: "relative" }}>
                <img src={img} alt={name} style={{ width: "100%", height: 180, objectFit: "cover", display: "block" }} />
                <div style={{
                  position: "absolute", top: 12, right: 12,
                  background: C.white,
                  borderRadius: 20,
                  padding: "4px 10px",
                  display: "flex", alignItems: "center", gap: 4,
                  fontSize: "0.75rem", fontWeight: 700, color: C.ink,
                  boxShadow: C.shadow,
                }}>
                  ⭐ {rating}
                </div>
                <div style={{
                  position: "absolute", top: 12, left: 12,
                  background: C.green,
                  borderRadius: 20,
                  padding: "4px 10px",
                  fontSize: "0.68rem", fontWeight: 700, color: C.white,
                }}>
                  ✓ Verified
                </div>
              </div>
              <div style={{ padding: "16px 18px" }}>
                <div style={{ fontSize: "0.95rem", fontWeight: 700, color: C.ink }}>{name}</div>
                <div style={{ fontSize: "0.78rem", color: C.grayText, marginTop: 2 }}>{breed}</div>
                <div style={{ fontSize: "0.75rem", color: C.grayText, marginTop: 6 }}>{reviews}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeatureCard({ icon, title, desc, color, bg }: {
  icon: ReactNode; title: string; desc: string; color: string; bg: string;
}) {
  return (
    <div style={{
      background: C.white,
      borderRadius: 18,
      padding: "22px 24px",
      display: "flex",
      gap: 16,
      boxShadow: C.shadow,
      border: `1px solid ${C.borderLight}`,
      alignItems: "flex-start",
    }}>
      <div style={{
        width: 48, height: 48, flexShrink: 0,
        background: bg,
        borderRadius: 14,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: color,
      }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: "0.9rem", fontWeight: 700, color: C.ink, marginBottom: 4 }}>{title}</div>
        <div style={{ fontSize: "0.8rem", color: C.grayText, lineHeight: 1.6 }}>{desc}</div>
      </div>
    </div>
  );
}
