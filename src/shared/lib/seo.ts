import { defaultLocale, type Locale, localeMeta } from '@/shared/config/locales'
import { site } from '@/shared/config/site'
import { buildLocalizedPath } from '@/shared/lib/locale'

export function pageTitle(title?: string) {
  return title ? `${title} | ${site.name}` : site.name
}

export function absoluteUrl(pathname = '/') {
  return new URL(pathname, site.url).toString()
}

function upsertMeta(
  selector: string,
  tagName: 'meta' | 'link',
  attributes: Record<string, string>,
  content: string,
) {
  const existing = document.head.querySelector<HTMLElement>(selector)

  if (existing) {
    if (existing instanceof HTMLMetaElement) {
      existing.content = content
    } else if (existing instanceof HTMLLinkElement) {
      existing.href = content
    }
    return
  }

  const element = document.createElement(tagName)
  Object.entries(attributes).forEach(([name, value]) => {
    element.setAttribute(name, value)
  })

  if (element instanceof HTMLMetaElement) {
    element.content = content
  } else if (element instanceof HTMLLinkElement) {
    element.href = content
  }

  document.head.appendChild(element)
}

export function updateDocumentMeta(
  title?: string,
  description: string = site.description,
  pathname: string = '/',
  locale: Locale = defaultLocale,
) {
  document.title = pageTitle(title)

  const metaTags = [
    ['description', description],
    ['og:title', pageTitle(title)],
    ['og:description', description],
    ['og:url', absoluteUrl(buildLocalizedPath(locale, pathname))],
    ['twitter:title', pageTitle(title)],
    ['twitter:description', description],
  ] as const

  for (const [name, content] of metaTags) {
    const selector = `meta[name="${name}"],meta[property="${name}"]`
    const existing = document.head.querySelector<HTMLMetaElement>(selector)

    if (existing) {
      existing.content = content
      continue
    }

    const tag = document.createElement('meta')
    if (name.startsWith('og:')) {
      tag.setAttribute('property', name)
    } else {
      tag.setAttribute('name', name)
    }
    tag.content = content
    document.head.appendChild(tag)
  }

  const canonicalId = 'canonical-link'
  let canonical = document.head.querySelector<HTMLLinkElement>(
    `link[data-app="${canonicalId}"]`,
  )

  if (!canonical) {
    canonical = document.createElement('link')
    canonical.rel = 'canonical'
    canonical.dataset.app = canonicalId
    document.head.appendChild(canonical)
  }

  canonical.href = absoluteUrl(buildLocalizedPath(locale, pathname))

  const alternates: Locale[] = ['hi', 'en']
  for (const alternateLocale of alternates) {
    const href = absoluteUrl(buildLocalizedPath(alternateLocale, pathname))
    upsertMeta(
      `link[data-app="alternate-${alternateLocale}"]`,
      'link',
      {
        rel: 'alternate',
        hreflang: localeMeta(alternateLocale).htmlLang,
        'data-app': `alternate-${alternateLocale}`,
      },
      href,
    )
  }

  upsertMeta(
    `meta[data-app="content-language"]`,
    'meta',
    {
      name: 'content-language',
      'data-app': 'content-language',
    },
    localeMeta(locale).contentLanguage,
  )
}
