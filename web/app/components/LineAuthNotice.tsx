"use client";

import { useLocale } from '@/i18n/context';
import { lineErrorText, lineTexts } from '@/lib/lineAuthMessages';

// Sign-in error / notice for ?auth_error=… — fixed texts only (never the raw query value).
export default function LineAuthNotice({ code, refCode, redirect }: { code: string; refCode?: string | null; redirect: string }) {
  const locale = useLocale();
  const t = lineTexts(locale);
  const safeRef = refCode && /^[0-9a-f]{8}$/.test(refCode) ? refCode : null;

  if (code === 'LINE_ACCOUNT_REVIEW') {
    return (
      <div data-testid="line-review" className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 space-y-2">
        <p className="font-bold">{t.reviewTitle}</p>
        <p>{t.reviewBody}</p>
        {safeRef && <p className="font-mono text-xs">{t.reviewRef}: {safeRef}</p>}
      </div>
    );
  }
  if (code === 'LINE_RELINK_SUGGESTED') {
    return (
      <div data-testid="line-relink" className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 space-y-2">
        <p className="font-bold">{t.relinkTitle}</p>
        <p>{t.relinkBody}</p>
        <button type="button" className="w-full rounded-xl bg-[#06C755] py-2 font-bold text-white"
          onClick={() => { window.location.href = `/api/auth/line?create=1&next=${encodeURIComponent(redirect)}` }}>
          {t.relinkCreate}
        </button>
      </div>
    );
  }
  return (
    <div data-testid="auth-error" className="mt-4 px-4 py-3 bg-red-50 border border-red-100 rounded-2xl text-xs font-semibold text-red-600 break-words">
      {lineErrorText(locale, code)}
    </div>
  );
}
