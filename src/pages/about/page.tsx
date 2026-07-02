import { ArrowRight, Leaf, ShieldCheck, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'

import { CloudinaryImage } from '@/components/media/cloudinary-image'
import { Reveal } from '@/components/layout/reveal'
import { Seo } from '@/components/layout/seo'
import { SectionHeading } from '@/components/layout/section-heading'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { templeHeritageMoments, authenticityPillars } from '@/shared/data/site-content'
import { routes } from '@/shared/config/routes'

export function Component() {
  return (
    <div className="space-y-16">
      <Seo title="About" description="Learn the story behind KumbhMelaStore." />

      <Reveal>
        <section className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div className="space-y-6">
            <Badge variant="premium">Our story</Badge>
            <div className="space-y-4">
              <h1 className="font-display text-5xl font-semibold tracking-tight sm:text-6xl">
                Designed to honor ritual, gifting, and the calm of heritage.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
                KumbhMelaStore is a premium spiritual commerce foundation built to feel
                timeless, trustworthy, and quietly luxurious from the first interaction.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild>
                <Link to={routes.collections}>
                  Explore the shop <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link to={routes.contact}>Speak with us</Link>
              </Button>
            </div>
          </div>

          <Card className="overflow-hidden p-0 shadow-[var(--shadow-elevated)]">
            <div className="grid gap-0 lg:grid-cols-[0.78fr_1fr]">
              <div className="flex flex-col justify-between bg-surface px-6 py-8 sm:px-8">
                <div className="space-y-3">
                  <Badge variant="premium">Heritage-led</Badge>
                  <h2 className="font-display text-3xl font-semibold tracking-tight">
                    Spiritual commerce, shaped with restraint.
                  </h2>
                  <p className="text-sm leading-6 text-muted-foreground">
                    The visual language takes cues from marble, copper, brass, and soft
                    morning light instead of loud marketplace conventions.
                  </p>
                </div>
                <div className="space-y-3 text-sm text-muted-foreground">
                  <p className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-primary" aria-hidden="true" />
                    Trust-first product curation
                  </p>
                  <p className="flex items-center gap-2">
                    <Leaf className="h-4 w-4 text-primary" aria-hidden="true" />
                    Materials chosen for longevity
                  </p>
                  <p className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />
                    A calm, premium shopping flow
                  </p>
                </div>
              </div>
              <CloudinaryImage
                publicId="sample"
                alt="Premium spiritual brand photography placeholder"
                className="h-full min-h-[22rem] w-full object-cover"
              />
            </div>
          </Card>
        </section>
      </Reveal>

      <Reveal>
        <section className="space-y-8">
          <SectionHeading
            eyebrow="Why we exist"
            title="To make sacred objects feel modern, usable, and cherished."
            description="The foundations emphasize trust, simplicity, and a premium visual identity so future product lines can scale without a redesign."
          />
          <div className="grid gap-6 lg:grid-cols-3">
            {authenticityPillars.map((pillar) => (
              <Card key={pillar.title} className="shadow-[var(--shadow-soft)]">
                <CardContent className="space-y-4 p-6">
                  <h3 className="font-display text-2xl font-semibold tracking-tight">
                    {pillar.title}
                  </h3>
                  <p className="text-sm leading-6 text-muted-foreground">
                    {pillar.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </Reveal>

      <Reveal>
        <section className="grid gap-6 lg:grid-cols-3">
          {templeHeritageMoments.map((moment) => (
            <Card key={moment.title} className="shadow-[var(--shadow-soft)]">
              <CardContent className="space-y-3 p-6">
                <Badge variant="outline">Design note</Badge>
                <h3 className="font-display text-2xl font-semibold tracking-tight">
                  {moment.title}
                </h3>
                <p className="text-sm leading-6 text-muted-foreground">
                  {moment.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </section>
      </Reveal>
    </div>
  )
}
