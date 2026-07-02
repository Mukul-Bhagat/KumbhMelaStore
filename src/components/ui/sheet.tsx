import { X } from 'lucide-react'
import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'

import { Button } from '@/components/ui/button'
import { useScrollLock } from '@/shared/hooks/use-scroll-lock'
import { cn } from '@/shared/lib/cn'

export interface SheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: ReactNode
  description?: ReactNode
  children: ReactNode
  footer?: ReactNode
  side?: 'left' | 'right'
  className?: string
}

const panelSides = {
  left: 'left-0 border-r',
  right: 'right-0 border-l',
}

export function Sheet({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  side = 'right',
  className,
}: SheetProps) {
  useScrollLock(open)

  if (typeof document === 'undefined' || !open) {
    return null
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm"
      role="presentation"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onOpenChange(false)
        }
      }}
    >
      <div
        className={cn(
          'absolute inset-y-0 z-10 flex w-full max-w-md flex-col border-border bg-card shadow-[var(--shadow-elevated)]',
          panelSides[side],
          className,
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
          <div>
            <h2 className="font-display text-2xl font-semibold tracking-tight">
              {title}
            </h2>
            {description ? (
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                {description}
              </p>
            ) : null}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => onOpenChange(false)}
            aria-label="Close drawer"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer ? <div className="border-t border-border px-5 py-4">{footer}</div> : null}
      </div>
    </div>,
    document.body,
  )
}
