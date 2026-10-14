import { useQuery } from '@tanstack/react-query'
import { LayoutDashboard, Package, Users, FileText, Image, Star } from 'lucide-react'
import type { ReactNode } from 'react'

import { LoadingScreen } from '@/components/layout/loading-screen'
import { SectionHeading } from '@/components/layout/section-heading'
import { Seo } from '@/components/layout/seo'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { getSupabaseBrowserClient } from '@/shared/api/supabase'
import { useTranslate } from '@/shared/cms/hooks'

type OverviewCounts = {
  products: number
  customers: number
  orders: number
  pages: number
  media: number
  reviews: number
}

async function fetchOverviewCounts(): Promise<OverviewCounts> {
  const supabase = getSupabaseBrowserClient()
  const [products, customers, orders, pages, media, reviews] = await Promise.all([
    supabase.from('products').select('id', { count: 'exact', head: true }),
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('orders').select('id', { count: 'exact', head: true }),
    supabase.from('pages').select('id', { count: 'exact', head: true }),
    supabase.from('media').select('id', { count: 'exact', head: true }),
    supabase.from('reviews').select('id', { count: 'exact', head: true }),
  ])

  const firstError = products.error ?? customers.error ?? orders.error ?? pages.error ?? media.error ?? reviews.error
  if (firstError) {
    throw firstError
  }

  return {
    products: products.count ?? 0,
    customers: customers.count ?? 0,
    orders: orders.count ?? 0,
    pages: pages.count ?? 0,
    media: media.count ?? 0,
    reviews: reviews.count ?? 0,
  }
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: ReactNode
  label: string
  value: number
}) {
  return (
    <Card className="shadow-[var(--shadow-soft)]">
      <CardContent className="space-y-4 p-6">
        <div className="flex items-center justify-between gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-full border border-border bg-surface text-primary">
            {icon}
          </div>
          <Badge variant="outline">{label}</Badge>
        </div>
        <p className="font-display text-3xl font-semibold tracking-tight">{value}</p>
      </CardContent>
    </Card>
  )
}

export function Component() {
  const { t } = useTranslate()
  const overview = useQuery({
    queryKey: ['kumbh-melastore', 'admin', 'overview'] as const,
    queryFn: fetchOverviewCounts,
  })

  if (overview.isLoading) {
    return <LoadingScreen className="min-h-[60svh]" />
  }

  if (overview.error) {
    return (
      <EmptyState
        title={t('admin.load_error', 'Unable to load admin overview')}
        description={t('admin.load_error_description', 'Supabase could not load the admin counts.')}
        actionLabel={t('dashboard.retry', 'Retry')}
        onAction={() => {
          void overview.refetch()
        }}
      />
    )
  }

  const data = overview.data

  return (
    <div className="space-y-8">
      <Seo title={t('admin.overview', 'Admin Overview')} description={t('admin.seo_description', 'Live admin summary from Supabase.')} />
      <SectionHeading
        eyebrow={t('admin.label', 'Super Admin')}
        title={t('admin.overview', 'Overview')}
        description={t('admin.back_office_description', 'The back office runs entirely on Supabase data and permissions.')}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Stat icon={<Package className="h-5 w-5" />} label={t('admin.products', 'Products')} value={data?.products ?? 0} />
        <Stat icon={<Users className="h-5 w-5" />} label={t('admin.customers', 'Customers')} value={data?.customers ?? 0} />
        <Stat icon={<LayoutDashboard className="h-5 w-5" />} label={t('admin.orders', 'Orders')} value={data?.orders ?? 0} />
        <Stat icon={<FileText className="h-5 w-5" />} label={t('admin.pages', 'Pages')} value={data?.pages ?? 0} />
        <Stat icon={<Image className="h-5 w-5" />} label={t('admin.media', 'Media')} value={data?.media ?? 0} />
        <Stat icon={<Star className="h-5 w-5" />} label={t('admin.reviews', 'Reviews')} value={data?.reviews ?? 0} />
      </div>

      <Card className="shadow-[var(--shadow-soft)]">
        <CardContent className="space-y-3 p-6">
          <h2 className="font-display text-2xl font-semibold tracking-tight">{t('admin.next_title', 'What to manage next')}</h2>
          <p className="text-sm text-muted-foreground">
            {t('admin.next_description', 'Use the catalog tab to edit products, collections, and categories. Use content to manage the CMS, navigation, footer, policies, and languages.')}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
