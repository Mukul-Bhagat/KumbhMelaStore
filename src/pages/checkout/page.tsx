import { CheckoutForm } from '@/features/checkout/ui/checkout-form'
import { SectionHeading } from '@/components/layout/section-heading'
import { Seo } from '@/components/layout/seo'

export function Component() {
  return (
    <div className="space-y-8">
      <Seo title="Checkout" description="Confirm delivery details and place a cash-on-delivery order." />
      <SectionHeading
        eyebrow="Checkout"
        title="Complete your order"
        description="Confirm your delivery details and place your order securely against current Supabase catalog prices."
      />
      <CheckoutForm />
    </div>
  )
}
