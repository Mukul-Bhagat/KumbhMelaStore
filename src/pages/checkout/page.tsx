import { CheckoutForm } from '@/features/checkout/ui/checkout-form'
import { SectionHeading } from '@/components/layout/section-heading'
import { Seo } from '@/components/layout/seo'

export function Component() {
  return (
    <div className="space-y-8">
      <Seo title="Checkout" description="Confirm delivery details, create your order, and view approved manual UPI payment instructions." />
      <SectionHeading
        eyebrow="Checkout"
        title="Complete your order"
        description="Confirm your delivery details. Your order total is validated against the current catalog before approved manual UPI instructions are shown."
      />
      <CheckoutForm />
    </div>
  )
}
