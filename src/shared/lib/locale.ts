import { defaultLocale, localeMeta as localeInfo, type Locale, normalizeLocale } from '@/shared/config/locales'

const LOCALE_PREFIX_PATTERN = /^\/(hi|en)(?=\/|$)/

export function stripLocalePrefix(pathname: string) {
  const normalized = pathname === '/' ? '/' : pathname.replace(/\/+$/, '')
  const stripped = normalized.replace(LOCALE_PREFIX_PATTERN, '') || '/'
  return stripped.startsWith('/') ? stripped : `/${stripped}`
}

export function getLocaleFromPathname(pathname: string): Locale {
  const match = pathname.match(/^\/([^/]+)/)
  return normalizeLocale(match?.[1] ?? defaultLocale)
}

export function buildLocalizedPath(
  locale: Locale,
  pathname: string,
  search = '',
  hash = '',
) {
  const cleanPath = pathname.startsWith('/') ? pathname : `/${pathname}`
  const stripped = stripLocalePrefix(cleanPath)
  const basePath = stripped === '/' ? '' : stripped
  const nextPath = `/${locale}${basePath}`

  return `${nextPath}${search}${hash}`
}

export function swapLocaleInPathname(
  pathname: string,
  locale: Locale,
  search = '',
  hash = '',
) {
  const stripped = stripLocalePrefix(pathname)
  return buildLocalizedPath(locale, stripped, search, hash)
}

export function getLocalizedHref(pathname: string, locale: Locale) {
  return buildLocalizedPath(locale, pathname)
}

export function getDocumentLocale(locale: Locale) {
  return localeInfo(locale).htmlLang
}

export function localeMeta(locale: Locale) {
  return localeInfo(locale)
}
