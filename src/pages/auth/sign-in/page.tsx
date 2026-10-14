import { Link } from 'react-router-dom'

import { SignInForm } from '@/features/auth/ui/sign-in-form'
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
        title={t('auth.sign_in.title', 'Sign in')}
        description={t('auth.sign_in.description', 'Sign in to your KumbhMelaStore account.')}
      />
      <SignInForm />
      <Separator />
      <div className="px-6 py-5 text-center text-sm text-muted-foreground sm:px-8">
        {t('auth.sign_in.no_account', 'Don’t have an account?')}{' '}
        <Button asChild variant="link" className="px-0">
          <Link to={routes.forLocale(locale, 'auth/sign-up')}>
            {t('auth.sign_in.create_account', 'Create one')}
          </Link>
        </Button>
      </div>
    </div>
  )
}
