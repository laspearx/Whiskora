"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "@/i18n/context";

const F = {
  ink: '#1f1a1c', inkSoft: '#4a3f44', muted: '#8e7e84',
  pink: '#e84677', pinkSoft: '#fde2ea', pinkBorder: '#FBCFE8', pinkDeep: '#c4325f',
  cream: '#fffafc', paper: '#fdf0f3', line: '#f3dde3', lineMid: '#E5E7EB',
};

// texts: messages `about` (mission.<key>.*, feature.<key>.*); icons and links stay here
const missions = [
  { key: 'everyPet', icon: '/icons/icon-paw-sparkle.png' },
  { key: 'community', icon: '/icons/icon-co-owner.png' },
  { key: 'trust', icon: '/icons/icon-verified-badge.png' },
  { key: 'knowledge', icon: '/icons/icon-pet-records.png' },
];

const features = [
  { key: 'profile', icon: '/icons/icon-my-pets.png', href: '/pets/create' },
  { key: 'farm', icon: '/icons/icon-farm.png', href: '/partner' },
  { key: 'idCard', icon: '/icons/icon-pet-id-card.png', href: '/pet-id-card' },
  { key: 'knowledge', icon: '/icons/icon-documents.png', href: '/pet-knowledge' },
  { key: 'tools', icon: '/icons/icon-health.png', href: '/pet-tools' },
  { key: 'finance', icon: '/icons/icon-wallet.png', href: '/profile/finance' },
];

