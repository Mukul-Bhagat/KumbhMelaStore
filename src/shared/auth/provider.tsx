/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import type { Provider, Session } from '@supabase/supabase-js'

import { getSupabaseBrowserClient, isSupabaseConfigured } from '@/shared/api/supabase'
import { getAlternateLocale, type Locale } from '@/shared/config/locales'
import { site } from '@/shared/config/site'
import type { AuthProfile, AuthState, AppRole } from '@/shared/auth/types'
import { fetchAuthProfile } from '@/shared/auth/repository'
import { getActiveLocale } from '@/shared/lib/locale-state'
import { useUiStore } from '@/shared/stores/ui-store'

type AuthContextValue = AuthState & {
  ready: boolean
  isSuperAdmin: boolean
  signInWithPassword: (input: { email: string; password: string }) => Promise<AuthProfile>
  signUpWithPassword: (input: {
    email: string
    password: string
    fullName: string
    phone: string
    locale: Locale
  }) => Promise<void>
  signInWithOAuth: (provider: Provider) => Promise<void>
  requestPasswordReset: (email: string) => Promise<void>
  completePasswordReset: (password: string) => Promise<void>
  signOut: () => Promise<void>
  refresh: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

function createInitialAuthState(): AuthState {
  return isSupabaseConfigured()
    ? {
        status: 'loading',
        session: null,
        user: null,
        profile: null,
      }
    : {
        status: 'anonymous',
        session: null,
        user: null,
        profile: null,
      }
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState<AuthState>(createInitialAuthState)
  const [ready, setReady] = useState(() => !isSupabaseConfigured())
  const setLocale = useUiStore((uiState) => uiState.setLocale)

  const refresh = useCallback(async () => {
    const supabase = getSupabaseBrowserClient()
    const { data, error } = await supabase.auth.getSession()
    if (error) {
      throw error
    }

    const session = data.session

    if (!session?.user) {
      setState({
        status: 'anonymous',
        session: null,
        user: null,
        profile: null,
      })
      return
    }

    setState({ status: 'loading', session, user: session.user, profile: null })
    try {
      const profile = await fetchAuthProfile(session.user)
      setLocale(profile.localeCode)
      setState({ status: 'authenticated', session, user: session.user, profile })
    } catch (error) {
      console.error('Unable to load the authenticated user profile and roles.', error)
      setState({ status: 'authenticated', session, user: session.user, profile: null })
      throw error
    }
  }, [setLocale])

  useEffect(() => {
    let mounted = true

    if (!isSupabaseConfigured()) {
      return
    }

    const supabase = getSupabaseBrowserClient()
    const applySession = async (session: Session | null) => {
      if (!session?.user) {
        setState({
          status: 'anonymous',
          session: null,
          user: null,
          profile: null,
        })
        setReady(true)
        return
      }

      setState({ status: 'loading', session, user: session.user, profile: null })
      try {
        const profile = await fetchAuthProfile(session.user)
        if (!mounted) {
          return
        }

        setLocale(profile.localeCode)
        setState({ status: 'authenticated', session, user: session.user, profile })
      } catch (error) {
        if (!mounted) {
          return
        }

        console.error('Unable to load the authenticated user profile and roles.', error)
        setState({ status: 'authenticated', session, user: session.user, profile: null })
      } finally {
        if (mounted) {
          setReady(true)
        }
      }
    }

    supabase.auth
      .getSession()
      .then(async ({ data, error }) => {
        if (!mounted) {
          return
        }

        if (error) {
          throw error
        }

        await applySession(data.session)
      })
      .catch((error: unknown) => {
        if (!mounted) {
          return
        }
        console.error('Unable to initialize the Supabase session.', error)
        setState({
          status: 'anonymous',
          session: null,
          user: null,
          profile: null,
        })
        setReady(true)
      })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) {
        return
      }

      void applySession(session)
    })

    return () => {
      mounted = false
      listener.subscription.unsubscribe()
    }
  }, [setLocale])

  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      ready,
      isSuperAdmin: state.profile?.roles.includes('super_admin') ?? false,
      signInWithPassword: async ({ email, password }) => {
        const supabase = getSupabaseBrowserClient()
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) {
          throw error
        }

        if (!data.user) {
          throw new Error('Unable to resolve the signed-in user.')
        }

        const profile = await fetchAuthProfile(data.user)
        setLocale(profile.localeCode)
        setState({
          status: 'authenticated',
          session: data.session,
          user: data.user,
          profile,
        })
        setReady(true)
        return profile
      },
      signUpWithPassword: async ({ email, password, fullName, phone, locale }) => {
        const supabase = getSupabaseBrowserClient()
        const callbackUrl = `${site.url}/auth/callback?locale=${locale}`
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: callbackUrl,
            data: {
              full_name: fullName,
              phone,
              locale,
            },
          },
        })
        if (error) {
          if (error.status === 422 || error.message.toLowerCase().includes('already')) {
            throw new Error('An account with this email already exists. Please sign in or reset your password.')
          }
          throw error
        }
      },
      signInWithOAuth: async (provider) => {
        const supabase = getSupabaseBrowserClient()
        const locale = getActiveLocale()
        const { error } = await supabase.auth.signInWithOAuth({
          provider,
          options: {
            redirectTo: `${site.url}/auth/callback?locale=${locale}`,
          },
        })
        if (error) {
          throw error
        }
      },
      requestPasswordReset: async (email) => {
        const supabase = getSupabaseBrowserClient()
        const locale = getActiveLocale()
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${site.url}/auth/reset-password?locale=${locale}`,
        })
        if (error) {
          throw error
        }
      },
      completePasswordReset: async (password) => {
        const supabase = getSupabaseBrowserClient()
        const { error } = await supabase.auth.updateUser({ password })
        if (error) {
          throw error
        }
      },
      signOut: async () => {
        const supabase = getSupabaseBrowserClient()
        const { error } = await supabase.auth.signOut()
        if (error) {
          throw error
        }
      },
      refresh,
    }),
    [ready, refresh, setLocale, state],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider.')
  }
  return context
}

export function useSessionState() {
  const auth = useAuth()
  return auth.status
}

export function useAuthorizedRole(role: AppRole) {
  const auth = useAuth()
  return auth.profile?.roles.includes(role) ?? false
}

export function useAlternateLocale(locale: Locale) {
  return getAlternateLocale(locale)
}
