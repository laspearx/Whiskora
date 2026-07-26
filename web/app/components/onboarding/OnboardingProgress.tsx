"use client";

const F = {
  line: "#f3dde3",
  muted: "#8e7e84",
  pink: "#e84677",
  inkSoft: "#4a3f44",
};

interface OnboardingProgressProps {
  done: number;
  total: number;
}

export default function OnboardingProgress({ done, total }: OnboardingProgressProps) {
  const pct = total > 0 ? Math.min(100, Math.round((done / total) * 100)) : 0;
  return (
    <div className="ob-progress">
      <div className="ob-progress-label">
        สำเร็จแล้ว <strong>{done}</strong> จาก {total} ขั้นตอน
      </div>
      <div className="ob-progress-track">
        <div className="ob-progress-fill" style={{ width: `${pct}%` }} />
      </div>

      <style>{`
        .ob-progress { display: flex; flex-direction: column; gap: 6px; }
        .ob-progress-label { font-size: 13px; color: ${F.inkSoft}; font-weight: 500; }
        .ob-progress-label strong { color: ${F.pink}; font-weight: 800; }
        .ob-progress-track {
          height: 6px;
          border-radius: 999px;
          background: ${F.line};
          overflow: hidden;
        }
        .ob-progress-fill {
          height: 100%;
          border-radius: 999px;
          background: ${F.pink};
          transition: width 0.4s ease;
        }
      `}</style>
    </div>
  );
}
