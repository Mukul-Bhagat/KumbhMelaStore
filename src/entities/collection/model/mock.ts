import type { Collection } from '@/entities/collection/model/types'

export const collections: Collection[] = [
  {
    slug: 'temple-heritage',
    title: 'Temple Heritage',
    description:
      'An elegant curation of ritual essentials shaped by temple architecture and morning light.',
    badge: 'Signature',
    accent: 'Copper',
    imageId: 'sample',
    itemCount: 18,
    priceFrom: 1199,
    details: ['Ritual essentials', 'Brass accents', 'Gift ready'],
  },
  {
    slug: 'sacred-white',
    title: 'Sacred White',
    description:
      'Quiet, marble-led pieces for serene home sanctums and contemporary interiors.',
    badge: 'Calm Collection',
    accent: 'Ivory',
    imageId: 'sample',
    itemCount: 12,
    priceFrom: 13999,
    details: ['Marble altar', 'Soft lines', 'Hidden storage'],
  },
  {
    slug: 'morning-light',
    title: 'Morning Light',
    description:
      'Lighter objects for sunrise routines, gifting, and refined daily practice.',
    badge: 'Best Seller',
    accent: 'Saffron',
    imageId: 'sample',
    itemCount: 15,
    priceFrom: 999,
    details: ['Aarti trays', 'Incense holders', 'Ambient candles'],
  },
  {
    slug: 'brass-and-ivory',
    title: 'Brass & Ivory',
    description:
      'Warm metal and ivory palettes that balance spiritual character with modern restraint.',
    badge: 'Gift Focused',
    accent: 'Brass',
    imageId: 'sample',
    itemCount: 21,
    priceFrom: 2199,
    details: ['Gifting sets', 'Festival bundles', 'Ceremonial packaging'],
  },
]

export function getCollectionBySlug(slug: string) {
  return collections.find((collection) => collection.slug === slug)
}
