import { Link } from 'react-router-dom'

import { CloudinaryImage } from '@/components/media/cloudinary-image'
import { Reveal } from '@/components/layout/reveal'
import { Seo } from '@/components/layout/seo'
import { SectionHeading } from '@/components/layout/section-heading'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { bestSellers } from '@/shared/data/site-content'
import { routes } from '@/shared/config/routes'
import { formatCurrency } from '@/shared/lib/format'

export function Component() {
  const items = bestSellers.slice(0, 2)
  const subtotal = items.reduce((total, product) => total + product.price, 0)

  return (
    <div className="space-y-16">
      <Seo title="Cart" description="Review items before checkout." />

      <Reveal>
        <section className="space-y-5">
          <Badge variant="premium">Shopping cart</Badge>
          <div className="space-y-4">
            <h1 className="font-display text-5xl font-semibold tracking-tight sm:text-6xl">
              Items selected for a calm, premium checkout.
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
              The cart uses generous spacing and clear summary cards so the final step
              feels reassuring instead of rushed.
            </p>
          </div>
        </section>
      </Reveal>

      <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <Reveal>
          <div className="space-y-4">
            {items.map((product) => (
              <Card key={product.slug} className="shadow-[var(--shadow-soft)]">
                <CardContent className="grid gap-4 p-5 sm:grid-cols-[120px_minmax(0,1fr)_auto] sm:items-center">
                  <div className="overflow-hidden rounded-[var(--radius-card)]">
                    <CloudinaryImage
                      publicId={product.imageId}
                      alt={product.name}
                      className="aspect-square h-full w-full object-cover"
                    />
                  </div>
                  <div className="space-y-2">
                    <Badge variant="outline">{product.category}</Badge>
                    <h2 className="font-display text-2xl font-semibold tracking-tight">
                      {product.name}
                    </h2>
                    <p className="text-sm leading-6 text-muted-foreground">
                      {product.summary}
                    </p>
                  </div>
                  <p className="font-display text-2xl font-semibold">
                    {formatCurrency(product.price)}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </Reveal>

        <Reveal delay={0.08}>
          <Card className="shadow-[var(--shadow-elevated)]">
            <CardContent className="space-y-5 p-6">
              <SectionHeading
                eyebrow="Summary"
                title="Order overview"
                description="The checkout summary keeps shipping and total information visible at a glance."
              />
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className="font-medium">Calculated at checkout</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Packaging</span>
                  <span className="font-medium">Included</span>
                </div>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="font-display text-2xl font-semibold">Estimated total</span>
                <span className="font-display text-2xl font-semibold">
                  {formatCurrency(subtotal)}
                </span>
              </div>
              <Button asChild className="w-full">
                <Link to={routes.checkout}>Proceed to checkout</Link>
              </Button>
            </CardContent>
          </Card>
        </Reveal>
      </section>
    </div>
  )
}
