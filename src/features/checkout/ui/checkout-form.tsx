import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, MapPinned, Phone, User } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'

import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { routes } from '@/shared/config/routes'
import { formatCurrency } from '@/shared/lib/format'
import { useCartStore } from '@/shared/stores/cart-store'
import { useAuth } from '@/shared/auth/provider'
import { getSupabaseBrowserClient } from '@/shared/api/supabase'
import {
  checkoutSchema,
  type CheckoutValues,
} from '@/features/checkout/model/schema'

type PlacedOrder = {
  order_id: string
  order_number: string
  public_tracking_code: string
  grand_total: number
  currency: string
}

type ManualPaymentConfig = {
  available: true
  merchantName: string
  upiId: string
  qrImageUrl: string
  instructions: string
  supportContact: string | null
}

type ManualPaymentDetails = {
  orderId: string
  orderNumber: string
  amount: number
  currency: string
  paymentStatus: string
  fulfillmentStatus: string
  payment: ManualPaymentConfig | null
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null
}

function readManualPaymentConfig(value: unknown): ManualPaymentConfig | null {
  const config = asRecord(value)
  if (
    config?.available !== true ||
    typeof config.merchantName !== 'string' ||
    typeof config.upiId !== 'string' ||
    typeof config.qrImageUrl !== 'string' ||
    typeof config.instructions !== 'string'
  ) return null

  return {
    available: true,
    merchantName: config.merchantName,
    upiId: config.upiId,
    qrImageUrl: config.qrImageUrl,
    instructions: config.instructions,
    supportContact: typeof config.supportContact === 'string' ? config.supportContact : null,
  }
}

function readPaymentDetails(value: unknown): ManualPaymentDetails | null {
  const details = asRecord(value)
  if (
    !details || typeof details.orderId !== 'string' || typeof details.orderNumber !== 'string' ||
    typeof details.amount !== 'number' || typeof details.currency !== 'string' ||
    typeof details.paymentStatus !== 'string' || typeof details.fulfillmentStatus !== 'string'
  ) return null

  return {
    orderId: details.orderId,
    orderNumber: details.orderNumber,
    amount: details.amount,
    currency: details.currency,
    paymentStatus: details.paymentStatus,
    fulfillmentStatus: details.fulfillmentStatus,
    payment: readManualPaymentConfig(details.payment),
  }
}

const defaultValues: CheckoutValues = {
  label: 'Home',
  recipientName: '',
  phone: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  postalCode: '',
  countryCode: 'IN',
  landmark: '',
}

function FieldError({ message }: { message: string | undefined }) {
  return message ? <p className="text-xs text-error" role="alert">{message}</p> : null
}

