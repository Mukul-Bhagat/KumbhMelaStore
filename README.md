# KumbhMelaStore Foundation

Production foundation for the KumbhMelaStore ecommerce platform built with React 19, Vite, TypeScript, Tailwind CSS v4, React Router, TanStack Query, Zustand, Framer Motion, shadcn/ui, Supabase, and Cloudinary.

## Local Setup

1. Copy [.env.example](./.env.example) to `.env`.
2. Fill in your Supabase project URL and publishable key.
3. Set `VITE_CLOUDINARY_CLOUD_NAME` to your Cloudinary cloud name. For browser uploads, create an unsigned Cloudinary upload preset restricted to image formats and size, then set its name in `VITE_CLOUDINARY_UPLOAD_PRESET`. Never put the Cloudinary API secret in frontend environment variables.
4. If you want local Supabase auth provider testing, set the optional provider secrets in `.env` and enable the provider blocks in [supabase/config.toml](./supabase/config.toml).

`VITE_SUPABASE_URL` must be the reachable URL for the intended project; do not substitute a guessed project reference. The included `supabase/seed.sql` is applied by the local `supabase db reset` workflow below and does not provision users in a hosted project. Hosted Super Admin access must be provisioned for that project through a trusted administrative workflow.

### Hosted Supabase Auth configuration

The app builds signup, OAuth, and password-reset callback URLs from the browser's current origin, then includes the selected `locale` in the callback query. This keeps local callbacks on the local origin and production callbacks on the deployed origin; redirects are not built from user-provided URLs.

For the hosted production project, configure Supabase Dashboard → Authentication → URL Configuration:

- Set **Site URL** to `https://kumbhmelastore.in`.
- Add these **Redirect URLs** for the production app:
  - `https://kumbhmelastore.in/auth/callback`
  - `https://kumbhmelastore.in/auth/reset-password`
- Add corresponding `https://www.kumbhmelastore.in/...` callback URLs only if the `www` hostname is also a served application origin.
- For local development against this same hosted project, also allow `http://localhost:5173/auth/callback` and `http://localhost:5173/auth/reset-password`. Prefer a separate development Supabase project and keep its localhost allowlist there.

Keep email confirmation enabled for hosted signup. In Authentication → Providers → Email, confirm the provider and confirmation settings; configure a verified custom SMTP sender/provider for production delivery and review its sending limits. The `enable_confirmations = false` setting in [supabase/config.toml](./supabase/config.toml) applies only to local Supabase CLI use. If hosted signup returns HTTP 429, inspect Supabase Auth logs and the email provider's delivery/rate-limit logs before adjusting project limits. Do not retry signup automatically or disable security limits to work around throttling.

Set the production deployment's `VITE_SITE_URL` to `https://kumbhmelastore.in` for canonical site metadata; leave the local `.env` value at `http://localhost:5173`. Auth callbacks use the active browser origin rather than `VITE_SITE_URL`.

## Supabase Database

The database foundation lives in:

- [supabase/migrations/20260703_000001_initial_foundation.sql](./supabase/migrations/20260703_000001_initial_foundation.sql)
- [supabase/migrations/20261016_000001_order_workflow.sql](./supabase/migrations/20261016_000001_order_workflow.sql)
- [supabase/migrations/20261017_000001_shop_product_management.sql](./supabase/migrations/20261017_000001_shop_product_management.sql)
- [supabase/seed.sql](./supabase/seed.sql)

The product-management migration adds product variants, inventory tracking and movement history, multi-collection/tag assignments, gallery ordering, and Super Admin product-management functions. Apply migrations in timestamp order to a local or explicitly approved Supabase project. Do not run them against production as part of local development or validation.

### Hosted Super Admin provisioning

The seed does not create Auth users. For the hosted project:

1. In Supabase Dashboard → Authentication → Users, check for the exact account `kumbhmelamukul@kumbhmelastore.in` before provisioning anything. Do not use the separate normal-user account.
2. If it is missing, invite that exact address through the dashboard and complete its email confirmation. If it already exists but cannot sign in, use the dashboard's password reset/invite flow rather than creating another account.
3. Run [supabase/grant-super-admin.sql](./supabase/grant-super-admin.sql) in that project's SQL Editor. It grants the role only to the existing exact-email Auth account, does not create users, and reports account, confirmation, profile, and role status.
4. Test sign-in for that account, then separately create a test product from the admin catalog and verify that it appears in the database/catalog.

The SQL script requires the database migration and seeded `super_admin` role to exist. Do not add role assignment to frontend signup or expose a service-role key in the app.

Typical local workflow:

```bash
supabase start
supabase db reset
pnpm dev
```

## Scripts

- `pnpm dev`
- `pnpm build`
- `pnpm lint`

## Vercel SPA routing

The site uses React Router browser-history routes. [vercel.json](./vercel.json)
rewrites incoming paths to the Vite entry document so nested frontend routes
can load directly or after a refresh; React Router then renders the matching
page or its application-level 404. The app has no same-origin `/api` routes;
browser data requests go directly to Supabase and Cloudinary.

To validate locally, run `pnpm build` and `pnpm preview`, then open or refresh
a nested route such as `/en/products` or `/en/auth/sign-in`. Deploy through
the existing Vercel project when ready; the rewrite takes effect only with a
new deployment. Do not change the project, domain, or environment settings.

## Notes

- English is the default locale; valid saved language preferences and explicit `/hi` routes are preserved.
- Hindi remains available through the language switch.
- Admin product galleries accept HTTPS image URLs or direct browser uploads to Cloudinary. Uploads require a restricted unsigned preset; image metadata and product links are saved in Supabase.
- The Super Admin console uses Supabase-backed managers for orders and their tracking history, profiles and non-Super-Admin role assignments, CMS pages/sections/translations/blogs/FAQs/policies/announcements, site settings, languages, navigation, and footer links.
- Checkout places cash-on-delivery orders through a transactional Supabase function. It validates active product and variant prices on the server, locks and decrements tracked inventory, snapshots delivery/product/variant details, and writes the initial status event atomically. Customer cancellation and Super Admin fulfillment/payment/tracking updates are also authorized database functions; customer order detail reads remain scoped by RLS. Shipping and tax are zero until configured.
- Admin data writes continue to rely on the existing `is_super_admin()` RLS policies. The Users screen does not create or delete Auth accounts, display other users' private Auth emails, change email confirmation, or grant `super_admin`; use the guarded provisioning workflow above for Super Admin access.
- Profile status is application profile metadata and does not disable Supabase Auth sign-in. Orders are protected with RLS, and public tracking uses the restricted RPC projection only.
- CMS managers edit existing routed pages; route slugs and templates are fixed in the page editor to avoid creating database pages that the client router cannot serve.
