import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, LoaderCircle, Lock, Mail, Phone, User } from 'lucide-react'
import type { FormEventHandler } from 'react'
import { useMemo, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'

import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { consumeSignupRetryAfterSeconds } from '@/shared/api/supabase'
import { useAuth } from '@/shared/auth/provider'
import { isGithubOAuthEnabled } from '@/shared/config/env'
import { routes } from '@/shared/config/routes'
import { useLocale } from '@/shared/hooks/use-locale'
import { useTranslate } from '@/shared/cms/hooks'
import { createSignUpSchema, type SignUpValues } from '@/features/auth/model/schemas'

export function SignUpForm() {
  const auth = useAuth()
  const navigate = useNavigate()
  const locale = useLocale()
  const { t } = useTranslate()
  const githubEnabled = isGithubOAuthEnabled()
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [showAccountHelp, setShowAccountHelp] = useState(false)
  const [passwordVisible, setPasswordVisible] = useState(false)
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false)
  const submitInFlight = useRef(false)
  const signUpSchema = useMemo(
    () =>
      createSignUpSchema({
        fullName: t('auth.sign_up.validation.full_name', 'Enter your full name.'),
        email: t('auth.sign_up.validation.email', 'Enter a valid email address.'),
        phone: t(
          'auth.sign_up.validation.phone',
          'Enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.',
        ),
        password: t(
          'auth.sign_up.validation.password',
          'Password must be at least 8 characters.',
        ),
        confirmPassword: t('auth.sign_up.validation.confirm_password', 'Passwords do not match.'),
      }),
    [t],
  )

  const form = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: {
      fullName: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
    },
  })

  const submitValidForm = form.handleSubmit(async (values) => {
    setErrorMessage(null)
    setSuccessMessage(null)
    setShowAccountHelp(false)
    consumeSignupRetryAfterSeconds()

    try {
      const result = await auth.signUpWithPassword({
        email: values.email,
        password: values.password,
        fullName: values.fullName,
        phone: values.phone,
        locale,
      })

      if (!result.emailConfirmationRequired) {
        navigate(routes.forLocale(locale, 'dashboard'), { replace: true })
        return
      }

      setSuccessMessage(
        t(
          'auth.sign_up.confirmation_required',
          'Check your email to confirm your account before signing in.',
        ),
      )
      form.reset({
        fullName: '',
        email: values.email,
        phone: '',
        password: '',
        confirmPassword: '',
      })
    } catch (error) {
      const details = getAuthErrorDetails(error)
      if (import.meta.env.DEV) {
        console.error('Supabase signup failed.', details)
      }

      if (
        details.status === 429 ||
        details.code === 'over_email_send_rate_limit' ||
        details.code === 'over_request_rate_limit'
      ) {
        const retryAfterSeconds = consumeSignupRetryAfterSeconds()
        const delayMessage =
          retryAfterSeconds === null
            ? t(
                'auth.sign_up.rate_limit_wait_fallback',
                'Please wait a few minutes before trying again.',
              )
            : retryAfterSeconds < 60
              ? t('auth.sign_up.rate_limit_wait_seconds', 'Please wait {time} seconds before trying again.')
                  .replace('{time}', String(retryAfterSeconds))
              : t('auth.sign_up.rate_limit_wait_minutes', 'Please wait about {time} minute(s) before trying again.')
                  .replace('{time}', String(Math.ceil(retryAfterSeconds / 60)))

        setErrorMessage(
          t(
            'auth.sign_up.rate_limit',
            'Too many signup requests were made. {delay}',
          ).replace('{delay}', delayMessage),
        )
      } else if (
        details.code === 'user_already_exists' ||
        details.code === 'email_exists' ||
        details.code === 'identity_already_exists' ||
        details.message?.toLowerCase().includes('already registered')
      ) {
        setShowAccountHelp(true)
        setErrorMessage(
          t(
            'auth.sign_up.account_help',
            'If you already have an account, sign in or reset your password.',
          ),
        )
      } else if (details.code === 'email_address_invalid') {
        setErrorMessage(t('auth.sign_up.invalid_email', 'Enter a valid email address.'))
      } else if (details.code === 'weak_password') {
        setErrorMessage(
          t('auth.sign_up.weak_password', 'Choose a stronger password of at least 8 characters.'),
        )
      } else if (
        details.code === 'signup_disabled' ||
        details.code === 'email_provider_disabled'
      ) {
        setErrorMessage(
          t(
            'auth.sign_up.signup_disabled',
            'Account registration is temporarily unavailable. Please try again later.',
          ),
        )
      } else if (details.code === 'redirect_to_not_allowed') {
        setErrorMessage(
          t(
            'auth.sign_up.redirect_error',
            'The account confirmation link is not configured correctly. Please contact support.',
          ),
        )
      } else {
        setErrorMessage(
          t('auth.sign_up.generic_error', 'Unable to create your account. Please try again later.'),
        )
      }
    }
  })
  const onSubmit: FormEventHandler<HTMLFormElement> = async (event) => {
    if (submitInFlight.current) {
      event.preventDefault()
      return
    }

    submitInFlight.current = true
    try {
      await submitValidForm(event)
    } finally {
      submitInFlight.current = false
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6 p-6 sm:p-8" noValidate>
      <div className="space-y-2">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground">
          {t('auth.sign_up.title', 'Create your account')}
        </h1>
        <p className="text-sm leading-6 text-muted-foreground">
          {t('auth.sign_up.description', 'Join for faster checkout, order tracking, and premium gifting support.')}
        </p>
      </div>

      {errorMessage ? (
        <div role="alert">
          <Alert
            title={t('auth.sign_up.error_title', 'Sign-up failed')}
            description={errorMessage}
            variant="error"
            actions={
              showAccountHelp ? (
                <Button asChild variant="outline">
                  <Link to={routes.forLocale(locale, 'auth/sign-in')}>
                    {t('auth.sign_in.cta', 'Sign in')}
                  </Link>
                </Button>
              ) : undefined
            }
          />
        </div>
      ) : null}

      {successMessage ? (
        <div role="status" aria-live="polite">
          <Alert
            title={t('auth.sign_up.confirmation_title', 'Check your email')}
            description={successMessage}
            variant="success"
            actions={
              <Button asChild variant="outline">
                <Link to={routes.forLocale(locale, 'auth/sign-in')}>
                  {t('auth.sign_in.cta', 'Sign in')}
                </Link>
              </Button>
            }
          />
        </div>
      ) : null}

      <Separator />

      <div className="space-y-2">
        <Label htmlFor="signup-name">{t('auth.full_name', 'Full name')}</Label>
        <div className="relative">
          <User className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="signup-name"
            autoComplete="name"
            aria-invalid={Boolean(form.formState.errors.fullName)}
            aria-describedby={form.formState.errors.fullName ? 'signup-name-error' : undefined}
            className="pl-11"
            placeholder={t('auth.full_name_placeholder', 'Mukul Sharma')}
            {...form.register('fullName')}
          />
        </div>
        {form.formState.errors.fullName ? (
          <p id="signup-name-error" role="alert" className="text-xs text-error">
            {form.formState.errors.fullName.message}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="signup-email">{t('auth.email', 'Email')}</Label>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="signup-email"
            type="email"
            autoComplete="email"
            aria-invalid={Boolean(form.formState.errors.email)}
            aria-describedby={form.formState.errors.email ? 'signup-email-error' : undefined}
            className="pl-11"
            placeholder="name@example.com"
            {...form.register('email')}
          />
        </div>
        {form.formState.errors.email ? (
          <p id="signup-email-error" role="alert" className="text-xs text-error">
            {form.formState.errors.email.message}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="signup-phone">{t('auth.phone', 'Phone')}</Label>
        <div className="relative">
          <Phone className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="signup-phone"
            type="tel"
            className="pl-11"
            inputMode="numeric"
            autoComplete="tel-national"
            aria-invalid={Boolean(form.formState.errors.phone)}
            aria-describedby={form.formState.errors.phone ? 'signup-phone-error' : undefined}
            placeholder="9876543210"
            {...form.register('phone')}
          />
        </div>
        {form.formState.errors.phone ? (
          <p id="signup-phone-error" role="alert" className="text-xs text-error">
            {form.formState.errors.phone.message}
          </p>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="signup-password">{t('auth.password', 'Password')}</Label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="signup-password"
              type={passwordVisible ? 'text' : 'password'}
              autoComplete="new-password"
              aria-invalid={Boolean(form.formState.errors.password)}
              aria-describedby={form.formState.errors.password ? 'signup-password-error' : undefined}
              className="pl-11 pr-11"
              {...form.register('password')}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="absolute right-1.5 top-1/2 -translate-y-1/2"
              aria-label={t(
                passwordVisible ? 'auth.sign_up.hide_password' : 'auth.sign_up.show_password',
                passwordVisible ? 'Hide password' : 'Show password',
              )}
              aria-pressed={passwordVisible}
              onClick={() => setPasswordVisible((visible) => !visible)}
            >
              {passwordVisible ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
            </Button>
          </div>
          {form.formState.errors.password ? (
            <p id="signup-password-error" role="alert" className="text-xs text-error">
              {form.formState.errors.password.message}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="signup-confirm">{t('auth.confirm_password', 'Confirm password')}</Label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="signup-confirm"
              type={confirmPasswordVisible ? 'text' : 'password'}
              autoComplete="new-password"
              aria-invalid={Boolean(form.formState.errors.confirmPassword)}
              aria-describedby={form.formState.errors.confirmPassword ? 'signup-confirm-error' : undefined}
              className="pl-11 pr-11"
              {...form.register('confirmPassword')}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="absolute right-1.5 top-1/2 -translate-y-1/2"
              aria-label={t(
                confirmPasswordVisible ? 'auth.sign_up.hide_password' : 'auth.sign_up.show_password',
                confirmPasswordVisible ? 'Hide password' : 'Show password',
              )}
              aria-pressed={confirmPasswordVisible}
              onClick={() => setConfirmPasswordVisible((visible) => !visible)}
            >
              {confirmPasswordVisible ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
            </Button>
          </div>
          {form.formState.errors.confirmPassword ? (
            <p id="signup-confirm-error" role="alert" className="text-xs text-error">
              {form.formState.errors.confirmPassword.message}
            </p>
          ) : null}
        </div>
      </div>

      <div className="space-y-3">
        <Button
          type="submit"
          className="w-full"
          disabled={!form.formState.isValid || form.formState.isSubmitting}
        >
          {form.formState.isSubmitting ? (
            <>
              <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
              {t('auth.sign_up.pending', 'Creating account...')}
            </>
          ) : t('auth.sign_up.cta', 'Create account')}
        </Button>

        <div className="grid gap-3 sm:grid-cols-2">
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => {
              void auth.signInWithOAuth('google')
            }}
          >
            {t('auth.google', 'Continue with Google')}
          </Button>

          {githubEnabled ? (
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => {
                void auth.signInWithOAuth('github')
              }}
            >
              {t('auth.github', 'Continue with GitHub')}
            </Button>
          ) : null}
        </div>
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
