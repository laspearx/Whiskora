"use client";

import type { OnboardingStep } from "@/lib/onboarding/types";
import OnboardingProgress from "./OnboardingProgress";
import OnboardingChecklistItem from "./OnboardingChecklistItem";

const F = {
  ink: "#1f1a1c",
  inkSoft: "#4a3f44",
  line: "#f3dde3",
  muted: "#8e7e84",
  pink: "#e84677",
};

export interface OnboardingPhase {
  title: string;
  keys: string[];
}

interface OnboardingChecklistProps {
  title: string;
  note?: string;
  steps: OnboardingStep[];
  done: number;
  total: number;
  collapsed: boolean;
  onToggleCollapse: (collapsed: boolean) => void;
  onStepCta: (step: OnboardingStep) => void;
  onStepSkip?: (step: OnboardingStep) => void;
  ctaDisabledKeys?: string[];
  phases?: OnboardingPhase[];
}

export default function OnboardingChecklist({
  title,
  note,
  steps,
  done,
  total,
  collapsed,
  onToggleCollapse,
  onStepCta,
  onStepSkip,
  ctaDisabledKeys = [],
  phases,
}: OnboardingChecklistProps) {
  if (collapsed) {
    return (
      <button type="button" className="ob-collapsed" onClick={() => onToggleCollapse(false)}>
        <span className="ob-collapsed-badge">เริ่มต้นใช้งานเรียบร้อย</span>
        <span className="ob-collapsed-meta">
          {done}/{total} ขั้นตอน · แตะเพื่อดูอีกครั้ง
        </span>
        <style>{`
          .ob-collapsed {
            width: 100%;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 10px;
            padding: 12px 16px;
            border: 1px solid ${F.line};
            border-radius: 14px;
            background: #fff;
            cursor: pointer;
            text-align: left;
          }
          .ob-collapsed-badge {
            font-size: 13px;
            font-weight: 700;
            color: ${F.pink};
          }
          .ob-collapsed-meta { font-size: 12px; color: ${F.muted}; }
        `}</style>
      </button>
    );
  }

  const groups: OnboardingPhase[] = phases ?? [{ title, keys: steps.map((s) => s.key) }];

  return (
    <div className="ob-checklist">
      <div className="ob-checklist-head">
        <h3 className="ob-checklist-title">{title}</h3>
        <button type="button" className="ob-checklist-collapse" onClick={() => onToggleCollapse(true)}>
          ย่อ
        </button>
      </div>

      <OnboardingProgress done={done} total={total} />
      {note && <p className="ob-checklist-note">{note}</p>}

      {groups.map((group) => {
        const groupSteps = steps.filter((s) => group.keys.includes(s.key));
        if (groupSteps.length === 0) return null;
        return (
          <div key={group.title} className="ob-checklist-group">
            {phases && <div className="ob-checklist-group-title">{group.title}</div>}
            {groupSteps.map((step) => (
              <OnboardingChecklistItem
                key={step.key}
                step={step}
                onCtaClick={onStepCta}
                onSkip={onStepSkip}
                ctaDisabled={ctaDisabledKeys.includes(step.key)}
              />
            ))}
          </div>
        );
      })}

      <style>{`
        .ob-checklist {
          background: #fff;
          border: 1px solid ${F.line};
          border-radius: 20px;
          padding: 18px 16px;
          animation: ob-rise 0.3s ease both;
        }
        .ob-checklist-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 10px;
        }
        .ob-checklist-title { font-size: 16px; font-weight: 800; color: ${F.ink}; margin: 0; }
        .ob-checklist-collapse {
          border: none;
          background: transparent;
          color: ${F.muted};
          font-size: 12.5px;
          font-weight: 600;
          cursor: pointer;
        }
        .ob-checklist-note {
          font-size: 12px;
          color: ${F.muted};
          margin: 10px 0 4px;
        }
        .ob-checklist-group { margin-top: 12px; }
        .ob-checklist-group-title {
          font-size: 12px;
          font-weight: 700;
          color: ${F.pink};
          text-transform: uppercase;
          letter-spacing: 0.02em;
          margin-bottom: 4px;
        }
        @keyframes ob-rise {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
