import { getSupabaseBrowserClient } from '@/shared/api/supabase'
import { normalizeLocale, type Locale } from '@/shared/config/locales'
import {
  cmsPageContentSchema,
  cmsShellContentSchema,
  translationRecordSchema,
} from '@/shared/cms/schemas'
import type { CmsTranslationRecord, TranslationMap } from '@/shared/cms/types'
import type { Json } from '@/shared/types/database'

function sortByOrder<T extends { sortOrder: number }>(items: T[]) {
  return [...items].sort((left, right) => left.sortOrder - right.sortOrder)
}

function jsonToString(value: Json | null | undefined, fallback = '') {
  if (typeof value === 'string') {
    return value
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value)
  }

  return fallback
}

export function buildTranslationMap(records: CmsTranslationRecord[]): TranslationMap {
  return records.reduce<TranslationMap>(
    (acc, record) => {
      const locale = normalizeLocale(record.languageCode)
      acc[locale][record.translationKey] =
        record.valueJson ?? record.valueText ?? record.translationKey
      return acc
    },
    {
      hi: {},
      en: {},
    },
  )
}

export async function fetchTranslations() {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase
    .from('translations')
    .select('namespace, translation_key, language_code, value_text, value_json')
    .eq('is_active', true)
    .order('namespace', { ascending: true })
    .order('translation_key', { ascending: true })
    .order('language_code', { ascending: true })

  if (error) {
    throw error
  }

  return translationRecordSchema
    .array()
    .parse(
      (data ?? []).map((item) => ({
        namespace: item.namespace,
        translationKey: item.translation_key,
        languageCode: item.language_code,
        valueText: item.value_text,
        valueJson: item.value_json,
      })),
    )
}

export async function fetchSiteShell() {
  const supabase = getSupabaseBrowserClient()

  const [
    { data: settings, error: settingsError },
    { data: languages, error: languagesError },
    { data: menus, error: menusError },
    { data: menuItems, error: menuItemsError },
    { data: footerSections, error: footerSectionsError },
    { data: footerLinks, error: footerLinksError },
    { data: announcements, error: announcementsError },
  ] = await Promise.all([
    supabase
      .from('site_settings')
      .select('setting_key, setting_value, is_public')
      .order('sort_order', { ascending: true }),
    supabase
      .from('languages')
      .select('code, name, native_name, content_language, is_default, is_enabled')
      .eq('is_enabled', true)
      .order('sort_order', { ascending: true }),
    supabase
      .from('navigation_menus')
      .select('id, menu_key, location, is_active')
      .eq('is_active', true)
      .order('sort_order', { ascending: true }),
    supabase
      .from('navigation_menu_items')
      .select('id, menu_id, parent_id, label_key, href, route_type, sort_order, is_active')
      .eq('is_active', true)
      .order('sort_order', { ascending: true }),
    supabase
      .from('footer_sections')
      .select('id, section_key, title_key, sort_order, is_active')
      .eq('is_active', true)
      .order('sort_order', { ascending: true }),
    supabase
      .from('footer_links')
      .select('id, section_id, label_key, href, route_type, sort_order, is_active')
      .eq('is_active', true)
      .order('sort_order', { ascending: true }),
    supabase
      .from('announcements')
      .select('id, announcement_key, is_active, dismissible, variant, starts_at, ends_at')
      .eq('is_active', true)
      .order('created_at', { ascending: false }),
  ])

  const firstError =
    settingsError ??
    languagesError ??
    menusError ??
    menuItemsError ??
    footerSectionsError ??
    footerLinksError ??
    announcementsError

  if (firstError) {
    throw firstError
  }

  const navigationMenus = (menus ?? []).map((menu) => ({
    id: menu.id,
    menuKey: menu.menu_key,
    location: menu.location,
    items: sortByOrder(
      (menuItems ?? [])
        .filter((item) => item.menu_id === menu.id)
        .map((item) => ({
          id: item.id,
          labelKey: item.label_key,
          href: item.href,
          routeType: item.route_type,
          sortOrder: item.sort_order,
          parentId: item.parent_id,
        })),
    ),
  }))

  const footerSectionsWithLinks = sortByOrder(
    (footerSections ?? []).map((section) => ({
      id: section.id,
      sectionKey: section.section_key,
      titleKey: section.title_key,
      sortOrder: section.sort_order,
      links: sortByOrder(
        (footerLinks ?? [])
          .filter((link) => link.section_id === section.id)
          .map((link) => ({
            id: link.id,
            labelKey: link.label_key,
            href: link.href,
            routeType: link.route_type,
            sortOrder: link.sort_order,
          })),
      ),
    })),
  )

  return cmsShellContentSchema.parse({
    brand: {
      nameKey: jsonToString(
        (settings ?? []).find((entry) => entry.setting_key === 'brand.name')?.setting_value,
        'brand.name',
      ),
      devanagariKey: jsonToString(
        (settings ?? []).find((entry) => entry.setting_key === 'brand.devanagari')
          ?.setting_value,
        'brand.devanagari',
      ),
      taglineKey: jsonToString(
        (settings ?? []).find((entry) => entry.setting_key === 'brand.tagline')
          ?.setting_value,
        'brand.tagline',
      ),
      descriptionKey: jsonToString(
        (settings ?? []).find((entry) => entry.setting_key === 'brand.description')
          ?.setting_value,
        'brand.description',
      ),
      supportEmail: jsonToString(
        (settings ?? []).find((entry) => entry.setting_key === 'support.email')
          ?.setting_value,
        'hello@kumbhmelastore.in',
      ),
      url: jsonToString(
        (settings ?? []).find((entry) => entry.setting_key === 'site.url')?.setting_value,
        'https://kumbhmelastore.in',
      ),
    },
    locales: (languages ?? []).map((language) => ({
      code: normalizeLocale(language.code),
      nameKey: `language.${language.code}.name`,
      nativeNameKey: `language.${language.code}.native_name`,
      isDefault: language.is_default,
    })),
    navigation: {
      primary: navigationMenus.find((menu) => menu.location === 'header') ?? null,
      shop: navigationMenus.find((menu) => menu.location === 'shop') ?? null,
      account: navigationMenus.find((menu) => menu.location === 'account') ?? null,
      legal: navigationMenus.find((menu) => menu.location === 'legal') ?? null,
      admin: navigationMenus.find((menu) => menu.location === 'admin') ?? null,
    },
    footer: {
      sections: footerSectionsWithLinks,
    },
    announcements: (announcements ?? []).map((announcement) => ({
      id: announcement.id,
      announcementKey: announcement.announcement_key,
      variant: announcement.variant,
      dismissible: announcement.dismissible,
      startsAt: announcement.starts_at,
      endsAt: announcement.ends_at,
    })),
    settings: (settings ?? []).map((entry) => ({
      key: entry.setting_key,
      value: entry.setting_value,
      isPublic: entry.is_public,
    })),
  })
}

