export const locales = ['en', 'hi'] as const

export type Locale = (typeof locales)[number]

export const defaultLocale: Locale = 'en'

export const localeMetaMap = {
  hi: {
    label: 'Hindi',
    nativeLabel: 'हिन्दी',
    htmlLang: 'hi-IN',
    contentLanguage: 'hi-IN',
  },
  en: {
    label: 'English',
    nativeLabel: 'English',
    htmlLang: 'en-IN',
    contentLanguage: 'en-IN',
  },
} as const satisfies Record<
  Locale,
  { label: string; nativeLabel: string; htmlLang: string; contentLanguage: string }
>

export function localeMeta(locale: Locale) {
  return localeMetaMap[locale]
}

export function isLocale(value: string | null | undefined): value is Locale {
  return value === 'hi' || value === 'en'
}

export function normalizeLocale(value: string | null | undefined): Locale {
  return isLocale(value) ? value : defaultLocale
}

export function getAlternateLocale(locale: Locale): Locale {
  return locale === 'hi' ? 'en' : 'hi'
}
