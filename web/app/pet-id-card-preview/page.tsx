"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import * as htmlToImage from "html-to-image";
import QRCode from "qrcode";

type CardTheme = {
  id: string;
  name: string;
  caption: string;
  bg: string;
  accent: string;
  accent2: string;
  border: string;
  soft: string;
  divider: string;
  infoBg: string;
  petIdBg: string;
  preview: string;
  shadow: string;
};

const CARD_THEMES: CardTheme[] = [
  {
    id: "whiskora-pink",
    name: "Whiskora Pink",
    caption: "Official",
    bg: "/id-card/pet-id-card-bg-whiskora-pink-v1.png",
    accent: "#E84677",
    accent2: "#F472B6",
    border: "#FBCFE8",
    soft: "#FDF2F5",
    divider: "rgba(232,70,119,0.25)",
    infoBg: "linear-gradient(180deg, rgba(254,232,240,0.92) 0%, rgba(253,244,247,0.9) 100%)",
    petIdBg: "linear-gradient(135deg, #E84677 0%, #F472B6 100%)",
    preview: "linear-gradient(135deg, #fff8fb 0%, #fbcfe8 100%)",
    shadow: "0 20px 60px rgba(232,70,119,0.2)",
  },
  {
    id: "soft-blue",
    name: "Soft Blue",
    caption: "Calm",
    bg: "/id-card/pet-id-card-bg-soft-blue-v1.png",
    accent: "#388BD6",
    accent2: "#77BDF2",
    border: "#BFDBFE",
    soft: "#EFF6FF",
    divider: "rgba(56,139,214,0.24)",
    infoBg: "linear-gradient(180deg, rgba(225,242,255,0.92) 0%, rgba(246,251,255,0.9) 100%)",
    petIdBg: "linear-gradient(135deg, #388BD6 0%, #77BDF2 100%)",
    preview: "linear-gradient(135deg, #f8fcff 0%, #bfdbfe 100%)",
    shadow: "0 20px 60px rgba(56,139,214,0.18)",
  },
  {
    id: "mint-care",
    name: "Mint Care",
    caption: "Clean",
    bg: "/id-card/pet-id-card-bg-mint-care-v1.png",
    accent: "#149B85",
    accent2: "#5ED4BC",
    border: "#B7F0DF",
    soft: "#ECFDF8",
    divider: "rgba(20,155,133,0.24)",
    infoBg: "linear-gradient(180deg, rgba(221,249,240,0.92) 0%, rgba(246,255,251,0.9) 100%)",
    petIdBg: "linear-gradient(135deg, #149B85 0%, #5ED4BC 100%)",
    preview: "linear-gradient(135deg, #f8fffd 0%, #b7f0df 100%)",
    shadow: "0 20px 60px rgba(20,155,133,0.17)",
  },
  {
    id: "lavender-premium",
    name: "Lavender",
    caption: "Premium",
    bg: "/id-card/pet-id-card-bg-lavender-premium-v1.png",
    accent: "#8E5FCD",
    accent2: "#C8A7F5",
    border: "#DDD6FE",
    soft: "#F5F0FF",
    divider: "rgba(142,95,205,0.24)",
    infoBg: "linear-gradient(180deg, rgba(239,231,255,0.92) 0%, rgba(251,248,255,0.9) 100%)",
    petIdBg: "linear-gradient(135deg, #8E5FCD 0%, #C8A7F5 100%)",
    preview: "linear-gradient(135deg, #fdfaff 0%, #ddd6fe 100%)",
    shadow: "0 20px 60px rgba(142,95,205,0.18)",
  },
  {
    id: "cream-classic",
    name: "Cream Classic",
    caption: "Warm",
    bg: "/id-card/pet-id-card-bg-cream-classic-v1.png",
    accent: "#C2844B",
    accent2: "#E8B873",
    border: "#F3D8B8",
    soft: "#FFF8EF",
    divider: "rgba(194,132,75,0.24)",
    infoBg: "linear-gradient(180deg, rgba(255,243,225,0.92) 0%, rgba(255,251,246,0.9) 100%)",
    petIdBg: "linear-gradient(135deg, #C2844B 0%, #E8B873 100%)",
    preview: "linear-gradient(135deg, #fffdf8 0%, #f3d8b8 100%)",
    shadow: "0 20px 60px rgba(194,132,75,0.17)",
  },
  {
    id: "rose-gold",
    name: "Rose Gold",
    caption: "Verified",
    bg: "/id-card/pet-id-card-bg-rose-gold-v1.png",
    accent: "#CD7168",
    accent2: "#F0A39A",
    border: "#F8C9C3",
    soft: "#FFF2F0",
    divider: "rgba(205,113,104,0.24)",
    infoBg: "linear-gradient(180deg, rgba(255,232,229,0.92) 0%, rgba(255,248,247,0.9) 100%)",
    petIdBg: "linear-gradient(135deg, #CD7168 0%, #F0A39A 100%)",
    preview: "linear-gradient(135deg, #fffaf8 0%, #f8c9c3 100%)",
    shadow: "0 20px 60px rgba(205,113,104,0.18)",
  },
];

