import { useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { LoadingScreen } from '@/components/layout/loading-screen'
import { SectionHeading } from '@/components/layout/section-heading'
import { Seo } from '@/components/layout/seo'
import { Alert } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog } from '@/components/ui/dialog'
import { EmptyState } from '@/components/ui/empty-state'
import { ErrorState } from '@/components/ui/error-state'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { queryKeys } from '@/shared/api/keys'
import { getSupabaseBrowserClient } from '@/shared/api/supabase'
import { formatCurrency } from '@/shared/lib/format'
import type { Database, Json } from '@/shared/types/database'

type Order = Database['public']['Tables']['orders']['Row']
type ListOrder = Pick<Order,
  'id' | 'order_number' | 'payment_status' | 'fulfillment_status' | 'payment_method' |
  'currency' | 'grand_total' | 'contact_email' | 'contact_phone' | 'created_at' | 'payment_transaction_reference'
>
type Detail = {
  order: Order
  items: Database['public']['Tables']['order_items']['Row'][]
  events: Database['public']['Tables']['order_status_events']['Row'][]
  submissions: Database['public']['Tables']['order_payment_submissions']['Row'][]
  audit: Database['public']['Tables']['order_audit_events']['Row'][]
}
type FulfillmentStatus = Database['public']['Enums']['fulfillment_status']

const paymentFilters = ['', 'pending', 'paid', 'failed', 'refunded'] as const
const fulfillmentFilters = ['', 'unfulfilled', 'processing', 'shipped', 'delivered', 'cancelled'] as const

function badgeVariant(status: string) {
  if (['paid', 'delivered'].includes(status)) return 'success' as const
  if (['failed', 'refunded', 'cancelled'].includes(status)) return 'error' as const
  if (['pending', 'unfulfilled'].includes(status)) return 'muted' as const
  return 'warning' as const
}

function displayDate(value: string | null) {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('en-IN')
}

function readName(snapshot: Json | null) {
  if (!snapshot || typeof snapshot !== 'object' || Array.isArray(snapshot)) return 'Product'
  return typeof snapshot.name === 'string' ? snapshot.name : 'Product'
}

async function fetchOrders(payment: string, fulfillment: string): Promise<ListOrder[]> {
  let request = getSupabaseBrowserClient()
    .from('orders')
    .select('id, order_number, payment_status, fulfillment_status, payment_method, currency, grand_total, contact_email, contact_phone, created_at, payment_transaction_reference')
    .order('created_at', { ascending: false })
    .range(0, 49)
  if (payment) request = request.eq('payment_status', payment as ListOrder['payment_status'])
  if (fulfillment) request = request.eq('fulfillment_status', fulfillment as ListOrder['fulfillment_status'])
  const { data, error } = await request
  if (error) throw error
  return data ?? []
}

async function fetchDetail(orderId: string): Promise<Detail> {
  const supabase = getSupabaseBrowserClient()
  const [order, items, events, submissions, audit] = await Promise.all([
    supabase.from('orders').select('*').eq('id', orderId).single(),
    supabase.from('order_items').select('*').eq('order_id', orderId).order('created_at'),
    supabase.from('order_status_events').select('*').eq('order_id', orderId).order('event_at'),
    supabase.from('order_payment_submissions').select('*').eq('order_id', orderId).order('created_at', { ascending: false }),
    supabase.from('order_audit_events').select('*').eq('order_id', orderId).order('created_at', { ascending: false }),
  ])
  const error = order.error ?? items.error ?? events.error ?? submissions.error ?? audit.error
  if (error || !order.data) throw error ?? new Error('Order no longer exists.')
  return { order: order.data, items: items.data ?? [], events: events.data ?? [], submissions: submissions.data ?? [], audit: audit.data ?? [] }
}

