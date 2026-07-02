import { Link } from 'react-router-dom'

import { SignInForm } from '@/features/auth/ui/sign-in-form'
import { Seo } from '@/components/layout/seo'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { routes } from '@/shared/config/routes'

export function Component() {
  return (
    <div>
      <Seo title="Sign in" description="Sign in to your KumbhMelaStore account." />
      <SignInForm />
      <Separator />
      <div className="px-6 py-5 text-center text-sm text-muted-foreground sm:px-8">
        Don’t have an account?{' '}
        <Button asChild variant="link" className="px-0">
          <Link to={routes.auth.signUp}>Create one</Link>
        </Button>
      </div>
    </div>
  )
}
