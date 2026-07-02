import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Outlet, useLocation, useNavigation } from 'react-router-dom'
import { useEffect } from 'react'

import { SkipLink } from '@/components/layout/skip-link'
import { LoadingScreen } from '@/components/layout/loading-screen'

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
        <div className="fixed inset-0 z-50 bg-background/85 backdrop-blur-xl">
          <LoadingScreen className="h-full min-h-screen" />
        </div>
      ) : null}
      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduceMotion ? { opacity: 1 } : { opacity: 0, y: -12 }}
          transition={{ duration: reduceMotion ? 0 : 0.35, ease: 'easeOut' }}
        >
          <Outlet />
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
