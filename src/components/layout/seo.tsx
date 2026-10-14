import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

import { site } from '@/shared/config/site'
import { updateDocumentMeta } from '@/shared/lib/seo'
import { useLocale } from '@/shared/hooks/use-locale'

export interface SeoProps {
  title?: string
  description?: string
  image?: string
  noIndex?: boolean
  pathname?: string
}

export function Seo({
  title,
  description = site.description,
  image,
  noIndex = false,
  pathname,
}: SeoProps) {
  const location = useLocation()
  const locale = useLocale()

  useEffect(() => {
    updateDocumentMeta(title, description, pathname ?? location.pathname, locale)

    const robotsId = 'robots-meta'
    let robots = document.head.querySelector<HTMLMetaElement>(
      `meta[data-app="${robotsId}"]`,
    )

    if (!robots) {
      robots = document.createElement('meta')
      robots.dataset.app = robotsId
      robots.name = 'robots'
      document.head.appendChild(robots)
    }

    robots.content = noIndex ? 'noindex,nofollow' : 'index,follow'

    if (image) {
      const selector = 'meta[property="og:image"],meta[name="twitter:image"]'
      const existing = document.head.querySelectorAll<HTMLMetaElement>(selector)

      existing.forEach((tag) => {
        tag.content = image
      })

      if (existing.length === 0) {
        const ogImage = document.createElement('meta')
        ogImage.setAttribute('property', 'og:image')
        ogImage.content = image
        document.head.appendChild(ogImage)

        const twitterImage = document.createElement('meta')
        twitterImage.setAttribute('name', 'twitter:image')
        twitterImage.content = image
        document.head.appendChild(twitterImage)
      }
    }
  }, [description, image, location.pathname, locale, noIndex, pathname, title])

  return null
}
