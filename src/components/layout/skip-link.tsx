import { cn } from '@/shared/lib/cn'

export function SkipLink() {
  return (
    <a
      href="#main-content"
      className={cn(
        'sr-only z-50 rounded-[var(--radius-pill)] bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-[var(--shadow-soft)] focus:not-sr-only focus:absolute focus:left-4 focus:top-4',
      )}
    >
      Skip to content
    </a>
  )
}
