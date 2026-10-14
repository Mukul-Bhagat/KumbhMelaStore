import { NavLink, Link } from 'react-router-dom'

import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { dashboardLinks } from '@/components/layout/dashboard-navigation'
import { useAuth } from '@/shared/auth/provider'
import { routes } from '@/shared/config/routes'
import { site } from '@/shared/config/site'
import { cn } from '@/shared/lib/cn'
import { useTranslate } from '@/shared/cms/hooks'

export function DashboardSidebar() {
  const auth = useAuth()
  const { t, locale } = useTranslate()
  const profile = auth.profile
  const initials = (
    profile?.displayName?.trim().slice(0, 2) ??
    profile?.fullName?.trim().slice(0, 2) ??
    auth.user?.email?.slice(0, 2) ??
    'KM'
  ).toUpperCase()

  return (
    <aside className="sticky top-24 hidden h-[calc(100vh-7rem)] w-full max-w-sm lg:block">
      <Card className="flex h-full flex-col overflow-hidden p-0">
        <div className="border-b border-border px-6 py-6">
          <div className="flex items-center gap-3">
            <Avatar
              fallback={initials}
              src={profile?.avatarUrl ?? undefined}
              alt={profile?.displayName ?? profile?.fullName ?? auth.user?.email ?? ''}
              size="lg"
            />
            <div className="min-w-0">
              <p className="truncate font-medium text-foreground">
                {profile?.displayName ?? profile?.fullName ?? auth.user?.email ?? site.name}
              </p>
              <p className="text-sm text-muted-foreground">
                {profile?.roles?.includes('super_admin')
                  ? t('roles.super_admin', 'Super Admin')
                  : t('roles.customer', 'Customer')}
              </p>
            </div>
          </div>
          <Badge variant="premium" className="mt-4">
            {t('dashboard.label', 'Account workspace')}
          </Badge>
        </div>

        <nav className="flex-1 space-y-2 p-4" aria-label="Dashboard">
          {dashboardLinks.map((item) => (
            <NavLink
              key={item.path}
              to={routes.forLocale(locale, item.path)}
              end={item.path === 'dashboard'}
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

        <div className="border-t border-border p-4 space-y-3">
          <Button asChild variant="outline" className="w-full">
            <Link to={routes.forLocale(locale, '')}>{t('dashboard.visit_store', 'Visit store')}</Link>
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="w-full"
            onClick={() => void auth.signOut()}
          >
            {t('dashboard.sign_out', 'Sign out')}
          </Button>
        </div>
      </Card>
    </aside>
  )
}
