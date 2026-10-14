import { CheckoutForm } from '@/features/checkout/ui/checkout-form'
import { SectionHeading } from '@/components/layout/section-heading'
import { Seo } from '@/components/layout/seo'

export function Component() {
  return (
    <div className="space-y-8">
      <Seo title="Checkout" description="Save a delivery address and prepare the checkout foundation." />
      <SectionHeading
        eyebrow="Checkout"
        title="Delivery details"
        description="Save a delivery address to your Supabase account so the checkout flow can build on real customer data."
      />
      <CheckoutForm />
    </div>
  )
}