const rows = [
  { labelTh: "ชื่อ", labelEn: "Name", valueTh: "ลูน่า", valueEn: "LUNA", strong: true },
  { labelTh: "สายพันธุ์", labelEn: "Breed", valueTh: "สกอตติช โฟลด์", valueEn: "Scottish Fold" },
  { labelTh: "สี", labelEn: "Color", valueTh: "ครีมแท็บบี้", valueEn: "Cream Tabby" },
  { labelTh: "วันเกิด", labelEn: "Date of Birth", valueTh: "10 มี.ค. 2567", valueEn: "10 Mar 2024" },
  { labelTh: "อายุ", labelEn: "Age", valueTh: "2 ปี 3 เดือน", valueEn: "2y 3m" },
  { labelTh: "กรุ๊ปเลือด", labelEn: "Blood Type", valueTh: "A", valueEn: "Type A" },
  { labelTh: "ทำหมัน", labelEn: "Spayed / Neutered", valueTh: "ยังไม่ทำหมัน", valueEn: "Not neutered", pill: true },
];

const Icon = {
  Paw: ({ size = 18 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M11.5 7.5C11.5 8.88 10.38 10 9 10S6.5 8.88 6.5 7.5 7.62 5 9 5s2.5 1.12 2.5 2.5zM17.5 7.5C17.5 8.88 16.38 10 15 10s-2.5-1.12-2.5-2.5S13.62 5 15 5s2.5 1.12 2.5 2.5zM4.5 13C4.5 14.38 3.38 15.5 2 15.5S-.5 14.38-.5 13 .62 10.5 2 10.5 4.5 11.62 4.5 13zM22 13c0 1.38-1.12 2.5-2.5 2.5S17 14.38 17 13s1.12-2.5 2.5-2.5S22 11.62 22 13zM17.34 14.86c-.87-1.02-1.6-1.89-2.48-2.91-.46-.54-1.05-1.08-1.75-1.32-.11-.04-.22-.07-.33-.09-.25-.04-.52-.04-.78-.04s-.53 0-.79.05c-.11.02-.22.05-.33.09-.7.24-1.28.78-1.75 1.32-.87 1.02-1.6 1.89-2.48 2.91-1.31 1.31-2.92 2.76-2.62 4.79.29 1.02.94 1.99 2.04 2.5.63.29 1.33.4 2.03.4h.08c.3 0 .59-.02.89-.07l.06-.01c.61-.1 1.2-.29 1.8-.56.59.27 1.19.47 1.8.56l.06.01c.3.05.59.07.89.07h.08c.7 0 1.4-.11 2.03-.4 1.1-.51 1.75-1.48 2.04-2.5.3-2.03-1.31-3.48-2.62-4.79z" />
    </svg>
  ),
  Shield: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  ),
  Arrow: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  ),
  Cat: () => (
    <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 5c.7 0 1.35.08 2 .26C15.78 3.26 19.03 2.42 20.42 3c1.4.58-.42 7-.42 7 .57 1.07 1 2.24 1 3.44C21 17.9 16.97 21 12 21s-9-3-9-7.56c0-1.25.5-2.4 1-3.44 0 0-1.89-6.42-.5-7 1.39-.58 4.72.23 6.5 2.23A9.04 9.04 0 0 1 12 5Z" />
      <path d="M8 14v.5" />
      <path d="M16 14v.5" />
      <path d="M11.25 16.25h1.5L12 17l-.75-.75Z" />
    </svg>
  ),
};

