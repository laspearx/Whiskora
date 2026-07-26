import { TONE_COLORS } from '@/lib/publicProfile/tokens';
import { getStatusLabel, type Locale } from '@/lib/publicProfile/statusLabels';

export default function StatusPill({
  status,
  isFarmPet,
  locale,
}: {
  status: string | null | undefined;
  isFarmPet: boolean;
  locale: Locale;
}) {
  const label = getStatusLabel(status, isFarmPet);
  const colors = TONE_COLORS[label.tone];
  return (
    <span
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700,
        background: colors.bg, color: colors.fg, border: `1px solid ${colors.border}`,
      }}
    >
      ● {label[locale]}
    </span>
  );
}
