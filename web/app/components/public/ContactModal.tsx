"use client";

import { F } from '@/lib/publicProfile/tokens';
import { safeExternalUrl, safeTelHref } from '@/lib/publicProfile/safeUrl';

export type ContactChannel = 'phone' | 'line' | 'facebook';

/**
 * Extracted from /p/[id]'s inline contact modal so /farm/[id] can mount the
 * same LINE/Facebook/phone picker (it previously only had a bare tel: link).
 * The modal owns channel-selection UI + opening the link; the caller owns
 * what "log this lead" means for its page (pet_id vs farm-only).
 */
export default function ContactModal({
  open,
  onClose,
  title,
  subtitle,
  phone,
  lineId,
  facebookLink,
  onChannelClick,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle: string;
  phone?: string | null;
  lineId?: string | null;
  facebookLink?: string | null;
  onChannelClick: (channel: ContactChannel, url: string) => void;
}) {
  if (!open) return null;

  const safeFacebookLink = safeExternalUrl(facebookLink);
  const telHref = safeTelHref(phone);

  const go = (channel: ContactChannel, url: string) => {
    onChannelClick(channel, url);
    onClose();
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)', padding: 16 }}
      onClick={onClose}
    >
      <div
        style={{ background: 'white', width: '100%', maxWidth: 420, borderRadius: 24, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.25)', padding: 24 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ fontSize: 18, fontWeight: 700, color: F.ink, textAlign: 'center' }}>{title}</div>
        <div style={{ fontSize: 12, color: F.muted, textAlign: 'center', marginTop: 2, marginBottom: 18 }}>{subtitle}</div>

        {telHref && (
          <button
            onClick={() => go('phone', telHref)}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderRadius: 16, border: 'none', fontSize: 14, fontWeight: 700, cursor: 'pointer', marginBottom: 10, background: '#EFF6FF', color: '#2563EB' }}
          >
            <img src="/icons/icon-phone.png" alt="" style={{ width: 22, height: 22, objectFit: 'contain' }} />
            <span>โทรหา <span style={{ opacity: 0.7, fontWeight: 500 }}>{phone}</span></span>
          </button>
        )}
        {lineId && (
          <button
            onClick={() => go('line', `https://line.me/ti/p/~${lineId}`)}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderRadius: 16, border: 'none', fontSize: 14, fontWeight: 700, cursor: 'pointer', marginBottom: 10, background: '#F0FDF4', color: '#16A34A' }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
            <span>แชทผ่าน LINE</span>
          </button>
        )}
        {safeFacebookLink && (
          <button
            onClick={() => go('facebook', safeFacebookLink)}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderRadius: 16, border: 'none', fontSize: 14, fontWeight: 700, cursor: 'pointer', marginBottom: 10, background: '#EEF2FF', color: '#4F46E5' }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" /></svg>
            <span>ติดต่อผ่าน Facebook</span>
          </button>
        )}
        <button onClick={onClose} style={{ width: '100%', padding: 12, color: F.muted, fontWeight: 700, fontSize: 14, background: 'none', border: 'none', cursor: 'pointer' }}>ปิด</button>
      </div>
    </div>
  );
}
