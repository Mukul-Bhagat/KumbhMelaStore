import { Outlet } from 'react-router-dom'

import { SiteFooter } from '@/components/layout/site-footer'
import { SiteHeader } from '@/components/layout/site-header'
import { PageShell } from '@/components/layout/page-shell'

export function MarketingLayout() {
  return (
    <div className="min-h-screen">
      <SiteHeader variant="marketing" />
      <PageShell>
        <Outlet />
      </PageShell>
      <SiteFooter />
    </div>
  )
}
