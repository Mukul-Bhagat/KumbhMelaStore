import { Link } from 'react-router-dom'

import { ProductCard } from '@/components/catalog/product-card'
import { Reveal } from '@/components/layout/reveal'
import { Seo } from '@/components/layout/seo'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { bestSellers } from '@/shared/data/site-content'
import { routes } from '@/shared/config/routes'

export function Component() {
  const items = bestSellers.slice(1, 4)

  return (
    <div className="space-y-16">
      <Seo title="Wishlist" description="Save and revisit products you love." />

      <Reveal>
        <section className="space-y-5">
          <Badge variant="premium">Wishlist</Badge>
          <div className="space-y-4">
            <h1 className="font-display text-5xl font-semibold tracking-tight sm:text-6xl">
              Pieces you can return to when the timing feels right.
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
              Wishlists help shoppers keep a quiet record of products they may want to
              gift, compare, or revisit later.
            </p>
          </div>
        </section>
      </Reveal>

      <Reveal>
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {items.map((product) => (
            <ProductCard
              key={product.slug}
              product={product}
              href={routes.productDetail(product.slug)}
            />
          ))}
        </div>
      </Reveal>

      <Reveal>
        <Card className="shadow-[var(--shadow-soft)]">
          <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-display text-3xl font-semibold tracking-tight">
                Need to compare favorites?
              </h2>
              <p className="text-sm leading-6 text-muted-foreground">
                Move wishlist items into the cart when you are ready to continue.
              </p>
            </div>
            <Button asChild>
              <Link to={routes.cart}>Open cart</Link>
            </Button>
          </CardContent>
        </Card>
      </Reveal>
    </div>
  )
}
