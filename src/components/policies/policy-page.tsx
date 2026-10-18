import type { PolicyMeta } from '@/shared/config/policy-content'
import { businessProfile, unresolvedBusinessDetails } from '@/shared/config/policy-content'
import { Seo } from '@/components/layout/seo'

export function PolicyPage({ meta }: { meta: PolicyMeta }) {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:py-16">
      <Seo title={`${meta.title} | KumbhMelaStore`} description={meta.description} />

      <header className="space-y-5">
        <p className="text-xs font-medium uppercase tracking-[0.24em] text-primary">KumbhMelaStore</p>
        <h1 className="font-display text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
          {meta.title}
        </h1>
        <p className="max-w-2xl text-base leading-7 text-muted-foreground">{meta.description}</p>
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          <span>Effective date: {meta.effectiveDate}</span>
          <span>Last updated: {meta.lastUpdated}</span>
        </div>
      </header>

      <div className="mt-10 space-y-8">
        {meta.sections.map((section) => (
          <section key={section.heading} className="rounded-[var(--radius-card)] border border-border/80 bg-surface p-6 shadow-[var(--shadow-soft)] sm:p-8">
            <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              {section.heading}
            </h2>

            {section.body?.length ? (
              <div className="mt-4 space-y-3 text-base leading-7 text-muted-foreground">
                {section.body.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            ) : null}

            {section.list?.length ? (
              <ul className="mt-4 list-disc space-y-2 pl-5 text-base leading-7 text-muted-foreground">
                {section.list.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : null}

            {section.note ? (
              <div className="mt-5 rounded border border-primary/20 bg-primary/5 p-4 text-sm leading-6 text-foreground">
                {section.note}
              </div>
            ) : null}
          </section>
        ))}
      </div>

      <section className="mt-10 rounded-[var(--radius-card)] border border-border/80 bg-surface p-6 shadow-[var(--shadow-soft)] sm:p-8">
        <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Contact and review information
        </h2>
        <div className="mt-4 grid gap-4 text-base leading-7 text-muted-foreground sm:grid-cols-2">
          <p>
            <span className="font-medium text-foreground">Website:</span> {businessProfile.website}
          </p>
          <p>
            <span className="font-medium text-foreground">Email:</span> {businessProfile.supportEmail}
          </p>
          <p>
            <span className="font-medium text-foreground">Phone:</span> {businessProfile.supportPhone}
          </p>
          <p>
            <span className="font-medium text-foreground">Business address:</span> {businessProfile.businessAddress}
          </p>
          <p className="sm:col-span-2">
            <span className="font-medium text-foreground">Grievance officer:</span> {businessProfile.grievanceOfficer}
          </p>
          <p className="sm:col-span-2">
            <span className="font-medium text-foreground">Support hours:</span> {businessProfile.supportHours}
          </p>
        </div>
      </section>

      <section className="mt-10 rounded-[var(--radius-card)] border border-dashed border-primary/30 bg-primary/5 p-6 sm:p-8">
        <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Admin checklist for unresolved business details
        </h2>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-base leading-7 text-muted-foreground">
          {unresolvedBusinessDetails.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p className="mt-4 text-sm leading-6 text-muted-foreground">
          This policy should be reviewed by a qualified Indian legal professional before publication, particularly the privacy, e-commerce, refund and grievance-redressal provisions.
        </p>
      </section>
    </div>
  )
}
