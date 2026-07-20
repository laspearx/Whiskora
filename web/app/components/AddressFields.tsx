"use client";

import React, { useState, useEffect, useRef } from "react";

export interface AddressValue {
  house_no: string;
  room_no: string;
  moo: string;
  soi: string;
  road: string;
  sub_district: string;
  district: string;
  province: string;
  postal_code: string;
}

export const emptyAddress = (): AddressValue => ({
  house_no: "", room_no: "", moo: "", soi: "",
  road: "", sub_district: "", district: "", province: "", postal_code: "",
});

export function composeAddress(v: AddressValue): string {
  return [
    v.house_no,
    v.room_no && `ห้อง ${v.room_no}`,
    v.moo && `หมู่ ${v.moo}`,
    v.soi && `ซอย${v.soi}`,
    v.road && `ถนน${v.road}`,
    v.sub_district && `แขวง/ตำบล${v.sub_district}`,
    v.district && `เขต/อำเภอ${v.district}`,
    v.province,
    v.postal_code,
  ].filter(Boolean).join(" ");
}

interface ThaiRecord {
  district: string;
  amphoe: string;
  province: string;
  zipcode: string | number;
}

interface Props {
  value: AddressValue;
  onChange: (v: AddressValue) => void;
  accentColor?: string;
  required?: boolean;
}

