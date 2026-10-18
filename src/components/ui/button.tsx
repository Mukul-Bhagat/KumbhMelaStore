import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { Slot } from '@radix-ui/react-slot'

import { cn } from '@/shared/lib/cn'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[var(--radius-pill)] border text-sm font-medium transition-[color,background-color,border-color,box-shadow,transform] duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:translate-y-px disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none motion-reduce:transform-none motion-reduce:transition-none',
  {
    variants: {
      variant: {
        default:
          'border-primary/80 bg-primary text-primary-foreground shadow-[var(--shadow-soft)] hover:-translate-y-px hover:border-primary hover:bg-primary/90 hover:shadow-[var(--shadow-elevated)] active:bg-primary/95 active:shadow-[var(--shadow-soft)]',
        secondary:
          'border-border bg-secondary text-secondary-foreground shadow-sm hover:-translate-y-px hover:border-primary/45 hover:bg-accent hover:shadow-[var(--shadow-soft)] active:bg-secondary',
        outline:
          'border-border bg-background/80 text-foreground shadow-sm hover:-translate-y-px hover:border-primary/55 hover:bg-muted hover:shadow-[var(--shadow-soft)] active:bg-surface',
        ghost: 'border-transparent bg-transparent text-foreground hover:bg-muted hover:shadow-sm active:bg-surface',
        premium:
          'border-primary/35 bg-surface text-primary shadow-[var(--shadow-glow)] hover:-translate-y-px hover:border-primary/60 hover:bg-background hover:shadow-[var(--shadow-elevated)] active:bg-surface',
        destructive:
          'border-error/80 bg-error text-white shadow-[var(--shadow-soft)] hover:-translate-y-px hover:border-error hover:bg-error/90 hover:shadow-[var(--shadow-elevated)] active:bg-error/95',
        link: 'border-transparent bg-transparent text-primary underline-offset-4 hover:underline hover:shadow-none',
      },
      size: {
        default: 'h-11 px-5',
        sm: 'h-9 px-4 text-xs',
        lg: 'h-12 px-6 text-base',
        icon: 'h-11 w-11',
        'icon-sm': 'h-9 w-9',
      },
    },
    compoundVariants: [
      {
        variant: 'ghost',
        size: 'icon',
        class: 'border-border bg-background/70 hover:border-primary/45',
      },
      {
        variant: 'ghost',
        size: 'icon-sm',
        class: 'border-border bg-background/70 hover:border-primary/45',
      },
    ],
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, type = 'button', asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'

    return (
      <Comp
        ref={ref}
        type={asChild ? undefined : type}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      />
    )
  },
)
Button.displayName = 'Button'

export { Button }
