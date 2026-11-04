// Server component: adds the namespaces a page needs on top of the layout's global messages, so a page never ships
// the whole messages file (i18n Phase 2 — see docs/I18N_PHASE2.md §1).
import 'server-only';
import { I18nProvider } from '@/i18n/context';
import th from '@/messages/th.json';
import en from '@/messages/en.json';

type All = Record<string, unknown>;

export function pickMessages(locale: string, namespaces: readonly string[]): Record<string, unknown> {
  const all = (locale === 'en' ? en : th) as All;
  return Object.fromEntries(namespaces.filter((n) => n in all).map((n) => [n, all[n]]));
}

export default function ScopedMessages({ locale, ns, children }: { locale: string; ns: readonly string[]; children: React.ReactNode }) {
  return <I18nProvider locale={locale} messages={pickMessages(locale, ns)}>{children}</I18nProvider>;
}
