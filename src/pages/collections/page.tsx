import { Link } from 'react-router-dom'

import { CollectionCard } from '@/components/catalog/collection-card'
import { Reveal } from '@/components/layout/reveal'
import { Seo } from '@/components/layout/seo'
import { SectionHeading } from '@/components/layout/section-heading'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { collections } from '@/entities/collection/model/mock'
import { routes } from '@/shared/config/routes'

export function Component() {
  return (
    <div className="space-y-16">
      <Seo
        title="Collections"
        description="Explore curated collections from KumbhMelaStore."
      />

      <Reveal>
        <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="space-y-6">
            <Badge variant="premium">Curated collections</Badge>
            <div className="space-y-4">
              <h1 className="font-display text-5xl font-semibold tracking-tight sm:text-6xl">
                Collections built around material, mood, and ritual use.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
                Each collection gives the store a premium, editorial structure while
                helping shoppers browse by context rather than only by product type.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild>
                <Link to={routes.categories}>Browse categories</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to={routes.about}>Our story</Link>
              </Button>
            </div>
          </div>

          <Card className="shadow-[var(--shadow-elevated)]">
            <CardContent className="grid gap-4 p-6 sm:grid-cols-2">
              {collections.map((collection) => (
                <div
                  key={collection.slug}
                  className="rounded-[var(--radius-card)] border border-border bg-surface/70 p-4"
                >
                  <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                    {collection.badge}
                  </p>
                  <p className="mt-2 font-display text-2xl font-semibold tracking-tight">
                    {collection.title}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {collection.description}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>
      </Reveal>

      <Reveal>
        <section className="space-y-8">
          <SectionHeading
            eyebrow="Browse by collection"
            title="A calmer way to navigate the catalog."
            description="The collection cards provide strong visual hierarchy while preserving enough whitespace for future product expansion."
          />
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {collections.map((collection) => (
              <CollectionCard
                key={collection.slug}
                collection={collection}
                href={routes.collectionDetail(collection.slug)}
              />
            ))}
          </div>
        </section>
      </Reveal>
    </div>
  )
}
