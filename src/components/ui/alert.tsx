import { AlertTriangle, CircleCheck, Info, ShieldAlert } from 'lucide-react'
import type { ReactNode } from 'react'

import { cn } from '@/shared/lib/cn'

import { Card } from '@/components/ui/card'

export interface AlertProps {
  title: string
  description?: ReactNode
  actions?: ReactNode
  variant?: 'default' | 'success' | 'warning' | 'error'
  className?: string
}

const alertStyles: Record<NonNullable<AlertProps['variant']>, string> = {
  default: 'border-border bg-card text-card-foreground',
  success: 'border-success/25 bg-success/8 text-foreground',
  warning: 'border-warning/25 bg-warning/8 text-foreground',
  error: 'border-error/25 bg-error/8 text-foreground',
}

const alertIcons: Record<NonNullable<AlertProps['variant']>, ReactNode> = {
  default: <Info className="h-5 w-5 text-primary" aria-hidden="true" />,
  success: <CircleCheck className="h-5 w-5 text-success" aria-hidden="true" />,
  warning: <AlertTriangle className="h-5 w-5 text-warning" aria-hidden="true" />,
  error: <ShieldAlert className="h-5 w-5 text-error" aria-hidden="true" />,
}

export function Alert({
  title,
  description,
  actions,
  variant = 'default',
  className,
}: AlertProps) {
  return (
    <Card className={cn('p-0 shadow-[var(--shadow-soft)]', alertStyles[variant], className)}>
      <div className="flex gap-4 p-5 sm:p-6">
        <div className="mt-0.5 shrink-0">{alertIcons[variant]}</div>
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-xl font-semibold tracking-tight">
            {title}
          </h3>
          {description ? (
            <div className="mt-2 text-sm leading-6 text-muted-foreground">
              {description}
            </div>
          ) : null}
          {actions ? <div className="mt-4 flex flex-wrap gap-3">{actions}</div> : null}
        </div>
      </div>
    </Card>
  )
}
