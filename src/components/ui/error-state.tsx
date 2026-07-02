import { AlertCircle } from 'lucide-react'
import type { ReactNode } from 'react'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { cn } from '@/shared/lib/cn'

export interface ErrorStateProps {
  title: string
  description: ReactNode
  retryLabel?: string
  onRetry?: () => void
  actionLabel?: string
  onAction?: () => void
  secondaryAction?: ReactNode
  className?: string
}

export function ErrorState({
  title,
  description,
  retryLabel = 'Try again',
  onRetry,
  actionLabel,
  onAction,
  secondaryAction,
  className,
}: ErrorStateProps) {
  const primaryLabel = actionLabel ?? retryLabel
  const primaryAction = onAction ?? onRetry

  return (
    <Card className={cn('p-0 shadow-[var(--shadow-soft)]', className)}>
      <div className="flex flex-col items-center gap-5 px-6 py-10 text-center sm:px-10 sm:py-12">
        <div className="grid h-14 w-14 place-items-center rounded-full border border-error/30 bg-error/10 text-error">
          <AlertCircle className="h-6 w-6" aria-hidden="true" />
        </div>
        <div className="max-w-xl">
          <h3 className="font-display text-2xl font-semibold tracking-tight">
            {title}
          </h3>
          <div className="mt-3 text-sm leading-6 text-muted-foreground">
            {description}
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3">
          {primaryAction ? <Button onClick={primaryAction}>{primaryLabel}</Button> : null}
          {secondaryAction}
        </div>
      </div>
    </Card>
  )
}
