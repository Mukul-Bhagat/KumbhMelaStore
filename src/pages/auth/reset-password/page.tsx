import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'

import { ResetPasswordForm } from '@/features/auth/ui/reset-password-form'
import { Seo } from '@/components/layout/seo'
import { isLocale, normalizeLocale } from '@/shared/config/locales'
import { setActiveLocale } from '@/shared/lib/locale-state'
import { useUiStore } from '@/shared/stores/ui-store'

export function Component() {
  const [searchParams] = useSearchParams()

  useEffect(() => {
    const localeParam = searchParams.get('locale')
    if (isLocale(localeParam)) {
      const locale = normalizeLocale(localeParam)
      setActiveLocale(locale)
      useUiStore.getState().setLocale(locale)
    }
  }, [searchParams])

  return (
    <div>
      <Seo
        title="Reset password"
        description="Create a new password for your KumbhMelaStore account."
      />
      <ResetPasswordForm />
    </div>
  )
}
