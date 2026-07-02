import { Link } from 'react-router-dom'

import { Reveal } from '@/components/layout/reveal'
import { Seo } from '@/components/layout/seo'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { categoryCounts } from '@/shared/data/site-content'
import { routes } from '@/shared/config/routes'

export function Component() {
  return (
    <div className="space-y-16">
      <Seo
        title="Categories"
        description="Browse KumbhMelaStore by product category."
      />

      <Reveal>
        <section className="space-y-5">
          <Badge variant="premium">Browse by category</Badge>
          <div className="space-y-4">
            <h1 className="font-display text-5xl font-semibold tracking-tight sm:text-6xl">
              Categories make the catalog easy to explore.
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
              This browsing layer groups the store by use case, atmosphere, and ritual
              context so the experience feels structured without being rigid.
            </p>
          </div>
        </section>
      </Reveal>

      <Reveal>
        <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {categoryCounts.map((category) => (
            <Card key={category.slug} className="shadow-[var(--shadow-soft)]">
              <CardContent className="space-y-5 p-6">
                <div className="flex items-center justify-between gap-4">
                  <Badge variant="premium">{category.badge}</Badge>
                  <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                    {category.itemCount} items
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                    {category.accent}
                  </p>
                  <h2 className="font-display text-3xl font-semibold tracking-tight">
                    {category.title}
                  </h2>
                  <p className="text-sm leading-6 text-muted-foreground">
                    {category.description}
                  </p>
                </div>
                <Button asChild variant="outline">
                  <Link to={routes.categoryDetail(category.slug)}>Explore category</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </section>
      </Reveal>
    </div>
  )
}
