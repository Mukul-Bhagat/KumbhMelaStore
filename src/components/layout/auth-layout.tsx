import { Outlet } from 'react-router-dom'

import { BrandMark } from '@/components/brand/brand-mark'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Reveal } from '@/components/layout/reveal'
import { site } from '@/shared/config/site'

export function AuthLayout() {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_0.9fr]">
      <div className="relative hidden overflow-hidden border-r border-border/70 bg-surface/70 lg:block">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,hsl(var(--primary)/0.18),transparent_32%),radial-gradient(circle_at_70%_30%,hsl(var(--accent)/0.35),transparent_28%)]" />
        <div className="relative flex h-full flex-col justify-between px-12 py-12">
          <BrandMark linked size="lg" />
          <Reveal className="max-w-xl space-y-6">
            <Badge variant="premium">Heritage-first account space</Badge>
            <div className="space-y-4">
              <p className="font-display text-5xl font-semibold tracking-tight text-foreground">
                {site.devanagari}
              </p>
              <p className="text-lg leading-8 text-muted-foreground">
                Sign in to a calm, premium account experience designed for
                gifting, rituals, and repeat purchasing with confidence.
              </p>
            </div>
          </Reveal>
        </div>
      </div>

      <div className="flex items-center justify-center px-4 py-10 sm:px-8 lg:px-12">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <BrandMark linked size="md" />
          </div>
          <Card className="shadow-[var(--shadow-elevated)]">
            <Outlet />
          </Card>
        </div>
      </div>
    </div>
  )
}
