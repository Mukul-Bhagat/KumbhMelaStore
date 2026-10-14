import type { Json } from '@/shared/types/database'

export type CmsSectionType =
  | 'hero'
  | 'stats'
  | 'collection-grid'
  | 'product-grid'
  | 'feature-grid'
  | 'testimonial-grid'
  | 'blog-grid'
  | 'rich-text'
  | 'cta'
  | 'faq-grid'
  | 'media-split'
  | 'contact-grid'
  | 'announcement'
  | 'empty'

export interface CmsTranslationRecord {
  namespace: string
  translationKey: string
  languageCode: 'hi' | 'en'
  valueText: string | null
  valueJson: Json | null
}

export interface CmsNavigationItem {
  id: string
  labelKey: string
  href: string
  routeType: 'internal' | 'external' | 'action'
  sortOrder: number
  parentId: string | null
}

export interface CmsNavigationMenu {
  id: string
  menuKey: string
  location: 'header' | 'shop' | 'account' | 'admin' | 'footer' | 'legal'
  items: CmsNavigationItem[]
}

export interface CmsFooterSection {
  id: string
  sectionKey: string
  titleKey: string
  sortOrder: number
  links: Array<{
    id: string
    labelKey: string
    href: string
    routeType: 'internal' | 'external' | 'action'
    sortOrder: number
  }>
}

export interface CmsAnnouncement {
  id: string
  announcementKey: string
  variant: 'info' | 'success' | 'warning' | 'premium'
  dismissible: boolean
  startsAt: string | null
  endsAt: string | null
}

export interface CmsPageSection {
  id: string
  sectionKey: string
  sectionType: CmsSectionType
  sortOrder: number
  mediaId: string | null
  payload: Json | null
  eyebrowKey: string | null
  titleKey: string | null
  descriptionKey: string | null
  bodyKey: string | null
  primaryCtaLabelKey: string | null
  primaryCtaHref: string | null
  secondaryCtaLabelKey: string | null
  secondaryCtaHref: string | null
}

export interface CmsPageRecord {
  id: string
  slug: string
  template: 'landing' | 'document' | 'cms' | 'blog' | 'product' | 'collection' | 'category'
  titleKey: string
  descriptionKey: string | null
  seoTitleKey: string | null
  seoDescriptionKey: string | null
  isPublic: boolean
  isActive: boolean
  sortOrder: number
}

export interface CmsPageContent {
  page: CmsPageRecord
  sections: CmsPageSection[]
}

export interface CmsShellContent {
  brand: {
    nameKey: string
    devanagariKey: string
    taglineKey: string
    descriptionKey: string
    supportEmail: string
    url: string
  }
  locales: Array<{
    code: 'hi' | 'en'
    nameKey: string
    nativeNameKey: string
    isDefault: boolean
  }>
  navigation: {
    primary: CmsNavigationMenu | null
    shop: CmsNavigationMenu | null
    account: CmsNavigationMenu | null
    legal: CmsNavigationMenu | null
    admin: CmsNavigationMenu | null
  }
  footer: {
    sections: CmsFooterSection[]
  }
  announcements: CmsAnnouncement[]
  settings: Array<{
    key: string
    value: Json
    isPublic: boolean
  }>
}

export interface TranslationMap {
  hi: Record<string, string | Json>
  en: Record<string, string | Json>
}
