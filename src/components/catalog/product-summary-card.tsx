import { Link } from 'react-router-dom'

import { CloudinaryImage } from '@/components/media/cloudinary-image'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import type { ProductSummaryRecord } from '@/shared/api/catalog-repository'
import { routes } from '@/shared/config/routes'
import { formatCurrency, humanizeSlug } from '@/shared/lib/format'
import { readProductContent } from '@/shared/lib/product-content'
import { useLocale } from '@/shared/hooks/use-locale'

export function ProductSummaryCard({ product }: { product: ProductSummaryRecord }) {
  const locale = useLocale()
  const name = readProductContent(product.metadata, 'name', locale) ?? humanizeSlug(product.slug)
  const description = readProductContent(product.metadata, 'description', locale)
  const image =
    product.primaryImage?.secure_url ?? product.primaryImage?.public_id ?? ''

  return (
    <Card className="group overflow-hidden p-0">
      <Link
        to={routes.forLocale(locale, `products/${product.slug}`)}
        aria-label={`View ${name}`}
        className="block"
      >
        <div className="relative aspect-[4/5] overflow-hidden bg-surface">
          {image ? (
            <CloudinaryImage
              publicId={image}
              alt={product.primaryImage?.alt_text ?? name}
              className="transition-transform duration-700 group-hover:scale-105"
              sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
            />
          ) : (
            <div className="grid h-full place-items-center bg-gradient-to-br from-surface to-background">
              <span className="font-display text-2xl text-muted-foreground">{name}</span>
            </div>
          )}
          <div className="absolute left-4 top-4">
            <Badge variant="premium">{product.sku}</Badge>
          </div>
        </div>
      </Link>
      <CardContent className="space-y-4 p-5">
        <div className="space-y-2">
          <h3 className="font-display text-xl font-semibold tracking-tight">{name}</h3>
          {description || product.material ? (
            <p className="text-sm text-muted-foreground">{description ?? product.material}</p>
          ) : null}
        </div>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Price</p>
            <p className="font-display text-xl font-semibold">
              {product.hasVariants ? 'From ' : ''}
              {formatCurrency(product.basePrice, product.currency)}
              {product.maxPrice > product.basePrice
                ? ` – ${formatCurrency(product.maxPrice, product.currency)}`
                : ''}
            </p>
            {product.compareAtPrice != null && product.compareAtPrice > product.basePrice ? (
              <p className="text-sm text-muted-foreground line-through">
                {formatCurrency(product.compareAtPrice, product.currency)}
              </p>
            ) : null}
          </div>
          <Button asChild variant="outline" size="sm">
            <Link to={routes.forLocale(locale, `products/${product.slug}`)}>View details</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
