import { useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'

import { LoadingScreen } from '@/components/layout/loading-screen'
import { SectionHeading } from '@/components/layout/section-heading'
import { Seo } from '@/components/layout/seo'
import { Badge } from '@/components/ui/badge'
import { ErrorState } from '@/components/ui/error-state'
import { AdminResourcePanel, type CrudField } from '@/features/admin/ui/admin-resource-panel'
import { queryKeys } from '@/shared/api/keys'
import { getSupabaseBrowserClient } from '@/shared/api/supabase'
import type { Database, Json } from '@/shared/types/database'

type PageRow = Database['public']['Tables']['pages']['Row']
type PageSectionRow = Database['public']['Tables']['page_sections']['Row']
type TranslationRow = Database['public']['Tables']['translations']['Row']
type AnnouncementRow = Database['public']['Tables']['announcements']['Row']
type SiteContentRow = Database['public']['Tables']['site_content']['Row']
type BlogRow = Database['public']['Tables']['blogs']['Row']
type FaqRow = Database['public']['Tables']['faqs']['Row']
type PolicyRow = Database['public']['Tables']['policies']['Row']
type HeroSlideRow = Database['public']['Tables']['hero_slides']['Row']
type MediaRow = Database['public']['Tables']['media']['Row']

type ContentWorkspace = {
  pages: PageRow[]
  sections: PageSectionRow[]
  translations: TranslationRow[]
  announcements: AnnouncementRow[]
  siteContent: SiteContentRow[]
  blogs: BlogRow[]
  faqs: FaqRow[]
  policies: PolicyRow[]
  heroSlides: HeroSlideRow[]
  media: MediaRow[]
}

async function fetchContentWorkspace(): Promise<ContentWorkspace> {
  const supabase = getSupabaseBrowserClient()
  const [pages, sections, translations, announcements, siteContent, blogs, faqs, policies, heroSlides, media] = await Promise.all([
    supabase
      .from('pages')
      .select('id, slug, template, title_key, description_key, seo_title_key, seo_description_key, is_public, is_active, sort_order, created_at, updated_at')
      .order('sort_order', { ascending: true }),
    supabase
      .from('page_sections')
      .select('id, page_id, section_key, section_type, sort_order, is_active, media_id, payload, eyebrow_key, title_key, description_key, body_key, primary_cta_label_key, primary_cta_href, secondary_cta_label_key, secondary_cta_href, created_at, updated_at')
      .order('sort_order', { ascending: true }),
    supabase
      .from('translations')
      .select('id, namespace, translation_key, language_code, value_text, value_json, is_active, created_at, updated_at')
      .order('namespace', { ascending: true })
      .limit(1000),
    supabase
      .from('announcements')
      .select('id, announcement_key, is_active, dismissible, variant, starts_at, ends_at, created_at, updated_at')
      .order('created_at', { ascending: false }),
    supabase
      .from('site_content')
      .select('id, content_key, content_type, sort_order, is_active, payload, created_at, updated_at')
      .order('sort_order', { ascending: true }),
    supabase
      .from('blogs')
      .select('id, slug, author_id, cover_media_id, reading_time_minutes, is_featured, published_at, is_active, sort_order, created_at, updated_at')
      .order('sort_order', { ascending: true }),
    supabase
      .from('faqs')
      .select('id, faq_key, faq_group, sort_order, is_active, created_at, updated_at')
      .order('faq_group', { ascending: true })
      .order('sort_order', { ascending: true }),
    supabase
      .from('policies')
      .select('id, slug, policy_type, title_key, body_key, seo_title_key, seo_description_key, published_at, is_active, sort_order, created_at, updated_at')
      .order('sort_order', { ascending: true }),
    supabase
      .from('hero_slides')
      .select('id, slide_key, media_id, is_active, sort_order, payload, created_at, updated_at')
      .order('sort_order', { ascending: true }),
    supabase
      .from('media')
      .select('id, provider, public_id, secure_url, alt_text, blur_data_url, width, height, format, metadata, is_public, created_by, created_at, updated_at')
      .order('created_at', { ascending: false }),
  ])
  const error =
    pages.error ??
    sections.error ??
    translations.error ??
    announcements.error ??
    siteContent.error ??
    blogs.error ??
    faqs.error ??
    policies.error ??
    heroSlides.error ??
    media.error
  if (error) throw error
  return {
    pages: pages.data ?? [],
    sections: sections.data ?? [],
    translations: translations.data ?? [],
    announcements: announcements.data ?? [],
    siteContent: siteContent.data ?? [],
    blogs: blogs.data ?? [],
    faqs: faqs.data ?? [],
    policies: policies.data ?? [],
    heroSlides: heroSlides.data ?? [],
    media: media.data ?? [],
  }
}

function requiredText(values: Record<string, unknown>, name: string) {
  const value = values[name]
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`${name} is required.`)
  }
  return value.trim()
}

