import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'

import { SectionHeading } from '@/components/layout/section-heading'
import { Seo } from '@/components/layout/seo'
import { LoadingScreen } from '@/components/layout/loading-screen'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { queryKeys } from '@/shared/api/keys'
import { getSupabaseBrowserClient } from '@/shared/api/supabase'
import { useAuth } from '@/shared/auth/provider'
import { routes } from '@/shared/config/routes'
import { useLocale } from '@/shared/hooks/use-locale'
import { useTranslate } from '@/shared/cms/hooks'
import { formatCurrency } from '@/shared/lib/format'

type OverviewData = {
  latestOrderTotal: number | null
  latestOrderStatus: string | null
  latestOrderNumber: string | null
  latestOrderCreatedAt: string | null
}

async function fetchOverviewData(userId: string): Promise<OverviewData> {
  const supabase = getSupabaseBrowserClient()

  const { data, error } = await supabase
    .from('orders')
    .select('order_number, grand_total, status, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    throw error
  }

  return {
    latestOrderTotal: data?.grand_total ?? null,
    latestOrderStatus: data?.status ?? null,
    latestOrderNumber: data?.order_number ?? null,
    latestOrderCreatedAt: data?.created_at ?? null,
  }
}

export function Component() {
  const auth = useAuth()
  const locale = useLocale()
  const { t } = useTranslate()
  const profile = auth.profile
  const userId = auth.user?.id ?? ''
  const overview = useQuery({
    queryKey: queryKeys.dashboard.detail(userId),
    queryFn: () => fetchOverviewData(userId),
    enabled: Boolean(userId),
  })

  if (overview.isLoading) {
    return <LoadingScreen className="min-h-[60svh]" />
  }

  if (overview.error) {
    return (
      <EmptyState
        title={t('dashboard.load_error', 'Unable to load dashboard')}
        description={t('dashboard.load_error_description', 'Supabase could not load the current account summary.')}
        actionLabel={t('dashboard.retry', 'Retry')}
        onAction={() => {
          void overview.refetch()
        }}
      />
    )
  }

  return (
    <div className="space-y-8">
      <Seo
        title={t('dashboard.overview', 'Dashboard')}
        description={t('dashboard.seo_description', 'Your customer account dashboard powered by Supabase.')}
      />
      <SectionHeading
        eyebrow={t('dashboard.label', 'Dashboard')}
        title={`${t('dashboard.welcome', 'Welcome back')}, ${profile?.displayName ?? profile?.fullName ?? auth.user?.email ?? t('role.customer', 'Customer')}`}
      />

      {overview.data?.latestOrderNumber ? (
        <Card className="shadow-[var(--shadow-soft)]">
          <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <h2 className="font-display text-xl font-semibold tracking-tight">{t('dashboard.recent_order', 'Recent order')}</h2>
              <p className="text-sm text-muted-foreground">
                {overview.data.latestOrderNumber}
                {overview.data.latestOrderStatus
                  ? ` · ${t(`dashboard.order_status.${overview.data.latestOrderStatus}`, overview.data.latestOrderStatus.replaceAll('_', ' '))}`
                  : ''}
                {overview.data.latestOrderCreatedAt
                  ? ` · ${new Date(overview.data.latestOrderCreatedAt).toLocaleDateString(locale === 'hi' ? 'hi-IN' : 'en-IN')}`
                  : ''}
                {overview.data.latestOrderTotal != null
                  ? ` · ${formatCurrency(overview.data.latestOrderTotal)}`
                  : ''}
              </p>
            </div>
            <Button asChild variant="outline">
              <Link to={routes.forLocale(locale, 'dashboard/orders')}>{t('dashboard.view_orders', 'View all orders')}</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <EmptyState
          title={t('dashboard.no_orders', 'No orders yet')}
          description={t('dashboard.explore_collection', 'Explore the collection and your orders will appear here.')}
          action={
            <Button asChild>
              <Link to={routes.forLocale(locale, 'products')}>{t('dashboard.browse_products', 'Browse products')}</Link>
            </Button>
          }
        />
      )}
    </div>
  )
}
