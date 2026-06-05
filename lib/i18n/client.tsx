"use client";

import React, { createContext, useContext, useState, useTransition } from "react";
import { locales, translate, type Locale } from "./locales";

interface I18nContextType {
  locale: Locale;
  t: (key: keyof typeof locales.en, variables?: Record<string, string | number>) => string;
  setLocale: (locale: Locale) => void;
}

const I18nContext = createContext<I18nContextType | null>(null);

export function I18nProvider({
  children,
  initialLocale,
}: {
  children: React.ReactNode;
  initialLocale: Locale;
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);
  const [, startTransition] = useTransition();

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    // Set cookie
    document.cookie = `xhw_locale=${newLocale}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
    
    // Refresh page to make sure server components pick up the new language
    startTransition(() => {
      window.location.reload();
    });
  };

  const t = (key: keyof typeof locales.en, variables?: Record<string, string | number>) => {
    return translate(locale, key, variables);
  };

  return (
    <I18nContext.Provider value={{ locale, t, setLocale }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    return {
      locale: "en" as Locale,
      t: (key: keyof typeof locales.en, variables?: Record<string, string | number>) => translate("en", key, variables),
      setLocale: () => {},
    };
  }
  return ctx;
}
