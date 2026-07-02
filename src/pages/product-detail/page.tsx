import { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'

import { CloudinaryImage } from '@/components/media/cloudinary-image'
import { Reveal } from '@/components/layout/reveal'
import { Seo } from '@/components/layout/seo'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog } from '@/components/ui/dialog'
import { ErrorState } from '@/components/ui/error-state'
import { Separator } from '@/components/ui/separator'
import { ProductCard } from '@/components/catalog/product-card'
import { getProductBySlug, products } from '@/entities/product/model/mock'
import { routes } from '@/shared/config/routes'
import { formatCurrency } from '@/shared/lib/format'

export function Component() {
  const { slug = '' } = useParams()
  const [guideOpen, setGuideOpen] = useState(false)

  const product = getProductBySlug(slug)

  const recommendations = useMemo(
    () => products.filter((item) => item.slug !== product?.slug).slice(0, 3),
    [product?.slug],
  )

  if (!product) {
    return (
      <ErrorState
        title="Product not found"
        description="That item is not available in the current catalog."
        actionLabel="Back to collections"
        onAction={() => {
          window.location.href = routes.collections
        }}
      />
    )
  }

  return (
    <div className="space-y-16">
      <Seo title={product.name} description={product.description} />
      <Breadcrumb
        items={[
          { label: 'Collections', href: routes.collections },
          { label: product.collection, href: routes.collections },
          { label: product.name },
        ]}
      />

      <Reveal>
        <section className="grid gap-8 lg:grid-cols-[1fr_0.95fr] lg:items-start">
          <Card className="overflow-hidden p-0 shadow-[var(--shadow-elevated)]">
            <CloudinaryImage
              publicId={product.imageId}
              alt={product.name}
              className="h-full min-h-[34rem] w-full object-cover"
              priority
            />
          </Card>

          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant="premium">{product.badge}</Badge>
                <Badge variant="outline">{product.category}</Badge>
              </div>
              <h1 className="font-display text-5xl font-semibold tracking-tight sm:text-6xl">
                {product.name}
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
                {product.description}
              </p>
            </div>

            <div className="flex items-end gap-3">
              <p className="font-display text-4xl font-semibold text-foreground">
                {formatCurrency(product.price)}
              </p>
              {product.compareAtPrice ? (
                <p className="pb-1 text-sm text-muted-foreground line-through">
                  {formatCurrency(product.compareAtPrice)}
                </p>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-3">
              <Button>Add to cart</Button>
              <Button variant="outline">Save to wishlist</Button>
              <Button variant="premium" onClick={() => setGuideOpen(true)}>
                View ritual guide
              </Button>
            </div>

            <Separator />

            <Card>
              <CardContent className="space-y-4 p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                  Product details
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="font-medium text-foreground">Material</p>
                    <p className="text-sm text-muted-foreground">{product.material}</p>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Dimensions</p>
                    <p className="text-sm text-muted-foreground">{product.dimensions}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </Reveal>

      <Reveal>
        <section className="grid gap-6 lg:grid-cols-2">
          <Card className="shadow-[var(--shadow-soft)]">
            <CardContent className="space-y-4 p-6">
              <h2 className="font-display text-3xl font-semibold tracking-tight">
                Highlights
              </h2>
              <div className="space-y-3">
                {product.highlights.map((highlight) => (
                  <div
                    key={highlight}
                    className="rounded-[var(--radius-field)] border border-border bg-background px-4 py-3 text-sm leading-6 text-muted-foreground"
                  >
                    {highlight}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-[var(--shadow-soft)]">
            <CardContent className="space-y-4 p-6">
              <h2 className="font-display text-3xl font-semibold tracking-tight">
                Care instructions
              </h2>
              <div className="space-y-3">
                {product.care.map((step) => (
                  <div
                    key={step}
                    className="rounded-[var(--radius-field)] border border-border bg-surface/70 px-4 py-3 text-sm leading-6 text-muted-foreground"
                  >
                    {step}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>
      </Reveal>

      <Reveal>
        <section className="space-y-8">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                Recommended
              </p>
              <h2 className="font-display text-3xl font-semibold tracking-tight">
                Similar pieces you may want to explore
              </h2>
            </div>
          </div>
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {recommendations.map((item) => (
              <ProductCard
                key={item.slug}
                product={item}
                href={routes.productDetail(item.slug)}
              />
            ))}
          </div>
        </section>
      </Reveal>

      <Dialog
        open={guideOpen}
        onOpenChange={setGuideOpen}
        title="Ritual guide"
        description="How to place, use, and care for this piece with intention."
      >
        <div className="space-y-4 text-sm leading-7 text-muted-foreground">
          <p>
            Begin by placing the product on a stable, clean surface with enough
            breathing room around it.
          </p>
          <p>
            Use the piece as part of a calm routine, then wipe it dry after use and
            return it to a dry storage space.
          </p>
          <p>
            Pair it with matching brass, marble, or cotton accessories for a fully
            composed ritual setting.
          </p>
        </div>
      </Dialog>
    </div>
  )
}
