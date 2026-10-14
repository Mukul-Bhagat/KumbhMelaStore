import { MailCheck, LogOut } from 'lucide-react'
import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { SectionHeading } from '@/components/layout/section-heading'
import { Seo } from '@/components/layout/seo'
import { useAuth } from '@/shared/auth/provider'
import { routes } from '@/shared/config/routes'
import { useLocale } from '@/shared/hooks/use-locale'
import { useTranslate } from '@/shared/cms/hooks'

export function Component() {
  const auth = useAuth()
  const locale = useLocale()
  const { t } = useTranslate()

  return (
    <div className="space-y-8">
      <Seo title={t('dashboard.settings', 'Settings')} description={t('dashboard.settings_description', 'Manage security, profile, and language preferences.')} />
      <SectionHeading
        eyebrow={t('dashboard.label', 'Dashboard')}
        title={t('dashboard.settings', 'Settings')}
        description={t('dashboard.settings_description', 'Manage account security and sign out of this device.')}
      />

      <Card className="shadow-[var(--shadow-soft)]">
        <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <p className="font-display text-2xl font-semibold tracking-tight">{t('dashboard.security', 'Security')}</p>
            <p className="text-sm text-muted-foreground">
              {t('dashboard.security_description', 'Reset your password through Supabase Auth or sign out of this device.')}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild variant="outline">
              <Link to={routes.forLocale(locale, 'auth/forgot-password')}>
                <MailCheck className="h-4 w-4" />
                {t('dashboard.reset_password', 'Reset password')}
              </Link>
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                void auth.signOut()
              }}
            >
              <LogOut className="h-4 w-4" />
              {t('dashboard.sign_out', 'Sign out')}
            </Button>
          </div>
        </CardContent>
      </Card>

    </div>
  )
}
