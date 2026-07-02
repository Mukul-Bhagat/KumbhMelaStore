import { Star } from 'lucide-react'
import { Link } from 'react-router-dom'

import { CloudinaryImage } from '@/components/media/cloudinary-image'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import type { Product } from '@/entities/product/model/types'
import { formatCurrency } from '@/shared/lib/format'
import { cn } from '@/shared/lib/cn'

export interface ProductCardProps {
  product: Product
  href: string
  className?: string
}

export function ProductCard({ product, href, className }: ProductCardProps) {
  return (
    <Card className={cn('group overflow-hidden p-0', className)}>
      <div className="relative aspect-[4/5] overflow-hidden">
        <CloudinaryImage
          publicId={product.imageId}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/18 to-transparent" />
        <div className="absolute left-4 top-4">
          <Badge variant="premium">{product.badge}</Badge>
        </div>
      </div>
      <CardContent className="space-y-5 p-6">
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground">
            {product.category}
          </p>
          <h3 className="font-display text-2xl font-semibold tracking-tight">
            {product.name}
          </h3>
          <p className="text-sm leading-6 text-muted-foreground">
            {product.summary}
          </p>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Star className="h-4 w-4 fill-warning text-warning" aria-hidden="true" />
          <span>{product.rating.toFixed(1)}</span>
          <span>•</span>
          <span>{product.reviewCount} reviews</span>
        </div>

        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
              Price
            </p>
            <div className="flex items-center gap-2">
              <p className="font-display text-2xl font-semibold text-foreground">
                {formatCurrency(product.price)}
              </p>
              {product.compareAtPrice ? (
                <p className="text-sm text-muted-foreground line-through">
                  {formatCurrency(product.compareAtPrice)}
                </p>
              ) : null}
            </div>
          </div>
          <Button asChild variant="outline">
            <Link to={href}>View details</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
