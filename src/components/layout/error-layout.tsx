import { useRouteError } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { ErrorState } from '@/components/ui/error-state'
import { PageShell } from '@/components/layout/page-shell'

export function ErrorLayout() {
  const error = useRouteError()
  const message =
    error instanceof Error ? error.message : 'The page could not be loaded.'

  return (
    <PageShell className="grid min-h-[100svh] place-items-center py-12">
      <ErrorState
        title="We could not complete that request"
        description={message}
        retryLabel="Return home"
        onRetry={() => {
          window.location.href = '/'
        }}
        secondaryAction={
          <Button asChild variant="outline">
            <a href="mailto:hello@kumbhmelastore.in">Contact support</a>
          </Button>
        }
        className="w-full max-w-2xl"
      />
    </PageShell>
  )
}
