import { Outlet } from 'react-router-dom'

import { BrandMark } from '@/components/brand/brand-mark'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Reveal } from '@/components/layout/reveal'
import { LanguageToggleButton } from '@/components/layout/language-toggle'
import { useSiteShell, useTranslate } from '@/shared/cms/hooks'
import { site } from '@/shared/config/site'

export function AuthLayout() {
  const { t } = useTranslate()
  const shell = useSiteShell()

  const brandName = shell.data ? t(shell.data.brand.nameKey, site.name) : site.name
  const brandDevanagari = shell.data
    ? t(shell.data.brand.devanagariKey, site.devanagari)
    : site.devanagari
  const tagline = shell.data
    ? t(shell.data.brand.taglineKey, site.tagline)
    : site.tagline
  const description = shell.data
    ? t(shell.data.brand.descriptionKey, site.description)
    : site.description

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_0.9fr]">
      <div className="relative hidden overflow-hidden border-r border-border/70 bg-surface/70 lg:block">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,hsl(var(--primary)/0.18),transparent_32%),radial-gradient(circle_at_70%_30%,hsl(var(--accent)/0.35),transparent_28%)]" />
        <div className="relative flex h-full flex-col justify-between px-12 py-12">
          <BrandMark
            linked
            size="lg"
            name={brandName}
            devanagari={brandDevanagari}
          />
          <Reveal className="max-w-xl space-y-6">
            <Badge variant="premium">
              {t('auth.shell.badge', 'Heritage-first account space')}
            </Badge>
            <div className="space-y-4">
              <p className="font-display text-5xl font-semibold tracking-tight text-foreground">
                {brandDevanagari}
              </p>
              <p className="text-lg leading-8 text-muted-foreground">{tagline}</p>
              <p className="max-w-lg text-sm leading-7 text-muted-foreground">
                {description}
              </p>
            </div>
          </Reveal>
        </div>
      </div>

      <div className="flex items-center justify-center px-4 py-10 sm:px-8 lg:px-12">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <BrandMark
              linked
              size="md"
              name={brandName}
              devanagari={brandDevanagari}
            />
          </div>
          <div className="mb-4 flex justify-end">
            <LanguageToggleButton />
          </div>
          <Card className="shadow-[var(--shadow-elevated)]">
            <Outlet />
          </Card>
        </div>
      </div>
    </div>
  )
}
