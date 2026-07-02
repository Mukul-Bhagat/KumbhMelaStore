import { DocumentPage } from '@/components/layout/document-page'

export function Component() {
  return (
    <DocumentPage
      title="Terms"
      description="The terms that govern use of the KumbhMelaStore website."
      breadcrumbs={[{ label: 'Terms' }]}
      updatedOn="July 2, 2026"
      sections={[
        {
          title: 'Use of the site',
          body: (
            <p>
              By using the site, you agree to use the content and services lawfully and
              to provide accurate information when creating an account or placing an
              order.
            </p>
          ),
        },
        {
          title: 'Orders and payment',
          body: (
            <p>
              Orders are subject to availability, verification, and our fulfillment
              policies. Payment must be completed through approved methods at checkout.
            </p>
          ),
        },
      ]}
    />
  )
}
