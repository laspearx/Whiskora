"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
// ─── Design tokens ───────────────────────────────────────────────────────────
const F = {
  ink: '#1f1a1c',
  inkSoft: '#4a3f44',
  cream: '#fffafc',
  paper: '#fdf0f3',
  line: '#f3dde3',
  muted: '#8e7e84',
  pink: '#e84677',
  pinkSoft: '#fde2ea',
  pinkDeep: '#c4325f',
  sky: '#5b8dc7',
  leaf: '#5a9065',
  sun: '#e8a63a',
};

// ─── Farm data ───────────────────────────────────────────────────────────────
const FARMS = [
  { id: '1', name: 'ฟาร์มน้องเหมียว',  loc: 'กรุงเทพฯ · 2.4 กม.',    rating: 4.9, breed: 'แมวเปอร์เซีย',        certs: ['CFA'] },
  { id: '2', name: 'The Paws Bangkok',  loc: 'นนทบุรี · 8.1 กม.',      rating: 4.8, breed: 'โกลเด้น รีทรีฟเวอร์',  certs: ['TICA'] },
  { id: '3', name: 'ฟาร์มคุณหมอ',      loc: 'ปทุมธานี · 12 กม.',      rating: 4.9, breed: 'แมวบริติช',            certs: ['CFA','TICA'] },
  { id: '4', name: 'Siam Feline',       loc: 'กรุงเทพฯ · 5.2 กม.',    rating: 5.0, breed: 'แมววิเชียรมาศ',        certs: ['CFA'] },
  { id: '5', name: 'Happy Tails Farm',  loc: 'สมุทรปราการ · 15 กม.',   rating: 4.7, breed: 'พุดเดิ้ล',              certs: [] },
  { id: '6', name: 'ฟาร์มบ้านแมว',    loc: 'กรุงเทพฯ · 3.8 กม.',    rating: 4.9, breed: 'แมวอเมริกันขนสั้น',    certs: ['TICA'] },
];

const FILTERS = ['ทั้งหมด', 'สุนัข', 'แมว', 'กระต่าย', 'ใกล้ฉัน', 'ยืนยันแล้ว'];
const CHIPS   = ['แมวเปอร์เซีย', 'โกลเด้น', 'คลินิก', 'วัคซีน', 'กรูมมิ่ง'];

// ─── Icons ───────────────────────────────────────────────────────────────────
const Icon = {
  Search: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
    </svg>
  ),
  Dog: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 5.172C10 3.782 8.423 2.679 6.5 3c-2 .336-3.5 2-3.5 3.5 0 1.079.49 2.044 1.267 2.688L5 15h5V7c.667-.667 0-1.828 0-1.828z"/>
      <path d="M14.267 9.188C15.044 8.544 15.5 7.579 15.5 6.5c0-1.5-1.5-3.164-3.5-3.5-1.923-.321-3.5.782-3.5 2.172 0 0-.667 1.161 0 1.828"/>
      <path d="M5 15v3a2 2 0 0 0 4 0v-3"/><path d="M14 15v3a2 2 0 0 0 4 0v-3"/><path d="M9 15h6"/>
    </svg>
  ),
  Cat: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5c.67 0 1.35.09 2 .26 1.78-2 5.03-2.84 6.42-2.26 1.4.58-.42 7-.42 7 .57 1.07 1 2.24 1 3.44C21 17.9 16.97 21 12 21s-9-3-9-7.56c0-1.25.5-2.4 1-3.44 0 0-1.89-6.42-.5-7 1.39-.58 4.72.23 6.5 2.23A9.04 9.04 0 0 1 12 5z"/>
      <path d="M8 14v.5"/><path d="M16 14v.5"/><path d="M11.25 16.25h1.5L12 17z"/>
    </svg>
  ),
  Clinic: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
      <path d="M12 8v4"/><path d="M10 10h4"/>
    </svg>
  ),
  Scissors: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/>
      <line x1="20" y1="4" x2="8.12" y2="15.88"/><line x1="14.47" y1="14.48" x2="20" y2="20"/>
      <line x1="8.12" y1="8.12" x2="12" y2="12"/>
    </svg>
  ),
  Community: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  IdCard: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="5" width="20" height="14" rx="2"/>
      <circle cx="8" cy="12" r="2"/>
      <path d="M14 10h4"/><path d="M14 14h4"/>
    </svg>
  ),
  Heart: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 21s-7-4.5-7-10a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 5.5-7 10-7 10"/>
    </svg>
  ),
  Pet: () => (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="4" r="2"/><circle cx="18" cy="8" r="2"/><circle cx="20" cy="16" r="2"/>
      <path d="M9 10a5 5 0 0 1 5 5v3.5a3.5 3.5 0 0 1-6.84 1.045Q6.52 17.48 4.46 16.84A3.5 3.5 0 0 1 5.5 10Z"/>
    </svg>
  ),
  MapPin: () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>
    </svg>
  ),
  Brain: () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"/>
      <path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"/>
      <path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4"/>
      <path d="M17.599 6.5a3 3 0 0 0 .399-1.375"/>
      <path d="M6.003 5.125A3 3 0 0 0 6.401 6.5"/>
      <path d="M3.477 10.896a4 4 0 0 1 .585-.396"/>
      <path d="M19.938 10.5a4 4 0 0 1 .585.396"/>
      <path d="M6 18a4 4 0 0 1-1.967-.516"/>
      <path d="M19.967 17.484A4 4 0 0 1 18 18"/>
    </svg>
  ),
};

