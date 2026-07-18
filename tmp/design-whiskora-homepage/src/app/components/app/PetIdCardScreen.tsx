import { useState } from "react";
import { Download, Share2, QrCode, ChevronLeft, Check } from "lucide-react";
import { A } from "../../appConstants";
import { PETS, OWNER } from "../../appData";
import { Screen } from "./AppShell";
import idCardLogoImg from "../../../imports/Photoroom_20260428_155006-1.png";
import pawImg from "../../../imports/Photoroom_20260428_155346.png";
import verifiedImg from "../../../imports/Photoroom_20260428_155413.png";

interface Props {
  petId?: string | null;
  navigate: (s: Screen, petId?: string) => void;
}

type Theme = "classic" | "dark" | "nature" | "minimal";

const THEMES: { id: Theme; label: string; bg: string; text: string; accent: string; sub: string }[] = [
  { id: "classic", label: "Classic", bg: `linear-gradient(135deg, ${A.indigo} 0%, ${A.indigoDark} 100%)`, text: "#FFFFFF", accent: "#A5B4FC", sub: "rgba(255,255,255,0.6)" },
  { id: "dark", label: "Dark", bg: "linear-gradient(135deg, #0F172A 0%, #1E293B 100%)", text: "#FFFFFF", accent: A.emerald, sub: "rgba(255,255,255,0.5)" },
  { id: "nature", label: "Nature", bg: `linear-gradient(135deg, ${A.emeraldDark} 0%, #065F46 100%)`, text: "#FFFFFF", accent: "#6EE7B7", sub: "rgba(255,255,255,0.6)" },
  { id: "minimal", label: "Minimal", bg: "#FFFFFF", text: A.ink, accent: A.indigo, sub: A.gray },
];

