import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, ShoppingBag, Star } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'

import { BrandMark } from '@/components/brand/brand-mark'
import { CloudinaryImage } from '@/components/media/cloudinary-image'
import { EmptyState } from '@/components/ui/empty-state'
import { CatalogDetailSkeleton } from '@/components/catalog/catalog-detail-skeleton'
import { SectionHeading } from '@/components/layout/section-heading'
import { Seo } from '@/components/layout/seo'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { queryKeys } from '@/shared/api/keys'
import { fetchProductDetail } from '@/shared/api/catalog-repository'
import { formatCurrency, formatDate, humanizeSlug } from '@/shared/lib/format'
import { routes } from '@/shared/config/routes'
import { useCartStore } from '@/shared/stores/cart-store'
import { readProductContent } from '@/shared/lib/product-content'
import { useLocale } from '@/shared/hooks/use-locale'

export function Component() {
  const { slug = 'product' } = useParams()
  const navigate = useNavigate()
  const locale = useLocale()
  const addItem = useCartStore((state) => state.addItem)
  const productQuery = useQuery({
    queryKey: [...queryKeys.pages.all, 'product-detail', slug] as const,
    queryFn: () => fetchProductDetail(slug),
  })

  if (productQuery.isLoading) {
    return <CatalogDetailSkeleton kind="product" />
  }

  if (productQuery.error) {
    return (
      <EmptyState
        title="Unable to load product"
        description="Supabase could not load the product details."
        actionLabel="Retry"
        onAction={() => {
          void productQuery.refetch()
        }}
      />
    )
  }

  if (!productQuery.data) {
    return (
      <EmptyState
        title={humanizeSlug(slug)}
        description="This product has not been published yet in Supabase."
        actionLabel="Browse collections"
        onAction={() => {
          navigate(routes.forLocale(locale, 'collections'))
        }}
      />
    )
  }

  const { product, category, collection, images, reviews, averageRating } = productQuery.data
  const productName = readProductContent(product.metadata, 'name', locale) ?? humanizeSlug(product.slug)
  const productDescription = readProductContent(product.metadata, 'description', locale)
  const primaryImage = images.find((image) => image.isPrimary && image.media)
    ?? images.find((image) => image.media)
  const heroImage = primaryImage?.media?.secure_url ?? primaryImage?.media?.public_id ?? ''
  const galleryImages = images.filter((image) => image.media)

  return (
    <div className="space-y-10">
      <Seo
        title={productName}
        description={productDescription ?? product.material ?? product.dimensions ?? 'Premium product details from Supabase.'}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button asChild variant="ghost">
          <Link to={routes.forLocale(locale, 'collections')}>
            <ChevronLeft className="h-4 w-4" />
            Back to collections
          </Link>
        </Button>
        <div className="flex flex-wrap gap-2">
          {category ? <Badge variant="outline">{category.slug}</Badge> : null}
          {collection ? <Badge variant="premium">{collection.slug}</Badge> : null}
          <Badge variant="outline">{product.stock_status}</Badge>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <Card className="overflow-hidden shadow-[var(--shadow-elevated)]">
          {heroImage ? (
            <div className="aspect-[4/5]">
              <CloudinaryImage
                publicId={heroImage}
                alt={productName}
                className="h-full w-full object-cover"
                priority
              />
            </div>
          ) : (
            <div className="grid aspect-[4/5] place-items-center bg-surface">
              <BrandMark variant="stacked" />
            </div>
          )}
        </Card>

        <div className="space-y-6">
          <div className="space-y-4">
            <SectionHeading
              eyebrow={product.sku}
              title={productName}
              description={productDescription ?? product.material ?? product.dimensions ?? 'A premium product managed directly from Supabase.'}
            />
            {averageRating != null ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Star className="h-4 w-4 fill-warning text-warning" />
                <span>{averageRating.toFixed(1)} average rating</span>
                <span>·</span>
                <span>{reviews.length} approved review(s)</span>
              </div>
            ) : null}
          </div>

          <Card className="shadow-[var(--shadow-soft)]">
            <CardContent className="space-y-4 p-6">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Price</p>
                  <div className="flex flex-wrap items-end gap-3">
                    <p className="font-display text-3xl font-semibold tracking-tight">
                      {formatCurrency(Number(product.base_price), product.currency)}
                    </p>
                    {product.compare_at_price != null ? (
                      <p className="text-sm text-muted-foreground line-through">
                        {formatCurrency(Number(product.compare_at_price), product.currency)}
                      </p>
                    ) : null}
                  </div>
                </div>
                <Badge variant="premium">{product.stock_status}</Badge>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-[var(--radius-card)] border border-border bg-surface p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Material</p>
                  <p className="mt-2 text-sm">{product.material ?? 'Not set'}</p>
                </div>
                <div className="rounded-[var(--radius-card)] border border-border bg-surface p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Dimensions</p>
                  <p className="mt-2 text-sm">{product.dimensions ?? 'Not set'}</p>
                </div>
              </div>
              <Button
                type="button"
                className="w-full"
                disabled={product.stock_status !== 'active'}
                onClick={() => {
                  addItem({
                    productId: product.id,
                    slug: product.slug,
                    name: productName,
                    price: Number(product.base_price),
                    currency: product.currency,
                    image: heroImage,
                  })
                  toast.success('Added to cart')
                }}
              >
                <ShoppingBag className="h-4 w-4" aria-hidden="true" />
                Add to cart
              </Button>
            </CardContent>
          </Card>

          {galleryImages.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {galleryImages.map((image) => (
                <Card key={image.id} className="overflow-hidden p-0 shadow-[var(--shadow-soft)]">
                  <div className="aspect-square">
                    <CloudinaryImage
                      publicId={image.media?.secure_url ?? image.media?.public_id ?? ''}
                      alt={image.altText ?? product.slug}
                      className="h-full w-full object-cover"
                    />
                  </div>
                </Card>
              ))}
            </div>
          ) : null}

          <Card className="shadow-[var(--shadow-soft)]">
            <CardContent className="space-y-3 p-6">
              <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Published</p>
              <p className="font-display text-2xl font-semibold tracking-tight">
                {formatDate(product.created_at)}
              </p>
              <p className="text-sm text-muted-foreground">
                Product and image data are loaded directly from Supabase, and image URLs can be managed from the admin panel.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