export async function fetchPageContent(slug: string) {
  const supabase = getSupabaseBrowserClient()

  const { data: page, error: pageError } = await supabase
    .from('pages')
    .select(
      'id, slug, template, title_key, description_key, seo_title_key, seo_description_key, is_public, is_active, sort_order',
    )
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle()

  if (pageError) {
    throw pageError
  }

  if (!page) {
    return null
  }

  const { data: sections, error: sectionsError } = await supabase
    .from('page_sections')
    .select(
      'id, page_id, section_key, section_type, sort_order, is_active, media_id, payload, eyebrow_key, title_key, description_key, body_key, primary_cta_label_key, primary_cta_href, secondary_cta_label_key, secondary_cta_href',
    )
    .eq('page_id', page.id)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  if (sectionsError) {
    throw sectionsError
  }

  return cmsPageContentSchema.parse({
    page: {
      id: page.id,
      slug: page.slug,
      template: page.template,
      titleKey: page.title_key,
      descriptionKey: page.description_key,
      seoTitleKey: page.seo_title_key,
      seoDescriptionKey: page.seo_description_key,
      isPublic: page.is_public,
      isActive: page.is_active,
      sortOrder: page.sort_order,
    },
    sections: sortByOrder(
      (sections ?? []).map((section) => ({
        id: section.id,
        sectionKey: section.section_key,
        sectionType: section.section_type,
        sortOrder: section.sort_order,
        mediaId: section.media_id,
        payload: section.payload,
        eyebrowKey: section.eyebrow_key,
        titleKey: section.title_key,
        descriptionKey: section.description_key,
        bodyKey: section.body_key,
        primaryCtaLabelKey: section.primary_cta_label_key,
        primaryCtaHref: section.primary_cta_href,
        secondaryCtaLabelKey: section.secondary_cta_label_key,
        secondaryCtaHref: section.secondary_cta_href,
      })),
    ),
  })
}

export async function fetchPublicOrderTracking(input: {
  orderNumber: string
  email?: string | undefined
  phone?: string | undefined
  trackingCode?: string | undefined
}) {
  const supabase = getSupabaseBrowserClient()

  const { data, error } = await supabase.rpc('get_public_order_tracking', {
    p_order_number: input.orderNumber,
    p_email: input.email ?? null,
    p_phone: input.phone ?? null,
    p_tracking_code: input.trackingCode ?? null,
  })

  if (error) {
    throw error
  }

  return data as Json
}

export function preloadLocaleBundle(locale: Locale) {
  normalizeLocale(locale)
  return Promise.all([fetchTranslations(), fetchSiteShell()])
}
