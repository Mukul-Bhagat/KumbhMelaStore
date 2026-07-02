import { Outlet } from 'react-router-dom'

import { DashboardSidebar } from '@/components/layout/dashboard-sidebar'
import { SiteHeader } from '@/components/layout/site-header'
import { PageShell } from '@/components/layout/page-shell'

export function DashboardLayout() {
  return (
    <div className="min-h-screen">
      <SiteHeader variant="shop" />
      <PageShell className="grid gap-8 pt-10 lg:grid-cols-[300px_minmax(0,1fr)]">
        <DashboardSidebar />
        <div className="min-w-0">
          <Outlet />
        </div>
      </PageShell>
    </div>
  )
}
