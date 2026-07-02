import { DocumentPage } from '@/components/layout/document-page'

export function Component() {
  return (
    <DocumentPage
      title="Shipping Policy"
      description="Delivery timelines, packaging, and dispatch notes."
      breadcrumbs={[{ label: 'Shipping Policy' }]}
      updatedOn="July 2, 2026"
      sections={[
        {
          title: 'Dispatch',
          body: (
            <p>
              Orders are packed carefully and dispatched as quickly as the item and
              address allow. Many core products are prepared for faster shipping.
            </p>
          ),
        },
        {
          title: 'Packaging',
          body: (
            <p>
              We use protective, gift-ready packaging designed to keep the product safe
              and make the unboxing feel premium.
            </p>
          ),
        },
      ]}
    />
  )
}
