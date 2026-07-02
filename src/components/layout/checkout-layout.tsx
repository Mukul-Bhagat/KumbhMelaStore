import { Outlet } from 'react-router-dom'

import { BrandMark } from '@/components/brand/brand-mark'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { PageShell } from '@/components/layout/page-shell'
import { site } from '@/shared/config/site'

export function CheckoutLayout() {
  return (
    <div className="min-h-screen">
      <header className="border-b border-border/70 bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <BrandMark linked size="sm" />
          <div className="flex items-center gap-3">
            <Badge variant="premium">Secure checkout</Badge>
            <Button asChild variant="outline" size="sm">
              <a href={`mailto:${site.supportEmail}`}>Need help?</a>
            </Button>
          </div>
        </div>
      </header>

      <PageShell className="pt-10">
        <Outlet />
      </PageShell>
    </div>
  )
}
