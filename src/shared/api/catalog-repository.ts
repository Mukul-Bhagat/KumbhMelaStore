import { getSupabaseBrowserClient } from '@/shared/api/supabase'
import type { Database } from '@/shared/types/database'

type ProductRow = Database['public']['Tables']['products']['Row']
type CategoryRow = Database['public']['Tables']['categories']['Row']
type CollectionRow = Database['public']['Tables']['collections']['Row']
type ReviewRow = Database['public']['Tables']['reviews']['Row']
type MediaRow = Database['public']['Tables']['media']['Row']

export interface HydratedProductImage {
  id: string
  sortOrder: number
  isPrimary: boolean
  altText: string | null
  media: MediaRow | null
}

export interface ProductDetailRecord {
  product: ProductRow
  category: CategoryRow | null
  collection: CollectionRow | null
  images: HydratedProductImage[]
  reviews: ReviewRow[]
  averageRating: number | null
}

export interface ProductSummaryRecord {
  id: string
  slug: string
  sku: string
  currency: string
  basePrice: number
  compareAtPrice: number | null
  material: string | null
  dimensions: string | null
  metadata: ProductRow['metadata']
  primaryImage: MediaRow | null
}

export interface CollectionSummaryRecord {
  id: string
  slug: string
  isFeatured: boolean
  coverImage: MediaRow | null
}

export interface CollectionDetailRecord {
  collection: CollectionRow
  products: ProductSummaryRecord[]
}

export interface CategoryDetailRecord {
  category: CategoryRow
  products: ProductSummaryRecord[]
}

export async function fetchActiveCollections(): Promise<CollectionSummaryRecord[]> {
  const supabase = getSupabaseBrowserClient()
  const { data: collections, error } = await supabase
    .from('collections')
    .select('id, slug, cover_media_id, hero_media_id, is_featured, is_active, sort_order, created_at, updated_at')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  if (error) {
    throw error
  }

  const mediaIds = Array.from(
    new Set(
      (collections ?? [])
        .flatMap((collection) => [collection.cover_media_id, collection.hero_media_id])
        .filter((id): id is string => id !== null),
    ),
  )
  const { data: media, error: mediaError } = await supabase
    .from('media')
    .select('id, provider, public_id, secure_url, alt_text, blur_data_url, width, height, format, metadata, is_public, created_by, created_at, updated_at')
    .in('id', mediaIds.length > 0 ? mediaIds : ['00000000-0000-0000-0000-000000000000'])

  if (mediaError) {
    throw mediaError
  }

  const mediaById = new Map((media ?? []).map((entry) => [entry.id, entry]))

  return (collections ?? []).map((collection) => ({
    id: collection.id,
    slug: collection.slug,
    isFeatured: collection.is_featured,
    coverImage:
      (collection.cover_media_id && mediaById.get(collection.cover_media_id)) ||
      (collection.hero_media_id && mediaById.get(collection.hero_media_id)) ||
      null,
  }))
}

