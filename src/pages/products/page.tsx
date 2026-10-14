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

export function Component() {
  const { locale, t } = useTranslate()
  const products = useQuery({
    queryKey: queryKeys.catalog.products,
    queryFn: fetchActiveProductSummaries,
  })
  const isHindi = locale === 'hi'
  const title = t('catalog.title', isHindi ? 'सभी उत्पाद' : 'All products')
  const description = t(
    'catalog.description',
    isHindi
      ? 'कुम्भमेला स्टोर के चुनिंदा आध्यात्मिक उत्पाद देखें।'
      : 'Browse the curated spiritual essentials from KumbhMelaStore.',
  )

  return (
    <div className="space-y-8">
      <Seo title={title} description={description} />
      <SectionHeading title={title} description={description} />
      {products.isLoading ? (
        <div
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
          aria-label={isHindi ? 'उत्पाद लोड हो रहे हैं' : 'Loading products'}
          aria-busy="true"
        >
          {[0, 1, 2, 3, 4, 5].map((item) => (
            <div
              key={item}
              className="aspect-[4/5] animate-pulse rounded-[var(--radius-card)] border border-border bg-surface"
            />
          ))}
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
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.data.map((product) => (
            <ProductSummaryCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <EmptyState
          title={t('catalog.empty_title', isHindi ? 'अभी कोई उत्पाद उपलब्ध नहीं है' : 'No products available yet')}
          description={t(
            'catalog.empty_description',
            isHindi ? 'कृपया बाद में फिर से देखें।' : 'Please check back again soon.',
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
    </div>
  )
}
