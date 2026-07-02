import { zodResolver } from '@hookform/resolvers/zod'
import { CreditCard, Mail, MapPinned, Phone, User } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  checkoutSchema,
  type CheckoutValues,
} from '@/features/checkout/model/schema'

export function CheckoutForm() {
  const form = useForm<CheckoutValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      fullName: '',
      email: '',
      phone: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      postalCode: '',
      paymentMethod: 'card',
      notes: '',
    },
  })

  const onSubmit = form.handleSubmit(() => {
    toast.success('Checkout details saved.')
  })

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="checkout-name">Full name</Label>
          <div className="relative">
            <User className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="checkout-name"
              className="pl-11"
              placeholder="Mukul Sharma"
              {...form.register('fullName')}
            />
          </div>
          {form.formState.errors.fullName ? (
            <p className="text-xs text-error">
              {form.formState.errors.fullName.message}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="checkout-email">Email</Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="checkout-email"
              type="email"
              className="pl-11"
              placeholder="name@example.com"
              {...form.register('email')}
            />
          </div>
          {form.formState.errors.email ? (
            <p className="text-xs text-error">{form.formState.errors.email.message}</p>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
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
          {form.formState.errors.phone ? (
            <p className="text-xs text-error">{form.formState.errors.phone.message}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="checkout-payment">Payment method</Label>
          <div className="relative">
            <CreditCard className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Select
              id="checkout-payment"
              className="pl-11"
              {...form.register('paymentMethod')}
            >
              <option value="card">Card</option>
              <option value="upi">UPI</option>
              <option value="cod">Cash on Delivery</option>
            </Select>
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
        {form.formState.errors.addressLine1 ? (
          <p className="text-xs text-error">
            {form.formState.errors.addressLine1.message}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="checkout-address-2">Address line 2</Label>
        <Input
          id="checkout-address-2"
          placeholder="Landmark, locality, or building name"
          {...form.register('addressLine2')}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="checkout-city">City</Label>
          <Input id="checkout-city" placeholder="Jaipur" {...form.register('city')} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="checkout-state">State</Label>
          <Input id="checkout-state" placeholder="Rajasthan" {...form.register('state')} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="checkout-postal">Postal code</Label>
          <Input
            id="checkout-postal"
            placeholder="302001"
            {...form.register('postalCode')}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="checkout-notes">Delivery notes</Label>
        <Textarea
          id="checkout-notes"
          rows={4}
          placeholder="Gate code, preferred delivery window, or gifting note."
          {...form.register('notes')}
        />
      </div>

      <Button type="submit" className="w-full sm:w-auto">
        Continue to payment
      </Button>
    </form>
  )
}