function optionalText(values: Record<string, unknown>, name: string) {
  const value = values[name]
  if (value == null || value === '') return null
  if (typeof value !== 'string') throw new Error(`${name} must be text.`)
  return value.trim() || null
}

function booleanValue(values: Record<string, unknown>, name: string) {
  const value = values[name]
  if (typeof value !== 'boolean') throw new Error(`${name} must be true or false.`)
  return value
}

function numberValue(values: Record<string, unknown>, name: string) {
  const value = values[name]
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`${name} must be a valid number.`)
  }
  return value
}

function nullableNumber(values: Record<string, unknown>, name: string) {
  const value = values[name]
  if (value == null) return null
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`${name} must be a valid number.`)
  }
  return value
}

function optionalId(values: Record<string, unknown>, name: string) {
  const value = optionalText(values, name)
  if (value == null) return null
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) {
    throw new Error(`${name} must be a valid record selection.`)
  }
  return value
}

function isJsonValue(value: unknown): value is Json {
  if (value === null || ['string', 'number', 'boolean'].includes(typeof value)) return true
  if (Array.isArray(value)) return value.every(isJsonValue)
  return typeof value === 'object' && Object.values(value).every(isJsonValue)
}

function jsonValue(values: Record<string, unknown>, name: string): Json | null {
  const value = values[name]
  if (value == null) return null
  if (!isJsonValue(value)) throw new Error(`${name} must be valid JSON.`)
  return value
}

function dateValue(values: Record<string, unknown>, name: string) {
  const value = optionalText(values, name)
  if (value && Number.isNaN(Date.parse(value))) {
    throw new Error(`${name} must be a valid date/time, preferably ISO-8601.`)
  }
  return value
}

const pageFields: CrudField[] = [
  { name: 'title_key', label: 'Title translation key', type: 'text', required: true, nullable: false },
  { name: 'description_key', label: 'Description translation key', type: 'text' },
  { name: 'seo_title_key', label: 'SEO title translation key', type: 'text' },
  { name: 'seo_description_key', label: 'SEO description translation key', type: 'text' },
  { name: 'sort_order', label: 'Sort order', type: 'number', nullable: false, defaultValue: 0 },
  { name: 'is_public', label: 'Public page', type: 'boolean', defaultValue: true },
  { name: 'is_active', label: 'Active', type: 'boolean', defaultValue: true },
]

const translationFields: CrudField[] = [
  { name: 'namespace', label: 'Namespace', type: 'text', required: true, nullable: false },
  { name: 'translation_key', label: 'Translation key', type: 'text', required: true, nullable: false },
  {
    name: 'language_code',
    label: 'Language',
    type: 'select',
    required: true,
    nullable: false,
    options: [
      { label: 'Hindi', value: 'hi' },
      { label: 'English', value: 'en' },
    ],
  },
  { name: 'value_text', label: 'Text value', type: 'textarea' },
  { name: 'value_json', label: 'JSON value', type: 'json' },
  { name: 'is_active', label: 'Active', type: 'boolean', defaultValue: true },
]

const announcementFields: CrudField[] = [
  { name: 'announcement_key', label: 'Announcement translation key', type: 'text', required: true, nullable: false },
  {
    name: 'variant',
    label: 'Style',
    type: 'select',
    required: true,
    nullable: false,
    defaultValue: 'info',
    options: ['info', 'success', 'warning', 'premium'].map((value) => ({ label: value, value })),
  },
  { name: 'starts_at', label: 'Starts at (ISO-8601)', type: 'text', placeholder: '2026-07-11T09:00:00Z' },
  { name: 'ends_at', label: 'Ends at (ISO-8601)', type: 'text', placeholder: '2026-07-12T09:00:00Z' },
  { name: 'dismissible', label: 'Dismissible', type: 'boolean', defaultValue: true },
  { name: 'is_active', label: 'Active', type: 'boolean', defaultValue: true },
]

const siteContentFields: CrudField[] = [
  { name: 'content_key', label: 'Content key', type: 'text', required: true, nullable: false },
  {
    name: 'content_type',
    label: 'Content type',
    type: 'select',
    required: true,
    nullable: false,
    options: ['text', 'rich_text', 'cta', 'card', 'grid', 'quote', 'stats', 'media'].map((value) => ({ label: value, value })),
  },
  { name: 'sort_order', label: 'Sort order', type: 'number', nullable: false, defaultValue: 0 },
  { name: 'payload', label: 'Payload (JSON)', type: 'json' },
  { name: 'is_active', label: 'Active', type: 'boolean', defaultValue: true },
]

