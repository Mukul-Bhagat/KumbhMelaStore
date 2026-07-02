import { useParams } from 'react-router-dom'

import { ProductCard } from '@/components/catalog/product-card'
import { CloudinaryImage } from '@/components/media/cloudinary-image'
import { Reveal } from '@/components/layout/reveal'
import { Seo } from '@/components/layout/seo'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ErrorState } from '@/components/ui/error-state'
import { getCollectionBySlug } from '@/entities/collection/model/mock'
import { products } from '@/entities/product/model/mock'
import { routes } from '@/shared/config/routes'
import { formatCurrency, slugify } from '@/shared/lib/format'

export function Component() {
  const { slug = '' } = useParams()
  const collection = getCollectionBySlug(slug)

  if (!collection) {
    return (
      <ErrorState
        title="Collection not found"
        description="That collection does not exist in the current catalog."
        actionLabel="Back to collections"
        onAction={() => {
          window.location.href = routes.collections
        }}
      />
    )
  }

  const matchingProducts = products.filter(
    (product) => slugify(product.collection) === collection.slug,
  )

  return (
    <div className="space-y-16">
      <Seo title={collection.title} description={collection.description} />
      <Breadcrumb
        items={[
          { label: 'Collections', href: routes.collections },
          { label: collection.title },
        ]}
      />

      <Reveal>
        <section className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div className="space-y-5">
            <Badge variant="premium">{collection.badge}</Badge>
            <div className="space-y-4">
              <h1 className="font-display text-5xl font-semibold tracking-tight sm:text-6xl">
                {collection.title}
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
                {collection.description}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button>{formatCurrency(collection.priceFrom)} starting</Button>
              <Button variant="outline">Gift-ready by default</Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {collection.details.map((detail) => (
                <Badge key={detail} variant="outline">
                  {detail}
                </Badge>
              ))}
            </div>
          </div>

          <Card className="overflow-hidden p-0 shadow-[var(--shadow-elevated)]">
            <CloudinaryImage
              publicId={collection.imageId}
              alt={collection.title}
              className="h-full min-h-[24rem] w-full object-cover"
            />
          </Card>
        </section>
      </Reveal>

      <Reveal>
        <section className="space-y-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                Products
              </p>
              <h2 className="font-display text-3xl font-semibold tracking-tight">
                {matchingProducts.length} selected pieces
              </h2>
            </div>
            <Badge variant="premium">Collection story</Badge>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {matchingProducts.map((product) => (
              <ProductCard
                key={product.slug}
                product={product}
                href={routes.productDetail(product.slug)}
              />
            ))}
          </div>
        </section>
      </Reveal>
    </div>
  )
}
