import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'

import { ProductSummaryCard } from '@/components/catalog/product-summary-card'
import { SectionHeading } from '@/components/layout/section-heading'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { ErrorState } from '@/components/ui/error-state'
import { queryKeys } from '@/shared/api/keys'
import { fetchActiveProductSummaries } from '@/shared/api/catalog-repository'
import { routes } from '@/shared/config/routes'
import { useTranslate } from '@/shared/cms/hooks'

export function HomeFeaturedProducts() {
  const { locale, t } = useTranslate()
  const products = useQuery({
    queryKey: queryKeys.catalog.products,
    queryFn: fetchActiveProductSummaries,
  })
  const isHindi = locale === 'hi'
  const productsHref = routes.forLocale(locale, 'products')

  return (
    <section className="space-y-6" aria-live="polite">
      <SectionHeading
        eyebrow={t('home.featured.eyebrow', isHindi ? 'आपके लिए चुने गए' : 'Curated for you')}
        title={t('home.featured.title', isHindi ? 'चुनिंदा उत्पाद' : 'Featured products')}
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
          <span className="sr-only">{isHindi ? 'उत्पाद लोड हो रहे हैं' : 'Loading products'}</span>
        </div>
      ) : products.error ? (
        <ErrorState
          title={t('catalog.load_error', isHindi ? 'उत्पाद लोड नहीं हो सके' : 'Products are unavailable')}
          description={t(
            'catalog.load_error_description',
            isHindi
              ? 'उत्पाद सूची लोड नहीं हुई। कृपया फिर से प्रयास करें।'
              : 'The product list could not be loaded. Please try again.',
          )}
          retryLabel={t('common.retry', isHindi ? 'फिर से प्रयास करें' : 'Retry')}
          onRetry={() => {
            void products.refetch()
          }}
        />
      ) : products.data?.length ? (
        <>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {products.data.slice(0, 6).map((product) => (
              <ProductSummaryCard key={product.id} product={product} />
            ))}
          </div>
          <div className="flex justify-center">
            <Button asChild variant="outline">
              <Link to={productsHref}>{t('catalog.view_all', isHindi ? 'सभी उत्पाद देखें' : 'View all products')}</Link>
            </Button>
          </div>
        </>
      ) : (
        <EmptyState
          title={t('catalog.empty_title', isHindi ? 'उत्पाद जल्द उपलब्ध होंगे' : 'Products are coming soon')}
          description={t(
            'catalog.empty_description',
            isHindi ? 'कृपया बाद में फिर से देखें।' : 'Please check back again soon.',
          )}
          secondaryAction={
            <Button asChild variant="outline">
              <Link to={productsHref}>{t('catalog.view_all', isHindi ? 'सभी उत्पाद देखें' : 'View all products')}</Link>
            </Button>
          }
        />
      )}
    </section>
  )
}
