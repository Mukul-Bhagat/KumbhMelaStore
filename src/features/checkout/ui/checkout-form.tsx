import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, MapPinned, Phone, User } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'

import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { useAuth } from '@/shared/auth/provider'
import { getSupabaseBrowserClient } from '@/shared/api/supabase'
import {
  checkoutSchema,
  type CheckoutValues,
} from '@/features/checkout/model/schema'

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

export function CheckoutForm() {
  const auth = useAuth()
  const supabase = getSupabaseBrowserClient()
  const [message, setMessage] = useState<string | null>(null)
  const [messageVariant, setMessageVariant] = useState<'success' | 'error'>('success')

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
        throw new Error('You must be signed in to save an address.')
      }

      const { data: existingAddress, error: existingAddressError } = await supabase
        .from('addresses')
        .select('id')
        .eq('user_id', auth.user.id)
        .eq('is_default', true)
        .maybeSingle()

      if (existingAddressError) {
        throw existingAddressError
      }

      const addressRecord = {
        user_id: auth.user.id,
        label: values.label,
        recipient_name: values.recipientName,
        phone: values.phone,
        line1: values.addressLine1,
        line2: values.addressLine2 || null,
        city: values.city,
        state: values.state,
        postal_code: values.postalCode,
        country_code: values.countryCode,
        landmark: values.landmark || null,
        is_default: true,
      }

      const mutation = existingAddress?.id
        ? supabase.from('addresses').update(addressRecord).eq('id', existingAddress.id)
        : supabase.from('addresses').insert(addressRecord)

      const { error } = await mutation

      if (error) {
        throw error
      }

      setMessageVariant('success')
      setMessage('Delivery address saved to Supabase. Your order foundation is ready.')
    } catch (error) {
      setMessageVariant('error')
      setMessage(error instanceof Error ? error.message : 'Unable to save checkout details.')
    }
  })

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <Alert
        title="Authenticated account"
        description={`Checkout is saving address details for ${auth.user?.email ?? 'your account'}.`}
      />

      {message ? (
        <Alert
          title={messageVariant === 'success' ? 'Address saved' : 'Unable to save address'}
          description={message}
          variant={messageVariant === 'success' ? 'success' : 'error'}
        />
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="checkout-label">Address label</Label>
          <Input id="checkout-label" {...form.register('label')} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="checkout-country">Country</Label>
          <Select id="checkout-country" {...form.register('countryCode')}>
            <option value="IN">India</option>
          </Select>
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
      </div>

      <div className="space-y-2">
        <Label htmlFor="checkout-landmark">Landmark</Label>
        <Input
          id="checkout-landmark"
          placeholder="Near the temple entrance"
          {...form.register('landmark')}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="checkout-address-2">Address line 2</Label>
        <Input
          id="checkout-address-2"
          placeholder="Locality, building, or flat number"
          {...form.register('addressLine2')}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="checkout-city">City</Label>
          <Input id="checkout-city" placeholder="Prayagraj" {...form.register('city')} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="checkout-state">State</Label>
          <Input id="checkout-state" placeholder="Uttar Pradesh" {...form.register('state')} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="checkout-postal">Postal code</Label>
          <Input
            id="checkout-postal"
            placeholder="211001"
            {...form.register('postalCode')}
          />
        </div>
      </div>

      <Button type="submit" className="w-full sm:w-auto" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? (
          <span className="inline-flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Saving
          </span>
        ) : (
          'Save address'
        )}
      </Button>
    </form>
  )
}
