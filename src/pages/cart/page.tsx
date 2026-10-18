import { useEffect } from 'react'
import { Minus, Plus, Trash2 } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'

import { CloudinaryImage } from '@/components/media/cloudinary-image'
import { SectionHeading } from '@/components/layout/section-heading'
import { Seo } from '@/components/layout/seo'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { Badge } from '@/components/ui/badge'
import { routes } from '@/shared/config/routes'
import { formatCurrency } from '@/shared/lib/format'
import { useCartStore } from '@/shared/stores/cart-store'

export function Component() {
  const navigate = useNavigate()
  const items = useCartStore((state) => state.items)
  const setQuantity = useCartStore((state) => state.setQuantity)
  const removeItem = useCartStore((state) => state.removeItem)
  const finishCheckoutNow = useCartStore((state) => state.finishCheckoutNow)
  useEffect(() => {
    finishCheckoutNow(true)
  }, [finishCheckoutNow])
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const currency = items[0]?.currency ?? 'INR'

  return (
    <div className="space-y-8">
      <Seo title="Cart" description="Review the items in your shopping cart." />
      <SectionHeading title="Your cart" description="Review your selected products before checkout." />
      {items.length === 0 ? (
        <EmptyState
          title="Your cart is empty"
          description="Explore our products and add something meaningful to your cart."
          actionLabel="Browse products"
          onAction={() => {
            navigate(routes.products)
          }}
          secondaryAction={
            <Button asChild variant="outline">
              <Link to={routes.collections}>Explore collections</Link>
            </Button>
          }
        />
      ) : (
        <div className="grid gap-8 lg:grid-cols-[1fr_20rem]">
          <div className="space-y-4">
            {items.map((item) => (
              <Card key={`${item.productId}:${item.variantId ?? ''}`} className="overflow-hidden">
                <CardContent className="grid gap-5 p-4 sm:grid-cols-[8rem_1fr_auto] sm:items-center">
                  <Link to={routes.productDetail(item.slug)} className="block">
                    <div className="aspect-square overflow-hidden rounded-[var(--radius-field)] bg-surface">
                      {item.image ? (
                        <CloudinaryImage publicId={item.image} alt={item.name} />
                      ) : (
                        <div className="grid h-full place-items-center font-display text-lg">
                          {item.name}
                        </div>
                      )}
                    </div>
                  </Link>
                  <div className="space-y-2">
                    <Link
                      to={routes.productDetail(item.slug)}
                      className="font-display text-xl font-semibold hover:text-primary"
                    >
                      {item.name}
                    </Link>
                    <p className="text-sm text-muted-foreground">
                      {formatCurrency(item.price, item.currency)} each
                    </p>
                    {item.variantTitle ? (
                      <p className="text-sm text-muted-foreground">Option: {item.variantTitle}</p>
                    ) : null}
                    {item.available === false ? (
                      <Badge variant="error">Unavailable</Badge>
                    ) : item.maxQuantity != null && item.quantity > item.maxQuantity ? (
                      <p className="text-xs text-error">Quantity exceeds current availability.</p>
                    ) : null}
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon-sm"
                        aria-label={`Decrease quantity of ${item.name}`}
                        onClick={() => setQuantity(item.productId, item.quantity - 1, item.variantId)}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="min-w-8 text-center" aria-live="polite">
                        {item.quantity}
                      </span>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon-sm"
                        aria-label={`Increase quantity of ${item.name}`}
                        onClick={() => setQuantity(item.productId, item.quantity + 1, item.variantId)}
                        disabled={item.available === false || (item.maxQuantity != null && item.quantity >= item.maxQuantity)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end">
                    <p className="font-semibold">
                      {formatCurrency(item.price * item.quantity, item.currency)}
                    </p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                        className="text-error hover:border-error/30 hover:bg-error/10 hover:text-error"
                      onClick={() => removeItem(item.productId, item.variantId)}
                    >
                      <Trash2 className="h-4 w-4" />
                      Remove
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <Card className="h-fit">
            <CardContent className="space-y-5 p-6">
              <h2 className="font-display text-2xl font-semibold">Order summary</h2>
              <div className="flex justify-between border-t border-border pt-4">
                <span>Subtotal</span>
                <span className="font-semibold">{formatCurrency(total, currency)}</span>
              </div>
              <Button asChild className="w-full">
                <Link to={routes.checkout}>Continue to checkout</Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link to={routes.products}>Continue shopping</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
