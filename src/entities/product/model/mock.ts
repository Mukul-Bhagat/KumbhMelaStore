import type { Product } from '@/entities/product/model/types'

export const products: Product[] = [
  {
    slug: 'sacred-kalash-set',
    name: 'Sacred Kalash Set',
    category: 'Ritual Essentials',
    collection: 'Temple Heritage',
    summary:
      'A balanced copper-and-brass set for daily abhishek and ceremonial offerings.',
    description:
      'Hand-finished in warm copper tones with a grounded silhouette, this set is designed for homes that want ritual objects to feel architectural and enduring.',
    price: 4899,
    compareAtPrice: 5999,
    rating: 4.9,
    reviewCount: 128,
    badge: 'Best Seller',
    accent: 'Copper',
    imageId: 'sample',
    material: 'Copper, brass, and hand-polished lacquer',
    dimensions: 'Height 18 cm · Base 11 cm',
    highlights: [
      'Weighted for balance during daily ritual use',
      'Soft-matte interior finish to reduce tarnish',
      'Arrives in a gift-ready recyclable box',
    ],
    care: [
      'Wipe with a soft dry cloth after each use',
      'Avoid harsh detergents and abrasive pads',
      'Store in a dry place away from direct sunlight',
    ],
  },
  {
    slug: 'marble-prayer-altar',
    name: 'Marble Prayer Altar',
    category: 'Home Sanctum',
    collection: 'Sacred White',
    summary:
      'A compact marble altar with a sculpted back panel and concealed storage.',
    description:
      'Designed for modern apartments, this altar uses sandstone marble and subtle brass detailing to create a calm focal point without visual clutter.',
    price: 13999,
    compareAtPrice: 15999,
    rating: 5,
    reviewCount: 64,
    badge: 'New Arrival',
    accent: 'Marble',
    imageId: 'sample',
    material: 'Sandstone marble, brass inlay',
    dimensions: 'Width 65 cm · Depth 28 cm · Height 112 cm',
    highlights: [
      'Hidden drawer for incense and dhoop',
      'Cable-ready back panel for soft lighting',
      'Polished edge profile for a premium finish',
    ],
    care: [
      'Use a damp microfiber cloth only',
      'Do not place hot diyas directly on the surface',
      'Seal with marble conditioner every six months',
    ],
  },
  {
    slug: 'river-light-aarti-tray',
    name: 'River Light Aarti Tray',
    category: 'Ritual Serveware',
    collection: 'Morning Light',
    summary:
      'A refined tray set for aarti, prasad, and everyday offerings with a soft river-inspired contour.',
    description:
      'The tray’s flowing edge references sacred water and the movement of festival lamps, making it equally suitable for intimate rituals and formal gifting.',
    price: 2599,
    compareAtPrice: 3199,
    rating: 4.8,
    reviewCount: 92,
    badge: 'Editor’s Pick',
    accent: 'Brass',
    imageId: 'sample',
    material: 'Brass with food-safe lacquer',
    dimensions: 'Tray diameter 30 cm',
    highlights: [
      'Seamless edges for easy cleaning',
      'Lightweight but stable in hand',
      'Pairs with diya and kumkum bowls',
    ],
    care: [
      'Hand wash and dry immediately',
      'Polish occasionally with a soft cloth',
      'Avoid dishwasher or extended soaking',
    ],
  },
  {
    slug: 'heritage-gift-box',
    name: 'Heritage Gift Box',
    category: 'Gifting',
    collection: 'Brass & Ivory',
    summary:
      'A curated gifting set with incense, an artisanal diya, and premium wrapping.',
    description:
      'Created for weddings, housewarmings, and festival gifting, the box layers premium materials with a quiet presentation that feels ceremonial from the first unboxing.',
    price: 3299,
    compareAtPrice: 3999,
    rating: 4.9,
    reviewCount: 51,
    badge: 'Gift Ready',
    accent: 'Ivory',
    imageId: 'sample',
    material: 'Rigid board, cotton wrap, brass accents',
    dimensions: 'Box 32 x 24 x 10 cm',
    highlights: [
      'Includes personalized message card',
      'Designed for premium festival gifting',
      'Shipped in protective outer packaging',
    ],
    care: [
      'Keep the box away from moisture',
      'Reuse the internal trays for storage',
      'Handle the wrap with dry hands only',
    ],
  },
  {
    slug: 'saffron-samadhi-candle',
    name: 'Saffron Samadhi Candle',
    category: 'Ambience',
    collection: 'Temple Heritage',
    summary:
      'A gently scented candle with saffron, sandalwood, and vetiver notes.',
    description:
      'Crafted to complement morning prayer and evening quiet, this candle brings a restrained fragrance profile that never overwhelms a space.',
    price: 1199,
    compareAtPrice: 1499,
    rating: 4.7,
    reviewCount: 84,
    badge: 'Calm Ritual',
    accent: 'Saffron',
    imageId: 'sample',
    material: 'Soy wax, cotton wick, glass vessel',
    dimensions: 'Burn time approx. 38 hours',
    highlights: [
      'Even burn and low-soot wick',
      'Vessel can be reused after cleaning',
      'Pairs beautifully with evening prayer kits',
    ],
    care: [
      'Trim wick before each burn',
      'Allow full melt pool on the first light',
      'Keep away from direct drafts',
    ],
  },
  {
    slug: 'temple-bell-duo',
    name: 'Temple Bell Duo',
    category: 'Sound Ritual',
    collection: 'Copper Sound',
    summary:
      'A tuned pair of bells designed for a clear, lingering resonance during prayer.',
    description:
      'The duo is tuned to create a gentle layered response, supporting both solo ritual practice and larger family ceremonies.',
    price: 2199,
    compareAtPrice: 2699,
    rating: 4.8,
    reviewCount: 73,
    badge: 'Hand Tuned',
    accent: 'Brass',
    imageId: 'sample',
    material: 'Brass alloy with braided hanging cord',
    dimensions: 'Small 9 cm · Large 12 cm',
    highlights: [
      'Balanced tone with slow decay',
      'Comfortable grip for repeated use',
      'Packaged with a protective cloth wrap',
    ],
    care: [
      'Store dry to retain the finish',
      'Polish gently with brass cleaner',
      'Avoid impact against hard surfaces',
    ],
  },
]

export function getProductBySlug(slug: string) {
  return products.find((product) => product.slug === slug)
}
