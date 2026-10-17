import { Menu, ShoppingBag, UserRound } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'

import { BrandMark } from '@/components/brand/brand-mark'
import { Button } from '@/components/ui/button'
import { cn } from '@/shared/lib/cn'
import { useAuth } from '@/shared/auth/provider'
import { useLocaleActions } from '@/shared/hooks/use-locale'
import { useSiteShell, useTranslate } from '@/shared/cms/hooks'
import { routes } from '@/shared/config/routes'
import { site } from '@/shared/config/site'
import { LanguageToggleButton } from './language-toggle'
import { MobileNav, type MobileNavItem } from './mobile-nav'

export interface SiteHeaderProps {
  variant?: 'marketing' | 'shop'
  className?: string
}

export function SiteHeader({ className }: SiteHeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const auth = useAuth()
  const { locale } = useLocaleActions()
  const { t } = useTranslate()
  const shell = useSiteShell()

  const brandName = shell.data ? t(shell.data.brand.nameKey, site.name) : site.name
  const title = shell.data ? t(shell.data.brand.nameKey, site.name) : site.name
  const description = shell.data
    ? t(shell.data.brand.descriptionKey, site.description)
    : site.description

  const desktopMenu = useMemo(() => {
    const isHindi = locale === 'hi'
    return [
      { label: t('nav.home', isHindi ? 'होम' : 'Home'), href: routes.forLocale(locale, ''), external: false },
      { label: t('nav.products', isHindi ? 'उत्पाद' : 'Products'), href: routes.forLocale(locale, 'products'), external: false },
      { label: locale === 'en' ? 'Journal' : t('nav.journal', 'जर्नल'), href: routes.forLocale(locale, 'blog'), external: false },
      { label: t('nav.about', isHindi ? 'हमारे बारे में' : 'About'), href: routes.forLocale(locale, 'about'), external: false },
      { label: locale === 'en' ? 'Contact Us' : t('nav.contact_us', 'संपर्क करें'), href: routes.forLocale(locale, 'contact'), external: false },
    ]
  }, [locale, t])

  const authAction: MobileNavItem = auth.status === 'authenticated'
    ? {
        label: t('nav.dashboard', 'Dashboard'),
        href: routes.forLocale(locale, 'dashboard'),
      }
    : {
        label: t('nav.sign_in', 'Sign in'),
        href: routes.forLocale(locale, 'auth/sign-in'),
      }

  const desktopAuthButton = auth.status === 'authenticated'
    ? (
      <Button asChild variant="ghost" size="icon-sm" aria-label={t('nav.dashboard', 'Dashboard')} title={t('nav.dashboard', 'Dashboard')}>
        <Link to={routes.forLocale(locale, 'dashboard')}>
          <UserRound className="h-4 w-4" aria-hidden="true" />
          <span className="sr-only">{t('nav.dashboard', 'Dashboard')}</span>
        </Link>
      </Button>
    )
    : (
      <Button asChild variant="ghost" size="icon-sm" aria-label={t('nav.sign_in', 'Sign in')} title={t('nav.sign_in', 'Sign in')}>
        <Link to={routes.forLocale(locale, 'auth/sign-in')}>
          <UserRound className="h-4 w-4" aria-hidden="true" />
          <span className="sr-only">{t('nav.sign_in', 'Sign in')}</span>
        </Link>
      </Button>
    )

  const cartButton = (
    <Button asChild variant="ghost" size="icon-sm" aria-label={t('nav.cart', 'Cart')} title={t('nav.cart', 'Cart')}>
      <Link to={routes.forLocale(locale, 'cart')}>
        <ShoppingBag className="h-4 w-4" aria-hidden="true" />
        <span className="sr-only">{t('nav.cart', 'Cart')}</span>
      </Link>
    </Button>
  )

  return (
    <header
      className={cn(
        'sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur-xl',
        className,
      )}
    >
      <div className="mx-auto flex w-full max-w-7xl items-center gap-3 px-4 py-2.5 sm:px-6 lg:px-8">
        <BrandMark
          linked
          size="md"
          name={brandName}
          className="hidden sm:inline-flex shrink-0"
        />
        <BrandMark
          linked
          size="sm"
          name={brandName}
          className="sm:hidden"
        />

        <nav
          aria-label="Primary"
          className="hidden min-w-0 flex-1 items-center justify-center gap-1 xl:flex"
        >
          {desktopMenu.map((item) =>
            item.external ? (
              <a
                key={item.href}
                href={item.href}
                target="_blank"
                rel="noreferrer"
                className="rounded-[var(--radius-pill)] px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                {item.label}
              </a>
            ) : (
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
            ),
          )}
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-2">
          <LanguageToggleButton />
          <div className="hidden items-center gap-2 xl:flex">
            {desktopAuthButton}
            {cartButton}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="xl:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation menu"
            aria-expanded={mobileOpen}
          >
            <Menu className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      </div>

      <MobileNav
        open={mobileOpen}
        onOpenChange={setMobileOpen}
        title={title}
        description={description}
        primaryLinks={desktopMenu}
        actions={[
          authAction,
          {
            label: t('nav.cart', 'Cart'),
            href: routes.cart,
            variant: 'default',
          },
        ]}
      />
    </header>
  )
}
