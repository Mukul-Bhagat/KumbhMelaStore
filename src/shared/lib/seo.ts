import { site } from '@/shared/config/site'

export function pageTitle(title?: string) {
  return title ? `${title} | ${site.name}` : site.name
}

export function absoluteUrl(pathname = '/') {
  return new URL(pathname, site.url).toString()
}

export function updateDocumentMeta(
  title?: string,
  description: string = site.description,
  pathname: string = '/',
) {
  document.title = pageTitle(title)

  const metaTags = [
    ['description', description],
    ['og:title', pageTitle(title)],
    ['og:description', description],
    ['og:url', absoluteUrl(pathname)],
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

  canonical.href = absoluteUrl(pathname)
}
