import { useState } from "react";
import { Search, Plus, Filter, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { A } from "../../appConstants";
import { PETS, Pet } from "../../appData";
import { Screen } from "./AppShell";
import verifiedImg from "../../../imports/Photoroom_20260428_155413.png";

interface Props {
  navigate: (s: Screen, petId?: string) => void;
}

const FILTERS = ["All", "Cat", "Dog", "Rabbit", "Bird"];

const STATUS_CONFIG = {
  "Healthy": { color: A.emerald, bg: A.emeraldBg, icon: <CheckCircle2 size={12} /> },
  "Due for Vaccine": { color: A.amber, bg: A.amberBg, icon: <Clock size={12} /> },
  "Needs Attention": { color: A.red, bg: A.redBg, icon: <AlertCircle size={12} /> },
};

export function MyPetsScreen({ navigate }: Props) {
  const [activeFilter, setActiveFilter] = useState("All");
  const [query, setQuery] = useState("");

  const filtered = PETS.filter((p) => {
    const matchFilter = activeFilter === "All" || p.species === activeFilter;
    const matchQuery = !query || p.name.toLowerCase().includes(query.toLowerCase()) || p.breed.toLowerCase().includes(query.toLowerCase());
    return matchFilter && matchQuery;
  });

  return (
    <div style={{ background: A.surface, minHeight: "100%" }}>
      {/* Header */}
      <div style={{
        background: A.white,
        padding: "16px 20px",
        borderBottom: `1px solid ${A.border}`,
        position: "sticky",
        top: 0,
        zIndex: 10,
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div>
            <h1 style={{ fontSize: "1.15rem", fontWeight: 800, color: A.ink, lineHeight: 1 }}>My Pets</h1>
            <p style={{ fontSize: "0.72rem", color: A.gray, marginTop: 3 }}>{PETS.length} registered pets</p>
          </div>
          <button
            onClick={() => navigate("add-pet")}
            style={{
              background: A.indigo,
              border: "none",
              borderRadius: 12,
              padding: "10px 16px",
              display: "flex", alignItems: "center", gap: 6,
              color: A.white, fontWeight: 600, fontSize: "0.82rem",
              cursor: "pointer", fontFamily: "'Prompt', sans-serif",
              boxShadow: `0 4px 14px ${A.indigo}44`,
            }}
          >
            <Plus size={16} /> Add Pet
          </button>
        </div>

        {/* Search */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          background: A.surface,
          borderRadius: 12,
          padding: "10px 14px",
          border: `1px solid ${A.border}`,
        }}>
          <Search size={16} color={A.grayLight} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search pets..."
            style={{
              flex: 1, background: "none", border: "none", outline: "none",
              fontSize: "0.85rem", color: A.ink, fontFamily: "'Prompt', sans-serif",
            }}
          />
        </div>

        {/* Filters */}
        <div style={{ display: "flex", gap: 8, marginTop: 12, overflowX: "auto", scrollbarWidth: "none", paddingBottom: 2 }}>
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              style={{
                background: activeFilter === f ? A.indigo : A.surface,
                color: activeFilter === f ? A.white : A.gray,
                border: `1px solid ${activeFilter === f ? A.indigo : A.border}`,
                borderRadius: 20,
                padding: "6px 14px",
                fontWeight: 600,
                fontSize: "0.75rem",
                cursor: "pointer",
                fontFamily: "'Prompt', sans-serif",
                whiteSpace: "nowrap",
                flexShrink: 0,
                transition: "all 0.15s",
              }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Pet grid */}
      <div style={{ padding: "16px 16px 24px", display: "flex", flexDirection: "column", gap: 12 }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 20px", color: A.gray }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🐾</div>
            <p style={{ fontSize: "0.9rem", fontWeight: 600 }}>No pets found</p>
          </div>
        ) : (
          filtered.map((pet) => <PetCard key={pet.id} pet={pet} onTap={() => navigate("pet-detail", pet.id)} />)
        )}

        {/* Add pet CTA */}
        <button
          onClick={() => navigate("add-pet")}
          style={{
            background: A.indigoBg,
            border: `1.5px dashed ${A.indigo}55`,
            borderRadius: 18,
            padding: "20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
            cursor: "pointer",
            fontFamily: "'Prompt', sans-serif",
            width: "100%",
          }}
        >
          <div style={{
            width: 40, height: 40,
            background: A.indigo,
            borderRadius: 12,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Plus size={22} color={A.white} />
          </div>
          <div style={{ textAlign: "left" }}>
            <div style={{ fontSize: "0.88rem", fontWeight: 700, color: A.indigo }}>Add New Pet</div>
            <div style={{ fontSize: "0.72rem", color: A.indigoLight }}>Create a digital identity</div>
          </div>
        </button>
      </div>
    </div>
  );
}

function PetCard({ pet, onTap }: { pet: Pet; onTap: () => void }) {
  const status = STATUS_CONFIG[pet.healthStatus];

  return (
    <button
      onClick={onTap}
      style={{
        background: A.white,
        border: `1px solid ${A.border}`,
        borderRadius: 20,
        padding: "16px",
        display: "flex",
        alignItems: "center",
        gap: 14,
        cursor: "pointer",
        boxShadow: A.shadow,
        textAlign: "left",
        width: "100%",
        fontFamily: "'Prompt', sans-serif",
        transition: "box-shadow 0.15s",
      }}
    >
      {/* Photo */}
      <div style={{ position: "relative", flexShrink: 0 }}>
        <img
          src={pet.photo}
          alt={pet.name}
          style={{ width: 72, height: 72, borderRadius: 18, objectFit: "cover" }}
        />
        {pet.verified && (
          <div style={{
            position: "absolute", bottom: -4, right: -4,
            width: 22, height: 22,
            borderRadius: "50%",
            border: `2px solid ${A.white}`,
            overflow: "hidden",
            background: A.white,
          }}>
            <img src={verifiedImg} alt="Verified" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <span style={{ fontSize: "0.95rem", fontWeight: 700, color: A.ink }}>{pet.name}</span>
          <span style={{
            fontSize: "0.62rem",
            background: pet.species === "Cat" ? A.indigoBg : A.emeraldBg,
            color: pet.species === "Cat" ? A.indigo : A.emerald,
            padding: "2px 8px", borderRadius: 10,
            fontWeight: 600,
          }}>
            {pet.species}
          </span>
        </div>
        <div style={{ fontSize: "0.75rem", color: A.gray, marginBottom: 8 }}>
          {pet.breed} · {pet.gender} · {pet.age}
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 4,
            background: status.bg,
            color: status.color,
            fontSize: "0.65rem", fontWeight: 700,
            padding: "3px 8px", borderRadius: 20,
          }}>
            {status.icon}
            {pet.healthStatus}
          </div>
          <div style={{ fontSize: "0.65rem", color: A.grayLight, fontFamily: "monospace" }}>
            #{pet.id.split("-").pop()}
          </div>
        </div>
      </div>

      {/* Arrow */}
      <div style={{ color: A.grayLight, flexShrink: 0 }}>›</div>
    </button>
  );
}
