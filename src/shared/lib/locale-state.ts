import { defaultLocale, type Locale } from '@/shared/config/locales'

let activeLocale: Locale = defaultLocale

export function getActiveLocale(): Locale {
  return activeLocale
}

export function setActiveLocale(locale: Locale) {
  activeLocale = locale
}
