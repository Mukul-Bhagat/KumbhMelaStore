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
import { categoryCounts, getCategoryProducts } from '@/shared/data/site-content'
import { routes } from '@/shared/config/routes'

export function Component() {
  const { slug = '' } = useParams()
  const category = categoryCounts.find((item) => item.slug === slug)

  if (!category) {
    return (
      <ErrorState
        title="Category not found"
        description="That category is not available in the current catalog."
        actionLabel="Back to categories"
        onAction={() => {
          window.location.href = routes.categories
        }}
      />
    )
  }

  const products = getCategoryProducts(category.slug)

  return (
    <div className="space-y-16">
      <Seo title={category.title} description={category.description} />
      <Breadcrumb
        items={[
          { label: 'Categories', href: routes.categories },
          { label: category.title },
        ]}
      />

      <Reveal>
        <section className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div className="space-y-5">
            <Badge variant="premium">{category.badge}</Badge>
            <div className="space-y-4">
              <h1 className="font-display text-5xl font-semibold tracking-tight sm:text-6xl">
                {category.title}
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
                {category.description}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button variant="outline">{category.itemCount} products</Button>
              <Button>Curated for calm browsing</Button>
            </div>
          </div>

          <Card className="overflow-hidden p-0 shadow-[var(--shadow-elevated)]">
            <div className="grid h-full gap-0 lg:grid-cols-[0.8fr_1fr]">
              <div className="flex flex-col justify-between bg-surface px-6 py-8 sm:px-8">
                <div className="space-y-3">
                  <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                    Category mood
                  </p>
                  <h2 className="font-display text-3xl font-semibold tracking-tight">
                    {category.accent}
                  </h2>
                <p className="text-sm leading-6 text-muted-foreground">
                  A browsing layer that feels editorial instead of exhaustive.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">Editorial</Badge>
                  <Badge variant="outline">Premium</Badge>
                  <Badge variant="outline">Focused</Badge>
                </div>
              </div>
              <CloudinaryImage
                publicId="sample"
                alt={category.title}
                className="h-full min-h-[22rem] w-full object-cover"
              />
            </div>
          </Card>
        </section>
      </Reveal>

      <Reveal>
        <section className="space-y-8">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                Selected products
              </p>
              <h2 className="font-display text-3xl font-semibold tracking-tight">
                Matching this category
              </h2>
            </div>
            <Badge variant="premium">{products.length} items</Badge>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {products.map((product) => (
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
