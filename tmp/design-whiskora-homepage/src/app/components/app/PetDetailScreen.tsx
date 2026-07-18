import { useState, ReactNode } from "react";
import { ChevronLeft, Heart, Share2, CheckCircle2, AlertCircle, Clock, FileText, Syringe } from "lucide-react";
import { A } from "../../appConstants";
import { getPetById, getPetVaccines, getPetActivities, OWNER } from "../../appData";
import { Screen } from "./AppShell";
import verifiedImg from "../../../imports/Photoroom_20260428_155413.png";

interface Props {
  petId: string | null;
  navigate: (s: Screen, petId?: string) => void;
}

const TABS = ["Overview", "Health", "Documents", "Ownership", "Activity"];

export function PetDetailScreen({ petId, navigate }: Props) {
  const [activeTab, setActiveTab] = useState("Overview");
  const pet = getPetById(petId);

  if (!pet) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: A.gray }}>
        Pet not found
      </div>
    );
  }

  const vaccines = getPetVaccines(pet.id);
  const activities = getPetActivities(pet.id);

  const statusColor = pet.healthStatus === "Healthy" ? A.emerald : pet.healthStatus === "Due for Vaccine" ? A.amber : A.red;
  const statusBg = pet.healthStatus === "Healthy" ? A.emeraldBg : pet.healthStatus === "Due for Vaccine" ? A.amberBg : A.redBg;

  return (
    <div style={{ background: A.surface, minHeight: "100%" }}>
      {/* Hero image */}
      <div style={{ position: "relative", height: 240 }}>
        <img src={pet.photo} alt={pet.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0) 40%, rgba(0,0,0,0.6) 100%)",
        }} />

        {/* Back & actions */}
        <div style={{
          position: "absolute", top: 12, left: 0, right: 0,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 16px",
        }}>
          <button
            onClick={() => navigate("my-pets")}
            style={{
              width: 36, height: 36,
              background: "rgba(0,0,0,0.3)", backdropFilter: "blur(8px)",
              border: "none", borderRadius: 10,
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <ChevronLeft size={20} color={A.white} />
          </button>
          <div style={{ display: "flex", gap: 8 }}>
            <button style={{
              width: 36, height: 36, background: "rgba(0,0,0,0.3)", backdropFilter: "blur(8px)",
              border: "none", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
            }}>
              <Heart size={18} color={A.white} />
            </button>
            <button style={{
              width: 36, height: 36, background: "rgba(0,0,0,0.3)", backdropFilter: "blur(8px)",
              border: "none", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
            }}>
              <Share2 size={18} color={A.white} />
            </button>
          </div>
        </div>

        {/* Pet identity overlay */}
        <div style={{
          position: "absolute", bottom: 16, left: 16, right: 16,
          display: "flex", alignItems: "flex-end", justifyContent: "space-between",
        }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: A.white, lineHeight: 1 }}>{pet.name}</h1>
              {pet.verified && (
                <div style={{
                  width: 30, height: 30,
                  borderRadius: "50%",
                  overflow: "hidden",
                  border: "2px solid rgba(255,255,255,0.5)",
                  flexShrink: 0,
                }}>
                  <img src={verifiedImg} alt="Whiskora Verified" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
              )}
            </div>
            <p style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.85)", fontWeight: 500 }}>
              {pet.breed} · {pet.gender} · {pet.age}
            </p>
          </div>
          <div style={{
            display: "flex", alignItems: "center", gap: 5,
            background: statusBg,
            color: statusColor,
            fontSize: "0.68rem", fontWeight: 700,
            padding: "5px 10px", borderRadius: 20,
            backdropFilter: "blur(8px)",
          }}>
            {pet.healthStatus === "Healthy" ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
            {pet.healthStatus}
          </div>
        </div>
      </div>

      {/* Whiskora ID chip */}
      <div style={{ padding: "14px 16px 0" }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          background: A.indigoBg, borderRadius: 14, padding: "12px 16px",
          border: `1px solid ${A.indigo}22`,
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "0.62rem", color: A.indigoLight, fontWeight: 600, letterSpacing: "0.06em" }}>WHISKORA ID</div>
            <div style={{ fontSize: "0.95rem", fontWeight: 800, color: A.indigo, fontFamily: "monospace" }}>{pet.id}</div>
          </div>
          {pet.chipId && (
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "0.62rem", color: A.indigoLight, fontWeight: 600 }}>CHIP</div>
              <div style={{ fontSize: "0.7rem", fontWeight: 700, color: A.indigo, fontFamily: "monospace" }}>{pet.chipId}</div>
            </div>
          )}
          <button
            onClick={() => navigate("pet-id-card", pet.id)}
            style={{
              background: A.indigo, border: "none", borderRadius: 10,
              padding: "8px 12px", color: A.white, fontSize: "0.72rem", fontWeight: 700,
              cursor: "pointer", fontFamily: "'Prompt', sans-serif", whiteSpace: "nowrap",
            }}
          >
            ID Card
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: "flex",
        gap: 0,
        padding: "14px 16px 0",
        overflowX: "auto",
        scrollbarWidth: "none",
        borderBottom: `1px solid ${A.border}`,
        position: "sticky",
        top: 0,
        background: A.surface,
        zIndex: 5,
      }}>
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: "8px 14px",
              background: "none",
              border: "none",
              borderBottom: `2px solid ${activeTab === tab ? A.indigo : "transparent"}`,
              color: activeTab === tab ? A.indigo : A.gray,
              fontWeight: activeTab === tab ? 700 : 500,
              fontSize: "0.78rem",
              cursor: "pointer",
              fontFamily: "'Prompt', sans-serif",
              whiteSpace: "nowrap",
              flexShrink: 0,
              transition: "all 0.15s",
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{ padding: "16px" }}>
        {activeTab === "Overview" && <OverviewTab pet={pet} />}
        {activeTab === "Health" && <HealthTab vaccines={vaccines} />}
        {activeTab === "Documents" && <DocumentsTab pet={pet} />}
        {activeTab === "Ownership" && <OwnershipTab />}
        {activeTab === "Activity" && <ActivityTab activities={activities} />}
      </div>
    </div>
  );
}

