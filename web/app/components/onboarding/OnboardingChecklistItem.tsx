"use client";

import type { OnboardingStep } from "@/lib/onboarding/types";

const F = {
  ink: "#1f1a1c",
  inkSoft: "#4a3f44",
  line: "#f3dde3",
  muted: "#8e7e84",
  pink: "#e84677",
  pinkSoft: "#fde2ea",
  green: "#1f9d63",
  greenSoft: "#e5f7ee",
};

const STATUS_LABEL: Record<OnboardingStep["status"], string> = {
  not_started: "ยังไม่เริ่ม",
  in_progress: "กำลังดำเนินการ",
  done: "สำเร็จ",
  skipped: "ข้ามไว้ก่อน",
};

interface OnboardingChecklistItemProps {
  step: OnboardingStep;
  onCtaClick: (step: OnboardingStep) => void;
  onSkip?: (step: OnboardingStep) => void;
  ctaDisabled?: boolean;
}

export default function OnboardingChecklistItem({
  step,
  onCtaClick,
  onSkip,
  ctaDisabled,
}: OnboardingChecklistItemProps) {
  const isDone = step.status === "done";
  const isSkipped = step.status === "skipped";

  return (
    <div className={`ob-item ${isDone ? "is-done" : ""} ${isSkipped ? "is-skipped" : ""}`}>
      <div className="ob-item-icon">
        {isDone ? (
          <span className="ob-item-check" aria-hidden>
            ✓
          </span>
        ) : (
          <img src={step.icon} alt="" />
        )}
      </div>

      <div className="ob-item-body">
        <div className="ob-item-top">
          <span className="ob-item-title">{step.title}</span>
          <span className={`ob-item-pill status-${step.status}`}>{STATUS_LABEL[step.status]}</span>
        </div>
        <p className="ob-item-desc">{step.description}</p>

        {!isDone && !ctaDisabled && (
          <div className="ob-item-actions">
            <button type="button" className="ob-item-cta" onClick={() => onCtaClick(step)}>
              {step.ctaLabel}
            </button>
            {step.skippable && !isSkipped && onSkip && (
              <button type="button" className="ob-item-skip" onClick={() => onSkip(step)}>
                ไว้ภายหลัง
              </button>
            )}
          </div>
        )}
      </div>

      <style>{`
        .ob-item {
          display: flex;
          gap: 12px;
          padding: 14px 4px;
          border-bottom: 1px solid ${F.line};
        }
        .ob-item:last-child { border-bottom: none; }
        .ob-item-icon {
          flex: none;
          width: 38px;
          height: 38px;
          border-radius: 12px;
          background: ${F.pinkSoft};
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }
        .ob-item.is-done .ob-item-icon { background: ${F.greenSoft}; }
        .ob-item-icon img { width: 20px; height: 20px; object-fit: contain; }
        .ob-item-check { color: ${F.green}; font-size: 18px; font-weight: 800; }
        .ob-item-body { flex: 1; min-width: 0; }
        .ob-item-top {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }
        .ob-item-title { font-size: 14.5px; font-weight: 700; color: ${F.ink}; }
        .ob-item.is-done .ob-item-title { color: ${F.muted}; text-decoration: line-through; text-decoration-color: ${F.line}; }
        .ob-item-pill {
          font-size: 11px;
          font-weight: 600;
          padding: 2px 8px;
          border-radius: 999px;
          background: #f4f1f2;
          color: ${F.muted};
        }
        .ob-item-pill.status-done { background: ${F.greenSoft}; color: ${F.green}; }
        .ob-item-pill.status-in_progress { background: ${F.pinkSoft}; color: ${F.pink}; }
        .ob-item-pill.status-skipped { background: #f4f1f2; color: ${F.muted}; }
        .ob-item-desc {
          font-size: 12.5px;
          color: ${F.inkSoft};
          margin: 4px 0 0;
          line-height: 1.5;
        }
        .ob-item-actions { display: flex; gap: 10px; margin-top: 10px; flex-wrap: wrap; }
        .ob-item-cta {
          padding: 7px 14px;
          border: none;
          border-radius: 10px;
          background: ${F.pink};
          color: #fff;
          font-size: 12.5px;
          font-weight: 700;
          cursor: pointer;
        }
        .ob-item-skip {
          padding: 7px 10px;
          border: none;
          background: transparent;
          color: ${F.muted};
          font-size: 12.5px;
          font-weight: 600;
          cursor: pointer;
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
}
