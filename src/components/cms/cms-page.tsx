/* eslint-disable react-refresh/only-export-components */
import { ExternalLink, Mail, MapPin, Phone } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'

import { BrandMark } from '@/components/brand/brand-mark'
import { CloudinaryImage } from '@/components/media/cloudinary-image'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { ErrorState } from '@/components/ui/error-state'
import { HomeFallback } from '@/components/catalog/home-fallback'
import { SectionHeading } from '@/components/layout/section-heading'
import { Seo } from '@/components/layout/seo'
import { usePageContent, useSiteShell, useTranslate } from '@/shared/cms/hooks'
import type { CmsPageSection } from '@/shared/cms/types'
import { type Locale, localeMeta } from '@/shared/config/locales'
import { site } from '@/shared/config/site'
import { routes } from '@/shared/config/routes'
import { humanizeSlug } from '@/shared/lib/format'
import { isExternalHref, resolveLocalizedHref } from '@/shared/lib/navigation'

type Recordish = Record<string, unknown>
type ButtonVariant = 'default' | 'outline' | 'ghost' | 'premium'

const cmsPageLoadingTitles: Record<string, { hi: string; en: string }> = {
  about: { hi: 'हमारे बारे में', en: 'About' },
  blog: { hi: 'ब्लॉग', en: 'Blog' },
  collections: { hi: 'संग्रह', en: 'Collections' },
  contact: { hi: 'संपर्क', en: 'Contact' },
  faq: { hi: 'अक्सर पूछे जाने वाले प्रश्न', en: 'Frequently asked questions' },
  'privacy-policy': { hi: 'गोपनीयता नीति', en: 'Privacy policy' },
  'refund-policy': { hi: 'रिफंड नीति', en: 'Refund policy' },
  'shipping-policy': { hi: 'शिपिंग नीति', en: 'Shipping policy' },
  terms: { hi: 'नियम और शर्तें', en: 'Terms and conditions' },
  'track-order': { hi: 'ऑर्डर ट्रैक करें', en: 'Track your order' },
}

function asRecord(value: unknown): Recordish | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null
  }

  return value as Recordish
}

function readString(value: unknown, fallback = '') {
  if (typeof value === 'string') {
    return value
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value)
  }

  return fallback
}

function readArray(value: unknown) {
  return Array.isArray(value) ? value : []
}

function resolveButtonVariant(value: unknown): ButtonVariant {
  return value === 'outline' || value === 'ghost' || value === 'premium'
    ? value
    : 'default'
}

function resolveHref(href: string, locale: Locale) {
  return resolveLocalizedHref(href, locale)
}

function resolveText(
  value: unknown,
  resolveTranslation: (key: string, fallback?: string) => string,
  fallback = '',
) {
  if (typeof value === 'string') {
    return resolveTranslation(value, fallback || value)
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value)
  }

  return fallback
}

function CmsActionButtons({
  items,
  locale,
  resolveTranslation,
}: {
  items: Recordish[]
  locale: Locale
  resolveTranslation: (key: string, fallback?: string) => string
}) {
  if (items.length === 0) {
    return null
  }

  return (
    <div className="flex flex-wrap gap-3">
      {items.map((item, index) => {
        const href = readString(item.href)
        const label = resolveText(
          item.label ?? item.labelKey ?? item.title ?? item.titleKey,
          resolveTranslation,
        )
        const variant = resolveButtonVariant(item.variant)

        if (!href || !label) {
          return null
        }

        const target = resolveHref(href, locale)

        return (
          <Button key={`${href}-${index}`} asChild variant={variant}>
            {isExternalHref(target) ? (
              <a href={target} target="_blank" rel="noreferrer">
                {label}
                <ExternalLink className="h-4 w-4" aria-hidden="true" />
              </a>
            ) : (
              <Link to={target}>{label}</Link>
            )}
          </Button>
        )
      })}
    </div>
  )
}

