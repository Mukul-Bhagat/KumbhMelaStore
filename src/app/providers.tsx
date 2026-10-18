import { type PropsWithChildren, useCallback, useEffect } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'

import { AuthProvider } from '@/shared/auth/provider'
import { queryClient } from '@/shared/api/query-client'
import { getSupabaseBrowserClient, isSupabaseConfigured } from '@/shared/api/supabase'
import { queryKeys } from '@/shared/api/keys'
import { getActiveLocale, setActiveLocale } from '@/shared/lib/locale-state'
import { readProductContent } from '@/shared/lib/product-content'
import { useCartStore } from '@/shared/stores/cart-store'
import { UI_STORAGE_KEY, useUiStore } from '@/shared/stores/ui-store'
import type { Database } from '@/shared/types/database'
import { useMounted } from '@/shared/hooks/use-mounted'
import { useLocale, useLocaleHydrated } from '@/shared/hooks/use-locale'

type ProductCartRow = Pick<
  Database['public']['Tables']['products']['Row'],
  | 'id'
  | 'slug'
  | 'currency'
  | 'base_price'
  | 'stock_status'
  | 'is_active'
  | 'track_inventory'
  | 'inventory_quantity'
  | 'continue_selling_when_out_of_stock'
  | 'metadata'
  | 'low_stock_threshold'
>
type VariantRow = Database['public']['Tables']['product_variants']['Row']

function ProductCartSynchronizer() {
  const syncQueryCaches = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.catalog.products })
    void queryClient.invalidateQueries({ queryKey: queryKeys.catalog.collections })
    void queryClient.invalidateQueries({ queryKey: queryKeys.admin.products })
    void queryClient.invalidateQueries({ queryKey: queryKeys.pages.all })
  }, [])
  const items = useCartStore((state) => state.items)
  const checkoutNowItem = useCartStore((state) => state.checkoutNowItem)
  const syncItem = useCartStore((state) => state.syncItem)
  const cartSignature = JSON.stringify({
    items: items.map((item) => ({
      productId: item.productId,
      variantId: item.variantId ?? null,
      quantity: item.quantity,
    })),
    checkoutNowItem: checkoutNowItem
      ? {
          productId: checkoutNowItem.productId,
          variantId: checkoutNowItem.variantId ?? null,
          quantity: checkoutNowItem.quantity,
        }
      : null,
  })

  const refreshCartProducts = useCallback(async () => {
    if (!isSupabaseConfigured()) return
    const { items, checkoutNowItem } = useCartStore.getState()
    const currentItems = checkoutNowItem ? [...items, checkoutNowItem] : items
    if (currentItems.length === 0) return

    const supabase = getSupabaseBrowserClient()
    const productIds = Array.from(new Set(currentItems.map((item) => item.productId)))
    const [productsResult, variantsResult, imagesResult] = await Promise.all([
      supabase
        .from('products')
        .select('id, slug, sku, currency, base_price, stock_status, is_active, track_inventory, inventory_quantity, continue_selling_when_out_of_stock, metadata, low_stock_threshold')
        .in('id', productIds)
        .eq('is_active', true)
        .eq('stock_status', 'active'),
      supabase
        .from('product_variants')
        .select('*')
        .in('product_id', productIds)
        .eq('is_active', true),
      supabase
        .from('product_images')
        .select('product_id, media_id, is_primary, sort_order')
        .in('product_id', productIds)
        .order('sort_order'),
    ])
    const firstError = productsResult.error ?? variantsResult.error ?? imagesResult.error
    if (firstError) throw firstError

    const mediaIds = Array.from(new Set((imagesResult.data ?? []).map((image) => image.media_id)))
    const mediaResult = mediaIds.length
      ? await supabase.from('media').select('id, public_id, secure_url').in('id', mediaIds)
      : { data: [], error: null }
    if (mediaResult.error) throw mediaResult.error

    const products = new Map<string, ProductCartRow>(
      (productsResult.data ?? []).map((product) => [product.id, product]),
    )
    const variantsByProduct = new Map<string, VariantRow[]>()
    for (const variant of variantsResult.data ?? []) {
      const variants = variantsByProduct.get(variant.product_id) ?? []
      variants.push(variant)
      variantsByProduct.set(variant.product_id, variants)
    }
    const mediaById = new Map((mediaResult.data ?? []).map((entry) => [entry.id, entry]))
    const primaryImages = new Map<string, { publicId: string; secureUrl: string }>()
    for (const image of imagesResult.data ?? []) {
      const media = mediaById.get(image.media_id)
      if (!media) continue
      const current = primaryImages.get(image.product_id)
      if (!current || image.is_primary) {
        primaryImages.set(image.product_id, {
          publicId: media.public_id,
          secureUrl: media.secure_url,
        })
      }
    }

    const locale = getActiveLocale()
    for (const item of currentItems) {
      const product = products.get(item.productId)
      if (!product) {
        syncItem(item.productId, item.variantId, { available: false, maxQuantity: 0 })
        continue
      }
      const productVariants = variantsByProduct.get(product.id) ?? []
      const variant = item.variantId
        ? productVariants.find((candidate) => candidate.id === item.variantId)
        : undefined
      if ((item.variantId && !variant) || (!item.variantId && productVariants.length > 0)) {
        syncItem(item.productId, item.variantId, { available: false, maxQuantity: 0 })
        continue
      }
      const trackInventory = variant?.track_inventory ?? product.track_inventory
      const quantity = variant?.inventory_quantity ?? product.inventory_quantity
      const continueSelling = variant?.continue_selling_when_out_of_stock
        ?? product.continue_selling_when_out_of_stock
      const available = !trackInventory || quantity > 0 || continueSelling
      const image = primaryImages.get(product.id)
      syncItem(item.productId, item.variantId, {
        name: readProductContent(product.metadata, 'name', locale) ?? product.slug,
        price: Number(variant?.price ?? product.base_price),
        currency: product.currency,
        image: image?.secureUrl ?? image?.publicId ?? '',
        variantTitle: variant?.title,
        available,
        maxQuantity: trackInventory && !continueSelling ? quantity : null,
      })
    }
  }, [syncItem])

  useEffect(() => {
    void refreshCartProducts().catch((error: unknown) => {
      console.error('Unable to refresh product prices and availability in the cart.', error)
    })
  }, [cartSignature, refreshCartProducts])

  useEffect(() => {
    if (!isSupabaseConfigured()) return
    const supabase = getSupabaseBrowserClient()
    const channel = supabase
      .channel('storefront-product-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
        syncQueryCaches()
        void refreshCartProducts().catch((error: unknown) => {
          console.error('Unable to refresh the cart after a product update.', error)
        })
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'product_variants' }, () => {
        syncQueryCaches()
        void refreshCartProducts().catch((error: unknown) => {
          console.error('Unable to refresh the cart after a variant update.', error)
        })
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'product_images' }, () => {
        syncQueryCaches()
        void refreshCartProducts().catch((error: unknown) => {
          console.error('Unable to refresh cart images after a product image update.', error)
        })
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'product_collections' }, syncQueryCaches)
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.error(`Product live updates could not connect (${status}).`)
        }
      })

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [refreshCartProducts, syncQueryCaches])

  return null
}

