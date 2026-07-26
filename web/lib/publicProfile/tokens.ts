// ─── Shared design tokens for public-profile components ──────────────────────
// Both /p/[id] and /farm/[id] already define near-identical copies of this
// object inline; components shared between the two pages import this instead
// of re-declaring it a third time.

export const F = {
  ink: '#1f1a1c',
  inkSoft: '#4a3f44',
  muted: '#8e7e84',
  pink: '#e84677',
  pinkLight: '#f472b6',
  pinkSoft: '#fde2ea',
  pinkBorder: '#FBCFE8',
  teal: '#0D9488',
  tealSoft: '#F0FDFA',
  line: '#f3dde3',
  lineMid: '#E5E7EB',
  paper: '#FFFFFF',
  bg: '#fffafc',
} as const;

export const TONE_COLORS: Record<'success' | 'warning' | 'neutral' | 'muted', { bg: string; fg: string; border: string }> = {
  success: { bg: '#D1FAE5', fg: '#065F46', border: '#A7F3D0' },
  warning: { bg: '#FEF3C7', fg: '#92400E', border: '#FDE68A' },
  neutral: { bg: '#EFF6FF', fg: '#2563EB', border: '#BFDBFE' },
  muted: { bg: '#F3F4F6', fg: '#6B7280', border: '#E5E7EB' },
};