function CmsStatsGrid({
  items,
  resolveTranslation,
}: {
  items: Recordish[]
  resolveTranslation: (key: string, fallback?: string) => string
}) {
  if (items.length === 0) {
    return null
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item, index) => (
        <Card key={`${readString(item.label ?? item.title ?? 'stat')}-${index}`}>
          <CardContent className="space-y-1 p-5">
            <p className="font-display text-3xl font-semibold text-foreground">
              {resolveText(item.value ?? item.stat ?? item.metric, resolveTranslation, '0')}
            </p>
            <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
              {resolveText(
                item.label ?? item.title ?? item.metricLabel,
                resolveTranslation,
                'Metric',
              )}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function CmsCardGrid({
  items,
  locale,
  resolveTranslation,
}: {
  items: Recordish[]
  locale: Locale
  resolveTranslation: (key: string, fallback?: string) => string
}) {
  if (items.length === 0) {
    return null
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      {items.map((item, index) => {
        const href = readString(item.href)
        const title = resolveText(
          item.title ?? item.name ?? item.label,
          resolveTranslation,
          'Item',
        )
        const description = resolveText(
          item.description ?? item.excerpt ?? item.body,
          resolveTranslation,
        )
        const image = readString(item.publicId ?? item.imageId ?? item.mediaPublicId)
        const badge = resolveText(
          item.badge ?? item.kicker ?? item.category,
          resolveTranslation,
          'Curated',
        )

        const card = (
          <Card className="overflow-hidden shadow-[var(--shadow-soft)]">
            {image ? (
              <div className="aspect-[4/3] overflow-hidden border-b border-border/70">
                <CloudinaryImage publicId={image} alt={title} className="h-full w-full object-cover" />
              </div>
            ) : null}
            <CardContent className="space-y-3 p-6">
              <div className="flex items-center justify-between gap-3">
                <Badge variant="outline">{badge}</Badge>
                {item.meta ? (
                  <span className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                    {readString(item.meta)}
                  </span>
                ) : null}
              </div>
              <h3 className="font-display text-2xl font-semibold tracking-tight text-foreground">
                {title}
              </h3>
              {description ? (
                <p className="text-sm leading-6 text-muted-foreground">{description}</p>
              ) : null}
            </CardContent>
          </Card>
        )

        if (!href) {
          return <div key={`${title}-${index}`}>{card}</div>
        }

        const target = resolveHref(href, locale)

        if (isExternalHref(target)) {
          return (
            <a
              key={`${title}-${index}`}
              href={target}
              target="_blank"
              rel="noreferrer"
              className="group block"
            >
              {card}
            </a>
          )
        }

        return (
          <Link key={`${title}-${index}`} to={target} className="group block">
            {card}
          </Link>
        )
      })}
    </div>
  )
}

function CmsRichText({ body }: { body: string }) {
  return (
    <Card className="shadow-[var(--shadow-soft)]">
      <CardContent className="space-y-4 p-6 sm:p-8">
        {body
          .split('\n')
          .map((line) => line.trim())
          .filter(Boolean)
          .map((line) => (
            <p key={line} className="text-sm leading-7 text-muted-foreground">
              {line}
            </p>
          ))}
      </CardContent>
    </Card>
  )
}

function CmsFaqGrid({
  items,
  resolveTranslation,
}: {
  items: Recordish[]
  resolveTranslation: (key: string, fallback?: string) => string
}) {
  if (items.length === 0) {
    return null
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {items.map((item, index) => (
        <Card key={`${readString(item.question ?? item.title ?? 'faq')}-${index}`}>
          <CardHeader>
            <CardTitle className="text-2xl">
              {resolveText(item.question ?? item.title, resolveTranslation, 'Question')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-sm leading-7 text-muted-foreground">
              {resolveText(item.answer ?? item.description ?? item.body, resolveTranslation)}
            </CardDescription>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function CmsContactGrid({
  items,
  supportEmail,
  resolveTranslation,
}: {
  items: Recordish[]
  supportEmail: string
  resolveTranslation: (key: string, fallback?: string) => string
}) {
  if (items.length === 0) {
    return null
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {items.map((item, index) => {
        const type = readString(item.type)
        const value = resolveText(item.value ?? item.description, resolveTranslation)
        const title = resolveText(item.title ?? item.label, resolveTranslation, 'Contact')

        return (
          <Card key={`${title}-${index}`}>
            <CardContent className="space-y-3 p-6">
              <Badge variant="premium">
                {resolveText(item.badge, resolveTranslation, 'Contact')}
              </Badge>
              <h3 className="font-display text-2xl font-semibold tracking-tight">{title}</h3>
              <div className="space-y-2 text-sm leading-6 text-muted-foreground">
                <p className="flex items-center gap-2">
                  {type === 'phone' ? (
                    <Phone className="h-4 w-4 text-primary" aria-hidden="true" />
                  ) : type === 'location' ? (
                    <MapPin className="h-4 w-4 text-primary" aria-hidden="true" />
                  ) : (
                    <Mail className="h-4 w-4 text-primary" aria-hidden="true" />
                  )}
                  {value || supportEmail}
                </p>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

function ContactFallback({ locale, supportEmail }: { locale: Locale; supportEmail: string }) {
  const isHindi = locale === 'hi'

  return (
    <div className="space-y-8">
      <Seo
        title={isHindi ? 'संपर्क' : 'Contact'}
        description={
          isHindi
            ? 'KumbhMelaStore सहायता टीम से संपर्क करें।'
            : 'Get in touch with the KumbhMelaStore support team.'
        }
      />
      <SectionHeading
        eyebrow="KumbhMelaStore"
        title={isHindi ? 'हमसे संपर्क करें' : 'Contact us'}
        description={
          isHindi
            ? 'हम आपके प्रश्नों और ऑर्डर संबंधी सहायता के लिए उपलब्ध हैं।'
            : 'We are here to help with your questions and orders.'
        }
      />
      <Card>
        <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <p className="flex items-center gap-2 font-medium">
              <Mail className="h-4 w-4 text-primary" aria-hidden="true" />
              {isHindi ? 'ईमेल सहायता' : 'Email support'}
            </p>
            <p className="text-sm text-muted-foreground">{supportEmail}</p>
          </div>
          <Button asChild>
            <a href={`mailto:${supportEmail}`}>
              {isHindi ? 'ईमेल भेजें' : 'Send an email'}
            </a>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

function CmsMediaSplit({
  title,
  description,
  image,
  locale,
}: {
  title: string
  description: string
  image: string
  locale: Locale
}) {
  return (
    <Card className="overflow-hidden shadow-[var(--shadow-elevated)]">
      <div className="grid gap-0 lg:grid-cols-[0.92fr_1.08fr]">
        <div className="flex flex-col justify-between gap-6 bg-surface px-6 py-8 sm:px-8">
          <div className="space-y-4">
            <Badge variant="premium">{site.name}</Badge>
            <h3 className="font-display text-3xl font-semibold tracking-tight text-foreground">
              {title}
            </h3>
            <p className="text-sm leading-6 text-muted-foreground">{description}</p>
          </div>
          <div className="grid gap-3 text-sm text-muted-foreground">
            <p className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" aria-hidden="true" />
              {localeMeta(locale).label} storefront ready
            </p>
            <p className="flex items-center gap-2">
              <Badge variant="outline">CMS</Badge>
              {localeMeta(locale).contentLanguage} content and editorial sections
            </p>
          </div>
        </div>
        <div className="min-h-[22rem]">
          {image ? (
            <CloudinaryImage publicId={image} alt={title} className="h-full w-full object-cover" />
          ) : (
            <div className="grid h-full min-h-[22rem] place-items-center bg-gradient-to-br from-surface via-background to-background">
              <BrandMark size="lg" variant="stacked" />
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}

function SectionRenderer({
  section,
  locale,
  supportEmail,
  resolveTranslation,
  hideMetrics,
}: {
  section: CmsPageSection
  locale: Locale
  supportEmail: string
  resolveTranslation: (key: string, fallback?: string) => string
  hideMetrics: boolean
}) {
  const payload = asRecord(section.payload)
  const title = resolveText(payload?.title ?? section.titleKey ?? section.sectionKey, resolveTranslation)
  const description = resolveText(
    payload?.description ?? section.descriptionKey ?? payload?.summary,
    resolveTranslation,
  )
  const eyebrow = resolveText(payload?.eyebrow ?? section.eyebrowKey, resolveTranslation)
  const body = resolveText(payload?.body ?? section.bodyKey ?? payload?.content, resolveTranslation)
  const actions = readArray(payload?.actions ?? payload?.ctas).map(asRecord).filter(Boolean) as Recordish[]
  const items = readArray(payload?.items ?? payload?.cards).map(asRecord).filter(Boolean) as Recordish[]

  switch (section.sectionType) {
    case 'hero':
      return (
        <section className="space-y-8">
          <SectionHeading
            eyebrow={eyebrow || undefined}
            title={title}
            description={description || undefined}
          />
          <CmsActionButtons
            items={actions}
            locale={locale}
            resolveTranslation={resolveTranslation}
          />
          {!hideMetrics && items.length ? (
            <CmsStatsGrid items={items} resolveTranslation={resolveTranslation} />
          ) : null}
        </section>
      )
    case 'stats':
      return hideMetrics ? null : <CmsStatsGrid items={items} resolveTranslation={resolveTranslation} />
    case 'collection-grid':
    case 'product-grid':
    case 'blog-grid':
    case 'testimonial-grid':
    case 'feature-grid':
      return (
        <section className="space-y-6">
          {(title || description) && (
            <SectionHeading
              eyebrow={eyebrow || undefined}
              title={title}
              description={description || undefined}
            />
          )}
          <CmsCardGrid
            items={items}
            locale={locale}
            resolveTranslation={resolveTranslation}
          />
        </section>
      )
    case 'cta':
      return (
        <Card className="shadow-[var(--shadow-elevated)]">
          <CardContent className="space-y-5 p-6 sm:p-8">
            <SectionHeading
              eyebrow={eyebrow || undefined}
              title={title}
              description={description || undefined}
            />
            <CmsActionButtons
              items={actions}
              locale={locale}
              resolveTranslation={resolveTranslation}
            />
          </CardContent>
        </Card>
      )
    case 'faq-grid':
      return (
        <section className="space-y-6">
          <SectionHeading
            eyebrow={eyebrow || undefined}
            title={title}
            description={description || undefined}
          />
          <CmsFaqGrid items={items} resolveTranslation={resolveTranslation} />
        </section>
      )
    case 'media-split':
      return (
        <CmsMediaSplit
          title={title}
          description={description || body}
          image={readString(payload?.publicId ?? payload?.mediaPublicId)}
          locale={locale}
        />
      )
    case 'contact-grid':
      return (
        <section className="space-y-6">
          <SectionHeading
            eyebrow={eyebrow || undefined}
            title={title}
            description={description || undefined}
          />
          <CmsContactGrid
            items={items}
            supportEmail={supportEmail}
            resolveTranslation={resolveTranslation}
          />
        </section>
      )
    case 'rich-text':
      return (
        <section className="space-y-6">
          <SectionHeading
            eyebrow={eyebrow || undefined}
            title={title}
            description={description || undefined}
          />
          <CmsRichText body={body || description || title} />
        </section>
      )
    case 'announcement':
      return (
        <Card className="border-primary/20 bg-primary/5 shadow-[var(--shadow-soft)]">
          <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              <Badge variant="premium">Announcement</Badge>
              <h3 className="font-display text-2xl font-semibold tracking-tight">
                {title}
              </h3>
              <p className="text-sm leading-6 text-muted-foreground">
                {description || body}
              </p>
            </div>
            <CmsActionButtons
              items={actions}
              locale={locale}
              resolveTranslation={resolveTranslation}
            />
          </CardContent>
        </Card>
      )
    default:
      return (
        <Card className="shadow-[var(--shadow-soft)]">
          <CardContent className="space-y-4 p-6 sm:p-8">
            <SectionHeading
              eyebrow={eyebrow || undefined}
              title={title}
              description={description || undefined}
            />
            {body ? <CmsRichText body={body} /> : null}
            {actions.length ? (
              <CmsActionButtons
                items={actions}
                locale={locale}
                resolveTranslation={resolveTranslation}
              />
            ) : null}
          </CardContent>
        </Card>
      )
  }
}

export function CmsPage({
  slug,
  titleFallback,
  descriptionFallback,
}: {
  slug: string
  titleFallback?: string
  descriptionFallback?: string
}) {
  const { data, isLoading, error } = usePageContent(slug)
  const { t, locale } = useTranslate()
  const shell = useSiteShell()
  const navigate = useNavigate()
  const supportEmail = shell.data?.brand.supportEmail ?? site.supportEmail

  if (isLoading) {
    if (slug === 'home') {
      return <HomeFallback />
    }
    if (slug === 'contact') {
      return <ContactFallback locale={locale} supportEmail={supportEmail} />
    }

    const loadingTitle = titleFallback ?? cmsPageLoadingTitles[slug]?.[locale] ?? humanizeSlug(slug)

    return (
      <div
        className="space-y-8"
        aria-busy="true"
        aria-label={locale === 'hi' ? 'पृष्ठ लोड हो रहा है' : 'Loading page content'}
      >
        <SectionHeading title={loadingTitle} />
        <div className="space-y-3">
          <div className="h-3 w-28 animate-pulse rounded bg-muted" />
          <div className="h-4 w-full max-w-2xl animate-pulse rounded bg-muted" />
          <div className="h-4 w-full max-w-2xl animate-pulse rounded bg-muted" />
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((item) => (
            <div
              key={item}
              className="min-h-64 animate-pulse rounded-[var(--radius-card)] border border-border bg-surface"
            />
          ))}
        </div>
        <p className="sr-only" aria-live="polite">
          {locale === 'hi' ? 'पृष्ठ सामग्री लोड हो रही है' : 'Page content is loading'}
        </p>
      </div>
    )
  }

  if (error) {
    if (slug === 'home') {
      return <HomeFallback />
    }
    if (slug === 'contact') {
      return <ContactFallback locale={locale} supportEmail={supportEmail} />
    }

    return (
      <ErrorState
        title="Unable to load content"
        description="Supabase content could not be loaded for this page."
        retryLabel="Retry"
        onRetry={() => window.location.reload()}
      />
    )
  }

  if (!data?.page) {
    if (slug === 'home') {
      return <HomeFallback />
    }
    if (slug === 'contact') {
      return <ContactFallback locale={locale} supportEmail={supportEmail} />
    }

    return (
      <ErrorState
        title={titleFallback ?? humanizeSlug(slug)}
        description={
          descriptionFallback ??
          'No active Supabase page record exists for this route. Publish it from the Super Admin panel.'
        }
        retryLabel="Go home"
        onRetry={() => {
          navigate(routes.forLocale(locale, ''))
        }}
      />
    )
  }

  const title = t(data.page.titleKey, titleFallback ?? humanizeSlug(slug))
  const description = data.page.descriptionKey
    ? t(data.page.descriptionKey, descriptionFallback ?? '')
    : descriptionFallback ?? ''

  return (
    <div className="space-y-12">
      <Seo title={title} description={description || title} noIndex={!data.page.isPublic} />
      {data.sections.map((section) => (
        <SectionRenderer
          key={section.id}
          section={section}
          locale={locale}
          supportEmail={supportEmail}
          resolveTranslation={t}
          hideMetrics={slug === 'home'}
        />
      ))}
    </div>
  )
}

export function createCmsRoutePage(
  slug: string,
  options?: {
    titleFallback?: string
    descriptionFallback?: string
  },
) {
  return function CmsRoutePage() {
    return <CmsPage slug={slug} {...options} />
  }
}

export function EntityShellPage({
  title,
  description,
  actionHref,
  actionLabel,
  secondaryActionHref,
  secondaryActionLabel,
}: {
  title: string
  description: string
  actionHref?: string
  actionLabel?: string
  secondaryActionHref?: string
  secondaryActionLabel?: string
}) {
  const navigate = useNavigate()

  return (
    <div className="space-y-8">
      <Seo title={title} description={description} />
      <SectionHeading title={title} description={description} />
      <EmptyState
        title={title}
        description={description}
        actionLabel={actionLabel}
        onAction={actionHref ? () => navigate(actionHref) : undefined}
        secondaryAction={
          secondaryActionHref && secondaryActionLabel ? (
            <Button asChild variant="outline">
              <Link to={secondaryActionHref}>{secondaryActionLabel}</Link>
            </Button>
          ) : undefined
        }
      />
    </div>
  )
}
