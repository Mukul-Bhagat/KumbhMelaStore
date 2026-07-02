import { Outlet } from 'react-router-dom'

import { SiteFooter } from '@/components/layout/site-footer'
import { SiteHeader } from '@/components/layout/site-header'
import { PageShell } from '@/components/layout/page-shell'

export function ShopLayout() {
  return (
    <div className="min-h-screen">
      <SiteHeader variant="shop" />
      <PageShell className="pt-10">
        <Outlet />
      </PageShell>
      <SiteFooter />
    </div>
  )
}
