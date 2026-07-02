import { Link } from 'react-router-dom'

import { Reveal } from '@/components/layout/reveal'
import { Seo } from '@/components/layout/seo'
import { SectionHeading } from '@/components/layout/section-heading'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar } from '@/components/ui/avatar'
import {
  dashboardOrders,
  dashboardStats,
  profile,
  savedAddresses,
} from '@/shared/data/site-content'
import { routes } from '@/shared/config/routes'
import { formatCurrency, formatDate } from '@/shared/lib/format'

export function Component() {
  const latestOrder = dashboardOrders[0]

  return (
    <div className="space-y-16">
      <Seo title="Dashboard" description="Your KumbhMelaStore account overview." />

      <Reveal>
        <section className="space-y-5">
          <Badge variant="premium">Account overview</Badge>
          <div className="space-y-4">
            <h1 className="font-display text-5xl font-semibold tracking-tight sm:text-6xl">
              A calm account space for orders, addresses, and favorites.
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
              The dashboard balances editorial spacing with direct access to the
              customer’s most important account actions.
            </p>
          </div>
        </section>
      </Reveal>

      <Reveal>
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {dashboardStats.map((stat) => (
            <Card key={stat.label} className="shadow-[var(--shadow-soft)]">
              <CardContent className="space-y-1 p-5">
                <p className="font-display text-3xl font-semibold">{stat.value}</p>
                <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                  {stat.label}
                </p>
              </CardContent>
            </Card>
          ))}
        </section>
      </Reveal>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Reveal>
          <Card className="shadow-[var(--shadow-elevated)]">
            <CardContent className="space-y-6 p-6 sm:p-8">
              <SectionHeading
                eyebrow="Latest order"
                title={latestOrder?.number ?? '#KM-00000'}
                description={`Placed on ${formatDate(latestOrder?.date ?? new Date())} and currently ${(latestOrder?.status ?? 'Placed').toLowerCase()}.`}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-[var(--radius-field)] border border-border bg-background p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                    Total
                  </p>
                  <p className="mt-2 font-display text-3xl font-semibold">
                    {formatCurrency(latestOrder?.total ?? 0)}
                  </p>
                </div>
                <div className="rounded-[var(--radius-field)] border border-border bg-background p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                    Payment
                  </p>
                  <p className="mt-2 font-display text-3xl font-semibold">
                    {latestOrder?.payment ?? 'Prepaid'}
                  </p>
                </div>
              </div>
              <Button asChild>
                <Link to={routes.dashboard.orders}>View all orders</Link>
              </Button>
            </CardContent>
          </Card>
        </Reveal>

        <Reveal delay={0.08}>
          <div className="space-y-6">
            <Card className="shadow-[var(--shadow-soft)]">
              <CardContent className="space-y-4 p-6">
                <div className="flex items-center gap-3">
                  <Avatar fallback={profile.avatarInitials} size="lg" />
                  <div>
                    <p className="font-medium text-foreground">{profile.name}</p>
                    <p className="text-sm text-muted-foreground">{profile.tier}</p>
                  </div>
                </div>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>{profile.email}</p>
                  <p>{profile.location}</p>
                </div>
                <Button asChild variant="outline" className="w-full">
                  <Link to={routes.dashboard.profile}>Edit profile</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="shadow-[var(--shadow-soft)]">
              <CardContent className="space-y-4 p-6">
                <h2 className="font-display text-3xl font-semibold tracking-tight">
                  Saved addresses
                </h2>
                <div className="space-y-3">
                  {savedAddresses.map((address) => (
                    <div
                      key={address.label}
                      className="rounded-[var(--radius-field)] border border-border bg-surface/70 p-4"
                    >
                      <p className="font-medium text-foreground">{address.label}</p>
                      <p className="text-sm leading-6 text-muted-foreground">
                        {address.value}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </Reveal>
      </section>
    </div>
  )
}
