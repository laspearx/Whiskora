// ─── URL sanitization for externally-linked contact channels ─────────────────
// Farm-entered phone/LINE/Facebook/website values are free text; only allow
// protocols we actually intend to open so a stored `javascript:` or `data:`
// value can never execute.

const ALLOWED_PROTOCOLS = new Set(['http:', 'https:', 'tel:']);

/** Strips anything that isn't a digit/+/-/space/paren before building a tel: href. */
export function safeTelHref(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const cleaned = raw.replace(/[^0-9+\-() ]/g, '').trim();
  return cleaned ? `tel:${cleaned}` : null;
}

export function safeExternalUrl(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  try {
    const url = new URL(trimmed, 'https://placeholder.invalid');
    if (!ALLOWED_PROTOCOLS.has(url.protocol)) return null;
    return trimmed;
  } catch {
    return null;
  }
}
