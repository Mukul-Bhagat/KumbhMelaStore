import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'

import { CloudinaryImage } from '@/components/media/cloudinary-image'
import { SectionHeading } from '@/components/layout/section-heading'
import { Seo } from '@/components/layout/seo'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { ErrorState } from '@/components/ui/error-state'
import { queryKeys } from '@/shared/api/keys'
import { fetchActiveCollections } from '@/shared/api/catalog-repository'
import { routes } from '@/shared/config/routes'
import { humanizeSlug } from '@/shared/lib/format'
import { useTranslate } from '@/shared/cms/hooks'

export function Component() {
  const { locale, t } = useTranslate()
  const collections = useQuery({
    queryKey: queryKeys.catalog.collections,
    queryFn: fetchActiveCollections,
  })
  const isHindi = locale === 'hi'
  const title = t('collections.title', isHindi ? 'हमारे संग्रह' : 'Our collections')
  const description = t(
    'collections.description',
    isHindi
      ? 'हर अवसर के लिए चुने गए आध्यात्मिक संग्रह देखें।'
      : 'Explore thoughtfully curated spiritual collections for every occasion.',
  )

  return (
    <div className="space-y-8">
      <Seo title={title} description={description} />
      <SectionHeading title={title} description={description} />
      {collections.isLoading ? (
        <div
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
          aria-label={isHindi ? 'संग्रह लोड हो रहे हैं' : 'Loading collections'}
          aria-busy="true"
        >
          {[0, 1, 2].map((item) => (
            <div
              key={item}
              className="aspect-[4/3] animate-pulse rounded-[var(--radius-card)] border border-border bg-surface"
            />
          ))}
        </div>
      ) : collections.error ? (
        <ErrorState
          title={t(
            'collections.load_error',
            isHindi ? 'संग्रह लोड नहीं हो सके' : 'Collections are unavailable',
          )}
          description={t(
            'collections.load_error_description',
            isHindi
              ? 'संग्रह सूची लोड नहीं हुई। कृपया फिर से प्रयास करें।'
              : 'The collections could not be loaded. Please try again.',
          )}
          retryLabel={t('common.retry', isHindi ? 'फिर से प्रयास करें' : 'Retry')}
          onRetry={() => {
            void collections.refetch()
          }}
        />
      ) : collections.data?.length ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {collections.data.map((collection) => {
            const name = humanizeSlug(collection.slug)
            const image =
              collection.coverImage?.secure_url ?? collection.coverImage?.public_id ?? ''

            return (
              <Card key={collection.id} className="group overflow-hidden p-0">
                <Link
                  to={routes.collectionDetail(collection.slug)}
                  className="block"
                  aria-label={`${isHindi ? 'संग्रह देखें' : 'View collection'}: ${name}`}
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-surface">
                    {image ? (
                      <CloudinaryImage
                        publicId={image}
                        alt={collection.coverImage?.alt_text ?? name}
                        className="transition-transform duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <div className="grid h-full place-items-center bg-gradient-to-br from-surface to-background">
                        <span className="font-display text-2xl text-muted-foreground">
                          {name}
                        </span>
                      </div>
                    )}
                    {collection.isFeatured ? (
                      <div className="absolute left-4 top-4">
                        <Badge variant="premium">
                          {t('collections.featured', isHindi ? 'विशेष संग्रह' : 'Featured')}
                        </Badge>
                      </div>
                    ) : null}
                  </div>
                </Link>
                <CardContent className="flex items-center justify-between gap-4 p-5">
                  <h2 className="font-display text-xl font-semibold">{name}</h2>
                  <Button asChild variant="outline" size="sm">
                    <Link to={routes.collectionDetail(collection.slug)}>
                      {t('collections.view', isHindi ? 'देखें' : 'Explore')}
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <EmptyState
          title={t(
            'collections.empty_title',
            isHindi ? 'संग्रह जल्द उपलब्ध होंगे' : 'Collections are coming soon',
          )}
          description={t(
            'collections.empty_description',
            isHindi
              ? 'तब तक हमारे उत्पादों को देखें।'
              : 'Browse our products while new collections are being prepared.',
          )}
          secondaryAction={
            <Button asChild variant="outline">
              <Link to={routes.products}>
                {t('nav.products', isHindi ? 'उत्पाद देखें' : 'Browse products')}
              </Link>
            </Button>
          }
        />
      )}
    </div>
  )
}
