import { useState, type ReactNode } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Loader2, Plus, Trash2 } from 'lucide-react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'

import { ProductImagesPanel } from '@/features/admin/ui/product-images-panel'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { SectionHeading } from '@/components/layout/section-heading'
import { Seo } from '@/components/layout/seo'
import { LoadingScreen } from '@/components/layout/loading-screen'
import { queryKeys } from '@/shared/api/keys'
import { getSupabaseBrowserClient } from '@/shared/api/supabase'
import { routes } from '@/shared/config/routes'
import { useAuth } from '@/shared/auth/provider'
import { useLocale } from '@/shared/hooks/use-locale'
import { slugify } from '@/shared/lib/format'
import { readProductContent, withProductContent } from '@/shared/lib/product-content'
import type { Database, Json } from '@/shared/types/database'

type ProductRow = Database['public']['Tables']['products']['Row']
type ProductVariant = Database['public']['Tables']['product_variants']['Row']
type Status = ProductRow['stock_status']

type VariantDraft = {
  id: string | null
  title: string
  optionValues: string
  sku: string
  barcode: string
  price: string
  compareAtPrice: string
  trackInventory: boolean
  inventoryQuantity: string
  continueSelling: boolean
  weight: string
  isActive: boolean
}

type ProductDraft = {
  title: string
  titleHi: string
  slug: string
  sku: string
  barcode: string
  status: Status
  description: string
  shortDescription: string
  productType: string
  vendor: string
  categoryId: string
  collectionIds: string[]
  tags: string
  isFeatured: boolean
  price: string
  compareAtPrice: string
  costPerItem: string
  currency: string
  taxable: boolean
  trackInventory: boolean
  inventoryQuantity: string
  continueSelling: boolean
  lowStockThreshold: string
  inventoryReason: string
  isPhysical: boolean
  weight: string
  weightUnit: string
  length: string
  width: string
  height: string
  measurementUnit: string
  countryOfOrigin: string
  hsCode: string
  material: string
  dimensions: string
  productOptions: string
  seoTitle: string
  seoDescription: string
}

const emptyDraft: ProductDraft = {
  title: '',
  titleHi: '',
  slug: '',
  sku: '',
  barcode: '',
  status: 'draft',
  description: '',
  shortDescription: '',
  productType: '',
  vendor: '',
  categoryId: '',
  collectionIds: [],
  tags: '',
  isFeatured: false,
  price: '',
  compareAtPrice: '',
  costPerItem: '',
  currency: 'INR',
  taxable: true,
  trackInventory: false,
  inventoryQuantity: '0',
  continueSelling: false,
  lowStockThreshold: '5',
  inventoryReason: '',
  isPhysical: true,
  weight: '',
  weightUnit: 'kg',
  length: '',
  width: '',
  height: '',
  measurementUnit: 'cm',
  countryOfOrigin: 'IN',
  hsCode: '',
  material: '',
  dimensions: '',
  productOptions: '[]',
  seoTitle: '',
  seoDescription: '',
}

function emptyVariant(): VariantDraft {
  return {
    id: null,
    title: '',
    optionValues: '{}',
    sku: '',
    barcode: '',
    price: '',
    compareAtPrice: '',
    trackInventory: true,
    inventoryQuantity: '0',
    continueSelling: false,
    weight: '',
    isActive: true,
  }
}

function numberField(value: string, label: string, required = false) {
  if (!value.trim() && !required) return null
  if (!value.trim() && required) throw new Error(`${label} is required.`)
  const result = Number(value)
  if (!Number.isFinite(result) || result < 0) {
    throw new Error(`${label} must be a non-negative number.`)
  }
  return result
}

function integerField(value: string, label: string) {
  const result = Number(value)
  if (!Number.isInteger(result) || result < 0) {
    throw new Error(`${label} must be a non-negative whole number.`)
  }
  return result
}

function parseJsonObject(value: string, label: string): Json {
  let parsed: unknown
  try {
    parsed = JSON.parse(value)
  } catch {
    throw new Error(`${label} must contain valid JSON.`)
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error(`${label} must be a JSON object.`)
  }
  return parsed as Json
}

function parseJsonArray(value: string, label: string): Json {
  let parsed: unknown
  try {
    parsed = JSON.parse(value)
  } catch {
    throw new Error(`${label} must contain valid JSON.`)
  }
  if (!Array.isArray(parsed)) throw new Error(`${label} must be a JSON array.`)
  return parsed as Json
}

