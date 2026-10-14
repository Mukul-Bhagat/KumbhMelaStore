import { useQuery, useQueryClient } from '@tanstack/react-query'

import { LoadingScreen } from '@/components/layout/loading-screen'
import { SectionHeading } from '@/components/layout/section-heading'
import { Seo } from '@/components/layout/seo'
import { Badge } from '@/components/ui/badge'
import { ErrorState } from '@/components/ui/error-state'
import { AdminResourcePanel, type CrudField } from '@/features/admin/ui/admin-resource-panel'
import { queryKeys } from '@/shared/api/keys'
import { getSupabaseBrowserClient } from '@/shared/api/supabase'
import type { Database, Json } from '@/shared/types/database'

type OrderRow = Database['public']['Tables']['orders']['Row'] & {
  items: Database['public']['Tables']['order_items']['Row'][]
  events: Database['public']['Tables']['order_status_events']['Row'][]
}
type OrderStatus = OrderRow['status']
type PaymentStatus = OrderRow['payment_status']

const statusOptions: Array<{ label: string; value: OrderStatus }> = [
  { label: 'Draft', value: 'draft' },
  { label: 'Placed', value: 'placed' },
  { label: 'Confirmed', value: 'confirmed' },
  { label: 'Packed', value: 'packed' },
  { label: 'In transit', value: 'in_transit' },
  { label: 'Delivered', value: 'delivered' },
  { label: 'Cancelled', value: 'cancelled' },
]

const paymentOptions: Array<{ label: string; value: PaymentStatus }> = [
  { label: 'Pending', value: 'pending' },
  { label: 'Paid', value: 'paid' },
  { label: 'Failed', value: 'failed' },
  { label: 'Refunded', value: 'refunded' },
  { label: 'Cash on delivery', value: 'cash_on_delivery' },
]

function isOrderStatus(value: unknown): value is OrderStatus {
  return statusOptions.some((option) => option.value === value)
}

function isPaymentStatus(value: unknown): value is PaymentStatus {
  return paymentOptions.some((option) => option.value === value)
}

const orderFields: CrudField[] = [
  {
    name: 'status',
    label: 'Order status',
    type: 'select',
    required: true,
    nullable: false,
    options: statusOptions,
  },
  {
    name: 'payment_status',
    label: 'Payment status',
    type: 'select',
    required: true,
    nullable: false,
    options: paymentOptions,
  },
  {
    name: 'tracking_summary',
    label: 'Tracking details (JSON)',
    type: 'json',
    helperText: 'Use eta and summary for the customer tracking page; carrier and tracking_number may also be included.',
  },
]

async function fetchOrders(): Promise<OrderRow[]> {
  const supabase = getSupabaseBrowserClient()
  const { data: orders, error } = await supabase
    .from('orders')
    .select(
      'id, user_id, order_number, public_tracking_code, status, payment_status, payment_method, currency, subtotal, discount_total, shipping_total, tax_total, grand_total, coupon_id, shipping_address_snapshot, billing_address_snapshot, contact_email, contact_phone, placed_at, confirmed_at, shipped_at, delivered_at, cancelled_at, tracking_summary, created_at, updated_at',
    )
    .order('created_at', { ascending: false })
    .limit(200)

  if (error) {
    throw error
  }

  const rows = orders ?? []
  if (rows.length === 0) {
    return []
  }

  const { data: items, error: itemsError } = await supabase
    .from('order_items')
    .select('id, order_id, product_id, product_snapshot, quantity, unit_price, line_total, currency, created_at, updated_at')
    .in('order_id', rows.map((order) => order.id))
    .order('created_at', { ascending: true })

  if (itemsError) {
    throw itemsError
  }

  const { data: events, error: eventsError } = await supabase
    .from('order_status_events')
    .select('id, order_id, status, note_key, event_at, metadata, created_at, updated_at')
    .in('order_id', rows.map((order) => order.id))
    .order('event_at', { ascending: true })

  if (eventsError) {
    throw eventsError
  }

  const itemsByOrder = new Map<string, OrderRow['items']>()
  for (const item of items ?? []) {
    const orderItems = itemsByOrder.get(item.order_id) ?? []
    orderItems.push(item)
    itemsByOrder.set(item.order_id, orderItems)
  }
  const eventsByOrder = new Map<string, OrderRow['events']>()
  for (const event of events ?? []) {
    const orderEvents = eventsByOrder.get(event.order_id) ?? []
    orderEvents.push(event)
    eventsByOrder.set(event.order_id, orderEvents)
  }

  return rows.map((order) => ({
    ...order,
    items: itemsByOrder.get(order.id) ?? [],
    events: eventsByOrder.get(order.id) ?? [],
  }))
}

