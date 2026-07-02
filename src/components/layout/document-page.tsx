import type { ReactNode } from 'react'

import { Breadcrumb, type BreadcrumbItem } from '@/components/ui/breadcrumb'
import { Card, CardContent } from '@/components/ui/card'
import { SectionHeading } from '@/components/layout/section-heading'
import { Separator } from '@/components/ui/separator'
import { Seo } from '@/components/layout/seo'

export interface DocumentSection {
  title: string
  body: ReactNode
}

export interface DocumentPageProps {
  title: string
  description: string
  breadcrumbs?: BreadcrumbItem[]
  sections: DocumentSection[]
  updatedOn?: string
}

export function DocumentPage({
  title,
  description,
  breadcrumbs,
  sections,
  updatedOn,
}: DocumentPageProps) {
  return (
    <div className="space-y-10">
      <Seo title={title} description={description} />
      {breadcrumbs?.length ? <Breadcrumb items={breadcrumbs} /> : null}
      <SectionHeading
        eyebrow={updatedOn ? `Updated ${updatedOn}` : 'Policy'}
        title={title}
        description={description}
      />

      <Card>
        <CardContent className="space-y-8 p-6 sm:p-8">
          {sections.map((section, index) => (
            <section key={section.title} className="space-y-4">
              {index > 0 ? <Separator /> : null}
              <div className="space-y-3">
                <h2 className="font-display text-2xl font-semibold tracking-tight">
                  {section.title}
                </h2>
                <div className="space-y-4 text-sm leading-7 text-muted-foreground">
                  {section.body}
                </div>
              </div>
            </section>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