export default function PetIdCardPreviewPage() {
  const [selectedThemeId, setSelectedThemeId] = useState(CARD_THEMES[0].id);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [cardImageUrl, setCardImageUrl] = useState("");
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const cardRef = useRef<HTMLElement>(null);
  const detailRows = rows;

  const selectedTheme = useMemo(
    () => CARD_THEMES.find((theme) => theme.id === selectedThemeId) || CARD_THEMES[0],
    [selectedThemeId],
  );

  useEffect(() => {
    let active = true;

    QRCode.toDataURL("https://whiskora.pet/p/luna-demo", {
      width: 220,
      margin: 1,
      color: { dark: "#111827", light: "#FFFFFF" },
    }).then((dataUrl) => {
      if (active) setQrDataUrl(dataUrl);
    });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!qrDataUrl || !cardRef.current) return;

    let cancelled = false;

    const generateCardImage = async () => {
      setIsGeneratingImage(true);
      setCardImageUrl("");
      try {
        await new Promise((resolve) => window.setTimeout(resolve, 120));
        if (cancelled || !cardRef.current) return;

        const dataUrl = await htmlToImage.toPng(cardRef.current, {
          cacheBust: true,
          pixelRatio: 3,
          quality: 1,
          skipFonts: true,
        });

        if (!cancelled) setCardImageUrl(dataUrl);
      } catch (error) {
        console.error("Error generating preview card:", error);
      } finally {
        if (!cancelled) setIsGeneratingImage(false);
      }
    };

    generateCardImage();

    return () => {
      cancelled = true;
    };
  }, [qrDataUrl, selectedThemeId]);

  return (
    <>
      <style>{`
        .preview-page {
          min-height: 100vh;
          overflow-x: hidden;
          background:
            radial-gradient(circle at 16% 12%, rgba(232,70,119,0.09), transparent 28%),
            linear-gradient(180deg, #FFFAFC 0%, #FFFFFF 42%, #FFF7FA 100%);
          color: #15122B;
        }
        .preview-wrap {
          width: min(1180px, calc(100% - 32px));
          margin: 0 auto;
          padding: 34px 0 56px;
        }
        .preview-topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 26px;
        }
        .preview-logo {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          font-size: 30px;
          font-weight: 900;
          color: #F43F7F;
          letter-spacing: 0;
          text-decoration: none;
        }
        .preview-logo img {
          width: clamp(132px, 34vw, 176px);
          height: auto;
          margin: -18px 0;
          object-fit: contain;
        }
        .preview-home {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          min-height: 42px;
          padding: 0 16px;
          border-radius: 999px;
          border: 1px solid #FBCFE8;
          background: rgba(255,255,255,0.78);
          color: #3B3158;
          font-size: 14px;
          font-weight: 700;
          text-decoration: none;
          box-shadow: 0 12px 30px rgba(232,70,119,0.08);
        }
        .preview-hero {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(360px, 440px);
          align-items: center;
          gap: 54px;
        }
        .preview-copy {
          max-width: 640px;
        }
        .preview-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 14px;
          border-radius: 999px;
          background: #FFFFFF;
          border: 1px solid #FBCFE8;
          color: #E84677;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: .08em;
          text-transform: uppercase;
          box-shadow: 0 10px 26px rgba(232,70,119,0.08);
        }
        .preview-title {
          margin: 18px 0 14px;
          max-width: 680px;
          font-size: 48px;
          line-height: 1.12;
          font-weight: 800;
          letter-spacing: 0;
          color: #171331;
        }
        .preview-title span {
          color: #E84677;
        }
        .preview-desc {
          max-width: 590px;
          margin: 0;
          color: #5B536D;
          font-size: 17px;
          line-height: 1.85;
          font-weight: 400;
        }
        .preview-notes {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 12px;
          margin-top: 28px;
        }
        .preview-note {
          min-height: 96px;
          padding: 16px;
          border: 1px solid #F4D6E1;
          border-radius: 18px;
          background: rgba(255,255,255,0.82);
          box-shadow: 0 16px 38px rgba(17,24,39,0.05);
        }
        .preview-note b {
          display: block;
          margin-bottom: 6px;
          color: #211A3D;
          font-size: 14px;
          font-weight: 800;
        }
        .preview-note span {
          display: block;
          color: #6D647B;
          font-size: 13px;
          line-height: 1.55;
          font-weight: 400;
        }
        .preview-stage {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: min(430px, 100%);
          max-width: 100%;
          position: relative;
          gap: 18px;
        }
        .sample-card-rendered {
          display: block;
          width: min(400px, calc(100vw - 32px));
          max-width: none;
          aspect-ratio: 2 / 3;
          border-radius: 30px;
          box-shadow: 0 26px 70px rgba(232,70,119,0.14), 0 12px 30px rgba(17,24,39,0.08);
          object-fit: contain;
          -webkit-touch-callout: default;
          user-select: none;
        }
        .sample-card.is-capture-source {
          display: none;
        }
        .sample-card {
          width: min(400px, calc(100vw - 32px));
          max-width: none;
          aspect-ratio: 2 / 3;
          box-sizing: border-box;
          position: relative;
          overflow: hidden;
          border-radius: 24px;
          border: 3px solid var(--card-border);
          background-image: var(--card-bg), linear-gradient(160deg, #FDEEF4 0%, #FFFFFF 42%, #FEF3F7 100%);
          background-size: cover, cover;
          background-position: center, center;
          box-shadow: var(--card-shadow);
        }
        .sample-card-inner {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          gap: 10px;
          padding: 16px;
          box-sizing: border-box;
        }
        .sample-card-head {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 54px;
          text-align: center;
        }
        .sample-card-logo {
          height: 34px;
          width: auto;
          object-fit: contain;
        }
        .sample-card-rule {
          display: flex;
          align-items: center;
          gap: 8px;
          width: 100%;
          margin-top: 3px;
          color: var(--card-accent);
          font-size: 7px;
          font-weight: 800;
          letter-spacing: .16em;
          white-space: nowrap;
        }
        .sample-card-rule::before,
        .sample-card-rule::after {
          content: "";
          height: 1px;
          flex: 1;
          background: linear-gradient(90deg, transparent, var(--card-border), transparent);
        }
        .sample-card-sub {
          margin-top: 1px;
          color: #5B536D;
          font-size: 8px;
          font-weight: 600;
          letter-spacing: .02em;
          line-height: 1.1;
          white-space: nowrap;
        }
        .sample-media {
          position: relative;
          z-index: 2;
          display: grid;
          grid-template-columns: 116px minmax(0, 1fr) 96px;
          align-items: stretch;
          gap: 10px;
          min-height: 132px;
        }
        .sample-photo,
        .sample-qr {
          border-radius: 18px;
          border: 2px solid var(--card-border);
          overflow: hidden;
          background: var(--card-soft);
        }
        .sample-photo {
          display: flex;
          align-items: center;
          justify-content: center;
          background:
            radial-gradient(circle at 52% 28%, rgba(255,255,255,0.95), rgba(255,255,255,0.08) 52%),
            linear-gradient(135deg, color-mix(in srgb, var(--card-accent) 14%, white), #FFFFFF);
          color: var(--card-accent);
        }
        .sample-photo-art {
          display: grid;
          place-items: center;
          width: 72%;
          aspect-ratio: 1;
          border-radius: 50%;
          background: rgba(255,255,255,0.62);
          box-shadow: inset 0 0 0 1px rgba(255,255,255,0.88);
        }
        .sample-identity {
          display: flex;
          flex-direction: column;
          justify-content: center;
          min-width: 0;
          padding: 12px;
          border: 1px solid color-mix(in srgb, var(--card-border) 70%, white);
          border-radius: 18px;
          background: rgba(255,255,255,0.72);
          box-shadow: inset 0 0 0 1px rgba(255,255,255,0.55);
        }
        .sample-status {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          width: fit-content;
          min-height: 22px;
          padding: 0 8px;
          border-radius: 999px;
          background: color-mix(in srgb, var(--card-accent) 10%, white);
          color: var(--card-accent);
          font-size: 7.5px;
          font-weight: 800;
          letter-spacing: .11em;
          text-transform: uppercase;
        }
        .sample-name {
          margin-top: 8px;
          color: #171331;
          font-size: 22px;
          line-height: 1;
          font-weight: 900;
          letter-spacing: .02em;
        }
        .sample-meta {
          margin-top: 5px;
          color: #5B536D;
          font-size: 9.5px;
          line-height: 1.45;
          font-weight: 600;
        }
        .sample-mini-row {
          display: flex;
          gap: 5px;
          margin-top: 10px;
          flex-wrap: wrap;
        }
        .sample-mini {
          display: inline-flex;
          align-items: center;
          min-height: 22px;
          padding: 0 8px;
          border-radius: 999px;
          border: 1px solid var(--card-border);
          background: rgba(255,255,255,0.76);
          color: #504764;
          font-size: 8px;
          font-weight: 700;
          white-space: nowrap;
        }
        .sample-qr {
          position: relative;
          align-self: center;
          aspect-ratio: 1;
          padding: 7px;
          background: #FFFFFF;
        }
        .sample-qr img {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }
        .sample-qr-center {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          display: grid;
          place-items: center;
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background: #FFFFFF;
          color: var(--card-accent);
          box-shadow: 0 0 0 4px rgba(255,255,255,0.9);
        }
        .sample-stamp {
          position: absolute;
          left: 68%;
          bottom: -82px;
          transform: translateX(-50%);
          width: 158px;
          height: 158px;
          z-index: 5;
          pointer-events: none;
        }
        .sample-stamp img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          display: block;
          filter: drop-shadow(0 7px 14px rgba(232,70,119,0.14));
        }
        .sample-info {
          position: relative;
          z-index: 1;
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 8px;
        }
        .sample-row {
          display: grid;
          grid-template-columns: 24px minmax(0, 1fr);
          align-items: center;
          gap: 8px;
          min-height: 54px;
          padding: 8px;
          border: 0;
          border-radius: 14px;
          background: rgba(255,255,255,0.7);
          box-shadow: none;
        }
        .sample-row + .sample-row {
          border-top: 0;
        }
        .sample-icon {
          display: grid;
          place-items: center;
          width: 24px;
          height: 24px;
          border-radius: 8px;
          border: 1px solid var(--card-border);
          background: rgba(255,255,255,0.82);
          color: var(--card-accent);
        }
        .sample-label {
          display: flex;
          flex-direction: column;
          gap: 1px;
          min-width: 0;
        }
        .sample-line {
          display: flex;
          align-items: baseline;
          flex-wrap: nowrap;
          gap: 4px;
          min-width: 0;
          white-space: nowrap;
        }
        .sample-line-th {
          color: #171331;
        }
        .sample-line-en {
          color: #918A9E;
        }
        .sample-label-th {
          display: inline-flex;
          flex: 0 0 auto;
          color: #171331;
          font-size: 10.6px;
          line-height: 1.15;
          font-weight: 800;
        }
        .sample-label-en {
          display: inline-flex;
          flex: 0 0 auto;
          color: #918A9E;
          font-size: 7.4px;
          line-height: 1.15;
          font-weight: 600;
          letter-spacing: .02em;
        }
        .sample-vline {
          display: none;
        }
        .sample-value {
          min-width: 0;
          margin-top: 0;
          color: #171331;
          font-size: 12.2px;
          line-height: 1.08;
          font-weight: 800;
          white-space: nowrap;
          overflow: visible;
          text-overflow: clip;
        }
        .sample-value.strong {
          font-size: 12.2px;
          font-weight: 800;
          letter-spacing: 0;
        }
        .sample-value-en {
          display: inline;
          min-width: 0;
          margin-top: 0;
          color: #7E768E;
          font-size: 8px;
          line-height: 1.08;
          font-weight: 600;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .sample-row.is-primary .sample-value-en {
          font-size: 9px;
          letter-spacing: .08em;
          text-transform: uppercase;
        }
        .sample-pill {
          display: inline-flex;
          align-items: center;
          min-height: 20px;
          max-width: 100%;
          padding: 0 9px;
          border-radius: 999px;
          border: 1px solid rgba(17,24,39,0.08);
          background: rgba(255,255,255,0.74);
          color: #6D647B;
          font-size: 10.2px;
          font-weight: 700;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .sample-petid {
          z-index: 1;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: space-between;
          min-height: 58px;
          padding: 9px 14px;
          border-radius: 14px;
          color: #FFFFFF;
          background: var(--card-petid-bg);
        }
        .sample-petid-left {
          min-width: 0;
          flex: 1;
        }
        .sample-petid-label {
          display: flex;
          align-items: flex-start;
          gap: 6px;
          font-size: 8px;
          font-weight: 800;
          letter-spacing: 0;
          text-transform: none;
          color: rgba(255,255,255,0.86);
        }
        .sample-petid-label-text {
          display: flex;
          flex-direction: column;
          gap: 1px;
          min-width: 0;
        }
        .sample-petid-label-th {
          font-size: 8px;
          line-height: 1;
          font-weight: 800;
          white-space: nowrap;
        }
        .sample-petid-label-en {
          font-size: 6px;
          line-height: 1;
          font-weight: 700;
          letter-spacing: .16em;
          text-transform: uppercase;
          opacity: .78;
        }
        .sample-petid-code {
          margin-top: 1px;
          font-size: 14px;
          line-height: 1;
          font-weight: 900;
          letter-spacing: .01em;
          white-space: nowrap;
        }
        .sample-petid-date {
          margin-top: 2px;
          font-size: 8px;
          font-weight: 600;
          color: rgba(255,255,255,0.76);
        }
        .sample-footer {
          min-height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-wrap: nowrap;
          gap: 5px;
          padding: 6px 10px 0;
          border-top: 1.5px solid var(--card-border);
          background: transparent;
          color: #5B536D;
          font-size: 8.5px;
          font-weight: 700;
          letter-spacing: .04em;
          white-space: nowrap;
        }
        .sample-footer b {
          color: var(--card-accent);
        }
        .sample-card {
          border-width: 1px;
          border-radius: 30px;
          background-color: #FFFFFF;
          box-shadow: 0 26px 70px rgba(232,70,119,0.14), 0 12px 30px rgba(17,24,39,0.08);
        }
        .sample-card::before {
          content: "";
          position: absolute;
          inset: 0;
          z-index: 0;
          background: rgba(255,255,255,0.48);
          pointer-events: none;
        }
        .sample-card-inner {
          z-index: 1;
          gap: clamp(5px, 1.8vw, 8px);
          padding: clamp(13px, 4.2vw, 18px);
          justify-content: space-between;
        }
        .sample-card-head {
          min-height: clamp(45px, 12.5vw, 60px);
        }
        .sample-card-logo {
          height: clamp(30px, 9.8vw, 42px);
        }
        .sample-card-rule {
          margin-top: 4px;
          color: color-mix(in srgb, var(--card-accent) 92%, #171331);
        }
        .sample-card-sub {
          color: rgba(23,19,49,0.64);
        }
        .sample-media {
          grid-template-columns: minmax(0, 1fr) clamp(86px, 27vw, 116px);
          min-height: clamp(110px, 34vw, 136px);
          gap: clamp(6px, 2.2vw, 10px);
          padding: clamp(7px, 2.4vw, 9px);
          border: 1px solid color-mix(in srgb, var(--card-border) 42%, white);
          border-radius: clamp(18px, 6vw, 24px);
          background: linear-gradient(135deg, rgba(255,255,255,0.82), rgba(255,255,255,0.58));
          box-shadow: inset 0 0 0 1px rgba(255,255,255,0.56), 0 10px 26px rgba(17,24,39,0.045);
        }
        .sample-photo {
          position: relative;
          border: 0;
          border-radius: 21px;
          min-height: 100%;
          overflow: visible;
          box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--card-border) 42%, white);
        }
        .sample-photo-art {
          width: 68%;
          background: rgba(255,255,255,0.68);
        }
        .sample-identity {
          padding: 4px 2px;
          border: 0;
          border-radius: 0;
          background: transparent;
          box-shadow: none;
          display: none;
        }
        .sample-status {
          min-height: clamp(17px, 5.2vw, 19px);
          padding: 0 clamp(5px, 1.8vw, 7px);
          font-size: clamp(6px, 1.9vw, 6.8px);
          background: color-mix(in srgb, var(--card-accent) 8%, white);
        }
        .sample-status svg {
          width: 12px;
          height: 12px;
        }
        .sample-name {
          margin-top: 6px;
          font-size: clamp(17px, 5.3vw, 20px);
        }
        .sample-meta {
          margin-top: 4px;
          font-size: clamp(7.7px, 2.5vw, 9px);
        }
        .sample-mini-row {
          margin-top: 8px;
        }
        .sample-mini {
          min-height: clamp(17px, 5.2vw, 20px);
          padding: 0 clamp(5px, 1.8vw, 7px);
          font-size: clamp(6.5px, 2vw, 7.5px);
        }
        .sample-qr {
          width: 100%;
          align-self: stretch;
          border: 0;
          border-radius: 18px;
          padding: 6px;
          box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--card-border) 48%, white), 0 8px 18px rgba(17,24,39,0.05);
        }
        .sample-qr-center {
          width: 24px;
          height: 24px;
          box-shadow: 0 0 0 3px rgba(255,255,255,0.9);
        }
        .sample-qr-center img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          border-radius: 50%;
          display: block;
        }
        .sample-stamp {
          display: block;
          width: clamp(122px, 39vw, 158px);
          height: clamp(122px, 39vw, 158px);
        }
        .sample-info {
          gap: 0;
          overflow: hidden;
          border: 1px solid color-mix(in srgb, var(--card-border) 40%, white);
          border-radius: clamp(16px, 5vw, 20px);
          background: rgba(255,255,255,0.68);
          box-shadow: inset 0 0 0 1px rgba(255,255,255,0.52);
        }
        .sample-row {
          grid-template-columns: minmax(0, 1fr);
          min-height: clamp(39px, 10.8vw, 44px);
          padding: clamp(4px, 1.25vw, 5px) clamp(8px, 2.6vw, 10px);
          border: 0;
          border-radius: 0;
          background: transparent;
          box-shadow: none;
        }
        .sample-row:nth-child(odd) {
          border-right: 0;
        }
        .sample-info .sample-row:nth-child(odd) {
          border-right: 0;
        }
        .sample-info .sample-row:nth-child(even) {
          border-right: 0;
        }
        .sample-row:nth-child(n+3) {
          border-top: 0;
        }
        .sample-info .sample-row:nth-child(n+2) {
          border-top: 0;
        }
        .sample-row.is-primary {
          grid-column: 1 / -1;
          min-height: clamp(39px, 10.8vw, 44px);
          border-right: 0;
          background: linear-gradient(90deg, rgba(255,255,255,0.62), color-mix(in srgb, var(--card-accent) 6%, white));
        }
        .sample-row.is-primary + .sample-row {
          border-top: 0;
        }
        .sample-icon {
          display: none;
          width: clamp(18px, 5.8vw, 21px);
          height: clamp(18px, 5.8vw, 21px);
          border-radius: 8px;
          border-color: color-mix(in srgb, var(--card-border) 46%, white);
          background: color-mix(in srgb, var(--card-accent) 6%, white);
        }
        .sample-label-th {
          font-size: clamp(9.2px, 2.75vw, 10.6px);
          font-weight: 800;
        }
        .sample-label-en {
          font-size: clamp(6.4px, 1.95vw, 7.4px);
        }
        .sample-value {
          font-size: clamp(10.4px, 3.05vw, 12.2px);
          font-weight: 800;
        }
        .sample-row.is-primary .sample-value {
          color: #171331;
          font-size: clamp(10.4px, 3.05vw, 12.2px);
          line-height: 1.08;
          letter-spacing: 0;
        }
        .sample-value-en {
          font-size: clamp(6.8px, 2.08vw, 8px);
        }
        .sample-row.is-primary .sample-value-en {
          font-size: clamp(6.8px, 2.08vw, 8px);
        }
        .sample-petid {
          min-height: 56px;
          border-radius: 20px;
          box-shadow: 0 12px 24px color-mix(in srgb, var(--card-accent) 15%, transparent);
        }
        .sample-footer {
          min-height: 24px;
          width: fit-content;
          max-width: 100%;
          margin: 0 auto;
          padding: 3px 12px;
          border: 0;
          border-radius: 999px;
          background: color-mix(in srgb, var(--card-accent) 7%, white);
          font-size: 8px;
        }
        .sample-bottom {
          position: relative;
          z-index: 1;
          padding: clamp(6px, 2.2vw, 8px);
          border: 1px solid color-mix(in srgb, var(--card-border) 34%, white);
          border-radius: clamp(18px, 6vw, 24px);
          background: linear-gradient(180deg, color-mix(in srgb, var(--card-accent) 8%, white) 0%, rgba(255,255,255,0.58) 100%);
          box-shadow: inset 0 0 0 1px rgba(255,255,255,0.5), 0 10px 24px rgba(17,24,39,0.035);
        }
        .sample-bottom .sample-petid {
          width: 100%;
          min-height: clamp(52px, 15.5vw, 62px);
          border-radius: clamp(15px, 4.8vw, 18px);
          padding: clamp(8px, 2.6vw, 10px) clamp(10px, 3.5vw, 14px);
        }
        .sample-bottom .sample-petid-label {
          font-size: clamp(7px, 2.2vw, 8px);
        }
        .sample-bottom .sample-petid-label-th {
          font-size: clamp(6.8px, 2.05vw, 8px);
        }
        .sample-bottom .sample-petid-label-en {
          font-size: clamp(5.2px, 1.6vw, 6px);
        }
        .sample-bottom .sample-petid-code {
          font-size: clamp(11.5px, 3.6vw, 14px);
        }
        .sample-bottom .sample-petid-date {
          font-size: clamp(7px, 2.1vw, 8px);
        }
        .sample-bottom .sample-footer {
          width: 100%;
          min-height: 22px;
          margin: 6px 0 0;
          padding: 0 6px;
          border-radius: 0;
          background: transparent;
          line-height: 1.15;
          gap: 4px;
        }
        .sample-bottom .sample-footer svg {
          width: 13px;
          height: 13px;
          flex-shrink: 0;
        }
        .theme-panel {
          width: 100%;
          max-width: 430px;
          box-sizing: border-box;
          padding: 14px;
          border-radius: 20px;
          border: 1px solid #F4D6E1;
          background: rgba(255,255,255,0.86);
          box-shadow: 0 18px 44px rgba(17,24,39,0.06);
        }
        .theme-panel-head {
          display: flex;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 12px;
        }
        .theme-panel-title {
          color: #171331;
          font-size: 14px;
          font-weight: 800;
        }
        .theme-panel-current {
          color: var(--card-accent);
          font-size: 12px;
          font-weight: 800;
          white-space: nowrap;
        }
        .theme-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 9px;
        }
        .theme-choice {
          min-width: 0;
          appearance: none;
          padding: 8px;
          border-radius: 14px;
          border: 1px solid #E9DCE4;
          background: #FFFFFF;
          text-align: left;
          cursor: pointer;
          font-family: inherit;
          transition: transform .16s ease, border-color .16s ease, box-shadow .16s ease;
        }
        .theme-choice:hover,
        .theme-choice.active {
          transform: translateY(-1px);
          border-color: var(--theme-accent);
          box-shadow: 0 10px 24px color-mix(in srgb, var(--theme-accent) 18%, transparent);
        }
        .theme-swatch {
          display: block;
          height: 46px;
          border-radius: 10px;
          background: var(--theme-preview);
          border: 1px solid rgba(255,255,255,0.9);
          box-shadow: inset 0 0 0 1px rgba(17,24,39,0.04);
        }
        .theme-name,
        .theme-caption {
          display: block;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .theme-name {
          margin-top: 7px;
          color: #171331;
          font-size: 10px;
          font-weight: 800;
        }
        .theme-caption {
          margin-top: 1px;
          color: #918A9E;
          font-size: 9px;
          font-weight: 700;
        }
        @media (max-width: 900px) {
          .preview-hero {
            grid-template-columns: 1fr;
            gap: 30px;
          }
          .preview-copy {
            order: 2;
            max-width: none;
          }
          .preview-title {
            max-width: 620px;
            font-size: 38px;
          }
          .preview-stage {
            order: 1;
            align-items: center;
          }
        }
        @media (max-width: 620px) {
          .preview-wrap {
            width: min(100% - 24px, 1180px);
            padding: 18px 0 38px;
          }
          .preview-topbar {
            margin-bottom: 12px;
          }
          .preview-logo img {
            width: clamp(122px, 38vw, 144px);
            height: auto;
            margin: -16px 0;
          }
          .preview-home {
            min-height: 38px;
            padding: 0 12px;
            font-size: 13px;
          }
          .preview-title {
            font-size: 25px;
          }
          .preview-desc {
            font-size: 14px;
            line-height: 1.75;
          }
          .preview-notes {
            display: none;
          }
          .preview-stage {
            align-items: center;
          }
          .theme-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }
      `}</style>

      <main
        className="preview-page"
        style={
          {
            "--card-accent": selectedTheme.accent,
            "--card-accent-2": selectedTheme.accent2,
            "--card-border": selectedTheme.border,
            "--card-soft": selectedTheme.soft,
            "--card-divider": selectedTheme.divider,
            "--card-info-bg": selectedTheme.infoBg,
            "--card-petid-bg": selectedTheme.petIdBg,
            "--card-bg": `url("${selectedTheme.bg}")`,
            "--card-shadow": selectedTheme.shadow,
          } as React.CSSProperties & Record<string, string>
        }
      >
        <div className="preview-wrap">
          <header className="preview-topbar">
            <Link href="/th" className="preview-logo" aria-label="Whiskora">
              <img src="/logo.png" alt="Whiskora" />
            </Link>
            <Link href="/th" className="preview-home">
              กลับหน้าแรก <Icon.Arrow />
            </Link>
          </header>

          <section className="preview-hero">
            <div className="preview-copy">
              <div className="preview-eyebrow">
                <Icon.Shield />
                Pet ID Card Preview
              </div>
              <h1 className="preview-title">
                ตัวอย่างหน้าบัตรประจำตัวสัตว์เลี้ยง <span>พร้อมเลือกธีมได้</span>
              </h1>
              <p className="preview-desc">
                หน้านี้เป็น preview สำหรับดูหน้าตาของบัตร Whiskora ก่อนใช้งานจริง
                ข้อมูลในบัตรเป็นข้อมูลตัวอย่าง ส่วนระบบจริงจะดึงรูปสัตว์ ข้อมูลเจ้าของ
                QR Profile และตรารับรองจากฐานข้อมูลของแต่ละโปรไฟล์
              </p>

              <div className="preview-notes" aria-label="Preview notes">
                <div className="preview-note">
                  <b>ใช้พื้นหลังจริง</b>
                  <span>ธีมทั้งหมดใช้ไฟล์เดียวกับระบบบัตร Pet ID จริง</span>
                </div>
                <div className="preview-note">
                  <b>รองรับมือถือ</b>
                  <span>หน้าตัวอย่างถูกจัดให้อ่านง่ายบนจอมือถือเป็นหลัก</span>
                </div>
                <div className="preview-note">
                  <b>พร้อมต่อยอด</b>
                  <span>เลือกธีมแล้วนำ logic เดียวกันไปใช้กับหน้าใช้งานจริงได้</span>
                </div>
              </div>
            </div>

            <div className="preview-stage" aria-busy={isGeneratingImage}>
              {cardImageUrl ? (
                <img
                  src={cardImageUrl}
                  alt="Sample Whiskora Pet ID Card"
                  className="sample-card-rendered"
                />
              ) : null}

              <article
                ref={cardRef}
                className={`sample-card${cardImageUrl ? " is-capture-source" : ""}`}
                aria-label="Sample Whiskora Pet ID Card"
                aria-hidden={cardImageUrl ? "true" : undefined}
              >
                <div className="sample-card-inner">
                  <div className="sample-card-head">
                    <img src="/logo%20-%20id%20card.PNG" alt="Whiskora" className="sample-card-logo" />
                    <div className="sample-card-rule">PET IDENTIFICATION CARD</div>
                    <div className="sample-card-sub">บัตรประจำตัวสัตว์เลี้ยง</div>
                  </div>

                  <div className="sample-media">
                    <div className="sample-photo">
                      <div className="sample-photo-art">
                        <Icon.Cat />
                      </div>
                      <div className="sample-stamp">
                        <img src="/verified.png" alt="Whiskora verified" />
                      </div>
                    </div>
                    <div className="sample-identity">
                      <div className="sample-status">
                        <Icon.Shield />
                        Verified
                      </div>
                      <div className="sample-name">LUNA</div>
                      <div className="sample-meta">Scottish Fold • Cream Tabby</div>
                      <div className="sample-mini-row">
                        <span className="sample-mini">Female</span>
                        <span className="sample-mini">2y 3m</span>
                      </div>
                    </div>
                    <div className="sample-qr">
                      {qrDataUrl ? <img src={qrDataUrl} alt="QR Code ตัวอย่าง" /> : null}
                      <div className="sample-qr-center">
                        <img src="/paw.png" alt="" aria-hidden="true" />
                      </div>
                    </div>
                  </div>

                  <div className="sample-info">
                    {detailRows.map((row) => (
                      <div className={`sample-row${row.strong ? " is-primary" : ""}`} key={row.labelEn}>
                        <div className="sample-icon">
                          <Icon.Paw size={13} />
                        </div>
                        <div className="sample-label">
                          <span className="sample-line sample-line-th">
                            <span className="sample-label-th">{row.labelTh}</span>
                            <span className={`sample-value${row.strong ? " strong" : ""}`}>
                              {row.pill ? <span className="sample-pill">{row.valueTh}</span> : row.valueTh}
                            </span>
                          </span>
                          <span className="sample-line sample-line-en">
                            <span className="sample-label-en">{row.labelEn}</span>
                            <span className="sample-value-en">{row.valueEn}</span>
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="sample-bottom">
                    <div className="sample-petid">
                      <div className="sample-petid-left">
                        <div className="sample-petid-label">
                          <Icon.Paw size={11} />
                          <span className="sample-petid-label-text">
                            <span className="sample-petid-label-th">เลขประจำตัวสัตว์เลี้ยง</span>
                            <span className="sample-petid-label-en">Pet ID</span>
                          </span>
                        </div>
                        <div className="sample-petid-code">WSK-24-000123</div>
                        <div className="sample-petid-date">ออกให้เมื่อ 19 มิ.ย. 2569</div>
                      </div>
                      <Icon.Shield />
                    </div>

                    <div className="sample-footer">
                      <Icon.Shield />
                      <span>รับรองโดย <b>Whiskora</b></span>
                    </div>
                  </div>
                </div>
              </article>

              <section className="theme-panel" aria-label="Card theme selector">
                <div className="theme-panel-head">
                  <div className="theme-panel-title">เลือกธีมบัตร</div>
                  <div className="theme-panel-current">{selectedTheme.name}</div>
                </div>
                <div className="theme-grid">
                  {CARD_THEMES.map((theme) => (
                    <button
                      key={theme.id}
                      type="button"
                      className={`theme-choice${theme.id === selectedTheme.id ? " active" : ""}`}
                      onClick={() => {
                        setCardImageUrl("");
                        setSelectedThemeId(theme.id);
                      }}
                      aria-pressed={theme.id === selectedTheme.id}
                      style={
                        {
                          "--theme-accent": theme.accent,
                          "--theme-preview": theme.preview,
                        } as React.CSSProperties & Record<string, string>
                      }
                    >
                      <span className="theme-swatch" />
                      <span className="theme-name">{theme.name}</span>
                      <span className="theme-caption">{theme.caption}</span>
                    </button>
                  ))}
                </div>
              </section>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
