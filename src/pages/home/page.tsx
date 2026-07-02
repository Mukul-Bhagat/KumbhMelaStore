import { ArrowRight, Mail, Sparkles, ShieldCheck, Truck } from 'lucide-react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'

import { BrandMark } from '@/components/brand/brand-mark'
import { CollectionCard } from '@/components/catalog/collection-card'
import { ProductCard } from '@/components/catalog/product-card'
import { CloudinaryImage } from '@/components/media/cloudinary-image'
import { Reveal } from '@/components/layout/reveal'
import { Seo } from '@/components/layout/seo'
import { SectionHeading } from '@/components/layout/section-heading'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import {
  authenticityPillars,
  bestSellers,
  blogPosts,
  featuredCollections,
  giftBoxes,
  heroStats,
  testimonials,
  templeHeritageMoments,
} from '@/shared/data/site-content'
import { routes } from '@/shared/config/routes'

export function Component() {
  return (
    <div className="space-y-24">
      <Seo title="Home" />

      <section className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <Reveal className="space-y-8">
          <div className="space-y-5">
            <Badge variant="premium" className="w-fit">
              Spiritual commerce, elevated
            </Badge>
            <div className="space-y-4">
              <h1 className="max-w-2xl font-display text-5xl font-semibold tracking-tight text-foreground sm:text-6xl lg:text-7xl">
                A premium sanctuary for ritual objects, gifting, and heritage-led living.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
                KumbhMelaStore brings together hand-finished brass, marble-led
                sanctums, and ceremonial gifting pieces in a calm, editorial storefront
                designed to feel timeless.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link to={routes.collections}>
                Explore collections <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to={routes.auth.signUp}>Start gifting</Link>
            </Button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {heroStats.map((stat) => (
              <Card key={stat.label} className="bg-card/80">
                <CardContent className="space-y-1 p-5">
                  <p className="font-display text-2xl font-semibold text-foreground">
                    {stat.value}
                  </p>
                  <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
                    {stat.label}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </Reveal>

        <Reveal delay={0.12} className="relative">
          <Card className="group overflow-hidden p-0 shadow-[var(--shadow-elevated)]">
            <div className="relative aspect-[4/5] overflow-hidden">
              <CloudinaryImage
                publicId="sample"
                alt="Editorial spiritual product photography placeholder"
                className="h-full w-full object-cover"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
              <div className="absolute inset-x-5 bottom-5 rounded-[var(--radius-card)] border border-border/80 bg-card/90 p-5 shadow-[var(--shadow-soft)] backdrop-blur-md">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                      Editorial curation
                    </p>
                    <p className="mt-2 font-display text-3xl font-semibold tracking-tight">
                      Calm, premium, and ready to gift.
                    </p>
                  </div>
                  <BrandMark size="sm" />
                </div>
                <Separator className="my-4" />
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">Brass</Badge>
                  <Badge variant="outline">Marble</Badge>
                  <Badge variant="outline">Saffron</Badge>
                  <Badge variant="outline">Temple-led</Badge>
                </div>
              </div>
            </div>
          </Card>
        </Reveal>
      </section>

      <Reveal>
        <section className="space-y-8">
          <SectionHeading
            eyebrow="Featured collections"
            title="Curated for gifting, rituals, and everyday devotion."
            description="Each collection is built around a distinctive material mood so the shopping experience feels both inspired and easy to navigate."
          />
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {featuredCollections.map((collection) => (
              <CollectionCard
                key={collection.slug}
                collection={collection}
                href={routes.collectionDetail(collection.slug)}
              />
            ))}
          </div>
        </section>
      </Reveal>

      <Reveal>
        <section className="space-y-8">
          <SectionHeading
            eyebrow="Best sellers"
            title="The pieces our customers return to again and again."
            description="Balanced price points, premium finishes, and gifting-ready packaging make these products strong starting points for the catalog."
          />
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {bestSellers.map((product) => (
              <ProductCard
                key={product.slug}
                product={product}
                href={routes.productDetail(product.slug)}
              />
            ))}
          </div>
        </section>
      </Reveal>

      <Reveal>
        <section className="grid gap-6 lg:grid-cols-3">
          {authenticityPillars.map((pillar, index) => (
            <Card key={pillar.title} className="shadow-[var(--shadow-soft)]">
              <CardContent className="space-y-4 p-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
                  {index === 0 ? (
                    <ShieldCheck className="h-5 w-5" aria-hidden="true" />
                  ) : index === 1 ? (
                    <Sparkles className="h-5 w-5" aria-hidden="true" />
                  ) : (
                    <Truck className="h-5 w-5" aria-hidden="true" />
                  )}
                </div>
                <div className="space-y-2">
                  <h3 className="font-display text-2xl font-semibold tracking-tight">
                    {pillar.title}
                  </h3>
                  <p className="text-sm leading-6 text-muted-foreground">
                    {pillar.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </section>
      </Reveal>

      <Reveal>
        <section className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div className="space-y-5">
            <SectionHeading
              eyebrow="Temple heritage"
              title="Inspired by architecture, morning light, and sacred water."
              description="The visual language is calm by design: marble, sandstone, brass, and saffron create a premium system that feels grounded, not decorative."
            />
            <div className="space-y-4">
              {templeHeritageMoments.map((moment) => (
                <Card key={moment.title} className="bg-card/80">
                  <CardContent className="p-5">
                    <p className="font-medium text-foreground">{moment.title}</p>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      {moment.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <Card className="overflow-hidden p-0 shadow-[var(--shadow-elevated)]">
            <div className="grid h-full gap-0 lg:grid-cols-[0.78fr_1fr]">
              <div className="flex flex-col justify-between bg-surface px-6 py-8 sm:px-8">
                <div className="space-y-3">
                  <Badge variant="premium">Morning rituals</Badge>
                  <h3 className="font-display text-3xl font-semibold tracking-tight">
                    Quiet moments made tangible.
                  </h3>
                  <p className="text-sm leading-6 text-muted-foreground">
                    Create a small corner of focus with pieces that feel ceremonial and
                    serene in everyday spaces.
                  </p>
                </div>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />
                    Premium finishing details
                  </p>
                  <p className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-primary" aria-hidden="true" />
                    Gift-ready packaging
                  </p>
                  <p className="flex items-center gap-2">
                    <Truck className="h-4 w-4 text-primary" aria-hidden="true" />
                    Fast dispatch for festival season
                  </p>
                </div>
              </div>
              <CloudinaryImage
                publicId="sample"
                alt="Sacred home sanctum placeholder"
                className="h-full min-h-[22rem] w-full object-cover"
              />
            </div>
          </Card>
        </section>
      </Reveal>

      <Reveal>
        <section className="space-y-8">
          <SectionHeading
            eyebrow="Gift boxes"
            title="Curated gifting that arrives ceremonial and ready."
            description="These gift boxes balance value, symbolism, and presentation so they work across weddings, housewarmings, and festival gifting."
          />
          <div className="grid gap-6 md:grid-cols-3">
            {giftBoxes.map((giftBox) => (
              <Card key={giftBox.title} className="shadow-[var(--shadow-soft)]">
                <CardContent className="space-y-4 p-6">
                  <div className="flex items-center justify-between gap-4">
                    <Badge variant="premium">Gift box</Badge>
                    <p className="text-sm font-medium text-primary">{giftBox.price}</p>
                  </div>
                  <h3 className="font-display text-2xl font-semibold tracking-tight">
                    {giftBox.title}
                  </h3>
                  <p className="text-sm leading-6 text-muted-foreground">
                    {giftBox.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </Reveal>

      <Reveal>
        <section className="space-y-8">
          <SectionHeading
            eyebrow="Testimonials"
            title="Loved for presentation, quality, and the feeling it creates."
            description="The store should feel premium before the product even arrives. These voices reflect the experience we want to scale."
          />
          <div className="grid gap-6 lg:grid-cols-3">
            {testimonials.map((testimonial) => (
              <Card key={testimonial.author} className="shadow-[var(--shadow-soft)]">
                <CardContent className="space-y-5 p-6">
                  <p className="font-display text-2xl leading-8 text-foreground">
                    “{testimonial.quote}”
                  </p>
                  <div>
                    <p className="font-medium text-foreground">{testimonial.author}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </Reveal>

      <Reveal>
        <section className="space-y-8">
          <SectionHeading
            eyebrow="From the journal"
            title="Editorial notes on ritual, materials, and gifting."
            description="The blog gives the brand room to teach, inspire, and stay culturally grounded."
          />
          <div className="grid gap-6 md:grid-cols-3">
            {blogPosts.map((post) => (
              <Card key={post.title} className="shadow-[var(--shadow-soft)]">
                <CardContent className="space-y-4 p-6">
                  <Badge variant="outline">{post.readTime}</Badge>
                  <h3 className="font-display text-2xl font-semibold tracking-tight">
                    {post.title}
                  </h3>
                  <p className="text-sm leading-6 text-muted-foreground">{post.excerpt}</p>
                  <Button asChild variant="ghost" className="px-0">
                    <Link to={routes.blog}>Read more</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </Reveal>

      <Reveal>
        <section className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
          <Card className="shadow-[var(--shadow-elevated)]">
            <CardContent className="space-y-5 p-6 sm:p-8">
              <div className="space-y-2">
                <Badge variant="premium">Newsletter</Badge>
                <h3 className="font-display text-3xl font-semibold tracking-tight">
                  Calm updates, editorial drops, and festival gifting notes.
                </h3>
                <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                  Join for product stories, new arrivals, and occasional ritual design
                  notes from the KumbhMelaStore studio.
                </p>
              </div>
              <form
                className="flex flex-col gap-3 sm:flex-row"
                onSubmit={(event) => {
                  event.preventDefault()
                  toast.success('You are on the list.')
                }}
              >
                <Input
                  type="email"
                  placeholder="Enter your email"
                  aria-label="Email address"
                />
                <Button type="submit" className="sm:w-auto">
                  <Mail className="h-4 w-4" aria-hidden="true" />
                  Subscribe
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="grid gap-3">
            <Button asChild variant="outline" size="lg">
              <Link to={routes.contact}>Contact the studio</Link>
            </Button>
            <Button asChild variant="premium" size="lg">
              <Link to={routes.dashboard.home}>View your account</Link>
            </Button>
          </div>
        </section>
      </Reveal>
    </div>
  )
}