function OverviewTab({ pet }: { pet: ReturnType<typeof getPetById> }) {
  if (!pet) return null;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Info grid */}
      <div style={{
        background: A.white, borderRadius: 16, padding: "16px",
        border: `1px solid ${A.border}`, boxShadow: A.shadow,
        display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14,
      }}>
        {[
          { label: "Breed", value: pet.breed },
          { label: "Gender", value: pet.gender },
          { label: "Age", value: pet.age },
          { label: "DOB", value: pet.dob },
          { label: "Color", value: pet.color },
          { label: "Weight", value: pet.weight },
        ].map(({ label, value }) => (
          <div key={label}>
            <div style={{ fontSize: "0.65rem", color: A.grayLight, fontWeight: 600, marginBottom: 2 }}>{label.toUpperCase()}</div>
            <div style={{ fontSize: "0.85rem", fontWeight: 600, color: A.ink }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Owner card */}
      <div style={{
        background: A.white, borderRadius: 16, padding: "16px",
        border: `1px solid ${A.border}`, boxShadow: A.shadow,
      }}>
        <div style={{ fontSize: "0.75rem", fontWeight: 700, color: A.ink, marginBottom: 12 }}>Owner</div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14,
            background: `linear-gradient(135deg, ${A.indigo}, ${A.indigoDark})`,
            display: "flex", alignItems: "center", justifyContent: "center",
            color: A.white, fontSize: "1.1rem", fontWeight: 800,
          }}>
            {OWNER.name.charAt(0)}
          </div>
          <div>
            <div style={{ fontSize: "0.92rem", fontWeight: 700, color: A.ink }}>{OWNER.name}</div>
            <div style={{ fontSize: "0.72rem", color: A.gray }}>{OWNER.phone}</div>
            <div style={{ fontSize: "0.65rem", color: A.grayLight, marginTop: 2 }}>Member since {OWNER.memberSince}</div>
          </div>
          <div style={{ marginLeft: "auto" }}>
            <span style={{
              background: A.emeraldBg, color: A.emerald,
              fontSize: "0.65rem", fontWeight: 700,
              padding: "3px 8px", borderRadius: 20,
            }}>
              Verified
            </span>
          </div>
        </div>
      </div>

      {/* Verification badges */}
      <div style={{
        background: A.white, borderRadius: 16, padding: "16px",
        border: `1px solid ${A.border}`, boxShadow: A.shadow,
      }}>
        <div style={{ fontSize: "0.75rem", fontWeight: 700, color: A.ink, marginBottom: 12 }}>Verification Status</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[
            { label: "Identity Verified", done: pet.verified, icon: "🪪" },
            { label: "Health Records", done: true, icon: "🏥" },
            { label: "Vaccination Records", done: true, icon: "💉" },
            { label: "Microchip Registered", done: !!pet.chipId, icon: "🔬" },
            { label: "Whiskora ID Issued", done: true, icon: "✅" },
          ].map(({ label, done, icon }) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 16 }}>{icon}</span>
              <span style={{ flex: 1, fontSize: "0.8rem", color: A.inkMuted }}>{label}</span>
              {done
                ? <CheckCircle2 size={16} color={A.emerald} />
                : <Clock size={16} color={A.grayLight} />
              }
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function HealthTab({ vaccines }: { vaccines: ReturnType<typeof getPetVaccines> }) {
  const statusColor = { Done: A.emerald, Due: A.amber, Overdue: A.red };
  const statusBg = { Done: A.emeraldBg, Due: A.amberBg, Overdue: A.redBg };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <SectionCard title="💉 Vaccination Timeline">
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {vaccines.map((v, i) => (
            <div key={v.id} style={{ display: "flex", gap: 12, position: "relative" }}>
              {/* Timeline line */}
              {i < vaccines.length - 1 && (
                <div style={{
                  position: "absolute", left: 15, top: 32, bottom: 0, width: 2,
                  background: A.border, zIndex: 0,
                }} />
              )}
              <div style={{
                width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
                background: statusBg[v.status],
                border: `2px solid ${statusColor[v.status]}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                zIndex: 1, marginTop: 6,
              }}>
                <Syringe size={14} color={statusColor[v.status]} />
              </div>
              <div style={{ flex: 1, padding: "6px 0 18px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                  <span style={{ fontSize: "0.85rem", fontWeight: 700, color: A.ink }}>{v.name}</span>
                  <span style={{
                    fontSize: "0.62rem", fontWeight: 700,
                    color: statusColor[v.status], background: statusBg[v.status],
                    padding: "2px 7px", borderRadius: 20,
                  }}>
                    {v.status}
                  </span>
                </div>
                <div style={{ fontSize: "0.7rem", color: A.gray }}>{v.clinic}</div>
                <div style={{ fontSize: "0.68rem", color: A.grayLight, marginTop: 2 }}>
                  Given: {v.date} · Next: {v.nextDue}
                </div>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="💊 Deworming">
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[
            { drug: "Drontal Cat", date: "Mar 10, 2024", next: "Jun 10, 2024", status: "Due" },
            { drug: "Profender", date: "Dec 5, 2023", next: "Mar 5, 2024", status: "Done" },
          ].map(({ drug, date, next, status }) => (
            <div key={drug} style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "10px 12px",
              background: status === "Due" ? A.amberBg : A.emeraldBg,
              borderRadius: 12,
              borderLeft: `3px solid ${status === "Due" ? A.amber : A.emerald}`,
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "0.82rem", fontWeight: 700, color: A.ink }}>{drug}</div>
                <div style={{ fontSize: "0.68rem", color: A.gray, marginTop: 1 }}>Last: {date} · Next: {next}</div>
              </div>
              <span style={{
                fontSize: "0.65rem", fontWeight: 700,
                color: status === "Due" ? A.amber : A.emerald,
              }}>
                {status}
              </span>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="🩺 Medical History">
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[
            { title: "Annual Checkup", date: "Apr 15, 2024", note: "All vitals normal. Weight 3.5kg." },
            { title: "Dental Cleaning", date: "Jan 8, 2024", note: "Mild tartar removed. No issues." },
          ].map(({ title, date, note }) => (
            <div key={title} style={{ padding: "10px 0", borderBottom: `1px solid ${A.borderLight}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                <span style={{ fontSize: "0.82rem", fontWeight: 700, color: A.ink }}>{title}</span>
                <span style={{ fontSize: "0.68rem", color: A.gray }}>{date}</span>
              </div>
              <p style={{ fontSize: "0.72rem", color: A.inkMuted, margin: 0 }}>{note}</p>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="⚠️ Allergies & Medications">
        <div style={{
          background: A.amberBg, borderRadius: 10, padding: "10px 12px",
          border: `1px solid ${A.amber}33`, marginBottom: 8,
        }}>
          <div style={{ fontSize: "0.75rem", fontWeight: 700, color: A.amber }}>Known Allergies</div>
          <div style={{ fontSize: "0.8rem", color: A.ink, marginTop: 4 }}>None reported</div>
        </div>
        <div style={{
          background: A.blueBg, borderRadius: 10, padding: "10px 12px",
          border: `1px solid ${A.blue}33`,
        }}>
          <div style={{ fontSize: "0.75rem", fontWeight: 700, color: A.blue }}>Current Medication</div>
          <div style={{ fontSize: "0.8rem", color: A.ink, marginTop: 4 }}>None at this time</div>
        </div>
      </SectionCard>
    </div>
  );
}

function DocumentsTab({ pet }: { pet: ReturnType<typeof getPetById> }) {
  const docs = [
    { name: "Vaccination Card", date: "Apr 15, 2024", size: "2.3 MB", type: "PDF", color: A.emeraldBg, tColor: A.emerald },
    { name: "Annual Checkup Report", date: "Apr 15, 2024", size: "1.1 MB", type: "PDF", color: A.blueBg, tColor: A.blue },
    { name: "Breeder Certificate", date: "Apr 2, 2022", size: "0.8 MB", type: "PDF", color: A.amberBg, tColor: A.amber },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {docs.map((doc) => (
        <div key={doc.name} style={{
          background: A.white, borderRadius: 14, padding: "14px 16px",
          border: `1px solid ${A.border}`, display: "flex", alignItems: "center", gap: 12,
          boxShadow: A.shadow,
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: doc.color, flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <FileText size={22} color={doc.tColor} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "0.85rem", fontWeight: 700, color: A.ink }}>{doc.name}</div>
            <div style={{ fontSize: "0.7rem", color: A.gray, marginTop: 1 }}>{doc.date} · {doc.size}</div>
          </div>
          <span style={{
            background: A.surface, color: A.gray,
            fontSize: "0.65rem", fontWeight: 700,
            padding: "3px 8px", borderRadius: 8,
            border: `1px solid ${A.border}`,
          }}>
            {doc.type}
          </span>
        </div>
      ))}
      <button style={{
        background: A.indigoBg, border: `1.5px dashed ${A.indigo}55`,
        borderRadius: 14, padding: "14px",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        color: A.indigo, fontWeight: 600, fontSize: "0.85rem",
        cursor: "pointer", fontFamily: "'Prompt', sans-serif", width: "100%",
      }}>
        + Upload Document
      </button>
    </div>
  );
}

function OwnershipTab() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <SectionCard title="Current Owner">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 16,
            background: `linear-gradient(135deg, ${A.indigo}, ${A.indigoDark})`,
            display: "flex", alignItems: "center", justifyContent: "center",
            color: A.white, fontSize: "1.2rem", fontWeight: 800,
          }}>
            {OWNER.name.charAt(0)}
          </div>
          <div>
            <div style={{ fontSize: "0.92rem", fontWeight: 700, color: A.ink }}>{OWNER.name}</div>
            <div style={{ fontSize: "0.72rem", color: A.gray }}>{OWNER.nameLocal}</div>
            <div style={{ fontSize: "0.7rem", color: A.gray, marginTop: 2 }}>{OWNER.phone} · {OWNER.email}</div>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Ownership History">
        {[
          { owner: "Sarah Chen", from: "April 2022", to: "Present", type: "Purchase" },
          { owner: "Paws & Co. Farm", from: "April 2022", to: "April 2022", type: "Breeder" },
        ].map(({ owner, from, to, type }, i) => (
          <div key={i} style={{
            padding: "10px 0",
            borderBottom: i < 1 ? `1px solid ${A.borderLight}` : "none",
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <div>
              <div style={{ fontSize: "0.82rem", fontWeight: 700, color: A.ink }}>{owner}</div>
              <div style={{ fontSize: "0.7rem", color: A.gray }}>{from} → {to}</div>
            </div>
            <span style={{
              fontSize: "0.65rem", fontWeight: 700,
              background: type === "Purchase" ? A.indigoBg : A.emeraldBg,
              color: type === "Purchase" ? A.indigo : A.emerald,
              padding: "3px 8px", borderRadius: 20,
            }}>
              {type}
            </span>
          </div>
        ))}
      </SectionCard>
    </div>
  );
}

function ActivityTab({ activities }: { activities: ReturnType<typeof getPetActivities> }) {
  const allActivity = [
    { icon: "💉", title: "FVRCP Vaccine recorded", sub: "Paws & Care Clinic", date: "Apr 15, 2024" },
    { icon: "🩺", title: "Annual checkup completed", sub: "Weight 3.5kg · All normal", date: "Apr 15, 2024" },
    { icon: "💊", title: "Deworming Dose — Drontal", sub: "Scheduled by owner", date: "Mar 10, 2024" },
    { icon: "🪪", title: "Pet ID Card generated", sub: "Classic theme", date: "Feb 20, 2024" },
    { icon: "✅", title: "Profile verified by Whiskora", sub: "All documents checked", date: "Jan 10, 2024" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {allActivity.map(({ icon, title, sub, date }, i) => (
        <div key={i} style={{
          display: "flex", gap: 12, alignItems: "flex-start",
          padding: "12px 0",
          borderBottom: i < allActivity.length - 1 ? `1px solid ${A.borderLight}` : "none",
        }}>
          <div style={{
            width: 36, height: 36,
            background: A.indigoBg,
            borderRadius: 10,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18, flexShrink: 0,
          }}>
            {icon}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "0.82rem", fontWeight: 600, color: A.ink }}>{title}</div>
            <div style={{ fontSize: "0.7rem", color: A.gray, marginTop: 1 }}>{sub}</div>
          </div>
          <div style={{ fontSize: "0.65rem", color: A.grayLight, whiteSpace: "nowrap", paddingTop: 2 }}>{date}</div>
        </div>
      ))}
    </div>
  );
}

function SectionCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div style={{
      background: A.white, borderRadius: 16, padding: "16px",
      border: `1px solid ${A.border}`, boxShadow: A.shadow,
    }}>
      <div style={{ fontSize: "0.82rem", fontWeight: 700, color: A.ink, marginBottom: 14 }}>{title}</div>
      {children}
    </div>
  );
}
