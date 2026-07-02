import { RouterProvider, createBrowserRouter } from 'react-router-dom'

import { AppErrorBoundary } from '@/app/error-boundary'
import { AppProviders } from '@/app/providers'
import { RootLayout } from '@/app/root-layout'
import { ErrorLayout } from '@/components/layout/error-layout'
import { MarketingLayout } from '@/components/layout/marketing-layout'
import { ShopLayout } from '@/components/layout/shop-layout'
import { AuthLayout } from '@/components/layout/auth-layout'
import { CheckoutLayout } from '@/components/layout/checkout-layout'
import { DashboardLayout } from '@/components/layout/dashboard-layout'

const router = createBrowserRouter([
  {
    element: <RootLayout />,
    errorElement: <ErrorLayout />,
    children: [
      {
        element: <MarketingLayout />,
        children: [
          {
            index: true,
            lazy: () => import('@/pages/home/page'),
          },
          {
            path: 'collections',
            lazy: () => import('@/pages/collections/page'),
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
            path: 'refund-policy',
            lazy: () => import('@/pages/policies/refund-policy/page'),
          },
          {
            path: 'shipping-policy',
            lazy: () => import('@/pages/policies/shipping-policy/page'),
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
        ],
      },
      {
        path: 'checkout',
        element: <CheckoutLayout />,
        children: [
          {
            index: true,
            lazy: () => import('@/pages/checkout/page'),
          },
        ],
      },
      {
        path: 'dashboard',
        element: <DashboardLayout />,
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
        path: '*',
        lazy: () => import('@/pages/not-found/page'),
      },
    ],
  },
])

export function App() {
  return (
    <AppProviders>
      <AppErrorBoundary>
        <RouterProvider router={router} />
      </AppErrorBoundary>
    </AppProviders>
  )
}
