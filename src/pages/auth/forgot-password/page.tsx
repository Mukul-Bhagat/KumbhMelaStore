import { ForgotPasswordForm } from '@/features/auth/ui/forgot-password-form'
import { Seo } from '@/components/layout/seo'

export function Component() {
  return (
    <div>
      <Seo
        title="Forgot password"
        description="Request a recovery link for your KumbhMelaStore account."
      />
      <ForgotPasswordForm />
    </div>
  )
}
