import { Link } from 'react-router-dom'

import { CloudinaryImage } from '@/components/media/cloudinary-image'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { formatCurrency } from '@/shared/lib/format'
import type { Collection } from '@/entities/collection/model/types'
import { cn } from '@/shared/lib/cn'

export interface CollectionCardProps {
  collection: Collection
  href: string
  className?: string
}

export function CollectionCard({
  collection,
  href,
  className,
}: CollectionCardProps) {
  return (
    <Card className={cn('group overflow-hidden p-0', className)}>
      <div className="relative aspect-[4/3] overflow-hidden">
        <CloudinaryImage
          publicId={collection.imageId}
          alt={collection.title}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
        <div className="absolute left-4 top-4">
          <Badge variant="premium">{collection.badge}</Badge>
        </div>
      </div>
      <CardContent className="space-y-5 p-6">
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground">
            {collection.accent}
          </p>
          <h3 className="font-display text-2xl font-semibold tracking-tight">
            {collection.title}
          </h3>
          <p className="text-sm leading-6 text-muted-foreground">
            {collection.description}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {collection.details.map((detail) => (
            <Badge key={detail} variant="outline">
              {detail}
            </Badge>
          ))}
        </div>

        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
              From
            </p>
            <p className="font-display text-2xl font-semibold text-foreground">
              {formatCurrency(collection.priceFrom)}
            </p>
          </div>
          <Button asChild variant="outline">
            <Link to={href}>View collection</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