function ThemeHydrator() {
  const mounted = useMounted()
  const theme = useUiStore((state) => state.theme)

  useEffect(() => {
    if (!mounted) {
      return
    }

    const root = document.documentElement
    const media = window.matchMedia('(prefers-color-scheme: dark)')

    const applyTheme = () => {
      const resolvedTheme =
        theme === 'system' ? (media.matches ? 'dark' : 'light') : theme

      root.classList.toggle('dark', resolvedTheme === 'dark')
      root.dataset.theme = resolvedTheme
    }

    applyTheme()
    media.addEventListener('change', applyTheme)

    return () => media.removeEventListener('change', applyTheme)
  }, [mounted, theme])

  return null
}

function LocalePersistence() {
  const locale = useLocale()
  const hydrated = useLocaleHydrated()
  const setLocale = useUiStore((state) => state.setLocale)

  useEffect(() => {
    if (hydrated) {
      setActiveLocale(locale)
    }
  }, [hydrated, locale])

  useEffect(() => {
    const syncLocaleFromOtherTab = (event: StorageEvent) => {
      if (event.key !== UI_STORAGE_KEY || !event.newValue) {
        return
      }

      try {
        const stored = JSON.parse(event.newValue) as { state?: { locale?: unknown } }
        if (
          (stored.state?.locale === 'en' || stored.state?.locale === 'hi') &&
          useUiStore.getState().locale !== stored.state.locale
        ) {
          setLocale(stored.state.locale)
        }
      } catch {
        // Ignore malformed browser storage rather than disrupting the current preference.
      }
    }

    window.addEventListener('storage', syncLocaleFromOtherTab)
    return () => window.removeEventListener('storage', syncLocaleFromOtherTab)
  }, [setLocale])

  return null
}

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeHydrator />
      <LocalePersistence />
      <ProductCartSynchronizer />
      <AuthProvider>{children}</AuthProvider>
      <Toaster
        richColors
        position="top-right"
        toastOptions={{
          classNames: {
            toast:
              'rounded-[var(--radius-card)] border border-border bg-card text-card-foreground shadow-[var(--shadow-elevated)]',
            title: 'font-medium text-foreground',
            description: 'text-sm text-muted-foreground',
            closeButton:
              'rounded-full border border-border bg-background text-foreground hover:bg-muted',
            actionButton:
              'rounded-[var(--radius-pill)] bg-primary text-primary-foreground',
            cancelButton:
              'rounded-[var(--radius-pill)] border border-border bg-background text-foreground',
          },
        }}
      />
    </QueryClientProvider>
  )
}
