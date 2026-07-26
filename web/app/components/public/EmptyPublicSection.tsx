import { F } from '@/lib/publicProfile/tokens';

/**
 * A section with no content should just not exist for public visitors (no
 * "no data" cards littering the page). The one exception: the pet/farm's own
 * owner, viewing their own public page, benefits from a short nudge to fill
 * it in — so this renders nothing unless `isOwner` is true.
 */
export default function EmptyPublicSection({
  isOwner,
  hint,
}: {
  isOwner: boolean;
  hint: string;
}) {
  if (!isOwner) return null;
  return (
    <div style={{ textAlign: 'center', padding: '18px 12px', color: F.muted, fontSize: 12, background: '#FAFAFA', borderRadius: 12, border: `1px dashed ${F.lineMid}` }}>
      {hint}
    </div>
  );
}
