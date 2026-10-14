import { Menu } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'

import { BrandMark } from '@/components/brand/brand-mark'
import { Button } from '@/components/ui/button'
import { cn } from '@/shared/lib/cn'
import { useAuth } from '@/shared/auth/provider'
import { useLocaleActions } from '@/shared/hooks/use-locale'
import { useSiteShell, useTranslate } from '@/shared/cms/hooks'
import { routes } from '@/shared/config/routes'
import type { Locale } from '@/shared/config/locales'
import { site } from '@/shared/config/site'
import { resolveLocalizedHref } from '@/shared/lib/navigation'

import { LanguageToggleButton } from './language-toggle'
import { MobileNav, type MobileNavItem } from './mobile-nav'

export interface SiteHeaderProps {
  variant?: 'marketing' | 'shop'
  className?: string
}

function resolveMenuItems(
  items: Array<{ labelKey: string; href: string }>,
  t: (key: string, fallback?: string) => string,
  locale: Locale,
) {
  return items.map((item) => ({
    label: t(item.labelKey, item.labelKey),
    href: resolveLocalizedHref(item.href, locale),
    external:
      /^(https?:|mailto:|tel:)/.test(item.href) ||
      item.href.startsWith('javascript:') ||
      item.href.startsWith('#'),
  }))
}

export function SiteHeader({ variant = 'marketing', className }: SiteHeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const auth = useAuth()
  const { locale } = useLocaleActions()
  const { t } = useTranslate()
  const shell = useSiteShell()

  const brandName = shell.data ? t(shell.data.brand.nameKey, site.name) : site.name
  const brandDevanagari = shell.data
    ? t(shell.data.brand.devanagariKey, site.devanagari)
    : site.devanagari
  const title = shell.data ? t(shell.data.brand.nameKey, site.name) : site.name
  const description = shell.data
    ? t(shell.data.brand.descriptionKey, site.description)
    : site.description

  const desktopMenu = useMemo(() => {
    const menu =
      variant === 'shop'
        ? shell.data?.navigation.shop ?? shell.data?.navigation.primary
        : shell.data?.navigation.primary ?? shell.data?.navigation.shop

    const isHindi = locale === 'hi'
    const defaults = [
      { label: t('nav.home', isHindi ? 'होम' : 'Home'), href: routes.forLocale(locale, ''), external: false },
      { label: t('nav.products', isHindi ? 'उत्पाद' : 'Products'), href: routes.forLocale(locale, 'products'), external: false },
      { label: t('nav.collections', isHindi ? 'संग्रह' : 'Collections'), href: routes.forLocale(locale, 'collections'), external: false },
      { label: t('nav.about', isHindi ? 'हमारे बारे में' : 'About'), href: routes.forLocale(locale, 'about'), external: false },
      { label: t('nav.contact', isHindi ? 'संपर्क' : 'Contact'), href: routes.forLocale(locale, 'contact'), external: false },
    ]
    const configured = menu?.items.length ? resolveMenuItems(menu.items, t, locale) : []

    return [
      ...configured,
      ...defaults.filter((item) => !configured.some((configuredItem) => configuredItem.href === item.href)),
    ]
  }, [locale, shell.data?.navigation.primary, shell.data?.navigation.shop, t, variant])

  const secondaryMenu = useMemo(() => {
    const menu =
      variant === 'shop'
        ? shell.data?.navigation.account
        : shell.data?.navigation.shop ?? shell.data?.navigation.account

    if (menu?.items.length) {
      return resolveMenuItems(menu.items, t, locale).filter(
        (item) => !desktopMenu.some((primaryItem) => primaryItem.href === item.href),
      )
    }

    const isHindi = locale === 'hi'
    return [
      { label: t('nav.faq', isHindi ? 'अक्सर पूछे जाने वाले प्रश्न' : 'FAQ'), href: routes.forLocale(locale, 'faq'), external: false },
      { label: t('nav.track_order', isHindi ? 'ऑर्डर ट्रैक करें' : 'Track order'), href: routes.forLocale(locale, 'track-order'), external: false },
    ].filter((item) => !desktopMenu.some((primaryItem) => primaryItem.href === item.href))
  }, [desktopMenu, locale, shell.data?.navigation.account, shell.data?.navigation.shop, t, variant])

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
      <Button asChild variant="ghost" size="sm">
        <Link to={routes.forLocale(locale, 'dashboard')}>{t('nav.dashboard', 'Dashboard')}</Link>
      </Button>
    )
    : (
      <Button asChild variant="ghost" size="sm">
        <Link to={routes.forLocale(locale, 'auth/sign-in')}>{t('nav.sign_in', 'Sign in')}</Link>
      </Button>
    )

  const cartButton = (
    <Button asChild variant="default" size="sm">
      <Link to={routes.forLocale(locale, 'cart')}>{t('nav.cart', 'Cart')}</Link>
    </Button>
  )

  return (
    <header
      className={cn(
        'sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur-xl',
        className,
      )}
    >
      <div className="mx-auto flex w-full max-w-7xl items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <BrandMark
          linked
          size="sm"
          name={brandName}
          devanagari={brandDevanagari}
          className="hidden sm:inline-flex"
        />
        <BrandMark
          linked
          size="sm"
          variant="symbol"
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
            <Button asChild variant="outline" size="sm">
              <Link to={routes.trackOrder}>{t('nav.track_order', 'Track order')}</Link>
            </Button>
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
        secondaryLinks={secondaryMenu}
        actions={[
          {
            label: t('nav.track_order', 'Track order'),
            href: routes.trackOrder,
            variant: 'outline',
          },
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
