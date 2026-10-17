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

      if (checkoutNowItem) {
        finishCheckoutNow()
      } else {
        clearCart()
      }
      setPlacedOrder(order)
      setRequest(null)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to place your order.')
    }
  })

  if (placedOrder) {
    return (
      <div className="space-y-6">
        <Alert
          title="Order placed"
          description={
            <div className="space-y-2">
              <p>
                Order <strong>{placedOrder.order_number}</strong> has been placed for{' '}
                <strong>{formatCurrency(placedOrder.grand_total, placedOrder.currency)}</strong>.
                Payment is cash on delivery.
              </p>
              <p>Keep tracking code {placedOrder.public_tracking_code} for shipment lookup.</p>
            </div>
          }
          variant="success"
        />
        <Button asChild>
          <Link to={routes.dashboard.orders}>View your orders</Link>
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <Alert
        title="Authenticated account"
        description={`Your order will be placed for ${auth.user?.email ?? 'your account'} with cash on delivery.`}
      />

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
          disabled={form.formState.isSubmitting || items.length === 0 || unavailableItems.length > 0}
        >
        {form.formState.isSubmitting ? (
          <span className="inline-flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Placing order
          </span>
        ) : (
          'Place order · Cash on delivery'
        )}
        </Button>
        <Button asChild variant="outline">
          <Link to={routes.cart}>Review cart</Link>
        </Button>
      </div>
    </form>
  )
}
