import { CheckCircle2, PackageCheck, Truck, Search } from 'lucide-react'
import { useState } from 'react'

import { Reveal } from '@/components/layout/reveal'
import { Seo } from '@/components/layout/seo'
import { SectionHeading } from '@/components/layout/section-heading'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { trackOrderTimeline } from '@/shared/data/site-content'
import { formatDate } from '@/shared/lib/format'

export function Component() {
  const [orderNumber, setOrderNumber] = useState('#KM-20488')

  return (
    <div className="space-y-16">
      <Seo title="Track Order" description="Track your KumbhMelaStore order." />

      <Reveal>
        <section className="space-y-5">
          <Badge variant="premium">Track order</Badge>
          <div className="space-y-4">
            <h1 className="font-display text-5xl font-semibold tracking-tight sm:text-6xl">
              Follow your order from studio to doorstep.
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
              Enter your order number to view the current status, delivery stage, and
              expected arrival window.
            </p>
          </div>
        </section>
      </Reveal>

      <section className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
        <Reveal>
          <Card className="shadow-[var(--shadow-elevated)]">
            <CardContent className="space-y-5 p-6">
              <SectionHeading
                eyebrow="Lookup"
                title="Find your shipment"
                description="Use the number from your confirmation email or account page."
              />
              <div className="space-y-4">
                <Input
                  value={orderNumber}
                  onChange={(event) => setOrderNumber(event.target.value)}
                  placeholder="#KM-20488"
                />
                <Button className="w-full">
                  <Search className="h-4 w-4" aria-hidden="true" />
                  Track order
                </Button>
              </div>
            </CardContent>
          </Card>
        </Reveal>

        <Reveal delay={0.08}>
          <Card className="shadow-[var(--shadow-soft)]">
            <CardContent className="space-y-6 p-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                    Current order
                  </p>
                  <h2 className="font-display text-3xl font-semibold tracking-tight">
                    {orderNumber}
                  </h2>
                </div>
                <Badge variant="premium">In transit</Badge>
              </div>

              <Separator />

              <div className="space-y-4">
                {trackOrderTimeline.map((step, index) => (
                  <div key={step.step} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div
                        className={`grid h-10 w-10 place-items-center rounded-full border ${
                          step.complete
                            ? 'border-success/30 bg-success/10 text-success'
                            : 'border-border bg-muted text-muted-foreground'
                        }`}
                      >
                        {index === 0 ? (
                          <PackageCheck className="h-4 w-4" aria-hidden="true" />
                        ) : index === 1 ? (
                          <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                        ) : (
                          <Truck className="h-4 w-4" aria-hidden="true" />
                        )}
                      </div>
                      {index !== trackOrderTimeline.length - 1 ? (
                        <div className="h-full w-px bg-border" />
                      ) : null}
                    </div>
                    <div className="pb-6">
                      <p className="font-medium text-foreground">{step.step}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(step.date)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </Reveal>
      </section>
    </div>
  )
}
