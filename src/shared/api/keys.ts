export const queryKeys = {
  all: ['kumbh-mela-store'] as const,
  auth: ['kumbh-mela-store', 'auth'] as const,
  products: {
    all: ['kumbh-mela-store', 'products'] as const,
    lists: () => [...queryKeys.products.all, 'list'] as const,
    detail: (slug: string) => [...queryKeys.products.all, 'detail', slug] as const,
  },
  collections: {
    all: ['kumbh-mela-store', 'collections'] as const,
    lists: () => [...queryKeys.collections.all, 'list'] as const,
    detail: (slug: string) =>
      [...queryKeys.collections.all, 'detail', slug] as const,
  },
  orders: {
    all: ['kumbh-mela-store', 'orders'] as const,
    lists: () => [...queryKeys.orders.all, 'list'] as const,
    detail: (id: string) => [...queryKeys.orders.all, 'detail', id] as const,
  },
  blog: {
    all: ['kumbh-mela-store', 'blog'] as const,
  },
} as const
