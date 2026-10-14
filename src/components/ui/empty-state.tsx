import { Sparkles } from 'lucide-react'
import type { ReactNode } from 'react'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { cn } from '@/shared/lib/cn'

export interface EmptyStateProps {
  title: string
  description: ReactNode
  action?: ReactNode | undefined
  actionLabel?: string | undefined
  onAction?: (() => void) | undefined
  secondaryAction?: ReactNode | undefined
  className?: string | undefined
}

export function EmptyState({
  title,
  description,
  action,
  actionLabel,
  onAction,
  secondaryAction,
  className,
}: EmptyStateProps) {
  return (
    <Card className={cn('p-0 shadow-[var(--shadow-soft)]', className)}>
      <div className="flex flex-col items-center gap-5 px-6 py-10 text-center sm:px-10 sm:py-12">
        <div className="grid h-14 w-14 place-items-center rounded-full border border-border bg-surface text-primary">
          <Sparkles className="h-6 w-6" aria-hidden="true" />
        </div>
        <div className="max-w-xl">
          <h3 className="font-display text-2xl font-semibold tracking-tight">
            {title}
          </h3>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            {description}
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3">
          {action}
          {actionLabel && onAction ? (
            <Button onClick={onAction}>{actionLabel}</Button>
          ) : null}
          {secondaryAction}
        </div>
      </div>
    </Card>
  )
}
