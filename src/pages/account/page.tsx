import { Navigate, useLocation } from 'react-router-dom'

import { getLocaleFromPathname } from '@/shared/lib/locale'
import { routes } from '@/shared/config/routes'

export function Component() {
  const location = useLocation()
  const locale = getLocaleFromPathname(location.pathname)

  return (
    <Navigate
      replace
      to={routes.forLocale(locale, 'auth/sign-in')}
      state={location.state}
    />
  )
}
