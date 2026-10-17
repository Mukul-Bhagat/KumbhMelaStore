import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Archive, Copy, PackagePlus, Pencil, RotateCcw, Search } from 'lucide-react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'

import { ErrorState } from '@/components/ui/error-state'
import { LoadingScreen } from '@/components/layout/loading-screen'
import { SectionHeading } from '@/components/layout/section-heading'
import { Seo } from '@/components/layout/seo'
import { Alert } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { CloudinaryImage } from '@/components/media/cloudinary-image'
import { queryKeys } from '@/shared/api/keys'
import { getSupabaseBrowserClient } from '@/shared/api/supabase'
import { routes } from '@/shared/config/routes'
import { useAuth } from '@/shared/auth/provider'
import { useLocale } from '@/shared/hooks/use-locale'
import { humanizeSlug } from '@/shared/lib/format'
import { readProductContent } from '@/shared/lib/product-content'
import type { Database, Json } from '@/shared/types/database'

type ProductRow = Database['public']['Tables']['products']['Row']
type ProductStatus = ProductRow['stock_status']
type SortBy = 'name' | 'price' | 'created_at' | 'updated_at' | 'inventory_quantity' | 'sku'
type InventoryFilter = '' | 'in_stock' | 'low_stock' | 'out_of_stock' | 'not_tracked'

type ProductFilters = {
  search: string
  status: string
  categoryId: string
  collectionId: string
  inventoryStatus: InventoryFilter
  sort: SortBy
  ascending: boolean
  page: number
  pageSize: number
}

type ProductListData = {
  products: ProductRow[]
  totalCount: number
  inventorySummaryByProduct: Map<string, string>
}

type ProductImage = {
  productId: string
  publicId: string
  secureUrl: string
  isPrimary: boolean
  sortOrder: number
}

const defaultFilters: ProductFilters = {
  search: '',
  status: '',
  categoryId: '',
  collectionId: '',
  inventoryStatus: '',
  sort: 'updated_at',
  ascending: false,
  page: 1,
  pageSize: 25,
}