export function CheckoutForm() {
  const auth = useAuth()
  const supabase = getSupabaseBrowserClient()
  const cartItems = useCartStore((state) => state.items)
  const checkoutNowItem = useCartStore((state) => state.checkoutNowItem)
  const clearCart = useCartStore((state) => state.clear)
  const finishCheckoutNow = useCartStore((state) => state.finishCheckoutNow)
  const items = checkoutNowItem ? [checkoutNowItem] : cartItems
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const currency = items[0]?.currency ?? 'INR'
  const unavailableItems = items.filter((item) =>
    item.available === false ||
    item.quantity > 99 ||
    (item.maxQuantity != null && item.quantity > item.maxQuantity),
  )
  const [message, setMessage] = useState<string | null>(null)
  const [placedOrder, setPlacedOrder] = useState<PlacedOrder | null>(null)
  const [request, setRequest] = useState<{ signature: string; id: string } | null>(null)
  const [paymentConfig, setPaymentConfig] = useState<ManualPaymentConfig | null>(null)
  const [paymentConfigLoading, setPaymentConfigLoading] = useState(true)
  const [paymentConfigError, setPaymentConfigError] = useState<string | null>(null)
  const [paymentDetails, setPaymentDetails] = useState<ManualPaymentDetails | null>(null)
  const [transactionReference, setTransactionReference] = useState('')
  const [referenceMessage, setReferenceMessage] = useState<string | null>(null)
  const [submittingReference, setSubmittingReference] = useState(false)

  const form = useForm<CheckoutValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues,
  })

  useEffect(() => {
    form.reset({
      label: 'Home',
      recipientName: auth.profile?.displayName ?? auth.profile?.fullName ?? '',
      phone: auth.profile?.phone ?? '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      postalCode: '',
      countryCode: 'IN',
      landmark: '',
    })
  }, [auth.profile, auth.user?.email, form])

  useEffect(() => {
    let active = true
    if (!auth.user) return () => { active = false }

    const loadPaymentConfig = async () => {
      const { data, error } = await supabase.rpc('get_manual_upi_payment_config')
      if (!active) return
      if (error) {
        setPaymentConfig(null)
        setPaymentConfigError('Manual UPI payment is currently unavailable. Please contact support.')
      } else {
        const config = readManualPaymentConfig(data)
        setPaymentConfig(config)
        setPaymentConfigError(config ? null : 'Manual UPI payment is currently unavailable. Please contact support.')
      }
      setPaymentConfigLoading(false)
    }
    void loadPaymentConfig()

    return () => {
      active = false
    }
  }, [auth.user, supabase])

  const onSubmit = form.handleSubmit(async (values) => {
    setMessage(null)

    try {
      if (!auth.user) {
        throw new Error('You must be signed in to place an order.')
      }

      if (items.length === 0) {
        throw new Error('Add at least one available product to your cart before checkout.')
      }
      if (unavailableItems.length > 0) {
        throw new Error('One or more products are unavailable or exceed current stock. Review your cart and try again.')
      }
      if (!paymentConfig) {
        throw new Error('Manual UPI payment is currently unavailable. Please contact support.')
      }

      const cartItems = items.map((item) => ({
        productId: item.productId,
        variantId: item.variantId ?? null,
        quantity: item.quantity,
      }))
      const shippingAddress = {
        label: values.label,
        recipientName: values.recipientName,
        phone: values.phone,
        addressLine1: values.addressLine1,
        addressLine2: values.addressLine2 ?? '',
        city: values.city,
        state: values.state,
        postalCode: values.postalCode,
        countryCode: values.countryCode,
        landmark: values.landmark ?? '',
      }
      const signature = JSON.stringify({ cartItems, shippingAddress })
      const requestId =
        request?.signature === signature
          ? request.id
          : window.crypto.randomUUID()
      setRequest({ signature, id: requestId })

      const { data, error } = await supabase.rpc('place_order', {
        p_cart_items: cartItems,
        p_shipping_address: shippingAddress,
        p_checkout_request_id: requestId,
      })

      if (error) {
        throw error
      }

      const order = data?.[0]
      if (!order) {
        throw new Error('Supabase did not return the order confirmation.')
      }

      const { data: detailsData, error: detailsError } = await supabase.rpc('get_order_manual_payment_details', {
        p_order_id: order.order_id,
      })
      if (detailsError) {
        throw new Error('Order was created, but payment instructions could not be loaded. Open your orders and contact support if this continues.')
      }
      const details = readPaymentDetails(detailsData)
      if (!details) {
        throw new Error('Order was created, but approved payment instructions are unavailable. Please contact support before paying.')
      }

      if (checkoutNowItem) {
        finishCheckoutNow()
      } else {
        clearCart()
      }
      setPlacedOrder(order)
      setPaymentDetails(details)
      setRequest(null)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to place your order.')
    }
  })

  const submitPaymentReference = async () => {
    if (!placedOrder) return
    setReferenceMessage(null)
    setSubmittingReference(true)
    try {
      const { error } = await supabase.rpc('submit_manual_upi_reference', {
        p_order_id: placedOrder.order_id,
        p_transaction_reference: transactionReference,
        p_note: null,
      })
      if (error) throw error
      setReferenceMessage('Reference submitted for review. This does not confirm payment.')
      setTransactionReference('')
    } catch (error) {
      setReferenceMessage(error instanceof Error ? error.message : 'Unable to submit the payment reference.')
    } finally {
      setSubmittingReference(false)
    }
  }

  if (placedOrder) {
    const payment = paymentDetails?.payment ?? null
    return (
      <div className="space-y-6">
        <Alert
          title="Order created — payment verification pending"
          description={
            <div className="space-y-2">
              <p>
                Order <strong>{placedOrder.order_number}</strong> was created for{' '}
                <strong>{formatCurrency(placedOrder.grand_total, placedOrder.currency)}</strong>.
                It is not confirmed until payment receipt is verified.
              </p>
              <p>Keep tracking code {placedOrder.public_tracking_code} for shipment lookup.</p>
            </div>
          }
          variant="warning"
        />
        {payment ? (
          <section className="grid gap-6 rounded-[var(--radius-card)] border border-primary/30 bg-primary/5 p-5 sm:grid-cols-[minmax(0,1fr)_12rem] sm:p-6">
            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Manual UPI payment</p>
                <h2 className="mt-1 font-display text-3xl font-semibold">Pay {formatCurrency(paymentDetails?.amount ?? placedOrder.grand_total, paymentDetails?.currency ?? placedOrder.currency)}</h2>
              </div>
              <p className="text-sm leading-6 text-muted-foreground">{payment.instructions}</p>
              <div className="rounded-[var(--radius-field)] border border-border bg-background p-4 text-sm">
                <p className="text-muted-foreground">Pay to</p>
                <p className="mt-1 font-semibold">{payment.merchantName}</p>
                <p className="font-mono text-base text-primary">{payment.upiId}</p>
              </div>
              {payment.supportContact ? <p className="text-sm text-muted-foreground">Support: {payment.supportContact}</p> : null}
            </div>
            <img
              src={payment.qrImageUrl}
              alt={`Approved UPI QR code for ${payment.merchantName}`}
              className="mx-auto h-48 w-48 rounded-[var(--radius-field)] border border-border bg-white object-contain p-2"
              referrerPolicy="no-referrer"
            />
            <div className="space-y-3 sm:col-span-2">
              <Label htmlFor="payment-reference">Transaction reference (optional)</Label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  id="payment-reference"
                  value={transactionReference}
                  onChange={(event) => setTransactionReference(event.target.value)}
                  placeholder="UPI transaction ID / UTR"
                  maxLength={128}
                />
                <Button type="button" variant="outline" onClick={() => void submitPaymentReference()} disabled={submittingReference || transactionReference.trim().length < 4}>
                  {submittingReference ? 'Submitting…' : 'Submit for review'}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">A reference helps support review, but it never confirms payment by itself.</p>
              {referenceMessage ? <p className="text-sm text-muted-foreground" role="status">{referenceMessage}</p> : null}
            </div>
          </section>
        ) : (
          <Alert title="Do not make a payment yet" description="Approved UPI payment instructions are unavailable for this order. Contact support before making any payment." variant="error" />
        )}
        <Button asChild>
          <Link to={routes.dashboard.orders}>View order status and payment instructions</Link>
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <Alert
        title="Authenticated account"
        description={`Your order will be created for ${auth.user?.email ?? 'your account'} and will remain pending until manual UPI payment is verified.`}
      />

      {paymentConfigLoading ? (
        <Alert title="Checking payment availability" description="Loading the approved payment destination…" />
      ) : paymentConfigError ? (
        <Alert title="Payment currently unavailable" description={paymentConfigError} variant="error" />
      ) : null}

      {message ? (
        <Alert
          title="Unable to place order"
          description={message}
          variant="error"
        />
      ) : null}

      <Alert
        title="Order summary"
        description={
          items.length > 0 ? (
            <div className="space-y-2">
              <p>
                {items.length} product(s) · Estimated total {formatCurrency(subtotal, currency)}.
                The final amount uses current Supabase catalog prices. Shipping and tax are not
                configured and are currently zero.
              </p>
              <ul className="space-y-1">
                {items.map((item) => (
                  <li
                    key={`${item.productId}:${item.variantId ?? ''}`}
                    className="flex flex-wrap justify-between gap-2"
                  >
                    <span>
                      {item.name}
                      {item.variantTitle ? ` · ${item.variantTitle}` : ''}
                      {' '}× {item.quantity}
                    </span>
                    <span>{formatCurrency(item.price * item.quantity, item.currency)}</span>
                  </li>
                ))}
              </ul>
              {unavailableItems.length > 0 ? (
                <p>{unavailableItems.length} item(s) are unavailable or exceed current stock.</p>
              ) : null}
            </div>
          ) : (
            'Your cart is empty. Add products before placing an order.'
          )
        }
      />

      <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
        <Link to={routes.privacyPolicy} className="underline underline-offset-4 hover:text-foreground">
          Privacy policy
        </Link>
        <Link to={routes.terms} className="underline underline-offset-4 hover:text-foreground">
          Terms & conditions
        </Link>
        <Link to={routes.shippingPolicy} className="underline underline-offset-4 hover:text-foreground">
          Shipping policy
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="checkout-label">Address label</Label>
          <Input id="checkout-label" {...form.register('label')} />
          <FieldError message={form.formState.errors.label?.message} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="checkout-country">Country</Label>
          <Select id="checkout-country" {...form.register('countryCode')}>
            <option value="IN">India</option>
          </Select>
          <FieldError message={form.formState.errors.countryCode?.message} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="checkout-name">Recipient name</Label>
          <div className="relative">
            <User className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="checkout-name"
              className="pl-11"
              placeholder="Mukul Sharma"
              {...form.register('recipientName')}
            />
          </div>
          <FieldError message={form.formState.errors.recipientName?.message} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="checkout-phone">Phone</Label>
          <div className="relative">
            <Phone className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="checkout-phone"
              type="tel"
              className="pl-11"
              placeholder="+91 98765 43210"
              {...form.register('phone')}
            />
          </div>
          <FieldError message={form.formState.errors.phone?.message} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="checkout-address-1">Address line 1</Label>
        <div className="relative">
          <MapPinned className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="checkout-address-1"
            className="pl-11"
            placeholder="House / street / apartment"
            {...form.register('addressLine1')}
          />
        </div>
        <FieldError message={form.formState.errors.addressLine1?.message} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="checkout-landmark">Landmark</Label>
        <Input
          id="checkout-landmark"
          placeholder="Near the temple entrance"
          {...form.register('landmark')}
        />
        <FieldError message={form.formState.errors.landmark?.message} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="checkout-address-2">Address line 2</Label>
        <Input
          id="checkout-address-2"
          placeholder="Locality, building, or flat number"
          {...form.register('addressLine2')}
        />
        <FieldError message={form.formState.errors.addressLine2?.message} />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="checkout-city">City</Label>
          <Input id="checkout-city" placeholder="Prayagraj" {...form.register('city')} />
          <FieldError message={form.formState.errors.city?.message} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="checkout-state">State</Label>
          <Input id="checkout-state" placeholder="Uttar Pradesh" {...form.register('state')} />
          <FieldError message={form.formState.errors.state?.message} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="checkout-postal">Postal code</Label>
          <Input
            id="checkout-postal"
            placeholder="211001"
            {...form.register('postalCode')}
          />
          <FieldError message={form.formState.errors.postalCode?.message} />
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button
          type="submit"
          className="w-full sm:w-auto"
          disabled={form.formState.isSubmitting || paymentConfigLoading || !paymentConfig || items.length === 0 || unavailableItems.length > 0}
        >
        {form.formState.isSubmitting ? (
          <span className="inline-flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Placing order
          </span>
        ) : (
          'Create order & view UPI instructions'
        )}
        </Button>
        <Button asChild variant="outline">
          <Link to={routes.cart}>Review cart</Link>
        </Button>
      </div>
    </form>
  )
}
