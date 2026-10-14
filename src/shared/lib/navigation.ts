import { type Locale } from '@/shared/config/locales'
import { buildLocalizedPath } from '@/shared/lib/locale'

export function isExternalHref(href: string) {
  return /^(https?:|mailto:|tel:)/.test(href)
}

export function isActionHref(href: string) {
  return href.startsWith('javascript:') || href.startsWith('#')
}

export function isNeutralAuthHref(href: string) {
  return href.startsWith('/auth/callback') || href.startsWith('/auth/reset-password')
}

export function resolveLocalizedHref(href: string, locale: Locale) {
  if (!href || isExternalHref(href) || isNeutralAuthHref(href) || href.startsWith(`/${locale}`)) {
    return href
  }

  return buildLocalizedPath(locale, href)
}
