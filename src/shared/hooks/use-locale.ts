import { useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { getAlternateLocale, normalizeLocale, type Locale } from '@/shared/config/locales'
import { swapLocaleInPathname } from '@/shared/lib/locale'
import { setActiveLocale } from '@/shared/lib/locale-state'
import { useUiStore } from '@/shared/stores/ui-store'

export function useLocale() {
  const locale = useUiStore((state) => state.locale)
  return normalizeLocale(locale)
}

export function useLocaleActions() {
  const locale = useLocale()
  const navigate = useNavigate()
  const location = useLocation()
  const setLocale = useUiStore((state) => state.setLocale)

  return useMemo(
    () => ({
      locale,
      alternateLocale: getAlternateLocale(locale),
      setLocale: (nextLocale: Locale) => {
        setLocale(nextLocale)
        setActiveLocale(nextLocale)
        navigate(
          swapLocaleInPathname(location.pathname, nextLocale, location.search, location.hash),
          {
            replace: true,
          },
        )
      },
      toggleLocale: () => {
        const nextLocale = getAlternateLocale(locale)
        setLocale(nextLocale)
        setActiveLocale(nextLocale)
        navigate(
          swapLocaleInPathname(location.pathname, nextLocale, location.search, location.hash),
          { replace: true },
        )
      },
    }),
    [location.hash, location.pathname, location.search, locale, navigate, setLocale],
  )
}
