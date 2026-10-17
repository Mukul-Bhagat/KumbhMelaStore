import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

export interface CartItem {
  productId: string
  slug: string
  name: string
  price: number
  currency: string
  image: string
  quantity: number
  variantId?: string
  variantTitle?: string | undefined
  available?: boolean
  maxQuantity?: number | null
}

export type CartItemInput = Omit<CartItem, 'quantity'> & {
  quantity?: number
}

interface CartState {
  items: CartItem[]
  checkoutNowItem: CartItem | null
  addItem: (item: CartItemInput) => void
  beginCheckoutNow: (item: CartItemInput) => void
  finishCheckoutNow: (restoreToCart?: boolean) => void
  removeItem: (productId: string, variantId?: string) => void
  setQuantity: (productId: string, quantity: number, variantId?: string) => void
  syncItem: (productId: string, variantId: string | undefined, update: Partial<CartItem>) => void
  clear: () => void
}

function sameCartEntry(item: CartItem, productId: string, variantId?: string) {
  return item.productId === productId && (item.variantId ?? undefined) === variantId
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      checkoutNowItem: null,
      addItem: (item) =>
        set((state) => {
          const existing = state.items.find((entry) => sameCartEntry(entry, item.productId, item.variantId))
          const quantity = Math.max(1, Math.min(item.quantity ?? 1, 99))
          return {
            items: existing
              ? state.items.map((entry) =>
                  sameCartEntry(entry, item.productId, item.variantId)
                    ? { ...entry, ...item, quantity: Math.min(entry.quantity + quantity, 99) }
                    : entry,
                )
              : [...state.items, { ...item, quantity }],
          }
        }),
      beginCheckoutNow: (item) =>
        set(() => {
          const quantity = Math.max(1, Math.min(item.quantity ?? 1, 99))
          return {
            checkoutNowItem: { ...item, quantity },
          }
        }),
      finishCheckoutNow: (restoreToCart = false) =>
        set((state) => {
          const checkoutItem = state.checkoutNowItem
          if (!restoreToCart || !checkoutItem) {
            return { checkoutNowItem: null }
          }
          const exists = state.items.some((item) =>
            sameCartEntry(item, checkoutItem.productId, checkoutItem.variantId),
          )
          return {
            items: exists ? state.items : [...state.items, checkoutItem],
            checkoutNowItem: null,
          }
        }),
      removeItem: (productId, variantId) =>
        set((state) => {
          return {
            items: state.items.filter((item) => !sameCartEntry(item, productId, variantId)),
          }
        }),
      setQuantity: (productId, quantity, variantId) =>
        set((state) => {
          return quantity < 1
            ? {
                items: state.items.filter((item) => !sameCartEntry(item, productId, variantId)),
              }
            : {
                items: state.items.map((item) =>
                  sameCartEntry(item, productId, variantId)
                    ? {
                        ...item,
                        quantity:
                          item.maxQuantity == null || item.maxQuantity <= 0
                            ? Math.min(quantity, 99)
                            : Math.min(quantity, item.maxQuantity, 99),
                      }
                    : item,
                ),
              }
        }),
      syncItem: (productId, variantId, update) =>
        set((state) => {
          const merge = (item: CartItem) =>
            Object.entries(update).every(([key, value]) => item[key as keyof CartItem] === value)
              ? item
              : { ...item, ...update }
          const items = state.items.map((item) =>
            sameCartEntry(item, productId, variantId) ? merge(item) : item,
          )
          const checkoutNowItem =
            state.checkoutNowItem &&
            sameCartEntry(state.checkoutNowItem, productId, variantId)
              ? merge(state.checkoutNowItem)
              : state.checkoutNowItem
          return items.every((item, index) => item === state.items[index]) &&
            checkoutNowItem === state.checkoutNowItem
            ? state
            : { items, checkoutNowItem }
        }),
      clear: () => set({ items: [], checkoutNowItem: null }),
    }),
    {
      name: 'kumbh-melastore-cart',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ items: state.items, checkoutNowItem: state.checkoutNowItem }),
    },
  ),
)
