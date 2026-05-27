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

export function useTranslations(namespace: string) {
  const { messages } = useContext(I18nContext);
  const ns = (messages[namespace] ?? {}) as Record<string, any>;

  function t(key: string): string {
    return ns[key] ?? key;
  }

  t.raw = (key: string): any => ns[key];

  return t;
}
