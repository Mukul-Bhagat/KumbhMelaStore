import { NavLink } from 'react-router-dom'

import { Link } from 'react-router-dom'

import { BrandMark } from '@/components/brand/brand-mark'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { dashboardNavigation } from '@/shared/config/site'
import { cn } from '@/shared/lib/cn'

export function DashboardSidebar() {
  return (
    <aside className="sticky top-24 hidden h-[calc(100vh-7rem)] w-full max-w-sm lg:block">
      <Card className="flex h-full flex-col overflow-hidden p-0">
        <div className="border-b border-border px-6 py-6">
          <BrandMark linked size="sm" />
          <div className="mt-1 flex items-center gap-3">
            <Avatar fallback="MK" size="lg" />
            <div>
              <p className="font-medium text-foreground">Mukul</p>
              <p className="text-sm text-muted-foreground">Connoisseur</p>
            </div>
          </div>
          <Badge variant="premium" className="mt-4">
            Heritage Circle
          </Badge>
        </div>

        <nav className="flex-1 space-y-2 p-4" aria-label="Dashboard">
          {dashboardNavigation.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              end={item.href === '/dashboard'}
              className={({ isActive }) =>
                cn(
                  'flex items-center justify-between rounded-[var(--radius-field)] px-4 py-3 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-[var(--shadow-soft)]'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-border p-4">
          <Button asChild variant="outline" className="w-full">
            <Link to="/auth/sign-in">Switch account</Link>
          </Button>
        </div>
      </Card>
    </aside>
  )
}
