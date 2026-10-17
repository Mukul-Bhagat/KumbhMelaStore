import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowRight, Clock3, ReceiptText } from 'lucide-react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'

import { EmptyState } from '@/components/ui/empty-state'
import { LoadingScreen } from '@/components/layout/loading-screen'
import { SectionHeading } from '@/components/layout/section-heading'
import { Seo } from '@/components/layout/seo'
import { Alert } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { queryKeys } from '@/shared/api/keys'
import { getSupabaseBrowserClient } from '@/shared/api/supabase'
import { useAuth } from '@/shared/auth/provider'
import { routes } from '@/shared/config/routes'
import { useLocale } from '@/shared/hooks/use-locale'
import { useTranslate } from '@/shared/cms/hooks'
import { formatCurrency, formatDate } from '@/shared/lib/format'
import type { Database, Json } from '@/shared/types/database'

type OrderRow = Database['public']['Tables']['orders']['Row']
type OrderItemRow = Database['public']['Tables']['order_items']['Row']
type OrderEventRow = Database['public']['Tables']['order_status_events']['Row']
type DashboardOrder = Pick<
  OrderRow,
  | 'id'
  | 'order_number'
  | 'public_tracking_code'
  | 'status'
  | 'payment_status'
  | 'payment_method'
  | 'currency'
  | 'grand_total'
  | 'shipping_address_snapshot'
  | 'tracking_summary'
  | 'created_at'
> & {
  items: OrderItemRow[]
  events: OrderEventRow[]
}

async function fetchDashboardOrders(userId: string): Promise<DashboardOrder[]> {
  const supabase = getSupabaseBrowserClient()
  const { data: orders, error } = await supabase
    .from('orders')
    .select(
      'id, order_number, public_tracking_code, status, payment_status, payment_method, currency, grand_total, shipping_address_snapshot, tracking_summary, created_at',
    )
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    throw error
  }

  if (!orders?.length) {
    return []
  }

  const orderIds = orders.map((order) => order.id)
  const [itemsResult, eventsResult] = await Promise.all([
    supabase
      .from('order_items')
      .select('id, order_id, product_id, variant_id, product_snapshot, quantity, unit_price, line_total, currency, created_at, updated_at')
      .in('order_id', orderIds)
      .order('created_at', { ascending: true }),
    supabase
      .from('order_status_events')
      .select('id, order_id, status, note_key, event_at, metadata, created_at, updated_at')
      .in('order_id', orderIds)
      .order('event_at', { ascending: true }),
  ])

  if (itemsResult.error) {
    throw itemsResult.error
  }
  if (eventsResult.error) {
    throw eventsResult.error
  }

  const itemsByOrder = new Map<string, OrderItemRow[]>()
  for (const item of itemsResult.data ?? []) {
    const items = itemsByOrder.get(item.order_id) ?? []
    items.push(item)
    itemsByOrder.set(item.order_id, items)
  }

  const eventsByOrder = new Map<string, OrderEventRow[]>()
  for (const event of eventsResult.data ?? []) {
    const events = eventsByOrder.get(event.order_id) ?? []
    events.push(event)
    eventsByOrder.set(event.order_id, events)
  }

  return orders.map((order) => ({
    ...order,
    items: itemsByOrder.get(order.id) ?? [],
    events: eventsByOrder.get(order.id) ?? [],
  }))
}

function readSnapshotString(snapshot: Json | null, key: string) {
  if (!snapshot || typeof snapshot !== 'object' || Array.isArray(snapshot)) {
    return ''
  }
  const value = snapshot[key]
  return typeof value === 'string' ? value : ''
}

function statusVariant(status: string) {
  if (status === 'delivered' || status === 'paid') return 'premium' as const
  if (status === 'cancelled' || status === 'failed' || status === 'refunded') return 'error' as const
  if (status === 'draft' || status === 'pending') return 'muted' as const
  return 'outline' as const
}

