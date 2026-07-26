"use client";

const F = {
  ink: "#1f1a1c",
  inkSoft: "#4a3f44",
  green: "#1f9d63",
  greenSoft: "#e5f7ee",
};

interface OnboardingSuccessCardProps {
  message: string;
}

export default function OnboardingSuccessCard({ message }: OnboardingSuccessCardProps) {
  return (
    <div className="ob-success">
      <span className="ob-success-check">✓</span>
      <span className="ob-success-text">{message}</span>

      <style>{`
        .ob-success {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 16px;
          border-radius: 14px;
          background: ${F.greenSoft};
          animation: ob-pop 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) both;
        }
        .ob-success-check {
          flex: none;
          width: 22px;
          height: 22px;
          border-radius: 999px;
          background: ${F.green};
          color: #fff;
          font-size: 13px;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .ob-success-text { font-size: 13.5px; font-weight: 600; color: ${F.ink}; }
        @keyframes ob-pop {
          from { opacity: 0; transform: scale(0.92); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
