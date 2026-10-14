import { defaultLocale, locales } from '@/shared/config/locales'

const siteUrl = import.meta.env.VITE_SITE_URL?.trim() || 'https://kumbhmelastore.in'

export const site = {
  name: 'KumbhMelaStore',
  devanagari: 'कुम्भ मेला स्टोर',
  url: siteUrl,
  domain: new URL(siteUrl).hostname,
  description:
    'Premium spiritual commerce for heritage-inspired rituals, gifting, and elevated daily living.',
  tagline:
    'A calm, premium commerce experience shaped by heritage, trust, and timeless design.',
  supportEmail: 'hello@kumbhmelastore.in',
  brandLogoUrl:
    'https://res.cloudinary.com/dvkyvryei/image/upload/v1783086946/Gemini_Generated_Image_-removebg-preview_qmciii.png',
  footerBackgroundUrl:
    'https://res.cloudinary.com/dvkyvryei/image/upload/v1791968638/Golden_Riverside_Temple_Ghat_Panorama_umq4gq.png',
  defaultLocale,
  locales,
} as const
