export interface Product {
  slug: string
  name: string
  category: string
  collection: string
  summary: string
  description: string
  price: number
  compareAtPrice?: number
  rating: number
  reviewCount: number
  badge: string
  accent: string
  imageId: string
  material: string
  dimensions: string
  highlights: string[]
  care: string[]
}
