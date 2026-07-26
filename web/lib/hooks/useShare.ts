"use client";

import { useCallback, useState } from 'react';

/**
 * Extracted from the pattern duplicated across web/app/farm/[id], shops/[id],
 * services/[id], pets/[id], and pets/[id]/id-card: Web Share API when
 * available, clipboard copy + toast fallback otherwise.
 */
export function useShare() {
  const [copied, setCopied] = useState(false);

  const share = useCallback(async (opts: { title: string; text?: string; url: string }) => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share(opts);
        return true;
      } catch {
        // user cancelled the native share sheet — not an error
        return false;
      }
    }
    try {
      await navigator.clipboard.writeText(opts.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      return true;
    } catch {
      return false;
    }
  }, []);

  return { share, copied };
}
