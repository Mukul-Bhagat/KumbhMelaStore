import type { ReactNode } from 'react'

import { cn } from '@/shared/lib/cn'

export interface PageShellProps {
  children: ReactNode
  className?: string
}

export function PageShell({ children, className }: PageShellProps) {
  return (
    <main
      id="main-content"
      className={cn('mx-auto w-full max-w-7xl px-4 pb-16 pt-8 sm:px-6 lg:px-8', className)}
    >
      {children}
    </main>
  )
}
