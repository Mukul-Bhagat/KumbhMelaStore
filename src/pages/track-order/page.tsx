import { zodResolver } from '@hookform/resolvers/zod'
import { CheckCircle2, PackageCheck, Search, Truck } from 'lucide-react'
import { useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { ErrorState } from '@/components/ui/error-state'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Seo } from '@/components/layout/seo'
import { SectionHeading } from '@/components/layout/section-heading'
import { useOrderTrackingMutation, useTranslate } from '@/shared/cms/hooks'
import { formatDate } from '@/shared/lib/format'

const trackOrderSchema = z.object({
  orderNumber: z.string().min(3, 'Enter your order number.'),
  email: z.string().email('Enter a valid email address.').optional().or(z.literal('')),
  phone: z.string().optional(),
  trackingCode: z.string().optional(),
})

type TrackOrderValues = z.infer<typeof trackOrderSchema>

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null
  }

  return value as Record<string, unknown>
}

function asArray(value: unknown) {
  return Array.isArray(value) ? value : []
}

function readString(value: unknown, fallback = '') {
  if (typeof value === 'string') {
    return value
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value)
  }

  return fallback
}

function statusVariant(status?: string) {
  switch (status?.toLowerCase()) {
    case 'delivered':
      return 'success'
    case 'packed':
    case 'confirmed':
      return 'premium'
    case 'in_transit':
      return 'warning'
    case 'cancelled':
      return 'error'
    default:
      return 'outline'
  }
}