function asJsonObject(value: Json | null) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {}
}

async function fetchProductBundle(productId: string) {
  const supabase = getSupabaseBrowserClient()
  const [productResult, variantsResult, collectionsResult, assignmentsResult] = await Promise.all([
    supabase.from('products').select('*').eq('id', productId).maybeSingle(),
    supabase.from('product_variants').select('*').eq('product_id', productId).order('sort_order'),
    supabase.from('product_collections').select('collection_id').eq('product_id', productId),
    supabase.from('product_tag_assignments').select('tag_id').eq('product_id', productId),
  ])
  const firstError =
    productResult.error ??
    variantsResult.error ??
    collectionsResult.error ??
    assignmentsResult.error
  if (firstError) throw firstError
  if (!productResult.data) throw new Error('This product no longer exists.')

  const tagIds = (assignmentsResult.data ?? []).map((row) => row.tag_id)
  let tags: string[] = []
  if (tagIds.length) {
    const { data, error } = await supabase.from('product_tags').select('name').in('id', tagIds)
    if (error) throw error
    tags = (data ?? []).map((row) => row.name)
  }
  return {
    product: productResult.data as ProductRow,
    variants: (variantsResult.data ?? []) as ProductVariant[],
    collectionIds: (collectionsResult.data ?? []).map((row) => row.collection_id),
    tags,
  }
}

function draftFromBundle(bundle: Awaited<ReturnType<typeof fetchProductBundle>>, duplicate: boolean): ProductDraft {
  const product = bundle.product
  const metadata = asJsonObject(product.metadata)
  return {
    ...emptyDraft,
    title: `${readProductContent(product.metadata, 'name', 'en') ?? ''}${duplicate ? ' Copy' : ''}`,
    titleHi: readProductContent(product.metadata, 'name', 'hi') ?? '',
    slug: `${product.slug}${duplicate ? '-copy' : ''}`,
    sku: duplicate ? '' : product.sku,
    barcode: duplicate ? '' : product.barcode ?? '',
    status: duplicate ? 'draft' : product.stock_status,
    description: readProductContent(product.metadata, 'description', 'en') ?? '',
    shortDescription: product.short_description ?? '',
    productType: product.product_type ?? '',
    vendor: product.vendor ?? '',
    categoryId: product.category_id ?? '',
    collectionIds: bundle.collectionIds.length
      ? bundle.collectionIds
      : product.collection_id ? [product.collection_id] : [],
    tags: bundle.tags.join(', '),
    isFeatured: product.is_featured,
    price: String(product.base_price),
    compareAtPrice: product.compare_at_price == null ? '' : String(product.compare_at_price),
    costPerItem: product.cost_per_item == null ? '' : String(product.cost_per_item),
    currency: product.currency,
    taxable: product.taxable,
    trackInventory: product.track_inventory,
    inventoryQuantity: duplicate ? '0' : String(product.inventory_quantity),
    continueSelling: product.continue_selling_when_out_of_stock,
    lowStockThreshold: String(product.low_stock_threshold),
    isPhysical: product.is_physical,
    weight: product.weight == null ? '' : String(product.weight),
    weightUnit: product.weight_unit,
    length: product.length == null ? '' : String(product.length),
    width: product.width == null ? '' : String(product.width),
    height: product.height == null ? '' : String(product.height),
    measurementUnit: product.measurement_unit,
    countryOfOrigin: product.country_of_origin ?? '',
    hsCode: product.hs_code ?? '',
    material: product.material ?? '',
    dimensions: product.dimensions ?? '',
    productOptions: JSON.stringify(product.product_options, null, 2),
    seoTitle: typeof metadata.seo_title === 'string' ? metadata.seo_title : '',
    seoDescription: typeof metadata.seo_description === 'string' ? metadata.seo_description : '',
    inventoryReason: '',
  }
}

function variantsFromBundle(variants: ProductVariant[], duplicate: boolean): VariantDraft[] {
  return variants.map((variant) => ({
    id: duplicate ? null : variant.id,
    title: variant.title,
    optionValues: JSON.stringify(variant.option_values, null, 2),
    sku: duplicate ? '' : variant.sku ?? '',
    barcode: duplicate ? '' : variant.barcode ?? '',
    price: String(variant.price),
    compareAtPrice: variant.compare_at_price == null ? '' : String(variant.compare_at_price),
    trackInventory: variant.track_inventory,
    inventoryQuantity: duplicate ? '0' : String(variant.inventory_quantity),
    continueSelling: variant.continue_selling_when_out_of_stock,
    weight: variant.weight == null ? '' : String(variant.weight),
    isActive: variant.is_active,
  }))
}

