import { useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'

import { LoadingScreen } from '@/components/layout/loading-screen'
import { SectionHeading } from '@/components/layout/section-heading'
import { Seo } from '@/components/layout/seo'
import { EmptyState } from '@/components/ui/empty-state'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { AdminResourcePanel, type CrudField } from '@/features/admin/ui/admin-resource-panel'
import { ProductImagesPanel } from '@/features/admin/ui/product-images-panel'
import { queryKeys } from '@/shared/api/keys'
import { routes } from '@/shared/config/routes'
import { getSupabaseBrowserClient } from '@/shared/api/supabase'
import { useLocale } from '@/shared/hooks/use-locale'
import type { Database } from '@/shared/types/database'

type ProductRow = Database['public']['Tables']['products']['Row']
type CategoryRow = Database['public']['Tables']['categories']['Row']
type CollectionRow = Database['public']['Tables']['collections']['Row']
type MediaRow = Database['public']['Tables']['media']['Row']
type CategoryInsert = Database['public']['Tables']['categories']['Insert']
type CollectionInsert = Database['public']['Tables']['collections']['Insert']

type CatalogWorkspace = {
  products: ProductRow[]
  categories: CategoryRow[]
  collections: CollectionRow[]
  media: MediaRow[]
}

async function fetchCatalogWorkspace(): Promise<CatalogWorkspace> {
  const supabase = getSupabaseBrowserClient()
  const [products, categories, collections, media] = await Promise.all([
    supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false }),
    supabase.from('categories').select('id, slug, image_media_id, parent_id, is_active, sort_order, created_at, updated_at').order('sort_order', { ascending: true }),
    supabase.from('collections').select('id, slug, cover_media_id, hero_media_id, is_featured, is_active, sort_order, created_at, updated_at').order('sort_order', { ascending: true }),
    supabase.from('media').select('id, provider, public_id, secure_url, alt_text, blur_data_url, width, height, format, metadata, is_public, created_by, created_at, updated_at').order('created_at', { ascending: false }),
  ])

  const firstError = products.error ?? categories.error ?? collections.error ?? media.error
  if (firstError) {
    throw firstError
  }

  return {
    products: products.data ?? [],
    categories: categories.data ?? [],
    collections: collections.data ?? [],
    media: media.data ?? [],
  }
}

function optionize(rows: Array<{ id: string; slug: string }>, fallback = 'None') {
  return [
    { label: fallback, value: '' },
    ...rows.map((row) => ({ label: row.slug, value: row.id })),
  ]
}

function requiredText(values: Record<string, unknown>, field: string) {
  const value = values[field]
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`${field} is required.`)
  }
  return value.trim()
}

function optionalId(values: Record<string, unknown>, field: string) {
  const rawValue = values[field]
  if (rawValue == null || rawValue === '') return null
  if (typeof rawValue !== 'string') {
    throw new Error(`${field} must be text.`)
  }
  const value = rawValue.trim()
  if (value == null) {
    return null
  }
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) {
    throw new Error(`${field} must be a valid selection.`)
  }
  return value
}

function numberValue(values: Record<string, unknown>, field: string) {
  const value = values[field]
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`${field} must be a valid number.`)
  }
  return value
}

function booleanValue(values: Record<string, unknown>, field: string) {
  const value = values[field]
  if (typeof value !== 'boolean') {
    throw new Error(`${field} must be true or false.`)
  }
  return value
}

function categoryValues(values: Record<string, unknown>): CategoryInsert {
  return {
    slug: requiredText(values, 'slug'),
    image_media_id: optionalId(values, 'image_media_id'),
    parent_id: optionalId(values, 'parent_id'),
    is_active: booleanValue(values, 'is_active'),
    sort_order: numberValue(values, 'sort_order') ?? 0,
  }
}

function collectionValues(values: Record<string, unknown>): CollectionInsert {
  return {
    slug: requiredText(values, 'slug'),
    cover_media_id: optionalId(values, 'cover_media_id'),
    hero_media_id: optionalId(values, 'hero_media_id'),
    is_featured: booleanValue(values, 'is_featured'),
    is_active: booleanValue(values, 'is_active'),
    sort_order: numberValue(values, 'sort_order') ?? 0,
  }
}