export default function AddressFields({ value, onChange, accentColor = "#E84677", required = false }: Props) {
  const [db, setDb] = useState<ThaiRecord[]>([]);
  const [loadError, setLoadError] = useState(false);
  const [provinces, setProvinces] = useState<string[]>([]);
  const [amphoeList, setAmphoeList] = useState<string[]>([]);
  const [subDistList, setSubDistList] = useState<ThaiRecord[]>([]);
  const [sdQuery, setSdQuery] = useState(value.sub_district || "");
  const [showDrop, setShowDrop] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const mod = require("thai-address-database");
        const fn: (q: string, max: number) => ThaiRecord[] = mod.searchAddressByProvince;
        const all = fn(".", 10000);
        setDb(all);
        const pvs = [...new Set(all.map(r => r.province))].sort((a, b) =>
          a.localeCompare(b, "th")
        );
        setProvinces(pvs as string[]);
      } catch {
        setLoadError(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (!value.province) { setAmphoeList([]); setSubDistList([]); return; }
    const byProv = db.filter(r => r.province === value.province);
    setAmphoeList(
      [...new Set(byProv.map(r => r.amphoe))].sort((a, b) => a.localeCompare(b, "th")) as string[]
    );
  }, [value.province, db]);

  useEffect(() => {
    if (!value.province || !value.district) { setSubDistList([]); return; }
    setSubDistList(db.filter(r => r.province === value.province && r.amphoe === value.district));
    setSdQuery(value.sub_district || "");
  }, [value.province, value.district, db]);

  const onProvince = (province: string) =>
    onChange({ ...value, province, district: "", sub_district: "", postal_code: "" });
  const onDistrict = (district: string) => {
    onChange({ ...value, district, sub_district: "", postal_code: "" });
    setSdQuery("");
  };
  const onSubDistSelect = (r: ThaiRecord) => {
    onChange({ ...value, sub_district: r.district, postal_code: String(r.zipcode) });
    setSdQuery(r.district);
    setShowDrop(false);
  };

  const filteredSD = sdQuery.trim()
    ? subDistList.filter(r => r.district.includes(sdQuery.trim()))
    : subDistList;

  const line = "#f3dde3";
  const ink = "#1f1a1c";
  const inkSoft = "#4a3f44";
  const inp: React.CSSProperties = {
    width: "100%", padding: "11px 13px", border: `1.5px solid ${line}`,
    borderRadius: 11, fontSize: 14, color: ink, outline: "none",
    fontFamily: "inherit", background: "white", boxSizing: "border-box",
  };
  const lbl: React.CSSProperties = {
    fontSize: 12, fontWeight: 600, color: inkSoft, marginBottom: 6, display: "block",
  };
  const arrow = `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='%238e7e84' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`;
  const sel: React.CSSProperties = {
    ...inp, appearance: "none", cursor: "pointer",
    backgroundImage: arrow, backgroundRepeat: "no-repeat",
    backgroundPosition: "right 11px center", paddingRight: 36,
  };
  const req = required ? <span style={{ color: accentColor }}>*</span> : null;
  const g3: React.CSSProperties = { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 };
  const g2: React.CSSProperties = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 };

  if (loadError) {
    return (
      <div style={{ padding: "12px 14px", background: "#FEF2F2", borderRadius: 10, fontSize: 13, color: "#DC2626", lineHeight: 1.5 }}>
        ไม่สามารถโหลดข้อมูลที่อยู่ได้ กรุณาติดตั้ง package ก่อน:
        <br /><code style={{ fontWeight: 700 }}>npm install thai-address-database</code>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* บ้านเลขที่ / ห้องที่ / หมู่ */}
      <div style={g3}>
        <div>
          <label style={lbl}>บ้านเลขที่ {req}</label>
          <input style={inp} value={value.house_no} placeholder="เช่น 12/34"
            onChange={e => onChange({ ...value, house_no: e.target.value })} />
        </div>
        <div>
          <label style={lbl}>ห้องที่</label>
          <input style={inp} value={value.room_no} placeholder="ถ้ามี"
            onChange={e => onChange({ ...value, room_no: e.target.value })} />
        </div>
        <div>
          <label style={lbl}>หมู่</label>
          <input style={inp} value={value.moo} placeholder="เช่น 5"
            onChange={e => onChange({ ...value, moo: e.target.value })} />
        </div>
      </div>

      {/* ซอย / ถนน */}
      <div style={g2}>
        <div>
          <label style={lbl}>ซอย</label>
          <input style={inp} value={value.soi} placeholder="เช่น ลาดพร้าว 15"
            onChange={e => onChange({ ...value, soi: e.target.value })} />
        </div>
        <div>
          <label style={lbl}>ถนน</label>
          <input style={inp} value={value.road} placeholder="เช่น รัชดาภิเษก"
            onChange={e => onChange({ ...value, road: e.target.value })} />
        </div>
      </div>

      {/* จังหวัด / เขต-อำเภอ */}
      <div style={g2}>
        <div>
          <label style={lbl}>จังหวัด {req}</label>
          <select style={sel} value={value.province} onChange={e => onProvince(e.target.value)}>
            <option value="">-- เลือกจังหวัด --</option>
            {provinces.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div>
          <label style={lbl}>เขต / อำเภอ {req}</label>
          <select
            style={{ ...sel, opacity: !value.province ? 0.5 : 1 }}
            value={value.district}
            disabled={!value.province}
            onChange={e => onDistrict(e.target.value)}
          >
            <option value="">-- เลือกเขต/อำเภอ --</option>
            {amphoeList.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
      </div>

      {/* แขวง-ตำบล (typeahead) / รหัสไปรษณีย์ */}
      <div style={g2}>
        <div style={{ position: "relative" }}>
          <label style={lbl}>แขวง / ตำบล {req}</label>
          <input
            style={{ ...inp, opacity: !value.district ? 0.5 : 1 }}
            value={sdQuery}
            disabled={!value.district}
            placeholder={value.district ? "พิมพ์เพื่อค้นหา..." : "เลือกเขต/อำเภอก่อน"}
            onChange={e => {
              setSdQuery(e.target.value);
              setShowDrop(true);
              onChange({ ...value, sub_district: e.target.value, postal_code: "" });
            }}
            onFocus={() => setShowDrop(true)}
            onBlur={() => setTimeout(() => setShowDrop(false), 200)}
          />
          {showDrop && filteredSD.length > 0 && (
            <div style={{
              position: "absolute", top: "100%", left: 0, right: 0, marginTop: 3,
              background: "white", border: `1.5px solid ${line}`, borderRadius: 11,
              zIndex: 200, maxHeight: 200, overflowY: "auto",
              boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
            }}>
              {filteredSD.slice(0, 30).map(r => (
                <div
                  key={r.district + r.zipcode}
                  onMouseDown={() => onSubDistSelect(r)}
                  style={{ padding: "10px 14px", cursor: "pointer", fontSize: 13, borderBottom: `1px solid ${line}` }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#fde2ea")}
                  onMouseLeave={e => (e.currentTarget.style.background = "white")}
                >
                  {r.district}
                </div>
              ))}
            </div>
          )}
        </div>
        <div>
          <label style={lbl}>รหัสไปรษณีย์</label>
          <input
            style={{ ...inp, background: value.postal_code ? "#fdf9fb" : "white" }}
            value={value.postal_code}
            placeholder="ระบุอัตโนมัติ"
            onChange={e => onChange({ ...value, postal_code: e.target.value })}
          />
        </div>
      </div>
    </div>
  );
}
