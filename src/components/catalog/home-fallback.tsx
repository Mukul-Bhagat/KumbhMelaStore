import { Link } from 'react-router-dom'

import { HomeFeaturedProducts } from '@/components/catalog/home-featured-products'
import { Seo } from '@/components/layout/seo'
import { Button } from '@/components/ui/button'
import { routes } from '@/shared/config/routes'
import { useTranslate } from '@/shared/cms/hooks'

export function HomeFallback() {
  const { locale, t } = useTranslate()
  const isHindi = locale === 'hi'
  const title = t(
    'home.fallback.title',
    isHindi ? 'आस्था और परंपरा का सुंदर संगम' : 'A thoughtful home for sacred living',
  )
  const description = t(
    'home.fallback.description',
    isHindi
      ? 'पूजा, उपहार और दैनिक जीवन के लिए चुनी हुई आध्यात्मिक वस्तुएँ खोजें।'
      : 'Discover carefully selected spiritual essentials for rituals, gifting, and everyday life.',
  )

  return (
    <div className="space-y-12">
      <Seo title={title} description={description} />
      <section className="overflow-hidden rounded-[var(--radius-card)] border border-border bg-gradient-to-br from-surface via-background to-primary/10 px-6 py-12 shadow-[var(--shadow-elevated)] sm:px-10 sm:py-16 lg:px-14">
        <div className="max-w-3xl space-y-6">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary">
            KumbhMelaStore
          </p>
          <h1 className="font-display text-4xl font-semibold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            {title}
          </h1>
          <p className="max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
            {description}
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link to={routes.forLocale(locale, 'products')}>
                {t('nav.products', isHindi ? 'उत्पाद देखें' : 'Shop products')}
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to={routes.forLocale(locale, 'about')}>
                {t('nav.about', isHindi ? 'हमारे बारे में' : 'About us')}
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <HomeFeaturedProducts />
    </div>
  )
}
