"use client";

import type { ReactNode } from "react";

const F = {
  ink: "#1f1a1c",
  inkSoft: "#4a3f44",
  line: "#f3dde3",
  muted: "#8e7e84",
  pink: "#e84677",
  pinkSoft: "#fde2ea",
  pinkDeep: "#c4325f",
};

interface WelcomeOnboardingCardProps {
  title: string;
  body: string;
  primaryLabel: string;
  secondaryLabel: string;
  onPrimary: () => void;
  onSecondary: () => void;
  onDismiss: () => void;
  children?: ReactNode;
}

export default function WelcomeOnboardingCard({
  title,
  body,
  primaryLabel,
  secondaryLabel,
  onPrimary,
  onSecondary,
  onDismiss,
  children,
}: WelcomeOnboardingCardProps) {
  return (
    <div className="ob-welcome">
      <button type="button" className="ob-welcome-dismiss" onClick={onDismiss} aria-label="ปิด">
        ×
      </button>
      <div className="ob-welcome-icon">
        <img src="/icons/icon-paw-sparkle.png" alt="" />
      </div>
      <h2 className="ob-welcome-title">{title}</h2>
      <p className="ob-welcome-body">{body}</p>
      {children}
      <div className="ob-welcome-actions">
        <button type="button" className="ob-welcome-primary" onClick={onPrimary}>
          {primaryLabel}
        </button>
        <button type="button" className="ob-welcome-secondary" onClick={onSecondary}>
          {secondaryLabel}
        </button>
      </div>

      <style>{`
        .ob-welcome {
          position: relative;
          background: linear-gradient(165deg, ${F.pinkSoft} 0%, #ffffff 60%);
          border: 1px solid ${F.line};
          border-radius: 20px;
          padding: 24px 20px;
          animation: ob-rise 0.35s ease both;
        }
        .ob-welcome-dismiss {
          position: absolute;
          top: 12px;
          right: 12px;
          width: 30px;
          height: 30px;
          border: none;
          border-radius: 999px;
          background: rgba(255,255,255,0.7);
          color: ${F.muted};
          font-size: 18px;
          line-height: 1;
          cursor: pointer;
        }
        .ob-welcome-icon {
          width: 44px;
          height: 44px;
          margin-bottom: 12px;
        }
        .ob-welcome-icon img { width: 100%; height: 100%; object-fit: contain; }
        .ob-welcome-title {
          font-size: 19px;
          font-weight: 800;
          color: ${F.ink};
          margin: 0 0 8px;
        }
        .ob-welcome-body {
          font-size: 14px;
          line-height: 1.6;
          color: ${F.inkSoft};
          margin: 0 0 18px;
          max-width: 46ch;
        }
        .ob-welcome-actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }
        .ob-welcome-primary {
          flex: 1 1 auto;
          min-width: 160px;
          padding: 12px 18px;
          border: none;
          border-radius: 14px;
          background: ${F.pink};
          color: #fff;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
        }
        .ob-welcome-primary:active { background: ${F.pinkDeep}; }
        .ob-welcome-secondary {
          flex: 1 1 auto;
          min-width: 140px;
          padding: 12px 18px;
          border: 1px solid ${F.line};
          border-radius: 14px;
          background: #fff;
          color: ${F.inkSoft};
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
        }
        @keyframes ob-rise {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
