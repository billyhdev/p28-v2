import React, { createContext, useContext, useMemo, useState } from 'react';

type LocaleContextValue = {
  /** Current app locale/language code (e.g. en, es). */
  locale: string;
  setLocale: (next: string) => void;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<string>('en');

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      setLocale: (next) => setLocaleState(next),
    }),
    [locale]
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error('useLocale must be used within LocaleProvider');
  return ctx;
}
