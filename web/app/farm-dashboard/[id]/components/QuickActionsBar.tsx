"use client";

import Link from "next/link";
import { F } from "@/lib/farmDashboard/theme";
import { trackEvent } from "@/lib/analytics/trackEvent";

interface QuickAction {
  key: string;
  label: string;
  href: string;
  icon: string;
}

/**
 * Pure links into existing pages — no new wizard/flow. This is a scanning surface for the command
 * center; the persistent FarmBottomNav (sheet-based, thumb-reach) still exists separately for
 * mobile one-handed use and is intentionally not replaced by this.
 */
function buildActions(farmId: string): QuickAction[] {
  return [
    { key: "add_pet", label: "เพิ่มสัตว์", href: `/farm-dashboard/${farmId}/pets/create`, icon: "/icons/icon-pets.png" },
    { key: "breed_match", label: "จับคู่บรีด", href: `/farm-dashboard/${farmId}/litters/create`, icon: "/icons/icon-breeding.png" },
    { key: "add_vaccine", label: "เพิ่มวัคซีน", href: `/pets/vaccines/bulk-add`, icon: "/icons/icon-health.png" },
    { key: "add_weight", label: "เพิ่มน้ำหนัก", href: `/farm-dashboard/${farmId}/weights`, icon: "/icons/icon-weight.png" },
    { key: "view_reservations", label: "ดูคำขอจอง", href: `/farm-dashboard/${farmId}/reservations`, icon: "/icons/icon-calendar.png" },
    { key: "add_member", label: "เพิ่มสมาชิกฟาร์ม", href: `/farm-dashboard/${farmId}/members`, icon: "/icons/icon-my-pets.png" },
    { key: "edit_farm", label: "แก้ไขโปรไฟล์ฟาร์ม", href: `/farm-dashboard/${farmId}/edit`, icon: "/icons/icon-edit.png" },
    { key: "privacy", label: "จัดการ Privacy", href: `/farm-dashboard/${farmId}/privacy`, icon: "/icons/icon-barrier.png" },
  ];
}

export default function QuickActionsBar({ farmId }: { farmId: string }) {
  const actions = buildActions(farmId);

  return (
    <section className="fd-qa-wrap">
      <style>{`
        .fd-qa-wrap { display:flex; flex-direction:column; gap:0; }
        .fd-qa-scroll { display:flex; gap:8px; overflow-x:auto; padding:2px 2px 6px; -webkit-overflow-scrolling:touch; scrollbar-width:none; }
        .fd-qa-scroll::-webkit-scrollbar { display:none; }
        .fd-qa-item { flex:0 0 auto; display:flex; flex-direction:column; align-items:center; gap:6px; width:72px; padding:10px 6px; border-radius:12px; background:white; border:1px solid ${F.line}; text-decoration:none; transition:all .15s; }
        .fd-qa-item:hover { border-color:${F.pinkBorder}; transform:translateY(-1px); }
        .fd-qa-icon { width:30px; height:30px; object-fit:contain; }
        .fd-qa-label { font-size:10px; font-weight:500; color:${F.inkSoft}; text-align:center; line-height:1.3; }
        @media (min-width:900px) { .fd-qa-scroll { flex-wrap:wrap; overflow-x:visible; } .fd-qa-item { width:auto; flex-direction:row; padding:9px 14px; } }
      `}</style>
      <div className="fd-qa-scroll">
        {actions.map((a) => (
          <Link
            key={a.key}
            href={a.href}
            className="fd-qa-item"
            onClick={() => trackEvent({ eventName: "quick_action_clicked", entityType: "quick_action", entityId: a.key, farmId: Number(farmId) })}
          >
            <img className="fd-qa-icon" src={a.icon} alt="" />
            <span className="fd-qa-label">{a.label}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
