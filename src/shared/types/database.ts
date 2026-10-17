export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

type Relationship = {
  foreignKeyName: string
  columns: string[]
  isOneToOne?: boolean
  referencedRelation: string
  referencedColumns: string[]
}

type TableShape<
  Row extends Record<string, unknown> = Record<string, unknown>,
  Insert extends Record<string, unknown> = Record<string, unknown>,
  Update extends Record<string, unknown> = Record<string, unknown>,
> = {
  Row: Row
  Insert: Insert
  Update: Update
  Relationships: Relationship[]
}

type Translatable = {
  id: string
  namespace: string
  translation_key: string
  language_code: 'hi' | 'en'
  value_text: string | null
  value_json: Json | null
  is_active: boolean
  created_at: string
  updated_at: string
}

type Profile = {
  id: string
  full_name: string | null
  display_name: string | null
  avatar_url: string | null
  phone: string | null
  locale_code: 'hi' | 'en'
  status: 'active' | 'suspended' | 'pending'
  created_at: string
  updated_at: string
}

type Role = {
  id: string
  slug: 'customer' | 'super_admin' | 'admin' | 'vendor'
  name: string
  description: string | null
  is_system: boolean
  created_at: string
  updated_at: string
}

type UserRole = {
  user_id: string
  role_id: string
  granted_at: string
  granted_by: string | null
}

type LanguageRow = {
  code: 'hi' | 'en'
  name: string
  native_name: string
  content_language: string
  is_default: boolean
  is_enabled: boolean
  sort_order: number
}

