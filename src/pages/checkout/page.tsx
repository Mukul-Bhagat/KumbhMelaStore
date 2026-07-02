import { Link } from 'react-router-dom'

import { CheckoutForm } from '@/features/checkout/ui/checkout-form'
import { Reveal } from '@/components/layout/reveal'
import { Seo } from '@/components/layout/seo'
import { SectionHeading } from '@/components/layout/section-heading'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { bestSellers } from '@/shared/data/site-content'
import { routes } from '@/shared/config/routes'
import { formatCurrency } from '@/shared/lib/format'

export function Component() {
  const items = bestSellers.slice(0, 2)
  const subtotal = items.reduce((sum, item) => sum + item.price, 0)

  return (
    <div className="space-y-16">
      <Seo title="Checkout" description="Complete your KumbhMelaStore order." />

      <Reveal>
        <section className="space-y-5">
          <Badge variant="premium">Secure checkout</Badge>
          <div className="space-y-4">
            <h1 className="font-display text-5xl font-semibold tracking-tight sm:text-6xl">
              A calm checkout flow with clear steps and premium details.
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
              The checkout experience is designed to feel reassuring, with visible
              totals, clear form structure, and brand-led visual hierarchy.
            </p>
          </div>
        </section>
      </Reveal>

      <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <Reveal>
          <Card className="shadow-[var(--shadow-elevated)]">
            <CardContent className="space-y-6 p-6 sm:p-8">
              <SectionHeading
                eyebrow="Delivery details"
                title="Tell us where to send the ritual set."
                description="This form is built with React Hook Form and Zod so validation stays predictable and maintainable."
              />
              <CheckoutForm />
            </CardContent>
          </Card>
        </Reveal>

        <Reveal delay={0.08}>
          <div className="space-y-6">
            <Card className="shadow-[var(--shadow-soft)]">
              <CardContent className="space-y-4 p-6">
                <h2 className="font-display text-3xl font-semibold tracking-tight">
                  Order summary
                </h2>
                <div className="space-y-4">
                  {items.map((item) => (
                    <div key={item.slug} className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-medium text-foreground">{item.name}</p>
                        <p className="text-sm text-muted-foreground">{item.category}</p>
                      </div>
                      <p className="font-medium">{formatCurrency(item.price)}</p>
                    </div>
                  ))}
                </div>
                <div className="rounded-[var(--radius-field)] border border-border bg-surface/70 p-4 text-sm leading-6 text-muted-foreground">
                  Packaging, gift wrapping, and safe handling are included in the
                  KumbhMelaStore checkout flow.
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-display text-2xl font-semibold">Subtotal</span>
                  <span className="font-display text-2xl font-semibold">
                    {formatCurrency(subtotal)}
                  </span>
                </div>
                <Button asChild className="w-full">
                  <Link to={routes.cart}>Review cart</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="shadow-[var(--shadow-soft)]">
              <CardContent className="space-y-3 p-6">
                <Badge variant="premium">Delivery promise</Badge>
                <p className="text-sm leading-6 text-muted-foreground">
                  Fast dispatch, careful packaging, and straightforward delivery updates
                  help the experience feel premium from start to finish.
                </p>
              </CardContent>
            </Card>
          </div>
        </Reveal>
      </section>
    </div>
  )
}
