import { type PropsWithChildren } from 'react'
import { Link, Navigate, useLocation, useParams } from 'react-router-dom'

import { routes } from '@/shared/config/routes'
import { defaultLocale, isLocale } from '@/shared/config/locales'
import { useAuth } from '@/shared/auth/provider'
import type { AppRole } from '@/shared/auth/types'
import { LoadingScreen } from '@/components/layout/loading-screen'
import { ErrorState } from '@/components/ui/error-state'
import { Button } from '@/components/ui/button'

export function RequireAuth({ children }: PropsWithChildren) {
  const auth = useAuth()
  const location = useLocation()
  const { locale: localeParam } = useParams()
  const locale = isLocale(localeParam) ? localeParam : defaultLocale

  if (!auth.ready || auth.status === 'loading') {
    return <LoadingScreen className="min-h-[100svh]" />
  }

  if (auth.status !== 'authenticated') {
    return (
      <Navigate
        replace
        to={routes.forLocale(locale, 'auth/sign-in')}
        state={{ from: location.pathname + location.search + location.hash }}
      />
    )
  }

  return children
}

export function RequireRole({
  role,
  children,
}: PropsWithChildren<{ role: AppRole }>) {
  const auth = useAuth()
  const { locale: localeParam } = useParams()
  const locale = isLocale(localeParam) ? localeParam : defaultLocale

  if (!auth.ready || auth.status === 'loading') {
    return <LoadingScreen className="min-h-[100svh]" />
  }

  if (auth.status !== 'authenticated') {
    return <Navigate replace to={routes.forLocale(locale, 'auth/sign-in')} />
  }

  if (!auth.profile) {
    return (
      <ErrorState
        title="Unable to verify account permissions"
        description="The signed-in user’s profile and role could not be loaded. Retry when the authentication service is reachable."
        actionLabel="Retry verification"
        onAction={() => {
          void auth.refresh().catch((error: unknown) => {
            console.error('Unable to verify account permissions.', error)
          })
        }}
        secondaryAction={
          <Button asChild variant="outline">
            <Link to={routes.forLocale(locale, 'auth/sign-in')}>Return to sign in</Link>
          </Button>
        }
      />
    )
  }

  if (!auth.profile?.roles.includes(role)) {
    return <Navigate replace to={routes.forLocale(locale, 'dashboard')} />
  }

  return children
}
