import { DocumentPage } from '@/components/layout/document-page'

export function Component() {
  return (
    <DocumentPage
      title="Privacy Policy"
      description="How we collect, use, and protect your data."
      breadcrumbs={[{ label: 'Privacy Policy' }]}
      updatedOn="July 2, 2026"
      sections={[
        {
          title: 'Information we collect',
          body: (
            <p>
              We collect information you share while creating an account, placing an
              order, or contacting the studio. This may include your name, contact
              details, and delivery information.
            </p>
          ),
        },
        {
          title: 'How we use it',
          body: (
            <p>
              Data is used to process orders, improve the shopping experience, provide
              support, and keep the platform secure. We do not sell personal data.
            </p>
          ),
        },
      ]}
    />
  )
}
