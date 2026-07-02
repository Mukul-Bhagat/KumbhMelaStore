import { Reveal } from '@/components/layout/reveal'
import { Seo } from '@/components/layout/seo'
import { SectionHeading } from '@/components/layout/section-heading'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { dashboardOrders } from '@/shared/data/site-content'
import { formatCurrency, formatDate } from '@/shared/lib/format'

const statusVariants = {
  Delivered: 'success',
  'In Transit': 'warning',
  Packed: 'premium',
  Returned: 'error',
  Placed: 'outline',
} as const

export function Component() {
  return (
    <div className="space-y-16">
      <Seo title="Orders" description="View your order history." />

      <Reveal>
        <SectionHeading
          eyebrow="Orders"
          title="Recent purchases with clear status and totals."
          description="Order history benefits from card-based rows here so the layout stays elegant and responsive without a dense table."
        />
      </Reveal>

      <Reveal>
        <div className="space-y-4">
          {dashboardOrders.map((order) => (
            <Card key={order.id} className="shadow-[var(--shadow-soft)]">
              <CardContent className="grid gap-4 p-6 lg:grid-cols-[1.2fr_0.9fr_0.7fr] lg:items-center">
                <div className="space-y-1">
                  <p className="font-medium text-foreground">{order.number}</p>
                  <p className="text-sm text-muted-foreground">
                    Placed on {formatDate(order.date)} · {order.itemCount} items
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="font-display text-2xl font-semibold">
                    {formatCurrency(order.total)}
                  </p>
                </div>
                <div className="flex justify-start lg:justify-end">
                  <Badge
                    variant={statusVariants[order.status]}
                    className="w-fit"
                  >
                    {order.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </Reveal>
    </div>
  )
}
