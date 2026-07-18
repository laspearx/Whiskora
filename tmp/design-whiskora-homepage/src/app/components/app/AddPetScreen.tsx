import { useState, ReactNode, CSSProperties } from "react";
import { ChevronLeft, ChevronRight, Check, Camera, User } from "lucide-react";
import { A } from "../../appConstants";
import { Screen } from "./AppShell";

interface Props {
  navigate: (s: Screen) => void;
}

const STEPS = ["Basic Info", "Documents", "Ownership", "Confirm"];

const SPECIES = ["Cat", "Dog", "Rabbit", "Bird", "Hamster", "Fish"];
const GENDERS = ["Male", "Female"];

type FormData = {
  name: string; species: string; breed: string; gender: string;
  dob: string; color: string; weight: string;
  hasVaccineCard: boolean; hasMedicalRecord: boolean; hasChip: boolean; chipId: string;
  ownerName: string; ownerPhone: string; ownerAddress: string;
  breederName: string; breederContact: string;
};

export function AddPetScreen({ navigate }: Props) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>({
    name: "", species: "Cat", breed: "", gender: "Female",
    dob: "", color: "", weight: "",
    hasVaccineCard: false, hasMedicalRecord: false, hasChip: false, chipId: "",
    ownerName: "Sarah Chen", ownerPhone: "+66 89 123 4567", ownerAddress: "Bangkok, Thailand",
    breederName: "", breederContact: "",
  });

  const set = (k: keyof FormData, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const goNext = () => { if (step < 4) setStep(step + 1); };
  const goBack = () => { if (step > 1) setStep(step - 1); else navigate("my-pets"); };

  return (
    <div style={{ background: A.surface, minHeight: "100%", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{
        background: A.white,
        padding: "16px 20px",
        borderBottom: `1px solid ${A.border}`,
        position: "sticky", top: 0, zIndex: 10,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <button onClick={goBack} style={{
            width: 36, height: 36, background: A.surface, border: `1px solid ${A.border}`,
            borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer",
          }}>
            <ChevronLeft size={18} color={A.ink} />
          </button>
          <div>
            <h1 style={{ fontSize: "1rem", fontWeight: 800, color: A.ink, lineHeight: 1 }}>Add New Pet</h1>
            <p style={{ fontSize: "0.7rem", color: A.gray, marginTop: 2 }}>Step {step} of 4</p>
          </div>
        </div>

        {/* Progress */}
        <div style={{ display: "flex", gap: 6 }}>
          {STEPS.map((label, i) => (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
              <div style={{
                height: 4,
                background: i + 1 <= step ? A.indigo : A.border,
                borderRadius: 4,
                transition: "background 0.3s",
              }} />
              <span style={{
                fontSize: "0.6rem",
                color: i + 1 === step ? A.indigo : A.grayLight,
                fontWeight: i + 1 === step ? 700 : 400,
                textAlign: "center",
              }}>
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Step content */}
      <div style={{ flex: 1, padding: "20px", display: "flex", flexDirection: "column", gap: 20, overflowY: "auto" }}>
        {step === 1 && <Step1 form={form} set={set} />}
        {step === 2 && <Step2 form={form} set={set} />}
        {step === 3 && <Step3 form={form} set={set} />}
        {step === 4 && <Step4 form={form} navigate={navigate} />}
      </div>

      {/* Footer actions */}
      {step < 4 && (
        <div style={{
          padding: "16px 20px",
          background: A.white,
          borderTop: `1px solid ${A.border}`,
          display: "flex",
          gap: 12,
        }}>
          {step > 1 && (
            <button onClick={goBack} style={{
              flex: 1, padding: "14px", background: A.surface, border: `1px solid ${A.border}`,
              borderRadius: 14, fontWeight: 600, fontSize: "0.9rem", color: A.inkMuted,
              cursor: "pointer", fontFamily: "'Prompt', sans-serif",
            }}>
              Back
            </button>
          )}
          <button onClick={goNext} style={{
            flex: 2, padding: "14px",
            background: `linear-gradient(135deg, ${A.indigo}, ${A.indigoDark})`,
            border: "none", borderRadius: 14,
            fontWeight: 700, fontSize: "0.9rem", color: A.white,
            cursor: "pointer", fontFamily: "'Prompt', sans-serif",
            boxShadow: `0 4px 16px ${A.indigo}44`,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}>
            {step === 3 ? "Review" : "Continue"} <ChevronRight size={18} />
          </button>
        </div>
      )}
    </div>
  );
}

function Step1({ form, set }: { form: FormData; set: (k: keyof FormData, v: any) => void }) {
  return (
    <>
      {/* Photo upload */}
      <div style={{ display: "flex", justifyContent: "center" }}>
        <div style={{
          width: 100, height: 100,
          background: A.indigoBg,
          borderRadius: 28,
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", gap: 6,
          border: `2px dashed ${A.indigo}55`,
          cursor: "pointer",
        }}>
          <Camera size={28} color={A.indigo} />
          <span style={{ fontSize: "0.65rem", color: A.indigo, fontWeight: 600 }}>Add Photo</span>
        </div>
      </div>

      <FormCard title="Basic Information">
        <FormField label="Pet Name" required>
          <input
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="e.g. Mochi"
            style={inputStyle}
          />
        </FormField>

        <FormField label="Species">
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {SPECIES.map((s) => (
              <button key={s} onClick={() => set("species", s)} style={{
                padding: "8px 14px", borderRadius: 10,
                background: form.species === s ? A.indigo : A.surface,
                color: form.species === s ? A.white : A.inkMuted,
                border: `1px solid ${form.species === s ? A.indigo : A.border}`,
                fontSize: "0.78rem", fontWeight: 600, cursor: "pointer",
                fontFamily: "'Prompt', sans-serif",
              }}>
                {s}
              </button>
            ))}
          </div>
        </FormField>

        <FormField label="Breed" required>
          <input
            value={form.breed}
            onChange={(e) => set("breed", e.target.value)}
            placeholder="e.g. Scottish Fold"
            style={inputStyle}
          />
        </FormField>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <FormField label="Gender">
            <div style={{ display: "flex", gap: 8 }}>
              {GENDERS.map((g) => (
                <button key={g} onClick={() => set("gender", g)} style={{
                  flex: 1, padding: "10px 8px", borderRadius: 10,
                  background: form.gender === g ? A.indigo : A.surface,
                  color: form.gender === g ? A.white : A.inkMuted,
                  border: `1px solid ${form.gender === g ? A.indigo : A.border}`,
                  fontSize: "0.78rem", fontWeight: 600, cursor: "pointer",
                  fontFamily: "'Prompt', sans-serif",
                }}>
                  {g}
                </button>
              ))}
            </div>
          </FormField>
          <FormField label="Date of Birth">
            <input type="date" value={form.dob} onChange={(e) => set("dob", e.target.value)} style={inputStyle} />
          </FormField>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <FormField label="Color / Coat">
            <input value={form.color} onChange={(e) => set("color", e.target.value)} placeholder="e.g. Gray Tabby" style={inputStyle} />
          </FormField>
          <FormField label="Weight (kg)">
            <input value={form.weight} onChange={(e) => set("weight", e.target.value)} placeholder="e.g. 3.5" style={inputStyle} />
          </FormField>
        </div>
      </FormCard>
    </>
  );
}

function Step2({ form, set }: { form: FormData; set: (k: keyof FormData, v: any) => void }) {
  return (
    <>
      <FormCard title="Upload Documents">
        {[
          { key: "hasVaccineCard" as keyof FormData, label: "Vaccination Card", desc: "Official vaccine record from vet", icon: "💉" },
          { key: "hasMedicalRecord" as keyof FormData, label: "Medical Records", desc: "Past health history & checkups", icon: "📋" },
          { key: "hasChip" as keyof FormData, label: "Microchip Certificate", desc: "Microchip registration proof", icon: "🔬" },
        ].map(({ key, label, desc, icon }) => (
          <div key={key} style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            padding: "14px",
            background: (form[key] as boolean) ? A.emeraldBg : A.surface,
            borderRadius: 14,
            border: `1px solid ${(form[key] as boolean) ? A.emerald : A.border}`,
            marginBottom: 10,
          }}>
            <div style={{
              width: 44, height: 44,
              background: (form[key] as boolean) ? A.emerald : A.border,
              borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 20, flexShrink: 0,
            }}>
              {(form[key] as boolean) ? <Check size={20} color={A.white} /> : icon}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "0.85rem", fontWeight: 700, color: A.ink }}>{label}</div>
              <div style={{ fontSize: "0.7rem", color: A.gray, marginTop: 1 }}>{desc}</div>
            </div>
            <button
              onClick={() => set(key, !(form[key] as boolean))}
              style={{
                padding: "8px 14px",
                background: (form[key] as boolean) ? A.emerald : A.white,
                color: (form[key] as boolean) ? A.white : A.indigo,
                border: `1px solid ${(form[key] as boolean) ? A.emerald : A.indigo}`,
                borderRadius: 10, fontSize: "0.72rem", fontWeight: 700,
                cursor: "pointer", fontFamily: "'Prompt', sans-serif",
              }}
            >
              {(form[key] as boolean) ? "Added ✓" : "Upload"}
            </button>
          </div>
        ))}
      </FormCard>

      {form.hasChip && (
        <FormCard title="Microchip Details">
          <FormField label="Chip ID Number">
            <input value={form.chipId} onChange={(e) => set("chipId", e.target.value)} placeholder="e.g. TH040924060042" style={inputStyle} />
          </FormField>
        </FormCard>
      )}

      <div style={{
        background: A.indigoBg,
        borderRadius: 14, padding: "14px 16px",
        border: `1px solid ${A.indigo}22`,
      }}>
        <div style={{ fontSize: "0.78rem", fontWeight: 700, color: A.indigo, marginBottom: 4 }}>
          💡 Why upload documents?
        </div>
        <p style={{ fontSize: "0.72rem", color: A.indigoLight, lineHeight: 1.6, margin: 0 }}>
          Documents are encrypted and stored securely. They build trust with vets, boarding facilities, and future owners.
        </p>
      </div>
    </>
  );
}

function Step3({ form, set }: { form: FormData; set: (k: keyof FormData, v: any) => void }) {
  return (
    <>
      <FormCard title="Owner Information">
        <div style={{
          display: "flex", alignItems: "center", gap: 12,
          padding: "12px", background: A.indigoBg, borderRadius: 12, marginBottom: 16,
        }}>
          <div style={{
            width: 44, height: 44,
            background: A.indigo, borderRadius: 12,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <User size={20} color={A.white} />
          </div>
          <div>
            <div style={{ fontSize: "0.88rem", fontWeight: 700, color: A.ink }}>{form.ownerName}</div>
            <div style={{ fontSize: "0.7rem", color: A.indigo }}>Current account · Auto-filled</div>
          </div>
          <div style={{
            marginLeft: "auto",
            background: A.emerald, color: A.white,
            fontSize: "0.65rem", fontWeight: 700,
            padding: "3px 8px", borderRadius: 20,
          }}>
            Primary
          </div>
        </div>

        <FormField label="Full Name">
          <input value={form.ownerName} onChange={(e) => set("ownerName", e.target.value)} style={inputStyle} />
        </FormField>
        <FormField label="Phone Number">
          <input value={form.ownerPhone} onChange={(e) => set("ownerPhone", e.target.value)} style={inputStyle} />
        </FormField>
        <FormField label="Address">
          <input value={form.ownerAddress} onChange={(e) => set("ownerAddress", e.target.value)} style={inputStyle} />
        </FormField>
      </FormCard>

      <FormCard title="Breeder / Source (Optional)">
        <FormField label="Breeder Name">
          <input value={form.breederName} onChange={(e) => set("breederName", e.target.value)} placeholder="e.g. Paws & Co." style={inputStyle} />
        </FormField>
        <FormField label="Contact">
          <input value={form.breederContact} onChange={(e) => set("breederContact", e.target.value)} placeholder="Phone or email" style={inputStyle} />
        </FormField>
      </FormCard>
    </>
  );
}

function Step4({ form, navigate }: { form: FormData; navigate: (s: Screen) => void }) {
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 20px", textAlign: "center", gap: 16 }}>
        <div style={{
          width: 80, height: 80,
          background: A.emeraldBg, borderRadius: "50%",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: `0 0 0 16px ${A.emeraldSub}`,
        }}>
          <Check size={40} color={A.emerald} />
        </div>
        <div>
          <h2 style={{ fontSize: "1.3rem", fontWeight: 800, color: A.ink, marginBottom: 8 }}>
            {form.name || "Your pet"} Added! 🎉
          </h2>
          <p style={{ fontSize: "0.85rem", color: A.gray, lineHeight: 1.7 }}>
            Pet profile created successfully.<br />Whiskora ID assigned and verified.
          </p>
        </div>
        <div style={{
          background: A.surface, borderRadius: 16, padding: "16px 20px",
          border: `1px solid ${A.border}`, width: "100%", textAlign: "left",
        }}>
          <div style={{ fontSize: "0.7rem", color: A.grayLight, marginBottom: 4 }}>Whiskora ID</div>
          <div style={{ fontSize: "1rem", fontWeight: 800, color: A.ink, fontFamily: "monospace" }}>WK-2024-0201</div>
        </div>
        <button
          onClick={() => navigate("my-pets")}
          style={{
            width: "100%", padding: "14px",
            background: `linear-gradient(135deg, ${A.indigo}, ${A.indigoDark})`,
            border: "none", borderRadius: 14,
            fontWeight: 700, fontSize: "0.9rem", color: A.white,
            cursor: "pointer", fontFamily: "'Prompt', sans-serif",
          }}
        >
          View My Pets
        </button>
      </div>
    );
  }

  return (
    <>
      <div style={{ textAlign: "center", marginBottom: 4 }}>
        <h2 style={{ fontSize: "1.05rem", fontWeight: 800, color: A.ink }}>Review & Confirm</h2>
        <p style={{ fontSize: "0.75rem", color: A.gray, marginTop: 4 }}>Please review your pet's information</p>
      </div>

      <FormCard title="Pet Information">
        {[
          ["Name", form.name || "—"],
          ["Species", form.species],
          ["Breed", form.breed || "—"],
          ["Gender", form.gender],
          ["Date of Birth", form.dob || "—"],
          ["Color", form.color || "—"],
          ["Weight", form.weight ? `${form.weight} kg` : "—"],
        ].map(([label, value]) => (
          <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: `1px solid ${A.borderLight}` }}>
            <span style={{ fontSize: "0.78rem", color: A.gray }}>{label}</span>
            <span style={{ fontSize: "0.82rem", fontWeight: 600, color: A.ink }}>{value}</span>
          </div>
        ))}
      </FormCard>

      <FormCard title="Documents">
        {[
          ["Vaccine Card", form.hasVaccineCard],
          ["Medical Records", form.hasMedicalRecord],
          ["Microchip", form.hasChip],
        ].map(([label, uploaded]) => (
          <div key={label as string} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0" }}>
            <span style={{ fontSize: "0.78rem", color: A.gray }}>{label as string}</span>
            <span style={{
              fontSize: "0.7rem", fontWeight: 700,
              color: uploaded ? A.emerald : A.grayLight,
              background: uploaded ? A.emeraldBg : A.surface,
              padding: "3px 10px", borderRadius: 20,
            }}>
              {uploaded ? "✓ Uploaded" : "Not added"}
            </span>
          </div>
        ))}
      </FormCard>

      <button
        onClick={() => setSubmitted(true)}
        style={{
          width: "100%", padding: "16px",
          background: `linear-gradient(135deg, ${A.indigo}, ${A.indigoDark})`,
          border: "none", borderRadius: 16,
          fontWeight: 700, fontSize: "1rem", color: A.white,
          cursor: "pointer", fontFamily: "'Prompt', sans-serif",
          boxShadow: `0 6px 20px ${A.indigo}44`,
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        }}
      >
        <Check size={20} /> Register Pet
      </button>
    </>
  );
}

function FormCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div style={{
      background: A.white,
      borderRadius: 18, padding: "18px",
      border: `1px solid ${A.border}`,
      boxShadow: A.shadow,
      display: "flex", flexDirection: "column", gap: 14,
    }}>
      <h3 style={{ fontSize: "0.88rem", fontWeight: 700, color: A.ink, margin: 0 }}>{title}</h3>
      {children}
    </div>
  );
}

function FormField({ label, required, children }: { label: string; required?: boolean; children: ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontSize: "0.75rem", fontWeight: 600, color: A.inkMuted }}>
        {label}{required && <span style={{ color: A.red }}>*</span>}
      </label>
      {children}
    </div>
  );
}

const inputStyle: CSSProperties = {
  width: "100%",
  padding: "11px 14px",
  background: A.surface,
  border: `1px solid ${A.border}`,
  borderRadius: 12,
  fontSize: "0.85rem",
  color: A.ink,
  outline: "none",
  fontFamily: "'Prompt', sans-serif",
  boxSizing: "border-box",
};
