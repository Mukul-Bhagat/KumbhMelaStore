import { Outlet } from 'react-router-dom'

import { DashboardSidebar } from '@/components/layout/dashboard-sidebar'
import { dashboardLinks } from '@/components/layout/dashboard-navigation'
import { SiteHeader } from '@/components/layout/site-header'
import { PageShell } from '@/components/layout/page-shell'
import { Button } from '@/components/ui/button'
import { NavLink } from 'react-router-dom'
import { useAuth } from '@/shared/auth/provider'
import { useTranslate } from '@/shared/cms/hooks'
import { routes } from '@/shared/config/routes'
import { cn } from '@/shared/lib/cn'

export function DashboardLayout() {
  const auth = useAuth()
  const { t, locale } = useTranslate()

  return (
    <div className="min-h-screen">
      <SiteHeader variant="shop" />
      <PageShell className="grid gap-8 pt-10 lg:grid-cols-[300px_minmax(0,1fr)]">
        <DashboardSidebar />
        <div className="min-w-0">
          <nav
            className="mb-6 flex gap-2 overflow-x-auto pb-2 lg:hidden"
            aria-label={t('dashboard.navigation', 'Account navigation')}
          >
            {dashboardLinks.map((item) => (
              <NavLink
                key={item.path}
                to={routes.forLocale(locale, item.path)}
                end={item.path === 'dashboard'}
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
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="shrink-0"
              onClick={() => void auth.signOut()}
            >
              {t('dashboard.sign_out', 'Sign out')}
            </Button>
          </nav>
          <Outlet />
        </div>
      </PageShell>
    </div>
  )
}
