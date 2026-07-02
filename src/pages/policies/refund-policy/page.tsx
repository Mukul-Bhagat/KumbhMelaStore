import { DocumentPage } from '@/components/layout/document-page'

export function Component() {
  return (
    <DocumentPage
      title="Refund Policy"
      description="How refunds, replacements, and returns are handled."
      breadcrumbs={[{ label: 'Refund Policy' }]}
      updatedOn="July 2, 2026"
      sections={[
        {
          title: 'Eligibility',
          body: (
            <p>
              Refunds are evaluated for damaged, incorrect, or materially defective
              items when reported within the stated return window.
            </p>
          ),
        },
        {
          title: 'Process',
          body: (
            <p>
              Contact the studio with your order number and a brief description. We’ll
              guide you through the next steps and keep the communication clear.
            </p>
          ),
        },
      ]}
    />
  )
}