export function PetIdCardScreen({ petId, navigate }: Props) {
  const [theme, setTheme] = useState<Theme>("classic");
  const [selectedPetIdx, setSelectedPetIdx] = useState(0);
  const [shared, setShared] = useState(false);

  const pet = petId ? PETS.find((p) => p.id === petId) || PETS[selectedPetIdx] : PETS[selectedPetIdx];
  const themeConfig = THEMES.find((t) => t.id === theme)!;

  const handleShare = () => {
    setShared(true);
    setTimeout(() => setShared(false), 2000);
  };

  return (
    <div style={{ background: A.surface, minHeight: "100%" }}>
      {/* Header */}
      <div style={{
        background: A.white,
        padding: "16px 20px",
        borderBottom: `1px solid ${A.border}`,
        display: "flex",
        alignItems: "center",
        gap: 12,
      }}>
        <button
          onClick={() => navigate("dashboard")}
          style={{
            width: 36, height: 36, background: A.surface, border: `1px solid ${A.border}`,
            borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer",
          }}
        >
          <ChevronLeft size={18} color={A.ink} />
        </button>
        <div>
          <h1 style={{ fontSize: "1rem", fontWeight: 800, color: A.ink, lineHeight: 1 }}>Pet ID Card</h1>
          <p style={{ fontSize: "0.7rem", color: A.gray, marginTop: 2 }}>Generate & share</p>
        </div>
      </div>

      <div style={{ padding: "20px 16px", display: "flex", flexDirection: "column", gap: 20 }}>

        {/* Pet selector */}
        {!petId && (
          <div style={{ display: "flex", gap: 10, overflowX: "auto", scrollbarWidth: "none", paddingBottom: 4 }}>
            {PETS.map((p, i) => (
              <button
                key={p.id}
                onClick={() => setSelectedPetIdx(i)}
                style={{
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                  padding: "8px 12px",
                  background: selectedPetIdx === i ? A.indigoBg : A.white,
                  border: `1.5px solid ${selectedPetIdx === i ? A.indigo : A.border}`,
                  borderRadius: 14, cursor: "pointer", flexShrink: 0,
                  fontFamily: "'Prompt', sans-serif",
                }}
              >
                <img src={p.photo} alt={p.name} style={{ width: 40, height: 40, borderRadius: 12, objectFit: "cover" }} />
                <span style={{ fontSize: "0.7rem", fontWeight: 700, color: selectedPetIdx === i ? A.indigo : A.ink }}>{p.name}</span>
              </button>
            ))}
          </div>
        )}

        {/* Theme selector */}
        <div>
          <div style={{ fontSize: "0.78rem", fontWeight: 700, color: A.ink, marginBottom: 10 }}>Card Theme</div>
          <div style={{ display: "flex", gap: 8 }}>
            {THEMES.map((t) => (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
                style={{
                  flex: 1,
                  height: 36,
                  background: t.bg,
                  border: theme === t.id ? `2px solid ${A.indigo}` : "2px solid transparent",
                  borderRadius: 10,
                  cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  position: "relative",
                  boxShadow: theme === t.id ? A.shadowMd : A.shadow,
                  outline: theme === t.id ? `3px solid ${A.indigoBg}` : "none",
                }}
              >
                {theme === t.id && (
                  <div style={{
                    position: "absolute", top: -6, right: -6,
                    width: 16, height: 16, borderRadius: "50%",
                    background: A.indigo, display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <Check size={10} color={A.white} />
                  </div>
                )}
                <span style={{ fontSize: "0.6rem", fontWeight: 700, color: t.text, opacity: 0.9 }}>
                  {t.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Card preview */}
        <div style={{
          borderRadius: 24,
          overflow: "hidden",
          boxShadow: A.shadowLg,
          position: "relative",
        }}>
          {/* Card face */}
          <div style={{
            background: themeConfig.bg,
            padding: "24px 22px",
            position: "relative",
            overflow: "hidden",
          }}>
            {/* Background decoration */}
            <div style={{
              position: "absolute", top: -40, right: -40,
              width: 160, height: 160,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.06)",
            }} />
            <div style={{
              position: "absolute", bottom: -30, left: -20,
              width: 120, height: 120,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.04)",
            }} />

            {/* Card header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, position: "relative" }}>
              <img src={idCardLogoImg} alt="Whiskora" style={{ height: 22, objectFit: "contain", filter: themeConfig.text === "#FFFFFF" ? "brightness(0) invert(1)" : "none" }} />
              <div style={{
                width: 44, height: 44,
                borderRadius: "50%",
                overflow: "hidden",
                border: `2px solid ${themeConfig.accent}55`,
                flexShrink: 0,
                boxShadow: `0 2px 8px ${themeConfig.accent}33`,
              }}>
                <img src={verifiedImg} alt="Whiskora Verified" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
            </div>

            {/* Pet photo + info */}
            <div style={{ display: "flex", gap: 16, alignItems: "flex-start", marginBottom: 18, position: "relative" }}>
              <div style={{
                width: 76, height: 76, borderRadius: 20,
                overflow: "hidden",
                border: `3px solid rgba(255,255,255,0.3)`,
                flexShrink: 0,
              }}>
                <img src={pet.photo} alt={pet.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
              <div>
                <div style={{ fontSize: "1.3rem", fontWeight: 800, color: themeConfig.text, lineHeight: 1, marginBottom: 4 }}>{pet.name}</div>
                <div style={{ fontSize: "0.78rem", color: themeConfig.sub, marginBottom: 8 }}>{pet.breed} · {pet.gender}</div>
                <div style={{
                  display: "inline-flex", alignItems: "center", gap: 4,
                  background: "rgba(255,255,255,0.12)",
                  borderRadius: 8, padding: "3px 8px",
                }}>
                  <span style={{ fontSize: "0.62rem", fontWeight: 700, color: themeConfig.text }}>AGE: {pet.age}</span>
                </div>
              </div>
            </div>

            {/* ID info grid */}
            <div style={{
              display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
              gap: 10, marginBottom: 18, position: "relative",
            }}>
              {[
                { label: "ID", value: pet.id.split("-").slice(-1)[0] },
                { label: "SPECIES", value: pet.species },
                { label: "WEIGHT", value: pet.weight },
                { label: "COLOR", value: pet.color.split(" ")[0] },
                { label: "OWNER", value: OWNER.name.split(" ")[0] },
                { label: "STATUS", value: pet.healthStatus === "Healthy" ? "Healthy ✓" : "⚠ Due" },
              ].map(({ label, value }) => (
                <div key={label}>
                  <div style={{ fontSize: "0.55rem", color: themeConfig.sub, fontWeight: 600, marginBottom: 2, letterSpacing: "0.05em" }}>{label}</div>
                  <div style={{ fontSize: "0.72rem", fontWeight: 700, color: themeConfig.text }}>{value}</div>
                </div>
              ))}
            </div>

            {/* QR + ID footer */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "14px 16px",
              background: "rgba(255,255,255,0.08)",
              borderRadius: 14,
              position: "relative",
            }}>
              <div>
                <div style={{ fontSize: "0.55rem", color: themeConfig.sub, letterSpacing: "0.08em", marginBottom: 4 }}>WHISKORA ID</div>
                <div style={{ fontSize: "0.88rem", fontWeight: 800, color: themeConfig.text, fontFamily: "monospace" }}>{pet.id}</div>
                <div style={{ fontSize: "0.6rem", color: themeConfig.accent, marginTop: 2 }}>whiskora.com/pet/{pet.id.toLowerCase()}</div>
              </div>
              {/* QR code simulation */}
              <div style={{
                width: 60, height: 60,
                background: themeConfig.text === "#FFFFFF" ? "rgba(255,255,255,0.9)" : A.ink,
                borderRadius: 10,
                display: "flex", alignItems: "center", justifyContent: "center",
                padding: 6,
              }}>
                <QrCode size={44} color={themeConfig.text === "#FFFFFF" ? A.ink : A.white} />
              </div>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: "flex", gap: 12 }}>
          <button
            onClick={handleShare}
            style={{
              flex: 1, padding: "14px",
              background: A.white, border: `1px solid ${A.border}`,
              borderRadius: 14, display: "flex", alignItems: "center",
              justifyContent: "center", gap: 8,
              color: shared ? A.emerald : A.ink,
              fontWeight: 700, fontSize: "0.88rem",
              cursor: "pointer", fontFamily: "'Prompt', sans-serif",
              transition: "all 0.2s",
              boxShadow: A.shadow,
            }}
          >
            {shared ? <Check size={18} /> : <Share2 size={18} />}
            {shared ? "Shared!" : "Share"}
          </button>
          <button style={{
            flex: 1, padding: "14px",
            background: `linear-gradient(135deg, ${A.indigo}, ${A.indigoDark})`,
            border: "none", borderRadius: 14,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            color: A.white, fontWeight: 700, fontSize: "0.88rem",
            cursor: "pointer", fontFamily: "'Prompt', sans-serif",
            boxShadow: `0 4px 16px ${A.indigo}44`,
          }}>
            <Download size={18} /> Download
          </button>
        </div>

        {/* Public link */}
        <div style={{
          background: A.white, borderRadius: 14, padding: "14px 16px",
          border: `1px solid ${A.border}`, boxShadow: A.shadow,
        }}>
          <div style={{ fontSize: "0.72rem", fontWeight: 700, color: A.ink, marginBottom: 6 }}>Public Profile Link</div>
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            background: A.surface, borderRadius: 10, padding: "8px 12px",
          }}>
            <span style={{ flex: 1, fontSize: "0.72rem", color: A.gray, fontFamily: "monospace" }}>
              whiskora.com/p/{pet.id.toLowerCase()}
            </span>
            <button
              onClick={() => navigate("public-profile", pet.id)}
              style={{
                background: A.indigoBg, border: "none",
                borderRadius: 8, padding: "5px 10px",
                color: A.indigo, fontSize: "0.65rem", fontWeight: 700,
                cursor: "pointer", fontFamily: "'Prompt', sans-serif",
                whiteSpace: "nowrap",
              }}
            >
              Preview
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
