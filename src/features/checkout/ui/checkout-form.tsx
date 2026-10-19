import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, MapPinned, Phone, User } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'

import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
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

type CheckoutRequest = {
  fingerprint: string | null
  id: string
}

const checkoutRequestStorageKey = 'kumbh-melastore-checkout-request-v1'

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
  if (/cart|product|stock|currency|delivery address|checkout request|manual upi|too many checkout/i.test(message)) {
    return message
  }
  return 'We could not create your order right now. Your cart is unchanged; please try again or contact support.'
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
  const items = checkoutNowItem ? [checkoutNowItem] : cartItems
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
  const [paymentConfigLoading, setPaymentConfigLoading] = useState(true)
  const [paymentConfigError, setPaymentConfigError] = useState<string | null>(null)
  const [paymentConfigRetry, setPaymentConfigRetry] = useState(0)

  const form = useForm<CheckoutValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues,
    mode: 'onChange',
    reValidateMode: 'onChange',
  })

  useEffect(() => {
    form.reset({
      ...defaultValues,
      recipientName: auth.profile?.displayName ?? auth.profile?.fullName ?? '',
      phone: auth.profile?.phone ?? '',
    }, { keepDirtyValues: true })
  }, [auth.profile?.displayName, auth.profile?.fullName, auth.profile?.phone, auth.user?.id, form])

  useEffect(() => {
    let active = true
    if (!auth.user) {
      setPaymentConfig(null)
      setPaymentConfigLoading(false)
      setPaymentConfigError('Sign in to check payment availability.')
      return () => { active = false }
    }

    const loadPaymentConfig = async () => {
      setPaymentConfigLoading(true)
      setPaymentConfigError(null)
      try {
        const { data, error } = await supabase.rpc('get_manual_upi_payment_config')
        if (!active) return
        if (error) {
          setPaymentConfig(null)
          setPaymentConfigError('Manual UPI payment is currently unavailable. Please contact support.')
          return
        }

        const config = readManualPaymentConfig(data)
        setPaymentConfig(config)
        setPaymentConfigError(config
          ? null
          : 'Manual UPI payment is not enabled by the store right now. Please contact support before trying again.')
      } catch {
        if (!active) return
        setPaymentConfig(null)
        setPaymentConfigError('We could not check payment availability. Check your connection and try again.')
      } finally {
        if (active) setPaymentConfigLoading(false)
      }
    }

    void loadPaymentConfig()
    return () => { active = false }
  }, [auth.user?.id, paymentConfigRetry, supabase])

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

      const authoritativeCartItems = items.map((item) => ({
        productId: item.productId,
        variantId: item.variantId ?? null,
        quantity: item.quantity,
      }))
      const shippingAddress = {
        label: values.label.trim(),
        recipientName: values.recipientName.trim(),
        phone: values.phone.trim(),
        addressLine1: values.addressLine1.trim(),
        addressLine2: values.addressLine2?.trim() ?? '',
        city: values.city.trim(),
        state: values.state.trim(),
        postalCode: values.postalCode.trim(),
        countryCode: 'IN',
        landmark: values.landmark?.trim() ?? '',
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

  const cartIsReady = items.length > 0 && unavailableItems.length === 0
  const formIsReady = form.formState.isValid
  const isSubmitDisabled = form.formState.isSubmitting || !formIsReady || !cartIsReady || paymentConfigLoading || !paymentConfig
  const checkoutBlocker = paymentConfigLoading
    ? 'Checking approved UPI payment availability…'
    : paymentConfigError
      ? paymentConfigError
      : !cartIsReady
        ? 'Review your cart before creating an order.'
        : !formIsReady
          ? 'Complete the required delivery details to create your order.'
          : null

  return (
    <form onSubmit={onSubmit} className="space-y-6" noValidate>
      <Alert
        title="Authenticated account"
        description={`Your order will be created for ${auth.user?.email ?? 'your account'} and will remain pending until manual UPI payment is verified.`}
      />

      {paymentConfigLoading ? (
        <Alert title="Checking payment availability" description="Loading the approved payment destination…" />
      ) : paymentConfigError ? (
        <Alert
          title="Payment currently unavailable"
          description={
            <div className="space-y-3">
              <p>{paymentConfigError}</p>
              <Button type="button" size="sm" variant="outline" onClick={() => setPaymentConfigRetry((value) => value + 1)}>
                Check again
              </Button>
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
          <Label htmlFor="checkout-label">Address label</Label>
          <Input id="checkout-label" autoComplete="shipping address-level3" {...form.register('label')} />
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
        <Label htmlFor="checkout-landmark">Landmark <span className="font-normal text-muted-foreground">(optional)</span></Label>
        <Input id="checkout-landmark" placeholder="Near the temple entrance" {...form.register('landmark')} />
        <FieldError message={form.formState.errors.landmark?.message} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="checkout-address-2">Address line 2 <span className="font-normal text-muted-foreground">(optional)</span></Label>
        <Input id="checkout-address-2" autoComplete="shipping address-line2" placeholder="Locality, building, or flat number" {...form.register('addressLine2')} />
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
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button type="submit" className="w-full sm:w-auto" disabled={isSubmitDisabled}>
            {form.formState.isSubmitting ? (
              <span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />Creating order</span>
            ) : 'Create order & view UPI instructions'}
          </Button>
          <Button asChild variant="outline"><Link to={routes.cart}>Review cart</Link></Button>
        </div>
        {checkoutBlocker ? <p className="text-sm text-muted-foreground" role="status">{checkoutBlocker}</p> : null}
      </div>
    </form>
  )
}
