import { zodResolver } from '@hookform/resolvers/zod'
import { Lock, Mail, Phone, User } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'

import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/shared/auth/provider'
import { getPublicEnv } from '@/shared/config/env'
import { routes } from '@/shared/config/routes'
import { useLocale } from '@/shared/hooks/use-locale'
import { useTranslate } from '@/shared/cms/hooks'
import { signUpSchema, type SignUpValues } from '@/features/auth/model/schemas'

export function SignUpForm() {
  const auth = useAuth()
  const locale = useLocale()
  const { t } = useTranslate()
  const githubEnabled = getPublicEnv().VITE_ENABLE_GITHUB_OAUTH
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const form = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      fullName: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
    },
  })

  const onSubmit = form.handleSubmit(async (values) => {
    setErrorMessage(null)
    setSuccessMessage(null)

    try {
      await auth.signUpWithPassword({
        email: values.email,
        password: values.password,
        fullName: values.fullName,
        phone: values.phone,
        locale,
      })

      setSuccessMessage(
        t(
          'auth.sign_up.success',
          'Account created. Check your inbox if email confirmation is enabled, or sign in to continue.',
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
      setErrorMessage(error instanceof Error ? error.message : 'Unable to create account.')
    }
  })

  return (
    <form onSubmit={onSubmit} className="space-y-6 p-6 sm:p-8">
      <div className="space-y-2">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground">
          {t('auth.sign_up.title', 'Create your account')}
        </h1>
        <p className="text-sm leading-6 text-muted-foreground">
          {t('auth.sign_up.description', 'Join for faster checkout, order tracking, and premium gifting support.')}
        </p>
      </div>

      {errorMessage ? (
        <Alert
          title={t('auth.sign_up.error_title', 'Sign-up failed')}
          description={errorMessage}
          variant="error"
        />
      ) : null}

      {successMessage ? (
        <Alert
          title={t('auth.sign_up.success_title', 'Account created')}
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
      ) : null}

      <Separator />

      <div className="space-y-2">
        <Label htmlFor="signup-name">{t('auth.full_name', 'Full name')}</Label>
        <div className="relative">
          <User className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="signup-name"
            className="pl-11"
            placeholder={t('auth.full_name_placeholder', 'Mukul Sharma')}
            {...form.register('fullName')}
          />
        </div>
        {form.formState.errors.fullName ? (
          <p className="text-xs text-error">
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
        <Label htmlFor="signup-phone">{t('auth.phone', 'Phone')}</Label>
        <div className="relative">
          <Phone className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="signup-phone"
            type="tel"
            className="pl-11"
            placeholder="+91 98765 43210"
            {...form.register('phone')}
          />
        </div>
        {form.formState.errors.phone ? (
          <p className="text-xs text-error">{form.formState.errors.phone.message}</p>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="signup-password">{t('auth.password', 'Password')}</Label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="signup-password"
              type="password"
              className="pl-11"
              {...form.register('password')}
            />
          </div>
          {form.formState.errors.password ? (
            <p className="text-xs text-error">
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
              type="password"
              className="pl-11"
              {...form.register('confirmPassword')}
            />
          </div>
          {form.formState.errors.confirmPassword ? (
            <p className="text-xs text-error">
              {form.formState.errors.confirmPassword.message}
            </p>
          ) : null}
        </div>
      </div>

      <div className="space-y-3">
        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
          {t('auth.sign_up.cta', 'Create account')}
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
