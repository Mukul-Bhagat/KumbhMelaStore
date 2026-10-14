import { type PropsWithChildren, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Navigate, Outlet, useLocation, useParams } from 'react-router-dom'

import { defaultLocale, isLocale, localeMeta } from '@/shared/config/locales'
import { queryKeys } from '@/shared/api/keys'
import { fetchSiteShell, fetchTranslations } from '@/shared/cms/repository'
import { setActiveLocale } from '@/shared/lib/locale-state'
import { swapLocaleInPathname } from '@/shared/lib/locale'
import { useUiStore } from '@/shared/stores/ui-store'

export function LocaleLayout({ children }: PropsWithChildren) {
  const { locale: localeParam } = useParams()
  const location = useLocation()
  const queryClient = useQueryClient()
  const setLocale = useUiStore((state) => state.setLocale)
  const isValidLocale = isLocale(localeParam)
  const locale = isValidLocale ? localeParam : defaultLocale

  useEffect(() => {
    if (!isValidLocale) {
      return
    }

    setActiveLocale(locale)
    setLocale(locale)
    document.documentElement.lang = localeMeta(locale).htmlLang
    document.documentElement.dir = 'ltr'
    document.documentElement.dataset.locale = locale

    void Promise.all([
      queryClient.prefetchQuery({
        queryKey: queryKeys.translations,
        queryFn: fetchTranslations,
      }),
      queryClient.prefetchQuery({
        queryKey: queryKeys.shell.detail(locale),
        queryFn: fetchSiteShell,
      }),
      queryClient.prefetchQuery({
        queryKey: queryKeys.shell.detail(locale === 'hi' ? 'en' : 'hi'),
        queryFn: fetchSiteShell,
      }),
    ])
  }, [isValidLocale, locale, queryClient, setLocale])

  if (!isValidLocale) {
    return (
      <Navigate
        replace
        to={swapLocaleInPathname(location.pathname, defaultLocale, location.search, location.hash)}
      />
    )
  }

  if (children) {
    return <>{children}</>
  }

  return <Outlet />
}
