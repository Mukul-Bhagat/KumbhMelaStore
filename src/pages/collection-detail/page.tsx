import { useQuery } from '@tanstack/react-query'
import { ChevronLeft } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { CatalogDetailSkeleton } from '@/components/catalog/catalog-detail-skeleton'
import { CloudinaryImage } from '@/components/media/cloudinary-image'
import { EmptyState } from '@/components/ui/empty-state'
import { SectionHeading } from '@/components/layout/section-heading'
import { Seo } from '@/components/layout/seo'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { queryKeys } from '@/shared/api/keys'
import { fetchCollectionDetail } from '@/shared/api/catalog-repository'
import { formatCurrency, humanizeSlug } from '@/shared/lib/format'
import { routes } from '@/shared/config/routes'
import { useLocale } from '@/shared/hooks/use-locale'
import { readProductContent } from '@/shared/lib/product-content'

export function Component() {
  const { slug = 'collection' } = useParams()
  const navigate = useNavigate()
  const locale = useLocale()
  const collectionQuery = useQuery({
    queryKey: [...queryKeys.pages.all, 'collection-detail', slug] as const,
    queryFn: () => fetchCollectionDetail(slug),
  })

  if (collectionQuery.isLoading) {
    return <CatalogDetailSkeleton kind="category" />
  }

  if (collectionQuery.error) {
    return (
      <EmptyState
        title="Unable to load collection"
        description="Supabase could not load the collection details."
        actionLabel="Retry"
        onAction={() => {
          void collectionQuery.refetch()
        }}
      />
    )
  }

  if (!collectionQuery.data) {
    return (
      <EmptyState
        title={humanizeSlug(slug)}
        description="This collection has not been published yet in Supabase."
        actionLabel="Browse collections"
        onAction={() => {
          navigate(routes.collections)
        }}
      />
    )
  }

  const { collection, products } = collectionQuery.data
  const coverImage = collection.cover_media_id ?? collection.hero_media_id

  return (
    <div className="space-y-10">
      <Seo title={collection.slug} description="Supabase managed collection details." />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button asChild variant="ghost">
          <Link to={routes.collections}>
            <ChevronLeft className="h-4 w-4" />
            Back to collections
          </Link>
        </Button>
        <Badge variant={collection.is_featured ? 'premium' : 'outline'}>
          {collection.is_featured ? 'Featured' : 'Collection'}
        </Badge>
      </div>

      <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
        <Card className="overflow-hidden shadow-[var(--shadow-elevated)]">
          {coverImage ? (
            <div className="aspect-[4/5] grid place-items-center bg-surface">
              <p className="text-sm text-muted-foreground">
                Cover image URL stored in Supabase media.
              </p>
            </div>
          ) : (
            <div className="aspect-[4/5] grid place-items-center bg-surface">
              <p className="text-sm text-muted-foreground">No cover image set.</p>
            </div>
          )}
        </Card>

        <div className="space-y-6">
          <SectionHeading
            eyebrow={collection.slug}
            title={humanizeSlug(collection.slug)}
            description="Collection details and products are read live from Supabase."
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Card className="shadow-[var(--shadow-soft)]">
              <CardContent className="p-6">
                <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Products</p>
                <p className="mt-2 font-display text-3xl font-semibold tracking-tight">
                  {products.length}
                </p>
              </CardContent>
            </Card>
            <Card className="shadow-[var(--shadow-soft)]">
              <CardContent className="p-6">
                <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Featured</p>
                <p className="mt-2 font-display text-3xl font-semibold tracking-tight">
                  {collection.is_featured ? 'Yes' : 'No'}
                </p>
              </CardContent>
            </Card>
          </div>

          {products.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {products.map((product) => {
                const name = readProductContent(product.metadata, 'name', locale) ?? humanizeSlug(product.slug)
                const description = readProductContent(product.metadata, 'description', locale)

                return (
                  <Card key={product.id} className="overflow-hidden shadow-[var(--shadow-soft)]">
                    {product.primaryImage ? (
                      <div className="aspect-[4/3]">
                        <CloudinaryImage
                          publicId={product.primaryImage.secure_url}
                          alt={name}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="aspect-[4/3] bg-surface" />
                    )}
                    <CardContent className="space-y-3 p-5">
                      <Badge variant="outline">{product.sku}</Badge>
                      <h3 className="font-display text-2xl font-semibold tracking-tight">
                        {name}
                      </h3>
                      {description ? (
                        <p className="line-clamp-2 text-sm text-muted-foreground">{description}</p>
                      ) : null}
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-display text-xl font-semibold">
                          {product.hasVariants ? 'From ' : ''}
                          {formatCurrency(product.basePrice, product.currency)}
                          {product.maxPrice > product.basePrice
                            ? ` – ${formatCurrency(product.maxPrice, product.currency)}`
                            : ''}
                        </p>
                        <Button asChild variant="outline" size="sm">
                          <Link to={routes.forLocale(locale, `products/${product.slug}`)}>View</Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          ) : (
            <EmptyState
              title="No products in this collection"
              description="Add products in the Super Admin catalog panel and they will appear here immediately."
              actionLabel="Browse categories"
              onAction={() => {
                window.location.assign(routes.forLocale(locale, 'categories'))
              }}
            />
          )}
        </div>
      </div>
    </div>
  )
}
