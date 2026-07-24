import { ArrowRight, CheckCircle2, QrCode, Star } from "lucide-react";
import { C, IMAGES } from "../constants";

export function HeroSection() {
  return (
    <section style={{
      background: C.cream,
      position: "relative",
      overflow: "hidden",
      paddingTop: 64,
      paddingBottom: 48,
    }}>
      {/* Soft background blobs */}
      <div style={{
        position: "absolute", top: -80, right: -80, width: 480, height: 480,
        background: `radial-gradient(circle, ${C.pinkLight} 0%, transparent 70%)`,
        borderRadius: "50%", pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute", bottom: 0, left: -60, width: 320, height: 320,
        background: `radial-gradient(circle, ${C.skyLight} 0%, transparent 70%)`,
        borderRadius: "50%", pointerEvents: "none",
      }} />

      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 24px", position: "relative" }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 48,
          flexWrap: "wrap",
        }}>
          {/* Left: text content */}
          <div style={{ flex: "1 1 420px", maxWidth: 600 }}>
            {/* Platform badge */}
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 24 }}>
              <span style={{
                background: C.pinkLight,
                color: C.pink,
                fontSize: "0.8rem",
                fontWeight: 600,
                padding: "6px 14px",
                borderRadius: 100,
                border: `1px solid ${C.pinkMid}`,
              }}>
                🐾 Thai-First Pet Platform
              </span>
            </div>

            {/* Headline */}
            <h1 style={{
              fontSize: "clamp(2.2rem, 4.5vw, 3.5rem)",
              fontWeight: 800,
              color: C.ink,
              lineHeight: 1.15,
              marginBottom: 20,
              letterSpacing: "-0.03em",
            }}>
              ศูนย์กลาง<br />
              <span style={{ color: C.pink }}>ทุกชีวิตสัตว์เลี้ยง</span><br />
              ในที่เดียว
            </h1>

            {/* Subheading */}
            <p style={{
              fontSize: "1.05rem",
              lineHeight: 1.75,
              color: C.grayText,
              marginBottom: 36,
              maxWidth: 500,
              fontWeight: 400,
            }}>
              ค้นหาฟาร์มคุณภาพ ซื้อขายสัตว์เลี้ยง จองบริการ
              และดูแลโปรไฟล์สัตว์เลี้ยงของคุณครบจบใน Whiskora
            </p>

            {/* CTA Buttons */}
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 40 }}>
              <button
                style={{
                  background: C.pink,
                  color: C.white,
                  border: "none",
                  borderRadius: 14,
                  padding: "14px 28px",
                  fontWeight: 700,
                  fontSize: "1rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  boxShadow: `0 4px 20px ${C.pinkMid}`,
                  fontFamily: "'Prompt', sans-serif",
                  whiteSpace: "nowrap",
                }}
              >
                ค้นหาฟาร์ม <ArrowRight size={18} />
              </button>
              <button
                style={{
                  background: "transparent",
                  color: C.ink,
                  border: `2px solid ${C.border}`,
                  borderRadius: 14,
                  padding: "14px 28px",
                  fontWeight: 600,
                  fontSize: "1rem",
                  cursor: "pointer",
                  fontFamily: "'Prompt', sans-serif",
                  whiteSpace: "nowrap",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = C.pink;
                  (e.currentTarget as HTMLElement).style.color = C.pink;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = C.border;
                  (e.currentTarget as HTMLElement).style.color = C.ink;
                }}
              >
                รู้จัก Whiskora
              </button>
            </div>

            {/* Trust badges */}
            <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
              {[
                { icon: <CheckCircle2 size={16} color={C.green} />, label: "Verified Farms" },
                { icon: <QrCode size={16} color={C.sky} />, label: "Pet ID Card" },
                { icon: "📋", label: "Health Records" },
              ].map(({ icon, label }) => (
                <div key={label} style={{
                  display: "flex", alignItems: "center", gap: 6,
                  fontSize: "0.82rem", fontWeight: 500, color: C.inkMuted,
                }}>
                  {typeof icon === "string" ? <span style={{ fontSize: 16 }}>{icon}</span> : icon}
                  {label}
                </div>
              ))}
            </div>
          </div>

          {/* Right: image composition */}
          <div style={{
            flex: "1 1 340px",
            maxWidth: 520,
            position: "relative",
            display: "flex",
            justifyContent: "center",
          }}>
            {/* Decoration ring */}
            <div style={{
              position: "absolute",
              top: -20, right: -20, bottom: -20, left: -20,
              background: `linear-gradient(135deg, ${C.pinkLight}, ${C.skyLight})`,
              borderRadius: 36,
              opacity: 0.5,
              zIndex: 0,
            }} />

            {/* Main image */}
            <div style={{
              position: "relative",
              zIndex: 1,
              borderRadius: 28,
              overflow: "hidden",
              width: "100%",
              maxWidth: 420,
              boxShadow: C.shadowLg,
            }}>
              <img
                src={IMAGES.heroDog}
                alt="Pet owner with dog"
                style={{ width: "100%", height: 480, objectFit: "cover", display: "block" }}
              />
              {/* Gradient overlay at bottom */}
              <div style={{
                position: "absolute",
                bottom: 0, left: 0, right: 0,
                height: 120,
                background: "linear-gradient(to top, rgba(31,26,28,0.3), transparent)",
              }} />
            </div>

            {/* Floating: Verified badge */}
            <div style={{
              position: "absolute",
              top: 24, left: -16,
              zIndex: 10,
              background: C.white,
              borderRadius: 14,
              padding: "10px 16px",
              boxShadow: C.shadowMd,
              display: "flex",
              alignItems: "center",
              gap: 8,
              border: `1px solid ${C.borderLight}`,
            }}>
              <div style={{
                width: 32, height: 32,
                background: C.greenLight,
                borderRadius: 8,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <CheckCircle2 size={18} color={C.green} />
              </div>
              <div>
                <div style={{ fontSize: "0.7rem", color: C.grayText, fontWeight: 500 }}>สถานะ</div>
                <div style={{ fontSize: "0.82rem", color: C.ink, fontWeight: 700 }}>Verified Farm ✓</div>
              </div>
            </div>

            {/* Floating: Pet ID card */}
            <div style={{
              position: "absolute",
              bottom: 32, right: -20,
              zIndex: 10,
              background: C.white,
              borderRadius: 16,
              padding: "12px 16px",
              boxShadow: C.shadowMd,
              display: "flex",
              alignItems: "center",
              gap: 12,
              border: `1px solid ${C.borderLight}`,
              minWidth: 180,
            }}>
              <img
                src={IMAGES.kittenPink}
                alt="Pet"
                style={{ width: 48, height: 48, objectFit: "cover", borderRadius: 10 }}
              />
              <div>
                <div style={{ fontSize: "0.82rem", color: C.ink, fontWeight: 700 }}>Mochi · Scottish Fold</div>
                <div style={{ fontSize: "0.7rem", color: C.grayText, marginTop: 2 }}>Pet ID · #WK-20042</div>
                <div style={{ display: "flex", alignItems: "center", gap: 3, marginTop: 4 }}>
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={10} fill={C.yellow} color={C.yellow} />
                  ))}
                  <span style={{ fontSize: "0.68rem", color: C.grayText, marginLeft: 2 }}>4.9</span>
                </div>
              </div>
            </div>

            {/* Floating: Stats bubble */}
            <div style={{
              position: "absolute",
              top: "50%", right: -24,
              zIndex: 10,
              transform: "translateY(-50%)",
              background: C.pink,
              borderRadius: 14,
              padding: "12px 16px",
              boxShadow: `0 4px 20px ${C.pinkMid}`,
              textAlign: "center",
            }}>
              <div style={{ fontSize: "1.1rem", fontWeight: 800, color: C.white, lineHeight: 1 }}>1,200+</div>
              <div style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.85)", fontWeight: 500, marginTop: 2 }}>ฟาร์มคุณภาพ</div>
            </div>

            {/* Small secondary image: golden puppy */}
            <div style={{
              position: "absolute",
              bottom: -16, left: -24,
              zIndex: 10,
              borderRadius: 16,
              overflow: "hidden",
              width: 90, height: 90,
              boxShadow: C.shadowMd,
              border: `3px solid ${C.white}`,
            }}>
              <img
                src={IMAGES.goldenPuppy}
                alt="Golden puppy"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
