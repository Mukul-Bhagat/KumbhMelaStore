import type { Order } from '@/entities/order/model/types'
import { collections } from '@/entities/collection/model/mock'
import { products } from '@/entities/product/model/mock'
import type { UserProfile } from '@/entities/user/model/types'
import { slugify } from '@/shared/lib/format'

export const featuredCollections = collections

export const bestSellers = products.slice(0, 4)

export const categoryCatalog = [
  {
    slug: 'ritual-essentials',
    title: 'Ritual Essentials',
    description:
      'Daily-use objects that support prayer, aarti, and ritual setup with ease.',
    badge: 'Daily use',
    accent: 'Copper',
  },
  {
    slug: 'home-sanctum',
    title: 'Home Sanctum',
    description:
      'Furniture and accent pieces designed for calm home shrines and sacred corners.',
    badge: 'Space making',
    accent: 'Marble',
  },
  {
    slug: 'ritual-serveware',
    title: 'Ritual Serveware',
    description:
      'Aarti trays, prasad plates, and presentation pieces for ceremonial serving.',
    badge: 'Presentation',
    accent: 'Brass',
  },
  {
    slug: 'gifting',
    title: 'Gifting',
    description:
      'Presentation-led bundles that feel thoughtful for weddings and festivals alike.',
    badge: 'Gift ready',
    accent: 'Ivory',
  },
  {
    slug: 'ambience',
    title: 'Ambience',
    description:
      'Candles, scent, and quiet atmosphere pieces that soften the ritual space.',
    badge: 'Mood setting',
    accent: 'Saffron',
  },
  {
    slug: 'sound-ritual',
    title: 'Sound Ritual',
    description:
      'Bells and resonant forms that add a subtle sonic layer to daily devotion.',
    badge: 'Tonal',
    accent: 'Brass',
  },
] as const

export const categoryCounts = categoryCatalog.map((category) => ({
  ...category,
  itemCount: products.filter((product) => slugify(product.category) === category.slug)
    .length,
}))

export const heroStats = [
  { label: 'Curated pieces', value: '120+' },
  { label: 'Customer rating', value: '4.9/5' },
  { label: 'Delivery promise', value: '48h dispatch' },
  { label: 'Packaging', value: 'Gift ready' },
] as const

export const authenticityPillars = [
  {
    title: 'Verified craftsmanship',
    description:
      'Materials, finish, and packaging are checked at every step before items leave the studio.',
  },
  {
    title: 'Heritage-led curation',
    description:
      'We design every collection with temple geometry, sacred water, brass, and marble in mind.',
  },
  {
    title: 'Premium delivery',
    description:
      'Secure packaging, fast dispatch, and careful handling ensure the unboxing feels ceremonial.',
  },
] as const

export const templeHeritageMoments = [
  {
    title: 'Morning light',
    description:
      'Soft, editorial visuals and generous spacing evoke the calm of a quiet temple courtyard.',
  },
  {
    title: 'Sacred materials',
    description:
      'Copper, brass, ivory, sandstone, and saffron anchor the palette without feeling ornamental.',
  },
  {
    title: 'Timeless utility',
    description:
      'Every object is designed to be used daily, gifted gracefully, and kept for years.',
  },
] as const

export const giftBoxes = [
  {
    title: 'Housewarming offering',
    description: 'A refined bundle with aarti essentials, incense, and a keepsake tray.',
    price: 'From ₹2,499',
  },
  {
    title: 'Wedding blessing',
    description: 'A generous ceremonial gift with brass accents and premium wrapping.',
    price: 'From ₹4,299',
  },
  {
    title: 'Festival ritual set',
    description: 'An elegant set for puja, gifting, and personal shrine refreshes.',
    price: 'From ₹1,899',
  },
] as const

export const testimonials = [
  {
    quote:
      'The packaging felt as thoughtful as the product. It arrived ready to gift and looked far more premium than I expected.',
    author: 'Ananya R.',
    role: 'Wedding gifting',
  },
  {
    quote:
      'Every piece feels considered. The site is calm, and the collection looks like a heritage brand should look online.',
    author: 'Rahul S.',
    role: 'Home sanctum customer',
  },
  {
    quote:
      'The quality of the brass tray and the finish on the altar exceeded our expectations. Beautiful work.',
    author: 'Priya M.',
    role: 'Repeat buyer',
  },
] as const

export const blogPosts = [
  {
    title: 'Designing a sacred corner at home',
    excerpt:
      'How to bring calm, balance, and subtle ritual into a modern living space without visual clutter.',
    readTime: '5 min read',
  },
  {
    title: 'The language of brass and marble',
    excerpt:
      'Why these materials continue to feel contemporary when paired with minimal, premium design.',
    readTime: '4 min read',
  },
  {
    title: 'Gifting with intention during festival season',
    excerpt:
      'A practical guide to choosing ceremonial gifts that feel generous, durable, and deeply personal.',
    readTime: '6 min read',
  },
] as const

export const dashboardStats = [
  { label: 'Orders', value: '12' },
  { label: 'Wishlist', value: '8' },
  { label: 'Saved addresses', value: '3' },
  { label: 'Loyalty tier', value: 'Heritage' },
] as const

export const dashboardOrders: Order[] = [
  {
    id: 'ord_1001',
    number: '#KM-20491',
    date: '2026-06-24',
    status: 'Delivered',
    total: 4899,
    itemCount: 2,
    payment: 'Prepaid',
  },
  {
    id: 'ord_1002',
    number: '#KM-20488',
    date: '2026-06-18',
    status: 'In Transit',
    total: 3299,
    itemCount: 1,
    eta: '2026-07-04',
    payment: 'Prepaid',
  },
  {
    id: 'ord_1003',
    number: '#KM-20460',
    date: '2026-05-31',
    status: 'Packed',
    total: 13999,
    itemCount: 1,
    eta: '2026-07-01',
    payment: 'Cash on Delivery',
  },
]

export const savedAddresses = [
  {
    label: 'Home',
    value:
      '14, Vrindavan Avenue, Phase 2, Jaipur, Rajasthan 302001',
  },
  {
    label: 'Studio',
    value: '22, Heritage Lane, Indiranagar, Bengaluru, Karnataka 560038',
  },
] as const

export const profile: UserProfile = {
  name: 'Mukul Sharma',
  email: 'mukul@example.com',
  phone: '+91 98765 43210',
  avatarInitials: 'MS',
  tier: 'Heritage',
  location: 'Jaipur, India',
}

export const trackOrderTimeline = [
  {
    step: 'Order placed',
    date: '2026-06-18',
    complete: true,
  },
  {
    step: 'Packed with care',
    date: '2026-06-19',
    complete: true,
  },
  {
    step: 'Dispatched',
    date: '2026-06-20',
    complete: true,
  },
  {
    step: 'Out for delivery',
    date: '2026-06-24',
    complete: false,
  },
] as const

export function getCategoryProducts(slug: string) {
  return products.filter((product) => slugify(product.category) === slug)
}
