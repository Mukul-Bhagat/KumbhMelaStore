import { z } from 'zod'

import type { CmsSectionType } from '@/shared/cms/types'
import type { Json } from '@/shared/types/database'

const jsonSchema: z.ZodType<Json> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
    z.array(jsonSchema),
    z.record(z.string(), jsonSchema),
  ]),
)

export const localeSchema = z.enum(['hi', 'en'])

export const translationRecordSchema = z.object({
  namespace: z.string(),
  translationKey: z.string(),
  languageCode: localeSchema,
  valueText: z.string().nullable(),
  valueJson: jsonSchema.nullable(),
})

export const cmsPageSectionSchema = z.object({
  id: z.string(),
  sectionKey: z.string(),
  sectionType: z.custom<CmsSectionType>(),
  sortOrder: z.number(),
  mediaId: z.string().nullable(),
  payload: jsonSchema.nullable(),
  eyebrowKey: z.string().nullable(),
  titleKey: z.string().nullable(),
  descriptionKey: z.string().nullable(),
  bodyKey: z.string().nullable(),
  primaryCtaLabelKey: z.string().nullable(),
  primaryCtaHref: z.string().nullable(),
  secondaryCtaLabelKey: z.string().nullable(),
  secondaryCtaHref: z.string().nullable(),
})

export const cmsPageRecordSchema = z.object({
  id: z.string(),
  slug: z.string(),
  template: z.enum(['landing', 'document', 'cms', 'blog', 'product', 'collection', 'category']),
  titleKey: z.string(),
  descriptionKey: z.string().nullable(),
  seoTitleKey: z.string().nullable(),
  seoDescriptionKey: z.string().nullable(),
  isPublic: z.boolean(),
  isActive: z.boolean(),
  sortOrder: z.number(),
})

export const cmsPageContentSchema = z.object({
  page: cmsPageRecordSchema,
  sections: z.array(cmsPageSectionSchema),
})

export const cmsShellContentSchema = z.object({
  brand: z.object({
    nameKey: z.string(),
    devanagariKey: z.string(),
    taglineKey: z.string(),
    descriptionKey: z.string(),
    supportEmail: z.string().email(),
    url: z.string().url(),
  }),
  locales: z.array(
    z.object({
      code: localeSchema,
      nameKey: z.string(),
      nativeNameKey: z.string(),
      isDefault: z.boolean(),
    }),
  ),
  navigation: z.object({
    primary: z.any().nullable(),
    shop: z.any().nullable(),
    account: z.any().nullable(),
    legal: z.any().nullable(),
    admin: z.any().nullable(),
  }),
  footer: z.object({
    sections: z.array(z.any()),
  }),
  announcements: z.array(z.any()),
  settings: z.array(
    z.object({
      key: z.string(),
      value: jsonSchema,
      isPublic: z.boolean(),
    }),
  ),
})

export const translationMapSchema = z.object({
  hi: z.record(z.string(), z.union([z.string(), jsonSchema])),
  en: z.record(z.string(), z.union([z.string(), jsonSchema])),
})
