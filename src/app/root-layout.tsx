import { useReducedMotion } from 'framer-motion'
import { Outlet, useLocation, useNavigation } from 'react-router-dom'
import { useEffect } from 'react'

import { SkipLink } from '@/components/layout/skip-link'

export function RootLayout() {
  const location = useLocation()
  const reduceMotion = useReducedMotion()
  const navigation = useNavigation()

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' })
  }, [location.pathname, reduceMotion])

  return (
    <div className="relative min-h-screen">
      <SkipLink />
      {navigation.state !== 'idle' ? (
        <div
          aria-label="Loading page"
          aria-live="polite"
          className="fixed inset-x-0 top-0 z-50 h-0.5 overflow-hidden bg-primary/20"
        >
          <div className="h-full w-full animate-pulse bg-primary" />
        </div>
      ) : null}
      <Outlet />
    </div>
  )
}
