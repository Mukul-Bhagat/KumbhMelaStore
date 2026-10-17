import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, Minus, Plus, ShoppingBag, Star } from 'lucide-react'
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
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null)
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null)
  const [quantity, setQuantity] = useState(1)
  const addItem = useCartStore((state) => state.addItem)
  const beginCheckoutNow = useCartStore((state) => state.beginCheckoutNow)
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

  const { product, category, collection, images, variants, reviews, averageRating } = productQuery.data
  const productName = readProductContent(product.metadata, 'name', locale) ?? humanizeSlug(product.slug)
  const productDescription = readProductContent(product.metadata, 'description', locale)
  const availableVariants = variants.filter((variant) =>
    !variant.track_inventory ||
    variant.inventory_quantity > 0 ||
    variant.continue_selling_when_out_of_stock,
  )
  const selectedVariant =
    variants.find((variant) => variant.id === selectedVariantId) ??
    availableVariants[0] ??
    variants[0] ??
    null
  const selectedImage =
    images.find((image) => image.id === selectedImageId && image.media) ??
    images.find((image) => image.isPrimary && image.media) ??
    images.find((image) => image.media)
  const heroImage = selectedImage?.media?.secure_url ?? selectedImage?.media?.public_id ?? ''
  const galleryImages = images.filter((image) => image.media)
  const unitPrice = Number(selectedVariant?.price ?? product.base_price)
  const compareAtPrice = selectedVariant?.compare_at_price ?? product.compare_at_price
  const trackInventory = selectedVariant?.track_inventory ?? product.track_inventory
  const inventoryQuantity = selectedVariant?.inventory_quantity ?? product.inventory_quantity
  const continueSelling =
    selectedVariant?.continue_selling_when_out_of_stock ??
    product.continue_selling_when_out_of_stock
  const available =
    product.stock_status === 'active' &&
    (!selectedVariant || selectedVariant.is_active) &&
    (!trackInventory || inventoryQuantity > 0 || continueSelling)
  const maxQuantity = trackInventory && !continueSelling ? inventoryQuantity : null
  const quantityLimit = Math.min(maxQuantity ?? 99, 99)
  const canPurchase = available && (maxQuantity == null || quantity <= maxQuantity)
  const addSelectedItem = (buyNow: boolean) => {
    if (!canPurchase) return
    const item = {
      productId: product.id,
      ...(selectedVariant
        ? { variantId: selectedVariant.id, variantTitle: selectedVariant.title }
        : {}),
      slug: product.slug,
      name: productName,
      price: unitPrice,
      currency: product.currency,
      image: heroImage,
      quantity,
      available,
      maxQuantity,
    }
    if (buyNow) {
      beginCheckoutNow(item)
      navigate(routes.forLocale(locale, 'checkout'))
    } else {
      addItem(item)
      toast.success('Added to cart')
    }
  }

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
          <Badge variant={available ? 'success' : 'error'}>
            {available ? 'In stock' : 'Out of stock'}
          </Badge>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-3">
          <Card className="overflow-hidden shadow-[var(--shadow-elevated)]">
            {heroImage ? (
              <div className="aspect-[4/5]">
                <CloudinaryImage
                  publicId={heroImage}
                  alt={selectedImage?.altText ?? productName}
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
          {galleryImages.length > 1 ? (
            <div className="grid grid-cols-4 gap-3">
              {galleryImages.map((image) => {
                const imageUrl = image.media?.secure_url ?? image.media?.public_id ?? ''
                return (
                  <button
                    key={image.id}
                    type="button"
                    aria-label={`View image ${image.sortOrder + 1} of ${productName}`}
                    aria-pressed={selectedImage?.id === image.id}
                    onClick={() => setSelectedImageId(image.id)}
                    className={`overflow-hidden rounded-[var(--radius-field)] border ${selectedImage?.id === image.id ? 'border-primary ring-2 ring-primary/30' : 'border-border'}`}
                  >
                    <div className="aspect-square">
                      <CloudinaryImage
                        publicId={imageUrl}
                        alt={image.altText ?? productName}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  </button>
                )
              })}
            </div>
          ) : null}
        </div>

        <div className="space-y-6">
          <div className="space-y-4">
            <SectionHeading
              eyebrow={selectedVariant?.sku ?? product.sku}
              title={productName}
              description={productDescription ?? product.short_description ?? product.material ?? product.dimensions ?? 'A premium product managed directly from Supabase.'}
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
            <CardContent className="space-y-5 p-6">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Price</p>
                  <div className="flex flex-wrap items-end gap-3">
                    <p className="font-display text-3xl font-semibold tracking-tight">
                      {formatCurrency(unitPrice, product.currency)}
                    </p>
                    {compareAtPrice != null && Number(compareAtPrice) > unitPrice ? (
                      <p className="text-sm text-muted-foreground line-through">
                        {formatCurrency(Number(compareAtPrice), product.currency)}
                      </p>
                    ) : null}
                  </div>
                </div>
                <Badge variant={available ? 'success' : 'error'}>
                  {available ? 'Available' : 'Unavailable'}
                </Badge>
              </div>

              {variants.length > 0 ? (
                <fieldset className="space-y-2">
                  <legend className="text-sm font-medium">Choose an option</legend>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {variants.map((variant) => {
                      const inStock =
                        !variant.track_inventory ||
                        variant.inventory_quantity > 0 ||
                        variant.continue_selling_when_out_of_stock
                      return (
                        <button
                          key={variant.id}
                          type="button"
                          aria-pressed={selectedVariant?.id === variant.id}
                          onClick={() => {
                            setSelectedVariantId(variant.id)
                            setQuantity(1)
                          }}
                          disabled={!inStock}
                          className={`flex items-center justify-between gap-3 rounded-[var(--radius-field)] border p-3 text-left text-sm disabled:cursor-not-allowed disabled:opacity-50 ${selectedVariant?.id === variant.id ? 'border-primary bg-primary/5' : 'border-border'}`}
                        >
                          <span>{variant.title}</span>
                          <span>{formatCurrency(Number(variant.price), product.currency)}</span>
                        </button>
                      )
                    })}
                  </div>
                </fieldset>
              ) : null}

              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium">Quantity</span>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon-sm"
                    aria-label="Decrease quantity"
                    onClick={() => setQuantity((current) => Math.max(1, current - 1))}
                    disabled={quantity <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="min-w-8 text-center" aria-live="polite">{quantity}</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon-sm"
                    aria-label="Increase quantity"
                    onClick={() => setQuantity((current) =>
                      Math.min(current + 1, quantityLimit),
                    )}
                    disabled={!available || quantity >= quantityLimit}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {trackInventory && !continueSelling ? (
                <p className="text-xs text-muted-foreground">
                  {inventoryQuantity > 0 ? `${inventoryQuantity} available` : 'Currently out of stock'}
                </p>
              ) : null}
              <div className="grid gap-2 sm:grid-cols-2">
                <Button
                  type="button"
                  className="w-full"
                  disabled={!canPurchase}
                  onClick={() => addSelectedItem(false)}
                >
                  <ShoppingBag className="h-4 w-4" aria-hidden="true" />
                  Add to cart
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  disabled={!canPurchase}
                  onClick={() => addSelectedItem(true)}
                >
                  Buy now
                </Button>
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
            </CardContent>
          </Card>

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
