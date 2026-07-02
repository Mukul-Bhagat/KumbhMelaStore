import { routes } from '@/shared/config/routes'

export interface NavigationLink {
  label: string
  href: string
}

export interface NavigationGroup {
  title: string
  links: NavigationLink[]
}

export const site = {
  name: 'KumbhMelaStore',
  devanagari: 'कुंभ मेला स्टोर',
  url: 'https://kumbhmelastore.in',
  domain: 'kumbhmelastore.in',
  description:
    'Premium spiritual ecommerce for heritage-inspired rituals, gifting, and everyday sacred living.',
  tagline:
    'A calm, premium commerce experience shaped by heritage, trust, and timeless design.',
  supportEmail: 'hello@kumbhmelastore.in',
} as const

export const primaryNavigation = [
  { label: 'Home', href: routes.home },
  { label: 'Collections', href: routes.collections },
  { label: 'Categories', href: routes.categories },
  { label: 'About', href: routes.about },
  { label: 'Blog', href: routes.blog },
  { label: 'Contact', href: routes.contact },
] as const

export const shopNavigation = [
  { label: 'Cart', href: routes.cart },
  { label: 'Wishlist', href: routes.wishlist },
  { label: 'Track Order', href: routes.trackOrder },
] as const

export const accountNavigation = [
  { label: 'Dashboard', href: routes.dashboard.home },
  { label: 'Orders', href: routes.dashboard.orders },
  { label: 'Profile', href: routes.dashboard.profile },
  { label: 'Settings', href: routes.dashboard.settings },
] as const

export const legalNavigation = [
  { label: 'Privacy Policy', href: routes.privacyPolicy },
  { label: 'Terms', href: routes.terms },
  { label: 'Refund Policy', href: routes.refundPolicy },
  { label: 'Shipping Policy', href: routes.shippingPolicy },
] as const

export const footerNavigation = [
  {
    title: 'Shop',
    links: [
      { label: 'Collections', href: routes.collections },
      { label: 'Categories', href: routes.categories },
      { label: 'Cart', href: routes.cart },
      { label: 'Wishlist', href: routes.wishlist },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About', href: routes.about },
      { label: 'Contact', href: routes.contact },
      { label: 'Blog', href: routes.blog },
      { label: 'Track Order', href: routes.trackOrder },
    ],
  },
  {
    title: 'Support',
    links: [
      { label: 'Dashboard', href: routes.dashboard.home },
      { label: 'Orders', href: routes.dashboard.orders },
      { label: 'Profile', href: routes.dashboard.profile },
      { label: 'Settings', href: routes.dashboard.settings },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy Policy', href: routes.privacyPolicy },
      { label: 'Terms', href: routes.terms },
      { label: 'Refund Policy', href: routes.refundPolicy },
      { label: 'Shipping Policy', href: routes.shippingPolicy },
    ],
  },
] satisfies NavigationGroup[]

export const dashboardNavigation = [
  { label: 'Overview', href: routes.dashboard.home },
  { label: 'Orders', href: routes.dashboard.orders },
  { label: 'Wishlist', href: routes.wishlist },
  { label: 'Saved Addresses', href: routes.dashboard.profile },
  { label: 'Profile', href: routes.dashboard.profile },
  { label: 'Settings', href: routes.dashboard.settings },
] satisfies NavigationLink[]
