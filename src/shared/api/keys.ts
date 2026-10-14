import type { Locale } from '@/shared/config/locales'

export const queryKeys = {
  all: ['kumbh-melastore'] as const,
  translations: ['kumbh-melastore', 'translations'] as const,
  shell: {
    all: ['kumbh-melastore', 'shell'] as const,
    detail: (locale: Locale) => [...queryKeys.shell.all, locale] as const,
  },
  pages: {
    all: ['kumbh-melastore', 'pages'] as const,
    detail: (slug: string) => [...queryKeys.pages.all, slug] as const,
  },
  catalog: {
    products: ['kumbh-melastore', 'catalog', 'products'] as const,
    collections: ['kumbh-melastore', 'catalog', 'collections'] as const,
  },
  auth: ['kumbh-melastore', 'auth'] as const,
  orderTracking: ['kumbh-melastore', 'order-tracking'] as const,
  dashboard: {
    all: ['kumbh-melastore', 'dashboard'] as const,
    detail: (userId: string) => [...queryKeys.dashboard.all, userId] as const,
  },
  admin: {
    orders: ['kumbh-melastore', 'admin', 'orders'] as const,
    users: ['kumbh-melastore', 'admin', 'users'] as const,
    content: ['kumbh-melastore', 'admin', 'content'] as const,
    settings: ['kumbh-melastore', 'admin', 'settings'] as const,
  },
} as const
