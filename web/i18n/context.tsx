"use client";

import { createContext, useContext } from 'react';

type Messages = Record<string, any>;

interface I18nContextValue {
  locale: string;
  messages: Messages;
}

const I18nContext = createContext<I18nContextValue>({ locale: 'th', messages: {} });

export function I18nProvider({
  locale,
  messages,
  children,
}: {
  locale: string;
  messages: Messages;
  children: React.ReactNode;
}) {
  return <I18nContext.Provider value={{ locale, messages }}>{children}</I18nContext.Provider>;
}

export function useLocale(): string {
  return useContext(I18nContext).locale;
}

// Missing keys: the key itself is shown (never a crash). In development each missing key is reported once in the
// console; tests/i18n-consistency.test.mjs fails the build-time check for literal keys.
const reported = new Set<string>();
function reportMissing(full: string) {
  if (process.env.NODE_ENV === 'production' || reported.has(full)) return;
  reported.add(full);
  console.warn(`[i18n] missing message: ${full}`);
}

// Nested keys with dots ('problem.health.title') and {placeholders} ({ n: 3 } → "3 pets"). Unknown placeholders
// are left as written.
export function useTranslations(namespace: string) {
  const { messages, locale } = useContext(I18nContext);
  const ns = (messages[namespace] ?? {}) as Record<string, any>;

  const lookup = (key: string): unknown => {
    if (key in ns) return ns[key];
    let node: unknown = ns;
    for (const part of key.split('.')) { node = node && typeof node === 'object' ? (node as Record<string, unknown>)[part] : undefined; }
    return node;
  };

  function t(key: string, vars?: Record<string, string | number>): string {
    const v = lookup(key);
    if (typeof v !== 'string') { reportMissing(`${locale}:${namespace}.${key}`); return key; }
    return vars ? v.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m)) : v;
  }

  t.raw = (key: string): any => lookup(key);

  return t;
}
