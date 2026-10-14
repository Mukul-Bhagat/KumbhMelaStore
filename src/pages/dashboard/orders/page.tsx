import { useQuery } from '@tanstack/react-query'
import { ArrowRight, Clock3, ReceiptText } from 'lucide-react'
import { Link } from 'react-router-dom'

import { EmptyState } from '@/components/ui/empty-state'
import { LoadingScreen } from '@/components/layout/loading-screen'
import { SectionHeading } from '@/components/layout/section-heading'
import { Seo } from '@/components/layout/seo'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { queryKeys } from '@/shared/api/keys'
import { getSupabaseBrowserClient } from '@/shared/api/supabase'
import { useAuth } from '@/shared/auth/provider'
import { routes } from '@/shared/config/routes'
import { useLocale } from '@/shared/hooks/use-locale'
import { useTranslate } from '@/shared/cms/hooks'
import { formatCurrency } from '@/shared/lib/format'

type DashboardOrder = {
  id: string
  order_number: string
  status: string
  payment_status: string
  grand_total: number
  created_at: string
}

async function fetchDashboardOrders(userId: string) {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase
    .from('orders')
    .select('id, order_number, status, payment_status, grand_total, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    throw error
  }

  return (data ?? []) as DashboardOrder[]
}

function OrderCard({ order, locale }: { order: DashboardOrder; locale: 'hi' | 'en' }) {
  const { t } = useTranslate()

  return (
    <Card className="shadow-[var(--shadow-soft)]">
      <CardContent className="space-y-5 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <ReceiptText className="h-5 w-5 text-primary" />
              <p className="font-display text-2xl font-semibold tracking-tight">
                {order.order_number}
              </p>
            </div>
            <p className="text-sm text-muted-foreground">
              {t('dashboard.order_placed_on', 'Placed on')}{' '}
              {new Date(order.created_at).toLocaleDateString(locale === 'hi' ? 'hi-IN' : 'en-IN')}
            </p>
          </div>
          <Badge variant={order.status === 'delivered' ? 'premium' : 'outline'}>
            {t(`dashboard.order_status.${order.status}`, order.status.replaceAll('_', ' '))}
          </Badge>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-[var(--radius-card)] border border-border bg-surface p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">{t('dashboard.total', 'Total')}</p>
            <p className="mt-2 font-display text-xl font-semibold">{formatCurrency(order.grand_total)}</p>
          </div>
          <div className="rounded-[var(--radius-card)] border border-border bg-surface p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">{t('dashboard.payment', 'Payment')}</p>
            <p className="mt-2 font-display text-xl font-semibold">
              {t(`dashboard.payment_status.${order.payment_status}`, order.payment_status.replaceAll('_', ' '))}
            </p>
          </div>
          <div className="rounded-[var(--radius-card)] border border-border bg-surface p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">{t('dashboard.status', 'Status')}</p>
            <p className="mt-2 font-display text-xl font-semibold">
              {t(`dashboard.order_status.${order.status}`, order.status.replaceAll('_', ' '))}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function Component() {
  const auth = useAuth()
  const locale = useLocale()
  const { t } = useTranslate()
  const userId = auth.user?.id ?? ''
  const orders = useQuery({
    queryKey: [...queryKeys.dashboard.all, 'orders', userId] as const,
    queryFn: () => fetchDashboardOrders(userId),
    enabled: Boolean(userId),
  })

  if (orders.isLoading) {
    return <LoadingScreen className="min-h-[60svh]" />
  }

  if (orders.error) {
    return (
      <EmptyState
        title={t('dashboard.orders_load_error', 'Unable to load orders')}
        description={t('dashboard.orders_load_error_description', 'Supabase could not load your order history.')}
        actionLabel={t('dashboard.retry', 'Retry')}
        onAction={() => {
          void orders.refetch()
        }}
      />
    )
  }

  return (
    <div className="space-y-8">
      <Seo
        title={t('dashboard.orders', 'Orders')}
        description={t('dashboard.orders_seo_description', 'Your live Supabase order history.')}
      />
      <SectionHeading
        eyebrow={t('dashboard.label', 'Dashboard')}
        title={t('dashboard.orders', 'Orders')}
        description={t('dashboard.orders_description', 'Review order numbers, payment state, and fulfillment status from the database.')}
      />

      {orders.data && orders.data.length > 0 ? (
        <div className="space-y-4">
          {orders.data.map((order) => (
            <OrderCard key={order.id} order={order} locale={locale} />
          ))}
        </div>
      ) : (
        <EmptyState
          title={t('dashboard.no_orders', 'No orders yet')}
          description={t('dashboard.orders_empty_description', 'Once orders are created in Supabase, they will appear here automatically.')}
          actionLabel={t('dashboard.track_order', 'Track order')}
          onAction={() => {
            window.location.assign(routes.forLocale(locale, 'track-order'))
          }}
        />
      )}

      <Card className="shadow-[var(--shadow-soft)]">
        <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Clock3 className="h-5 w-5 text-primary" />
            <p className="text-sm text-muted-foreground">
              {t('dashboard.tracking_note', 'Order tracking stays public through the RPC projection, while full order details remain protected.')}
            </p>
          </div>
          <Button asChild variant="outline">
            <Link to={routes.forLocale(locale, 'track-order')}>
              {t('dashboard.track_an_order', 'Track an order')}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