export default function AboutPage() {
  const router = useRouter();
  const t = useTranslations("about");
  const tc = useTranslations("common");

  return (
    <>
      <style>{`
        @keyframes page-rise {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .ab-page { font-family: inherit; min-height: 100vh; color: ${F.ink}; }
        .ab-wrap { max-width: 680px; margin: 0 auto; padding: 24px 0 80px; animation: page-rise .45s ease both; }

        /* Header */
        .ab-header { display: flex; align-items: center; gap: 14px; margin-bottom: 24px; }
        .ab-back { width: 38px; height: 38px; border-radius: 12px; border: 1px solid ${F.line}; background: white; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: transform .15s, background .15s; flex: 0 0 auto; color: ${F.ink}; }
        .ab-back:hover { transform: translateY(-1px); background: ${F.paper}; }
        .ab-header-text h1 { margin: 0; font-size: 22px; font-weight: 700; color: ${F.ink}; line-height: 1.2; }
        .ab-header-text p { margin: 3px 0 0; font-size: 13px; color: ${F.muted}; }

        /* Hero card */
        .ab-hero {
          background: linear-gradient(135deg, ${F.pink} 0%, #f472b6 100%);
          border-radius: 22px;
          padding: 32px 24px 28px;
          text-align: center;
          margin-bottom: 14px;
          position: relative;
          overflow: hidden;
        }
        .ab-hero::before { content: ''; position: absolute; top: -40px; right: -40px; width: 150px; height: 150px; background: rgba(255,255,255,0.08); border-radius: 50%; }
        .ab-hero::after { content: ''; position: absolute; bottom: -28px; left: -28px; width: 110px; height: 110px; background: rgba(255,255,255,0.06); border-radius: 50%; }
        .ab-hero-logo-wrap { display: flex; align-items: center; justify-content: center; gap: 10px; margin-bottom: 12px; position: relative; z-index: 1; }
        .ab-hero-logo-img { width: 52px; height: 52px; object-fit: contain; filter: brightness(0) invert(1); }
        .ab-hero-logo-text { font-size: 30px; font-weight: 900; color: white; letter-spacing: -0.5px; }
        .ab-hero-tagline { font-size: 14px; font-weight: 500; color: rgba(255,255,255,0.9); line-height: 1.65; position: relative; z-index: 1; max-width: 360px; margin: 0 auto; }

        /* Section label */
        .ab-section-label {
          font-size: 11px; font-weight: 700; color: ${F.muted};
          text-transform: uppercase; letter-spacing: 0.08em;
          margin: 20px 0 10px;
          display: flex; align-items: center; gap: 8px;
        }
        .ab-section-label::after { content: ''; flex: 1; height: 1px; background: ${F.line}; }

        /* Mission cards */
        .ab-mission {
          display: flex; gap: 14px; align-items: flex-start;
          background: rgba(255,255,255,.94);
          border: 1px solid ${F.line};
          border-radius: 18px;
          padding: 18px;
          margin-bottom: 10px;
          box-shadow: 0 4px 14px rgba(31,26,28,.03);
        }
        .ab-mission-icon { width: 48px; height: 48px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; }
        .ab-mission-icon img { width: 48px; height: 48px; object-fit: contain; }
        .ab-mission-title { font-size: 14px; font-weight: 700; color: ${F.ink}; margin-bottom: 5px; }
        .ab-mission-desc { font-size: 12.5px; color: ${F.inkSoft}; line-height: 1.65; }

        /* Feature grid */
        .ab-features { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px; }
        .ab-feat {
          background: rgba(255,255,255,.94);
          border: 1px solid ${F.line};
          border-radius: 18px;
          padding: 16px;
          text-decoration: none; color: inherit;
          transition: transform .15s, border-color .15s, box-shadow .15s;
          display: flex; flex-direction: column; gap: 8px;
          box-shadow: 0 4px 14px rgba(31,26,28,.03);
        }
        .ab-feat:hover { border-color: ${F.pinkBorder}; transform: translateY(-2px); box-shadow: 0 6px 18px rgba(232,70,119,0.09); }
        .ab-feat-icon { width: 40px; height: 40px; object-fit: contain; }
        .ab-feat-title { font-size: 13px; font-weight: 700; color: ${F.ink}; }
        .ab-feat-desc { font-size: 11.5px; color: ${F.muted}; line-height: 1.55; flex: 1; }
        .ab-feat-link { display: flex; align-items: center; gap: 4px; font-size: 11px; font-weight: 700; color: ${F.pink}; margin-top: 4px; }

        /* Founder note */
        .ab-note {
          background: rgba(255,255,255,.94);
          border: 1px solid ${F.line};
          border-radius: 18px;
          padding: 22px;
          margin-top: 6px;
          box-shadow: 0 4px 14px rgba(31,26,28,.03);
        }
        .ab-note-header { display: flex; align-items: center; gap: 12px; margin-bottom: 14px; }
        .ab-note-header img { width: 40px; height: 40px; object-fit: contain; }
        .ab-note-header-text { font-size: 14px; font-weight: 700; color: ${F.ink}; }
        .ab-note-header-sub { font-size: 12px; color: ${F.muted}; margin-top: 1px; }
        .ab-note-text { font-size: 13px; color: ${F.inkSoft}; line-height: 1.75; border-left: 3px solid ${F.pinkBorder}; padding-left: 14px; }
        .ab-note-sig { font-size: 12px; font-weight: 700; color: ${F.pink}; margin-top: 14px; }

        @media (max-width: 560px) {
          .ab-wrap { padding: 16px 0 80px; }
          .ab-hero { border-radius: 16px; padding: 24px 18px 22px; }
          .ab-features { grid-template-columns: 1fr 1fr; }
        }
      `}</style>

      <div className="ab-page">
        <div className="ab-wrap">

          {/* Header */}
          <div className="ab-header">
            <button type="button" className="ab-back" onClick={() => router.back()} aria-label={tc("back")}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="m15 18-6-6 6-6"/>
              </svg>
            </button>
            <div className="ab-header-text">
              <h1>{t("title")}</h1>
              <p>{t("subtitle")}</p>
            </div>
          </div>

          {/* Hero */}
          <div className="ab-hero">
            <div className="ab-hero-logo-wrap">
              <img src="/mini-logo.png" alt="Whiskora" className="ab-hero-logo-img" />
              <span className="ab-hero-logo-text">whiskora</span>
            </div>
            <p className="ab-hero-tagline">
              {t("tagline")}
            </p>
          </div>

          {/* Missions */}
          <div className="ab-section-label">{t("whyLabel")}</div>
          {missions.map((m) => (
            <div key={m.key} className="ab-mission">
              <div className="ab-mission-icon">
                <img src={m.icon} alt="" />
              </div>
              <div>
                <div className="ab-mission-title">{t(`mission.${m.key}.title`)}</div>
                <div className="ab-mission-desc">{t(`mission.${m.key}.desc`)}</div>
              </div>
            </div>
          ))}

          {/* Features */}
          <div className="ab-section-label">{t("featuresLabel")}</div>
          <div className="ab-features">
            {features.map((f) => (
              <Link key={f.key} href={f.href} className="ab-feat">
                <img src={f.icon} alt="" className="ab-feat-icon" />
                <div className="ab-feat-title">{t(`feature.${f.key}.title`)}</div>
                <div className="ab-feat-desc">{t(`feature.${f.key}.desc`)}</div>
                <div className="ab-feat-link">
                  {t("tryIt")}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                </div>
              </Link>
            ))}
          </div>

          {/* Founder Note */}
          <div className="ab-note">
            <div className="ab-note-header">
              <img src="/icons/icon-paw-sparkle.png" alt="" />
              <div>
                <div className="ab-note-header-text">{t("noteFrom")}</div>
                <div className="ab-note-header-sub">Genesis Program</div>
              </div>
            </div>
            <p className="ab-note-text">{t("noteText")}</p>
            <div className="ab-note-sig">{t("noteSig")}</div>
          </div>

        </div>
      </div>
    </>
  );
}