export function Component() {
  const mutation = useOrderTrackingMutation()
  const { t } = useTranslate()

  const form = useForm<TrackOrderValues>({
    resolver: zodResolver(trackOrderSchema),
    defaultValues: {
      orderNumber: '',
      email: '',
      phone: '',
      trackingCode: '',
    },
  })

  const onSubmit = form.handleSubmit(async (values) => {
    await mutation.mutateAsync({
      orderNumber: values.orderNumber,
      email: values.email || undefined,
      phone: values.phone || undefined,
      trackingCode: values.trackingCode || undefined,
    })
  })

  const tracking = useMemo(() => asRecord(mutation.data), [mutation.data])
  const events = asArray(tracking?.events ?? tracking?.timeline).map(asRecord).filter(Boolean) as Record<string, unknown>[]

  return (
    <div className="space-y-16">
      <Seo
        title={t('track_order.title', 'Track order')}
        description={t(
          'track_order.description',
          'Track your KumbhMelaStore order using the public tracking projection.',
        )}
      />

      <section className="space-y-5">
        <Badge variant="premium">{t('track_order.badge', 'Track order')}</Badge>
        <div className="space-y-4">
          <h1 className="font-display text-5xl font-semibold tracking-tight sm:text-6xl">
            {t(
              'track_order.heading',
              'Follow your order from studio to doorstep.',
            )}
          </h1>
          <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
            {t(
              'track_order.subheading',
              'Enter your order number and optional verification details to load the live order projection from Supabase.',
            )}
          </p>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
        <Card className="shadow-[var(--shadow-elevated)]">
          <CardContent className="space-y-6 p-6 sm:p-8">
            <SectionHeading
              eyebrow={t('track_order.lookup_badge', 'Lookup')}
              title={t('track_order.lookup_title', 'Find your shipment')}
              description={t(
                'track_order.lookup_description',
                'Use the details from your confirmation email or dashboard.',
              )}
            />
            <form className="space-y-4" onSubmit={onSubmit}>
              <div className="space-y-2">
                <Label htmlFor="track-order-number">{t('track_order.order_number', 'Order number')}</Label>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="track-order-number"
                    className="pl-11"
                    placeholder="#KM-20488"
                    {...form.register('orderNumber')}
                  />
                </div>
                {form.formState.errors.orderNumber ? (
                  <p className="text-xs text-error">
                    {form.formState.errors.orderNumber.message}
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="track-order-email">{t('track_order.email', 'Email')}</Label>
                <Input
                  id="track-order-email"
                  type="email"
                  placeholder="name@example.com"
                  {...form.register('email')}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="track-order-phone">{t('track_order.phone', 'Phone')}</Label>
                  <Input
                    id="track-order-phone"
                    placeholder="+91 98765 43210"
                    {...form.register('phone')}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="track-order-code">
                    {t('track_order.code', 'Tracking code')}
                  </Label>
                  <Input
                    id="track-order-code"
                    placeholder="Public tracking code"
                    {...form.register('trackingCode')}
                  />
                </div>
              </div>

              {mutation.error ? (
                <ErrorState
                  title={t('track_order.error_title', 'Unable to load tracking')}
                  description={
                    mutation.error instanceof Error
                      ? mutation.error.message
                      : t(
                          'track_order.error_message',
                          'The public tracking projection could not be loaded.',
                        )
                  }
                />
              ) : null}

              <Button type="submit" className="w-full" disabled={mutation.isPending}>
                <Search className="h-4 w-4" aria-hidden="true" />
                {t('track_order.cta', 'Track order')}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="shadow-[var(--shadow-soft)]">
          <CardContent className="space-y-6 p-6 sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                  {t('track_order.result_badge', 'Current order')}
                </p>
                <h2 className="font-display text-3xl font-semibold tracking-tight">
                  {readString(tracking?.orderNumber ?? tracking?.order_number, '—')}
                </h2>
              </div>
              <Badge variant={statusVariant(readString(tracking?.status))}>
                {readString(tracking?.status, t('track_order.status_pending', 'Pending'))}
              </Badge>
            </div>

            <Separator />

            {tracking ? (
              <div className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-[var(--radius-field)] border border-border bg-background p-4">
                    <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                      {t('track_order.updated', 'Last updated')}
                    </p>
                    <p className="mt-2 font-display text-2xl font-semibold">
                      {readString(
                        tracking.updatedAt ?? tracking.updated_at,
                        formatDate(new Date()),
                      )}
                    </p>
                  </div>
                  <div className="rounded-[var(--radius-field)] border border-border bg-background p-4">
                    <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                      {t('track_order.eta', 'ETA')}
                    </p>
                    <p className="mt-2 font-display text-2xl font-semibold">
                      {readString(tracking.eta ?? tracking.estimatedDelivery ?? 'Pending')}
                    </p>
                  </div>
                </div>

                {readString(tracking.summary ?? tracking.message) ? (
                  <div className="rounded-[var(--radius-field)] border border-border bg-surface/60 p-4 text-sm leading-6 text-muted-foreground">
                    {readString(tracking.summary ?? tracking.message)}
                  </div>
                ) : null}

                {events.length ? (
                  <div className="space-y-4">
                    {events.map((event, index) => (
                      <div key={`${readString(event.title ?? event.status ?? 'event')}-${index}`} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className="grid h-10 w-10 place-items-center rounded-full border border-border bg-muted text-muted-foreground">
                            {index === 0 ? (
                              <PackageCheck className="h-4 w-4" aria-hidden="true" />
                            ) : index === events.length - 1 ? (
                              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                            ) : (
                              <Truck className="h-4 w-4" aria-hidden="true" />
                            )}
                          </div>
                          {index !== events.length - 1 ? (
                            <div className="h-full w-px bg-border" />
                          ) : null}
                        </div>
                        <div className="pb-6">
                          <p className="font-medium text-foreground">
                            {readString(event.title ?? event.status ?? 'Event')}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {readString(event.note ?? event.note_key ?? '')}
                          </p>
                          <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                            {readString(event.eventAt ?? event.event_at ?? '')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    title={t('track_order.empty_title', 'Tracking details will appear here')}
                    description={t(
                      'track_order.empty_description',
                      'Submit a valid order number to see the public shipment projection.',
                    )}
                  />
                )}
              </div>
            ) : (
              <EmptyState
                title={t('track_order.empty_title', 'Tracking details will appear here')}
                description={t(
                  'track_order.empty_description',
                  'Submit a valid order number to see the public shipment projection.',
                )}
              />
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
