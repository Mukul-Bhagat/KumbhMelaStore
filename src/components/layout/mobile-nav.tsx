import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Sheet } from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'
import { type RoutePath } from '@/shared/config/routes'
import type { NavigationLink } from '@/shared/config/site'

export interface MobileNavProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  primaryLinks: readonly NavigationLink[]
  secondaryLinks?: readonly NavigationLink[]
  actions?: readonly { label: string; href: RoutePath | string }[]
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
          {primaryLinks.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              onClick={() => onOpenChange(false)}
              className="flex items-center justify-between rounded-[var(--radius-field)] border border-border bg-background px-4 py-3 text-sm font-medium transition-colors hover:border-primary/40 hover:bg-muted"
            >
              <span>{item.label}</span>
              <span className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                Explore
              </span>
            </Link>
          ))}
        </nav>

        {secondaryLinks?.length ? (
          <>
            <Separator />
            <nav className="space-y-2" aria-label="Secondary">
              {secondaryLinks.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => onOpenChange(false)}
                  className="flex items-center justify-between rounded-[var(--radius-field)] border border-border bg-surface px-4 py-3 text-sm font-medium transition-colors hover:border-primary/40 hover:bg-background"
                >
                  <span>{item.label}</span>
                  <span className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                    Go
                  </span>
                </Link>
              ))}
            </nav>
          </>
        ) : null}

        {actions?.length ? (
          <>
            <Separator />
            <div className="grid grid-cols-1 gap-3">
              {actions.map((action, index) => (
                <Button
                  key={`${action.href}-${index}`}
                  asChild
                  variant={index === 0 ? 'default' : 'outline'}
                  className="w-full"
                >
                  <Link to={action.href} onClick={() => onOpenChange(false)}>
                    {action.label}
                  </Link>
                </Button>
              ))}
            </div>
          </>
        ) : null}
      </div>
    </Sheet>
  )
}
