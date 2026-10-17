import { getActiveLocale } from '@/shared/lib/locale-state'
import { buildLocalizedPath } from '@/shared/lib/locale'

export type RoutePath = string

function localized(pathname = '', locale = getActiveLocale()) {
  return buildLocalizedPath(locale, pathname)
}

export const routes = {
  get home() {
    return localized('')
  },
  get collections() {
    return localized('collections')
  },
  get products() {
    return localized('products')
  },
  collectionDetail(slug = ':slug') {
    return localized(`collections/${slug}`)
  },
  get categories() {
    return localized('categories')
  },
  categoryDetail(slug = ':slug') {
    return localized(`categories/${slug}`)
  },
  productDetail(slug = ':slug') {
    return localized(`products/${slug}`)
  },
  product(slug = ':slug') {
    return localized(`product/${slug}`)
  },
  get account() {
    return localized('account')
  },
  get cart() {
    return localized('cart')
  },
  get wishlist() {
    return localized('wishlist')
  },
  get checkout() {
    return localized('checkout')
  },
  get about() {
    return localized('about')
  },
  get contact() {
    return localized('contact')
  },
  get blog() {
    return localized('blog')
  },
  get trackOrder() {
    return localized('track-order')
  },
  get privacyPolicy() {
    return localized('privacy-policy')
  },
  get terms() {
    return localized('terms')
  },
  get refundPolicy() {
    return localized('refund-policy')
  },
  get shippingPolicy() {
    return localized('shipping-policy')
  },
  get faq() {
    return localized('faq')
  },
  auth: {
    get signIn() {
      return localized('auth/sign-in')
    },
    get signUp() {
      return localized('auth/sign-up')
    },
    get forgotPassword() {
      return localized('auth/forgot-password')
    },
    get resetPassword() {
      return '/auth/reset-password'
    },
    get callback() {
      return '/auth/callback'
    },
    get signOut() {
      return localized('auth/sign-out')
    },
  },
  dashboard: {
    get home() {
      return localized('dashboard')
    },
    get orders() {
      return localized('dashboard/orders')
    },
    get profile() {
      return localized('dashboard/profile')
    },
    get settings() {
      return localized('dashboard/settings')
    },
    get addresses() {
      return localized('dashboard/addresses')
    },
  },
  admin: {
    get home() {
      return localized('admin')
    },
    get content() {
      return localized('admin/content')
    },
    get catalog() {
      return localized('admin/catalog')
    },
    get products() {
      return localized('admin/products')
    },
    get orders() {
      return localized('admin/orders')
    },
    get users() {
      return localized('admin/users')
    },
    get settings() {
      return localized('admin/settings')
    },
  },
  neutral: {
    authCallback: '/auth/callback',
    authResetPassword: '/auth/reset-password',
  },
  forLocale(locale: 'hi' | 'en', pathname: string) {
    return buildLocalizedPath(locale, pathname)
  },
} as const
