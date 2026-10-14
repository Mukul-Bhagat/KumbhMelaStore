import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Sheet } from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/shared/lib/cn'
import { isExternalHref } from '@/shared/lib/navigation'

export interface MobileNavItem {
  label: ReactNode
  href?: string
  onClick?: () => void
  external?: boolean
  variant?: 'default' | 'outline' | 'ghost'
}

export interface MobileNavProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: ReactNode
  description?: ReactNode
  primaryLinks: readonly MobileNavItem[]
  secondaryLinks?: readonly MobileNavItem[]
  actions?: readonly MobileNavItem[]
}

function renderItem(item: MobileNavItem, onClose: () => void) {
  const external = item.external ?? (item.href ? isExternalHref(item.href) : false)
  const variant = item.variant ?? 'outline'

  if (item.onClick) {
    return (
      <Button
        key={String(item.label)}
        type="button"
        variant={variant}
        className="w-full justify-between"
        onClick={() => {
          item.onClick?.()
          onClose()
        }}
      >
        {item.label}
      </Button>
    )
  }

  if (!item.href) {
    return null
  }

  const content = (
    <span className="flex w-full items-center justify-between">
      <span>{item.label}</span>
      <span className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
        {external ? 'Open' : 'Go'}
      </span>
    </span>
  )

  return (
    <Button
      key={String(item.label)}
      asChild
      variant={variant}
      className={cn('w-full justify-between', variant === 'ghost' && 'px-0')}
    >
      {external ? (
        <a href={item.href} target="_blank" rel="noreferrer" onClick={onClose}>
          {content}
        </a>
      ) : (
        <Link to={item.href} onClick={onClose}>
          {content}
        </Link>
      )}
    </Button>
  )
}

export function MobileNav({
  open,
  onOpenChange,
  title,
  description,
  primaryLinks,
  secondaryLinks,
  actions,
}: MobileNavProps) {
  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      side="right"
      className="max-w-sm"
    >
      <div className="space-y-8">
        <nav className="space-y-2" aria-label="Primary">
          {primaryLinks.map((item) => {
            const rendered = renderItem(item, () => onOpenChange(false))
            return rendered ? <div key={String(item.label)}>{rendered}</div> : null
          })}
        </nav>

        {secondaryLinks?.length ? (
          <>
            <Separator />
            <nav className="space-y-2" aria-label="Secondary">
              {secondaryLinks.map((item) => {
                const rendered = renderItem(item, () => onOpenChange(false))
                return rendered ? <div key={String(item.label)}>{rendered}</div> : null
              })}
            </nav>
          </>
        ) : null}

        {actions?.length ? (
          <>
            <Separator />
            <div className="grid grid-cols-1 gap-3">
              {actions.map((action) => {
                const rendered = renderItem(action, () => onOpenChange(false))
                return rendered ? <div key={String(action.label)}>{rendered}</div> : null
              })}
            </div>
          </>
        ) : null}
      </div>
    </Sheet>
  )
}
