"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const F = {
  ink: '#111827', inkSoft: '#4B5563', muted: '#9CA3AF',
  pink: '#E84677', pinkSoft: '#FDF2F5', pinkBorder: '#FBCFE8',
  line: '#E5E7EB', paper: '#FFFFFF',
};

const Icon = {
  ArrowLeft: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>,
  ChevronDown: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>,
  Reset: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>,
};

/* ─── Tool 1: Age Calculator ───────────────────────────────────────────────── */
function AgeCalculator() {
  const [type, setType] = useState<'cat' | 'dog_small' | 'dog_medium' | 'dog_large'>('cat');
  const [age, setAge] = useState('');

  const calcHuman = () => {
    const y = parseFloat(age);
    if (!y || y <= 0) return null;
    if (type === 'cat') {
      if (y <= 1) return Math.round(y * 15);
      if (y <= 2) return Math.round(15 + (y - 1) * 9);
      return Math.round(24 + (y - 2) * 4);
    }
    if (type === 'dog_small') {
      if (y <= 1) return Math.round(y * 15);
      if (y <= 2) return Math.round(15 + (y - 1) * 9);
      return Math.round(24 + (y - 2) * 4);
    }
    if (type === 'dog_medium') {
      if (y <= 1) return Math.round(y * 15);
      if (y <= 2) return Math.round(15 + (y - 1) * 9);
      return Math.round(24 + (y - 2) * 5);
    }
    // dog_large
    if (y <= 1) return Math.round(y * 15);
    if (y <= 2) return Math.round(15 + (y - 1) * 9);
    return Math.round(24 + (y - 2) * 7);
  };

  const human = calcHuman();

  return (
    <div className="tool-body">
      <div className="tool-row">
        <label className="tool-label">ประเภทสัตว์เลี้ยง</label>
        <select className="tool-select" value={type} onChange={e => setType(e.target.value as any)}>
          <option value="cat">🐱 แมว</option>
          <option value="dog_small">🐶 สุนัขตัวเล็ก (&lt;10kg)</option>
          <option value="dog_medium">🐕 สุนัขตัวกลาง (10–25kg)</option>
          <option value="dog_large">🐕‍🦺 สุนัขตัวใหญ่ (&gt;25kg)</option>
        </select>
      </div>
      <div className="tool-row">
        <label className="tool-label">อายุ (ปี)</label>
        <input
          className="tool-input"
          type="number"
          min="0"
          max="30"
          step="0.5"
          placeholder="เช่น 3 หรือ 1.5"
          value={age}
          onChange={e => setAge(e.target.value)}
        />
      </div>
      {human !== null && (
        <div className="tool-result">
          <div className="tool-result-label">เทียบเท่าอายุมนุษย์</div>
          <div className="tool-result-value">{human} <span>ปี</span></div>
          <div className="tool-result-note">
            {human < 18 ? '🧒 วัยเด็กและวัยรุ่น — ยังต้องการการดูแลใกล้ชิด'
              : human < 40 ? '🧑 วัยหนุ่มสาว — แข็งแรงและกระฉับกระเฉง'
              : human < 60 ? '🧔 วัยกลางคน — เริ่มตรวจสุขภาพประจำปี'
              : '👴 วัยชรา — ควรพบสัตวแพทย์บ่อยขึ้น'}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Tool 2: Gestation Calculator ─────────────────────────────────────────── */
function GestationCalculator() {
  const [species, setSpecies] = useState('cat');
  const [matingDate, setMatingDate] = useState('');

  const GESTATION: Record<string, { days: number; label: string }> = {
    cat: { days: 65, label: 'แมว' },
    dog: { days: 63, label: 'สุนัข' },
    rabbit: { days: 31, label: 'กระต่าย' },
    hamster: { days: 16, label: 'แฮมสเตอร์' },
    guinea_pig: { days: 68, label: 'หนูตะเภา' },
    ferret: { days: 42, label: 'เฟอร์เรต' },
    chinchilla: { days: 111, label: 'ชินชิลล่า' },
  };

  const calcBirth = () => {
    if (!matingDate) return null;
    const d = new Date(matingDate);
    d.setDate(d.getDate() + GESTATION[species].days);
    return d;
  };

  const birthDate = calcBirth();
  const fmt = (d: Date) => d.toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const daysLeft = birthDate ? Math.max(0, Math.ceil((birthDate.getTime() - Date.now()) / 86400000)) : null;

  return (
    <div className="tool-body">
      <div className="tool-row">
        <label className="tool-label">ชนิดสัตว์เลี้ยง</label>
        <select className="tool-select" value={species} onChange={e => setSpecies(e.target.value)}>
          {Object.entries(GESTATION).map(([k, v]) => (
            <option key={k} value={k}>{v.label} ({v.days} วัน)</option>
          ))}
        </select>
      </div>
      <div className="tool-row">
        <label className="tool-label">วันที่ผสมพันธุ์</label>
        <input
          className="tool-input"
          type="date"
          value={matingDate}
          onChange={e => setMatingDate(e.target.value)}
        />
      </div>
      {birthDate && (
        <div className="tool-result">
          <div className="tool-result-label">วันกำหนดคลอด (โดยประมาณ)</div>
          <div className="tool-result-value" style={{ fontSize: 18 }}>{fmt(birthDate)}</div>
          {daysLeft !== null && (
            <div className="tool-result-note">
              {daysLeft > 0
                ? `🗓️ อีก ${daysLeft} วัน — เตรียมกล่องคลอดและติดต่อสัตวแพทย์ล่วงหน้า`
                : '🐣 ถึงกำหนดคลอดแล้ว! เฝ้าสังเกตอาการอย่างใกล้ชิด'}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Tool 3: Calorie / Feeding Calculator ──────────────────────────────────── */
function CalorieCalculator() {
  const [species, setSpecies] = useState<'cat' | 'dog'>('cat');
  const [weight, setWeight] = useState('');
  const [activity, setActivity] = useState<'low' | 'normal' | 'high' | 'kitten'>('normal');
  const [neutered, setNeutered] = useState(false);

  const calc = () => {
    const w = parseFloat(weight);
    if (!w || w <= 0) return null;
    // RER (Resting Energy Requirement) = 70 × (BW_kg)^0.75
    const rer = 70 * Math.pow(w, 0.75);
    const factorMap = {
      kitten: 2.5,
      low: neutered ? 1.2 : 1.4,
      normal: neutered ? 1.4 : 1.6,
      high: neutered ? 1.6 : 1.8,
    };
    const factor = factorMap[activity];
    const kcal = Math.round(rer * factor);
    // dry food ~3.5 kcal/g, wet food ~1.0 kcal/g
    const dryGram = Math.round(kcal / 3.5);
    const wetGram = Math.round(kcal / 1.0);
    return { kcal, dryGram, wetGram };
  };

  const result = calc();

  return (
    <div className="tool-body">
      <div className="tool-row">
        <label className="tool-label">ชนิด</label>
        <div className="tool-toggle">
          <button className={`tool-toggle-btn ${species === 'cat' ? 'active' : ''}`} onClick={() => setSpecies('cat')}>🐱 แมว</button>
          <button className={`tool-toggle-btn ${species === 'dog' ? 'active' : ''}`} onClick={() => setSpecies('dog')}>🐶 สุนัข</button>
        </div>
      </div>
      <div className="tool-row">
        <label className="tool-label">น้ำหนักตัว (kg)</label>
        <input
          className="tool-input"
          type="number"
          min="0.1"
          max="100"
          step="0.1"
          placeholder="เช่น 4.5"
          value={weight}
          onChange={e => setWeight(e.target.value)}
        />
      </div>
      <div className="tool-row">
        <label className="tool-label">ระดับกิจกรรม</label>
        <select className="tool-select" value={activity} onChange={e => setActivity(e.target.value as any)}>
          <option value="kitten">🍼 ลูกสัตว์ / กำลังเติบโต</option>
          <option value="low">🛋️ นอนบ้านเป็นหลัก (ออกกำลังน้อย)</option>
          <option value="normal">🚶 ปกติทั่วไป</option>
          <option value="high">🏃 กระฉับกระเฉง / ออกกำลังสม่ำเสมอ</option>
        </select>
      </div>
      <div className="tool-row">
        <label className="tool-label">ทำหมันแล้ว?</label>
        <div className="tool-toggle">
          <button className={`tool-toggle-btn ${!neutered ? 'active' : ''}`} onClick={() => setNeutered(false)}>ยังไม่ทำ</button>
          <button className={`tool-toggle-btn ${neutered ? 'active' : ''}`} onClick={() => setNeutered(true)}>ทำหมันแล้ว</button>
        </div>
      </div>
      {result && (
        <div className="tool-result">
          <div className="tool-result-label">พลังงานที่ต้องการต่อวัน</div>
          <div className="tool-result-value">{result.kcal} <span>kcal/วัน</span></div>
          <div className="tool-result-grid">
            <div className="tool-result-card">
              <div className="tool-result-card-icon">🥣</div>
              <div className="tool-result-card-label">อาหารเม็ด (Dry)</div>
              <div className="tool-result-card-val">{result.dryGram} <span>กรัม/วัน</span></div>
              <div className="tool-result-card-note">~3.5 kcal/g</div>
            </div>
            <div className="tool-result-card">
              <div className="tool-result-card-icon">🥫</div>
              <div className="tool-result-card-label">อาหารเปียก (Wet)</div>
              <div className="tool-result-card-val">{result.wetGram} <span>กรัม/วัน</span></div>
              <div className="tool-result-card-note">~1.0 kcal/g</div>
            </div>
          </div>
          <div className="tool-result-note">⚠️ ค่านี้เป็นการประมาณการ ควรปรึกษาสัตวแพทย์เพื่อคำแนะนำที่เหมาะสมกับสัตว์เลี้ยงของคุณ</div>
        </div>
      )}
    </div>
  );
}

/* ─── Tool 4: BMI / Weight Status ───────────────────────────────────────────── */
function WeightChecker() {
  const [species, setSpecies] = useState<'cat' | 'dog'>('cat');
  const [weight, setWeight] = useState('');
  const [breed, setBreed] = useState('mixed');

  const CAT_RANGES: Record<string, { min: number; max: number; label: string }> = {
    mixed: { min: 3.5, max: 5.5, label: 'แมวบ้าน / ทั่วไป' },
    persian: { min: 4.0, max: 7.0, label: 'เปอร์เซีย' },
    siamese: { min: 3.0, max: 5.0, label: 'สยาม' },
    maine: { min: 5.0, max: 10.0, label: 'เมนคูน' },
  };

  const DOG_RANGES: Record<string, { min: number; max: number; label: string }> = {
    mixed: { min: 5.0, max: 30.0, label: 'ลูกผสม / ทั่วไป' },
    chihuahua: { min: 1.5, max: 3.0, label: 'ชิวาวา' },
    golden: { min: 25.0, max: 34.0, label: 'โกลเด้น รีทรีฟเวอร์' },
    shiba: { min: 8.0, max: 11.0, label: 'ชิบะ อินุ' },
  };

  const ranges = species === 'cat' ? CAT_RANGES : DOG_RANGES;
  const w = parseFloat(weight);
  const range = ranges[breed] || ranges['mixed'];

  const getStatus = () => {
    if (!w || w <= 0) return null;
    if (w < range.min * 0.85) return { text: 'น้ำหนักน้อยมาก', color: '#DC2626', bg: '#FEF2F2', tip: 'ควรเพิ่มปริมาณอาหารและปรึกษาสัตวแพทย์โดยเร็ว' };
    if (w < range.min) return { text: 'น้ำหนักน้อย', color: '#D97706', bg: '#FFFBEB', tip: 'ลองเพิ่มปริมาณอาหารทีละน้อย และติดตามน้ำหนักสม่ำเสมอ' };
    if (w <= range.max) return { text: 'น้ำหนักปกติ ✓', color: '#16A34A', bg: '#F0FDF4', tip: 'น้ำหนักอยู่ในเกณฑ์มาตรฐาน รักษาระดับนี้ต่อไป!' };
    if (w <= range.max * 1.15) return { text: 'น้ำหนักเกินเล็กน้อย', color: '#D97706', bg: '#FFFBEB', tip: 'ลดปริมาณอาหารลงเล็กน้อยและเพิ่มการออกกำลังกาย' };
    return { text: 'น้ำหนักเกิน', color: '#DC2626', bg: '#FEF2F2', tip: 'ควรปรึกษาสัตวแพทย์เพื่อโปรแกรมลดน้ำหนักที่เหมาะสม' };
  };

  const status = getStatus();

  return (
    <div className="tool-body">
      <div className="tool-row">
        <label className="tool-label">ชนิด</label>
        <div className="tool-toggle">
          <button className={`tool-toggle-btn ${species === 'cat' ? 'active' : ''}`} onClick={() => { setSpecies('cat'); setBreed('mixed'); }}>🐱 แมว</button>
          <button className={`tool-toggle-btn ${species === 'dog' ? 'active' : ''}`} onClick={() => { setSpecies('dog'); setBreed('mixed'); }}>🐶 สุนัข</button>
        </div>
      </div>
      <div className="tool-row">
        <label className="tool-label">สายพันธุ์</label>
        <select className="tool-select" value={breed} onChange={e => setBreed(e.target.value)}>
          {Object.entries(ranges).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
      </div>
      <div className="tool-row">
        <label className="tool-label">น้ำหนักตัว (kg)</label>
        <input
          className="tool-input"
          type="number"
          step="0.1"
          min="0.1"
          placeholder="เช่น 4.5"
          value={weight}
          onChange={e => setWeight(e.target.value)}
        />
      </div>
      {status && (
        <div className="tool-result" style={{ background: status.bg, borderColor: status.color + '40' }}>
          <div className="tool-result-label">ผลการประเมิน</div>
          <div className="tool-result-value" style={{ color: status.color }}>{status.text}</div>
          <div className="tool-result-note" style={{ color: status.color }}>
            {status.tip}<br />
            <span style={{ color: F.muted, marginTop: 4, display: 'block' }}>
              เกณฑ์ {range.label}: {range.min}–{range.max} kg
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────────────────────────────── */
const TOOLS = [
  {
    id: 'age',
    emoji: '🎂',
    title: 'Pet Age Calculator',
    titleTh: 'คำนวณอายุเทียบมนุษย์',
    desc: 'แปลงอายุสัตว์เลี้ยงเป็นปีมนุษย์',
    color: '#FFF0F5',
    component: <AgeCalculator />,
  },
  {
    id: 'gestation',
    emoji: '🐣',
    title: 'Gestation Calculator',
    titleTh: 'คำนวณวันกำหนดคลอด',
    desc: 'คาดการณ์วันคลอดจากวันผสมพันธุ์',
    color: '#F0FFF4',
    component: <GestationCalculator />,
  },
  {
    id: 'calorie',
    emoji: '🍽️',
    title: 'Daily Feeding Calculator',
    titleTh: 'คำนวณปริมาณอาหารต่อวัน',
    desc: 'คำนวณ kcal และปริมาณอาหารที่เหมาะสม',
    color: '#FFFBF0',
    component: <CalorieCalculator />,
  },
  {
    id: 'weight',
    emoji: '⚖️',
    title: 'Weight Status Checker',
    titleTh: 'ตรวจสอบน้ำหนักมาตรฐาน',
    desc: 'เช็คว่าน้ำหนักสัตว์เลี้ยงอยู่ในเกณฑ์ปกติหรือไม่',
    color: '#F0F4FF',
    component: <WeightChecker />,
  },
];

export default function PetToolsPage() {
  const router = useRouter();
  const [open, setOpen] = useState<string | null>('age');

  return (
    <>
      <style>{`
        .pt-page { font-family: inherit; min-height: 100vh; background: #FFFAFC; }
        .pt-wrap { max-width: 640px; margin: 0 auto; padding: 24px 20px 80px; }

        .pt-topbar { display: flex; align-items: center; gap: 14px; margin-bottom: 24px; }
        .pt-back { display: inline-flex; align-items: center; justify-content: center; width: 40px; height: 40px; border-radius: 12px; background: white; color: #6B7280; cursor: pointer; border: 1px solid #E5E7EB; box-shadow: 0 1px 2px rgba(0,0,0,0.05); transition: all .18s; flex-shrink: 0; }
        .pt-back:hover { background: #F9FAFB; color: #111827; transform: translateX(-1px); }
        .pt-head h1 { font-size: 22px; font-weight: 800; color: ${F.ink}; }
        .pt-head p { font-size: 12px; font-weight: 600; color: ${F.muted}; margin-top: 2px; text-transform: uppercase; letter-spacing: 0.1em; }

        .pt-intro { background: linear-gradient(135deg, #FFF0F5, #FFFAFC); border: 1.5px solid #FBCFE8; border-radius: 20px; padding: 18px 20px; margin-bottom: 24px; font-size: 13px; font-weight: 500; color: ${F.inkSoft}; line-height: 1.6; }

        /* tool accordion */
        .pt-tools { display: flex; flex-direction: column; gap: 12px; }
        .pt-tool { background: white; border: 1.5px solid ${F.line}; border-radius: 20px; overflow: hidden; transition: border-color .18s; }
        .pt-tool.is-open { border-color: #FBCFE8; box-shadow: 0 4px 16px rgba(232,70,119,0.1); }
        .pt-tool-header { display: flex; align-items: center; gap: 14px; padding: 16px 18px; cursor: pointer; }
        .pt-tool-icon { width: 48px; height: 48px; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 24px; flex-shrink: 0; }
        .pt-tool-info { flex: 1; min-width: 0; }
        .pt-tool-title { font-size: 15px; font-weight: 800; color: ${F.ink}; }
        .pt-tool-title-th { font-size: 12px; font-weight: 600; color: ${F.pink}; margin-top: 1px; }
        .pt-tool-desc { font-size: 11px; color: ${F.muted}; margin-top: 2px; }
        .pt-tool-chevron { color: ${F.muted}; transition: transform .2s; flex-shrink: 0; }
        .pt-tool.is-open .pt-tool-chevron { transform: rotate(180deg); color: ${F.pink}; }

        /* tool body */
        .tool-body { padding: 0 18px 20px; display: flex; flex-direction: column; gap: 14px; border-top: 1px solid ${F.line}; padding-top: 16px; }
        .tool-row { display: flex; flex-direction: column; gap: 5px; }
        .tool-label { font-size: 12px; font-weight: 700; color: ${F.inkSoft}; }
        .tool-select { width: 100%; background: #F9FAFB; border: 1.5px solid ${F.line}; border-radius: 12px; padding: 10px 14px; font-size: 14px; font-family: inherit; color: ${F.ink}; outline: none; transition: border-color .18s; }
        .tool-select:focus { border-color: #FBCFE8; background: white; }
        .tool-input { width: 100%; background: #F9FAFB; border: 1.5px solid ${F.line}; border-radius: 12px; padding: 10px 14px; font-size: 14px; font-family: inherit; color: ${F.ink}; outline: none; transition: border-color .18s; }
        .tool-input:focus { border-color: #FBCFE8; background: white; }
        .tool-toggle { display: flex; background: #F3F4F6; border-radius: 12px; padding: 3px; gap: 3px; }
        .tool-toggle-btn { flex: 1; padding: 8px; border: none; border-radius: 9px; font-size: 13px; font-weight: 700; cursor: pointer; transition: all .18s; font-family: inherit; background: transparent; color: ${F.muted}; }
        .tool-toggle-btn.active { background: white; color: ${F.pink}; box-shadow: 0 1px 4px rgba(0,0,0,0.1); }

        /* result */
        .tool-result { background: #FFF5F8; border: 1.5px solid #FBCFE8; border-radius: 16px; padding: 16px 18px; }
        .tool-result-label { font-size: 11px; font-weight: 700; color: ${F.muted}; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 6px; }
        .tool-result-value { font-size: 28px; font-weight: 900; color: ${F.pink}; line-height: 1.1; margin-bottom: 6px; }
        .tool-result-value span { font-size: 14px; font-weight: 600; color: ${F.inkSoft}; }
        .tool-result-note { font-size: 12px; font-weight: 500; color: ${F.inkSoft}; line-height: 1.6; }
        .tool-result-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 10px 0; }
        .tool-result-card { background: white; border-radius: 12px; padding: 12px; text-align: center; }
        .tool-result-card-icon { font-size: 20px; margin-bottom: 4px; }
        .tool-result-card-label { font-size: 10px; font-weight: 700; color: ${F.muted}; margin-bottom: 4px; }
        .tool-result-card-val { font-size: 18px; font-weight: 900; color: ${F.ink}; }
        .tool-result-card-val span { font-size: 11px; font-weight: 600; color: ${F.muted}; }
        .tool-result-card-note { font-size: 10px; color: ${F.muted}; margin-top: 2px; }

        input[type="date"] { -webkit-appearance: none; appearance: none; }

        @media (max-width: 480px) {
          .pt-wrap { padding: 16px 14px 60px; }
        }
      `}</style>

      <div className="pt-page">
        <div className="pt-wrap">

          <div className="pt-topbar">
            <button onClick={() => router.back()} className="pt-back"><Icon.ArrowLeft /></button>
            <div className="pt-head">
              <h1>Pet Utility Tools</h1>
              <p>เครื่องมือสำหรับผู้เลี้ยง</p>
            </div>
          </div>

          <div className="pt-intro">
            🧮 รวมเครื่องมือคำนวณที่ช่วยให้การดูแลสัตว์เลี้ยงง่ายขึ้น
            ตั้งแต่คำนวณอายุ วางแผนการผสมพันธุ์ ไปจนถึงจัดการโภชนาการรายวัน
          </div>

          <div className="pt-tools">
            {TOOLS.map(tool => (
              <div key={tool.id} className={`pt-tool ${open === tool.id ? 'is-open' : ''}`}>
                <div className="pt-tool-header" onClick={() => setOpen(open === tool.id ? null : tool.id)}>
                  <div className="pt-tool-icon" style={{ background: tool.color }}>{tool.emoji}</div>
                  <div className="pt-tool-info">
                    <div className="pt-tool-title">{tool.title}</div>
                    <div className="pt-tool-title-th">{tool.titleTh}</div>
                    <div className="pt-tool-desc">{tool.desc}</div>
                  </div>
                  <div className="pt-tool-chevron"><Icon.ChevronDown /></div>
                </div>
                {open === tool.id && tool.component}
              </div>
            ))}
          </div>

        </div>
      </div>
    </>
  );
}
