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

type SiteSettingRow = Database['public']['Tables']['site_settings']['Row']
type LanguageRow = Database['public']['Tables']['languages']['Row']
type NavigationMenuRow = Database['public']['Tables']['navigation_menus']['Row']
type NavigationItemRow = Database['public']['Tables']['navigation_menu_items']['Row']
type FooterSectionRow = Database['public']['Tables']['footer_sections']['Row']
type FooterLinkRow = Database['public']['Tables']['footer_links']['Row']

type SettingsWorkspace = {
  settings: SiteSettingRow[]
  languages: LanguageRow[]
  menus: NavigationMenuRow[]
  menuItems: NavigationItemRow[]
  footerSections: FooterSectionRow[]
  footerLinks: FooterLinkRow[]
}

async function fetchSettings(): Promise<SettingsWorkspace> {
  const supabase = getSupabaseBrowserClient()
  const [settings, languages, menus, menuItems, footerSections, footerLinks] = await Promise.all([
    supabase
      .from('site_settings')
      .select('id, setting_key, setting_value, is_public, sort_order, created_at, updated_at')
      .order('sort_order', { ascending: true }),
    supabase
      .from('languages')
      .select('code, name, native_name, content_language, is_default, is_enabled, sort_order')
      .order('sort_order', { ascending: true }),
    supabase
      .from('navigation_menus')
      .select('id, menu_key, location, is_active, sort_order, created_at, updated_at')
      .order('sort_order', { ascending: true }),
    supabase
      .from('navigation_menu_items')
      .select('id, menu_id, parent_id, label_key, href, route_type, sort_order, is_active, created_at, updated_at')
      .order('sort_order', { ascending: true }),
    supabase
      .from('footer_sections')
      .select('id, section_key, title_key, sort_order, is_active, created_at, updated_at')
      .order('sort_order', { ascending: true }),
    supabase
      .from('footer_links')
      .select('id, section_id, label_key, href, route_type, sort_order, is_active, created_at, updated_at')
      .order('sort_order', { ascending: true }),
  ])
  const error =
    settings.error ??
    languages.error ??
    menus.error ??
    menuItems.error ??
    footerSections.error ??
    footerLinks.error
  if (error) throw error
  return {
    settings: settings.data ?? [],
    languages: languages.data ?? [],
    menus: menus.data ?? [],
    menuItems: menuItems.data ?? [],
    footerSections: footerSections.data ?? [],
    footerLinks: footerLinks.data ?? [],
  }
}

