"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useFarmAccess } from "@/app/farm-dashboard/[id]/layout";
import PageLoader from "@/app/components/PageLoader";

const F = {
  ink: "#111827", inkSoft: "#4B5563", muted: "#9CA3AF",
  pink: "#E84677", pinkSoft: "#FDF2F5", pinkBorder: "#FBCFE8",
  line: "#F3F4F6", lineMid: "#E5E7EB", bg: "#fffafc",
};

type Tier = 'public' | 'registered' | 'engaged' | 'owner' | 'private';

const TIER_LABEL: Record<Tier, string> = {
  public: 'สาธารณะ', registered: 'สมาชิก', engaged: 'ผู้ที่จองไว้',
  owner: 'เจ้าของ', private: 'ทีมฟาร์มเท่านั้น',
};
const TIER_COLOR: Record<Tier, { bg: string; fg: string }> = {
  public:     { bg: '#FDE2EA', fg: '#7A2140' },
  registered: { bg: '#F6B9CD', fg: '#6B1C37' },
  engaged:    { bg: '#EA86A6', fg: '#4A1327' },
  owner:      { bg: '#CF4C78', fg: '#FFFFFF' },
  private:    { bg: '#7A2140', fg: '#FFFFFF' },
};
const TIER_ORDER: Tier[] = ['public', 'registered', 'engaged', 'owner', 'private'];

interface FieldGroup { key: string; label_th: string; label_en: string; default_tier: Tier; sort_order: number; }

const PRESETS: { id: string; icon: string; name: string; desc: string; recommended?: boolean; tiers: Record<string, Tier> }[] = [
  {
    id: 'open', icon: '🌍', name: 'เปิดกว้าง',
    desc: 'ทุกอย่างเปิดเป็นสาธารณะหรือดูได้เมื่อล็อกอิน เหมาะกับผู้เลี้ยงทั่วไปที่อยากให้คนเจอง่าย',
    tiers: {
      overview: 'public', pedigree: 'registered', health: 'registered', vaccination: 'registered',
      weight: 'registered', dna: 'registered', medical_notes: 'registered', documents: 'registered',
      certificates: 'public', timeline: 'public',
    },
  },
  {
    id: 'breeder', icon: '🛡️', name: 'ผู้เพาะพันธุ์มืออาชีพ', recommended: true,
    desc: 'รูปและข้อมูลทั่วไปเปิดสาธารณะ ส่วนสายเลือด/DNA/สุขภาพปิดไว้ให้ทีมฟาร์มหรือเจ้าของเท่านั้น',
    tiers: {
      overview: 'public', pedigree: 'private', health: 'owner', vaccination: 'engaged',
      weight: 'engaged', dna: 'private', medical_notes: 'private', documents: 'private',
      certificates: 'owner', timeline: 'registered',
    },
  },
  {
    id: 'locked', icon: '🔒', name: 'ปิดหมด',
    desc: 'เห็นแค่ข้อมูลทั่วไป ส่วนที่เหลือให้ทีมฟาร์มของคุณเท่านั้นที่เข้าถึงได้',
    tiers: {
      overview: 'public', pedigree: 'private', health: 'private', vaccination: 'private',
      weight: 'private', dna: 'private', medical_notes: 'private', documents: 'private',
      certificates: 'private', timeline: 'private',
    },
  },
];

