import { useTranslate } from '@/shared/cms/hooks'

export function CatalogDetailSkeleton({ kind }: { kind: 'product' | 'category' }) {
  const { locale } = useTranslate()
  const isHindi = locale === 'hi'
  const title = kind === 'product'
    ? isHindi ? 'उत्पाद विवरण लोड हो रहा है' : 'Loading product details'
    : isHindi ? 'श्रेणी लोड हो रही है' : 'Loading category'

  return (
    <div
      className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]"
      aria-busy="true"
      aria-label={title}
    >
      <div className="aspect-[4/5] animate-pulse rounded-[var(--radius-card)] border border-border bg-surface" />
      <div className="space-y-6">
        <div className="space-y-3">
          <div className="h-3 w-24 animate-pulse rounded bg-muted" />
          <div className="h-10 w-3/4 animate-pulse rounded bg-muted" />
          <div className="h-4 w-full animate-pulse rounded bg-muted" />
          <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
        </div>
        <div className="h-40 animate-pulse rounded-[var(--radius-card)] border border-border bg-surface" />
        <p className="sr-only" aria-live="polite">{title}</p>
      </div>
    </div>
  )
}
