import { useQuery } from '@tanstack/react-query'
import { Check, Copy, ReceiptText } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { LoadingScreen } from '@/components/layout/loading-screen'
import { SectionHeading } from '@/components/layout/section-heading'
import { Seo } from '@/components/layout/seo'
import { Alert } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getSupabaseBrowserClient } from '@/shared/api/supabase'
import { useAuth } from '@/shared/auth/provider'
import { routes } from '@/shared/config/routes'
import { useLocale } from '@/shared/hooks/use-locale'
import { formatCurrency } from '@/shared/lib/format'
import type { Json } from '@/shared/types/database'

type PaymentConfig = {
  merchantName: string
  upiId: string
  qrImageUrl: string
  instructions: string
  supportContact: string | null
}

type PaymentDetails = {
  amount: number
  currency: string
  paymentStatus: string
  fulfillmentStatus: string
  payment: PaymentConfig | null
}

type OrderItem = {
  id: string
  product_snapshot: Json | null
  quantity: number
  line_total: number
  currency: string
}

type CustomerOrder = {
  id: string
  order_number: string
  public_tracking_code: string
  payment_status: string
  fulfillment_status: string
  grand_total: number
  currency: string
}

type OrderPaymentData = {
  order: CustomerOrder
  items: OrderItem[]
  payment: PaymentDetails
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null
}

function readString(value: Json | null, key: string) {
  const record = asRecord(value)
  return typeof record?.[key] === 'string' ? record[key] : ''
}

function parsePaymentDetails(value: unknown): PaymentDetails | null {
  const details = asRecord(value)
  if (
    typeof details?.amount !== 'number' ||
    typeof details.currency !== 'string' ||
    typeof details.paymentStatus !== 'string' ||
    typeof details.fulfillmentStatus !== 'string'
  ) return null

  const candidate = asRecord(details.payment)
  const payment = candidate?.available === true &&
    typeof candidate.merchantName === 'string' &&
    typeof candidate.upiId === 'string' &&
    typeof candidate.qrImageUrl === 'string' &&
    typeof candidate.instructions === 'string'
    ? {
        merchantName: candidate.merchantName,
        upiId: candidate.upiId,
        qrImageUrl: candidate.qrImageUrl,
        instructions: candidate.instructions,
        supportContact: typeof candidate.supportContact === 'string' ? candidate.supportContact : null,
      }
    : null

  return {
    amount: details.amount,
    currency: details.currency,
    paymentStatus: details.paymentStatus,
    fulfillmentStatus: details.fulfillmentStatus,
    payment,
  }
}

async function loadOrderPayment(orderId: string, userId: string): Promise<OrderPaymentData> {
  const supabase = getSupabaseBrowserClient()
  const [orderResult, paymentResult] = await Promise.all([
    supabase
      .from('orders')
      .select('id, order_number, public_tracking_code, payment_status, fulfillment_status, grand_total, currency')
      .eq('id', orderId)
      .eq('user_id', userId)
      .maybeSingle(),
    supabase.rpc('get_order_manual_payment_details', { p_order_id: orderId }),
  ])

  if (orderResult.error) throw orderResult.error
  if (!orderResult.data) throw new Error('Order not found or access denied.')
  if (paymentResult.error) throw paymentResult.error

  const payment = parsePaymentDetails(paymentResult.data)
  if (!payment) throw new Error('The order payment details could not be read safely.')

  const { data: items, error: itemsError } = await supabase
    .from('order_items')
    .select('id, product_snapshot, quantity, line_total, currency')
    .eq('order_id', orderId)
    .order('created_at', { ascending: true })
  if (itemsError) throw itemsError

  return { order: orderResult.data, items: items ?? [], payment }
}

function paymentStatusVariant(status: string) {
  if (status === 'paid') return 'premium' as const
  if (status === 'failed' || status === 'refunded') return 'error' as const
  return 'muted' as const
}

