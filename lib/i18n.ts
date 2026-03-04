/**
 * App i18n: EN, KO (Korean), KM (Khmer).
 * Locale codes ISO 639-1: en, ko, km.
 * Use t(key) for translated strings; changeLanguage(locale) to switch.
 * Fallback: missing keys or unsupported locale → English.
 */
import { en, type TranslationShape } from './i18n/locales/en';
import { ko } from './i18n/locales/ko';
import { km } from './i18n/locales/km';

export type SupportedLocale = 'en' | 'ko' | 'km';

const resources: Record<SupportedLocale, TranslationShape> = {
  en,
  ko,
  km,
};

const FALLBACK: SupportedLocale = 'en';

let currentLocale: SupportedLocale = 'en';

function isSupported(locale: string): locale is SupportedLocale {
  return locale === 'en' || locale === 'ko' || locale === 'km';
}

/**
 * Get current app locale (en, ko, km).
 */
export function getLocale(): SupportedLocale {
  return currentLocale;
}

/**
 * Set app language. Use after user selects language or when hydrating from profile.
 * Invalid locale falls back to 'en'.
 */
export function changeLanguage(locale: string): SupportedLocale {
  const next = isSupported(locale) ? locale : FALLBACK;
  currentLocale = next;
  return next;
}

function getNested(obj: Record<string, unknown>, path: string): unknown {
  const parts = path.split('.');
  let cur: unknown = obj;
  for (const p of parts) {
    if (cur == null || typeof cur !== 'object') return undefined;
    cur = (cur as Record<string, unknown>)[p];
  }
  return cur;
}

/**
 * Translate key (e.g. 'tabs.home', 'profile.editProfile').
 * Returns English fallback for missing keys or unsupported locale.
 */
export function t(key: string): string {
  const locale = isSupported(currentLocale) ? currentLocale : FALLBACK;
  const dict = resources[locale] ?? resources.en;
  const value = getNested(dict as Record<string, unknown>, key);
  if (typeof value === 'string') return value;
  const fallback = getNested(resources.en as Record<string, unknown>, key);
  return typeof fallback === 'string' ? fallback : key;
}

export { SupportedLocale as Locale };