function OrderCard({
  order,
  locale,
  onCancel,
  cancelling,
}: {
  order: DashboardOrder
  locale: 'hi' | 'en'
  onCancel: (orderId: string) => void
  cancelling: boolean
}) {
  const { t } = useTranslate()
  const address = [
    readSnapshotString(order.shipping_address_snapshot, 'line1'),
    readSnapshotString(order.shipping_address_snapshot, 'line2'),
    [
      readSnapshotString(order.shipping_address_snapshot, 'city'),
      readSnapshotString(order.shipping_address_snapshot, 'state'),
      readSnapshotString(order.shipping_address_snapshot, 'postal_code'),
    ].filter(Boolean).join(', '),
  ].filter(Boolean).join(', ')
  const canCancel =
    ['placed', 'confirmed'].includes(order.status) &&
    ['pending', 'cash_on_delivery'].includes(order.payment_status)

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
              {formatDate(order.created_at, locale === 'hi' ? 'hi-IN' : 'en-IN')}
            </p>
          </div>
          <Badge variant={statusVariant(order.status)}>
            {t(`dashboard.order_status.${order.status}`, order.status.replaceAll('_', ' '))}
          </Badge>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-[var(--radius-card)] border border-border bg-surface p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">{t('dashboard.total', 'Total')}</p>
            <p className="mt-2 font-display text-xl font-semibold">{formatCurrency(order.grand_total, order.currency, locale === 'hi' ? 'hi-IN' : 'en-IN')}</p>
          </div>
          <div className="rounded-[var(--radius-card)] border border-border bg-surface p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">{t('dashboard.payment', 'Payment')}</p>
            <p className="mt-2 font-display text-xl font-semibold">
              {t(`dashboard.payment_status.${order.payment_status}`, order.payment_status.replaceAll('_', ' '))}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{order.payment_method.replaceAll('_', ' ')}</p>
          </div>
          <div className="rounded-[var(--radius-card)] border border-border bg-surface p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">{t('dashboard.status', 'Status')}</p>
            <p className="mt-2 font-display text-xl font-semibold">
              {t(`dashboard.order_status.${order.status}`, order.status.replaceAll('_', ' '))}
            </p>
          </div>
        </div>

        <div className="space-y-4 rounded-[var(--radius-card)] border border-border p-4">
          <div>
            <h3 className="font-semibold">Delivery address</h3>
            <p className="text-sm text-muted-foreground">
              {readSnapshotString(order.shipping_address_snapshot, 'recipient_name')}
              {address ? ` · ${address}` : ''}
            </p>
          </div>
          <div>
            <h3 className="font-semibold">Items ({order.items.length})</h3>
            {order.items.length ? (
              <ul className="mt-2 space-y-2 text-sm">
                {order.items.map((item) => (
                  <li key={item.id} className="flex flex-wrap justify-between gap-2">
                    <span>
                      {readSnapshotString(item.product_snapshot, 'name') || 'Product'}
                      {readSnapshotString(item.product_snapshot, 'variant_title')
                        ? ` · ${readSnapshotString(item.product_snapshot, 'variant_title')}`
                        : ''} × {item.quantity}
                    </span>
                    <span>{formatCurrency(Number(item.line_total), item.currency, locale === 'hi' ? 'hi-IN' : 'en-IN')}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">No item details are available for this order.</p>
            )}
          </div>
          {order.events.length ? (
            <div>
              <h3 className="font-semibold">Order history</h3>
              <ol className="mt-2 space-y-2 text-sm">
                {order.events.map((event) => (
                  <li key={event.id} className="flex flex-wrap justify-between gap-2">
                    <span>{event.note_key || event.status.replaceAll('_', ' ')}</span>
                    <time className="text-muted-foreground">
                      {new Date(event.event_at).toLocaleString(locale === 'hi' ? 'hi-IN' : 'en-IN')}
                    </time>
                  </li>
                ))}
              </ol>
            </div>
          ) : null}
          {order.tracking_summary && typeof order.tracking_summary === 'object' && !Array.isArray(order.tracking_summary) ? (
            <p className="text-sm text-muted-foreground">
              {readSnapshotString(order.tracking_summary, 'summary')}
            </p>
          ) : null}
          <p className="text-xs text-muted-foreground">
            Tracking code: <span className="break-all">{order.public_tracking_code}</span>
          </p>
        </div>

        {canCancel ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={cancelling}
            onClick={() => onCancel(order.id)}
          >
            {cancelling ? 'Cancelling…' : 'Cancel order'}
          </Button>
        ) : null}
      </CardContent>
    </Card>
  )
}

export function Component() {
  const auth = useAuth()
  const locale = useLocale()
  const { t } = useTranslate()
  const queryClient = useQueryClient()
  const userId = auth.user?.id ?? ''
  const orders = useQuery({
    queryKey: [...queryKeys.dashboard.all, 'orders', userId] as const,
    queryFn: () => fetchDashboardOrders(userId),
    enabled: Boolean(userId),
  })
  const cancelOrder = useMutation({
    mutationFn: async (orderId: string) => {
      const { error } = await getSupabaseBrowserClient().rpc('cancel_order', {
        p_order_id: orderId,
      })
      if (error) throw error
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: [...queryKeys.dashboard.all, 'orders', userId] }),
        queryClient.invalidateQueries({ queryKey: queryKeys.orderTracking }),
      ])
      toast.success('Order cancelled')
    },
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

      {cancelOrder.error ? (
        <Alert
          title="Unable to cancel order"
          description={cancelOrder.error instanceof Error ? cancelOrder.error.message : 'Supabase could not cancel this order.'}
          variant="error"
        />
      ) : null}

      {orders.data && orders.data.length > 0 ? (
        <div className="space-y-4">
          {orders.data.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              locale={locale}
              onCancel={(orderId) => cancelOrder.mutate(orderId)}
              cancelling={cancelOrder.isPending}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title={t('dashboard.no_orders', 'No orders yet')}
          description={t('dashboard.orders_empty_description', 'Orders you place will appear here with their item and delivery details.')}
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
