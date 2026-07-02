import { Component, type ErrorInfo, type ReactNode } from 'react'

import { Button } from '@/components/ui/button'
import { ErrorState } from '@/components/ui/error-state'

interface AppErrorBoundaryProps {
  children: ReactNode
}

interface AppErrorBoundaryState {
  hasError: boolean
}

export class AppErrorBoundary extends Component<
  AppErrorBoundaryProps,
  AppErrorBoundaryState
> {
  override state: AppErrorBoundaryState = {
    hasError: false,
  }

  static getDerivedStateFromError(): AppErrorBoundaryState {
    return { hasError: true }
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('App error boundary caught an error', error, info)
  }

  override render() {
    if (this.state.hasError) {
      return (
        <div className="grid min-h-screen place-items-center px-4 py-10">
          <ErrorState
            title="The storefront needs a restart"
            description="A rendering error occurred while building the premium shopping experience."
            retryLabel="Reload the app"
            onRetry={() => window.location.reload()}
            secondaryAction={
              <Button asChild variant="outline">
                <a href="/">Go to home</a>
              </Button>
            }
            className="w-full max-w-2xl"
          />
        </div>
      )
    }

    return this.props.children
  }
}
