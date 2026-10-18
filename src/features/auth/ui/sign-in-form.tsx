import { zodResolver } from '@hookform/resolvers/zod'
import { LoaderCircle, Lock, Mail } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useLocation, useNavigate } from 'react-router-dom'

import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/shared/auth/provider'
import { isGithubOAuthEnabled } from '@/shared/config/env'
import { routes } from '@/shared/config/routes'
import { useLocale } from '@/shared/hooks/use-locale'
import { useTranslate } from '@/shared/cms/hooks'
import { signInSchema, type SignInValues } from '@/features/auth/model/schemas'

export function SignInForm() {
  const auth = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const locale = useLocale()
  const { t } = useTranslate()
  const githubEnabled = isGithubOAuthEnabled()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [submitInFlight, setSubmitInFlight] = useState(false)

  const redirectTo = useMemo(() => {
    const state = location.state as { from?: string } | null
    return state?.from ?? routes.forLocale(locale, 'dashboard')
  }, [locale, location.state])

  const form = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: true,
    },
  })

  const onSubmit = form.handleSubmit(async (values) => {
    if (submitInFlight) {
      return
    }

    setSubmitInFlight(true)
    setErrorMessage(null)

    try {
      const profile = await auth.signInWithPassword({
        email: values.email,
        password: values.password,
      })

      navigate(
        profile.roles.includes('super_admin') ? routes.forLocale(locale, 'admin') : redirectTo,
        { replace: true },
      )
    } catch (error) {
      const details = getAuthErrorDetails(error)
      const message = details.message ?? (error instanceof Error ? error.message : '')

      if (
        details.status === 429 ||
        details.code === 'over_request_rate_limit' ||
        details.code === 'over_email_send_rate_limit' ||
        details.message?.toLowerCase().includes('too many requests')
      ) {
        setErrorMessage(
          t(
            'auth.sign_in.rate_limit',
            'Too many sign-in attempts were made. Please wait a minute and try again.',
          ),
        )
        return
      }

      if (details.code === 'invalid_credentials') {
        setErrorMessage(
          t('auth.sign_in.invalid_credentials', 'Incorrect email or password. Please try again.'),
        )
        return
      }

      if (details.code === 'email_not_confirmed') {
        setErrorMessage(
          t('auth.sign_in.email_not_confirmed', 'Please confirm your email address before signing in.'),
        )
        return
      }

      setErrorMessage(
        error instanceof TypeError ||
          error instanceof DOMException && error.name === 'TimeoutError' ||
          message.toLowerCase().includes('failed to fetch')
          ? t(
              'auth.connection_error',
              'Unable to connect to the authentication service. Check your connection and Supabase URL, then try again.',
            )
          : message || t('auth.sign_in.error', 'Unable to sign in. Please try again.'),
      )
    } finally {
      setSubmitInFlight(false)
    }
  })

  return (
    <form onSubmit={onSubmit} className="space-y-6 p-6 sm:p-8" noValidate>
      <div className="space-y-2">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground">
          {t('auth.sign_in.title', 'Welcome back')}
        </h1>
        <p className="text-sm leading-6 text-muted-foreground">
          {t('auth.sign_in.description', 'Sign in to access your orders, wishlist, and saved addresses.')}
        </p>
      </div>

      {errorMessage ? (
        <Alert
          title={t('auth.sign_in.error_title', 'Sign-in failed')}
          description={errorMessage}
          variant="error"
        />
      ) : null}

      <Separator />

      <div className="space-y-2">
        <Label htmlFor="signin-email">{t('auth.email', 'Email')}</Label>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="signin-email"
            type="email"
            className="pl-11"
            placeholder="name@example.com"
            {...form.register('email')}
          />
        </div>
        {form.formState.errors.email ? (
          <p className="text-xs text-error">{form.formState.errors.email.message}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="signin-password">{t('auth.password', 'Password')}</Label>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="signin-password"
            type="password"
            className="pl-11"
            placeholder={t('auth.sign_in.password_placeholder', 'Enter your password')}
            {...form.register('password')}
          />
        </div>
        {form.formState.errors.password ? (
          <p className="text-xs text-error">
            {form.formState.errors.password.message}
          </p>
        ) : null}
      </div>

      <label className="flex items-center gap-3 text-sm text-muted-foreground">
        <input
          type="checkbox"
          className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
          {...form.register('rememberMe')}
        />
        {t('auth.sign_in.remember', 'Remember me for 30 days')}
      </label>

      <div className="space-y-3">
        <Button
          type="submit"
          className="w-full"
          disabled={form.formState.isSubmitting || submitInFlight}
        >
          {form.formState.isSubmitting || submitInFlight ? (
            <>
              <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
              {t('auth.sign_in.pending', 'Signing in...')}
            </>
          ) : (
            t('auth.sign_in.cta', 'Sign in')
          )}
        </Button>

        <div className="flex flex-col items-center gap-3">
          <Button
            type="button"
            variant="outline"
            className="h-11 w-full max-w-sm border-border bg-background text-foreground shadow-sm hover:bg-muted"
            onClick={() => {
              void auth.signInWithOAuth('google')
            }}
          >
            <img src="/google-g-logo.svg" alt="" aria-hidden="true" className="h-[18px] w-[18px]" />
            {t('auth.google_sign_in', 'Sign in with Google')}
          </Button>

          {githubEnabled ? (
            <Button
              type="button"
              variant="outline"
              className="w-full max-w-sm"
              onClick={() => {
                void auth.signInWithOAuth('github')
              }}
            >
              {t('auth.github', 'Continue with GitHub')}
            </Button>
          ) : null}
        </div>
      </div>

      <div className="flex flex-col gap-3 text-center text-sm text-muted-foreground">
        <Button asChild variant="link" className="px-0">
          <Link to={routes.forLocale(locale, 'auth/forgot-password')}>
            {t('auth.sign_in.forgot', 'Forgot password?')}
          </Link>
        </Button>
      </div>
    </form>
  )
}

function getAuthErrorDetails(error: unknown) {
  if (typeof error !== 'object' || error === null) {
    return { status: undefined, code: undefined, message: undefined }
  }

  const details = error as { status?: unknown; code?: unknown; message?: unknown }
  return {
    status: typeof details.status === 'number' ? details.status : undefined,
    code: typeof details.code === 'string' ? details.code : undefined,
    message: typeof details.message === 'string' ? details.message : undefined,
  }
}