function isRecord(value: Json): value is { [key: string]: Json | undefined } {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function parseProductList(value: Json | null): ProductListData {
  if (!value || !isRecord(value)) {
    throw new Error('Supabase returned an invalid product list.')
  }
  const products = value.products
  const totalCount = value.totalCount
  if (
    !Array.isArray(products) ||
    typeof totalCount !== 'number' ||
    !products.every(
      (entry) =>
        isRecord(entry) &&
        typeof entry.id === 'string' &&
        typeof entry.slug === 'string' &&
        typeof entry.sku === 'string',
    )
  ) {
    throw new Error('Supabase returned incomplete product records.')
  }
  return {
    products: products as ProductRow[],
    totalCount,
    inventorySummaryByProduct: new Map(),
  }
}

async function fetchProducts(filters: ProductFilters): Promise<ProductListData> {
  const { data, error } = await getSupabaseBrowserClient().rpc('admin_list_products', {
    p_search: filters.search || null,
    p_status: filters.status || null,
    p_category_id: filters.categoryId || null,
    p_collection_id: filters.collectionId || null,
    p_inventory_status: filters.inventoryStatus || null,
    p_sort: filters.sort,
    p_ascending: filters.ascending,
    p_page: filters.page,
    p_page_size: filters.pageSize,
  })
  if (error) throw error
  const result = parseProductList(data)
  const productIds = result.products.map((product) => product.id)
  if (productIds.length === 0) return result
  const { data: variants, error: variantsError } = await getSupabaseBrowserClient()
    .from('product_variants')
    .select('product_id, track_inventory, inventory_quantity, continue_selling_when_out_of_stock, is_active')
    .in('product_id', productIds)
    .eq('is_active', true)
  if (variantsError) throw variantsError
  const variantsByProduct = new Map<string, typeof variants>()
  for (const variant of variants ?? []) {
    const productVariants = variantsByProduct.get(variant.product_id) ?? []
    productVariants.push(variant)
    variantsByProduct.set(variant.product_id, productVariants)
  }
  result.inventorySummaryByProduct = new Map(
    result.products.map((product) => [
      product.id,
      inventorySummary(product, variantsByProduct.get(product.id) ?? []),
    ]),
  )
  return result
}

function useProductRealtime() {
  const queryClient = useQueryClient()
  useEffect(() => {
    const supabase = getSupabaseBrowserClient()
    const channel = supabase
      .channel('product-workspace-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
        void queryClient.invalidateQueries({ queryKey: queryKeys.admin.products })
        void queryClient.invalidateQueries({ queryKey: queryKeys.catalog.products })
        void queryClient.invalidateQueries({ queryKey: queryKeys.pages.all })
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'product_variants' }, () => {
        void queryClient.invalidateQueries({ queryKey: queryKeys.admin.products })
        void queryClient.invalidateQueries({ queryKey: queryKeys.catalog.products })
        void queryClient.invalidateQueries({ queryKey: queryKeys.pages.all })
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'product_images' }, () => {
        void queryClient.invalidateQueries({ queryKey: queryKeys.admin.products })
        void queryClient.invalidateQueries({ queryKey: queryKeys.catalog.products })
        void queryClient.invalidateQueries({ queryKey: queryKeys.pages.all })
      })
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [queryClient])
}

function statusVariant(status: ProductStatus) {
  if (status === 'active') return 'success' as const
  if (status === 'archived') return 'muted' as const
  return 'outline' as const
}

function inventorySummary(
  product: ProductRow,
  variants: Array<{
    track_inventory: boolean
    inventory_quantity: number
    continue_selling_when_out_of_stock: boolean
    is_active: boolean
  }> = [],
) {
  const activeVariants = variants.filter((variant) => variant.is_active)
  if (activeVariants.length > 0) {
    const trackedVariants = activeVariants.filter((variant) => variant.track_inventory)
    if (trackedVariants.length === 0) return `${activeVariants.length} variants · Not tracked`
    const quantity = trackedVariants.reduce((total, variant) => total + variant.inventory_quantity, 0)
    if (quantity === 0 && activeVariants.every((variant) =>
      variant.track_inventory && !variant.continue_selling_when_out_of_stock,
    )) return 'Out of stock'
    return `${quantity} across ${activeVariants.length} variants`
  }
  if (!product.track_inventory) return 'Not tracked'
  if (product.inventory_quantity === 0) return 'Out of stock'
  if (product.inventory_quantity <= product.low_stock_threshold) {
    return `${product.inventory_quantity} · Low stock`
  }
  return `${product.inventory_quantity} available`
}

async function fetchProductImages(products: ProductRow[]): Promise<Map<string, ProductImage>> {
  if (products.length === 0) return new Map()
  const supabase = getSupabaseBrowserClient()
  const { data: imageRows, error: imageError } = await supabase
    .from('product_images')
    .select('product_id, media_id, is_primary, sort_order')
    .in('product_id', products.map((product) => product.id))
    .order('sort_order')
  if (imageError) throw imageError
  const mediaIds = Array.from(new Set((imageRows ?? []).map((image) => image.media_id)))
  if (mediaIds.length === 0) return new Map()
  const { data: media, error: mediaError } = await supabase
    .from('media')
    .select('id, public_id, secure_url')
    .in('id', mediaIds)
  if (mediaError) throw mediaError
  const mediaById = new Map((media ?? []).map((entry) => [entry.id, entry]))
  const byProduct = new Map<string, ProductImage>()
  for (const image of imageRows ?? []) {
    const item = mediaById.get(image.media_id)
    if (!item) continue
    const candidate: ProductImage = {
      productId: image.product_id,
      publicId: item.public_id,
      secureUrl: item.secure_url,
      isPrimary: image.is_primary,
      sortOrder: image.sort_order,
    }
    const current = byProduct.get(image.product_id)
    if (!current || candidate.isPrimary || candidate.sortOrder < current.sortOrder) {
      byProduct.set(image.product_id, candidate)
    }
  }
  return byProduct
}

function invalidateProductData(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: queryKeys.admin.products })
  void queryClient.invalidateQueries({ queryKey: queryKeys.catalog.products })
  void queryClient.invalidateQueries({ queryKey: queryKeys.catalog.collections })
  void queryClient.invalidateQueries({ queryKey: queryKeys.pages.all })
}