function Field({
  label,
  id,
  children,
  helper,
}: {
  label: string
  id: string
  children: ReactNode
  helper?: string
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {helper ? <p className="text-xs text-muted-foreground">{helper}</p> : null}
    </div>
  )
}

export function Component() {
  const { productId } = useParams()
  const [searchParams] = useSearchParams()
  const duplicateSourceId = searchParams.get('duplicate')
  const sourceId = productId ?? duplicateSourceId ?? ''
  const isDuplicate = Boolean(duplicateSourceId && !productId)
  const locale = useLocale()
  const auth = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [draft, setDraft] = useState<ProductDraft>(emptyDraft)
  const [variants, setVariants] = useState<VariantDraft[]>([])
  const [loadedProduct, setLoadedProduct] = useState<ProductRow | null>(null)
  const [initializedSourceId, setInitializedSourceId] = useState('')
  const [handleManuallyEdited, setHandleManuallyEdited] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const bundleQuery = useQuery({
    queryKey: [...queryKeys.admin.products, 'editor', sourceId],
    queryFn: () => fetchProductBundle(sourceId),
    enabled: Boolean(sourceId),
  })
  const taxonomies = useQuery({
    queryKey: [...queryKeys.admin.products, 'editor-options'],
    queryFn: async () => {
      const supabase = getSupabaseBrowserClient()
      const [categories, collections] = await Promise.all([
        supabase.from('categories').select('id, slug').eq('is_active', true).order('slug'),
        supabase.from('collections').select('id, slug').eq('is_active', true).order('slug'),
      ])
      if (categories.error) throw categories.error
      if (collections.error) throw collections.error
      return { categories: categories.data ?? [], collections: collections.data ?? [] }
    },
  })

  if (sourceId && bundleQuery.data && initializedSourceId !== sourceId) {
    setLoadedProduct(bundleQuery.data.product)
    setDraft(draftFromBundle(bundleQuery.data, isDuplicate))
    setVariants(variantsFromBundle(bundleQuery.data.variants, isDuplicate))
    setHandleManuallyEdited(false)
    setInitializedSourceId(sourceId)
  }

  const saveProduct = useMutation({
    mutationFn: async () => {
      setErrorMessage(null)
      if (!auth.user) throw new Error('Your administrator session has expired. Sign in again.')
      let slug = draft.slug.trim()
      if (!draft.title.trim()) throw new Error('Product title is required.')
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
        throw new Error('Product handle must use lowercase letters, numbers, and hyphens.')
      }
      const supabase = getSupabaseBrowserClient()
      if (!productId && !handleManuallyEdited) {
        const { data: matchingHandles, error: handlesError } = await supabase
          .from('products')
          .select('slug')
          .like('slug', `${slug}%`)
        if (handlesError) throw handlesError
        const usedHandles = new Set((matchingHandles ?? []).map((product) => product.slug))
        const baseSlug = slug
        let suffix = 2
        while (usedHandles.has(slug)) {
          slug = `${baseSlug}-${suffix}`
          suffix += 1
        }
        if (slug !== draft.slug) setField('slug', slug)
      } else {
        const { data: matchingHandle, error: handleError } = await supabase
          .from('products')
          .select('id')
          .eq('slug', slug)
          .maybeSingle()
        if (handleError) throw handleError
        if (matchingHandle && matchingHandle.id !== productId) {
          throw new Error('That product handle is already in use. Choose a unique handle.')
        }
      }
      if (!draft.sku.trim()) throw new Error('SKU is required.')
      if (!/^[A-Z]{3}$/.test(draft.currency.trim().toUpperCase())) {
        throw new Error('Currency must be a three-letter ISO code such as INR.')
      }
      const price = numberField(draft.price, 'Selling price', true)
      const compareAt = numberField(draft.compareAtPrice, 'Compare-at price')
      if (compareAt != null && compareAt < (price ?? 0)) {
        throw new Error('Compare-at price must be at least the selling price.')
      }
      const productOptions = parseJsonArray(draft.productOptions, 'Product options')
      const variantPayload = variants.map((variant, index) => {
        const variantPrice = numberField(variant.price, `Variant ${index + 1} price`, true)
        const variantCompareAt = numberField(variant.compareAtPrice, `Variant ${index + 1} compare-at price`)
        if (variantCompareAt != null && variantCompareAt < (variantPrice ?? 0)) {
          throw new Error(`Variant ${index + 1} compare-at price must be at least its price.`)
        }
        if (!variant.title.trim()) throw new Error(`Variant ${index + 1} needs a title.`)
        return {
          id: variant.id,
          title: variant.title.trim(),
          option_values: parseJsonObject(variant.optionValues, `Variant ${index + 1} option values`),
          sku: variant.sku.trim() || null,
          barcode: variant.barcode.trim() || null,
          price: variantPrice,
          compare_at_price: variantCompareAt,
          track_inventory: variant.trackInventory,
          inventory_quantity: integerField(variant.inventoryQuantity, `Variant ${index + 1} inventory`),
          continue_selling_when_out_of_stock: variant.continueSelling,
          weight: numberField(variant.weight, `Variant ${index + 1} weight`),
          is_active: variant.isActive,
          sort_order: index,
        }
      })
      const productOptionsMetadata = withProductContent(
        loadedProduct?.metadata ?? (isDuplicate ? bundleQuery.data?.product.metadata ?? null : null),
        {
          name: { en: draft.title.trim(), hi: draft.titleHi.trim() || null },
          description: { en: draft.description.trim() || null, hi: null },
        },
      )
      const metadataObject = asJsonObject(productOptionsMetadata)
      const productMetadata: Json = {
        ...metadataObject,
        seo_title: draft.seoTitle.trim() || null,
        seo_description: draft.seoDescription.trim() || null,
      }
      const productPayload: Json = {
        slug,
        sku: draft.sku.trim(),
        barcode: draft.barcode.trim() || null,
        product_type: draft.productType.trim() || null,
        vendor: draft.vendor.trim() || null,
        short_description: draft.shortDescription.trim() || null,
        category_id: draft.categoryId || null,
        collection_id: draft.collectionIds[0] ?? null,
        currency: draft.currency.trim().toUpperCase(),
        base_price: price,
        compare_at_price: compareAt,
        cost_per_item: numberField(draft.costPerItem, 'Cost per item'),
        taxable: draft.taxable,
        track_inventory: draft.trackInventory,
        inventory_quantity: integerField(draft.inventoryQuantity, 'Inventory quantity'),
        continue_selling_when_out_of_stock: draft.continueSelling,
        low_stock_threshold: integerField(draft.lowStockThreshold, 'Low-stock threshold'),
        is_physical: draft.isPhysical,
        weight: numberField(draft.weight, 'Weight'),
        weight_unit: draft.weightUnit,
        length: numberField(draft.length, 'Length'),
        width: numberField(draft.width, 'Width'),
        height: numberField(draft.height, 'Height'),
        measurement_unit: draft.measurementUnit,
        country_of_origin: draft.countryOfOrigin.trim() || null,
        hs_code: draft.hsCode.trim() || null,
        product_options: productOptions,
        stock_status: draft.status,
        is_active: draft.status === 'active',
        is_featured: draft.isFeatured,
        material: draft.material.trim() || null,
        dimensions: draft.dimensions.trim() || null,
        metadata: productMetadata,
      }
      const tags = Array.from(new Set(draft.tags.split(',').map((tag) => tag.trim()).filter(Boolean)))
      const { data, error } = await supabase.rpc('admin_save_product', {
        p_product_id: isDuplicate ? null : productId ?? null,
        p_product: productPayload,
        p_variants: variantPayload as Json,
        p_collection_ids: draft.collectionIds,
        p_tags: tags,
        p_inventory_reason: draft.inventoryReason.trim() || null,
      })
      if (error?.code === '23505') {
        throw new Error('The handle, SKU, barcode, or variant identifier conflicts with an existing product.')
      }
      if (error) throw error
      if (!data) throw new Error('Supabase did not return the saved product identifier.')

      if (isDuplicate && bundleQuery.data) {
        const { data: sourceImages, error: sourceImagesError } = await getSupabaseBrowserClient()
          .from('product_images')
          .select('media_id, sort_order, is_primary, alt_key')
          .eq('product_id', bundleQuery.data.product.id)
          .order('sort_order')
        if (sourceImagesError) throw sourceImagesError
        if (sourceImages?.length) {
          const { error: copyImagesError } = await getSupabaseBrowserClient()
            .from('product_images')
            .insert(sourceImages.map((image) => ({ ...image, product_id: data })))
          if (copyImagesError) throw copyImagesError
        }
      }
      return data
    },
    onSuccess: async (savedProductId) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.admin.products }),
        queryClient.invalidateQueries({ queryKey: queryKeys.catalog.products }),
        queryClient.invalidateQueries({ queryKey: queryKeys.catalog.collections }),
        queryClient.invalidateQueries({ queryKey: queryKeys.pages.all }),
      ])
      toast.success(isDuplicate ? 'Product duplicated' : productId ? 'Product updated' : 'Product created')
      navigate(routes.forLocale(locale, `admin/products/${savedProductId}`), { replace: true })
    },
    onError: (error: Error) => setErrorMessage(error.message),
  })

  const setField = <K extends keyof ProductDraft>(key: K, value: ProductDraft[K]) => {
    setDraft((current) => ({ ...current, [key]: value }))
  }
  const updateVariant = (index: number, update: Partial<VariantDraft>) => {
    setVariants((current) => current.map((variant, itemIndex) =>
      itemIndex === index ? { ...variant, ...update } : variant,
    ))
  }

  if (bundleQuery.isLoading || taxonomies.isLoading) {
    return <LoadingScreen className="min-h-[70svh]" />
  }
  if (bundleQuery.error || taxonomies.error) {
    const error = bundleQuery.error ?? taxonomies.error
    return (
      <main className="container space-y-8 py-10">
        <Seo title="Product" />
        <Alert
          title="Product editor could not be loaded"
          description={error instanceof Error ? error.message : 'Supabase could not load the product editor.'}
          variant="error"
        />
        <Button asChild variant="outline"><Link to={routes.forLocale(locale, 'admin/products')}>Back to products</Link></Button>
      </main>
    )
  }

  const duplicateSource = isDuplicate ? bundleQuery.data?.product : null
  const imageProduct = productId ? loadedProduct : null
  const submitLabel = productId ? 'Save product' : isDuplicate ? 'Create duplicate' : 'Create product'

  return (
    <main className="container space-y-8 py-10">
      <Seo title={productId ? 'Edit product' : isDuplicate ? 'Duplicate product' : 'Add product'} />
      <div className="flex flex-wrap items-center justify-between gap-4">
        <SectionHeading
          eyebrow="Super Admin · Products"
          title={productId ? 'Edit product' : isDuplicate ? 'Duplicate product' : 'Add product'}
          description="Manage product content, pricing, inventory, options, and publishing. Changes are saved to Supabase."
        />
        <Button asChild variant="outline"><Link to={routes.forLocale(locale, 'admin/products')}><ArrowLeft className="h-4 w-4" /> Back to products</Link></Button>
      </div>

      {duplicateSource ? (
        <Alert title="Creating a separate product" description={`This copies the content, options, tags, collections, and image links from ${duplicateSource.slug}. Set a unique handle and SKU before saving.`} />
      ) : null}
      {errorMessage ? <Alert title="Product could not be saved" description={errorMessage} variant="error" /> : null}

      <form
        className="space-y-6"
        onSubmit={(event) => {
          event.preventDefault()
          saveProduct.mutate()
        }}
      >
        <Card>
          <CardContent className="space-y-5 p-6">
            <div>
              <h2 className="font-display text-2xl font-semibold">Product information</h2>
              <p className="mt-1 text-sm text-muted-foreground">Title, description, publication, and organization.</p>
            </div>
            <div className="grid gap-5 lg:grid-cols-2">
              <Field id="product-title" label="Product title (English) *">
                <Input id="product-title" value={draft.title} required onChange={(event) => {
                  const title = event.target.value
                  setField('title', title)
                  if (!productId && !isDuplicate && !handleManuallyEdited) {
                    setField('slug', slugify(title))
                  }
                }} />
              </Field>
              <Field id="product-title-hi" label="Product title (Hindi)">
                <Input id="product-title-hi" value={draft.titleHi} onChange={(event) => setField('titleHi', event.target.value)} />
              </Field>
              <Field id="product-handle" label="URL handle *" helper="Lowercase letters, numbers, and hyphens. Must be unique.">
                <Input id="product-handle" value={draft.slug} required onChange={(event) => {
                  setHandleManuallyEdited(true)
                  setField('slug', event.target.value)
                }} />
              </Field>
              <Field id="product-status" label="Status">
                <Select id="product-status" value={draft.status} onChange={(event) => setField('status', event.target.value as Status)}>
                  <option value="draft">Draft</option><option value="active">Active</option><option value="archived">Archived</option>
                </Select>
              </Field>
              <Field id="product-description" label="Description" helper="Plain text description; rendered as text rather than unsafe HTML.">
                <Textarea id="product-description" value={draft.description} onChange={(event) => setField('description', event.target.value)} />
              </Field>
              <Field id="product-short-description" label="Short description">
                <Textarea id="product-short-description" value={draft.shortDescription} onChange={(event) => setField('shortDescription', event.target.value)} />
              </Field>
              <Field id="product-type" label="Product type">
                <Input id="product-type" value={draft.productType} onChange={(event) => setField('productType', event.target.value)} />
              </Field>
              <Field id="product-vendor" label="Vendor / brand">
                <Input id="product-vendor" value={draft.vendor} onChange={(event) => setField('vendor', event.target.value)} />
              </Field>
              <Field id="product-category" label="Category">
                <Select id="product-category" value={draft.categoryId} onChange={(event) => setField('categoryId', event.target.value)}>
                  <option value="">No category</option>
                  {(taxonomies.data?.categories ?? []).map((category) => <option key={category.id} value={category.id}>{category.slug}</option>)}
                </Select>
              </Field>
              <Field id="product-tags" label="Tags" helper="Comma-separated product tags.">
                <Input id="product-tags" value={draft.tags} onChange={(event) => setField('tags', event.target.value)} />
              </Field>
            </div>
            <div className="space-y-2">
              <Label>Collections</Label>
              <div className="flex flex-wrap gap-3">
                {(taxonomies.data?.collections ?? []).map((collection) => (
                  <label key={collection.id} className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-2 text-sm">
                    <input
                      type="checkbox"
                      checked={draft.collectionIds.includes(collection.id)}
                      onChange={(event) => setField('collectionIds', event.target.checked
                        ? [...draft.collectionIds, collection.id]
                        : draft.collectionIds.filter((id) => id !== collection.id))}
                    />
                    {collection.slug}
                  </label>
                ))}
                {taxonomies.data?.collections.length === 0 ? <p className="text-sm text-muted-foreground">Create collections from Admin → Catalog.</p> : null}
              </div>
            </div>
            <label className="inline-flex items-center gap-2 text-sm">
              <input type="checkbox" checked={draft.isFeatured} onChange={(event) => setField('isFeatured', event.target.checked)} />
              Feature this product
            </label>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-5 p-6">
            <div>
              <h2 className="font-display text-2xl font-semibold">Pricing</h2>
              <p className="mt-1 text-sm text-muted-foreground">Checkout always recalculates price from current database values.</p>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <Field id="product-price" label="Selling price *"><Input id="product-price" type="number" min="0" step="0.01" required value={draft.price} onChange={(event) => setField('price', event.target.value)} /></Field>
              <Field id="product-compare-price" label="Compare-at price"><Input id="product-compare-price" type="number" min="0" step="0.01" value={draft.compareAtPrice} onChange={(event) => setField('compareAtPrice', event.target.value)} /></Field>
              <Field id="product-cost" label="Cost per item"><Input id="product-cost" type="number" min="0" step="0.01" value={draft.costPerItem} onChange={(event) => setField('costPerItem', event.target.value)} /></Field>
              <Field id="product-currency" label="Currency"><Input id="product-currency" maxLength={3} value={draft.currency} onChange={(event) => setField('currency', event.target.value.toUpperCase())} /></Field>
            </div>
            <label className="inline-flex items-center gap-2 text-sm">
              <input type="checkbox" checked={draft.taxable} onChange={(event) => setField('taxable', event.target.checked)} />
              Charge tax on this product (tax calculation is not configured in the current checkout)
            </label>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-5 p-6">
            <div>
              <h2 className="font-display text-2xl font-semibold">Inventory</h2>
              <p className="mt-1 text-sm text-muted-foreground">Tracked stock is locked and adjusted in the same transaction as an order.</p>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <Field id="product-sku" label="SKU *"><Input id="product-sku" required value={draft.sku} onChange={(event) => setField('sku', event.target.value)} /></Field>
              <Field id="product-barcode" label="Barcode"><Input id="product-barcode" value={draft.barcode} onChange={(event) => setField('barcode', event.target.value)} /></Field>
              <Field id="product-inventory" label="Available quantity"><Input id="product-inventory" type="number" min="0" step="1" value={draft.inventoryQuantity} onChange={(event) => setField('inventoryQuantity', event.target.value)} /></Field>
              <Field id="product-low-stock" label="Low-stock threshold"><Input id="product-low-stock" type="number" min="0" step="1" value={draft.lowStockThreshold} onChange={(event) => setField('lowStockThreshold', event.target.value)} /></Field>
              {loadedProduct && draft.trackInventory ? (
                <Field id="inventory-reason" label="Inventory adjustment reason" helper="Required when changing tracked inventory.">
                  <Input id="inventory-reason" value={draft.inventoryReason} onChange={(event) => setField('inventoryReason', event.target.value)} />
                </Field>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-3">
              <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={draft.trackInventory} onChange={(event) => setField('trackInventory', event.target.checked)} />Track inventory</label>
              <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={draft.continueSelling} onChange={(event) => setField('continueSelling', event.target.checked)} />Continue selling when out of stock</label>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-5 p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-2xl font-semibold">Variants</h2>
                <p className="mt-1 text-sm text-muted-foreground">Each saved option has its own stable ID, price, SKU, availability, and inventory.</p>
              </div>
              <Button type="button" variant="outline" onClick={() => setVariants((current) => [...current, emptyVariant()])}><Plus className="h-4 w-4" /> Add variant</Button>
            </div>
            <Field id="product-options" label="Option definitions (JSON array)" helper='Example: [{"name":"Size","values":["Small","Large"]}]. Define variant-specific combinations below.'>
              <Textarea id="product-options" className="font-mono text-xs" value={draft.productOptions} onChange={(event) => setField('productOptions', event.target.value)} />
            </Field>
            {variants.map((variant, index) => (
              <div key={variant.id ?? `new-${index}`} className="space-y-4 rounded-[var(--radius-card)] border border-border p-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Variant {index + 1}</h3>
                  <Button type="button" variant="ghost" size="icon-sm" aria-label={`Remove variant ${index + 1}`} onClick={() => setVariants((current) => current.filter((_, itemIndex) => itemIndex !== index))}><Trash2 className="h-4 w-4" /></Button>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <Field id={`variant-title-${index}`} label="Option title *"><Input id={`variant-title-${index}`} value={variant.title} onChange={(event) => updateVariant(index, { title: event.target.value })} /></Field>
                  <Field id={`variant-values-${index}`} label="Option values (JSON)"><Input id={`variant-values-${index}`} value={variant.optionValues} onChange={(event) => updateVariant(index, { optionValues: event.target.value })} /></Field>
                  <Field id={`variant-sku-${index}`} label="SKU"><Input id={`variant-sku-${index}`} value={variant.sku} onChange={(event) => updateVariant(index, { sku: event.target.value })} /></Field>
                  <Field id={`variant-barcode-${index}`} label="Barcode"><Input id={`variant-barcode-${index}`} value={variant.barcode} onChange={(event) => updateVariant(index, { barcode: event.target.value })} /></Field>
                  <Field id={`variant-price-${index}`} label="Price *"><Input id={`variant-price-${index}`} type="number" min="0" step="0.01" value={variant.price} onChange={(event) => updateVariant(index, { price: event.target.value })} /></Field>
                  <Field id={`variant-compare-${index}`} label="Compare-at price"><Input id={`variant-compare-${index}`} type="number" min="0" step="0.01" value={variant.compareAtPrice} onChange={(event) => updateVariant(index, { compareAtPrice: event.target.value })} /></Field>
                  <Field id={`variant-inventory-${index}`} label="Available quantity"><Input id={`variant-inventory-${index}`} type="number" min="0" step="1" value={variant.inventoryQuantity} onChange={(event) => updateVariant(index, { inventoryQuantity: event.target.value })} /></Field>
                  <Field id={`variant-weight-${index}`} label="Weight"><Input id={`variant-weight-${index}`} type="number" min="0" step="0.001" value={variant.weight} onChange={(event) => updateVariant(index, { weight: event.target.value })} /></Field>
                </div>
                <div className="flex flex-wrap gap-x-6 gap-y-3">
                  <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={variant.trackInventory} onChange={(event) => updateVariant(index, { trackInventory: event.target.checked })} />Track variant inventory</label>
                  <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={variant.continueSelling} onChange={(event) => updateVariant(index, { continueSelling: event.target.checked })} />Continue selling when empty</label>
                  <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={variant.isActive} onChange={(event) => updateVariant(index, { isActive: event.target.checked })} />Available</label>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-5 p-6">
            <div><h2 className="font-display text-2xl font-semibold">Shipping and physical details</h2><p className="mt-1 text-sm text-muted-foreground">Saved for later shipping and tax calculation integration.</p></div>
            <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={draft.isPhysical} onChange={(event) => setField('isPhysical', event.target.checked)} />This is a physical product</label>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Field id="product-weight" label="Weight"><Input id="product-weight" type="number" min="0" step="0.001" value={draft.weight} onChange={(event) => setField('weight', event.target.value)} /></Field>
              <Field id="product-weight-unit" label="Weight unit"><Select id="product-weight-unit" value={draft.weightUnit} onChange={(event) => setField('weightUnit', event.target.value)}><option value="kg">kg</option><option value="g">g</option><option value="lb">lb</option><option value="oz">oz</option></Select></Field>
              <Field id="product-length" label="Length"><Input id="product-length" type="number" min="0" step="0.01" value={draft.length} onChange={(event) => setField('length', event.target.value)} /></Field>
              <Field id="product-width" label="Width"><Input id="product-width" type="number" min="0" step="0.01" value={draft.width} onChange={(event) => setField('width', event.target.value)} /></Field>
              <Field id="product-height" label="Height"><Input id="product-height" type="number" min="0" step="0.01" value={draft.height} onChange={(event) => setField('height', event.target.value)} /></Field>
              <Field id="product-measure-unit" label="Dimension unit"><Select id="product-measure-unit" value={draft.measurementUnit} onChange={(event) => setField('measurementUnit', event.target.value)}><option value="cm">cm</option><option value="mm">mm</option><option value="m">m</option><option value="in">in</option></Select></Field>
              <Field id="product-origin" label="Country of origin"><Input id="product-origin" value={draft.countryOfOrigin} onChange={(event) => setField('countryOfOrigin', event.target.value)} /></Field>
              <Field id="product-hs-code" label="HS code"><Input id="product-hs-code" value={draft.hsCode} onChange={(event) => setField('hsCode', event.target.value)} /></Field>
              <Field id="product-material" label="Material"><Input id="product-material" value={draft.material} onChange={(event) => setField('material', event.target.value)} /></Field>
              <Field id="product-dimensions-text" label="Display dimensions"><Input id="product-dimensions-text" value={draft.dimensions} onChange={(event) => setField('dimensions', event.target.value)} /></Field>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-5 p-6">
            <div><h2 className="font-display text-2xl font-semibold">Search engine listing</h2><p className="mt-1 text-sm text-muted-foreground">Preview the current title and handle used by product pages.</p></div>
            <div className="rounded-lg border border-border p-4">
              <p className="text-sm text-primary">{draft.seoTitle || draft.title || 'Product title'} · {draft.slug || 'product-handle'}</p>
              <p className="mt-1 text-sm text-muted-foreground">{draft.seoDescription || draft.shortDescription || 'Product search description preview.'}</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="product-seo-title" label="SEO title"><Input id="product-seo-title" maxLength={70} value={draft.seoTitle} onChange={(event) => setField('seoTitle', event.target.value)} /></Field>
              <Field id="product-seo-description" label="SEO description"><Textarea id="product-seo-description" maxLength={200} value={draft.seoDescription} onChange={(event) => setField('seoDescription', event.target.value)} /></Field>
            </div>
          </CardContent>
        </Card>

        <div className="sticky bottom-3 z-10 flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-card)] border border-border bg-background/95 p-4 shadow-[var(--shadow-elevated)] backdrop-blur">
          <p className="text-sm text-muted-foreground">{draft.status === 'active' ? 'Active products are visible and purchasable subject to inventory.' : `${draft.status} products are hidden from customers.`}</p>
          <div className="flex gap-2">
            <Button asChild type="button" variant="outline"><Link to={routes.forLocale(locale, 'admin/products')}>Cancel</Link></Button>
            <Button type="submit" disabled={saveProduct.isPending}>
              {saveProduct.isPending ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving</> : submitLabel}
            </Button>
          </div>
        </div>
      </form>

      {imageProduct ? (
        <ProductImagesPanel products={[imageProduct]} />
      ) : null}
    </main>
  )
}
