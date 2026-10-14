import { zodResolver } from '@hookform/resolvers/zod'
import { Lock } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { z } from 'zod'

import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/shared/auth/provider'
import { routes } from '@/shared/config/routes'
import { useLocale } from '@/shared/hooks/use-locale'
import { useTranslate } from '@/shared/cms/hooks'

const resetPasswordSchema = z
  .object({
    password: z.string().min(8, 'Password must be at least 8 characters.'),
    confirmPassword: z.string().min(8, 'Please confirm your password.'),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  })

type ResetPasswordValues = z.infer<typeof resetPasswordSchema>

export function ResetPasswordForm() {
  const auth = useAuth()
  const locale = useLocale()
  const navigate = useNavigate()
  const { t } = useTranslate()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const form = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  })

  const onSubmit = form.handleSubmit(async ({ password }) => {
    setErrorMessage(null)
    setSuccessMessage(null)

    try {
      await auth.completePasswordReset(password)
      setSuccessMessage(
        t(
          'auth.reset_password.success',
          'Your password has been updated. Redirecting to your dashboard.',
        ),
      )
      navigate(routes.forLocale(locale, 'dashboard'), { replace: true })
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to reset password.')
    }
  })

  return (
    <form onSubmit={onSubmit} className="space-y-6 p-6 sm:p-8">
      <div className="space-y-2">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground">
          {t('auth.reset_password.title', 'Create a new password')}
        </h1>
        <p className="text-sm leading-6 text-muted-foreground">
          {t(
            'auth.reset_password.description',
            'Choose a strong password to secure your account again.',
          )}
        </p>
      </div>

      {errorMessage ? (
        <Alert
          title={t('auth.reset_password.error_title', 'Reset failed')}
          description={errorMessage}
          variant="error"
        />
      ) : null}

      {successMessage ? (
        <Alert
          title={t('auth.reset_password.success_title', 'Password updated')}
          description={successMessage}
          variant="success"
          actions={
            <Button asChild variant="outline">
              <Link to={routes.forLocale(locale, 'dashboard')}>
                {t('auth.go_to_dashboard', 'Go to dashboard')}
              </Link>
            </Button>
          }
        />
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="reset-password">{t('auth.password', 'Password')}</Label>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="reset-password"
            type="password"
            className="pl-11"
            placeholder={t('auth.reset_password.password_placeholder', 'Enter a new password')}
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
        <Label htmlFor="reset-confirm">{t('auth.confirm_password', 'Confirm password')}</Label>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="reset-confirm"
            type="password"
            className="pl-11"
            placeholder={t('auth.reset_password.confirm_placeholder', 'Confirm your password')}
            {...form.register('confirmPassword')}
          />
        </div>
        {form.formState.errors.confirmPassword ? (
          <p className="text-xs text-error">
            {form.formState.errors.confirmPassword.message}
          </p>
        ) : null}
      </div>

      <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
        {t('auth.reset_password.cta', 'Update password')}
      </Button>
    </form>
  )
}