function displayDate(value: string | null) {
  if (!value) {
    return '—'
  }
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString()
}

function statusVariant(status: string) {
  if (status === 'delivered' || status === 'paid') {
    return 'success' as const
  }
  if (status === 'cancelled' || status === 'failed' || status === 'refunded') {
    return 'error' as const
  }
  if (status === 'draft' || status === 'pending') {
    return 'muted' as const
  }
  return 'warning' as const
}

function isJsonValue(value: unknown): value is Json {
  if (value === null || ['string', 'number', 'boolean'].includes(typeof value)) return true
  if (Array.isArray(value)) return value.every(isJsonValue)
  return typeof value === 'object' && Object.values(value).every(isJsonValue)
}

function optionalJson(value: unknown): Json | null {
  if (value == null) return null
  if (isJsonValue(value)) return value
  throw new Error('Tracking details must be valid JSON.')
}

export function Component() {
  const queryClient = useQueryClient()
  const orders = useQuery({
    queryKey: queryKeys.admin.orders,
    queryFn: fetchOrders,
  })

  if (orders.isLoading) {
    return <LoadingScreen className="min-h-[70svh]" />
  }

  if (orders.error) {
    return (
      <main className="container space-y-8 py-10">
        <Seo title="Orders" />
        <ErrorState
          title="Orders could not be loaded"
          description={orders.error instanceof Error ? orders.error.message : 'Supabase could not return the order records.'}
          onRetry={() => void orders.refetch()}
        />
      </main>
    )
  }

  return (
    <main className="container space-y-8 py-10">
      <Seo title="Orders" />
      <SectionHeading
        eyebrow="Super Admin"
        title="Orders"
        description="Review recent orders, customer contact details, delivery snapshots, and line items. Update order and payment status from the existing order records."
      />
      <AdminResourcePanel<OrderRow>
        title="Recent orders"
        description={`Showing the latest ${orders.data?.length ?? 0} orders (up to 200).`}
        rows={orders.data ?? []}
        fields={orderFields}
        rowKey="id"
        canCreate={false}
        columns={[
          {
            label: 'Order',
            render: (row) => (
              <div className="space-y-1">
                <p className="font-semibold">{row.order_number}</p>
                <p className="text-xs text-muted-foreground">ID {row.id}</p>
              </div>
            ),
          },
          {
            label: 'Customer',
            render: (row) => (
              <div>
                <p>{row.contact_email}</p>
                <p className="text-xs text-muted-foreground">{row.contact_phone}</p>
              </div>
            ),
          },
          {
            label: 'Status',
            render: (row) => <Badge variant={statusVariant(row.status)}>{row.status.replaceAll('_', ' ')}</Badge>,
          },
          {
            label: 'Payment',
            render: (row) => (
              <div className="space-y-1">
                <Badge variant={statusVariant(row.payment_status)}>{row.payment_status.replaceAll('_', ' ')}</Badge>
                <p className="text-xs text-muted-foreground">{row.payment_method.replaceAll('_', ' ')}</p>
              </div>
            ),
          },
          {
            label: 'Total',
            render: (row) => `${row.currency} ${Number(row.grand_total).toLocaleString()}`,
          },
          {
            label: 'Details',
            className: 'min-w-64',
            render: (row) => (
              <details className="max-w-sm">
                <summary className="cursor-pointer text-primary">Address and {row.items.length} item(s)</summary>
                <div className="mt-3 space-y-3 text-xs">
                  <div>
                    <p className="font-semibold">Shipping snapshot</p>
                    <pre className="mt-1 whitespace-pre-wrap break-words rounded bg-muted p-2">
                      {JSON.stringify(row.shipping_address_snapshot ?? {}, null, 2)}
                    </pre>
                  </div>
                  <div>
                    <p className="font-semibold">Billing snapshot</p>
                    <pre className="mt-1 whitespace-pre-wrap break-words rounded bg-muted p-2">
                      {JSON.stringify(row.billing_address_snapshot ?? {}, null, 2)}
                    </pre>
                  </div>
                  <div>
                    <p className="font-semibold">Order items</p>
                    {row.items.map((item) => (
                      <pre key={item.id} className="mt-1 whitespace-pre-wrap break-words rounded bg-muted p-2">
                        {JSON.stringify(
                          {
                            product: item.product_snapshot,
                            quantity: item.quantity,
                            unit_price: item.unit_price,
                            line_total: item.line_total,
                          },
                          null,
                          2,
                        )}
                      </pre>
                    ))}
                  </div>
                  <div>
                    <p className="font-semibold">Status history</p>
                    {row.events.length > 0 ? (
                      <ul className="mt-1 space-y-1">
                        {row.events.map((event) => (
                          <li key={event.id}>
                            {event.status.replaceAll('_', ' ')} — {event.note_key || 'Status changed'} ({displayDate(event.event_at)})
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-1">No status events recorded.</p>
                    )}
                  </div>
                  <p>Placed: {displayDate(row.placed_at ?? row.created_at)}</p>
                  <p>Tracking code: {row.public_tracking_code}</p>
                </div>
              </details>
            ),
          },
        ]}
        onUpdate={async (row, values) => {
          const status = values.status
          const paymentStatus = values.payment_status
          if (!isOrderStatus(status)) {
            throw new Error('Select a valid order status.')
          }
          if (!isPaymentStatus(paymentStatus)) {
            throw new Error('Select a valid payment status.')
          }

          const update: Database['public']['Tables']['orders']['Update'] = {
            status,
            payment_status: paymentStatus,
            tracking_summary: optionalJson(values.tracking_summary),
          }
          const now = new Date().toISOString()
          if (status === 'confirmed' && row.status !== 'confirmed') update.confirmed_at = now
          if (status === 'in_transit' && row.status !== 'in_transit') update.shipped_at = now
          if (status === 'delivered' && row.status !== 'delivered') update.delivered_at = now
          if (status === 'cancelled' && row.status !== 'cancelled') update.cancelled_at = now

          const { error } = await getSupabaseBrowserClient()
            .from('orders')
            .update(update)
            .eq('id', row.id)
          if (error) throw error

          if (status !== row.status) {
            const { error: eventError } = await getSupabaseBrowserClient()
              .from('order_status_events')
              .insert({
                order_id: row.id,
                status,
                note_key: `Order status updated to ${status.replaceAll('_', ' ')}`,
                metadata: { source: 'admin', previous_status: row.status },
              })
            if (eventError) {
              void queryClient.invalidateQueries({ queryKey: queryKeys.admin.orders })
              void queryClient.invalidateQueries({ queryKey: queryKeys.orderTracking })
              throw new Error(`Order was updated, but its customer tracking history could not be recorded: ${eventError.message}`)
            }
          }
        }}
        onRefresh={() => {
          void queryClient.invalidateQueries({ queryKey: queryKeys.admin.orders })
          void queryClient.invalidateQueries({ queryKey: queryKeys.orderTracking })
          void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all })
        }}
      />
    </main>
  )
}
