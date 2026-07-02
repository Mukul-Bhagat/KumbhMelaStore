import { Link } from 'react-router-dom'

import { Seo } from '@/components/layout/seo'
import { ErrorState } from '@/components/ui/error-state'
import { Button } from '@/components/ui/button'
import { routes } from '@/shared/config/routes'

export function Component() {
  return (
    <div className="grid min-h-[70svh] place-items-center">
      <Seo title="404" description="The requested page could not be found." noIndex />
      <ErrorState
        title="We could not find that page"
        description="The link may be outdated or the page may have moved."
        retryLabel="Back to home"
        onRetry={() => {
          window.location.href = routes.home
        }}
        secondaryAction={
          <Button asChild variant="outline">
            <Link to={routes.collections}>Browse collections</Link>
          </Button>
        }
        className="w-full max-w-2xl"
      />
    </div>
  )
}
