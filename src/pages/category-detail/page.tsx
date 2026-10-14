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
import { fetchCategoryDetail } from '@/shared/api/catalog-repository'
import { formatCurrency, humanizeSlug } from '@/shared/lib/format'
import { routes } from '@/shared/config/routes'
import { useLocale } from '@/shared/hooks/use-locale'
import { readProductContent } from '@/shared/lib/product-content'

export function Component() {
  const { slug = 'category' } = useParams()
  const navigate = useNavigate()
  const locale = useLocale()
  const categoryQuery = useQuery({
    queryKey: [...queryKeys.pages.all, 'category-detail', slug] as const,
    queryFn: () => fetchCategoryDetail(slug),
  })

  if (categoryQuery.isLoading) {
    return <CatalogDetailSkeleton kind="category" />
  }

  if (categoryQuery.error) {
    return (
      <EmptyState
        title="Unable to load category"
        description="Supabase could not load the category details."
        actionLabel="Retry"
        onAction={() => {
          void categoryQuery.refetch()
        }}
      />
    )
  }

  if (!categoryQuery.data) {
    return (
      <EmptyState
        title={humanizeSlug(slug)}
        description="This category has not been published yet in Supabase."
        actionLabel="Browse categories"
        onAction={() => {
          navigate(routes.categories)
        }}
      />
    )
  }

  const { category, products } = categoryQuery.data

  return (
    <div className="space-y-10">
      <Seo title={category.slug} description="Supabase managed category details." />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button asChild variant="ghost">
          <Link to={routes.categories}>
            <ChevronLeft className="h-4 w-4" />
            Back to categories
          </Link>
        </Button>
        <Badge variant="outline">Category</Badge>
      </div>

      <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
        <Card className="overflow-hidden shadow-[var(--shadow-elevated)]">
          <div className="aspect-[4/5] grid place-items-center bg-surface">
            <p className="text-sm text-muted-foreground">
              Category image can be assigned from Supabase media.
            </p>
          </div>
        </Card>

        <div className="space-y-6">
          <SectionHeading
            eyebrow={category.slug}
            title={humanizeSlug(category.slug)}
            description="Category details and product listings are read live from Supabase."
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
                <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Catalog</p>
                <p className="mt-2 font-display text-3xl font-semibold tracking-tight">
                  Live
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
                          {formatCurrency(product.basePrice)}
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
              title="No products in this category"
              description="Add products in the Super Admin catalog panel and they will appear here immediately."
              actionLabel="Browse collections"
              onAction={() => {
                window.location.assign(routes.forLocale(locale, 'collections'))
              }}
            />
          )}
        </div>
      </div>
    </div>
  )
}
