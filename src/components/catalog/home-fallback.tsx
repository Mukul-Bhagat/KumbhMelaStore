import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'

import { ProductSummaryCard } from '@/components/catalog/product-summary-card'
import { SectionHeading } from '@/components/layout/section-heading'
import { Seo } from '@/components/layout/seo'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { ErrorState } from '@/components/ui/error-state'
import { queryKeys } from '@/shared/api/keys'
import { fetchActiveProductSummaries } from '@/shared/api/catalog-repository'
import { routes } from '@/shared/config/routes'
import { useTranslate } from '@/shared/cms/hooks'

export function HomeFallback() {
  const { locale, t } = useTranslate()
  const products = useQuery({
    queryKey: queryKeys.catalog.products,
    queryFn: fetchActiveProductSummaries,
  })
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
              <Link to={routes.products}>
                {t('nav.products', isHindi ? 'उत्पाद देखें' : 'Shop products')}
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to={routes.collections}>
                {t('nav.collections', isHindi ? 'संग्रह देखें' : 'Explore collections')}
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="space-y-6" aria-live="polite">
        <SectionHeading
          eyebrow={t('home.featured.eyebrow', isHindi ? 'चयनित संग्रह' : 'Curated for you')}
          title={t('home.featured.title', isHindi ? 'लोकप्रिय उत्पाद' : 'Featured products')}
          description={t(
            'home.featured.description',
            isHindi
              ? 'हमारे नवीनतम और लोकप्रिय आध्यात्मिक उत्पाद देखें।'
              : 'Explore our latest and most popular spiritual essentials.',
          )}
        />
        {products.isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" aria-hidden="true">
            {[0, 1, 2].map((item) => (
              <div
                key={item}
                className="aspect-[4/5] animate-pulse rounded-[var(--radius-card)] border border-border bg-surface"
              />
            ))}
            <span className="sr-only">
              {isHindi ? 'उत्पाद लोड हो रहे हैं' : 'Loading products'}
            </span>
          </div>
        ) : products.error ? (
          <ErrorState
            title={t('catalog.load_error', isHindi ? 'उत्पाद लोड नहीं हो सके' : 'Products are unavailable')}
            description={t(
              'catalog.load_error_description',
              isHindi
                ? 'उत्पाद सूची लोड नहीं हुई। आप संग्रह देखना जारी रख सकते हैं।'
                : 'The product list could not be loaded. You can still browse the collections.',
            )}
            retryLabel={t('common.retry', isHindi ? 'फिर से प्रयास करें' : 'Retry')}
            onRetry={() => {
              void products.refetch()
            }}
            secondaryAction={
              <Button asChild variant="outline">
                <Link to={routes.collections}>
                  {t('nav.collections', isHindi ? 'संग्रह देखें' : 'Explore collections')}
                </Link>
              </Button>
            }
          />
        ) : products.data?.length ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {products.data.slice(0, 6).map((product) => (
              <ProductSummaryCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <EmptyState
            title={t('catalog.empty_title', isHindi ? 'उत्पाद जल्द उपलब्ध होंगे' : 'Products are coming soon')}
            description={t(
              'catalog.empty_description',
              isHindi
                ? 'हमारे संग्रह में उपलब्ध वस्तुओं को देखें।'
                : 'Browse our collections while new products are being prepared.',
            )}
            secondaryAction={
              <Button asChild variant="outline">
                <Link to={routes.collections}>
                  {t('nav.collections', isHindi ? 'संग्रह देखें' : 'Explore collections')}
                </Link>
              </Button>
            }
          />
        )}
      </section>
    </div>
  )
}
