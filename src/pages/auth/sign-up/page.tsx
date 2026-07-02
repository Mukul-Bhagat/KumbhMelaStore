import { Link } from 'react-router-dom'

import { SignUpForm } from '@/features/auth/ui/sign-up-form'
import { Seo } from '@/components/layout/seo'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { routes } from '@/shared/config/routes'

export function Component() {
  return (
    <div>
      <Seo title="Sign up" description="Create a KumbhMelaStore account." />
      <SignUpForm />
      <Separator />
      <div className="px-6 py-5 text-center text-sm text-muted-foreground sm:px-8">
        Already have an account?{' '}
        <Button asChild variant="link" className="px-0">
          <Link to={routes.auth.signIn}>Sign in</Link>
        </Button>
      </div>
    </div>
  )
}