export function Component() {
  const locale = useLocale()
  const auth = useAuth()
  const queryClient = useQueryClient()
  useProductRealtime()
  const [filters, setFilters] = useState(defaultFilters)
  const deferredSearch = useDeferredValue(filters.search)
  const activeFilters = useMemo(
    () => ({ ...filters, search: deferredSearch }),
    [deferredSearch, filters],
  )
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const categories = useQuery({
    queryKey: [...queryKeys.admin.products, 'categories'] as const,
    queryFn: async () => {
      const { data, error } = await getSupabaseBrowserClient()
        .from('categories')
        .select('id, slug')
        .order('slug')
      if (error) throw error
      return data ?? []
    },
  })
  const collections = useQuery({
    queryKey: [...queryKeys.admin.products, 'collections'] as const,
    queryFn: async () => {
      const { data, error } = await getSupabaseBrowserClient()
        .from('collections')
        .select('id, slug')
        .order('slug')
      if (error) throw error
      return data ?? []
    },
  })
  const products = useQuery({
    queryKey: queryKeys.admin.productList(activeFilters),
    queryFn: () => fetchProducts(activeFilters),
  })
  const images = useQuery({
    queryKey: [...queryKeys.admin.products, 'images', products.data?.products.map((row) => row.id)] as const,
    queryFn: () => fetchProductImages(products.data?.products ?? []),
    enabled: Boolean(products.data),
  })
  const statusMutation = useMutation({
    mutationFn: async ({ ids, status }: { ids: string[]; status: ProductStatus }) => {
      if (!auth.user) throw new Error('Your administrator session has expired. Sign in again.')
      const { error } = await getSupabaseBrowserClient()
        .from('products')
        .update({
          stock_status: status,
          is_active: status === 'active',
          updated_by: auth.user.id,
        })
        .in('id', ids)
      if (error) throw error
    },
    onSuccess: (_, variables) => {
      setSelectedIds([])
      invalidateProductData(queryClient)
      toast.success(`Updated ${variables.ids.length} product(s).`)
    },
  })

  if (products.isLoading || categories.isLoading || collections.isLoading) {
    return <LoadingScreen className="min-h-[70svh]" />
  }
  if (products.error || categories.error || collections.error || images.error) {
    const error = products.error ?? categories.error ?? collections.error ?? images.error
    return (
      <main className="container space-y-8 py-10">
        <Seo title="Products" />
        <ErrorState
          title="Products could not be loaded"
          description={error instanceof Error ? error.message : 'Supabase could not return the product records.'}
          onRetry={() => {
            void Promise.all([products.refetch(), categories.refetch(), collections.refetch(), images.refetch()])
          }}
        />
      </main>
    )
  }

  const rows = products.data?.products ?? []
  const totalCount = products.data?.totalCount ?? 0
  const pageCount = Math.max(1, Math.ceil(totalCount / filters.pageSize))
  const categoryLabels = new Map((categories.data ?? []).map((category) => [category.id, category.slug]))
  const currentIds = rows.map((product) => product.id)
  const allCurrentSelected = currentIds.length > 0 && currentIds.every((id) => selectedIds.includes(id))

  function updateFilters(update: Partial<ProductFilters>) {
    setFilters((current) => ({ ...current, ...update, page: update.page ?? 1 }))
    setSelectedIds([])
  }

  return (
    <main className="container space-y-8 py-10">
      <Seo title="Products" description="Manage published products, inventory, variants, and product content." />
      <SectionHeading
        eyebrow="Super Admin"
        title="Products"
        description="Search, filter, and manage your live Supabase product catalogue. Product edits refresh the storefront without a code deployment."
      />

      {statusMutation.error ? (
        <Alert
          title="Product status update failed"
          description={statusMutation.error instanceof Error ? statusMutation.error.message : 'Supabase could not update the selected products.'}
          variant="error"
        />
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">{totalCount} products matching filters</Badge>
          <Badge variant="success">Active products are visible to customers</Badge>
        </div>
        <Button asChild>
          <Link to={routes.forLocale(locale, 'admin/products/new')}>
            <PackagePlus className="h-4 w-4" />
            Add product
          </Link>
        </Button>
      </div>

      <Card className="shadow-[var(--shadow-soft)]">
        <CardContent className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="product-search">Search products</Label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="product-search"
                className="pl-10"
                value={filters.search}
                onChange={(event) => updateFilters({ search: event.target.value })}
                placeholder="Name, handle, SKU, barcode, or ID"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="product-status-filter">Status</Label>
            <Select id="product-status-filter" value={filters.status} onChange={(event) => updateFilters({ status: event.target.value })}>
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="product-category-filter">Category</Label>
            <Select id="product-category-filter" value={filters.categoryId} onChange={(event) => updateFilters({ categoryId: event.target.value })}>
              <option value="">All categories</option>
              {(categories.data ?? []).map((category) => <option key={category.id} value={category.id}>{category.slug}</option>)}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="product-collection-filter">Collection</Label>
            <Select id="product-collection-filter" value={filters.collectionId} onChange={(event) => updateFilters({ collectionId: event.target.value })}>
              <option value="">All collections</option>
              {(collections.data ?? []).map((collection) => <option key={collection.id} value={collection.id}>{collection.slug}</option>)}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="product-inventory-filter">Inventory</Label>
            <Select id="product-inventory-filter" value={filters.inventoryStatus} onChange={(event) => updateFilters({ inventoryStatus: event.target.value as InventoryFilter })}>
              <option value="">All inventory</option>
              <option value="in_stock">In stock</option>
              <option value="low_stock">Low stock</option>
              <option value="out_of_stock">Out of stock</option>
              <option value="not_tracked">Not tracked</option>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="product-sort">Sort products</Label>
            <Select
              id="product-sort"
              value={`${filters.sort}:${filters.ascending ? 'asc' : 'desc'}`}
              onChange={(event) => {
                const [sort, direction] = event.target.value.split(':')
                updateFilters({ sort: sort as SortBy, ascending: direction === 'asc' })
              }}
            >
              <option value="updated_at:desc">Recently updated</option>
              <option value="created_at:desc">Newest created</option>
              <option value="name:asc">Name A-Z</option>
              <option value="name:desc">Name Z-A</option>
              <option value="price:asc">Price low to high</option>
              <option value="price:desc">Price high to low</option>
              <option value="inventory_quantity:asc">Inventory low to high</option>
              <option value="sku:asc">SKU A-Z</option>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="product-page-size">Rows per page</Label>
            <Select id="product-page-size" value={String(filters.pageSize)} onChange={(event) => updateFilters({ pageSize: Number(event.target.value) })}>
              {[10, 25, 50, 100].map((size) => <option key={size} value={size}>{size} per page</option>)}
            </Select>
          </div>
        </CardContent>
      </Card>

      {selectedIds.length > 0 ? (
        <Card>
          <CardContent className="flex flex-wrap items-center gap-3 p-4">
            <span className="mr-auto text-sm font-medium">{selectedIds.length} selected</span>
            <Button type="button" size="sm" variant="outline" disabled={statusMutation.isPending} onClick={() => statusMutation.mutate({ ids: selectedIds, status: 'active' })}>Publish</Button>
            <Button type="button" size="sm" variant="outline" disabled={statusMutation.isPending} onClick={() => statusMutation.mutate({ ids: selectedIds, status: 'draft' })}>Set draft</Button>
            <Button type="button" size="sm" variant="outline" disabled={statusMutation.isPending} onClick={() => statusMutation.mutate({ ids: selectedIds, status: 'archived' })}>Archive</Button>
          </CardContent>
        </Card>
      ) : null}

      <Card className="overflow-hidden shadow-[var(--shadow-soft)]">
        {rows.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-[900px] w-full text-left text-sm">
              <thead className="bg-surface text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="w-12 px-4 py-3">
                    <input
                      type="checkbox"
                      aria-label="Select all products on this page"
                      checked={allCurrentSelected}
                      onChange={(event) => setSelectedIds(event.target.checked ? currentIds : [])}
                    />
                  </th>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Inventory</th>
                  <th className="px-4 py-3">Price</th>
                  <th className="px-4 py-3">SKU</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Updated</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((product) => {
                  const image = images.data?.get(product.id)
                  const name = readProductContent(product.metadata, 'name', locale) ?? humanizeSlug(product.slug)
                  return (
                    <tr key={product.id} className="align-middle hover:bg-surface/60">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          aria-label={`Select ${name}`}
                          checked={selectedIds.includes(product.id)}
                          onChange={(event) => setSelectedIds((current) =>
                            event.target.checked
                              ? [...current, product.id]
                              : current.filter((id) => id !== product.id),
                          )}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex min-w-64 items-center gap-3">
                          <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-surface">
                            {image ? (
                              <CloudinaryImage publicId={image.secureUrl || image.publicId} alt={name} className="h-full w-full object-cover" />
                            ) : <div className="grid h-full place-items-center text-[10px] text-muted-foreground">No image</div>}
                          </div>
                          <div className="min-w-0">
                            <Link className="font-semibold hover:text-primary" to={routes.forLocale(locale, `admin/products/${product.id}`)}>{name}</Link>
                            <p className="truncate text-xs text-muted-foreground">/{product.slug}</p>
                            <p className="text-xs text-muted-foreground">{product.product_type || 'Product'}{product.vendor ? ` · ${product.vendor}` : ''}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3"><Badge variant={statusVariant(product.stock_status)}>{product.stock_status}</Badge></td>
                      <td className="px-4 py-3">{products.data?.inventorySummaryByProduct.get(product.id) ?? inventorySummary(product)}</td>
                      <td className="px-4 py-3">
                        <div>{product.currency} {Number(product.base_price).toFixed(2)}</div>
                        {product.compare_at_price != null && Number(product.compare_at_price) > Number(product.base_price) ? (
                          <div className="text-xs text-muted-foreground line-through">{product.currency} {Number(product.compare_at_price).toFixed(2)}</div>
                        ) : null}
                      </td>
                      <td className="px-4 py-3">{product.sku}{product.barcode ? <p className="text-xs text-muted-foreground">{product.barcode}</p> : null}</td>
                      <td className="px-4 py-3">{product.category_id ? categoryLabels.get(product.category_id) ?? 'Category' : '—'}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{new Date(product.updated_at).toLocaleDateString(locale === 'hi' ? 'hi-IN' : 'en-IN')}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Button asChild type="button" size="icon-sm" variant="ghost" aria-label={`Edit ${name}`}>
                            <Link to={routes.forLocale(locale, `admin/products/${product.id}`)}><Pencil className="h-4 w-4" /></Link>
                          </Button>
                          <Button asChild type="button" size="icon-sm" variant="ghost" aria-label={`Duplicate ${name}`}>
                            <Link to={routes.forLocale(locale, `admin/products/new?duplicate=${product.id}`)}><Copy className="h-4 w-4" /></Link>
                          </Button>
                          {product.stock_status === 'archived' ? (
                            <Button type="button" size="icon-sm" variant="ghost" aria-label={`Restore ${name}`} disabled={statusMutation.isPending} onClick={() => statusMutation.mutate({ ids: [product.id], status: 'draft' })}>
                              <RotateCcw className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button type="button" size="icon-sm" variant="ghost" aria-label={`Archive ${name}`} disabled={statusMutation.isPending} onClick={() => {
                              if (window.confirm(`Archive "${name}"? It will no longer be shown to customers.`)) {
                                statusMutation.mutate({ ids: [product.id], status: 'archived' })
                              }
                            }}>
                              <Archive className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <CardContent className="py-16 text-center">
            <PackagePlus className="mx-auto h-8 w-8 text-muted-foreground" />
            <h2 className="mt-4 font-display text-2xl font-semibold">No products found</h2>
            <p className="mt-2 text-sm text-muted-foreground">Adjust your filters or create the first product.</p>
            <Button asChild className="mt-5"><Link to={routes.forLocale(locale, 'admin/products/new')}>Add product</Link></Button>
          </CardContent>
        )}
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Showing {totalCount === 0 ? 0 : (filters.page - 1) * filters.pageSize + 1}
          –{Math.min(filters.page * filters.pageSize, totalCount)} of {totalCount}
        </p>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" disabled={filters.page <= 1 || products.isFetching} onClick={() => updateFilters({ page: filters.page - 1 })}>Previous</Button>
          <span className="text-sm">Page {filters.page} of {pageCount}</span>
          <Button type="button" variant="outline" disabled={filters.page >= pageCount || products.isFetching} onClick={() => updateFilters({ page: filters.page + 1 })}>Next</Button>
        </div>
      </div>
    </main>
  )
}
