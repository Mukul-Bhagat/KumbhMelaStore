import { Outlet, Link } from 'react-router-dom'

import { BrandMark } from '@/components/brand/brand-mark'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { PageShell } from '@/components/layout/page-shell'
import { useSiteShell, useTranslate } from '@/shared/cms/hooks'
import { routes } from '@/shared/config/routes'
import { site } from '@/shared/config/site'

export function CheckoutLayout() {
  const { t } = useTranslate()
  const shell = useSiteShell()

  const brandName = shell.data ? t(shell.data.brand.nameKey, site.name) : site.name
  const brandDevanagari = shell.data
    ? t(shell.data.brand.devanagariKey, site.devanagari)
    : site.devanagari
  const supportEmail = shell.data?.brand.supportEmail ?? site.supportEmail

  return (
    <div className="min-h-screen">
      <header className="border-b border-border/70 bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <BrandMark linked size="sm" name={brandName} devanagari={brandDevanagari} />
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="premium">
              {t('checkout.secure', 'Secure checkout')}
            </Badge>
            <Button asChild variant="outline" size="sm">
              <a href={`mailto:${supportEmail}`}>{t('checkout.need_help', 'Need help?')}</a>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link to={routes.trackOrder}>{t('nav.track_order', 'Track order')}</Link>
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
