import { Bell, ChevronRight, Plus, Stethoscope, MapPin, FileText, Syringe, AlertCircle, CheckCircle2 } from "lucide-react";
import { A } from "../../appConstants";
import { PETS, UPCOMING, OWNER } from "../../appData";
import { Screen } from "./AppShell";
import pawImg from "../../../imports/Photoroom_20260428_155346.png";

interface Props {
  navigate: (s: Screen, petId?: string) => void;
}

export function DashboardScreen({ navigate }: Props) {
  const upcomingCount = UPCOMING.filter((u) => u.urgent).length;

  return (
    <div style={{ background: A.surface }}>
      {/* Hero header */}
      <div style={{
        background: `linear-gradient(160deg, ${A.indigo} 0%, ${A.indigoDark} 100%)`,
        padding: "16px 20px 32px",
      }}>
        {/* Top row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 38, height: 38,
              background: "rgba(255,255,255,0.15)",
              borderRadius: 12,
              display: "flex", alignItems: "center", justifyContent: "center",
              backdropFilter: "blur(8px)",
            }}>
              <img src={pawImg} alt="Whiskora" style={{ width: 24, height: 24, objectFit: "contain" }} />
            </div>
            <div>
              <div style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.6)", fontWeight: 500 }}>Good morning</div>
              <div style={{ fontSize: "0.95rem", fontWeight: 700, color: A.white }}>Sarah Chen 👋</div>
            </div>
          </div>
          <button style={{
            width: 40, height: 40,
            background: "rgba(255,255,255,0.12)",
            border: "none", borderRadius: 12,
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", position: "relative",
          }}>
            <Bell size={18} color={A.white} />
            <div style={{
              position: "absolute", top: 8, right: 8,
              width: 8, height: 8,
              background: A.amber, borderRadius: "50%",
              border: "2px solid transparent",
            }} />
          </button>
        </div>

        {/* Stats row */}
        <div style={{ display: "flex", gap: 12 }}>
          {[
            { value: "3", label: "Pets", color: "rgba(255,255,255,0.15)", icon: "🐾" },
            { value: "2", label: "Vaccines Due", color: "rgba(245,158,11,0.25)", icon: "💉" },
            { value: "1", label: "Reminder", color: "rgba(239,68,68,0.2)", icon: "⚠️" },
          ].map(({ value, label, color, icon }) => (
            <div key={label} style={{
              flex: 1,
              background: color,
              borderRadius: 16,
              padding: "14px 12px",
              backdropFilter: "blur(8px)",
              border: "1px solid rgba(255,255,255,0.1)",
              textAlign: "center",
            }}>
              <div style={{ fontSize: 18, marginBottom: 4 }}>{icon}</div>
              <div style={{ fontSize: "1.3rem", fontWeight: 800, color: A.white, lineHeight: 1 }}>{value}</div>
              <div style={{ fontSize: "0.62rem", color: "rgba(255,255,255,0.7)", marginTop: 2, fontWeight: 500 }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: "0 0 24px" }}>
        {/* Quick Actions */}
        <div style={{ padding: "20px 20px 0" }}>
          <SectionTitle title="Quick Actions" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
            {[
              { icon: <Plus size={22} />, label: "Add Pet", sub: "Register new pet", color: A.indigo, bg: A.indigoBg, action: () => navigate("add-pet") },
              { icon: <Stethoscope size={22} />, label: "Health Check", sub: "Book a vet visit", color: A.emerald, bg: A.emeraldBg, action: () => {} },
              { icon: <MapPin size={22} />, label: "Find Vet", sub: "Nearby clinics", color: A.blue, bg: A.blueBg, action: () => {} },
              { icon: <FileText size={22} />, label: "Documents", sub: "View & upload", color: A.amber, bg: A.amberBg, action: () => {} },
            ].map(({ icon, label, sub, color, bg, action }) => (
              <button
                key={label}
                onClick={action}
                style={{
                  background: A.white,
                  border: `1px solid ${A.border}`,
                  borderRadius: 16,
                  padding: "16px",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 12,
                  cursor: "pointer",
                  textAlign: "left",
                  boxShadow: A.shadow,
                  transition: "transform 0.1s",
                  fontFamily: "'Prompt', sans-serif",
                }}
              >
                <div style={{
                  width: 42, height: 42, flexShrink: 0,
                  background: bg, borderRadius: 12,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: color,
                }}>
                  {icon}
                </div>
                <div>
                  <div style={{ fontSize: "0.85rem", fontWeight: 700, color: A.ink }}>{label}</div>
                  <div style={{ fontSize: "0.7rem", color: A.gray, marginTop: 1 }}>{sub}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Upcoming Events */}
        <div style={{ padding: "20px 20px 0" }}>
          <SectionTitle
            title="Upcoming Events"
            badge={upcomingCount > 0 ? `${upcomingCount} urgent` : undefined}
            badgeColor={A.red}
          />
          <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 10 }}>
            {UPCOMING.slice(0, 3).map((evt, i) => (
              <div
                key={i}
                style={{
                  background: A.white,
                  borderRadius: 14,
                  padding: "14px 16px",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  boxShadow: A.shadow,
                  border: `1px solid ${A.border}`,
                  borderLeft: `4px solid ${evt.urgent ? A.red : A.amber}`,
                }}
              >
                <div style={{
                  width: 36, height: 36, flexShrink: 0,
                  background: evt.urgent ? A.redBg : A.amberBg,
                  borderRadius: 10,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {evt.urgent
                    ? <AlertCircle size={18} color={A.red} />
                    : <Syringe size={18} color={A.amber} />
                  }
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "0.82rem", fontWeight: 700, color: A.ink }}>{evt.event}</div>
                  <div style={{ fontSize: "0.7rem", color: A.gray, marginTop: 1 }}>
                    {evt.pet} · {evt.date}
                  </div>
                </div>
                <div style={{
                  fontSize: "0.65rem",
                  fontWeight: 700,
                  color: evt.urgent ? A.red : A.amber,
                  background: evt.urgent ? A.redBg : A.amberBg,
                  padding: "3px 8px",
                  borderRadius: 20,
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                }}>
                  {evt.urgent ? "Urgent" : "Soon"}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* My Pets */}
        <div style={{ padding: "20px 0 0" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px", marginBottom: 12 }}>
            <span style={{ fontSize: "0.95rem", fontWeight: 700, color: A.ink }}>My Pets</span>
            <button
              onClick={() => navigate("my-pets")}
              style={{
                display: "flex", alignItems: "center", gap: 4,
                background: "none", border: "none", cursor: "pointer",
                color: A.indigo, fontSize: "0.78rem", fontWeight: 600,
                fontFamily: "'Prompt', sans-serif",
              }}
            >
              See all <ChevronRight size={14} />
            </button>
          </div>
          <div style={{
            display: "flex",
            gap: 12,
            overflowX: "auto",
            padding: "0 20px 8px",
            scrollbarWidth: "none",
          }}>
            {PETS.map((pet) => (
              <button
                key={pet.id}
                onClick={() => navigate("pet-detail", pet.id)}
                style={{
                  background: A.white,
                  border: `1px solid ${A.border}`,
                  borderRadius: 18,
                  padding: "14px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 8,
                  cursor: "pointer",
                  minWidth: 110,
                  boxShadow: A.shadow,
                  fontFamily: "'Prompt', sans-serif",
                  flexShrink: 0,
                }}
              >
                <div style={{ position: "relative" }}>
                  <img
                    src={pet.photo}
                    alt={pet.name}
                    style={{ width: 64, height: 64, borderRadius: 20, objectFit: "cover" }}
                  />
                  <div style={{
                    position: "absolute", bottom: -2, right: -2,
                    width: 16, height: 16,
                    background: pet.healthStatus === "Healthy" ? A.emerald : A.amber,
                    borderRadius: "50%",
                    border: `2px solid ${A.white}`,
                  }} />
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "0.82rem", fontWeight: 700, color: A.ink }}>{pet.name}</div>
                  <div style={{ fontSize: "0.65rem", color: A.gray }}>{pet.breed}</div>
                </div>
              </button>
            ))}
            {/* Add new */}
            <button
              onClick={() => navigate("add-pet")}
              style={{
                background: A.indigoBg,
                border: `1.5px dashed ${A.indigo}55`,
                borderRadius: 18,
                padding: "14px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                cursor: "pointer",
                minWidth: 110,
                fontFamily: "'Prompt', sans-serif",
                flexShrink: 0,
              }}
            >
              <div style={{
                width: 64, height: 64,
                borderRadius: 20,
                background: A.indigo,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Plus size={28} color={A.white} />
              </div>
              <span style={{ fontSize: "0.75rem", fontWeight: 600, color: A.indigo }}>Add Pet</span>
            </button>
          </div>
        </div>

        {/* Recent Activity */}
        <div style={{ padding: "20px 20px 0" }}>
          <SectionTitle title="Recent Activity" />
          <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 2 }}>
            {[
              { icon: "💉", pet: "Mochi", action: "FVRCP Vaccine recorded", time: "2 days ago", color: A.indigoBg, textColor: A.indigo },
              { icon: "🩺", pet: "Milo", action: "Annual checkup completed", time: "5 days ago", color: A.emeraldBg, textColor: A.emerald },
              { icon: "🪪", pet: "Luna", action: "Pet ID Card created", time: "1 week ago", color: A.amberBg, textColor: A.amber },
            ].map(({ icon, pet, action, time, color, textColor }, i) => (
              <div key={i} style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "12px 0",
                borderBottom: i < 2 ? `1px solid ${A.border}` : "none",
              }}>
                <div style={{
                  width: 38, height: 38,
                  background: color,
                  borderRadius: 11,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 18, flexShrink: 0,
                }}>
                  {icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "0.82rem", fontWeight: 600, color: A.ink }}>
                    {pet} · <span style={{ fontWeight: 400, color: A.inkMuted }}>{action}</span>
                  </div>
                  <div style={{ fontSize: "0.68rem", color: A.gray, marginTop: 1 }}>{time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ title, badge, badgeColor }: { title: string; badge?: string; badgeColor?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ fontSize: "0.95rem", fontWeight: 700, color: A.ink }}>{title}</span>
      {badge && (
        <span style={{
          background: badgeColor ? `${badgeColor}18` : A.indigoBg,
          color: badgeColor || A.indigo,
          fontSize: "0.62rem", fontWeight: 700,
          padding: "2px 8px", borderRadius: 20,
        }}>
          {badge}
        </span>
      )}
    </div>
  );
}
