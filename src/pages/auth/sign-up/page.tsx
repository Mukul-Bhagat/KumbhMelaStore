import { Link } from 'react-router-dom'

import { SignUpForm } from '@/features/auth/ui/sign-up-form'
import { Seo } from '@/components/layout/seo'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { routes } from '@/shared/config/routes'
import { useLocale } from '@/shared/hooks/use-locale'
import { useTranslate } from '@/shared/cms/hooks'

export function Component() {
  const locale = useLocale()
  const { t } = useTranslate()

  return (
    <div>
      <Seo
        title={t('auth.sign_up.title', 'Create account')}
        description={t('auth.sign_up.description', 'Create a KumbhMelaStore account.')}
      />
      <SignUpForm />
      <Separator />
      <div className="px-6 py-5 text-center text-sm text-muted-foreground sm:px-8">
        {t('auth.sign_up.have_account', 'Already have an account?')}{' '}
        <Button asChild variant="link" className="px-0">
          <Link to={routes.forLocale(locale, 'auth/sign-in')}>
            {t('auth.sign_in.cta', 'Sign in')}
          </Link>
        </Button>
      </div>
    </div>
  )
}
