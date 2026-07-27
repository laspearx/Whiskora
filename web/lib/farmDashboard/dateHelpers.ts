// Shared date helpers for farm-dashboard task/timeline derivation — ported from the
// inline versions that used to live only in farm-dashboard/[id]/page.tsx.

export const fmtDate = (d?: string | null, short = false) => {
  if (!d) return '';
  return new Date(d).toLocaleDateString('th-TH', short
    ? { day: 'numeric', month: 'short' }
    : { day: 'numeric', month: 'short', year: 'numeric' });
};

export const daysDiff = (dateStr: string) => {
  const d = new Date(dateStr); d.setHours(0, 0, 0, 0);
  const t = new Date();        t.setHours(0, 0, 0, 0);
  return Math.ceil((d.getTime() - t.getTime()) / 86400000);
};
