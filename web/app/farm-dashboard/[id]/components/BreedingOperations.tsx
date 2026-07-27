"use client";

import { useState } from "react";
import Link from "next/link";
import { F } from "@/lib/farmDashboard/theme";
import { fmtDate } from "@/lib/farmDashboard/dateHelpers";
import { deriveLitterStatus, STATUS_URGENCY, buildUpcomingTimeline, computeBreedingStats } from "@/lib/farmDashboard/breeding";
import EmptySection from "./EmptySection";
import type { DashboardLitter, DashboardPet } from "@/lib/farmDashboard/types";

const Icon = {
  Male: () => <img src="/icons/icon-men.png" alt="male" style={{ width: 18, height: 18, objectFit: 'contain' }} />,
  Female: () => <img src="/icons/icon-women.png" alt="female" style={{ width: 18, height: 18, objectFit: 'contain' }} />,
  Check: () => <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
};

const TIMELINE_WINDOWS: Array<7 | 14 | 30> = [7, 14, 30];

interface BreedingOperationsProps {
  farmId: string;
  pets: DashboardPet[];
  litters: DashboardLitter[];
  farmSpecies?: string | null;
  littersBorn90d: number;
}

export default function BreedingOperations({ farmId, pets, litters, farmSpecies, littersBorn90d }: BreedingOperationsProps) {
  const [windowDays, setWindowDays] = useState<7 | 14 | 30>(14);
  const stats = computeBreedingStats(pets, litters, littersBorn90d);
  const timeline = buildUpcomingTimeline(litters, windowDays);

  const activeLitters = litters
    .filter(l => l.status === 'รอคลอด')
    .sort((a, b) => {
      const sa = deriveLitterStatus(a, a.dam?.species || farmSpecies);
      const sb = deriveLitterStatus(b, b.dam?.species || farmSpecies);
      return STATUS_URGENCY[sa.status] - STATUS_URGENCY[sb.status];
    });

  return (
    <section className="fd-sec" id="active-litters">
      <style>{`
        .fd-brd-stats { display:grid; grid-template-columns:repeat(4, 1fr); gap:6px; margin-bottom:14px; }
        .fd-brd-stat { text-align:center; padding:8px 4px; border-radius:10px; background:#FAFAFA; }
        .fd-brd-stat-val { font-size:16px; font-weight:700; color:${F.ink}; }
        .fd-brd-stat-label { font-size:8.5px; color:${F.muted}; font-weight:500; margin-top:2px; line-height:1.3; }
        .fd-brd-timeline-head { display:flex; align-items:center; justify-content:space-between; margin-bottom:8px; }
        .fd-brd-window-tabs { display:flex; gap:4px; }
        .fd-brd-window-tab { font-size:10px; font-weight:600; padding:3px 9px; border-radius:20px; border:1px solid ${F.lineMid}; background:white; color:${F.muted}; cursor:pointer; font-family:inherit; }
        .fd-brd-window-tab.active { background:${F.pink}; border-color:${F.pink}; color:white; }
        .fd-brd-timeline-scroll { display:flex; gap:8px; overflow-x:auto; padding-bottom:8px; margin-bottom:6px; -webkit-overflow-scrolling:touch; }
        .fd-brd-timeline-item { flex:0 0 auto; min-width:120px; border:1px solid ${F.line}; border-radius:10px; padding:8px 10px; text-decoration:none; }
        .fd-brd-timeline-days { font-size:11px; font-weight:700; color:${F.pink}; }
        .fd-brd-timeline-code { font-size:11px; font-weight:600; color:${F.ink}; margin-top:2px; }
        .fd-brd-timeline-pair { font-size:9.5px; color:${F.muted}; margin-top:1px; }
      `}</style>

      <div className="fd-sec-head">
        <div className="fd-sec-title">
          <img src="/icons/icon-breeding.png" alt="" />
          <h2 className="fd-sec-h">การเพาะพันธุ์</h2>
        </div>
        {activeLitters.length > 0 && <span className="fd-sec-badge" style={{ background: F.pinkSoft, color: F.pink }}>{activeLitters.length}</span>}
      </div>

      <div className="fd-brd-stats">
        {[
          { label: 'คู่ผสมกำลังดำเนินการ', val: stats.activePairs },
          { label: 'กำลังตั้งท้อง', val: stats.pregnant },
          { label: 'ใกล้คลอด', val: stats.nearDue },
          { label: 'คลอดแล้ว (90 วัน)', val: stats.bornRecent90d },
          { label: 'ลูกในครอก', val: stats.kittensInLitter },
          { label: 'ลูกพร้อมย้าย', val: stats.kittensAvailable },
          { label: 'ลูกจอง/ขายแล้ว', val: stats.kittensReserved },
          { label: 'ลูกยังไม่กำหนดเจ้าของ', val: stats.kittensUnassigned },
        ].map((s) => (
          <div key={s.label} className="fd-brd-stat">
            <div className="fd-brd-stat-val">{s.val}</div>
            <div className="fd-brd-stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {litters.length > 0 && (
        <>
          <div className="fd-brd-timeline-head">
            <span style={{ fontSize: 11, fontWeight: 600, color: F.inkSoft }}>กำหนดคลอดที่จะถึง</span>
            <div className="fd-brd-window-tabs">
              {TIMELINE_WINDOWS.map((w) => (
                <button key={w} className={`fd-brd-window-tab${windowDays === w ? ' active' : ''}`} onClick={() => setWindowDays(w)}>
                  {w} วัน
                </button>
              ))}
            </div>
          </div>
          {timeline.length === 0 ? (
            <div className="fd-empty-sm" style={{ marginBottom: 10 }}>ไม่มีครอกที่คาดว่าจะคลอดในช่วงนี้</div>
          ) : (
            <div className="fd-brd-timeline-scroll">
              {timeline.map((t) => (
                <Link key={t.litterId} href={`/farm-dashboard/${farmId}/litters/${t.litterId}`} className="fd-brd-timeline-item">
                  <div className="fd-brd-timeline-days">{t.daysUntil <= 0 ? 'ถึงกำหนด' : `อีก ${t.daysUntil} วัน`}</div>
                  <div className="fd-brd-timeline-code">ครอก {t.litterCode}</div>
                  <div className="fd-brd-timeline-pair">{t.sireName} × {t.damName}</div>
                </Link>
              ))}
            </div>
          )}
        </>
      )}

      {activeLitters.length === 0 ? (
        <EmptySection text="ยังไม่มีครอกที่กำลังดำเนิน" />
      ) : activeLitters.map(litter => {
        const species = litter.dam?.species || farmSpecies;
        const si = deriveLitterStatus(litter, species);
        const { status, daysPregnant, daysUntilWindowStart, daysOverdue, minDueDate, maxDueDate } = si;

        const accentColor = status === 'overdue' ? F.red
          : status === 'due_window' ? F.orange
          : status === 'near_due'   ? F.amber
          : status === 'pregnant'   ? F.pink
          : F.slate;
        const badgeBg = status === 'overdue' ? F.redSoft
          : status === 'due_window' ? F.orangeSoft
          : status === 'near_due'   ? F.amberSoft
          : status === 'pregnant'   ? F.pinkSoft
          : F.slateSoft;
        const badgeLabel = status === 'overdue' ? 'เลยกำหนด'
          : status === 'due_window' ? 'เฝ้าคลอด'
          : status === 'near_due'   ? 'ใกล้คลอด'
          : status === 'pregnant'   ? 'กำลังตั้งท้อง'
          : 'รอยืนยัน';

        const mainText = !litter.mating_date ? 'ยังไม่ระบุวันผสม'
          : `วันที่ ${daysPregnant} ของการตั้งท้อง`;
        const subText = status === 'waiting_confirmation' ? 'กรุณาระบุวันผสมเพื่อติดตาม'
          : status === 'pregnant'   ? `เหลืออีกประมาณ ${daysUntilWindowStart} วัน ถึงช่วงคาดคลอด`
          : status === 'near_due'   ? `อีก ${daysUntilWindowStart} วัน ถึงช่วงคาดคลอด`
          : status === 'due_window' ? 'อยู่ในช่วงเฝ้าคลอด'
          : daysOverdue > 0        ? `เลยช่วงคาดการณ์ ${daysOverdue} วัน — ควรตรวจสอบ`
          : 'เลยช่วงคาดการณ์';

        const datesText = litter.mating_date && minDueDate && maxDueDate
          ? `ผสม ${fmtDate(litter.mating_date, true)} · คาดคลอด ${fmtDate(minDueDate.toISOString(), true)}–${fmtDate(maxDueDate.toISOString(), true)}`
          : litter.mating_date
          ? `ผสม ${fmtDate(litter.mating_date, true)}`
          : null;

        const STAGES = ['ผสมแล้ว', 'ยืนยันตั้งท้อง', 'ใกล้คลอด', 'คลอดแล้ว'];
        const currentStage = status === 'waiting_confirmation' ? 0
          : status === 'pregnant' ? 1
          : 2;

        const primaryLabel = status === 'waiting_confirmation' ? 'บันทึกผลตรวจ'
          : (status === 'pregnant' || status === 'near_due') ? 'ดูการติดตาม'
          : 'บันทึกคลอด';
        const primaryHref = status === 'waiting_confirmation'
          ? `/farm-dashboard/${farmId}/litters/${litter.id}/edit`
          : (status === 'pregnant' || status === 'near_due')
          ? `/farm-dashboard/${farmId}/litters/${litter.id}`
          : `/farm-dashboard/${farmId}/litters/${litter.id}/birth`;

        return (
          <div key={litter.id} className="ptc">
            <div className="ptc-accent" style={{ background: accentColor }} />
            <div className="ptc-inner">
              <div className="ptc-header">
                <div className="ptc-code">ครอก {litter.litter_code || 'TBA'}</div>
                <span className="ptc-badge" style={{ background: badgeBg, color: accentColor }}>{badgeLabel}</span>
              </div>

              <div className="ptc-parents">
                <div className="ptc-avatars">
                  <div className="ptc-av ptc-av-sire">
                    {litter.sire?.image_url ? <img src={litter.sire.image_url} alt="" /> : <Icon.Male />}
                  </div>
                  <div className="ptc-av ptc-av-dam">
                    {litter.dam?.image_url ? <img src={litter.dam.image_url} alt="" /> : <Icon.Female />}
                  </div>
                </div>
                <span className="ptc-pair-name">{litter.sire?.name || '?'} × {litter.dam?.name || '?'}</span>
              </div>

              <div className="ptc-divider" />

              {status === 'waiting_confirmation' ? (
                <div className="ptc-missing">
                  <span className="ptc-missing-text">ข้อมูลการผสมยังไม่ครบ</span>
                  <Link href={`/farm-dashboard/${farmId}/litters/${litter.id}/edit`} className="ptc-missing-btn">แก้ไขข้อมูล</Link>
                </div>
              ) : (
                <div className="ptc-summary">
                  <div className="ptc-main">{mainText}</div>
                  <div className="ptc-sub" style={{ color: status === 'overdue' ? F.red : status === 'due_window' ? F.orange : status === 'near_due' ? F.amber : F.muted }}>{subText}</div>
                  {datesText && <div className="ptc-dates">{datesText}</div>}
                </div>
              )}

              <div className="ptc-timeline" style={{ marginBottom: 12 }}>
                {STAGES.map((label, i) => {
                  const isDone    = i < currentStage;
                  const isCurrent = i === currentStage;
                  const dotColor  = isDone ? F.green : isCurrent ? accentColor : F.lineMid;
                  const lineColor = isDone ? F.green : F.lineMid;
                  const labelColor = isDone ? F.green : isCurrent ? accentColor : F.muted;
                  return (
                    <div key={label} className="ptc-stage">
                      <div className="ptc-stage-row">
                        <div className="ptc-stage-dot" style={{ borderColor: dotColor, background: isDone ? F.green : isCurrent ? accentColor : 'white', color: 'white' }}>
                          {isDone && <Icon.Check />}
                        </div>
                        {i < STAGES.length - 1 && <div className="ptc-stage-line" style={{ background: lineColor }} />}
                      </div>
                      <div className="ptc-stage-label" style={{ color: labelColor }}>{label}</div>
                    </div>
                  );
                })}
              </div>

              <div className="ptc-actions">
                <Link href={`/farm-dashboard/${farmId}/litters/${litter.id}`} className="ptc-btn-ghost">ดูรายละเอียด</Link>
                <Link href={primaryHref} className="ptc-btn-primary" style={{ background: accentColor }}>{primaryLabel}</Link>
              </div>
            </div>
          </div>
        );
      })}
    </section>
  );
}