export function Component() {
  const queryClient = useQueryClient()
  const [paymentFilter, setPaymentFilter] = useState<(typeof paymentFilters)[number]>('pending')
  const [fulfillmentFilter, setFulfillmentFilter] = useState<(typeof fulfillmentFilters)[number]>('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [verifyOpen, setVerifyOpen] = useState(false)
  const [fulfillmentOpen, setFulfillmentOpen] = useState(false)
  const [refundOpen, setRefundOpen] = useState(false)
  const [amount, setAmount] = useState('')
  const [reference, setReference] = useState('')
  const [checkedAccount, setCheckedAccount] = useState(false)
  const [nextFulfillment, setNextFulfillment] = useState<FulfillmentStatus>('processing')
  const [saving, setSaving] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const orders = useQuery({ queryKey: [...queryKeys.admin.orders, paymentFilter, fulfillmentFilter] as const, queryFn: () => fetchOrders(paymentFilter, fulfillmentFilter) })
  const detail = useQuery({ queryKey: [...queryKeys.admin.orders, 'detail', selectedId] as const, queryFn: () => fetchDetail(selectedId!), enabled: Boolean(selectedId) })
  const selected = detail.data?.order ?? null

  const resetActionState = () => {
    if (!selected) return
    setAmount(String(selected.grand_total))
    setReference(selected.payment_transaction_reference ?? '')
    setCheckedAccount(false)
    setActionError(null)
  }
  const openVerification = () => {
    if (!selected) return
    resetActionState()
    setVerifyOpen(true)
  }
  const openFulfillment = () => {
    if (!selected) return
    resetActionState()
    setNextFulfillment(selected.fulfillment_status === 'unfulfilled' ? 'processing' : 'shipped')
    setFulfillmentOpen(true)
  }
  const openRefund = () => {
    if (!selected) return
    resetActionState()
    setRefundOpen(true)
  }

  const allowedFulfillment = useMemo<FulfillmentStatus[]>(() => {
    if (!selected) return []
    if (selected.fulfillment_status === 'unfulfilled') return selected.payment_status === 'paid' ? ['processing', 'cancelled'] : ['cancelled']
    if (selected.fulfillment_status === 'processing') return ['shipped', 'cancelled']
    if (selected.fulfillment_status === 'shipped') return ['delivered']
    return []
  }, [selected])

  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.orders }),
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all }),
      queryClient.invalidateQueries({ queryKey: queryKeys.orderTracking }),
    ])
  }
  const runAction = async (action: () => Promise<{ error: unknown }>) => {
    setSaving(true); setActionError(null)
    try {
      const { error } = await action()
      if (error) throw error
      toast.success('Order updated')
      setVerifyOpen(false); setFulfillmentOpen(false); setRefundOpen(false)
      await refresh()
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'The order could not be updated.')
    } finally { setSaving(false) }
  }

  if (orders.isLoading) return <LoadingScreen className="min-h-[70svh]" />
  if (orders.error) return <main className="container py-10"><ErrorState title="Orders could not be loaded" description={orders.error instanceof Error ? orders.error.message : 'Supabase could not return orders.'} onRetry={() => void orders.refetch()} /></main>

  return (
    <main className="container space-y-8 py-10">
      <Seo title="Orders" />
      <SectionHeading eyebrow="Super Admin" title="Orders & payment verification" description="Verify only payments checked in the receiving account. Payment and fulfilment are intentionally separate controls." />
      <Card><CardContent className="grid gap-4 p-5 sm:grid-cols-2">
        <div className="space-y-2"><Label htmlFor="payment-filter">Payment</Label><Select id="payment-filter" value={paymentFilter} onChange={(event) => { setPaymentFilter(event.target.value as typeof paymentFilter); setSelectedId(null) }}>{paymentFilters.map((status) => <option key={status || 'all'} value={status}>{status ? status.replaceAll('_', ' ') : 'All payment states'}</option>)}</Select></div>
        <div className="space-y-2"><Label htmlFor="fulfillment-filter">Fulfilment</Label><Select id="fulfillment-filter" value={fulfillmentFilter} onChange={(event) => { setFulfillmentFilter(event.target.value as typeof fulfillmentFilter); setSelectedId(null) }}>{fulfillmentFilters.map((status) => <option key={status || 'all'} value={status}>{status ? status.replaceAll('_', ' ') : 'All fulfilment states'}</option>)}</Select></div>
      </CardContent></Card>
      {orders.data?.length ? <div className="overflow-x-auto rounded-[var(--radius-card)] border border-border"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground"><tr><th className="p-4">Order</th><th className="p-4">Customer</th><th className="p-4">Payment</th><th className="p-4">Fulfilment</th><th className="p-4">Total</th><th className="p-4"><span className="sr-only">Open</span></th></tr></thead><tbody>{orders.data.map((order) => <tr key={order.id} className="border-t border-border"><td className="p-4"><p className="font-semibold">{order.order_number}</p><p className="text-xs text-muted-foreground">{displayDate(order.created_at)}</p></td><td className="p-4"><p>{order.contact_email}</p><p className="text-xs text-muted-foreground">{order.contact_phone}</p></td><td className="p-4"><Badge variant={badgeVariant(order.payment_status)}>{order.payment_status}</Badge></td><td className="p-4"><Badge variant={badgeVariant(order.fulfillment_status)}>{order.fulfillment_status}</Badge></td><td className="p-4">{formatCurrency(order.grand_total, order.currency)}</td><td className="p-4"><Button size="sm" variant="outline" onClick={() => setSelectedId(order.id)}>Review</Button></td></tr>)}</tbody></table></div> : <EmptyState title="No matching orders" description="Try another payment or fulfilment filter." />}
      <p className="text-xs text-muted-foreground">Showing up to 50 recent matching orders. Select an order to load its items, payment evidence, and audit history.</p>

      <Dialog open={Boolean(selectedId)} onOpenChange={(open) => { if (!open) setSelectedId(null) }} title={selected?.order_number ?? 'Order details'} description="Sensitive actions are server-authorized and recorded in the audit trail." size="xl">
        {detail.isLoading ? <LoadingScreen className="min-h-48" /> : detail.error ? <ErrorState title="Order details could not be loaded" description={detail.error instanceof Error ? detail.error.message : 'Unable to load details.'} onRetry={() => void detail.refetch()} /> : detail.data ? <div className="space-y-6">
          {actionError ? <Alert title="Action not completed" description={actionError} variant="error" /> : null}
          <div className="grid gap-3 sm:grid-cols-3"><div className="rounded border border-border p-3"><p className="text-xs text-muted-foreground">Total</p><p className="font-semibold">{formatCurrency(selected!.grand_total, selected!.currency)}</p></div><div className="rounded border border-border p-3"><p className="text-xs text-muted-foreground">Payment</p><Badge variant={badgeVariant(selected!.payment_status)}>{selected!.payment_status}</Badge></div><div className="rounded border border-border p-3"><p className="text-xs text-muted-foreground">Fulfilment</p><Badge variant={badgeVariant(selected!.fulfillment_status)}>{selected!.fulfillment_status}</Badge></div></div>
          <div className="flex flex-wrap gap-2">{selected?.payment_status === 'pending' ? <Button onClick={openVerification}>Verify exact payment</Button> : null}{allowedFulfillment.length ? <Button variant="outline" onClick={openFulfillment}>Update fulfilment</Button> : null}{selected?.payment_status === 'paid' ? <Button variant="outline" onClick={openRefund}>Record full refund</Button> : null}</div>
          <section><h3 className="font-semibold">Items</h3><ul className="mt-2 space-y-2 text-sm">{detail.data.items.map((item) => <li key={item.id} className="flex justify-between gap-4"><span>{readName(item.product_snapshot)} × {item.quantity}</span><span>{formatCurrency(item.line_total, item.currency)}</span></li>)}</ul></section>
          <section><h3 className="font-semibold">Customer-submitted payment references</h3>{detail.data.submissions.length ? <ul className="mt-2 space-y-2 text-sm">{detail.data.submissions.map((submission) => <li key={submission.id} className="rounded border border-border p-3"><p className="font-mono">{submission.transaction_reference}</p>{submission.note ? <p className="mt-1 text-muted-foreground">{submission.note}</p> : null}<p className="mt-1 text-xs text-muted-foreground">Submitted {displayDate(submission.created_at)} — evidence only; not payment confirmation.</p></li>)}</ul> : <p className="mt-2 text-sm text-muted-foreground">No customer reference submitted.</p>}</section>
          <section><h3 className="font-semibold">Audit history</h3>{detail.data.audit.length ? <ol className="mt-2 space-y-2 text-sm">{detail.data.audit.map((event) => <li key={event.id} className="rounded border border-border p-3"><p className="font-medium">{event.action.replaceAll('_', ' ')}</p><p className="text-xs text-muted-foreground">{displayDate(event.created_at)}{event.transaction_reference ? ` · Reference: ${event.transaction_reference}` : ''}</p></li>)}</ol> : <p className="mt-2 text-sm text-muted-foreground">No audit events are available for this legacy order.</p>}</section>
        </div> : null}
      </Dialog>

      <Dialog open={verifyOpen} onOpenChange={setVerifyOpen} title="Verify manual UPI payment" description="Only continue after checking the actual receiving UPI or bank account." footer={<Button disabled={saving || !checkedAccount} onClick={() => void runAction(async () => getSupabaseBrowserClient().rpc('admin_verify_manual_upi_payment', { p_order_id: selected!.id, p_received_amount: Number(amount), p_received_currency: selected!.currency, p_transaction_reference: reference, p_confirmed_against_account: checkedAccount }))}>{saving ? 'Verifying…' : 'Confirm verified payment'}</Button>}><div className="space-y-4"><div className="space-y-2"><Label htmlFor="received-amount">Amount received (INR)</Label><Input id="received-amount" type="number" min="0" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} /></div><div className="space-y-2"><Label htmlFor="verified-reference">Transaction reference (if available)</Label><Input id="verified-reference" maxLength={128} value={reference} onChange={(event) => setReference(event.target.value)} /></div><Label className="flex items-start gap-2 text-sm"><input type="checkbox" checked={checkedAccount} onChange={(event) => setCheckedAccount(event.target.checked)} /> I checked the exact amount in the merchant receiving account.</Label>{actionError ? <Alert title="Verification blocked" description={actionError} variant="error" /> : null}</div></Dialog>
      <Dialog open={fulfillmentOpen} onOpenChange={setFulfillmentOpen} title="Update fulfilment" description="The server rejects delivery actions until payment is verified." footer={<Button disabled={saving} onClick={() => void runAction(async () => getSupabaseBrowserClient().rpc('admin_update_order_fulfillment', { p_order_id: selected!.id, p_fulfillment_status: nextFulfillment, p_tracking_summary: null }))}>{saving ? 'Saving…' : 'Confirm fulfilment update'}</Button>}><div className="space-y-2"><Label htmlFor="next-fulfillment">New fulfilment status</Label><Select id="next-fulfillment" value={nextFulfillment} onChange={(event) => setNextFulfillment(event.target.value as FulfillmentStatus)}>{allowedFulfillment.map((status) => <option key={status} value={status}>{status}</option>)}</Select>{actionError ? <Alert title="Update blocked" description={actionError} variant="error" /> : null}</div></Dialog>
      <Dialog open={refundOpen} onOpenChange={setRefundOpen} title="Record confirmed full refund" description="This workflow records only a refund already confirmed in the payment account." footer={<Button disabled={saving || !checkedAccount} onClick={() => void runAction(async () => getSupabaseBrowserClient().rpc('admin_record_manual_refund', { p_order_id: selected!.id, p_refunded_amount: Number(amount), p_currency: selected!.currency, p_transaction_reference: reference, p_confirmed_against_account: checkedAccount }))}>{saving ? 'Recording…' : 'Confirm refund record'}</Button>}><div className="space-y-4"><div className="space-y-2"><Label htmlFor="refund-amount">Refunded amount (INR)</Label><Input id="refund-amount" type="number" min="0" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} /></div><div className="space-y-2"><Label htmlFor="refund-reference">Refund reference</Label><Input id="refund-reference" maxLength={128} value={reference} onChange={(event) => setReference(event.target.value)} /></div><Label className="flex items-start gap-2 text-sm"><input type="checkbox" checked={checkedAccount} onChange={(event) => setCheckedAccount(event.target.checked)} /> I verified that the full refund was completed in the payment account.</Label>{actionError ? <Alert title="Refund blocked" description={actionError} variant="error" /> : null}</div></Dialog>
    </main>
  )
}
