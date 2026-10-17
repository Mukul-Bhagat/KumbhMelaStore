# Product-management schema mapping

This map is based on the checked-in Supabase foundation migration and the additive
product-management migrations. It describes the repository schema; it is not a
claim that the migrations have been applied to a hosted database.

## Existing schema reused

| Existing table | Relevant existing fields / behavior | Product-management use |
| --- | --- | --- |
| `products` | `id`, unique `slug`, unique `sku`, `category_id`, one `collection_id`, `currency`, `base_price`, `compare_at_price`, `stock_status`, `is_active`, `is_featured`, `material`, `dimensions`, localized `metadata`, timestamps | Retained as the canonical product record. The single collection reference remains for compatibility. |
| `product_images` | Product and media foreign keys, `sort_order`, `is_primary`, `alt_key`; unique product/media pair | Retained for image URLs/media references, accessible ordering, alt text, and primary image. A partial unique index enforces at most one primary image per product. |
| `media` | Provider, public ID, secure URL, alt text, dimensions, format, public flag | Reused for Cloudinary and external HTTPS image metadata. No unrelated media assets are deleted when a product image link is removed. |
| `categories`, `collections` | Active flags, slugs, ordering; products previously referenced at most one collection | Existing category and collection records remain. `product_collections` adds multiple collection assignments and existing `collection_id` values are backfilled. |
| `orders` | User ownership, status/payment, currency and numeric totals, delivery snapshots, tracking identifiers | Retained. `checkout_request_id` provides per-user checkout idempotency. |
| `order_items` | Nullable product reference, immutable JSON product snapshot, integer quantity, numeric unit/line prices, currency | Retained. A nullable `variant_id` is additive; title, selected variant, SKU, and image are snapshotted at checkout. |
| `user_roles` / `roles` | Existing `super_admin` role and `public.is_super_admin()` authorization helper | Reused by admin routes, RLS, and security-definer product RPCs. No second admin-role mechanism is introduced. |

The foundation defines `products_public_read` as active-and-published only,
`products_manage_admin` and `product_images_manage_admin` as Super Admin-only,
and public media reads as limited to media marked public. Existing order RLS
scopes customer order access by owner and administrative access by the same
Super Admin helper.

## Additions and reason

| Migration | Change | Reason |
| --- | --- | --- |
| `20261016_000001_order_workflow.sql` | Adds checkout request idempotency and replaces direct customer order writes with `place_order`, `cancel_order`, and `admin_update_order` functions. | Ensures server-side price calculation, delivery snapshots, and authorized order state changes. |
| `20261017_000001_shop_product_management.sql` | Adds inventory, shipping, vendor/type, barcode, tax, product options, and audit fields to `products`; adds `product_variants`, `product_collections`, `product_tags`, `product_tag_assignments`, and `inventory_movements`; adds `order_items.variant_id`. | The original schema has no variant records, tracked stock quantity, stock audit trail, multiple collection link, or product tags. |
| `20261017_000001_shop_product_management.sql` | Adds guarded admin save/list/gallery RPCs, published-product RLS for variants and image links, indexes/constraints, realtime publication membership when available, and variant-aware checkout. | Moves validation and privileged writes into the database and supports live catalog refresh without a code redeploy. |

Tracked stock is decremented inside the order transaction, with a movement
record written against the new order. Cancellation restores only the net stock
decrement recorded for that order; repeat cancellation cannot apply a second
restock. Admin cancellation restores inventory only for orders not yet shipped.
Cancelled orders cannot be reopened through the admin update function because
doing so would require a separate reservation workflow.

Products and variants are archived or deactivated rather than removed by the
new product workspace, preserving historical order snapshots. Removed gallery
links do not delete Cloudinary assets.

## Compatibility and validation notes

- Migrations are forward-only and additive; do not rerun the foundation
  migration against an existing database.
- The migrations have not been applied or executed against local, test, or
  hosted PostgreSQL in this work session. Validate them against a restored
  non-production copy of the target schema before production rollout.
- Existing product slugs and SKUs have uniqueness constraints. Variant SKU and
  barcode uniqueness are enforced within the variant table; variant SKUs are
  not cross-checked against product-level SKUs.
- Store currency remains the existing three-letter product currency (currently
  INR by default). Shipping and tax calculation are unchanged and remain zero
  until separately configured.
- Image uploads use the pre-existing unsigned Cloudinary preset. Supabase
  protects product/media database links with Super Admin RLS, but the unsigned
  Cloudinary endpoint itself does not authenticate a Supabase administrator.
  Keep the preset tightly restricted by format, size, and folder; use a signed
  server-side upload flow before relying on it for strict uploader
  authorization.
- No Supabase Storage bucket is introduced, so no Supabase Storage policies
  are changed.

## Manual verification sequence

1. Apply the foundation and both timestamped migrations to a local/non-production
   Supabase project, inspecting migration output for schema conflicts.
2. Sign in as a normal customer and verify product writes and admin RPCs are
   denied; verify only active products, variants, and image links are readable.
3. Sign in as an authorized Super Admin and create a draft, then publish it
   with multiple variants and tracked stock.
4. Place two concurrent orders against limited stock, verify no oversell, then
   cancel an eligible order and verify exactly its recorded stock decrement is
   restored.
5. Confirm order snapshots remain unchanged after editing or archiving the
   product.