export default function FarmPrivacyPage() {
  const params = useParams();
  const farmId = params?.id as string;
  const { myRole } = useFarmAccess();
  const canEdit = myRole === 'owner' || myRole === 'manager';

  const [loading, setLoading] = useState(true);
  const [fieldGroups, setFieldGroups] = useState<FieldGroup[]>([]);
  const [tiers, setTiers] = useState<Record<string, Tier>>({});
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [toast, setToast] = useState('');

  useEffect(() => {
    const load = async () => {
      const [fgRes, fvsRes] = await Promise.all([
        supabase.from('field_groups').select('key, label_th, label_en, default_tier, sort_order')
          .eq('resource_type', 'pet').order('sort_order'),
        supabase.from('farm_visibility_settings').select('field_group_key, tier').eq('farm_id', farmId),
      ]);
      const groups = (fgRes.data || []) as FieldGroup[];
      setFieldGroups(groups);
      const merged: Record<string, Tier> = {};
      for (const g of groups) merged[g.key] = g.default_tier;
      for (const row of fvsRes.data || []) merged[row.field_group_key] = row.tier as Tier;
      setTiers(merged);
      setLoading(false);
    };
    if (farmId) load();
  }, [farmId]);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2200); };

  const saveTier = async (key: string, tier: Tier) => {
    if (!canEdit) return;
    setSavingKey(key);
    setTiers(prev => ({ ...prev, [key]: tier }));
    const { data: { session } } = await supabase.auth.getSession();
    const { error } = await supabase.from('farm_visibility_settings').upsert({
      farm_id: Number(farmId), field_group_key: key, tier,
      updated_by: session?.user.id, updated_at: new Date().toISOString(),
    }, { onConflict: 'farm_id,field_group_key' });
    setSavingKey(null);
    if (error) { showToast('บันทึกไม่สำเร็จ: ' + error.message); return; }
  };

  const applyPreset = async (preset: typeof PRESETS[number]) => {
    if (!canEdit) return;
    setActivePreset(preset.id);
    setTiers(prev => ({ ...prev, ...preset.tiers }));
    const { data: { session } } = await supabase.auth.getSession();
    const rows = fieldGroups.map(g => ({
      farm_id: Number(farmId), field_group_key: g.key,
      tier: preset.tiers[g.key] || g.default_tier,
      updated_by: session?.user.id, updated_at: new Date().toISOString(),
    }));
    const { error } = await supabase.from('farm_visibility_settings').upsert(rows, { onConflict: 'farm_id,field_group_key' });
    if (error) { showToast('บันทึกไม่สำเร็จ: ' + error.message); return; }
    showToast(`ใช้ค่าตั้งต้น "${preset.name}" กับสัตว์ทุกตัวในฟาร์มแล้ว`);
  };

  if (loading) return <PageLoader />;

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        .pv-page { font-family: inherit; min-height: 100vh; background: ${F.bg}; color: ${F.ink}; }
        .pv-body { max-width: 720px; margin: 0 auto; padding: 24px 16px calc(68px + env(safe-area-inset-bottom,0px) + 24px); }
        .pv-title { font-size: 22px; font-weight: 700; color: ${F.ink}; }
        .pv-sub { font-size: 12px; color: ${F.muted}; margin-top: 2px; margin-bottom: 20px; }

        .pv-readonly-banner { background: #FFFBEB; border: 1px solid #FDE68A; color: #92400E; border-radius: 12px; padding: 12px 16px; font-size: 13px; margin-bottom: 18px; }

        .pv-presets { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 22px; }
        @media (max-width: 560px) { .pv-presets { grid-template-columns: 1fr; } }
        .pv-preset { text-align: left; border: 1.5px solid ${F.lineMid}; border-radius: 14px; padding: 14px 15px; background: white; cursor: pointer; font-family: inherit; transition: all .15s; }
        .pv-preset:hover { border-color: ${F.pinkBorder}; }
        .pv-preset.active { border-color: ${F.pink}; background: ${F.pinkSoft}; }
        .pv-preset:disabled { cursor: default; opacity: .7; }
        .pv-preset-icon { font-size: 20px; margin-bottom: 6px; }
        .pv-preset-name { font-size: 14px; font-weight: 700; color: ${F.ink}; margin-bottom: 4px; }
        .pv-preset.active .pv-preset-name { color: ${F.pink}; }
        .pv-preset-desc { font-size: 11.5px; color: ${F.muted}; line-height: 1.45; }
        .pv-preset-badge { display: inline-block; font-size: 9.5px; font-weight: 700; letter-spacing: .05em; text-transform: uppercase; color: ${F.pink}; margin-top: 8px; }

        .pv-customize-toggle { display: flex; align-items: center; gap: 6px; background: none; border: none; padding: 8px 0; font-family: inherit; font-size: 13px; font-weight: 700; color: ${F.inkSoft}; cursor: pointer; margin-bottom: 8px; }

        .pv-card { background: white; border: 1px solid ${F.lineMid}; border-radius: 14px; overflow: hidden; }
        .pv-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 13px 16px; border-bottom: 1px solid ${F.line}; }
        .pv-row:last-child { border-bottom: none; }
        .pv-row-name { font-size: 13.5px; font-weight: 600; color: ${F.ink}; }
        .pv-select { padding: 6px 30px 6px 12px; border-radius: 999px; border: none; font-family: inherit; font-size: 11.5px; font-weight: 700; cursor: pointer; appearance: none; background-repeat: no-repeat; background-position: right 10px center; background-size: 12px; }
        .pv-select:disabled { cursor: default; opacity: .85; }

        .pv-toast { position: fixed; bottom: 28px; left: 50%; transform: translateX(-50%); background: ${F.ink}; color: white; padding: 12px 22px; border-radius: 30px; font-size: 13px; font-weight: 600; z-index: 400; box-shadow: 0 8px 24px rgba(0,0,0,0.25); }
      `}</style>

      <div className="pv-page">
        <div className="pv-body">
          <div className="pv-title">ตั้งค่าความเป็นส่วนตัว</div>
          <div className="pv-sub">กำหนดว่าใครเห็นข้อมูลอะไรได้บ้าง สำหรับสัตว์ทุกตัวในฟาร์มนี้</div>

          {!canEdit && (
            <div className="pv-readonly-banner">
              บทบาทของคุณ ({myRole}) ดูได้อย่างเดียว — เฉพาะเจ้าของฟาร์มหรือแอดมินเท่านั้นที่ปรับค่าได้
            </div>
          )}

          <div className="pv-presets">
            {PRESETS.map(preset => (
              <button
                key={preset.id}
                type="button"
                className={`pv-preset ${activePreset === preset.id ? 'active' : ''}`}
                onClick={() => applyPreset(preset)}
                disabled={!canEdit}
              >
                <div className="pv-preset-icon">{preset.icon}</div>
                <div className="pv-preset-name">{preset.name}</div>
                <div className="pv-preset-desc">{preset.desc}</div>
                {preset.recommended && <div className="pv-preset-badge">แนะนำ</div>}
              </button>
            ))}
          </div>

          <button type="button" className="pv-customize-toggle" onClick={() => setCustomizeOpen(v => !v)}>
            {customizeOpen ? '▾' : '▸'} ปรับละเอียดรายหมวด
          </button>

          {customizeOpen && (
            <div className="pv-card">
              {fieldGroups.map(g => {
                const tier = tiers[g.key] || g.default_tier;
                const c = TIER_COLOR[tier];
                return (
                  <div key={g.key} className="pv-row">
                    <div className="pv-row-name">{g.label_th}</div>
                    <select
                      className="pv-select"
                      style={{
                        background: `${c.bg} url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='${encodeURIComponent(c.fg)}' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
                        color: c.fg,
                      }}
                      value={tier}
                      disabled={!canEdit || savingKey === g.key}
                      onChange={e => saveTier(g.key, e.target.value as Tier)}
                    >
                      {TIER_ORDER.map(t => <option key={t} value={t}>{TIER_LABEL[t]}</option>)}
                    </select>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {toast && <div className="pv-toast">{toast}</div>}
    </>
  );
}
