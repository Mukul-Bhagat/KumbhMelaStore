import { NavLink, Outlet, Link } from 'react-router-dom'

import { BrandMark } from '@/components/brand/brand-mark'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { PageShell } from '@/components/layout/page-shell'
import { LanguageToggleButton } from '@/components/layout/language-toggle'
import { useAuth } from '@/shared/auth/provider'
import { useSiteShell, useTranslate } from '@/shared/cms/hooks'
import { routes } from '@/shared/config/routes'
import { site } from '@/shared/config/site'
import { cn } from '@/shared/lib/cn'

const adminLinks = [
  { path: 'admin', labelKey: 'admin.overview' },
  { path: 'admin/content', labelKey: 'admin.content' },
  { path: 'admin/products', labelKey: 'admin.products' },
  { path: 'admin/catalog', labelKey: 'admin.catalog' },
  { path: 'admin/orders', labelKey: 'admin.orders' },
  { path: 'admin/users', labelKey: 'admin.users' },
  { path: 'admin/settings', labelKey: 'admin.settings' },
] as const

export function AdminLayout() {
  const auth = useAuth()
  const { t, locale } = useTranslate()
  const shell = useSiteShell()

  const brandName = shell.data ? t(shell.data.brand.nameKey, site.name) : site.name
  const brandDevanagari = shell.data
    ? t(shell.data.brand.devanagariKey, site.devanagari)
    : site.devanagari
  const displayName =
    auth.profile?.displayName ??
    auth.profile?.fullName ??
    auth.user?.email ??
    site.name
  const initials = displayName.slice(0, 2).toUpperCase()

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/70 bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <BrandMark
            linked
            size="sm"
            name={brandName}
            devanagari={brandDevanagari}
            className="hidden sm:inline-flex"
          />
          <BrandMark linked size="sm" variant="symbol" name={brandName} className="sm:hidden" />
          <div className="flex items-center gap-2 sm:gap-3">
            <LanguageToggleButton />
            <Badge className="hidden sm:inline-flex" variant="premium">{t('admin.label', 'Super Admin')}</Badge>
            <Button asChild variant="outline" size="sm">
              <Link to={routes.forLocale(locale, '')} aria-label={t('admin.visit_store', 'Visit store')}>
                <span className="sm:hidden">{t('admin.store_short', 'Store')}</span>
                <span className="hidden sm:inline">{t('admin.visit_store', 'Visit store')}</span>
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <PageShell className="grid gap-8 py-10 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="hidden lg:block">
          <Card className="overflow-hidden p-0 shadow-[var(--shadow-elevated)]">
            <div className="border-b border-border px-6 py-6">
              <div className="flex items-center gap-3">
                <Avatar
                  fallback={initials}
                  src={auth.profile?.avatarUrl ?? undefined}
                  alt={displayName}
                  size="lg"
                />
                <div className="min-w-0">
                  <p className="truncate font-medium text-foreground">{displayName}</p>
                  <p className="text-sm text-muted-foreground">
                    {t('admin.workspace', 'Admin workspace')}
                  </p>
                </div>
              </div>
            </div>
            <nav className="space-y-2 p-4">
              {adminLinks.map((item) => (
                <NavLink
                  key={item.path}
                  to={routes.forLocale(locale, item.path)}
                  end={item.path === 'admin'}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center justify-between rounded-[var(--radius-field)] px-4 py-3 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary text-primary-foreground shadow-[var(--shadow-soft)]'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                    )
                  }
                >
                  {t(item.labelKey, item.labelKey)}
                </NavLink>
              ))}
            </nav>
          </Card>
        </aside>

        <div className="min-w-0">
          <nav
            className="mb-6 flex gap-2 overflow-x-auto pb-2 lg:hidden"
            aria-label={t('admin.navigation', 'Admin navigation')}
          >
            {adminLinks.map((item) => (
              <NavLink
                key={item.path}
                to={routes.forLocale(locale, item.path)}
                end={item.path === 'admin'}
                className={({ isActive }) =>
                  cn(
                    'shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    isActive
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-card text-muted-foreground hover:text-foreground',
                  )
                }
              >
                {t(item.labelKey, item.labelKey)}
              </NavLink>
            ))}
          </nav>
          <Outlet />
        </div>
      </PageShell>
    </div>
  )
}
