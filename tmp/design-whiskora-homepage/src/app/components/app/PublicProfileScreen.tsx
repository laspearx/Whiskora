import { QrCode, Phone, Mail, Heart, ArrowLeft } from "lucide-react";
import { A } from "../../appConstants";
import { getPetById, OWNER } from "../../appData";
import { Screen } from "./AppShell";
import verifiedImg from "../../../imports/Photoroom_20260428_155413.png";
import miniLogoImg from "../../../imports/Photoroom_20260428_155346.png";

interface Props {
  petId: string | null;
  navigate: (s: Screen) => void;
}

export function PublicProfileScreen({ petId, navigate }: Props) {
  const pet = getPetById(petId);

  if (!pet) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: A.gray }}>
        Profile not found
      </div>
    );
  }

  return (
    <div style={{ background: A.surface, minHeight: "100%", paddingBottom: 24 }}>
      {/* Hero */}
      <div style={{ position: "relative", height: 200 }}>
        <img src={pet.photo} alt={pet.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.7) 100%)",
        }} />
        {/* Back button */}
        <button
          onClick={() => navigate("pet-id-card")}
          style={{
            position: "absolute", top: 12, left: 16,
            width: 36, height: 36,
            background: "rgba(0,0,0,0.3)", backdropFilter: "blur(8px)",
            border: "none", borderRadius: 10,
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer",
          }}
        >
          <ArrowLeft size={18} color={A.white} />
        </button>

        {/* Whiskora brand mark */}
        <div style={{
          position: "absolute", top: 12, right: 16,
          display: "flex", alignItems: "center", gap: 6,
          background: "rgba(0,0,0,0.3)", backdropFilter: "blur(8px)",
          padding: "5px 10px", borderRadius: 20,
        }}>
          <img src={miniLogoImg} alt="Whiskora" style={{ width: 18, height: 18, objectFit: "contain" }} />
          <span style={{ fontSize: "0.65rem", fontWeight: 700, color: A.white }}>Whiskora</span>
        </div>
      </div>

      {/* Profile card */}
      <div style={{ padding: "0 16px" }}>
        {/* Identity */}
        <div style={{
          background: A.white, borderRadius: 20, padding: "20px",
          border: `1px solid ${A.border}`,
          boxShadow: A.shadowMd,
          marginTop: -28, position: "relative", zIndex: 2,
          marginBottom: 16,
        }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 16 }}>
            <div style={{ position: "relative" }}>
              <img src={pet.photo} alt={pet.name} style={{ width: 72, height: 72, borderRadius: 18, objectFit: "cover" }} />
              <div style={{
                position: "absolute", bottom: -6, right: -6,
                width: 24, height: 24, borderRadius: "50%",
                border: `2.5px solid ${A.white}`, overflow: "hidden", background: A.white,
              }}>
                <img src={verifiedImg} alt="Verified" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                <h1 style={{ fontSize: "1.3rem", fontWeight: 800, color: A.ink, lineHeight: 1 }}>{pet.name}</h1>
              </div>
              <p style={{ fontSize: "0.78rem", color: A.gray, margin: "0 0 8px" }}>
                {pet.breed} · {pet.gender} · {pet.age}
              </p>
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                background: A.emeraldBg, borderRadius: 20, padding: "4px 10px",
              }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: A.emerald }} />
                <span style={{ fontSize: "0.65rem", fontWeight: 700, color: A.emerald }}>
                  {pet.healthStatus}
                </span>
              </div>
            </div>
          </div>

          {/* ID chip */}
          <div style={{
            background: A.indigoBg, borderRadius: 12, padding: "10px 14px",
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <div>
              <div style={{ fontSize: "0.6rem", color: A.indigoLight, fontWeight: 600, letterSpacing: "0.06em" }}>WHISKORA ID</div>
              <div style={{ fontSize: "0.9rem", fontWeight: 800, color: A.indigo, fontFamily: "monospace" }}>{pet.id}</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 26, height: 26, borderRadius: "50%", overflow: "hidden", flexShrink: 0 }}>
                <img src={verifiedImg} alt="Whiskora Verified" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
              <span style={{ fontSize: "0.65rem", fontWeight: 700, color: A.indigo }}>Verified</span>
            </div>
          </div>
        </div>

        {/* Info grid */}
        <div style={{
          background: A.white, borderRadius: 18, padding: "16px",
          border: `1px solid ${A.border}`, boxShadow: A.shadow,
          marginBottom: 14,
        }}>
          <h3 style={{ fontSize: "0.82rem", fontWeight: 700, color: A.ink, marginBottom: 14 }}>Pet Information</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {[
              { label: "Species", value: pet.species },
              { label: "Breed", value: pet.breed },
              { label: "Gender", value: pet.gender },
              { label: "Date of Birth", value: pet.dob },
              { label: "Color / Coat", value: pet.color },
              { label: "Weight", value: pet.weight },
            ].map(({ label, value }) => (
              <div key={label}>
                <div style={{ fontSize: "0.62rem", color: A.grayLight, fontWeight: 600, marginBottom: 2 }}>{label.toUpperCase()}</div>
                <div style={{ fontSize: "0.82rem", fontWeight: 600, color: A.ink }}>{value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Public Health Summary */}
        <div style={{
          background: A.white, borderRadius: 18, padding: "16px",
          border: `1px solid ${A.border}`, boxShadow: A.shadow,
          marginBottom: 14,
        }}>
          <h3 style={{ fontSize: "0.82rem", fontWeight: 700, color: A.ink, marginBottom: 12 }}>Health Summary</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              { label: "Vaccination Status", value: "Up to date", ok: true },
              { label: "Last Checkup", value: "April 15, 2024", ok: true },
              { label: "Known Allergies", value: "None", ok: true },
              { label: "Microchip", value: pet.chipId ? "Registered ✓" : "Not registered", ok: !!pet.chipId },
            ].map(({ label, value, ok }) => (
              <div key={label} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "8px 0",
                borderBottom: `1px solid ${A.borderLight}`,
              }}>
                <span style={{ fontSize: "0.78rem", color: A.gray }}>{label}</span>
                <span style={{
                  fontSize: "0.75rem", fontWeight: 700,
                  color: ok ? A.emerald : A.red,
                }}>
                  {value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Emergency Contact */}
        <div style={{
          background: `linear-gradient(135deg, ${A.redBg} 0%, #FFF5F5 100%)`,
          borderRadius: 18, padding: "16px",
          border: `1px solid ${A.red}22`,
          marginBottom: 14,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <div style={{
              width: 32, height: 32,
              background: A.red,
              borderRadius: 10,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Heart size={16} color={A.white} />
            </div>
            <h3 style={{ fontSize: "0.82rem", fontWeight: 700, color: A.ink }}>Emergency Contact</h3>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 12,
                background: `linear-gradient(135deg, ${A.indigo}, ${A.indigoDark})`,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: A.white, fontWeight: 800,
              }}>
                {OWNER.name.charAt(0)}
              </div>
              <div>
                <div style={{ fontSize: "0.88rem", fontWeight: 700, color: A.ink }}>{OWNER.name}</div>
                <div style={{ fontSize: "0.7rem", color: A.gray }}>Primary Owner</div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button style={{
                flex: 1, padding: "10px",
                background: A.white, border: `1px solid ${A.border}`,
                borderRadius: 12, display: "flex", alignItems: "center",
                justifyContent: "center", gap: 6,
                color: A.ink, fontSize: "0.78rem", fontWeight: 600,
                cursor: "pointer", fontFamily: "'Prompt', sans-serif",
              }}>
                <Phone size={14} color={A.emerald} /> Call
              </button>
              <button style={{
                flex: 1, padding: "10px",
                background: A.white, border: `1px solid ${A.border}`,
                borderRadius: 12, display: "flex", alignItems: "center",
                justifyContent: "center", gap: 6,
                color: A.ink, fontSize: "0.78rem", fontWeight: 600,
                cursor: "pointer", fontFamily: "'Prompt', sans-serif",
              }}>
                <Mail size={14} color={A.indigo} /> Email
              </button>
            </div>
          </div>
        </div>

        {/* Powered by Whiskora */}
        <div style={{ textAlign: "center", padding: "8px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            <img src={miniLogoImg} alt="Whiskora" style={{ width: 20, height: 20, objectFit: "contain" }} />
            <span style={{ fontSize: "0.72rem", color: A.grayLight }}>Powered by <strong style={{ color: A.gray }}>Whiskora</strong></span>
          </div>
          <div style={{ fontSize: "0.62rem", color: A.grayLight, marginTop: 4 }}>
            This profile is publicly accessible via QR code
          </div>
        </div>
      </div>
    </div>
  );
}