type SiteSetting = {
  id: string
  setting_key: string
  setting_value: Json
  is_public: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

type Media = {
  id: string
  provider: string
  public_id: string
  secure_url: string
  alt_text: string | null
  blur_data_url: string | null
  width: number | null
  height: number | null
  format: string | null
  metadata: Json | null
  is_public: boolean
  created_by: string | null
  created_at: string
  updated_at: string
}

type NavigationMenu = {
  id: string
  menu_key: string
  location: 'header' | 'shop' | 'account' | 'admin' | 'footer' | 'legal'
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

type NavigationMenuItem = {
  id: string
  menu_id: string
  parent_id: string | null
  label_key: string
  href: string
  route_type: 'internal' | 'external' | 'action'
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

type FooterSection = {
  id: string
  section_key: string
  title_key: string
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

type FooterLink = {
  id: string
  section_id: string
  label_key: string
  href: string
  route_type: 'internal' | 'external' | 'action'
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

type Announcement = {
  id: string
  announcement_key: string
  is_active: boolean
  dismissible: boolean
  variant: 'info' | 'success' | 'warning' | 'premium'
  starts_at: string | null
  ends_at: string | null
  created_at: string
  updated_at: string
}

type Page = {
  id: string
  slug: string
  template: 'landing' | 'document' | 'cms' | 'blog' | 'product' | 'collection' | 'category'
  title_key: string
  description_key: string | null
  seo_title_key: string | null
  seo_description_key: string | null
  is_public: boolean
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

type PageSection = {
  id: string
  page_id: string
  section_key: string
  section_type:
    | 'hero'
    | 'stats'
    | 'collection-grid'
    | 'product-grid'
    | 'feature-grid'
    | 'testimonial-grid'
    | 'blog-grid'
    | 'rich-text'
    | 'cta'
    | 'faq-grid'
    | 'media-split'
    | 'contact-grid'
    | 'announcement'
    | 'empty'
  sort_order: number
  is_active: boolean
  media_id: string | null
  payload: Json | null
  eyebrow_key: string | null
  title_key: string | null
  description_key: string | null
  body_key: string | null
  primary_cta_label_key: string | null
  primary_cta_href: string | null
  secondary_cta_label_key: string | null
  secondary_cta_href: string | null
  created_at: string
  updated_at: string
}

type HeroSlide = {
  id: string
  slide_key: string
  media_id: string | null
  is_active: boolean
  sort_order: number
  payload: Json | null
  created_at: string
  updated_at: string
}

type Blog = {
  id: string
  slug: string
  author_id: string | null
  cover_media_id: string | null
  reading_time_minutes: number | null
  is_featured: boolean
  published_at: string | null
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

type Faq = {
  id: string
  faq_key: string
  faq_group: string
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

type Policy = {
  id: string
  slug: string
  policy_type: 'privacy' | 'terms' | 'refund' | 'shipping' | 'custom'
  title_key: string
  body_key: string
  seo_title_key: string | null
  seo_description_key: string | null
  published_at: string | null
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

type Category = {
  id: string
  slug: string
  image_media_id: string | null
  parent_id: string | null
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

type Collection = {
  id: string
  slug: string
  cover_media_id: string | null
  hero_media_id: string | null
  is_featured: boolean
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

type Product = {
  id: string
  slug: string
  sku: string
  barcode: string | null
  product_type: string | null
  vendor: string | null
  short_description: string | null
  category_id: string | null
  collection_id: string | null
  currency: string
  base_price: number
  compare_at_price: number | null
  cost_per_item: number | null
  taxable: boolean
  track_inventory: boolean
  inventory_quantity: number
  continue_selling_when_out_of_stock: boolean
  low_stock_threshold: number
  is_physical: boolean
  weight: number | null
  weight_unit: string
  length: number | null
  width: number | null
  height: number | null
  measurement_unit: string
  country_of_origin: string | null
  hs_code: string | null
  product_options: Json
  created_by: string | null
  updated_by: string | null
  stock_status: 'draft' | 'active' | 'archived'
  is_featured: boolean
  is_active: boolean
  material: string | null
  dimensions: string | null
  metadata: Json | null
  created_at: string
  updated_at: string
}

type ProductVariant = {
  id: string
  product_id: string
  title: string
  option_values: Json
  sku: string | null
  barcode: string | null
  price: number
  compare_at_price: number | null
  track_inventory: boolean
  inventory_quantity: number
  continue_selling_when_out_of_stock: boolean
  weight: number | null
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

type ProductCollection = {
  product_id: string
  collection_id: string
  created_at: string
}

type ProductTag = {
  id: string
  name: string
  created_at: string
}

type ProductTagAssignment = {
  product_id: string
  tag_id: string
  created_at: string
}

type InventoryMovement = {
  id: string
  product_id: string
  variant_id: string | null
  quantity_delta: number
  quantity_after: number
  reason: string
  source: 'admin' | 'order'
  order_id: string | null
  created_by: string | null
  created_at: string
}

type ProductImage = {
  id: string
  product_id: string
  media_id: string
  sort_order: number
  is_primary: boolean
  alt_key: string | null
  created_at: string
  updated_at: string
}

type Review = {
  id: string
  product_id: string
  user_id: string
  rating: number
  title: string | null
  body: string
  status: 'pending' | 'approved' | 'rejected'
  is_verified_purchase: boolean
  created_at: string
  updated_at: string
}

type ReviewReply = {
  id: string
  review_id: string
  user_id: string
  body: string
  created_at: string
  updated_at: string
}

type Address = {
  id: string
  user_id: string
  label: string
  recipient_name: string
  phone: string
  line1: string
  line2: string | null
  city: string
  state: string
  postal_code: string
  country_code: string
  landmark: string | null
  is_default: boolean
  created_at: string
  updated_at: string
}

type Coupon = {
  id: string
  code: string
  description: string | null
  discount_type: 'percentage' | 'fixed'
  discount_value: number
  min_order_value: number | null
  max_redemptions: number | null
  max_redemptions_per_user: number | null
  starts_at: string | null
  ends_at: string | null
  is_active: boolean
  metadata: Json | null
  created_at: string
  updated_at: string
}

type Order = {
  id: string
  user_id: string
  checkout_request_id: string | null
  order_number: string
  public_tracking_code: string
  status: 'draft' | 'placed' | 'confirmed' | 'packed' | 'in_transit' | 'delivered' | 'cancelled'
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded' | 'cash_on_delivery'
  payment_method: 'upi' | 'card' | 'net_banking' | 'cod' | 'wallet' | 'manual'
  currency: string
  subtotal: number
  discount_total: number
  shipping_total: number
  tax_total: number
  grand_total: number
  coupon_id: string | null
  shipping_address_snapshot: Json | null
  billing_address_snapshot: Json | null
  contact_email: string
  contact_phone: string
  placed_at: string | null
  confirmed_at: string | null
  shipped_at: string | null
  delivered_at: string | null
  cancelled_at: string | null
  tracking_summary: Json | null
  created_at: string
  updated_at: string
}

type OrderItem = {
  id: string
  order_id: string
  product_id: string | null
  variant_id: string | null
  product_snapshot: Json | null
  quantity: number
  unit_price: number
  line_total: number
  currency: string
  created_at: string
  updated_at: string
}

type OrderStatusEvent = {
  id: string
  order_id: string
  status: string
  note_key: string | null
  event_at: string
  metadata: Json | null
  created_at: string
  updated_at: string
}

type SiteContent = {
  id: string
  content_key: string
  content_type:
    | 'text'
    | 'rich_text'
    | 'cta'
    | 'card'
    | 'grid'
    | 'quote'
    | 'stats'
    | 'media'
  sort_order: number
  is_active: boolean
  payload: Json | null
  created_at: string
  updated_at: string
}

export interface Database {
  public: {
    Tables: {
      profiles: TableShape<Profile, Partial<Profile>, Partial<Profile>>
      roles: TableShape<Role, Partial<Role>, Partial<Role>>
      user_roles: TableShape<UserRole, Partial<UserRole>, Partial<UserRole>>
      languages: TableShape<LanguageRow, Partial<LanguageRow>, Partial<LanguageRow>>
      translations: TableShape<Translatable, Partial<Translatable>, Partial<Translatable>>
      site_settings: TableShape<SiteSetting, Partial<SiteSetting>, Partial<SiteSetting>>
      media: TableShape<Media, Partial<Media>, Partial<Media>>
      navigation_menus: TableShape<NavigationMenu, Partial<NavigationMenu>, Partial<NavigationMenu>>
      navigation_menu_items: TableShape<
        NavigationMenuItem,
        Partial<NavigationMenuItem>,
        Partial<NavigationMenuItem>
      >
      footer_sections: TableShape<FooterSection, Partial<FooterSection>, Partial<FooterSection>>
      footer_links: TableShape<FooterLink, Partial<FooterLink>, Partial<FooterLink>>
      announcements: TableShape<Announcement, Partial<Announcement>, Partial<Announcement>>
      pages: TableShape<Page, Partial<Page>, Partial<Page>>
      page_sections: TableShape<PageSection, Partial<PageSection>, Partial<PageSection>>
      hero_slides: TableShape<HeroSlide, Partial<HeroSlide>, Partial<HeroSlide>>
      blogs: TableShape<Blog, Partial<Blog>, Partial<Blog>>
      faqs: TableShape<Faq, Partial<Faq>, Partial<Faq>>
      policies: TableShape<Policy, Partial<Policy>, Partial<Policy>>
      categories: TableShape<Category, Partial<Category>, Partial<Category>>
      collections: TableShape<Collection, Partial<Collection>, Partial<Collection>>
      products: TableShape<Product, Partial<Product>, Partial<Product>>
      product_variants: TableShape<
        ProductVariant,
        Partial<ProductVariant>,
        Partial<ProductVariant>
      >
      product_collections: TableShape<
        ProductCollection,
        Partial<ProductCollection>,
        Partial<ProductCollection>
      >
      product_tags: TableShape<ProductTag, Partial<ProductTag>, Partial<ProductTag>>
      product_tag_assignments: TableShape<
        ProductTagAssignment,
        Partial<ProductTagAssignment>,
        Partial<ProductTagAssignment>
      >
      inventory_movements: TableShape<
        InventoryMovement,
        Partial<InventoryMovement>,
        Partial<InventoryMovement>
      >
      product_images: TableShape<ProductImage, Partial<ProductImage>, Partial<ProductImage>>
      reviews: TableShape<Review, Partial<Review>, Partial<Review>>
      review_replies: TableShape<ReviewReply, Partial<ReviewReply>, Partial<ReviewReply>>
      addresses: TableShape<Address, Partial<Address>, Partial<Address>>
      coupons: TableShape<Coupon, Partial<Coupon>, Partial<Coupon>>
      orders: TableShape<Order, Partial<Order>, Partial<Order>>
      order_items: TableShape<OrderItem, Partial<OrderItem>, Partial<OrderItem>>
      order_status_events: TableShape<
        OrderStatusEvent,
        Partial<OrderStatusEvent>,
        Partial<OrderStatusEvent>
      >
      site_content: TableShape<SiteContent, Partial<SiteContent>, Partial<SiteContent>>
    }
    Views: Record<string, never>
    Functions: {
      get_site_shell: {
        Args: { p_locale: 'hi' | 'en' }
        Returns: Json
      }
      get_page_content: {
        Args: { p_locale: 'hi' | 'en'; p_slug: string }
        Returns: Json
      }
      get_public_order_tracking: {
        Args: {
          p_email?: string | null
          p_order_number: string
          p_phone?: string | null
          p_tracking_code?: string | null
        }
        Returns: Json
      }
      place_order: {
        Args: {
          p_cart_items: Json
          p_checkout_request_id: string
          p_shipping_address: Json
        }
        Returns: Array<{
          currency: string
          grand_total: number
          order_id: string
          order_number: string
          public_tracking_code: string
        }>
      }
      cancel_order: {
        Args: { p_order_id: string }
        Returns: undefined
      }
      admin_update_order: {
        Args: {
          p_order_id: string
          p_status: Database['public']['Enums']['order_status']
          p_payment_status: Database['public']['Enums']['payment_status']
          p_tracking_summary: Json | null
        }
        Returns: undefined
      }
      admin_save_product: {
        Args: {
          p_collection_ids: string[]
          p_inventory_reason?: string | null
          p_product: Json
          p_product_id: string | null
          p_tags: string[]
          p_variants: Json
        }
        Returns: string
      }
      admin_list_products: {
        Args: {
          p_category_id?: string | null
          p_collection_id?: string | null
          p_inventory_status?: string | null
          p_page?: number
          p_page_size?: number
          p_search?: string | null
          p_sort?: string
          p_ascending?: boolean
          p_status?: string | null
        }
        Returns: Json
      }
      admin_reorder_product_images: {
        Args: { p_images: Json; p_product_id: string }
        Returns: undefined
      }
    }
    Enums: {
      locale_code: 'hi' | 'en'
      role_slug: 'customer' | 'super_admin' | 'admin' | 'vendor'
      order_status: 'draft' | 'placed' | 'confirmed' | 'packed' | 'in_transit' | 'delivered' | 'cancelled'
      payment_status: 'pending' | 'paid' | 'failed' | 'refunded' | 'cash_on_delivery'
    }
    CompositeTypes: Record<string, never>
  }
}