export function Component() {
  const locale = useLocale()
  const queryClient = useQueryClient()
  const workspace = useQuery({
    queryKey: queryKeys.dashboard.all,
    queryFn: fetchCatalogWorkspace,
  })

  const mediaOptions = useMemo(
    () => [
      { label: 'None', value: '' },
      ...(workspace.data?.media ?? []).map((item) => ({
        label: item.secure_url || item.public_id,
        value: item.id,
      })),
    ],
    [workspace.data?.media],
  )

  if (workspace.isLoading) {
    return <LoadingScreen className="min-h-[70svh]" />
  }

  if (workspace.error) {
    return (
      <EmptyState
        title="Unable to load catalog"
        description={
          workspace.error instanceof Error
            ? workspace.error.message
            : 'Supabase could not load catalog resources.'
        }
        actionLabel="Retry"
        onAction={() => {
          void workspace.refetch()
        }}
      />
    )
  }

  const data = workspace.data
  const refreshCatalogData = () => {
    void workspace.refetch()
    void queryClient.invalidateQueries({ queryKey: queryKeys.admin.products })
    void queryClient.invalidateQueries({ queryKey: queryKeys.catalog.products })
    void queryClient.invalidateQueries({ queryKey: queryKeys.catalog.collections })
    void queryClient.invalidateQueries({ queryKey: queryKeys.pages.all })
  }
  const categoryFields: CrudField[] = [
    { name: 'slug', label: 'Slug', type: 'text', placeholder: 'ritual-essentials' },
    { name: 'image_media_id', label: 'Image', type: 'select', options: mediaOptions },
    { name: 'parent_id', label: 'Parent category', type: 'select', options: optionize(data?.categories ?? []) },
    { name: 'is_active', label: 'Active', type: 'boolean', defaultValue: true },
    { name: 'sort_order', label: 'Sort order', type: 'number', placeholder: '0' },
  ]

  const collectionFields: CrudField[] = [
    { name: 'slug', label: 'Slug', type: 'text', placeholder: 'temple-heritage' },
    { name: 'cover_media_id', label: 'Cover media', type: 'select', options: mediaOptions },
    { name: 'hero_media_id', label: 'Hero media', type: 'select', options: mediaOptions },
    { name: 'is_featured', label: 'Featured', type: 'boolean' },
    { name: 'is_active', label: 'Active', type: 'boolean', defaultValue: true },
    { name: 'sort_order', label: 'Sort order', type: 'number', placeholder: '0' },
  ]

  return (
    <div className="space-y-8">
      <Seo title="Catalog" description="Manage categories, collections, and product media in Supabase." />
      <SectionHeading
        eyebrow="Super Admin"
        title="Catalog"
        description="Manage catalog organization and product media here. Product content, pricing, variants, and inventory use the dedicated product workspace."
      />

      <div className="flex flex-wrap gap-2">
        <Badge variant="premium">Live CRUD</Badge>
        <Badge variant="outline">{data?.products.length ?? 0} products</Badge>
        <Badge variant="outline">{data?.collections.length ?? 0} collections</Badge>
        <Badge variant="outline">{data?.categories.length ?? 0} categories</Badge>
      </div>

      <Card className="shadow-[var(--shadow-soft)]">
        <CardContent className="flex flex-wrap items-center justify-between gap-5 p-6">
          <div className="space-y-2">
            <h2 className="font-display text-2xl font-semibold">Products</h2>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Manage product details, pricing, variants, inventory, tags, collections, and publication from the full product workspace.
            </p>
          </div>
          <Button asChild>
            <Link to={routes.forLocale(locale, 'admin/products')}>Open product manager</Link>
          </Button>
        </CardContent>
      </Card>

      <ProductImagesPanel products={data?.products ?? []} />

      <div className="grid gap-6 xl:grid-cols-2">
        <AdminResourcePanel<CategoryRow>
          title="Categories"
          description="Organize the catalog hierarchy."
          rows={data?.categories ?? []}
          fields={categoryFields}
          rowKey="id"
          createLabel="Add category"
          columns={[
            { label: 'Slug', render: (row) => row.slug },
            { label: 'Active', render: (row) => (row.is_active ? 'Yes' : 'No') },
            { label: 'Sort', render: (row) => String(row.sort_order) },
          ]}
          onCreate={async (values) => {
            const supabase = getSupabaseBrowserClient()
            const { error } = await supabase.from('categories').insert(categoryValues(values))
            if (error) throw error
          }}
          onUpdate={async (row, values) => {
            const supabase = getSupabaseBrowserClient()
            const { error } = await supabase.from('categories').update(categoryValues(values)).eq('id', row.id)
            if (error) throw error
          }}
          onDelete={async (row) => {
            const supabase = getSupabaseBrowserClient()
            const { error } = await supabase.from('categories').delete().eq('id', row.id)
            if (error) throw error
          }}
          onRefresh={() => {
            refreshCatalogData()
          }}
        />

        <AdminResourcePanel<CollectionRow>
          title="Collections"
          description="Manage curated product collections and their hero media."
          rows={data?.collections ?? []}
          fields={collectionFields}
          rowKey="id"
          createLabel="Add collection"
          columns={[
            { label: 'Slug', render: (row) => row.slug },
            { label: 'Featured', render: (row) => (row.is_featured ? 'Yes' : 'No') },
            { label: 'Sort', render: (row) => String(row.sort_order) },
          ]}
          onCreate={async (values) => {
            const supabase = getSupabaseBrowserClient()
            const { error } = await supabase.from('collections').insert(collectionValues(values))
            if (error) throw error
          }}
          onUpdate={async (row, values) => {
            const supabase = getSupabaseBrowserClient()
            const { error } = await supabase.from('collections').update(collectionValues(values)).eq('id', row.id)
            if (error) throw error
          }}
          onDelete={async (row) => {
            const supabase = getSupabaseBrowserClient()
            const { error } = await supabase.from('collections').delete().eq('id', row.id)
            if (error) throw error
          }}
          onRefresh={() => {
            refreshCatalogData()
          }}
        />
      </div>
    </div>
  )
}