function supportHref(contact: string | null): string | null {
  const value = contact?.trim() ?? ''
  if (!value) return null
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return `mailto:${value}`
  if (/^https?:\/\//i.test(value)) return value

  const phone = value.replace(/[\s()-]/g, '')
  return /^\+?[0-9]{7,15}$/.test(phone) ? `tel:${phone}` : null
}

export function Component() {
  const { orderId = '' } = useParams()
  const auth = useAuth()
  const locale = useLocale()
  const [reference, setReference] = useState('')
  const [referenceMessage, setReferenceMessage] = useState<string | null>(null)
  const [submittingReference, setSubmittingReference] = useState(false)
  const [copyMessage, setCopyMessage] = useState<string | null>(null)
  const [qrImageFailed, setQrImageFailed] = useState(false)
  const query = useQuery({
    queryKey: ['order-payment', auth.user?.id, orderId],
    queryFn: () => loadOrderPayment(orderId, auth.user!.id),
    enabled: Boolean(auth.user?.id && orderId),
  })

  const submitReference = async () => {
    if (!query.data || reference.trim().length < 4) return
    setReferenceMessage(null)
    setSubmittingReference(true)
    try {
      const { error } = await getSupabaseBrowserClient().rpc('submit_manual_upi_reference', {
        p_order_id: query.data.order.id,
        p_transaction_reference: reference.trim(),
        p_note: null,
      })
      if (error) throw error
      setReference('')
      setReferenceMessage('Reference submitted for review. This does not confirm payment.')
    } catch (error) {
      setReferenceMessage(error instanceof Error ? error.message : 'Unable to submit the payment reference.')
    } finally {
      setSubmittingReference(false)
    }
  }

  const copyUpiId = async (upiId: string) => {
    try {
      await navigator.clipboard.writeText(upiId)
      setCopyMessage('UPI ID copied.')
    } catch {
      setCopyMessage('Copy is unavailable in this browser. Select the UPI ID to copy it manually.')
    }
  }

  if (query.isLoading) return <LoadingScreen className="min-h-[60svh]" />

  if (query.error || !query.data) {
    return (
      <EmptyState
        title="Order payment page unavailable"
        description={query.error instanceof Error ? query.error.message : 'We could not load this order.'}
        actionLabel="View your orders"
        onAction={() => { window.location.assign(routes.dashboard.orders) }}
      />
    )
  }

  const { order, items, payment } = query.data
  const orderLocale = locale === 'hi' ? 'hi-IN' : 'en-IN'
  const contactUrl = supportHref(payment.payment?.supportContact ?? null)

  return (
    <div className="space-y-8">
      <Seo title={`Payment for ${order.order_number}`} description="Review your order and approved UPI payment instructions." />
      <SectionHeading
        eyebrow="Order confirmation"
        title="Complete your UPI payment"
        description="Your order is reserved while payment is pending. It will not be processed until the store verifies the exact payment receipt."
      />

      <Alert
        title="Order created — payment verification pending"
        description={
          <div className="space-y-1">
            <p>Order <strong>{order.order_number}</strong> has been created.</p>
            <p className="text-sm">Keep tracking code <span className="break-all font-mono">{order.public_tracking_code}</span> for order lookup.</p>
          </div>
        }
        variant="warning"
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <Card className="shadow-[var(--shadow-soft)]">
          <CardContent className="space-y-5 p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3"><ReceiptText className="h-5 w-5 text-primary" /><h2 className="font-display text-2xl font-semibold">Order summary</h2></div>
              <Badge variant={paymentStatusVariant(payment.paymentStatus)}>{payment.paymentStatus.replaceAll('_', ' ')}</Badge>
            </div>
            <ul className="space-y-3 text-sm">
              {items.map((item) => (
                <li key={item.id} className="flex flex-wrap justify-between gap-3 border-b border-border pb-3 last:border-0 last:pb-0">
                  <span>
                    {readString(item.product_snapshot, 'name') || 'Product'}
                    {readString(item.product_snapshot, 'variant_title') ? ` · ${readString(item.product_snapshot, 'variant_title')}` : ''}
                    {' '}× {item.quantity}
                  </span>
                  <span>{formatCurrency(item.line_total, item.currency, orderLocale)}</span>
                </li>
              ))}
            </ul>
            <div className="flex items-center justify-between border-t border-border pt-4 font-display text-xl font-semibold">
              <span>Server-calculated total</span>
              <span>{formatCurrency(payment.amount, payment.currency, orderLocale)}</span>
            </div>
          </CardContent>
        </Card>

        {payment.payment ? (
          <Card className="border-primary/30 bg-primary/5 shadow-[var(--shadow-soft)]">
            <CardContent className="space-y-5 p-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Manual UPI payment</p>
                <p className="mt-2 font-display text-3xl font-semibold">{formatCurrency(payment.amount, payment.currency, orderLocale)}</p>
              </div>
              {qrImageFailed ? (
                <Alert title="QR image unavailable" description="Use the approved UPI ID below or contact the store before paying. Do not use a different payment destination." variant="error" />
              ) : (
                <img
                  src={payment.payment.qrImageUrl}
                  alt={`Approved UPI QR code for ${payment.payment.merchantName}`}
                  className="mx-auto h-48 w-48 rounded-[var(--radius-field)] border border-border bg-white object-contain p-2"
                  referrerPolicy="no-referrer"
                  onError={() => setQrImageFailed(true)}
                />
              )}
              <p className="text-sm leading-6 text-muted-foreground">{payment.payment.instructions}</p>
              <div className="rounded-[var(--radius-field)] border border-border bg-background p-4 text-sm">
                <p className="text-muted-foreground">Pay to</p>
                <p className="mt-1 font-semibold">{payment.payment.merchantName}</p>
                <p className="mt-1 break-all font-mono text-base text-primary">{payment.payment.upiId}</p>
                <Button type="button" variant="outline" size="sm" className="mt-3" onClick={() => void copyUpiId(payment.payment!.upiId)}>
                  <Copy className="h-4 w-4" />Copy UPI ID
                </Button>
                {copyMessage ? <p className="mt-2 text-xs text-muted-foreground" role="status">{copyMessage}</p> : null}
              </div>
              {payment.payment.supportContact ? (
                <div className="text-sm text-muted-foreground">
                  <p>Support: {payment.payment.supportContact}</p>
                  {contactUrl ? <Button asChild type="button" size="sm" variant="outline" className="mt-2"><a href={contactUrl}>Contact us</a></Button> : null}
                </div>
              ) : null}
            </CardContent>
          </Card>
        ) : (
          <Alert title="Do not make a payment yet" description="Approved UPI instructions are unavailable for this order. Contact support before making any payment." variant="error" />
        )}
      </div>

      {payment.payment && payment.paymentStatus === 'pending' && payment.fulfillmentStatus !== 'cancelled' ? (
        <Card className="shadow-[var(--shadow-soft)]">
          <CardContent className="space-y-3 p-6">
            <Label htmlFor="payment-reference">Transaction reference / UTR <span className="font-normal text-muted-foreground">(optional)</span></Label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input id="payment-reference" value={reference} onChange={(event) => setReference(event.target.value)} placeholder="UPI transaction ID / UTR" maxLength={128} />
              <Button type="button" variant="outline" disabled={submittingReference || reference.trim().length < 4} onClick={() => void submitReference()}>
                {submittingReference ? 'Submitting…' : 'Submit for review'}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">A reference helps support review, but never confirms payment by itself.</p>
            {referenceMessage ? <p className="text-sm text-muted-foreground" role="status">{referenceMessage}</p> : null}
          </CardContent>
        </Card>
      ) : null}

      <Button asChild variant="outline"><Link to={routes.dashboard.orders}><Check className="h-4 w-4" />View order status</Link></Button>
    </div>
  )
}
