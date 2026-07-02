import { motion } from 'framer-motion'

import { BrandMark } from '@/components/brand/brand-mark'
import { cn } from '@/shared/lib/cn'

export interface LoadingScreenProps {
  className?: string
}

export function LoadingScreen({ className }: LoadingScreenProps) {
  return (
    <div
      className={cn(
        'grid min-h-[100svh] place-items-center px-6 py-10',
        className,
      )}
    >
      <div className="flex w-full max-w-md flex-col items-center gap-6 rounded-[var(--radius-card)] border border-border bg-card px-6 py-10 text-center shadow-[var(--shadow-elevated)]">
        <BrandMark size="lg" />
        <div className="space-y-2">
          <p className="font-display text-3xl font-semibold tracking-tight text-foreground">
            Preparing your space
          </p>
          <p className="text-sm leading-6 text-muted-foreground">
            Building the calm, premium shopping experience for KumbhMelaStore.
          </p>
        </div>
        <motion.div
          aria-hidden="true"
          className="h-1.5 w-40 overflow-hidden rounded-[var(--radius-pill)] bg-muted"
          initial={{ opacity: 0.7 }}
          animate={{ opacity: 1 }}
          transition={{ repeat: Infinity, repeatType: 'mirror', duration: 1.2 }}
        >
          <motion.div
            className="h-full w-1/2 rounded-[var(--radius-pill)] bg-primary"
            animate={{ x: ['0%', '100%'] }}
            transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
          />
        </motion.div>
      </div>
    </div>
  )
}
