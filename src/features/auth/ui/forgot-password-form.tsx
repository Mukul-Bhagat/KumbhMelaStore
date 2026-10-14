import { zodResolver } from '@hookform/resolvers/zod'
import { Mail } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { z } from 'zod'

import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/shared/auth/provider'
import { routes } from '@/shared/config/routes'
import { useLocale } from '@/shared/hooks/use-locale'
import { useTranslate } from '@/shared/cms/hooks'

const forgotPasswordSchema = z.object({
  email: z.string().email('Enter a valid email address.'),
})

type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>

export function ForgotPasswordForm() {
  const auth = useAuth()
  const locale = useLocale()
  const { t } = useTranslate()
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const form = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  })

  const onSubmit = form.handleSubmit(async ({ email }) => {
    setErrorMessage(null)
    setSuccessMessage(null)

    try {
      await auth.requestPasswordReset(email)
      setSuccessMessage(
        t(
          'auth.forgot_password.success',
          'If an account exists for this email, a recovery link has been sent.',
        ),
      )
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to request reset.')
    }
  })

  return (
    <form onSubmit={onSubmit} className="space-y-6 p-6 sm:p-8">
      <div className="space-y-2">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground">
          {t('auth.forgot_password.title', 'Reset your password')}
        </h1>
        <p className="text-sm leading-6 text-muted-foreground">
          {t(
            'auth.forgot_password.description',
            'We’ll email a secure link to create a new password.',
          )}
        </p>
      </div>

      {errorMessage ? (
        <Alert
          title={t('auth.forgot_password.error_title', 'Request failed')}
          description={errorMessage}
          variant="error"
        />
      ) : null}

      {successMessage ? (
        <Alert
          title={t('auth.forgot_password.success_title', 'Recovery email sent')}
          description={successMessage}
          variant="success"
          actions={
            <Button asChild variant="outline">
              <Link to={routes.forLocale(locale, 'auth/sign-in')}>
                {t('auth.back_to_sign_in', 'Back to sign in')}
              </Link>
            </Button>
          }
        />
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="forgot-email">{t('auth.email', 'Email')}</Label>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="forgot-email"
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

      <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
        {t('auth.forgot_password.cta', 'Send recovery link')}
      </Button>
    </form>
  )
}
