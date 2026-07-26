import { F } from '@/lib/publicProfile/tokens';

const CopyByLocale: Record<'th' | 'en', { label: string; tooltip: string }> = {
  th: { label: 'ยืนยันตัวตนแล้ว', tooltip: 'Whiskora ตรวจสอบตัวตนและเอกสารของฟาร์มนี้แล้ว ไม่ได้รับรองคุณภาพการเพาะพันธุ์หรือสุขภาพสัตว์' },
  en: { label: 'Verified', tooltip: "Whiskora has verified this farm's identity and documents — this doesn't certify breeding quality or animal health." },
};

/**
 * One source of truth for the "verified" indicator — replaces two divergent
 * inline implementations (farm page read farms.is_verified correctly; the
 * pet page's footer incorrectly showed "verified" for any farm-owned pet).
 * Only ever render this when the caller has confirmed `farms.is_verified`.
 */
export default function VerifiedBadge({
  locale = 'th',
  size = 'md',
}: {
  locale?: 'th' | 'en';
  size?: 'sm' | 'md';
}) {
  const copy = CopyByLocale[locale];
  const fontSize = size === 'sm' ? 11 : 12;
  return (
    <span
      title={copy.tooltip}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        fontSize, fontWeight: 700, color: F.pink,
      }}
    >
      <svg width={size === 'sm' ? 12 : 14} height={size === 'sm' ? 12 : 14} viewBox="0 0 24 24" fill={F.pink}>
        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      {copy.label}
    </span>
  );
}
