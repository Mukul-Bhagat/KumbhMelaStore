import { Menu } from 'lucide-react'
import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'

import { BrandMark } from '@/components/brand/brand-mark'
import { Button } from '@/components/ui/button'
import { cn } from '@/shared/lib/cn'
import { accountNavigation, primaryNavigation, shopNavigation, site } from '@/shared/config/site'

import { MobileNav } from './mobile-nav'

export interface SiteHeaderProps {
  variant?: 'marketing' | 'shop'
  className?: string
}

export function SiteHeader({ variant = 'marketing', className }: SiteHeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const desktopLinks = variant === 'shop' ? shopNavigation : primaryNavigation

  return (
    <header
      className={cn(
        'sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur-xl',
        className,
      )}
    >
      <div className="mx-auto flex w-full max-w-7xl items-center gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <BrandMark linked size="sm" />

        <nav
          aria-label="Primary"
          className="hidden flex-1 items-center justify-center gap-1 lg:flex"
        >
          {desktopLinks.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              className={({ isActive }) =>
                cn(
                  'rounded-[var(--radius-pill)] px-4 py-2 text-sm font-medium transition-colors',
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

        <div className="ml-auto hidden items-center gap-3 md:flex">
          <Button asChild variant="outline" size="sm">
            <Link to="/track-order">Track order</Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link to="/auth/sign-in">Sign in</Link>
          </Button>
          <Button asChild size="sm">
            <Link to="/cart">Cart</Link>
          </Button>
        </div>

        <div className="ml-auto flex items-center gap-2 md:hidden">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation menu"
          >
            <Menu className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      </div>

      <MobileNav
        open={mobileOpen}
        onOpenChange={setMobileOpen}
        title={site.devanagari}
        description="Spiritual commerce, curated with calm precision."
        primaryLinks={desktopLinks}
        secondaryLinks={variant === 'shop' ? accountNavigation : shopNavigation}
        actions={[
          { label: 'Track order', href: '/track-order' },
          { label: 'Sign in', href: '/auth/sign-in' },
          { label: 'Cart', href: '/cart' },
        ]}
      />
    </header>
  )
}