function requiredText(values: Record<string, unknown>, field: string) {
  const value = values[field]
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${field} is required.`)
  return value.trim()
}

function optionalText(values: Record<string, unknown>, field: string) {
  const value = values[field]
  if (value == null || value === '') return null
  if (typeof value !== 'string') throw new Error(`${field} must be text.`)
  return value.trim() || null
}

function booleanValue(values: Record<string, unknown>, field: string) {
  const value = values[field]
  if (typeof value !== 'boolean') throw new Error(`${field} must be true or false.`)
  return value
}

function numberValue(values: Record<string, unknown>, field: string) {
  const value = values[field]
  if (typeof value !== 'number' || !Number.isFinite(value)) throw new Error(`${field} must be a valid number.`)
  return value
}

function isJsonValue(value: unknown): value is Json {
  if (value === null || ['string', 'number', 'boolean'].includes(typeof value)) return true
  if (Array.isArray(value)) return value.every(isJsonValue)
  return typeof value === 'object' && Object.values(value).every(isJsonValue)
}

function jsonValue(values: Record<string, unknown>, field: string): Json {
  const value = values[field]
  if (value == null || !isJsonValue(value)) throw new Error(`${field} must be valid JSON.`)
  return value
}

function validateMenuParent(
  parentId: string | null,
  menuId: string,
  currentItemId: string | null,
  items: NavigationItemRow[],
) {
  if (!parentId) return
  const itemById = new Map(items.map((item) => [item.id, item]))
  let parent = itemById.get(parentId)
  if (!parent || parent.menu_id !== menuId) {
    throw new Error('Select a parent link from the same menu.')
  }
  const visited = new Set<string>()
  while (parent) {
    if (parent.id === currentItemId || visited.has(parent.id)) {
      throw new Error('This parent link would create a navigation cycle.')
    }
    visited.add(parent.id)
    parent = parent.parent_id ? itemById.get(parent.parent_id) : undefined
  }
}

const settingFields: CrudField[] = [
  { name: 'setting_key', label: 'Setting key', type: 'text', required: true, nullable: false },
  { name: 'setting_value', label: 'Setting value (JSON)', type: 'json', required: true, nullable: false, defaultValue: '{}' },
  { name: 'sort_order', label: 'Sort order', type: 'number', nullable: false, defaultValue: 0 },
  { name: 'is_public', label: 'Public to site visitors', type: 'boolean', defaultValue: true },
]

const languageFields: CrudField[] = [
  { name: 'name', label: 'Language name', type: 'text', required: true, nullable: false },
  { name: 'native_name', label: 'Native name', type: 'text', required: true, nullable: false },
  { name: 'content_language', label: 'HTML content language', type: 'text', required: true, nullable: false },
  { name: 'sort_order', label: 'Sort order', type: 'number', nullable: false, defaultValue: 0 },
  { name: 'is_default', label: 'Default language', type: 'boolean' },
  { name: 'is_enabled', label: 'Enabled in language controls', type: 'boolean', defaultValue: true },
]

const menuFields: CrudField[] = [
  { name: 'menu_key', label: 'Menu key', type: 'text', required: true, nullable: false },
  {
    name: 'location',
    label: 'Location',
    type: 'select',
    required: true,
    nullable: false,
    options: ['header', 'shop', 'account', 'admin', 'footer', 'legal'].map((value) => ({ label: value, value })),
  },
  { name: 'sort_order', label: 'Sort order', type: 'number', nullable: false, defaultValue: 0 },
  { name: 'is_active', label: 'Active', type: 'boolean', defaultValue: true },
]

const menuItemFields: CrudField[] = [
  { name: 'menu_id', label: 'Menu', type: 'select', required: true, nullable: false },
  { name: 'parent_id', label: 'Parent link (optional)', type: 'select' },
  { name: 'label_key', label: 'Label translation key', type: 'text', required: true, nullable: false },
  { name: 'href', label: 'Link', type: 'text', required: true, nullable: false },
  {
    name: 'route_type',
    label: 'Link type',
    type: 'select',
    required: true,
    nullable: false,
    options: ['internal', 'external', 'action'].map((value) => ({ label: value, value })),
  },
  { name: 'sort_order', label: 'Sort order', type: 'number', nullable: false, defaultValue: 0 },
  { name: 'is_active', label: 'Active', type: 'boolean', defaultValue: true },
]

const footerSectionFields: CrudField[] = [
  { name: 'section_key', label: 'Section key', type: 'text', required: true, nullable: false },
  { name: 'title_key', label: 'Title translation key', type: 'text', required: true, nullable: false },
  { name: 'sort_order', label: 'Sort order', type: 'number', nullable: false, defaultValue: 0 },
  { name: 'is_active', label: 'Active', type: 'boolean', defaultValue: true },
]

const footerLinkFields: CrudField[] = [
  { name: 'section_id', label: 'Footer section', type: 'select', required: true, nullable: false },
  { name: 'label_key', label: 'Label translation key', type: 'text', required: true, nullable: false },
  { name: 'href', label: 'Link', type: 'text', required: true, nullable: false },
  {
    name: 'route_type',
    label: 'Link type',
    type: 'select',
    required: true,
    nullable: false,
    options: ['internal', 'external', 'action'].map((value) => ({ label: value, value })),
  },
  { name: 'sort_order', label: 'Sort order', type: 'number', nullable: false, defaultValue: 0 },
  { name: 'is_active', label: 'Active', type: 'boolean', defaultValue: true },
]

export function Component() {
  const queryClient = useQueryClient()
  const workspace = useQuery({
    queryKey: queryKeys.admin.settings,
    queryFn: fetchSettings,
  })
  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.admin.settings })
    void queryClient.invalidateQueries({ queryKey: queryKeys.shell.all })
  }
  const menuFieldsWithOptions = menuItemFields.map((field) => {
    if (field.name === 'menu_id') {
      return {
        ...field,
        options: (workspace.data?.menus ?? []).map((menu) => ({
          label: `${menu.menu_key} · ${menu.location}`,
          value: menu.id,
        })),
      }
    }
    if (field.name === 'parent_id') {
      return {
        ...field,
        options: [
          { label: 'No parent', value: '' },
          ...(workspace.data?.menuItems ?? []).map((item) => ({
            label: item.label_key,
            value: item.id,
          })),
        ],
      }
    }
    return field
  })
  const footerLinkFieldsWithOptions = footerLinkFields.map((field) =>
    field.name === 'section_id'
      ? {
          ...field,
          options: (workspace.data?.footerSections ?? []).map((section) => ({
            label: section.section_key,
            value: section.id,
          })),
        }
      : field,
  )

  if (workspace.isLoading) {
    return <LoadingScreen className="min-h-[70svh]" />
  }

  if (workspace.error) {
    return (
      <main className="container space-y-8 py-10">
        <Seo title="Settings" />
        <ErrorState
          title="Settings could not be loaded"
          description={workspace.error instanceof Error ? workspace.error.message : 'Supabase could not return the site settings.'}
          onRetry={() => void workspace.refetch()}
        />
      </main>
    )
  }

  return (
    <main className="container space-y-8 py-10">
      <Seo title="Settings" />
      <SectionHeading
        eyebrow="Super Admin"
        title="Site settings"
        description="Manage persisted site configuration and the enabled/default language records using the existing settings tables."
      />
      <AdminResourcePanel<SiteSettingRow>
        title="Site settings"
        description="Values are stored as JSON. Only mark values public when they are safe to expose to site visitors."
        rows={workspace.data?.settings ?? []}
        fields={settingFields}
        rowKey="id"
        createLabel="Add setting"
        columns={[
          { label: 'Key', render: (row) => <span className="font-semibold">{row.setting_key}</span> },
          { label: 'Value', render: (row) => <span className="line-clamp-2">{JSON.stringify(row.setting_value)}</span> },
          { label: 'Sort', render: (row) => row.sort_order },
          { label: 'Visibility', render: (row) => <Badge variant={row.is_public ? 'success' : 'muted'}>{row.is_public ? 'Public' : 'Private'}</Badge> },
        ]}
        onCreate={async (values) => {
          const { error } = await getSupabaseBrowserClient().from('site_settings').insert({
            setting_key: requiredText(values, 'setting_key'),
            setting_value: jsonValue(values, 'setting_value'),
            sort_order: numberValue(values, 'sort_order'),
            is_public: booleanValue(values, 'is_public'),
          })
          if (error) throw error
        }}
        onUpdate={async (row, values) => {
          const { error } = await getSupabaseBrowserClient().from('site_settings').update({
            setting_key: requiredText(values, 'setting_key'),
            setting_value: jsonValue(values, 'setting_value'),
            sort_order: numberValue(values, 'sort_order'),
            is_public: booleanValue(values, 'is_public'),
          }).eq('id', row.id)
          if (error) throw error
        }}
        onDelete={async (row) => {
          const { error } = await getSupabaseBrowserClient().from('site_settings').delete().eq('id', row.id)
          if (error) throw error
        }}
        onRefresh={refresh}
      />
      <AdminResourcePanel<LanguageRow>
        title="Languages"
        description="The application currently supports Hindi and English. Disable a language to hide it from public language controls; translations remain stored."
        rows={workspace.data?.languages ?? []}
        fields={languageFields}
        rowKey="code"
        canCreate={false}
        columns={[
          { label: 'Language', render: (row) => <span className="font-semibold">{row.native_name} ({row.code})</span> },
          { label: 'Content language', render: (row) => row.content_language },
          { label: 'Default', render: (row) => <Badge variant={row.is_default ? 'premium' : 'muted'}>{row.is_default ? 'Default' : '—'}</Badge> },
          { label: 'Availability', render: (row) => <Badge variant={row.is_enabled ? 'success' : 'muted'}>{row.is_enabled ? 'Enabled' : 'Disabled'}</Badge> },
        ]}
        onUpdate={async (row, values) => {
          const isDefault = booleanValue(values, 'is_default')
          const isEnabled = booleanValue(values, 'is_enabled')
          const otherEnabled = (workspace.data?.languages ?? []).filter(
            (language) => language.code !== row.code && language.is_enabled,
          )
          if (!isEnabled && !otherEnabled.length) {
            throw new Error('At least one language must remain enabled.')
          }

          const supabase = getSupabaseBrowserClient()
          if (isDefault && !isEnabled) {
            throw new Error('The default language must remain enabled.')
          }

          if (!isDefault && row.is_default) {
            const replacement = otherEnabled[0]
            if (!replacement) {
              throw new Error('Choose another enabled language as the default before disabling this one.')
            }
            const { error: replacementError } = await supabase
              .from('languages')
              .update({ is_default: true })
              .eq('code', replacement.code)
            if (replacementError) throw replacementError
          }

          if (isDefault && !row.is_default) {
            const { error: targetDefaultError } = await supabase
              .from('languages')
              .update({ is_default: true })
              .eq('code', row.code)
            if (targetDefaultError) throw targetDefaultError
          }

          const { error } = await supabase.from('languages').update({
            name: requiredText(values, 'name'),
            native_name: requiredText(values, 'native_name'),
            content_language: requiredText(values, 'content_language'),
            sort_order: numberValue(values, 'sort_order'),
            is_enabled: isEnabled,
            is_default: isDefault,
          }).eq('code', row.code)
          if (error) throw error

          if (isDefault) {
            const { error: otherDefaultsError } = await supabase
              .from('languages')
              .update({ is_default: false })
              .neq('code', row.code)
            if (otherDefaultsError) {
              throw new Error(`Language was updated, but another default language could not be cleared: ${otherDefaultsError.message}`)
            }
          }
        }}
        onRefresh={refresh}
      />
      <AdminResourcePanel<NavigationMenuRow>
        title="Navigation menus"
        description="Configure the existing header, shop, account, admin, footer, and legal menu records."
        rows={workspace.data?.menus ?? []}
        fields={menuFields}
        rowKey="id"
        createLabel="Add menu"
        columns={[
          { label: 'Menu', render: (row) => <span className="font-semibold">{row.menu_key}</span> },
          { label: 'Location', render: (row) => row.location },
          { label: 'Sort', render: (row) => row.sort_order },
          { label: 'State', render: (row) => <Badge variant={row.is_active ? 'success' : 'muted'}>{row.is_active ? 'Active' : 'Inactive'}</Badge> },
        ]}
        onCreate={async (values) => {
          const location = requiredText(values, 'location')
          if (!['header', 'shop', 'account', 'admin', 'footer', 'legal'].includes(location)) throw new Error('Select a valid menu location.')
          const { error } = await getSupabaseBrowserClient().from('navigation_menus').insert({
            menu_key: requiredText(values, 'menu_key'),
            location: location as NavigationMenuRow['location'],
            sort_order: numberValue(values, 'sort_order'),
            is_active: booleanValue(values, 'is_active'),
          })
          if (error) throw error
        }}
        onUpdate={async (row, values) => {
          const location = requiredText(values, 'location')
          if (!['header', 'shop', 'account', 'admin', 'footer', 'legal'].includes(location)) throw new Error('Select a valid menu location.')
          const { error } = await getSupabaseBrowserClient().from('navigation_menus').update({
            menu_key: requiredText(values, 'menu_key'),
            location: location as NavigationMenuRow['location'],
            sort_order: numberValue(values, 'sort_order'),
            is_active: booleanValue(values, 'is_active'),
          }).eq('id', row.id)
          if (error) throw error
        }}
        onDelete={async (row) => {
          const { error } = await getSupabaseBrowserClient().from('navigation_menus').delete().eq('id', row.id)
          if (error) throw error
        }}
        onRefresh={refresh}
      />
      <AdminResourcePanel<NavigationItemRow>
        title="Navigation links"
        description="Manage labels, destinations, order, and active state for links in each menu."
        rows={workspace.data?.menuItems ?? []}
        fields={menuFieldsWithOptions}
        rowKey="id"
        createLabel="Add navigation link"
        canCreate={(workspace.data?.menus.length ?? 0) > 0}
        columns={[
          { label: 'Label key', render: (row) => <span className="font-semibold">{row.label_key}</span> },
          { label: 'Menu', render: (row) => workspace.data?.menus.find((menu) => menu.id === row.menu_id)?.menu_key ?? row.menu_id },
          { label: 'Parent', render: (row) => workspace.data?.menuItems.find((item) => item.id === row.parent_id)?.label_key ?? '—' },
          { label: 'Destination', render: (row) => row.href },
          { label: 'Type', render: (row) => row.route_type },
          { label: 'State', render: (row) => <Badge variant={row.is_active ? 'success' : 'muted'}>{row.is_active ? 'Active' : 'Inactive'}</Badge> },
        ]}
        onCreate={async (values) => {
          const routeType = requiredText(values, 'route_type')
          const menuId = requiredText(values, 'menu_id')
          const parentId = optionalText(values, 'parent_id')
          if (!['internal', 'external', 'action'].includes(routeType)) throw new Error('Select a valid link type.')
          if (!workspace.data?.menus.some((menu) => menu.id === menuId)) throw new Error('Select an existing menu.')
          validateMenuParent(parentId, menuId, null, workspace.data?.menuItems ?? [])
          const { error } = await getSupabaseBrowserClient().from('navigation_menu_items').insert({
            menu_id: menuId,
            parent_id: parentId,
            label_key: requiredText(values, 'label_key'),
            href: requiredText(values, 'href'),
            route_type: routeType as NavigationItemRow['route_type'],
            sort_order: numberValue(values, 'sort_order'),
            is_active: booleanValue(values, 'is_active'),
          })
          if (error) throw error
        }}
        onUpdate={async (row, values) => {
          const routeType = requiredText(values, 'route_type')
          const menuId = requiredText(values, 'menu_id')
          const parentId = optionalText(values, 'parent_id')
          if (!['internal', 'external', 'action'].includes(routeType)) throw new Error('Select a valid link type.')
          if (!workspace.data?.menus.some((menu) => menu.id === menuId)) throw new Error('Select an existing menu.')
          validateMenuParent(parentId, menuId, row.id, workspace.data?.menuItems ?? [])
          const { error } = await getSupabaseBrowserClient().from('navigation_menu_items').update({
            menu_id: menuId,
            parent_id: parentId,
            label_key: requiredText(values, 'label_key'),
            href: requiredText(values, 'href'),
            route_type: routeType as NavigationItemRow['route_type'],
            sort_order: numberValue(values, 'sort_order'),
            is_active: booleanValue(values, 'is_active'),
          }).eq('id', row.id)
          if (error) throw error
        }}
        onDelete={async (row) => {
          const { error } = await getSupabaseBrowserClient().from('navigation_menu_items').delete().eq('id', row.id)
          if (error) throw error
        }}
        onRefresh={refresh}
      />
      <AdminResourcePanel<FooterSectionRow>
        title="Footer sections"
        description="Manage footer grouping labels and order."
        rows={workspace.data?.footerSections ?? []}
        fields={footerSectionFields}
        rowKey="id"
        createLabel="Add footer section"
        columns={[
          { label: 'Section', render: (row) => <span className="font-semibold">{row.section_key}</span> },
          { label: 'Title key', render: (row) => row.title_key },
          { label: 'Sort', render: (row) => row.sort_order },
          { label: 'State', render: (row) => <Badge variant={row.is_active ? 'success' : 'muted'}>{row.is_active ? 'Active' : 'Inactive'}</Badge> },
        ]}
        onCreate={async (values) => {
          const { error } = await getSupabaseBrowserClient().from('footer_sections').insert({
            section_key: requiredText(values, 'section_key'),
            title_key: requiredText(values, 'title_key'),
            sort_order: numberValue(values, 'sort_order'),
            is_active: booleanValue(values, 'is_active'),
          })
          if (error) throw error
        }}
        onUpdate={async (row, values) => {
          const { error } = await getSupabaseBrowserClient().from('footer_sections').update({
            section_key: requiredText(values, 'section_key'),
            title_key: requiredText(values, 'title_key'),
            sort_order: numberValue(values, 'sort_order'),
            is_active: booleanValue(values, 'is_active'),
          }).eq('id', row.id)
          if (error) throw error
        }}
        onDelete={async (row) => {
          const { error } = await getSupabaseBrowserClient().from('footer_sections').delete().eq('id', row.id)
          if (error) throw error
        }}
        onRefresh={refresh}
      />
      <AdminResourcePanel<FooterLinkRow>
        title="Footer links"
        description="Manage the label translation keys and destinations inside each footer section."
        rows={workspace.data?.footerLinks ?? []}
        fields={footerLinkFieldsWithOptions}
        rowKey="id"
        createLabel="Add footer link"
        canCreate={(workspace.data?.footerSections.length ?? 0) > 0}
        columns={[
          { label: 'Label key', render: (row) => <span className="font-semibold">{row.label_key}</span> },
          { label: 'Section', render: (row) => workspace.data?.footerSections.find((section) => section.id === row.section_id)?.section_key ?? row.section_id },
          { label: 'Destination', render: (row) => row.href },
          { label: 'Type', render: (row) => row.route_type },
          { label: 'State', render: (row) => <Badge variant={row.is_active ? 'success' : 'muted'}>{row.is_active ? 'Active' : 'Inactive'}</Badge> },
        ]}
        onCreate={async (values) => {
          const routeType = requiredText(values, 'route_type')
          const sectionId = requiredText(values, 'section_id')
          if (!['internal', 'external', 'action'].includes(routeType)) throw new Error('Select a valid link type.')
          if (!workspace.data?.footerSections.some((section) => section.id === sectionId)) throw new Error('Select an existing footer section.')
          const { error } = await getSupabaseBrowserClient().from('footer_links').insert({
            section_id: sectionId,
            label_key: requiredText(values, 'label_key'),
            href: requiredText(values, 'href'),
            route_type: routeType as FooterLinkRow['route_type'],
            sort_order: numberValue(values, 'sort_order'),
            is_active: booleanValue(values, 'is_active'),
          })
          if (error) throw error
        }}
        onUpdate={async (row, values) => {
          const routeType = requiredText(values, 'route_type')
          const sectionId = requiredText(values, 'section_id')
          if (!['internal', 'external', 'action'].includes(routeType)) throw new Error('Select a valid link type.')
          if (!workspace.data?.footerSections.some((section) => section.id === sectionId)) throw new Error('Select an existing footer section.')
          const { error } = await getSupabaseBrowserClient().from('footer_links').update({
            section_id: sectionId,
            label_key: requiredText(values, 'label_key'),
            href: requiredText(values, 'href'),
            route_type: routeType as FooterLinkRow['route_type'],
            sort_order: numberValue(values, 'sort_order'),
            is_active: booleanValue(values, 'is_active'),
          }).eq('id', row.id)
          if (error) throw error
        }}
        onDelete={async (row) => {
          const { error } = await getSupabaseBrowserClient().from('footer_links').delete().eq('id', row.id)
          if (error) throw error
        }}
        onRefresh={refresh}
      />
    </main>
  )
}
