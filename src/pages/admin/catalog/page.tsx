import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'

import { LoadingScreen } from '@/components/layout/loading-screen'
import { SectionHeading } from '@/components/layout/section-heading'
import { Seo } from '@/components/layout/seo'
import { EmptyState } from '@/components/ui/empty-state'
import { Badge } from '@/components/ui/badge'
import { AdminResourcePanel, type CrudField } from '@/features/admin/ui/admin-resource-panel'
import { ProductImagesPanel } from '@/features/admin/ui/product-images-panel'
import { queryKeys } from '@/shared/api/keys'
import { getSupabaseBrowserClient } from '@/shared/api/supabase'
import type { Database, Json } from '@/shared/types/database'
import { readProductContent, withProductContent } from '@/shared/lib/product-content'
import { humanizeSlug } from '@/shared/lib/format'

type ProductRow = Database['public']['Tables']['products']['Row']
type CategoryRow = Database['public']['Tables']['categories']['Row']
type CollectionRow = Database['public']['Tables']['collections']['Row']
type MediaRow = Database['public']['Tables']['media']['Row']
type ProductInsert = Database['public']['Tables']['products']['Insert']
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
      .select('id, slug, sku, category_id, collection_id, currency, base_price, compare_at_price, stock_status, is_featured, is_active, material, dimensions, metadata, created_at, updated_at')
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

function optionalText(values: Record<string, unknown>, field: string) {
  const value = values[field]
  if (value == null || value === '') {
    return null
  }
  if (typeof value !== 'string') {
    throw new Error(`${field} must be text.`)
  }
  return value.trim() || null
}

function optionalId(values: Record<string, unknown>, field: string) {
  const value = optionalText(values, field)
  if (value == null) {
    return null
  }
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) {
    throw new Error(`${field} must be a valid selection.`)
  }
  return value
}

