import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

import { ErrorState } from '@/components/ui/error-state'
import { LoadingScreen } from '@/components/layout/loading-screen'
import { getSupabaseBrowserClient } from '@/shared/api/supabase'
import { fetchAuthProfile, getRedirectPathForRoles } from '@/shared/auth/repository'
import { routes } from '@/shared/config/routes'
import { isLocale, normalizeLocale } from '@/shared/config/locales'
import { setActiveLocale } from '@/shared/lib/locale-state'
import { useUiStore } from '@/shared/stores/ui-store'

export function Component() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const callbackErrorMessage = (() => {
    const authError = searchParams.get('error')
    const authErrorDescription = searchParams.get('error_description')
    return authErrorDescription ?? authError ?? null
  })()

  useEffect(() => {
    const localeParam = searchParams.get('locale')
    if (isLocale(localeParam)) {
      const locale = normalizeLocale(localeParam)
      setActiveLocale(locale)
      useUiStore.getState().setLocale(locale)
    }
  }, [searchParams])

  useEffect(() => {
    const supabase = getSupabaseBrowserClient()
    const code = searchParams.get('code')

    if (!code) {
      if (callbackErrorMessage) {
        return
      }

      navigate(routes.dashboard.home, { replace: true })
      return
    }

    let mounted = true

    supabase.auth
      .exchangeCodeForSession(code)
      .then(async ({ data, error }) => {
        if (!mounted) {
          return
        }

        if (error) {
          setErrorMessage(error.message)
          return
        }

        const profile = data.user ? await fetchAuthProfile(data.user) : null
        const nextPath = getRedirectPathForRoles(profile?.roles, routes.dashboard.home)
        navigate(nextPath, { replace: true })
      })
      .catch((error: unknown) => {
        if (!mounted) {
          return
        }
        setErrorMessage(error instanceof Error ? error.message : 'Unable to complete sign-in.')
      })

    return () => {
      mounted = false
    }
  }, [callbackErrorMessage, navigate, searchParams])

  if (errorMessage || callbackErrorMessage) {
    return (
      <div className="grid min-h-screen place-items-center px-4 py-10">
        <ErrorState
          title="Unable to complete sign-in"
          description={errorMessage ?? callbackErrorMessage ?? 'Unable to complete sign-in.'}
          retryLabel="Return to sign in"
          onRetry={() => navigate(routes.auth.signIn, { replace: true })}
          className="w-full max-w-2xl"
        />
      </div>
    )
  }

  return <LoadingScreen />
}
