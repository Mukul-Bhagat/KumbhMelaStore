import { Navigate, RouterProvider, createBrowserRouter } from 'react-router-dom'

import { AppErrorBoundary } from '@/app/error-boundary'
import { AppProviders } from '@/app/providers'
import { LocaleLayout } from '@/app/locale-layout'
import { RootLayout } from '@/app/root-layout'
import { BrandMark } from '@/components/brand/brand-mark'
import { ErrorLayout } from '@/components/layout/error-layout'
import { MarketingLayout } from '@/components/layout/marketing-layout'
import { ShopLayout } from '@/components/layout/shop-layout'
import { AuthLayout } from '@/components/layout/auth-layout'
import { CheckoutLayout } from '@/components/layout/checkout-layout'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { AdminLayout } from '@/components/layout/admin-layout'
import { RequireAuth, RequireRole } from '@/app/route-guards'
import { useLocale, useLocaleHydrated } from '@/shared/hooks/use-locale'
import { Component as HomePage } from '@/pages/home/page'

function IndexRoute() {
  const locale = useLocale()
  const hydrated = useLocaleHydrated()

  if (!hydrated) {
    return <InitialRouteFallback />
  }

  return <Navigate replace to={`/${locale}`} />
}

const router = createBrowserRouter([
  {
    element: <RootLayout />,
    HydrateFallback: InitialRouteFallback,
    errorElement: <ErrorLayout />,
    children: [
      {
        index: true,
        element: <IndexRoute />,
      },
      {
        path: 'privacy-policy',
        lazy: () => import('@/pages/policies/privacy-policy/page'),
      },
      {
        path: 'terms',
        lazy: () => import('@/pages/policies/terms/page'),
      },
      {
        path: 'terms-and-conditions',
        lazy: () => import('@/pages/policies/terms/page'),
      },
      {
        path: 'shipping-policy',
        lazy: () => import('@/pages/policies/shipping-policy/page'),
      },
      {
        path: 'refund-policy',
        lazy: () => import('@/pages/policies/refund-policy/page'),
      },
      {
        path: 'cancellation-policy',
        lazy: () => import('@/pages/policies/cancellation-policy/page'),
      },
      {
        path: 'auth/callback',
        lazy: () => import('@/pages/auth/callback/page'),
      },
      {
        path: 'auth/reset-password',
        lazy: () => import('@/pages/auth/reset-password/page'),
      },
      {
        path: ':locale',
        element: <LocaleLayout />,
        children: [
          {
            element: <MarketingLayout />,
            children: [
              {
                index: true,
                element: <HomePage />,
              },
              {
                path: 'collections',
                lazy: () => import('@/pages/collections/page'),
              },
              {
                path: 'products',
                lazy: () => import('@/pages/products/page'),
              },
              {
                path: 'collections/:slug',
                lazy: () => import('@/pages/collection-detail/page'),
              },
              {
                path: 'categories',
                lazy: () => import('@/pages/categories/page'),
              },
              {
                path: 'categories/:slug',
                lazy: () => import('@/pages/category-detail/page'),
              },
              {
                path: 'products/:slug',
                lazy: () => import('@/pages/product-detail/page'),
              },
              {
                path: 'product/:slug',
                lazy: () => import('@/pages/product-detail/page'),
              },
              {
                path: 'account',
                lazy: () => import('@/pages/account/page'),
              },
              {
                path: 'about',
                lazy: () => import('@/pages/about/page'),
              },
              {
                path: 'contact',
                lazy: () => import('@/pages/contact/page'),
              },
              {
                path: 'blog',
                lazy: () => import('@/pages/blog/page'),
              },
              {
                path: 'faq',
                lazy: () => import('@/pages/faq/page'),
              },
              {
                path: 'track-order',
                lazy: () => import('@/pages/track-order/page'),
              },
              {
                path: 'privacy-policy',
                lazy: () => import('@/pages/policies/privacy-policy/page'),
              },
              {
                path: 'terms',
                lazy: () => import('@/pages/policies/terms/page'),
              },
              {
                path: 'terms-and-conditions',
                lazy: () => import('@/pages/policies/terms/page'),
              },
              {
                path: 'refund-policy',
                lazy: () => import('@/pages/policies/refund-policy/page'),
              },
              {
                path: 'shipping-policy',
                lazy: () => import('@/pages/policies/shipping-policy/page'),
              },
              {
                path: 'cancellation-policy',
                lazy: () => import('@/pages/policies/cancellation-policy/page'),
              },
            ],
          },
          {
            element: <ShopLayout />,
            children: [
              {
                path: 'cart',
                lazy: () => import('@/pages/cart/page'),
              },
              {
                path: 'wishlist',
                lazy: () => import('@/pages/wishlist/page'),
              },
            ],
          },
          {
            path: 'auth',
            element: <AuthLayout />,
            children: [
              {
                path: 'sign-in',
                lazy: () => import('@/pages/auth/sign-in/page'),
              },
              {
                path: 'sign-up',
                lazy: () => import('@/pages/auth/sign-up/page'),
              },
              {
                path: 'forgot-password',
                lazy: () => import('@/pages/auth/forgot-password/page'),
              },
            ],
          },
          {
            path: 'checkout',
            element: (
              <RequireAuth>
                <CheckoutLayout />
              </RequireAuth>
            ),
            children: [
              {
                index: true,
                lazy: () => import('@/pages/checkout/page'),
              },
            ],
          },
          {
            path: 'dashboard',
            element: (
              <RequireAuth>
                <DashboardLayout />
              </RequireAuth>
            ),
            children: [
              {
                index: true,
                lazy: () => import('@/pages/dashboard/overview/page'),
              },
              {
                path: 'orders',
                lazy: () => import('@/pages/dashboard/orders/page'),
              },
              {
                path: 'profile',
                lazy: () => import('@/pages/dashboard/profile/page'),
              },
              {
                path: 'settings',
                lazy: () => import('@/pages/dashboard/settings/page'),
              },
            ],
          },
          {
            path: 'admin',
            element: (
              <RequireRole role="super_admin">
                <AdminLayout />
              </RequireRole>
            ),
            children: [
              {
                index: true,
                lazy: () => import('@/pages/admin/overview/page'),
              },
              {
                path: 'content',
                lazy: () => import('@/pages/admin/content/page'),
              },
              {
                path: 'catalog',
                lazy: () => import('@/pages/admin/catalog/page'),
              },
              {
                path: 'products',
                lazy: () => import('@/pages/admin/products/page'),
              },
              {
                path: 'products/new',
                lazy: () => import('@/pages/admin/products/product-editor-page'),
              },
              {
                path: 'products/:productId',
                lazy: () => import('@/pages/admin/products/product-editor-page'),
              },
              {
                path: 'orders',
                lazy: () => import('@/pages/admin/orders/page'),
              },
              {
                path: 'users',
                lazy: () => import('@/pages/admin/users/page'),
              },
              {
                path: 'settings',
                lazy: () => import('@/pages/admin/settings/page'),
              },
            ],
          },
          {
            path: '*',
            lazy: () => import('@/pages/not-found/page'),
          },
        ],
      },
      {
        path: '*',
        lazy: () => import('@/pages/not-found/page'),
      },
    ],
  },
])

function InitialRouteFallback() {
  return (
    <div className="grid min-h-screen place-items-center bg-background px-6">
      <div className="flex flex-col items-center gap-5" role="status" aria-live="polite">
        <BrandMark size="lg" />
        <div className="h-1.5 w-40 animate-pulse rounded-full bg-primary/30" />
        <span className="sr-only">Loading page</span>
      </div>
    </div>
  )
}

export function App() {
  return (
    <AppProviders>
      <AppErrorBoundary>
        <RouterProvider router={router} />
      </AppErrorBoundary>
    </AppProviders>
  )
}
