import { useState } from "react";
import { Search } from "lucide-react";
import { C } from "../constants";

const CATEGORIES = ["ทั้งหมด", "ฟาร์ม", "สัตว์เลี้ยง", "บริการ", "ร้านค้า"];

export function SearchSection() {
  const [active, setActive] = useState("ทั้งหมด");
  const [query, setQuery] = useState("");

  return (
    <section style={{ background: C.cream, padding: "0 24px 60px" }}>
      <div style={{
        maxWidth: 820,
        margin: "0 auto",
        background: C.white,
        borderRadius: 24,
        padding: 28,
        boxShadow: C.shadowLg,
        border: `1px solid ${C.borderLight}`,
        marginTop: -28,
        position: "relative",
        zIndex: 10,
      }}>
        {/* Category tabs */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActive(cat)}
              style={{
                background: active === cat ? C.pink : C.surface,
                color: active === cat ? C.white : C.inkMuted,
                border: "none",
                borderRadius: 10,
                padding: "8px 18px",
                fontWeight: active === cat ? 600 : 500,
                fontSize: "0.85rem",
                cursor: "pointer",
                fontFamily: "'Prompt', sans-serif",
                transition: "all 0.15s",
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search input row */}
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <div style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            gap: 12,
            background: C.surface,
            borderRadius: 14,
            padding: "0 18px",
            border: `1.5px solid ${C.borderLight}`,
            transition: "border-color 0.2s",
          }}>
            <Search size={20} color={C.grayText} style={{ flexShrink: 0 }} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ค้นหาฟาร์ม สายพันธุ์ บริการ หรือร้านค้า..."
              style={{
                flex: 1,
                background: "none",
                border: "none",
                outline: "none",
                fontSize: "1rem",
                color: C.ink,
                fontFamily: "'Prompt', sans-serif",
                fontWeight: 400,
                padding: "16px 0",
              }}
            />
          </div>
          <button
            style={{
              background: C.pink,
              color: C.white,
              border: "none",
              borderRadius: 14,
              padding: "16px 32px",
              fontWeight: 700,
              fontSize: "1rem",
              cursor: "pointer",
              fontFamily: "'Prompt', sans-serif",
              whiteSpace: "nowrap",
              boxShadow: `0 4px 16px ${C.pinkMid}`,
              flexShrink: 0,
            }}
          >
            ค้นหา
          </button>
        </div>

        {/* Popular searches */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
          <span style={{ fontSize: "0.78rem", color: C.grayText, fontWeight: 500 }}>ยอดนิยม:</span>
          {["Scottish Fold", "Golden Retriever", "คลินิกใกล้ฉัน", "บริการอาบน้ำ", "ฟาร์มแมว"].map((tag) => (
            <button
              key={tag}
              style={{
                background: "none",
                border: `1px solid ${C.border}`,
                borderRadius: 20,
                padding: "4px 12px",
                fontSize: "0.75rem",
                color: C.inkMuted,
                cursor: "pointer",
                fontFamily: "'Prompt', sans-serif",
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = C.pink;
                (e.currentTarget as HTMLElement).style.color = C.pink;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = C.border;
                (e.currentTarget as HTMLElement).style.color = C.inkMuted;
              }}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