const blogFields: CrudField[] = [
  { name: 'slug', label: 'Slug', type: 'text', required: true, nullable: false },
  { name: 'cover_media_id', label: 'Cover image', type: 'select' },
  { name: 'reading_time_minutes', label: 'Reading time (minutes)', type: 'number' },
  { name: 'published_at', label: 'Published at (ISO-8601)', type: 'text', placeholder: '2026-07-11T09:00:00Z' },
  { name: 'sort_order', label: 'Sort order', type: 'number', nullable: false, defaultValue: 0 },
  { name: 'is_featured', label: 'Featured', type: 'boolean' },
  { name: 'is_active', label: 'Active', type: 'boolean', defaultValue: true },
]

const faqFields: CrudField[] = [
  { name: 'faq_key', label: 'FAQ translation key', type: 'text', required: true, nullable: false },
  { name: 'faq_group', label: 'Group', type: 'text', required: true, nullable: false },
  { name: 'sort_order', label: 'Sort order', type: 'number', nullable: false, defaultValue: 0 },
  { name: 'is_active', label: 'Active', type: 'boolean', defaultValue: true },
]

const policyFields: CrudField[] = [
  { name: 'slug', label: 'Slug', type: 'text', required: true, nullable: false },
  {
    name: 'policy_type',
    label: 'Policy type',
    type: 'select',
    required: true,
    nullable: false,
    options: ['privacy', 'terms', 'refund', 'shipping', 'custom'].map((value) => ({ label: value, value })),
  },
  { name: 'title_key', label: 'Title translation key', type: 'text', required: true, nullable: false },
  { name: 'body_key', label: 'Body translation key', type: 'text', required: true, nullable: false },
  { name: 'seo_title_key', label: 'SEO title translation key', type: 'text' },
  { name: 'seo_description_key', label: 'SEO description translation key', type: 'text' },
  { name: 'published_at', label: 'Published at (ISO-8601)', type: 'text', placeholder: '2026-07-11T09:00:00Z' },
  { name: 'sort_order', label: 'Sort order', type: 'number', nullable: false, defaultValue: 0 },
  { name: 'is_active', label: 'Active', type: 'boolean', defaultValue: true },
]

const heroSlideFields: CrudField[] = [
  { name: 'slide_key', label: 'Slide key', type: 'text', required: true, nullable: false },
  { name: 'media_id', label: 'Image from media library', type: 'select' },
  { name: 'sort_order', label: 'Sort order', type: 'number', nullable: false, defaultValue: 0 },
  { name: 'payload', label: 'Slide payload (JSON)', type: 'json' },
  { name: 'is_active', label: 'Active', type: 'boolean', defaultValue: true },
]

