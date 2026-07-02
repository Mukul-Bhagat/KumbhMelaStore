import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/shared/lib/cn'

const badgeVariants = cva(
  'inline-flex items-center rounded-[var(--radius-pill)] border px-2.5 py-0.5 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-primary text-primary-foreground hover:bg-primary/90',
        secondary:
          'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
        outline:
          'border-border bg-background text-foreground hover:bg-muted',
        muted: 'border-transparent bg-muted text-muted-foreground',
        premium:
          'border-border bg-surface text-primary shadow-[var(--shadow-soft)]',
        success:
          'border-transparent bg-success/15 text-success hover:bg-success/20',
        warning:
          'border-transparent bg-warning/15 text-warning hover:bg-warning/20',
        error: 'border-transparent bg-error/15 text-error hover:bg-error/20',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant, ...props }, ref) => (
    <span
      ref={ref}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  ),
)
Badge.displayName = 'Badge'

export { Badge }