export async function fetchActiveProductSummaries(): Promise<ProductSummaryRecord[]> {
  const supabase = getSupabaseBrowserClient()
  const { data: products, error } = await supabase
    .from('products')
    .select(
      'id, slug, sku, category_id, collection_id, currency, base_price, compare_at_price, stock_status, is_featured, is_active, material, dimensions, metadata, created_at, updated_at',
    )
    .eq('is_active', true)
    .eq('stock_status', 'active')
    .order('is_featured', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(24)

  if (error) {
    throw error
  }

  return hydrateProductSummaries(products ?? [])
}

async function hydrateProductSummaries(products: ProductRow[]) {
  const supabase = getSupabaseBrowserClient()
  const productIds = products.map((product) => product.id)

  if (productIds.length === 0) {
    return []
  }

  const { data: images, error: imagesError } = await supabase
    .from('product_images')
    .select('id, product_id, media_id, sort_order, is_primary, alt_key')
    .in('product_id', productIds)
    .order('sort_order', { ascending: true })

  if (imagesError) {
    throw imagesError
  }

  const mediaIds = Array.from(new Set((images ?? []).map((image) => image.media_id)))
  const { data: media, error: mediaError } = await supabase
    .from('media')
    .select('id, provider, public_id, secure_url, alt_text, blur_data_url, width, height, format, metadata, is_public, created_by, created_at, updated_at')
    .in('id', mediaIds.length > 0 ? mediaIds : ['00000000-0000-0000-0000-000000000000'])

  if (mediaError) {
    throw mediaError
  }

  const mediaMap = new Map((media ?? []).map((entry) => [entry.id, entry]))

  return products.map<ProductSummaryRecord>((product) => {
    const imageRow = (images ?? []).find((image) => image.product_id === product.id && image.is_primary)
      ?? (images ?? []).find((image) => image.product_id === product.id)

    return {
      id: product.id,
      slug: product.slug,
      sku: product.sku,
      currency: product.currency,
      basePrice: Number(product.base_price),
      compareAtPrice: product.compare_at_price != null ? Number(product.compare_at_price) : null,
      material: product.material,
      dimensions: product.dimensions,
      metadata: product.metadata,
      primaryImage: imageRow ? mediaMap.get(imageRow.media_id) ?? null : null,
    }
  })
}

export async function fetchProductDetail(slug: string): Promise<ProductDetailRecord | null> {
  const supabase = getSupabaseBrowserClient()

  const { data: product, error: productError } = await supabase
    .from('products')
    .select(
      'id, slug, sku, category_id, collection_id, currency, base_price, compare_at_price, stock_status, is_featured, is_active, material, dimensions, metadata, created_at, updated_at',
    )
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle()

  if (productError) {
    throw productError
  }

  if (!product) {
    return null
  }

  const [categoryResult, collectionResult, imagesResult, reviewsResult] = await Promise.all([
    product.category_id
      ? supabase.from('categories').select('id, slug, image_media_id, parent_id, is_active, sort_order, created_at, updated_at').eq('id', product.category_id).maybeSingle()
      : Promise.resolve({ data: null, error: null as never }),
    product.collection_id
      ? supabase.from('collections').select('id, slug, cover_media_id, hero_media_id, is_featured, is_active, sort_order, created_at, updated_at').eq('id', product.collection_id).maybeSingle()
      : Promise.resolve({ data: null, error: null as never }),
    supabase
      .from('product_images')
      .select('id, product_id, media_id, sort_order, is_primary, alt_key')
      .eq('product_id', product.id)
      .order('sort_order', { ascending: true }),
    supabase
      .from('reviews')
      .select('id, product_id, user_id, rating, title, body, status, is_verified_purchase, created_at, updated_at')
      .eq('product_id', product.id)
      .eq('status', 'approved')
      .order('created_at', { ascending: false }),
  ])

  const firstError = categoryResult.error ?? collectionResult.error ?? imagesResult.error ?? reviewsResult.error
  if (firstError) {
    throw firstError
  }

  const mediaIds = Array.from(new Set((imagesResult.data ?? []).map((image) => image.media_id)))
  const { data: media, error: mediaError } = await supabase
    .from('media')
    .select('id, provider, public_id, secure_url, alt_text, blur_data_url, width, height, format, metadata, is_public, created_by, created_at, updated_at')
    .in('id', mediaIds.length > 0 ? mediaIds : ['00000000-0000-0000-0000-000000000000'])

  if (mediaError) {
    throw mediaError
  }

  const mediaMap = new Map((media ?? []).map((entry) => [entry.id, entry]))
  const images = (imagesResult.data ?? []).map<HydratedProductImage>((image) => ({
    id: image.id,
    sortOrder: image.sort_order,
    isPrimary: image.is_primary,
    altText: image.alt_key,
    media: mediaMap.get(image.media_id) ?? null,
  }))

  const reviewRatings = (reviewsResult.data ?? []).map((review) => review.rating)
  const averageRating =
    reviewRatings.length > 0
      ? reviewRatings.reduce((total, rating) => total + rating, 0) / reviewRatings.length
      : null

  return {
    product,
    category: categoryResult.data,
    collection: collectionResult.data,
    images,
    reviews: reviewsResult.data ?? [],
    averageRating,
  }
}

export async function fetchCollectionDetail(slug: string): Promise<CollectionDetailRecord | null> {
  const supabase = getSupabaseBrowserClient()

  const { data: collection, error: collectionError } = await supabase
    .from('collections')
    .select('id, slug, cover_media_id, hero_media_id, is_featured, is_active, sort_order, created_at, updated_at')
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle()

  if (collectionError) {
    throw collectionError
  }

  if (!collection) {
    return null
  }

  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('id, slug, sku, category_id, collection_id, currency, base_price, compare_at_price, stock_status, is_featured, is_active, material, dimensions, metadata, created_at, updated_at')
    .eq('collection_id', collection.id)
    .eq('is_active', true)
    .eq('stock_status', 'active')
    .order('created_at', { ascending: false })

  if (productsError) {
    throw productsError
  }

  return {
    collection,
    products: await hydrateProductSummaries(products ?? []),
  }
}

export async function fetchCategoryDetail(slug: string): Promise<CategoryDetailRecord | null> {
  const supabase = getSupabaseBrowserClient()

  const { data: category, error: categoryError } = await supabase
    .from('categories')
    .select('id, slug, image_media_id, parent_id, is_active, sort_order, created_at, updated_at')
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle()

  if (categoryError) {
    throw categoryError
  }

  if (!category) {
    return null
  }

  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('id, slug, sku, category_id, collection_id, currency, base_price, compare_at_price, stock_status, is_featured, is_active, material, dimensions, metadata, created_at, updated_at')
    .eq('category_id', category.id)
    .eq('is_active', true)
    .eq('stock_status', 'active')
    .order('created_at', { ascending: false })

  if (productsError) {
    throw productsError
  }

  return {
    category,
    products: await hydrateProductSummaries(products ?? []),
  }
}
