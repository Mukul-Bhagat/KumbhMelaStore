import { X } from 'lucide-react'
import {
  type ReactNode,
  useEffect,
  useRef,
} from 'react'
import { createPortal } from 'react-dom'

import { Button } from '@/components/ui/button'
import { useScrollLock } from '@/shared/hooks/use-scroll-lock'
import { cn } from '@/shared/lib/cn'

export interface DialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: ReactNode
  description?: ReactNode
  children: ReactNode
  footer?: ReactNode
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

const dialogSizes = {
  sm: 'max-w-md',
  md: 'max-w-xl',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
}

export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  className,
  size = 'md',
}: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null)
  useScrollLock(open)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) {
      return
    }

    if (open && !dialog.open) {
      dialog.showModal()
    } else if (!open && dialog.open) {
      dialog.close()
    }
  }, [open])

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) {
      return
    }

    const handleClose = () => onOpenChange(false)
    dialog.addEventListener('close', handleClose)

    return () => dialog.removeEventListener('close', handleClose)
  }, [onOpenChange])

  if (typeof document === 'undefined') {
    return null
  }

  return createPortal(
    <dialog
      ref={ref}
      className={cn(
        'fixed inset-0 m-0 h-full w-full max-w-none bg-transparent p-4 sm:p-6',
        className,
      )}
      onCancel={(event) => {
        event.preventDefault()
        onOpenChange(false)
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onOpenChange(false)
        }
      }}
    >
      <div className="flex min-h-full items-center justify-center">
        <div
          className={cn(
            'relative flex max-h-[calc(100dvh-2rem)] w-full flex-col overflow-hidden rounded-[var(--radius-card)] border border-border bg-card shadow-[var(--shadow-elevated)]',
            dialogSizes[size],
          )}
        >
          <div className="flex shrink-0 items-start justify-between gap-4 border-b border-border px-6 py-5">
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
              aria-label="Close dialog"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
          <div className="min-h-0 overflow-y-auto px-6 py-5">{children}</div>
          {footer ? (
            <div className="shrink-0 border-t border-border px-6 py-4">{footer}</div>
          ) : null}
        </div>
      </div>
    </dialog>,
    document.body,
  )
}