function numberValue(values: Record<string, unknown>, field: string, nullable = false) {
  const value = values[field]
  if (nullable && value == null) {
    return null
  }
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

function isJsonValue(value: unknown): value is Json {
  if (value === null || ['string', 'number', 'boolean'].includes(typeof value)) {
    return true
  }
  if (Array.isArray(value)) {
    return value.every(isJsonValue)
  }
  return (
    typeof value === 'object' &&
    Object.values(value).every(isJsonValue)
  )
}

function productValues(values: Record<string, unknown>): ProductInsert {
  const stockStatus = values.stock_status
  if (stockStatus !== 'draft' && stockStatus !== 'active' && stockStatus !== 'archived') {
    throw new Error('stock_status must be selected.')
  }
  const metadata = values.metadata
  if (metadata != null && !isJsonValue(metadata)) {
    throw new Error('metadata must be valid JSON.')
  }
  const nameEn = requiredText(values, 'name_en')
  const nameHi = optionalText(values, 'name_hi')
  const descriptionEn = optionalText(values, 'description_en')
  const descriptionHi = optionalText(values, 'description_hi')

  const basePriceValue = numberValue(values, 'base_price')
  if (basePriceValue == null) {
    throw new Error('base_price is required.')
  }
  const basePrice = basePriceValue
  const compareAtPrice = numberValue(values, 'compare_at_price', true)
  if (basePrice < 0 || (compareAtPrice != null && compareAtPrice < basePrice)) {
    throw new Error('Prices must be non-negative, and the compare-at price cannot be lower than the base price.')
  }

  return {
    slug: requiredText(values, 'slug'),
    sku: requiredText(values, 'sku'),
    category_id: optionalId(values, 'category_id'),
    collection_id: optionalId(values, 'collection_id'),
    currency: requiredText(values, 'currency').toUpperCase(),
    base_price: basePrice,
    compare_at_price: compareAtPrice,
    stock_status: stockStatus,
    is_featured: booleanValue(values, 'is_featured'),
    is_active: booleanValue(values, 'is_active'),
    material: optionalText(values, 'material'),
    dimensions: optionalText(values, 'dimensions'),
    metadata: withProductContent(metadata ?? null, {
      name: { en: nameEn, hi: nameHi },
      description: { en: descriptionEn, hi: descriptionHi },
    }),
  }
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
  const workspace = useQuery({
    queryKey: queryKeys.dashboard.all,
    queryFn: fetchCatalogWorkspace,
  })

  const categoryOptions = useMemo(
    () => optionize(workspace.data?.categories ?? []),
    [workspace.data?.categories],
  )

  const collectionOptions = useMemo(
    () => optionize(workspace.data?.collections ?? []),
    [workspace.data?.collections],
  )

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
  const productFields: CrudField[] = [
    { name: 'slug', label: 'Slug', type: 'text', placeholder: 'sacred-kalash-set', required: true, nullable: false },
    { name: 'sku', label: 'SKU', type: 'text', placeholder: 'KMS-1001', required: true, nullable: false },
    {
      name: 'name_en',
      label: 'Product name (English)',
      type: 'text',
      placeholder: 'Sacred Kalash Set',
      required: true,
      nullable: false,
      getValue: (row) => {
        const metadata = row.metadata
        return readProductContent(
          metadata != null && isJsonValue(metadata) ? metadata : null,
          'name',
          'en',
        ) ?? humanizeSlug(String(row.slug ?? ''))
      },
    },
    {
      name: 'name_hi',
      label: 'Product name (Hindi)',
      type: 'text',
      placeholder: 'पवित्र कलश सेट',
      getValue: (row) => readProductContent(
        row.metadata != null && isJsonValue(row.metadata) ? row.metadata : null,
        'name',
        'hi',
      ) ?? '',
    },
    {
      name: 'description_en',
      label: 'Description (English)',
      type: 'textarea',
      placeholder: 'Describe the product for customers.',
      getValue: (row) => readProductContent(
        row.metadata != null && isJsonValue(row.metadata) ? row.metadata : null,
        'description',
        'en',
      ) ?? '',
    },
    {
      name: 'description_hi',
      label: 'Description (Hindi)',
      type: 'textarea',
      placeholder: 'ग्राहकों के लिए उत्पाद का विवरण लिखें।',
      getValue: (row) => readProductContent(
        row.metadata != null && isJsonValue(row.metadata) ? row.metadata : null,
        'description',
        'hi',
      ) ?? '',
    },
    { name: 'category_id', label: 'Category', type: 'select', options: categoryOptions },
    { name: 'collection_id', label: 'Collection', type: 'select', options: collectionOptions },
    { name: 'currency', label: 'Currency', type: 'text', placeholder: 'INR', required: true, nullable: false, defaultValue: 'INR' },
    { name: 'base_price', label: 'Base price', type: 'number', placeholder: '4999', required: true, nullable: false },
    { name: 'compare_at_price', label: 'Compare at price', type: 'number', placeholder: '5999' },
    {
      name: 'stock_status',
      label: 'Stock status',
      type: 'select',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Active', value: 'active' },
        { label: 'Archived', value: 'archived' },
      ],
      defaultValue: 'draft',
      helperText: 'Draft products are hidden from customers. Set to Active after the product details and images are ready.',
      required: true,
      nullable: false,
    },
    { name: 'is_featured', label: 'Featured product', type: 'boolean' },
    { name: 'is_active', label: 'Visible', type: 'boolean', defaultValue: true },
    { name: 'material', label: 'Material', type: 'text', placeholder: 'Copper, brass, and lacquer' },
    { name: 'dimensions', label: 'Dimensions', type: 'text', placeholder: 'Height 18 cm' },
    { name: 'metadata', label: 'Metadata', type: 'json', helperText: 'Store product details, badges, and SEO data as JSON.' },
  ]

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
      <Seo title="Catalog" description="Manage products, categories, collections, and media in Supabase." />
      <SectionHeading
        eyebrow="Super Admin"
        title="Catalog"
        description="Products, categories, collections, and Cloudinary media are edited directly in the database."
      />

      <div className="flex flex-wrap gap-2">
        <Badge variant="premium">Live CRUD</Badge>
        <Badge variant="outline">{data?.products.length ?? 0} products</Badge>
        <Badge variant="outline">{data?.collections.length ?? 0} collections</Badge>
        <Badge variant="outline">{data?.categories.length ?? 0} categories</Badge>
      </div>

      <AdminResourcePanel<ProductRow>
        title="Products"
        description="Create and publish products with English and Hindi names, descriptions, pricing, stock, and catalog placement. Add product images below by URL or Cloudinary upload."
        rows={data?.products ?? []}
        fields={productFields}
        rowKey="id"
        createLabel="Add product"
        columns={[
          { label: 'Product', render: (row) => readProductContent(row.metadata, 'name', 'en') ?? humanizeSlug(row.slug) },
          { label: 'SKU', render: (row) => row.sku },
          { label: 'Price', render: (row) => `${row.currency} ${Number(row.base_price).toFixed(2)}` },
          { label: 'Status', render: (row) => row.stock_status },
          { label: 'Visibility', render: (row) => row.is_active ? 'Visible' : 'Hidden' },
          {
            label: 'Featured',
            render: (row) => (row.is_featured ? 'Yes' : 'No'),
          },
        ]}
        onCreate={async (values) => {
          const supabase = getSupabaseBrowserClient()
          const { error } = await supabase.from('products').insert(productValues(values))
          if (error) throw error
        }}
        onUpdate={async (row, values) => {
          const supabase = getSupabaseBrowserClient()
          const { error } = await supabase.from('products').update(productValues(values)).eq('id', row.id)
          if (error) throw error
        }}
        onDelete={async (row) => {
          const supabase = getSupabaseBrowserClient()
          const { error } = await supabase.from('products').delete().eq('id', row.id)
          if (error) throw error
        }}
        onRefresh={() => {
          void workspace.refetch()
        }}
      />

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
            void workspace.refetch()
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
            void workspace.refetch()
          }}
        />
      </div>
    </div>
  )
}
