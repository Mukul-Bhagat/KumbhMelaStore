import { useDeferredValue, useState } from 'react'
import { useQuery } from '@tanstack/react-query'

import { ProductSummaryCard } from '@/components/catalog/product-summary-card'
import { SectionHeading } from '@/components/layout/section-heading'
import { Seo } from '@/components/layout/seo'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { ErrorState } from '@/components/ui/error-state'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { queryKeys } from '@/shared/api/keys'
import { fetchActiveProductPage, type ProductCatalogSort } from '@/shared/api/catalog-repository'
import { useTranslate } from '@/shared/cms/hooks'

const pageSize = 24

export function Component() {
  const { locale, t } = useTranslate()
  const [search, setSearch] = useState('')
  const deferredSearch = useDeferredValue(search)
  const [sort, setSort] = useState<ProductCatalogSort>('newest')
  const [page, setPage] = useState(1)
  const products = useQuery({
    queryKey: [...queryKeys.catalog.products, 'public-page', deferredSearch, sort, page],
    queryFn: () => fetchActiveProductPage({ search: deferredSearch, sort, page, pageSize }),
  })
  const isHindi = locale === 'hi'
  const title = t('catalog.title', isHindi ? 'सभी उत्पाद' : 'All products')
  const description = t(
    'catalog.description',
    isHindi
      ? 'कुम्भमेला स्टोर के चुनिंदा आध्यात्मिक उत्पाद देखें।'
      : 'Browse the curated spiritual essentials from KumbhMelaStore.',
  )
  const totalPages = Math.max(1, Math.ceil((products.data?.totalCount ?? 0) / pageSize))

  return (
    <div className="space-y-8">
      <Seo title={title} description={description} />
      <SectionHeading title={title} description={description} />
      <div className="grid gap-4 rounded-[var(--radius-card)] border border-border bg-card p-4 sm:grid-cols-[minmax(0,1fr)_14rem] sm:items-end">
        <div className="space-y-2">
          <Label htmlFor="catalog-search">{isHindi ? 'उत्पाद खोजें' : 'Search products'}</Label>
          <Input
            id="catalog-search"
            type="search"
            value={search}
            placeholder={isHindi ? 'नाम, SKU या हैंडल से खोजें' : 'Search by name, SKU, or handle'}
            onChange={(event) => {
              setSearch(event.target.value)
              setPage(1)
            }}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="catalog-sort">{isHindi ? 'क्रमबद्ध करें' : 'Sort products'}</Label>
          <Select
            id="catalog-sort"
            value={sort}
            onChange={(event) => {
              setSort(event.target.value as ProductCatalogSort)
              setPage(1)
            }}
          >
            <option value="newest">{isHindi ? 'नवीनतम' : 'Newest'}</option>
            <option value="name">{isHindi ? 'नाम' : 'Name'}</option>
          </Select>
        </div>
      </div>
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
      ) : products.data?.products.length ? (
        <>
          <p className="text-sm text-muted-foreground">
            {products.data.totalCount} {isHindi ? 'उत्पाद' : 'products'}
          </p>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {products.data.products.map((product) => (
              <ProductSummaryCard key={product.id} product={product} />
            ))}
          </div>
          {totalPages > 1 ? (
            <nav className="flex items-center justify-center gap-4" aria-label={isHindi ? 'उत्पाद पृष्ठ' : 'Product pages'}>
              <Button variant="outline" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>
                {isHindi ? 'पिछला' : 'Previous'}
              </Button>
              <span className="text-sm text-muted-foreground">
                {page} / {totalPages}
              </span>
              <Button variant="outline" disabled={page >= totalPages} onClick={() => setPage((current) => current + 1)}>
                {isHindi ? 'अगला' : 'Next'}
              </Button>
            </nav>
          ) : null}
        </>
      ) : (
        <EmptyState
          title={t(
            'catalog.empty_title',
            search.trim()
              ? (isHindi ? 'कोई मेल खाता उत्पाद नहीं मिला' : 'No matching products found')
              : (isHindi ? 'अभी कोई उत्पाद उपलब्ध नहीं है' : 'No products available yet'),
          )}
          description={t(
            'catalog.empty_description',
            isHindi ? 'खोज बदलें या बाद में फिर से देखें।' : 'Try a different search or check back again soon.',
          )}
          secondaryAction={
            page > totalPages ? (
              <Button variant="outline" onClick={() => setPage(totalPages)}>
                {isHindi ? 'अंतिम उपलब्ध पृष्ठ पर जाएँ' : 'Go to the last available page'}
              </Button>
            ) : undefined
          }
        />
      )}
    </div>
  )
}