// ─── Paw logo ─────────────────────────────────────────────────────────────────
function PawMark({ size = 40, opacity = 1 }: { size?: number; opacity?: number }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"
      style={{ width: size, height: size, opacity, filter: 'drop-shadow(0 2px 4px rgba(232,70,119,.15))' }}>
      <defs>
        <radialGradient id="pawFootGrad" cx="35%" cy="28%" r="80%">
          <stop offset="0%" stopColor="#ffffff"/>
          <stop offset="60%" stopColor="#fff0f5"/>
          <stop offset="100%" stopColor="#fcd3e0"/>
        </radialGradient>
      </defs>
      <circle cx="32" cy="32" r="29" fill="url(#pawFootGrad)" stroke="#f8a5bf" strokeWidth="1.5"/>
      <g fill="#ec5b89">
        <ellipse cx="32" cy="43" rx="10" ry="8.5"/>
        <ellipse cx="19.5" cy="31" rx="4.2" ry="5.6" transform="rotate(-20 19.5 31)"/>
        <ellipse cx="26" cy="20" rx="3.8" ry="5" transform="rotate(-10 26 20)"/>
        <g transform="matrix(-1 0 0 1 64 0)">
          <ellipse cx="19.5" cy="31" rx="4.2" ry="5.6" transform="rotate(-20 19.5 31)"/>
          <ellipse cx="26" cy="20" rx="3.8" ry="5" transform="rotate(-10 26 20)"/>
        </g>
      </g>
    </svg>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function Home() {
  const router = useRouter();
  const [searchQuery, setSearchQuery]   = useState("");
  const [activeFilter, setActiveFilter] = useState("ทั้งหมด");

  const goSearch = () => {
    if (searchQuery.trim()) router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
  };

  return (
    <>
      <style>{`
        /* ═══════════════════════════════════════════════════════════════
           WHISKORA — PREMIUM DESIGN SYSTEM
        ═══════════════════════════════════════════════════════════════ */

        /* ── Keyframes ─────────────────────────────────────────────── */
        @keyframes wsk-float {
          0%, 100% { transform: translateY(0) rotate(-1deg); }
          50%       { transform: translateY(-16px) rotate(1deg); }
        }
        @keyframes wsk-pulse-ring {
          0%   { transform: scale(1); opacity: .6; }
          100% { transform: scale(1.9); opacity: 0; }
        }
        @keyframes wsk-shimmer {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes wsk-aurora {
          0%, 100% { opacity: .18; transform: translate(0, 0) scale(1); }
          33%       { opacity: .28; transform: translate(30px, -20px) scale(1.1); }
          66%       { opacity: .14; transform: translate(-20px, 10px) scale(.95); }
        }
        @keyframes wsk-fade-up {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes wsk-dot-drift {
          0%, 100% { transform: translateY(0); }
          50%       { transform: translateY(-8px); }
        }

        /* ── Responsive layout ─────────────────────────────────────── */
        .wsk-hero-grid {
          display: grid;
          grid-template-columns: minmax(0,1fr) 340px;
          gap: 20px;
          align-items: stretch;
        }
        .wsk-cats-grid  { display: grid; grid-template-columns: repeat(6,1fr); gap: 14px; }
        .wsk-farms-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 20px; margin-top: 20px; }
        .wsk-how-grid   { display: grid; grid-template-columns: repeat(3,1fr); gap: 20px; position: relative; }
        .wsk-ai-grid    { display: grid; grid-template-columns: auto 1fr auto; gap: 28px; align-items: center; }
        .wsk-partner-grid { display: grid; grid-template-columns: 1fr auto; gap: 32px; align-items: center; }

        @media (max-width: 1024px) {
          .wsk-farms-grid { grid-template-columns: repeat(2,1fr); }
        }
        @media (max-width: 900px) {
          .wsk-hero-grid    { grid-template-columns: 1fr; }
          .wsk-hero-inner   { flex-direction: column; text-align: center; padding: 40px 28px !important; }
          .wsk-hero-inner p { margin-left: auto; margin-right: auto; }
          .wsk-hero-mockup  { margin-top: 28px; }
          .wsk-cats-grid    { grid-template-columns: repeat(3,1fr); }
          .wsk-ai-grid      { grid-template-columns: auto 1fr; }
          .wsk-ai-btn       { grid-column: 1/-1; }
          .wsk-partner-grid { grid-template-columns: 1fr; }
        }
        @media (max-width: 640px) {
          .wsk-cats-grid    { grid-template-columns: repeat(2,1fr); }
          .wsk-farms-grid   { grid-template-columns: 1fr; }
          .wsk-how-grid     { grid-template-columns: 1fr; }
          .wsk-ai-grid      { grid-template-columns: 1fr; text-align: center; }
          .wsk-ai-icon      { margin: 0 auto; }
          .wsk-hero-inner   { align-items: center !important; }
          .wsk-hero-text    { display: flex; flex-direction: column; align-items: center; }
        }

        /* ── Hero Banner ───────────────────────────────────────────── */
        .wsk-hero-banner {
          background: linear-gradient(148deg, #8b1d3f 0%, #b82d54 22%, #e84677 55%, #f06d98 80%, #f8b8cb 100%);
          border-radius: 28px;
          padding: 44px 36px;
          color: #fff;
          position: relative;
          overflow: hidden;
          min-height: 320px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
          box-shadow: 0 24px 60px rgba(184,45,84,.22), 0 8px 20px rgba(184,45,84,.14);
        }
        /* Decorative circles */
        .wsk-hero-banner::before {
          content: '';
          position: absolute;
          top: -90px; right: -90px;
          width: 340px; height: 340px;
          background: radial-gradient(circle, rgba(255,255,255,.18) 0%, transparent 68%);
          pointer-events: none;
        }
        .wsk-hero-banner::after {
          content: '';
          position: absolute;
          bottom: -60px; left: -40px;
          width: 240px; height: 240px;
          background: radial-gradient(circle, rgba(255,255,255,.1) 0%, transparent 70%);
          pointer-events: none;
        }
        .wsk-decor-ring {
          position: absolute;
          border: 1.5px solid rgba(255,255,255,.15);
          border-radius: 50%;
          pointer-events: none;
        }
        .wsk-decor-dot {
          position: absolute;
          border-radius: 50%;
          background: rgba(255,255,255,.25);
          pointer-events: none;
        }

        /* ── Hero badge ────────────────────────────────────────────── */
        .wsk-hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(255,255,255,.16);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,.28);
          border-radius: 999px;
          padding: 5px 14px 5px 10px;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 1.4px;
          color: #fff;
          margin-bottom: 20px;
        }
        .wsk-hero-badge-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: #ffd4e0;
          flex-shrink: 0;
          position: relative;
        }
        .wsk-hero-badge-dot::after {
          content: '';
          position: absolute;
          inset: -3px;
          border-radius: 50%;
          border: 1.5px solid rgba(255,212,224,.5);
          animation: wsk-pulse-ring 1.8s ease-out infinite;
        }

        /* ── Hero title ────────────────────────────────────────────── */
        .wsk-hero-title {
          font-size: clamp(28px, 3.5vw, 40px);
          font-weight: 800;
          line-height: 1.1;
          letter-spacing: -1.5px;
          margin: 0 0 14px;
          color: #fff;
        }
        .wsk-hero-title-accent {
          color: #fce2ea;
        }
        .wsk-hero-body {
          font-size: 13.5px;
          line-height: 1.65;
          opacity: .88;
          margin: 0 0 28px;
          max-width: 380px;
        }

        /* ── Hero CTA button ───────────────────────────────────────── */
        .wsk-btn-hero {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #fff;
          color: #b82d54;
          padding: 14px 26px;
          border-radius: 999px;
          font-weight: 800;
          font-size: 14.5px;
          border: none;
          cursor: pointer;
          box-shadow: 0 8px 28px rgba(139,29,63,.35), 0 2px 8px rgba(139,29,63,.2);
          transition: transform .2s cubic-bezier(.34,1.56,.64,1), box-shadow .2s;
          font-family: inherit;
        }
        .wsk-btn-hero:hover {
          transform: translateY(-2px) scale(1.02);
          box-shadow: 0 14px 36px rgba(139,29,63,.4), 0 4px 12px rgba(139,29,63,.25);
        }

        /* ── Hero mockup card ──────────────────────────────────────── */
        .wsk-hero-mockup { animation: wsk-float 7s ease-in-out infinite; position: relative; z-index: 2; width: 210px; }
        .wsk-mockup-outer {
          background: rgba(255,255,255,.14);
          backdrop-filter: blur(16px);
          padding: 10px;
          border-radius: 24px;
          border: 1px solid rgba(255,255,255,.22);
          box-shadow: 0 24px 48px rgba(0,0,0,.14);
        }
        .wsk-mockup-inner {
          background: #fff;
          border-radius: 16px;
          padding: 16px;
          color: #1f1a1c;
        }

        /* ── My Pets panel ─────────────────────────────────────────── */
        .wsk-pets-panel {
          background: #fff;
          border: 1px solid #f3dde3;
          border-radius: 28px;
          padding: 24px;
          display: flex;
          flex-direction: column;
          box-shadow: 0 4px 20px rgba(31,26,28,.04), 0 1px 4px rgba(31,26,28,.03);
        }
        .wsk-pets-label {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 2.2px;
          color: #8e7e84;
          text-transform: uppercase;
          margin-bottom: 16px;
        }
        .wsk-pets-empty-icon {
          width: 64px; height: 64px;
          background: linear-gradient(135deg, #fde2ea, #ffe8f0);
          border-radius: 20px;
          display: grid;
          place-items: center;
          color: #e84677;
          margin-bottom: 14px;
          box-shadow: 0 4px 12px rgba(232,70,119,.12);
        }

        /* ── Search bar ────────────────────────────────────────────── */
        .wsk-search-wrap { padding: 24px 0 8px; }
        .wsk-search-bar {
          display: flex;
          align-items: center;
          gap: 12px;
          background: #fff;
          border: 1.5px solid #f3dde3;
          border-radius: 999px;
          padding: 7px 7px 7px 22px;
          box-shadow: 0 4px 20px rgba(31,26,28,.06), 0 1px 4px rgba(31,26,28,.03);
          transition: border-color .2s, box-shadow .2s;
        }
        .wsk-search-bar:focus-within {
          border-color: #e84677;
          box-shadow: 0 4px 24px rgba(232,70,119,.16), 0 1px 4px rgba(232,70,119,.08);
        }
        .wsk-search-bar input {
          flex: 1;
          border: none;
          outline: none;
          background: transparent;
          font-family: inherit;
          font-size: 14.5px;
          color: #1f1a1c;
          padding: 10px 0;
        }
        .wsk-search-bar input::placeholder { color: #b09ba2; }
        .wsk-popular-chips { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 14px; align-items: center; }
        .wsk-popular-chip {
          padding: 6px 15px;
          background: #fdf0f3;
          border-radius: 999px;
          font-size: 12px;
          color: #4a3f44;
          font-weight: 500;
          cursor: pointer;
          transition: background .15s, color .15s, transform .15s;
          border: 1px solid transparent;
        }
        .wsk-popular-chip:hover {
          background: #fde2ea;
          color: #c4325f;
          border-color: #f8c0d0;
          transform: translateY(-1px);
        }

        /* ── Section headers ───────────────────────────────────────── */
        .wsk-section-head {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          margin-bottom: 20px;
        }
        .wsk-section-title {
          font-size: 22px;
          font-weight: 700;
          letter-spacing: -0.5px;
          color: #1f1a1c;
          margin: 0;
          position: relative;
          display: inline-block;
        }
        .wsk-section-title::after {
          content: '';
          position: absolute;
          left: 0; bottom: -4px;
          width: 28px; height: 2.5px;
          background: #e84677;
          border-radius: 999px;
        }
        .wsk-see-all {
          font-size: 12.5px;
          color: #e84677;
          font-weight: 600;
          transition: color .15s, gap .15s;
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }
        .wsk-see-all:hover { color: #c4325f; gap: 8px; }

        /* ── Category tiles ────────────────────────────────────────── */
        .wsk-cat-tile {
          background: #fff;
          border: 1px solid rgba(243,221,227,.9);
          border-radius: 20px;
          padding: 20px 14px 18px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          transition: transform .2s cubic-bezier(.34,1.56,.64,1), box-shadow .2s, border-color .2s;
          cursor: pointer;
          text-decoration: none;
          box-shadow: 0 2px 10px rgba(31,26,28,.04);
        }
        .wsk-cat-tile:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 32px rgba(31,26,28,.09), 0 4px 8px rgba(31,26,28,.04);
          border-color: #e84677;
        }
        .wsk-cat-icon {
          width: 46px; height: 46px;
          border-radius: 14px;
          display: grid;
          place-items: center;
          margin-bottom: 11px;
          transition: transform .2s;
        }
        .wsk-cat-tile:hover .wsk-cat-icon { transform: scale(1.08); }
        .wsk-cat-label { font-size: 12.5px; font-weight: 600; color: #1f1a1c; line-height: 1.3; }

        /* ── Filter chips ──────────────────────────────────────────── */
        .wsk-filter-wrap { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 4px; scrollbar-width: none; }
        .wsk-filter-wrap::-webkit-scrollbar { display: none; }
        .wsk-fchip {
          padding: 8px 18px;
          background: #fff;
          color: #1f1a1c;
          border: 1.5px solid #f3dde3;
          border-radius: 999px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          white-space: nowrap;
          transition: all .18s;
          font-family: inherit;
        }
        .wsk-fchip:hover { border-color: #e84677; color: #e84677; }
        .wsk-fchip.wsk-fchip-active {
          background: #1f1a1c;
          color: #fff;
          border-color: #1f1a1c;
        }

        /* ── Farm cards ────────────────────────────────────────────── */
        .wsk-farm-card {
          background: #fff;
          border: 1px solid #f3dde3;
          border-radius: 22px;
          overflow: hidden;
          cursor: pointer;
          transition: transform .22s cubic-bezier(.34,1.56,.64,1), box-shadow .22s;
          box-shadow: 0 2px 12px rgba(31,26,28,.05);
        }
        .wsk-farm-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 20px 44px rgba(31,26,28,.10), 0 6px 12px rgba(31,26,28,.06);
        }
        .wsk-farm-photo {
          height: 176px;
          background: linear-gradient(155deg, #fce4ed 0%, #fdf0f3 45%, #ffe8f0 100%);
          display: grid;
          place-items: center;
          position: relative;
          overflow: hidden;
        }
        .wsk-farm-photo::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(to bottom, transparent 50%, rgba(253,240,243,.6) 100%);
        }
        .wsk-farm-photo-paw {
          opacity: .22;
          position: relative;
          z-index: 1;
        }
        .wsk-fav-btn {
          position: absolute;
          top: 13px; right: 13px;
          width: 34px; height: 34px;
          background: rgba(255,255,255,.95);
          backdrop-filter: blur(6px);
          border-radius: 999px;
          border: 1px solid rgba(243,221,227,.6);
          cursor: pointer;
          display: grid;
          place-items: center;
          color: #b09ba2;
          transition: color .15s, transform .15s;
          z-index: 2;
          box-shadow: 0 2px 8px rgba(31,26,28,.08);
        }
        .wsk-fav-btn:hover { color: #e84677; transform: scale(1.08); }
        .wsk-farm-body { padding: 16px 18px 18px; }
        .wsk-farm-name { font-weight: 700; font-size: 15px; color: #1f1a1c; }
        .wsk-farm-meta {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 12px;
          color: #8e7e84;
          margin-top: 4px;
        }
        .wsk-farm-rating {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 13px;
          font-weight: 700;
          color: #1f1a1c;
          background: #fffbf0;
          border: 1px solid #fde8b0;
          border-radius: 999px;
          padding: 3px 10px;
        }
        .wsk-farm-badges { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 13px; }
        .wsk-badge-verified {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 10px;
          border-radius: 999px;
          font-size: 10px;
          font-weight: 700;
          background: rgba(90,144,101,.12);
          color: #3d7048;
          border: 1px solid rgba(90,144,101,.2);
        }
        .wsk-badge-cert {
          padding: 4px 10px;
          border-radius: 999px;
          font-size: 10px;
          font-weight: 600;
          background: #fdf0f3;
          color: #4a3f44;
          border: 1px solid #f3dde3;
        }

        /* ── AI Band ────────────────────────────────────────────────── */
        .wsk-ai-band {
          border-radius: 28px;
          background: #1f1a1c;
          padding: 36px 40px;
          position: relative;
          overflow: hidden;
          box-shadow: 0 24px 56px rgba(31,26,28,.18), 0 8px 16px rgba(31,26,28,.12);
        }
        .wsk-ai-aurora {
          position: absolute;
          border-radius: 50%;
          pointer-events: none;
          animation: wsk-aurora 8s ease-in-out infinite;
        }
        .wsk-ai-icon-wrap {
          width: 68px; height: 68px;
          background: linear-gradient(135deg, #b82d54, #e84677);
          border-radius: 20px;
          display: grid;
          place-items: center;
          color: #fff;
          flex-shrink: 0;
          box-shadow: 0 8px 24px rgba(232,70,119,.35);
          position: relative;
          z-index: 1;
        }
        .wsk-ai-title {
          font-size: 20px;
          font-weight: 700;
          letter-spacing: -0.4px;
          color: #fff;
          margin: 0 0 6px;
        }
        .wsk-ai-sub { font-size: 13px; color: #b09ba2; line-height: 1.55; margin: 0; }
        .wsk-btn-ai {
          background: linear-gradient(135deg, #c4325f, #e84677);
          color: #fff;
          padding: 13px 26px;
          border-radius: 999px;
          font-weight: 700;
          font-size: 14px;
          border: none;
          cursor: pointer;
          box-shadow: 0 6px 20px rgba(232,70,119,.35);
          transition: transform .18s cubic-bezier(.34,1.56,.64,1), box-shadow .18s;
          white-space: nowrap;
          font-family: inherit;
          position: relative;
          z-index: 1;
        }
        .wsk-btn-ai:hover {
          transform: translateY(-2px) scale(1.03);
          box-shadow: 0 10px 28px rgba(232,70,119,.45);
        }

        /* ── How it works ───────────────────────────────────────────── */
        .wsk-how-line {
          position: absolute;
          top: 28px; left: calc(33.33% + 12px); right: calc(33.33% + 12px);
          height: 1px;
          border-top: 1.5px dashed #f3dde3;
          pointer-events: none;
        }
        @media (max-width: 640px) { .wsk-how-line { display: none; } }
        .wsk-how-card {
          background: #fff;
          border: 1px solid #f3dde3;
          border-radius: 24px;
          padding: 28px 24px;
          box-shadow: 0 2px 12px rgba(31,26,28,.04);
          transition: transform .2s, box-shadow .2s;
        }
        .wsk-how-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 12px 32px rgba(31,26,28,.08);
        }
        .wsk-step-num {
          width: 44px; height: 44px;
          background: linear-gradient(135deg, #b82d54, #e84677);
          color: #fff;
          border-radius: 14px;
          display: grid;
          place-items: center;
          font-weight: 900;
          font-size: 16px;
          margin-bottom: 18px;
          box-shadow: 0 6px 16px rgba(232,70,119,.28);
          letter-spacing: -0.5px;
        }
        .wsk-step-title { font-size: 16px; font-weight: 700; color: #1f1a1c; margin: 0 0 8px; }
        .wsk-step-desc  { font-size: 13px; color: #4a3f44; line-height: 1.65; margin: 0; }

        /* ── Testimonial ────────────────────────────────────────────── */
        .wsk-testimonial {
          background: #fff;
          border: 1px solid #f3dde3;
          border-radius: 28px;
          padding: 44px 48px;
          position: relative;
          overflow: hidden;
          box-shadow: 0 4px 20px rgba(31,26,28,.05);
        }
        .wsk-testimonial::before {
          content: '"';
          position: absolute;
          top: -10px; left: 36px;
          font-size: 140px;
          font-weight: 900;
          color: #fde2ea;
          line-height: 1;
          font-family: Georgia, serif;
          pointer-events: none;
          user-select: none;
        }
        .wsk-testimonial-text {
          font-size: 20px;
          line-height: 1.6;
          color: #1f1a1c;
          font-weight: 500;
          letter-spacing: -0.2px;
          margin: 0 0 24px;
          position: relative;
          z-index: 1;
        }
        .wsk-testimonial-author {
          display: flex;
          align-items: center;
          gap: 14px;
          position: relative;
          z-index: 1;
        }
        .wsk-testimonial-avatar {
          width: 48px; height: 48px;
          background: linear-gradient(135deg, #fde2ea, #f8c0d0);
          border-radius: 999px;
          display: grid;
          place-items: center;
          font-weight: 800;
          color: #c4325f;
          font-size: 17px;
          border: 2px solid #f8c0d0;
          flex-shrink: 0;
        }

        /* ── Partner CTA ─────────────────────────────────────────────── */
        .wsk-partner-cta {
          border-radius: 28px;
          background: #1f1a1c;
          padding: 44px 48px;
          position: relative;
          overflow: hidden;
          box-shadow: 0 28px 64px rgba(31,26,28,.20), 0 8px 20px rgba(31,26,28,.12);
        }
        .wsk-partner-aurora-1 {
          position: absolute;
          right: -60px; bottom: -60px;
          width: 320px; height: 320px;
          background: radial-gradient(circle, rgba(232,70,119,.28) 0%, transparent 65%);
          pointer-events: none;
          animation: wsk-aurora 9s ease-in-out infinite;
        }
        .wsk-partner-aurora-2 {
          position: absolute;
          left: -40px; top: -40px;
          width: 200px; height: 200px;
          background: radial-gradient(circle, rgba(184,45,84,.16) 0%, transparent 65%);
          pointer-events: none;
          animation: wsk-aurora 11s ease-in-out infinite reverse;
        }
        .wsk-partner-eyebrow {
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 2.5px;
          color: #e84677;
          text-transform: uppercase;
          margin-bottom: 12px;
        }
        .wsk-partner-title {
          font-size: 28px;
          font-weight: 800;
          letter-spacing: -0.6px;
          color: #fff;
          margin: 0 0 8px;
        }
        .wsk-partner-sub { font-size: 13px; color: #7a6d72; margin: 0; line-height: 1.6; }
        .wsk-btn-partner {
          background: linear-gradient(135deg, #c4325f, #e84677);
          color: #fff;
          padding: 16px 30px;
          border-radius: 999px;
          font-weight: 800;
          font-size: 15px;
          border: none;
          cursor: pointer;
          box-shadow: 0 8px 28px rgba(232,70,119,.4);
          transition: transform .18s cubic-bezier(.34,1.56,.64,1), box-shadow .18s;
          white-space: nowrap;
          font-family: inherit;
          position: relative;
          z-index: 2;
        }
        .wsk-btn-partner:hover {
          transform: translateY(-2px) scale(1.03);
          box-shadow: 0 14px 36px rgba(232,70,119,.5);
        }

        /* ── Shared buttons ──────────────────────────────────────────── */
        .wsk-btn-pink {
          background: #e84677;
          color: #fff;
          padding: 11px 22px;
          border-radius: 999px;
          font-weight: 700;
          font-size: 13.5px;
          border: none;
          cursor: pointer;
          box-shadow: 0 4px 16px rgba(232,70,119,.25);
          transition: background .15s, transform .18s cubic-bezier(.34,1.56,.64,1), box-shadow .15s;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-family: inherit;
        }
        .wsk-btn-pink:hover {
          background: #c4325f;
          transform: translateY(-1px);
          box-shadow: 0 8px 24px rgba(232,70,119,.35);
        }

        /* ── Search button ───────────────────────────────────────────── */
        .wsk-btn-search {
          background: linear-gradient(135deg, #c4325f, #e84677);
          color: #fff;
          padding: 11px 22px;
          border-radius: 999px;
          font-weight: 700;
          font-size: 14px;
          border: none;
          cursor: pointer;
          flex-shrink: 0;
          box-shadow: 0 4px 14px rgba(232,70,119,.28);
          transition: transform .18s cubic-bezier(.34,1.56,.64,1), box-shadow .15s;
          font-family: inherit;
        }
        .wsk-btn-search:hover {
          transform: translateY(-1px) scale(1.02);
          box-shadow: 0 6px 20px rgba(232,70,119,.38);
        }
      `}</style>

      <div style={{ color: F.ink, fontFamily: 'var(--font-ui)', paddingBottom: 0 }}>

        {/* ── HERO ─────────────────────────────────────────────────────────── */}
        <section style={{ padding: '28px 0 8px' }}>
          <div className="wsk-hero-grid">

            {/* Left: Gradient banner */}
            <div className="wsk-hero-banner">
              {/* Decorative rings */}
              <div className="wsk-decor-ring" style={{ width: 260, height: 260, top: -60, right: 80, opacity: .12 }} />
              <div className="wsk-decor-ring" style={{ width: 140, height: 140, bottom: 20, right: 200, opacity: .1 }} />
              <div className="wsk-decor-dot"  style={{ width: 6, height: 6, top: 44, right: 180 }} />
              <div className="wsk-decor-dot"  style={{ width: 4, height: 4, top: 80, right: 220, opacity: .6 }} />
              <div className="wsk-decor-dot"  style={{ width: 5, height: 5, bottom: 52, right: 180, opacity: .7 }} />

              <div className="wsk-hero-text" style={{ position: 'relative', zIndex: 2, flex: 1 }}>
                <div className="wsk-hero-badge">
                  <span className="wsk-hero-badge-dot" />
                  NEW FEATURE
                </div>

                <h1 className="wsk-hero-title">
                  สร้างบัตรประจำตัว<br />
                  <span className="wsk-hero-title-accent">ให้น้องๆ สุดคิวท์ 🪪</span>
                </h1>
                <p className="wsk-hero-body">
                  อวดความน่ารักของลูกๆ ด้วยบัตร Pet ID Card ระดับ Collector's Edition พร้อมเก็บประวัติสุขภาพไว้ในที่เดียว
                </p>
                <button className="wsk-btn-hero" onClick={() => router.push('/profile/pets')}>
                  <span style={{ fontSize: 19 }}>🐾</span>
                  เริ่มสร้างบัตรฟรี
                </button>
              </div>

              {/* Floating ID card mockup */}
              <div className="wsk-hero-mockup">
                <div className="wsk-mockup-outer">
                  <div className="wsk-mockup-inner">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <div style={{ width: 20, height: 20 }}>
                          <img src="/mini-logo.png" alt="Logo"
                            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                            onError={(e) => e.currentTarget.style.display = 'none'}
                          />
                        </div>
                        <span style={{ fontSize: 9, fontWeight: 900, color: F.pink, letterSpacing: .8 }}>WHISKORA</span>
                      </div>
                      <span style={{ fontSize: 8, fontWeight: 700, color: '#d1d5db', letterSpacing: 1 }}>ID CARD</span>
                    </div>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <div style={{
                        width: 50, height: 64, borderRadius: 8,
                        background: 'linear-gradient(135deg, #fde2ea, #fdf0f3)',
                        display: 'grid', placeItems: 'center', flexShrink: 0,
                      }}>
                        <PawMark size={24} />
                      </div>
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 7, justifyContent: 'center' }}>
                        <div style={{ height: 8, width: 68, background: '#f3dde3', borderRadius: 4 }} />
                        <div style={{ height: 5, width: '100%', background: '#f3f4f6', borderRadius: 4 }} />
                        <div style={{ height: 5, width: 44, background: '#f3f4f6', borderRadius: 4 }} />
                        <div style={{ height: 5, width: 56, background: '#f3f4f6', borderRadius: 4 }} />
                      </div>
                    </div>
                    <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px dashed #f3dde3', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {[...Array(3)].map((_, i) => (
                          <div key={i} style={{ width: 5, height: 5, borderRadius: 1, background: '#fde2ea' }} />
                        ))}
                      </div>
                      <div style={{ width: 32, height: 5, background: '#fde2ea', borderRadius: 999 }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: My Pets panel */}
            <div className="wsk-pets-panel">
              <div className="wsk-pets-label">น้อง ๆ ของฉัน</div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '12px 0 8px' }}>
                <div className="wsk-pets-empty-icon">
                  <Icon.Pet />
                </div>
                <strong style={{ fontSize: 14.5, color: F.ink, display: 'block' }}>ยังไม่มีสัตว์เลี้ยง</strong>
                <span style={{ fontSize: 12.5, color: F.muted, marginTop: 5, marginBottom: 22, display: 'block', lineHeight: 1.5 }}>
                  เพิ่มน้องเพื่อเริ่มต้น<br />ติดตามสุขภาพและสร้าง ID Card
                </span>
                <button className="wsk-btn-pink" onClick={() => router.push('/pets/create')}>
                  + เพิ่มน้องเลย
                </button>
              </div>

              {/* Quick stats row */}
              <div style={{ borderTop: `1px solid ${F.line}`, paddingTop: 18, marginTop: 8, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {[
                  { label: 'ฟาร์มใกล้ฉัน', value: '12+' },
                  { label: 'คลินิก', value: '8+' },
                ].map(s => (
                  <div key={s.label} style={{ textAlign: 'center', background: F.paper, borderRadius: 14, padding: '12px 8px' }}>
                    <div style={{ fontSize: 20, fontWeight: 800, color: F.pink, letterSpacing: -1 }}>{s.value}</div>
                    <div style={{ fontSize: 11, color: F.muted, marginTop: 2, fontWeight: 500 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── SEARCH ───────────────────────────────────────────────────────── */}
        <section className="wsk-search-wrap">
          <div className="wsk-search-bar">
            <span style={{ color: F.muted, display: 'flex', flexShrink: 0 }}><Icon.Search /></span>
            <input
              type="text"
              placeholder="ค้นหาฟาร์ม สายพันธุ์ หรือบริการ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') goSearch(); }}
            />
            <button className="wsk-btn-search" onClick={goSearch}>ค้นหา</button>
          </div>

          <div className="wsk-popular-chips">
            <span style={{ fontSize: 11.5, color: F.muted, fontWeight: 600, letterSpacing: .5 }}>ยอดฮิต</span>
            {CHIPS.map(chip => (
              <span
                key={chip}
                className="wsk-popular-chip"
                onClick={() => router.push(`/search?q=${encodeURIComponent(chip)}`)}
              >
                {chip}
              </span>
            ))}
          </div>
        </section>

        {/* ── CATEGORIES ───────────────────────────────────────────────────── */}
        <section style={{ marginTop: 32 }}>
          <div className="wsk-section-head">
            <h2 className="wsk-section-title">หมวดหมู่</h2>
          </div>
          <div className="wsk-cats-grid">
            {[
              { href: '/farm-hub?pet=dog',              icon: <Icon.Dog />,       bg: F.pinkSoft,  color: F.pink,  label: 'สุนัข' },
              { href: '/farm-hub?pet=cat',              icon: <Icon.Cat />,       bg: F.pinkSoft,  color: F.pink,  label: 'แมว' },
              { href: '/service-hub?category=คลินิก',  icon: <Icon.Clinic />,    bg: '#dbeafe',   color: F.sky,   label: 'คลินิก' },
              { href: '/service-hub?category=กรูมมิ่ง', icon: <Icon.Scissors />, bg: '#dcfce7',   color: F.leaf,  label: 'กรูมมิ่ง' },
              { href: '/community',                     icon: <Icon.Community />, bg: '#fef9c3',   color: F.sun,   label: 'คอมมูนิตี้' },
              { href: '/profile/pets',                  icon: <Icon.IdCard />,    bg: F.pinkSoft,  color: F.pink,  label: 'Pet ID Card' },
            ].map(cat => (
              <Link key={cat.href} href={cat.href} className="wsk-cat-tile">
                <div className="wsk-cat-icon" style={{ background: cat.bg, color: cat.color }}>
                  {cat.icon}
                </div>
                <div className="wsk-cat-label">{cat.label}</div>
              </Link>
            ))}
          </div>
        </section>

        {/* ── FARM FEED ────────────────────────────────────────────────────── */}
        <section style={{ marginTop: 44 }}>
          <div className="wsk-section-head">
            <h2 className="wsk-section-title">ฟาร์มแนะนำ</h2>
            <Link href="/farm-hub" className="wsk-see-all">ดูทั้งหมด →</Link>
          </div>

          <div className="wsk-filter-wrap">
            {FILTERS.map(f => (
              <button
                key={f}
                className={`wsk-fchip${activeFilter === f ? ' wsk-fchip-active' : ''}`}
                onClick={() => setActiveFilter(f)}
              >
                {f}
              </button>
            ))}
          </div>

          <div className="wsk-farms-grid">
            {FARMS.map(farm => (
              <div key={farm.id} className="wsk-farm-card" onClick={() => router.push(`/farm/${farm.id}`)}>
                <div className="wsk-farm-photo">
                  <div className="wsk-farm-photo-paw">
                    <PawMark size={72} opacity={1} />
                  </div>
                  <button className="wsk-fav-btn" onClick={(e) => e.stopPropagation()} aria-label="บันทึก">
                    <Icon.Heart />
                  </button>
                </div>

                <div className="wsk-farm-body">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                    <div style={{ minWidth: 0 }}>
                      <div className="wsk-farm-name">{farm.name}</div>
                      <div className="wsk-farm-meta">
                        <Icon.MapPin />
                        {farm.loc} · {farm.breed}
                      </div>
                    </div>
                    <div className="wsk-farm-rating" style={{ flexShrink: 0 }}>
                      <span style={{ color: F.sun }}>★</span> {farm.rating}
                    </div>
                  </div>

                  <div className="wsk-farm-badges">
                    <span className="wsk-badge-verified">✓ ยืนยันแล้ว</span>
                    {farm.certs.map(c => (
                      <span key={c} className="wsk-badge-cert">{c}</span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── AI BAND ──────────────────────────────────────────────────────── */}
        <div className="wsk-ai-band wsk-ai-grid" style={{ marginTop: 44 }}>
          {/* Animated aurora blobs */}
          <div className="wsk-ai-aurora" style={{ width: 300, height: 300, right: -60, bottom: -80, background: 'radial-gradient(circle, rgba(232,70,119,.22) 0%, transparent 65%)' }} />
          <div className="wsk-ai-aurora" style={{ width: 180, height: 180, left: 120, top: -60, background: 'radial-gradient(circle, rgba(184,45,84,.16) 0%, transparent 65%)', animationDelay: '-3s' }} />

          <div className="wsk-ai-icon-wrap wsk-ai-icon">
            <Icon.Brain />
          </div>

          <div style={{ position: 'relative', zIndex: 1 }}>
            <p className="wsk-ai-title">AI ช่วยวิเคราะห์อาการเบื้องต้น</p>
            <p className="wsk-ai-sub">บอกอาการน้อง รับคำแนะนำก่อนพาไปหาหมอ — ใช้ฟรีทุกวัน</p>
          </div>

          <button className="wsk-btn-ai wsk-ai-btn" onClick={() => router.push('/service-hub')}>
            ลองเลย →
          </button>
        </div>

        {/* ── HOW IT WORKS ─────────────────────────────────────────────────── */}
        <section style={{ marginTop: 48 }}>
          <h2 className="wsk-section-title" style={{ marginBottom: 28, display: 'inline-block' }}>เริ่มต้นง่ายมาก</h2>
          <div className="wsk-how-grid">
            <div className="wsk-how-line" />
            {[
              { n: '01', title: 'สมัครฟรี',         desc: 'สร้างบัญชีด้วยอีเมลหรือ Google ภายใน 1 นาที ไม่ต้องบัตรเครดิต' },
              { n: '02', title: 'เพิ่มน้องของคุณ',   desc: 'เพิ่มข้อมูลสัตว์เลี้ยง รูปภาพ วัคซีน และประวัติสุขภาพ' },
              { n: '03', title: 'ค้นหาและเชื่อมต่อ', desc: 'ค้นหาฟาร์ม คลินิก หรือบริการที่ต้องการ พร้อม GPS ใกล้ฉัน' },
            ].map(step => (
              <div key={step.n} className="wsk-how-card">
                <div className="wsk-step-num">{step.n}</div>
                <h3 className="wsk-step-title">{step.title}</h3>
                <p className="wsk-step-desc">{step.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── TESTIMONIAL ──────────────────────────────────────────────────── */}
        <section style={{ marginTop: 40 }}>
          <div className="wsk-testimonial">
            <p className="wsk-testimonial-text">
              Whiskora ช่วยให้ผมจัดการฟาร์มได้ง่ายขึ้นมาก ลูกค้าใหม่มาจากแพลตฟอร์มนี้เพิ่มขึ้นทุกเดือน
            </p>
            <div className="wsk-testimonial-author">
              <div className="wsk-testimonial-avatar">ส</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: F.ink }}>คุณสมชาย</div>
                <div style={{ fontSize: 12, color: F.muted, marginTop: 2 }}>เจ้าของฟาร์มโกลเด้น · กรุงเทพฯ</div>
              </div>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 2 }}>
                {[...Array(5)].map((_, i) => (
                  <span key={i} style={{ color: F.sun, fontSize: 14 }}>★</span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── PARTNER CTA ──────────────────────────────────────────────────── */}
        <section style={{ margin: '40px 0 64px' }}>
          <div className="wsk-partner-cta">
            <div className="wsk-partner-aurora-1" />
            <div className="wsk-partner-aurora-2" />
            <div className="wsk-partner-grid">
              <div style={{ position: 'relative', zIndex: 2 }}>
                <div className="wsk-partner-eyebrow">Partner with us</div>
                <h2 className="wsk-partner-title">ร่วมเป็นพาร์ทเนอร์<br />กับ Whiskora</h2>
                <p className="wsk-partner-sub">เปิดฟาร์ม ร้านค้า หรือคลินิกของคุณ — เข้าถึงลูกค้าหมื่นคน</p>
              </div>
              <button className="wsk-btn-partner" onClick={() => router.push('/partner')}>
                สมัครเลยฟรี →
              </button>
            </div>
          </div>
        </section>

      </div>
    </>
  );
}
