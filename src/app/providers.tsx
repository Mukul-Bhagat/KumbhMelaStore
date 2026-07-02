import { type PropsWithChildren, useEffect } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'

import { queryClient } from '@/shared/api/query-client'
import { useUiStore } from '@/shared/stores/ui-store'
import { useMounted } from '@/shared/hooks/use-mounted'

function ThemeHydrator() {
  const mounted = useMounted()
  const theme = useUiStore((state) => state.theme)

  useEffect(() => {
    if (!mounted) {
      return
    }

    const root = document.documentElement
    const media = window.matchMedia('(prefers-color-scheme: dark)')

    const applyTheme = () => {
      const resolvedTheme =
        theme === 'system' ? (media.matches ? 'dark' : 'light') : theme

      root.classList.toggle('dark', resolvedTheme === 'dark')
      root.dataset.theme = resolvedTheme
    }

    applyTheme()
    media.addEventListener('change', applyTheme)

    return () => media.removeEventListener('change', applyTheme)
  }, [mounted, theme])

  return null
}

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeHydrator />
      {children}
      <Toaster
        richColors
        position="top-right"
        toastOptions={{
          classNames: {
            toast:
              'rounded-[var(--radius-card)] border border-border bg-card text-card-foreground shadow-[var(--shadow-elevated)]',
            title: 'font-medium text-foreground',
            description: 'text-sm text-muted-foreground',
            closeButton:
              'rounded-full border border-border bg-background text-foreground hover:bg-muted',
            actionButton:
              'rounded-[var(--radius-pill)] bg-primary text-primary-foreground',
            cancelButton:
              'rounded-[var(--radius-pill)] border border-border bg-background text-foreground',
          },
        }}
      />
    </QueryClientProvider>
  )
}
