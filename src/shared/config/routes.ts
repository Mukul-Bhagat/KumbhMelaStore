export const routes = {
  home: '/',
  collections: '/collections',
  collectionDetail: (slug = ':slug') => `/collections/${slug}`,
  categories: '/categories',
  categoryDetail: (slug = ':slug') => `/categories/${slug}`,
  productDetail: (slug = ':slug') => `/products/${slug}`,
  cart: '/cart',
  wishlist: '/wishlist',
  checkout: '/checkout',
  about: '/about',
  contact: '/contact',
  blog: '/blog',
  trackOrder: '/track-order',
  privacyPolicy: '/privacy-policy',
  terms: '/terms',
  refundPolicy: '/refund-policy',
  shippingPolicy: '/shipping-policy',
  auth: {
    signIn: '/auth/sign-in',
    signUp: '/auth/sign-up',
  },
  dashboard: {
    home: '/dashboard',
    orders: '/dashboard/orders',
    profile: '/dashboard/profile',
    settings: '/dashboard/settings',
  },
  notFound: '*',
} as const

export type RoutePath =
  | typeof routes.home
  | typeof routes.collections
  | typeof routes.categories
  | typeof routes.cart
  | typeof routes.wishlist
  | typeof routes.checkout
  | typeof routes.about
  | typeof routes.contact
  | typeof routes.blog
  | typeof routes.trackOrder
  | typeof routes.privacyPolicy
  | typeof routes.terms
  | typeof routes.refundPolicy
  | typeof routes.shippingPolicy