export function Component() {
  const queryClient = useQueryClient()
  const workspace = useQuery({
    queryKey: queryKeys.admin.content,
    queryFn: fetchContentWorkspace,
  })
  const pageOptions = useMemo(
    () => (workspace.data?.pages ?? []).map((page) => ({ label: `${page.slug} · ${page.title_key}`, value: page.id })),
    [workspace.data?.pages],
  )
  const sectionFields = useMemo<CrudField[]>(
    () => [
      {
        name: 'page_id',
        label: 'Page',
        type: 'select',
        required: true,
        nullable: false,
        options: pageOptions,
      },
      { name: 'section_key', label: 'Section key', type: 'text', required: true, nullable: false },
      {
        name: 'section_type',
        label: 'Section type',
        type: 'select',
        required: true,
        nullable: false,
        options: ['hero', 'stats', 'collection-grid', 'product-grid', 'feature-grid', 'testimonial-grid', 'blog-grid', 'rich-text', 'cta', 'faq-grid', 'media-split', 'contact-grid', 'announcement', 'empty'].map((value) => ({ label: value, value })),
      },
      { name: 'media_id', label: 'Image from media library', type: 'select' },
      { name: 'sort_order', label: 'Sort order', type: 'number', nullable: false, defaultValue: 0 },
      { name: 'eyebrow_key', label: 'Eyebrow translation key', type: 'text' },
      { name: 'title_key', label: 'Title translation key', type: 'text' },
      { name: 'description_key', label: 'Description translation key', type: 'text' },
      { name: 'body_key', label: 'Body translation key', type: 'text' },
      { name: 'primary_cta_label_key', label: 'Primary CTA label key', type: 'text' },
      { name: 'primary_cta_href', label: 'Primary CTA link', type: 'text' },
      { name: 'secondary_cta_label_key', label: 'Secondary CTA label key', type: 'text' },
      { name: 'secondary_cta_href', label: 'Secondary CTA link', type: 'text' },
      { name: 'payload', label: 'Section payload (JSON)', type: 'json' },
      { name: 'is_active', label: 'Active', type: 'boolean', defaultValue: true },
    ],
    [pageOptions],
  )
  const mediaOptions = useMemo(
    () => [
      { label: 'No image', value: '' },
      ...(workspace.data?.media ?? []).map((item) => ({
        label: item.alt_text || item.public_id || item.secure_url,
        value: item.id,
      })),
    ],
    [workspace.data?.media],
  )
  const blogFieldsWithMedia = blogFields.map((field) =>
    field.name === 'cover_media_id' ? { ...field, options: mediaOptions } : field,
  )
  const sectionFieldsWithMedia = sectionFields.map((field) =>
    field.name === 'media_id' ? { ...field, options: mediaOptions } : field,
  )
  const heroSlideFieldsWithMedia = heroSlideFields.map((field) =>
    field.name === 'media_id' ? { ...field, options: mediaOptions } : field,
  )
  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.admin.content })
    void queryClient.invalidateQueries({ queryKey: queryKeys.translations })
    void queryClient.invalidateQueries({ queryKey: queryKeys.shell.all })
    void queryClient.invalidateQueries({ queryKey: queryKeys.pages.all })
  }

  if (workspace.isLoading) {
    return <LoadingScreen className="min-h-[70svh]" />
  }

  if (workspace.error) {
    return (
      <main className="container space-y-8 py-10">
        <Seo title="Content" />
        <ErrorState
          title="Content records could not be loaded"
          description={workspace.error instanceof Error ? workspace.error.message : 'Supabase could not return the CMS records.'}
          onRetry={() => void workspace.refetch()}
        />
      </main>
    )
  }

  return (
    <main className="container space-y-8 py-10">
      <Seo title="Content" />
      <SectionHeading
        eyebrow="Super Admin"
        title="Content management"
        description="Edit the live CMS pages, page sections, translations, announcements, and structured site content. Public visibility is controlled by the active/public fields and database policies."
      />
      <AdminResourcePanel<PageRow>
        title="Pages"
        description="Edit existing page metadata and publication visibility. Route slugs and templates stay fixed so content edits cannot break application routing."
        rows={workspace.data?.pages ?? []}
        fields={pageFields}
        rowKey="id"
        columns={[
          { label: 'Page', render: (row) => <span className="font-semibold">{row.slug}</span> },
          { label: 'Template', render: (row) => row.template },
          { label: 'Title key', render: (row) => row.title_key },
          { label: 'Visibility', render: (row) => <Badge variant={row.is_active && row.is_public ? 'success' : 'muted'}>{row.is_active && row.is_public ? 'Published' : 'Hidden'}</Badge> },
        ]}
        onUpdate={async (row, values) => {
          const { error } = await getSupabaseBrowserClient().from('pages').update({
            title_key: requiredText(values, 'title_key'),
            description_key: optionalText(values, 'description_key'),
            seo_title_key: optionalText(values, 'seo_title_key'),
            seo_description_key: optionalText(values, 'seo_description_key'),
            sort_order: numberValue(values, 'sort_order'),
            is_public: booleanValue(values, 'is_public'),
            is_active: booleanValue(values, 'is_active'),
          }).eq('id', row.id)
          if (error) throw error
        }}
        onRefresh={refresh}
      />
      <AdminResourcePanel<PageSectionRow>
        title="Page sections"
        description="Manage section order, active state, translation keys, CTA links, and JSON section payloads."
        rows={workspace.data?.sections ?? []}
        fields={sectionFieldsWithMedia}
        rowKey="id"
        createLabel="Add section"
        canCreate={pageOptions.length > 0}
        columns={[
          { label: 'Section', render: (row) => <span className="font-semibold">{row.section_key}</span> },
          { label: 'Page', render: (row) => workspace.data?.pages.find((page) => page.id === row.page_id)?.slug ?? row.page_id },
          { label: 'Type', render: (row) => row.section_type },
          { label: 'Order', render: (row) => row.sort_order },
          { label: 'State', render: (row) => <Badge variant={row.is_active ? 'success' : 'muted'}>{row.is_active ? 'Active' : 'Inactive'}</Badge> },
        ]}
        onCreate={async (values) => {
          const sectionType = requiredText(values, 'section_type')
          if (!sectionFields.find((field) => field.name === 'section_type')?.options?.some((option) => option.value === sectionType)) throw new Error('Select a valid section type.')
          const { error } = await getSupabaseBrowserClient().from('page_sections').insert({
            page_id: requiredText(values, 'page_id'),
            section_key: requiredText(values, 'section_key'),
            section_type: sectionType as PageSectionRow['section_type'],
            media_id: optionalId(values, 'media_id'),
            sort_order: numberValue(values, 'sort_order'),
            is_active: booleanValue(values, 'is_active'),
            payload: jsonValue(values, 'payload'),
            eyebrow_key: optionalText(values, 'eyebrow_key'),
            title_key: optionalText(values, 'title_key'),
            description_key: optionalText(values, 'description_key'),
            body_key: optionalText(values, 'body_key'),
            primary_cta_label_key: optionalText(values, 'primary_cta_label_key'),
            primary_cta_href: optionalText(values, 'primary_cta_href'),
            secondary_cta_label_key: optionalText(values, 'secondary_cta_label_key'),
            secondary_cta_href: optionalText(values, 'secondary_cta_href'),
          })
          if (error) throw error
        }}
        onUpdate={async (row, values) => {
          const sectionType = requiredText(values, 'section_type')
          if (!sectionFields.find((field) => field.name === 'section_type')?.options?.some((option) => option.value === sectionType)) throw new Error('Select a valid section type.')
          const { error } = await getSupabaseBrowserClient().from('page_sections').update({
            page_id: requiredText(values, 'page_id'),
            section_key: requiredText(values, 'section_key'),
            section_type: sectionType as PageSectionRow['section_type'],
            media_id: optionalId(values, 'media_id'),
            sort_order: numberValue(values, 'sort_order'),
            is_active: booleanValue(values, 'is_active'),
            payload: jsonValue(values, 'payload'),
            eyebrow_key: optionalText(values, 'eyebrow_key'),
            title_key: optionalText(values, 'title_key'),
            description_key: optionalText(values, 'description_key'),
            body_key: optionalText(values, 'body_key'),
            primary_cta_label_key: optionalText(values, 'primary_cta_label_key'),
            primary_cta_href: optionalText(values, 'primary_cta_href'),
            secondary_cta_label_key: optionalText(values, 'secondary_cta_label_key'),
            secondary_cta_href: optionalText(values, 'secondary_cta_href'),
          }).eq('id', row.id)
          if (error) throw error
        }}
        onDelete={async (row) => {
          const { error } = await getSupabaseBrowserClient().from('page_sections').delete().eq('id', row.id)
          if (error) throw error
        }}
        onRefresh={refresh}
      />
      <AdminResourcePanel<TranslationRow>
        title="Translations"
        description={`Maintain up to 1,000 English and Hindi text/JSON values referenced by CMS translation keys. ${workspace.data?.translations.length ?? 0} loaded.`}
        rows={workspace.data?.translations ?? []}
        fields={translationFields}
        rowKey="id"
        createLabel="Add translation"
        columns={[
          { label: 'Key', render: (row) => <span className="font-semibold">{row.namespace}.{row.translation_key}</span> },
          { label: 'Language', render: (row) => row.language_code.toUpperCase() },
          { label: 'Value', render: (row) => <span className="line-clamp-2">{row.value_text ?? (row.value_json ? JSON.stringify(row.value_json) : '—')}</span> },
          { label: 'State', render: (row) => <Badge variant={row.is_active ? 'success' : 'muted'}>{row.is_active ? 'Active' : 'Inactive'}</Badge> },
        ]}
        onCreate={async (values) => {
          const languageCode = requiredText(values, 'language_code')
          if (languageCode !== 'hi' && languageCode !== 'en') throw new Error('Select Hindi or English.')
          const valueText = optionalText(values, 'value_text')
          const valueJson = jsonValue(values, 'value_json')
          if (valueText == null && valueJson == null) throw new Error('Enter a text value or a JSON value.')
          const { error } = await getSupabaseBrowserClient().from('translations').insert({
            namespace: requiredText(values, 'namespace'),
            translation_key: requiredText(values, 'translation_key'),
            language_code: languageCode,
            value_text: valueText,
            value_json: valueJson,
            is_active: booleanValue(values, 'is_active'),
          })
          if (error) throw error
        }}
        onUpdate={async (row, values) => {
          const languageCode = requiredText(values, 'language_code')
          if (languageCode !== 'hi' && languageCode !== 'en') throw new Error('Select Hindi or English.')
          const valueText = optionalText(values, 'value_text')
          const valueJson = jsonValue(values, 'value_json')
          if (valueText == null && valueJson == null) throw new Error('Enter a text value or a JSON value.')
          const { error } = await getSupabaseBrowserClient().from('translations').update({
            namespace: requiredText(values, 'namespace'),
            translation_key: requiredText(values, 'translation_key'),
            language_code: languageCode,
            value_text: valueText,
            value_json: valueJson,
            is_active: booleanValue(values, 'is_active'),
          }).eq('id', row.id)
          if (error) throw error
        }}
        onDelete={async (row) => {
          const { error } = await getSupabaseBrowserClient().from('translations').delete().eq('id', row.id)
          if (error) throw error
        }}
        onRefresh={refresh}
      />
      <AdminResourcePanel<AnnouncementRow>
        title="Announcements"
        description="Schedule announcement banners by translation key, variant, and active window."
        rows={workspace.data?.announcements ?? []}
        fields={announcementFields}
        rowKey="id"
        createLabel="Add announcement"
        columns={[
          { label: 'Key', render: (row) => row.announcement_key },
          { label: 'Style', render: (row) => row.variant },
          { label: 'Window', render: (row) => `${row.starts_at ?? 'Immediate'} – ${row.ends_at ?? 'No end'}` },
          { label: 'State', render: (row) => <Badge variant={row.is_active ? 'success' : 'muted'}>{row.is_active ? 'Active' : 'Inactive'}</Badge> },
        ]}
        onCreate={async (values) => {
          const variant = requiredText(values, 'variant')
          if (!['info', 'success', 'warning', 'premium'].includes(variant)) throw new Error('Select a supported announcement style.')
          const startsAt = dateValue(values, 'starts_at')
          const endsAt = dateValue(values, 'ends_at')
          if (startsAt && endsAt && Date.parse(endsAt) < Date.parse(startsAt)) {
            throw new Error('The end time must be after the start time.')
          }
          const { error } = await getSupabaseBrowserClient().from('announcements').insert({
            announcement_key: requiredText(values, 'announcement_key'),
            variant: variant as AnnouncementRow['variant'],
            starts_at: startsAt,
            ends_at: endsAt,
            dismissible: booleanValue(values, 'dismissible'),
            is_active: booleanValue(values, 'is_active'),
          })
          if (error) throw error
        }}
        onUpdate={async (row, values) => {
          const variant = requiredText(values, 'variant')
          if (!['info', 'success', 'warning', 'premium'].includes(variant)) throw new Error('Select a supported announcement style.')
          const startsAt = dateValue(values, 'starts_at')
          const endsAt = dateValue(values, 'ends_at')
          if (startsAt && endsAt && Date.parse(endsAt) < Date.parse(startsAt)) {
            throw new Error('The end time must be after the start time.')
          }
          const { error } = await getSupabaseBrowserClient().from('announcements').update({
            announcement_key: requiredText(values, 'announcement_key'),
            variant: variant as AnnouncementRow['variant'],
            starts_at: startsAt,
            ends_at: endsAt,
            dismissible: booleanValue(values, 'dismissible'),
            is_active: booleanValue(values, 'is_active'),
          }).eq('id', row.id)
          if (error) throw error
        }}
        onDelete={async (row) => {
          const { error } = await getSupabaseBrowserClient().from('announcements').delete().eq('id', row.id)
          if (error) throw error
        }}
        onRefresh={refresh}
      />
      <AdminResourcePanel<SiteContentRow>
        title="Structured site content"
        description="Edit CMS content records consumed by the site shell and page content functions."
        rows={workspace.data?.siteContent ?? []}
        fields={siteContentFields}
        rowKey="id"
        createLabel="Add content record"
        columns={[
          { label: 'Key', render: (row) => <span className="font-semibold">{row.content_key}</span> },
          { label: 'Type', render: (row) => row.content_type },
          { label: 'Order', render: (row) => row.sort_order },
          { label: 'State', render: (row) => <Badge variant={row.is_active ? 'success' : 'muted'}>{row.is_active ? 'Active' : 'Inactive'}</Badge> },
        ]}
        onCreate={async (values) => {
          const contentType = requiredText(values, 'content_type')
          if (!siteContentFields.find((field) => field.name === 'content_type')?.options?.some((option) => option.value === contentType)) throw new Error('Select a valid content type.')
          const { error } = await getSupabaseBrowserClient().from('site_content').insert({
            content_key: requiredText(values, 'content_key'),
            content_type: contentType as SiteContentRow['content_type'],
            sort_order: numberValue(values, 'sort_order'),
            payload: jsonValue(values, 'payload'),
            is_active: booleanValue(values, 'is_active'),
          })
          if (error) throw error
        }}
        onUpdate={async (row, values) => {
          const contentType = requiredText(values, 'content_type')
          if (!siteContentFields.find((field) => field.name === 'content_type')?.options?.some((option) => option.value === contentType)) throw new Error('Select a valid content type.')
          const { error } = await getSupabaseBrowserClient().from('site_content').update({
            content_key: requiredText(values, 'content_key'),
            content_type: contentType as SiteContentRow['content_type'],
            sort_order: numberValue(values, 'sort_order'),
            payload: jsonValue(values, 'payload'),
            is_active: booleanValue(values, 'is_active'),
          }).eq('id', row.id)
          if (error) throw error
        }}
        onDelete={async (row) => {
          const { error } = await getSupabaseBrowserClient().from('site_content').delete().eq('id', row.id)
          if (error) throw error
        }}
        onRefresh={refresh}
      />
      <AdminResourcePanel<BlogRow>
        title="Blog posts"
        description="Manage post slugs, cover media, publication state, and ordering. Localized post copy is maintained in Translations."
        rows={workspace.data?.blogs ?? []}
        fields={blogFieldsWithMedia}
        rowKey="id"
        createLabel="Add blog post"
        columns={[
          { label: 'Slug', render: (row) => <span className="font-semibold">{row.slug}</span> },
          { label: 'Published', render: (row) => row.published_at ?? 'Draft' },
          { label: 'Featured', render: (row) => <Badge variant={row.is_featured ? 'premium' : 'muted'}>{row.is_featured ? 'Yes' : 'No'}</Badge> },
          { label: 'State', render: (row) => <Badge variant={row.is_active ? 'success' : 'muted'}>{row.is_active ? 'Active' : 'Inactive'}</Badge> },
        ]}
        onCreate={async (values) => {
          const publishedAt = dateValue(values, 'published_at')
          const readingTime = nullableNumber(values, 'reading_time_minutes')
          if (readingTime != null && readingTime < 1) throw new Error('Reading time must be at least one minute.')
          const { error } = await getSupabaseBrowserClient().from('blogs').insert({
            slug: requiredText(values, 'slug'),
            cover_media_id: optionalId(values, 'cover_media_id'),
            reading_time_minutes: readingTime,
            published_at: publishedAt,
            is_featured: booleanValue(values, 'is_featured'),
            is_active: booleanValue(values, 'is_active'),
            sort_order: numberValue(values, 'sort_order'),
          })
          if (error) throw error
        }}
        onUpdate={async (row, values) => {
          const publishedAt = dateValue(values, 'published_at')
          const readingTime = nullableNumber(values, 'reading_time_minutes')
          if (readingTime != null && readingTime < 1) throw new Error('Reading time must be at least one minute.')
          const { error } = await getSupabaseBrowserClient().from('blogs').update({
            slug: requiredText(values, 'slug'),
            cover_media_id: optionalId(values, 'cover_media_id'),
            reading_time_minutes: readingTime,
            published_at: publishedAt,
            is_featured: booleanValue(values, 'is_featured'),
            is_active: booleanValue(values, 'is_active'),
            sort_order: numberValue(values, 'sort_order'),
          }).eq('id', row.id)
          if (error) throw error
        }}
        onDelete={async (row) => {
          const { error } = await getSupabaseBrowserClient().from('blogs').delete().eq('id', row.id)
          if (error) throw error
        }}
        onRefresh={refresh}
      />
      <AdminResourcePanel<FaqRow>
        title="FAQs"
        description="Create FAQ keys and groups, then edit the matching question and answer translations."
        rows={workspace.data?.faqs ?? []}
        fields={faqFields}
        rowKey="id"
        createLabel="Add FAQ"
        columns={[
          { label: 'FAQ key', render: (row) => <span className="font-semibold">{row.faq_key}</span> },
          { label: 'Group', render: (row) => row.faq_group },
          { label: 'Order', render: (row) => row.sort_order },
          { label: 'State', render: (row) => <Badge variant={row.is_active ? 'success' : 'muted'}>{row.is_active ? 'Active' : 'Inactive'}</Badge> },
        ]}
        onCreate={async (values) => {
          const { error } = await getSupabaseBrowserClient().from('faqs').insert({
            faq_key: requiredText(values, 'faq_key'),
            faq_group: requiredText(values, 'faq_group'),
            sort_order: numberValue(values, 'sort_order'),
            is_active: booleanValue(values, 'is_active'),
          })
          if (error) throw error
        }}
        onUpdate={async (row, values) => {
          const { error } = await getSupabaseBrowserClient().from('faqs').update({
            faq_key: requiredText(values, 'faq_key'),
            faq_group: requiredText(values, 'faq_group'),
            sort_order: numberValue(values, 'sort_order'),
            is_active: booleanValue(values, 'is_active'),
          }).eq('id', row.id)
          if (error) throw error
        }}
        onDelete={async (row) => {
          const { error } = await getSupabaseBrowserClient().from('faqs').delete().eq('id', row.id)
          if (error) throw error
        }}
        onRefresh={refresh}
      />
      <AdminResourcePanel<PolicyRow>
        title="Policies"
        description="Manage policy routes and their translation keys. Policy text is maintained in the Hindi and English translation records."
        rows={workspace.data?.policies ?? []}
        fields={policyFields}
        rowKey="id"
        createLabel="Add policy"
        columns={[
          { label: 'Slug', render: (row) => <span className="font-semibold">{row.slug}</span> },
          { label: 'Type', render: (row) => row.policy_type },
          { label: 'Title key', render: (row) => row.title_key },
          { label: 'Published', render: (row) => row.published_at ?? 'Unpublished' },
          { label: 'State', render: (row) => <Badge variant={row.is_active ? 'success' : 'muted'}>{row.is_active ? 'Active' : 'Inactive'}</Badge> },
        ]}
        onCreate={async (values) => {
          const policyType = requiredText(values, 'policy_type')
          if (!['privacy', 'terms', 'refund', 'shipping', 'custom'].includes(policyType)) throw new Error('Select a valid policy type.')
          const { error } = await getSupabaseBrowserClient().from('policies').insert({
            slug: requiredText(values, 'slug'),
            policy_type: policyType as PolicyRow['policy_type'],
            title_key: requiredText(values, 'title_key'),
            body_key: requiredText(values, 'body_key'),
            seo_title_key: optionalText(values, 'seo_title_key'),
            seo_description_key: optionalText(values, 'seo_description_key'),
            published_at: dateValue(values, 'published_at'),
            sort_order: numberValue(values, 'sort_order'),
            is_active: booleanValue(values, 'is_active'),
          })
          if (error) throw error
        }}
        onUpdate={async (row, values) => {
          const policyType = requiredText(values, 'policy_type')
          if (!['privacy', 'terms', 'refund', 'shipping', 'custom'].includes(policyType)) throw new Error('Select a valid policy type.')
          const { error } = await getSupabaseBrowserClient().from('policies').update({
            slug: requiredText(values, 'slug'),
            policy_type: policyType as PolicyRow['policy_type'],
            title_key: requiredText(values, 'title_key'),
            body_key: requiredText(values, 'body_key'),
            seo_title_key: optionalText(values, 'seo_title_key'),
            seo_description_key: optionalText(values, 'seo_description_key'),
            published_at: dateValue(values, 'published_at'),
            sort_order: numberValue(values, 'sort_order'),
            is_active: booleanValue(values, 'is_active'),
          }).eq('id', row.id)
          if (error) throw error
        }}
        onDelete={async (row) => {
          const { error } = await getSupabaseBrowserClient().from('policies').delete().eq('id', row.id)
          if (error) throw error
        }}
        onRefresh={refresh}
      />
      <AdminResourcePanel<HeroSlideRow>
        title="Hero slides"
        description="Manage carousel slide ordering, media library selection, JSON copy, and publication state."
        rows={workspace.data?.heroSlides ?? []}
        fields={heroSlideFieldsWithMedia}
        rowKey="id"
        createLabel="Add hero slide"
        columns={[
          { label: 'Slide', render: (row) => <span className="font-semibold">{row.slide_key}</span> },
          { label: 'Image', render: (row) => workspace.data?.media.find((item) => item.id === row.media_id)?.alt_text ?? row.media_id ?? '—' },
          { label: 'Order', render: (row) => row.sort_order },
          { label: 'State', render: (row) => <Badge variant={row.is_active ? 'success' : 'muted'}>{row.is_active ? 'Active' : 'Inactive'}</Badge> },
        ]}
        onCreate={async (values) => {
          const { error } = await getSupabaseBrowserClient().from('hero_slides').insert({
            slide_key: requiredText(values, 'slide_key'),
            media_id: optionalId(values, 'media_id'),
            sort_order: numberValue(values, 'sort_order'),
            payload: jsonValue(values, 'payload'),
            is_active: booleanValue(values, 'is_active'),
          })
          if (error) throw error
        }}
        onUpdate={async (row, values) => {
          const { error } = await getSupabaseBrowserClient().from('hero_slides').update({
            slide_key: requiredText(values, 'slide_key'),
            media_id: optionalId(values, 'media_id'),
            sort_order: numberValue(values, 'sort_order'),
            payload: jsonValue(values, 'payload'),
            is_active: booleanValue(values, 'is_active'),
          }).eq('id', row.id)
          if (error) throw error
        }}
        onDelete={async (row) => {
          const { error } = await getSupabaseBrowserClient().from('hero_slides').delete().eq('id', row.id)
          if (error) throw error
        }}
        onRefresh={refresh}
      />
    </main>
  )
}
