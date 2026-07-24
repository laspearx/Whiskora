"use client";

import { useEffect, useState } from "react";
import { detectMobileOS } from "@/lib/inAppBrowser";

interface BrowserCheckerProps {
  open: boolean;
  onDismiss?: () => void;
}

// Warning เฉพาะจุด: แสดงเมื่อผู้ใช้กด "เข้าสู่ระบบด้วย Google" ขณะเปิดเว็บผ่านเว็บวิวของแอปแชท
// (ไม่บล็อกทั้งเว็บแบบก่อนหน้านี้ — เพราะ LINE Login / อีเมล ใช้งานได้ปกติในเว็บวิวเหล่านี้)
export default function BrowserChecker({ open, onDismiss }: BrowserCheckerProps) {
  const [os, setOs] = useState<'ios' | 'android' | 'other'>('other');
  const [currentUrl, setCurrentUrl] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) return;
    setOs(detectMobileOS());
    if (typeof window !== "undefined") setCurrentUrl(window.location.href);
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  // Android: เด้งออกไปเปิด Chrome จริงด้วย intent://
  const openInChromeAndroid = () => {
    if (typeof window === "undefined") return;
    const url = window.location.href.replace(/^https?:\/\//, "");
    window.location.href = `intent://${url}#Intent;scheme=https;package=com.android.chrome;end`;
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = currentUrl;
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy"); setCopied(true); setTimeout(() => setCopied(false), 2500); } catch {}
      document.body.removeChild(ta);
    }
  };

  if (!open) return null;

  return (
    <div style={S.overlay}>
      <div style={S.card}>
        {onDismiss && (
          <button style={S.closeBtn} onClick={onDismiss} aria-label="ปิด">✕</button>
        )}

        <div style={S.logoWrap}>
          <span style={S.logoText}>whiskora</span>
        </div>

        <div style={S.iconCircle}>
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#E84677" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        </div>

        <h1 style={S.title}>กรุณาเปิดด้วยเบราว์เซอร์</h1>
        <p style={S.sub}>
          ตอนนี้คุณกำลังเปิดผ่านแอปแชท (Facebook / Instagram ฯลฯ)
          ซึ่ง<b style={{ color: '#E84677' }}>เข้าสู่ระบบด้วย Google ไม่ได้</b>
          {' '}กรุณาเปิดด้วยเบราว์เซอร์ปกติ (Chrome / Safari) ก่อน หรือเลือกเข้าสู่ระบบด้วย LINE / อีเมลแทนได้เลย
        </p>

        {os === 'android' && (
          <button style={{ ...S.btn, ...S.btnPrimary }} onClick={openInChromeAndroid}>
            🌐 เปิดด้วย Chrome เลย
          </button>
        )}

        {os === 'ios' && (
          <div style={S.steps}>
            <div style={S.stepTitle}>วิธีเปิดด้วย Safari:</div>
            <div style={S.step}><span style={S.stepNum}>1</span> กดปุ่ม <b>"•••"</b> หรือ <b>"ลูกศร"</b> มุมขวาล่าง/บน</div>
            <div style={S.step}><span style={S.stepNum}>2</span> เลือก <b>"เปิดในเบราว์เซอร์"</b> หรือ <b>"Open in Safari"</b></div>
            <div style={S.step}><span style={S.stepNum}>3</span> เริ่มใช้งาน Whiskora ได้เลย 🐾</div>
          </div>
        )}

        {os === 'other' && (
          <div style={S.steps}>
            <div style={S.step}>กดเมนู <b>"•••"</b> ของแอป แล้วเลือก <b>"เปิดในเบราว์เซอร์"</b></div>
          </div>
        )}

        <button style={{ ...S.btn, ...S.btnGhost }} onClick={copyLink}>
          {copied ? '✅ คัดลอกลิงก์แล้ว — ไปวางในเบราว์เซอร์' : '📋 คัดลอกลิงก์เว็บ'}
        </button>

        {onDismiss && (
          <button style={{ ...S.btn, ...S.btnText }} onClick={onDismiss}>
            เลือกวิธีเข้าสู่ระบบอื่นแทน (LINE / อีเมล)
          </button>
        )}

        <p style={S.foot}>เพื่อความปลอดภัยในการเข้าสู่ระบบ Google Whiskora รองรับเฉพาะเบราว์เซอร์มาตรฐานเท่านั้น</p>
      </div>
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed', inset: 0, zIndex: 99999,
    background: 'linear-gradient(160deg, #E84677 0%, #F472B6 100%)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '24px', fontFamily: "'Prompt', sans-serif",
    overflowY: 'auto',
  },
  card: {
    position: 'relative', background: 'white', borderRadius: '28px', padding: '32px 26px',
    maxWidth: '380px', width: '100%', textAlign: 'center',
    boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
  },
  closeBtn: {
    position: 'absolute', top: '14px', right: '14px', width: '30px', height: '30px',
    borderRadius: '50%', border: 'none', background: '#F3F4F6', color: '#6B7280',
    fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  logoWrap: { marginBottom: '20px' },
  logoText: { fontFamily: "'Prompt', sans-serif", fontSize: '24px', fontWeight: 700, color: '#E84677', letterSpacing: '-0.5px' },
  iconCircle: {
    width: '72px', height: '72px', borderRadius: '50%', background: '#FDF2F5',
    display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px',
  },
  title: { fontFamily: "'Prompt', sans-serif", fontSize: '22px', fontWeight: 700, color: '#111827', marginBottom: '10px' },
  sub: { fontSize: '14px', color: '#4B5563', lineHeight: 1.65, marginBottom: '22px' },
  btn: {
    width: '100%', padding: '15px', borderRadius: '16px', fontSize: '15px', fontWeight: 700,
    border: 'none', cursor: 'pointer', fontFamily: 'inherit', marginTop: '10px',
    transition: 'all .15s',
  },
  btnPrimary: { background: '#E84677', color: 'white', boxShadow: '0 4px 14px rgba(232,70,119,0.35)' },
  btnGhost: { background: '#FDF2F5', color: '#E84677', border: '1px solid #FBCFE8' },
  btnText: { background: 'transparent', color: '#9CA3AF', fontWeight: 600, fontSize: '13px', boxShadow: 'none', marginTop: '4px' },
  steps: { textAlign: 'left', background: '#FAFAFA', borderRadius: '16px', padding: '16px 18px', margin: '4px 0 6px' },
  stepTitle: { fontSize: '13px', fontWeight: 700, color: '#111827', marginBottom: '10px' },
  step: { fontSize: '13px', color: '#4B5563', lineHeight: 1.7, display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '6px' },
  stepNum: {
    flexShrink: 0, width: '20px', height: '20px', borderRadius: '50%', background: '#E84677', color: 'white',
    fontSize: '11px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginTop: '1px',
  },
  foot: { fontSize: '11px', color: '#9CA3AF', marginTop: '18px', lineHeight: 1.5 },
};
