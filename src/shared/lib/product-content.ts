import type { Json } from '@/shared/types/database'

export type ProductContentField = 'name' | 'description'
export type ProductContentLocale = 'en' | 'hi'

type JsonObject = { [key: string]: Json | undefined }

function asJsonObject(value: Json | undefined | null): JsonObject | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : null
}

export function readProductContent(
  metadata: Json | null,
  field: ProductContentField,
  locale: ProductContentLocale,
) {
  const root = asJsonObject(metadata)
  const localizedValue = root ? asJsonObject(root[field]) : null
  const value = localizedValue?.[locale] ?? localizedValue?.[locale === 'en' ? 'hi' : 'en']

  if (typeof value === 'string' && value.trim()) {
    return value.trim()
  }

  const legacyValue = root?.[field]
  return typeof legacyValue === 'string' && legacyValue.trim() ? legacyValue.trim() : null
}

export function withProductContent(
  metadata: Json | null,
  content: Record<ProductContentField, Record<ProductContentLocale, string | null>>,
): Json {
  const root = asJsonObject(metadata)
  if (metadata != null && !root) {
    throw new Error('Product metadata must be a JSON object to save localized product content.')
  }

  const result: JsonObject = { ...(root ?? {}) }
  for (const field of ['name', 'description'] as const) {
    const existing = asJsonObject(result[field])
    const localized: JsonObject = { ...(existing ?? {}) }
    for (const locale of ['en', 'hi'] as const) {
      const value = content[field][locale]
      if (value) {
        localized[locale] = value
      } else {
        delete localized[locale]
      }
    }
    if (Object.keys(localized).length > 0) {
      result[field] = localized
    } else {
      delete result[field]
    }
  }

  return result
}
