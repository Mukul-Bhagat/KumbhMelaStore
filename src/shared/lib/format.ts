export function formatCurrency(
  value: number,
  currency = 'INR',
  locale = 'en-IN',
) {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatCompactNumber(value: number, locale = 'en-IN') {
  return new Intl.NumberFormat(locale, {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value)
}

export function formatDate(value: string | Date, locale = 'en-IN') {
  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(typeof value === 'string' ? new Date(value) : value)
}

export function formatPercent(value: number) {
  return `${value.toFixed(1)}%`
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
}
