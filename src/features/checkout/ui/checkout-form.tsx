import { zodResolver } from '@hookform/resolvers/zod'
import { Copy, Loader2, MapPinned, Phone, User } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'

import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  checkoutSchema,
  type CheckoutValues,
} from '@/features/checkout/model/schema'
import { getSupabaseBrowserClient } from '@/shared/api/supabase'
import { useAuth } from '@/shared/auth/provider'
import { routes } from '@/shared/config/routes'
import { formatCurrency } from '@/shared/lib/format'
import { useCartStore } from '@/shared/stores/cart-store'

type ManualPaymentConfig = {
  available: true
  merchantName: string
  upiId: string
  qrImageUrl: string
  instructions: string
  supportContact: string | null
}

type ManualPaymentQuote = {
  amount: number
  currency: string
  payment: ManualPaymentConfig
}

type ConfigurationState = 'loading' | 'ready' | 'unavailable'
type QuoteState = 'idle' | 'loading' | 'ready' | 'unavailable'

type CheckoutRequest = {
  fingerprint: string | null
  id: string
}

const checkoutRequestStorageKey = 'kumbh-melastore-checkout-request-v1'

const defaultValues: CheckoutValues = {
  recipientName: '',
  phone: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  postalCode: '',
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

  let qrUrl: URL
  try {
    qrUrl = new URL(config.qrImageUrl)
  } catch {
    return null
  }
  if (
    !config.merchantName.trim() ||
    !/^[A-Za-z0-9._-]{2,256}@[A-Za-z0-9._-]{2,64}$/.test(config.upiId) ||
    qrUrl.protocol !== 'https:'
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

function readManualPaymentQuote(value: unknown): ManualPaymentQuote | null {
  const quote = asRecord(value)
  const payment = readManualPaymentConfig(quote?.payment)
  if (
    typeof quote?.amount !== 'number' ||
    !Number.isFinite(quote.amount) ||
    quote.amount <= 0 ||
    typeof quote.currency !== 'string' ||
    quote.currency !== 'INR' ||
    !payment
  ) return null

  return { amount: quote.amount, currency: quote.currency, payment }
}

function isUuid(value: unknown): value is string {
  return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

async function fingerprintCheckoutRequest(payload: unknown): Promise<string | null> {
  if (!globalThis.crypto?.subtle) return null

  const digest = await globalThis.crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(JSON.stringify(payload)),
  )
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

function readStoredCheckoutRequest(fingerprint: string): CheckoutRequest | null {
  try {
    const stored = asRecord(JSON.parse(sessionStorage.getItem(checkoutRequestStorageKey) ?? 'null'))
    return stored?.fingerprint === fingerprint && isUuid(stored.id)
      ? { fingerprint, id: stored.id }
      : null
  } catch {
    return null
  }
}

function storeCheckoutRequest(request: CheckoutRequest) {
  if (!request.fingerprint) return
  try {
    // Keep only a one-way fingerprint and opaque UUID; address data stays out of browser storage.
    sessionStorage.setItem(checkoutRequestStorageKey, JSON.stringify(request))
  } catch {
    // Checkout still works in browsers that block session storage.
  }
}

function clearStoredCheckoutRequest() {
  try {
    sessionStorage.removeItem(checkoutRequestStorageKey)
  } catch {
    // Nothing else is required when storage is unavailable.
  }
}

function checkoutErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message.trim() : ''
  if (/sign in|session|jwt/i.test(message)) {
    return 'Your session has expired. Sign in again before placing your order.'
  }
  if (/cart|product|stock|currency|delivery address|checkout request|manual upi|too many checkout|transaction reference/i.test(message)) {
    return message
  }
  return 'We could not create your order right now. Your cart is unchanged; please try again or contact support.'
}

function rpcErrorMessage(rpcName: string, error: unknown) {
  const details = asRecord(error)
  const code = typeof details?.code === 'string' ? details.code : ''
  const message = typeof details?.message === 'string' ? details.message : ''

  if (code === '42501' || /sign in|session|jwt|permission denied/i.test(message)) {
    return 'Your session has expired. Sign in again and retry checkout.'
  }
  if (code === 'PGRST202' || /could not find.*function|function.*does not exist/i.test(message)) {
    return rpcName === 'get_manual_upi_payment_config'
      ? 'Manual UPI configuration is unavailable because the payment database migration is not active in this environment.'
      : 'Checkout pricing is unavailable because the payment quote database migration is not active in this environment.'
  }
  if (/manual upi|configuration|enabled|upi/i.test(message)) {
    return `Manual UPI configuration is unavailable: ${message}`
  }
  return rpcName === 'get_manual_upi_payment_config'
    ? 'We could not load manual UPI configuration. Please retry; if this continues, contact support.'
    : 'We could not calculate the current checkout total. Please retry; your cart has not changed.'
}

function logRpcDiagnostic(rpcName: string, outcome: 'success' | 'failure' | 'invalid_response', error?: unknown) {
  if (!import.meta.env.DEV) return
  const details = asRecord(error)
  const status = typeof details?.status === 'number' ? details.status : null
  const code = typeof details?.code === 'string' ? details.code : null
  const message = typeof details?.message === 'string' ? details.message : null
  const project = (() => {
    try { return new URL(import.meta.env.VITE_SUPABASE_URL).host } catch { return 'invalid-url' }
  })()
  // Deliberately excludes credentials, addresses, cart content, and request bodies.
  console.info('[checkout RPC]', { rpcName, outcome, status, code, message, project })
}

function supportHref(contact: string | null): string | null {
  const value = contact?.trim() ?? ''
  if (!value) return null
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return `mailto:${value}`
  if (/^https?:\/\//i.test(value)) return value

  const phone = value.replace(/[\s()-]/g, '')
  return /^\+?[0-9]{7,15}$/.test(phone) ? `tel:${phone}` : null
}

function FieldError({ message }: { message: string | undefined }) {
  return message ? <p className="text-xs text-error" role="alert">{message}</p> : null
}

export function CheckoutForm() {
  const auth = useAuth()
  const navigate = useNavigate()
  const supabase = getSupabaseBrowserClient()
  const cartItems = useCartStore((state) => state.items)
  const checkoutNowItem = useCartStore((state) => state.checkoutNowItem)
  const clearCart = useCartStore((state) => state.clear)
  const finishCheckoutNow = useCartStore((state) => state.finishCheckoutNow)
  const items = useMemo(
    () => checkoutNowItem ? [checkoutNowItem] : cartItems,
    [cartItems, checkoutNowItem],
  )
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const currency = items[0]?.currency ?? 'INR'
  const unavailableItems = items.filter((item) =>
    item.available === false ||
    item.quantity < 1 ||
    item.quantity > 99 ||
    (item.maxQuantity != null && item.quantity > item.maxQuantity),
  )
  const [message, setMessage] = useState<string | null>(null)
  const [request, setRequest] = useState<CheckoutRequest | null>(null)
  const [paymentConfig, setPaymentConfig] = useState<ManualPaymentConfig | null>(null)
  const [configurationState, setConfigurationState] = useState<ConfigurationState>('loading')
  const [paymentConfigError, setPaymentConfigError] = useState<string | null>(null)
  const [paymentConfigRetry, setPaymentConfigRetry] = useState(0)
  const [paymentQuote, setPaymentQuote] = useState<ManualPaymentQuote | null>(null)
  const [quoteCartSignature, setQuoteCartSignature] = useState<string | null>(null)
  const [quoteState, setQuoteState] = useState<QuoteState>('idle')
  const [quoteError, setQuoteError] = useState<string | null>(null)
  const [quoteRetry, setQuoteRetry] = useState(0)
  const [showPaymentStep, setShowPaymentStep] = useState(false)
  const [qrImageFailed, setQrImageFailed] = useState(false)
  const [copyMessage, setCopyMessage] = useState<string | null>(null)
  const [paymentReference, setPaymentReference] = useState('')

  const form = useForm<CheckoutValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues,
    mode: 'onChange',
    reValidateMode: 'onChange',
  })
  const cartIsReady = items.length > 0 && unavailableItems.length === 0
  const formIsReady = form.formState.isValid
  const cartRequestItems = useMemo(() => items.map((item) => ({
    productId: item.productId,
    variantId: item.variantId ?? null,
    quantity: item.quantity,
  })), [items])
  const cartRequestSignature = JSON.stringify(cartRequestItems)
  const hasAuthenticatedSession = Boolean(auth.user?.id)
  const effectiveConfigurationState: ConfigurationState = hasAuthenticatedSession
    ? configurationState
    : 'unavailable'
  const effectiveConfigurationError = hasAuthenticatedSession
    ? paymentConfigError
    : 'Your session has expired. Sign in again and retry checkout.'

  useEffect(() => {
    form.reset({
      ...defaultValues,
      recipientName: auth.profile?.displayName ?? auth.profile?.fullName ?? '',
      phone: auth.profile?.phone ?? '',
    }, { keepDirtyValues: true })
  }, [auth.profile?.displayName, auth.profile?.fullName, auth.profile?.phone, auth.user?.id, form])

  useEffect(() => {
    let active = true
    if (!auth.user?.id) {
      return () => { active = false }
    }

    const loadPaymentConfig = async () => {
      setConfigurationState('loading')
      setPaymentConfigError(null)
      try {
        const { data, error } = await supabase.rpc('get_manual_upi_payment_config')
        if (!active) return
        if (error) {
          logRpcDiagnostic('get_manual_upi_payment_config', 'failure', error)
          setPaymentConfig(null)
          setConfigurationState('unavailable')
          setPaymentConfigError(rpcErrorMessage('get_manual_upi_payment_config', error))
          return
        }

        const config = readManualPaymentConfig(data)
        setPaymentConfig(config)
        setQrImageFailed(false)
        if (config) {
          logRpcDiagnostic('get_manual_upi_payment_config', 'success')
          setConfigurationState('ready')
          setPaymentConfigError(null)
        } else {
          const reason = asRecord(data)?.reason
          logRpcDiagnostic('get_manual_upi_payment_config', 'invalid_response')
          setConfigurationState('unavailable')
          setPaymentConfigError(reason === 'disabled'
            ? 'Manual UPI payment is currently disabled by the store.'
            : reason === 'invalid_configuration'
              ? 'Manual UPI payment configuration is incomplete or invalid. Please contact support.'
              : 'Manual UPI payment configuration is unavailable. Please contact support.')
        }
      } catch (error) {
        if (!active) return
        logRpcDiagnostic('get_manual_upi_payment_config', 'failure', error)
        setPaymentConfig(null)
        setConfigurationState('unavailable')
        setPaymentConfigError('We could not load manual UPI configuration. Check your connection and retry.')
      }
    }

    void loadPaymentConfig()
    return () => { active = false }
  }, [auth.user?.id, paymentConfigRetry, supabase])

  useEffect(() => {
    let active = true
    if (!auth.user?.id || configurationState !== 'ready' || !paymentConfig || !cartIsReady || !formIsReady) {
      return () => { active = false }
    }

    const loadQuote = async () => {
      setQuoteState('loading')
      setQuoteError(null)
      try {
        const { data, error } = await supabase.rpc('get_manual_upi_checkout_quote', {
          p_cart_items: cartRequestItems,
        })
        if (!active) return
        if (error) {
          logRpcDiagnostic('get_manual_upi_checkout_quote', 'failure', error)
          setPaymentQuote(null)
          setQuoteState('unavailable')
          setQuoteError(rpcErrorMessage('get_manual_upi_checkout_quote', error))
          return
        }

        const quote = readManualPaymentQuote(data)
        if (!quote) {
          logRpcDiagnostic('get_manual_upi_checkout_quote', 'invalid_response')
          setPaymentQuote(null)
          setQuoteState('unavailable')
          setQuoteError('The checkout quote returned an invalid amount or payment configuration. Please retry.')
          return
        }

        logRpcDiagnostic('get_manual_upi_checkout_quote', 'success')
        setPaymentQuote(quote)
        setQuoteCartSignature(cartRequestSignature)
        setQuoteState('ready')
      } catch (error) {
        if (!active) return
        logRpcDiagnostic('get_manual_upi_checkout_quote', 'failure', error)
        setPaymentQuote(null)
        setQuoteState('unavailable')
        setQuoteError(rpcErrorMessage('get_manual_upi_checkout_quote', error))
      }
    }

    void loadQuote()
    return () => { active = false }
  }, [auth.user?.id, cartIsReady, cartRequestItems, cartRequestSignature, configurationState, formIsReady, paymentConfig, quoteRetry, supabase])

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
        throw new Error('Manual UPI payment is not enabled by the store right now. Please contact support.')
      }
      if (!paymentQuote || quoteCartSignature !== cartRequestSignature) {
        throw new Error('The checkout total is no longer current. Recalculate it before placing your order.')
      }
      const reference = paymentReference.trim()
      if (reference && (reference.length < 4 || reference.length > 128)) {
        throw new Error('Enter a valid UPI transaction reference or leave it blank.')
      }

      const authoritativeCartItems = items.map((item) => ({
        productId: item.productId,
        variantId: item.variantId ?? null,
        quantity: item.quantity,
      }))
      const shippingAddress = {
        // These fields remain server-side defaults for the existing saved-address schema.
        // Customers are deliberately not asked to choose a label or country at checkout.
        label: 'Delivery address',
        recipientName: values.recipientName.trim(),
        phone: values.phone.trim(),
        addressLine1: values.addressLine1.trim(),
        addressLine2: values.addressLine2.trim(),
        city: values.city.trim(),
        state: values.state.trim(),
        postalCode: values.postalCode.trim(),
        countryCode: 'IN',
      }
      const fingerprint = await fingerprintCheckoutRequest({
        cartItems: authoritativeCartItems,
        shippingAddress,
      })
      const storedRequest = fingerprint ? readStoredCheckoutRequest(fingerprint) : null
      const checkoutRequest = request?.fingerprint === fingerprint
        ? request
        : storedRequest ?? { fingerprint, id: globalThis.crypto.randomUUID() }

      setRequest(checkoutRequest)
      storeCheckoutRequest(checkoutRequest)

      const { data, error } = await supabase.rpc('place_order', {
        p_cart_items: authoritativeCartItems,
        p_shipping_address: shippingAddress,
        p_checkout_request_id: checkoutRequest.id,
      })
      if (error) throw error

      const order = data?.[0]
      if (!order) {
        throw new Error('Supabase did not return the order confirmation.')
      }

      // A UTR is only unverified customer evidence. The database RPC deliberately
      // cannot change payment_status, even when the reference is accepted.
      if (reference) {
        const { error: referenceError } = await supabase.rpc('submit_manual_upi_reference', {
          p_order_id: order.order_id,
          p_transaction_reference: reference,
          p_note: null,
        })
        if (referenceError) throw referenceError
      }

      if (checkoutNowItem) {
        finishCheckoutNow()
      } else {
        clearCart()
      }
      clearStoredCheckoutRequest()
      setRequest(null)
      navigate(routes.dashboard.orderPayment(order.order_id), { replace: true })
    } catch (error) {
      setMessage(checkoutErrorMessage(error))
    }
  })

  const reviewPayment = form.handleSubmit(() => {
    setMessage(null)
    setCopyMessage(null)
    if (quoteState === 'ready' && paymentQuote && quoteCartSignature === cartRequestSignature) setShowPaymentStep(true)
  })

  const copyUpiId = async () => {
    if (!paymentConfig) return
    try {
      await navigator.clipboard.writeText(paymentConfig.upiId)
      setCopyMessage('UPI ID copied.')
    } catch {
      setCopyMessage('Copy is unavailable in this browser. Select the UPI ID to copy it manually.')
    }
  }

  const retryConfiguration = () => {
    setPaymentQuote(null)
    setQuoteCartSignature(null)
    setQuoteError(null)
    setQuoteState('idle')
    setShowPaymentStep(false)
    setPaymentConfigRetry((value) => value + 1)
  }
  const retryQuote = () => {
    setPaymentQuote(null)
    setQuoteCartSignature(null)
    setQuoteError(null)
    setQuoteState('idle')
    setShowPaymentStep(false)
    setQuoteRetry((value) => value + 1)
  }
  const isQuoteCurrent = quoteCartSignature === cartRequestSignature
  const isSubmitDisabled = form.formState.isSubmitting || !formIsReady || !cartIsReady || effectiveConfigurationState !== 'ready' || quoteState !== 'ready' || !isQuoteCurrent || !paymentConfig || !paymentQuote
  const checkoutBlocker = effectiveConfigurationState === 'loading'
    ? 'Checking approved UPI payment availability…'
    : effectiveConfigurationError
      ? effectiveConfigurationError
      : !cartIsReady
        ? 'Review your cart before creating an order.'
        : !formIsReady
          ? 'Complete the required delivery details to create your order.'
          : quoteState === 'loading'
            ? 'Calculating the current server-validated total…'
            : quoteError
              ? quoteError
              : quoteState === 'idle'
                ? 'Preparing the server-validated total…'
          : null

  return (
    <form onSubmit={showPaymentStep ? onSubmit : reviewPayment} className="space-y-6" noValidate>
      <Alert
        title="Authenticated account"
        description={`Your order will be created for ${auth.user?.email ?? 'your account'} and will remain pending until manual UPI payment is verified.`}
      />

      {effectiveConfigurationState === 'loading' ? (
        <Alert title="Checking payment availability" description="Loading the approved payment destination…" />
      ) : effectiveConfigurationError ? (
        <Alert
          title="Payment currently unavailable"
          description={
            <div className="space-y-3">
              <p>{effectiveConfigurationError}</p>
              <Button type="button" size="sm" variant="outline" onClick={retryConfiguration}>
                Check again
              </Button>
            </div>
          }
          variant="error"
        />
      ) : null}

      {quoteError ? (
        <Alert
          title="Checkout total unavailable"
          description={
            <div className="space-y-3">
              <p>{quoteError}</p>
              <Button type="button" size="sm" variant="outline" onClick={retryQuote}>Recalculate total</Button>
            </div>
          }
          variant="error"
        />
      ) : null}

      {message ? <Alert title="Unable to place order" description={message} variant="error" /> : null}

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
          ) : 'Your cart is empty. Add products before placing an order.'
        }
      />

      <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
        <Link to={routes.privacyPolicy} className="underline underline-offset-4 hover:text-foreground">Privacy policy</Link>
        <Link to={routes.terms} className="underline underline-offset-4 hover:text-foreground">Terms & conditions</Link>
        <Link to={routes.shippingPolicy} className="underline underline-offset-4 hover:text-foreground">Shipping policy</Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="checkout-name">Recipient name</Label>
          <div className="relative">
            <User className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input id="checkout-name" className="pl-11" autoComplete="shipping name" placeholder="Mukul Sharma" {...form.register('recipientName')} />
          </div>
          <FieldError message={form.formState.errors.recipientName?.message} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="checkout-phone">Phone</Label>
          <div className="relative">
            <Phone className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input id="checkout-phone" type="tel" inputMode="tel" className="pl-11" autoComplete="tel" placeholder="+91 98765 43210" {...form.register('phone')} />
          </div>
          <FieldError message={form.formState.errors.phone?.message} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="checkout-address-1">Address line 1</Label>
        <div className="relative">
          <MapPinned className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input id="checkout-address-1" className="pl-11" autoComplete="shipping address-line1" placeholder="House / street / apartment" {...form.register('addressLine1')} />
        </div>
        <FieldError message={form.formState.errors.addressLine1?.message} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="checkout-address-2">Address line 2</Label>
        <Input id="checkout-address-2" autoComplete="shipping address-line2" placeholder="Locality, building, floor, or flat number" {...form.register('addressLine2')} />
        <FieldError message={form.formState.errors.addressLine2?.message} />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="checkout-city">City</Label>
          <Input id="checkout-city" autoComplete="shipping address-level2" placeholder="Prayagraj" {...form.register('city')} />
          <FieldError message={form.formState.errors.city?.message} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="checkout-state">State</Label>
          <Input id="checkout-state" autoComplete="shipping address-level1" placeholder="Uttar Pradesh" {...form.register('state')} />
          <FieldError message={form.formState.errors.state?.message} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="checkout-postal">PIN code</Label>
          <Input id="checkout-postal" inputMode="numeric" autoComplete="shipping postal-code" placeholder="211001" {...form.register('postalCode')} />
          <FieldError message={form.formState.errors.postalCode?.message} />
        </div>
      </div>

      <div className="space-y-2">
        {showPaymentStep && paymentConfig && paymentQuote ? (
          <section className="space-y-4 rounded-[var(--radius-card)] border border-primary/30 bg-primary/5 p-4 sm:p-6" aria-labelledby="manual-upi-payment-heading">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Payment step</p>
                <h2 id="manual-upi-payment-heading" className="mt-1 font-display text-2xl font-semibold">Pay by manual UPI</h2>
              </div>
              <p className="font-display text-xl font-semibold">{formatCurrency(paymentQuote.amount, paymentQuote.currency)}</p>
            </div>
            <p className="text-sm leading-6 text-muted-foreground">
              This exact INR total was calculated by Supabase from the current catalog. It is checked again before the pending order is created; the confirmation page shows the final authoritative total.
            </p>
            <div className="grid gap-5 sm:grid-cols-[12rem_minmax(0,1fr)] sm:items-center">
              <div className="rounded-[var(--radius-field)] border border-border bg-background p-2">
                {qrImageFailed ? (
                  <p className="p-4 text-sm text-error" role="alert">The approved QR image could not be loaded. Use the UPI ID below or contact us before paying.</p>
                ) : (
                  <img
                    src={paymentConfig.qrImageUrl}
                    alt={`Approved UPI QR code for ${paymentConfig.merchantName}`}
                    className="mx-auto aspect-square w-full object-contain"
                    referrerPolicy="no-referrer"
                    onError={() => setQrImageFailed(true)}
                  />
                )}
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Merchant</p>
                  <p className="font-semibold">{paymentConfig.merchantName}</p>
                </div>
                <div className="rounded-[var(--radius-field)] border border-border bg-background p-3">
                  <p className="text-sm text-muted-foreground">UPI ID</p>
                  <p className="mt-1 break-all font-mono text-base text-primary">{paymentConfig.upiId}</p>
                  <Button type="button" size="sm" variant="outline" className="mt-3" onClick={() => void copyUpiId()}>
                    <Copy className="h-4 w-4" />Copy UPI ID
                  </Button>
                  {copyMessage ? <p className="mt-2 text-xs text-muted-foreground" role="status">{copyMessage}</p> : null}
                </div>
                <p className="text-sm leading-6 text-muted-foreground">{paymentConfig.instructions}</p>
                <div className="space-y-2">
                  <Label htmlFor="checkout-payment-reference">Transaction reference / UTR <span className="font-normal text-muted-foreground">(optional)</span></Label>
                  <Input
                    id="checkout-payment-reference"
                    value={paymentReference}
                    onChange={(event) => setPaymentReference(event.target.value)}
                    placeholder="UPI transaction ID / UTR"
                    maxLength={128}
                  />
                  <p className="text-xs text-muted-foreground">If provided, it is saved only as unverified evidence for the store to review.</p>
                </div>
              </div>
            </div>
            <Alert title="Payment is not verified yet" description="Selecting “I've paid” only creates a pending order. It never marks payment as paid; the store must verify the actual UPI receipt." variant="warning" />
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Button type="submit" className="w-full sm:w-auto" disabled={isSubmitDisabled}>
                {form.formState.isSubmitting ? (
                  <span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />Creating pending order</span>
                ) : "I've paid — create pending order"}
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowPaymentStep(false)}>Edit delivery details</Button>
              <Button asChild type="button" variant="outline"><Link to={routes.cart}>Not paid — return to cart</Link></Button>
              {supportHref(paymentConfig.supportContact) ? <Button asChild type="button" variant="outline"><a href={supportHref(paymentConfig.supportContact) ?? undefined}>Contact us</a></Button> : null}
            </div>
          </section>
        ) : (
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button type="submit" className="w-full sm:w-auto" disabled={isSubmitDisabled}>Review UPI payment</Button>
            <Button asChild variant="outline"><Link to={routes.cart}>Review cart</Link></Button>
          </div>
        )}
        {checkoutBlocker ? <p className="text-sm text-muted-foreground" role="status">{checkoutBlocker}</p> : null}
      </div>
    </form>
  )
}
