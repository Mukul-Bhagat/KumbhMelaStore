create extension if not exists pgcrypto;

do $$
begin
  create type public.locale_code as enum ('hi', 'en');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.role_slug as enum ('customer', 'super_admin', 'admin', 'vendor');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.profile_status as enum ('active', 'suspended', 'pending');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.nav_location as enum ('header', 'shop', 'account', 'admin', 'footer', 'legal');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.link_route_type as enum ('internal', 'external', 'action');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.page_template as enum ('landing', 'document', 'cms', 'blog', 'product', 'collection', 'category');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.page_section_type as enum (
    'hero',
    'stats',
    'collection-grid',
    'product-grid',
    'feature-grid',
    'testimonial-grid',
    'blog-grid',
    'rich-text',
    'cta',
    'faq-grid',
    'media-split',
    'contact-grid',
    'announcement',
    'empty'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.announcement_variant as enum ('info', 'success', 'warning', 'premium');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.policy_type as enum ('privacy', 'terms', 'refund', 'shipping', 'custom');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.product_stock_status as enum ('draft', 'active', 'archived');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.review_status as enum ('pending', 'approved', 'rejected');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.payment_status as enum ('pending', 'paid', 'failed', 'refunded', 'cash_on_delivery');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.payment_method as enum ('upi', 'card', 'net_banking', 'cod', 'wallet', 'manual');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.order_status as enum ('draft', 'placed', 'confirmed', 'packed', 'in_transit', 'delivered', 'cancelled');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.content_type as enum ('text', 'rich_text', 'cta', 'card', 'grid', 'quote', 'stats', 'media');
exception
  when duplicate_object then null;
end $$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.roles (
  id uuid primary key default gen_random_uuid(),
  slug public.role_slug not null unique,
  name text not null,
  description text,
  is_system boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  display_name text,
  avatar_url text,
  phone text,
  locale_code public.locale_code not null default 'hi',
  status public.profile_status not null default 'active',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.user_roles (
  user_id uuid not null references auth.users(id) on delete cascade,
  role_id uuid not null references public.roles(id) on delete cascade,
  granted_at timestamptz not null default timezone('utc', now()),
  granted_by uuid references auth.users(id) on delete set null,
  primary key (user_id, role_id)
);

create table if not exists public.languages (
  code public.locale_code primary key,
  name text not null,
  native_name text not null,
  content_language text not null,
  is_default boolean not null default false,
  is_enabled boolean not null default true,
  sort_order integer not null default 0
);

create table if not exists public.translations (
  id uuid primary key default gen_random_uuid(),
  namespace text not null,
  translation_key text not null,
  language_code public.locale_code not null references public.languages(code) on delete cascade,
  value_text text,
  value_json jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists translations_unique_key
  on public.translations (namespace, translation_key, language_code);

create table if not exists public.site_settings (
  id uuid primary key default gen_random_uuid(),
  setting_key text not null unique,
  setting_value jsonb not null default '{}'::jsonb,
  is_public boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.media (
  id uuid primary key default gen_random_uuid(),
  provider text not null default 'cloudinary',
  public_id text not null unique,
  secure_url text not null,
  alt_text text,
  blur_data_url text,
  width integer,
  height integer,
  format text,
  metadata jsonb,
  is_public boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.navigation_menus (
  id uuid primary key default gen_random_uuid(),
  menu_key text not null unique,
  location public.nav_location not null,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.navigation_menu_items (
  id uuid primary key default gen_random_uuid(),
  menu_id uuid not null references public.navigation_menus(id) on delete cascade,
  parent_id uuid references public.navigation_menu_items(id) on delete cascade,
  label_key text not null,
  href text not null,
  route_type public.link_route_type not null default 'internal',
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists navigation_menu_items_menu_sort_idx
  on public.navigation_menu_items (menu_id, sort_order);

create unique index if not exists navigation_menu_items_unique_idx
  on public.navigation_menu_items (menu_id, label_key, href, sort_order);

create table if not exists public.footer_sections (
  id uuid primary key default gen_random_uuid(),
  section_key text not null unique,
  title_key text not null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.footer_links (
  id uuid primary key default gen_random_uuid(),
  section_id uuid not null references public.footer_sections(id) on delete cascade,
  label_key text not null,
  href text not null,
  route_type public.link_route_type not null default 'internal',
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists footer_links_section_sort_idx
  on public.footer_links (section_id, sort_order);

create unique index if not exists footer_links_unique_idx
  on public.footer_links (section_id, label_key, href, sort_order);

create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  announcement_key text not null unique,
  is_active boolean not null default true,
  dismissible boolean not null default true,
  variant public.announcement_variant not null default 'info',
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.pages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  template public.page_template not null,
  title_key text not null,
  description_key text,
  seo_title_key text,
  seo_description_key text,
  is_public boolean not null default true,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.page_sections (
  id uuid primary key default gen_random_uuid(),
  page_id uuid not null references public.pages(id) on delete cascade,
  section_key text not null,
  section_type public.page_section_type not null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  media_id uuid references public.media(id) on delete set null,
  payload jsonb,
  eyebrow_key text,
  title_key text,
  description_key text,
  body_key text,
  primary_cta_label_key text,
  primary_cta_href text,
  secondary_cta_label_key text,
  secondary_cta_href text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists page_sections_page_key_idx
  on public.page_sections (page_id, section_key);

create table if not exists public.hero_slides (
  id uuid primary key default gen_random_uuid(),
  slide_key text not null unique,
  media_id uuid references public.media(id) on delete set null,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  payload jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.blogs (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  author_id uuid references auth.users(id) on delete set null,
  cover_media_id uuid references public.media(id) on delete set null,
  reading_time_minutes integer,
  is_featured boolean not null default false,
  published_at timestamptz,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.faqs (
  id uuid primary key default gen_random_uuid(),
  faq_key text not null unique,
  faq_group text not null default 'general',
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.policies (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  policy_type public.policy_type not null,
  title_key text not null,
  body_key text not null,
  seo_title_key text,
  seo_description_key text,
  published_at timestamptz,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  image_media_id uuid references public.media(id) on delete set null,
  parent_id uuid references public.categories(id) on delete set null,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.collections (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  cover_media_id uuid references public.media(id) on delete set null,
  hero_media_id uuid references public.media(id) on delete set null,
  is_featured boolean not null default false,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  sku text not null unique,
  category_id uuid references public.categories(id) on delete set null,
  collection_id uuid references public.collections(id) on delete set null,
  currency text not null default 'INR',
  base_price numeric(12, 2) not null default 0,
  compare_at_price numeric(12, 2),
  stock_status public.product_stock_status not null default 'draft',
  is_featured boolean not null default false,
  is_active boolean not null default true,
  material text,
  dimensions text,
  metadata jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  media_id uuid not null references public.media(id) on delete cascade,
  sort_order integer not null default 0,
  is_primary boolean not null default false,
  alt_key text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists product_images_unique_idx
  on public.product_images (product_id, media_id);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  title text,
  body text not null,
  status public.review_status not null default 'pending',
  is_verified_purchase boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists reviews_product_status_idx
  on public.reviews (product_id, status);

create table if not exists public.review_replies (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.reviews(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  label text not null,
  recipient_name text not null,
  phone text not null,
  line1 text not null,
  line2 text,
  city text not null,
  state text not null,
  postal_code text not null,
  country_code text not null,
  landmark text,
  is_default boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists addresses_user_default_idx
  on public.addresses (user_id, is_default);

create table if not exists public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  description text,
  discount_type text not null check (discount_type in ('percentage', 'fixed')),
  discount_value numeric(12, 2) not null,
  min_order_value numeric(12, 2),
  max_redemptions integer,
  max_redemptions_per_user integer,
  starts_at timestamptz,
  ends_at timestamptz,
  is_active boolean not null default true,
  metadata jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  order_number text not null unique,
  public_tracking_code text not null unique,
  status public.order_status not null default 'draft',
  payment_status public.payment_status not null default 'pending',
  payment_method public.payment_method not null default 'manual',
  currency text not null default 'INR',
  subtotal numeric(12, 2) not null default 0,
  discount_total numeric(12, 2) not null default 0,
  shipping_total numeric(12, 2) not null default 0,
  tax_total numeric(12, 2) not null default 0,
  grand_total numeric(12, 2) not null default 0,
  coupon_id uuid references public.coupons(id) on delete set null,
  shipping_address_snapshot jsonb,
  billing_address_snapshot jsonb,
  contact_email text not null,
  contact_phone text not null,
  placed_at timestamptz,
  confirmed_at timestamptz,
  shipped_at timestamptz,
  delivered_at timestamptz,
  cancelled_at timestamptz,
  tracking_summary jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists orders_user_created_idx
  on public.orders (user_id, created_at desc);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_snapshot jsonb,
  quantity integer not null check (quantity > 0),
  unit_price numeric(12, 2) not null,
  line_total numeric(12, 2) not null,
  currency text not null default 'INR',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists order_items_order_idx
  on public.order_items (order_id);

create table if not exists public.order_status_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  status text not null,
  note_key text,
  event_at timestamptz not null default timezone('utc', now()),
  metadata jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists order_status_events_order_idx
  on public.order_status_events (order_id, event_at desc);

create table if not exists public.site_content (
  id uuid primary key default gen_random_uuid(),
  content_key text not null unique,
  content_type public.content_type not null default 'text',
  sort_order integer not null default 0,
  is_active boolean not null default true,
  payload jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create or replace function public.has_role(required_role public.role_slug)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles user_role
    join public.roles role on role.id = user_role.role_id
    where user_role.user_id = auth.uid()
      and role.slug = required_role
  );
$$;

create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_role('super_admin');
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  customer_role_id uuid;
begin
  insert into public.profiles (
    id,
    full_name,
    display_name,
    avatar_url,
    phone,
    locale_code,
    status
  ) values (
    new.id,
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    nullif(new.raw_user_meta_data ->> 'display_name', ''),
    nullif(new.raw_user_meta_data ->> 'avatar_url', ''),
    nullif(new.raw_user_meta_data ->> 'phone', ''),
    coalesce(nullif(new.raw_user_meta_data ->> 'locale', ''), 'hi')::public.locale_code,
    'active'
  )
  on conflict (id) do update set
    full_name = excluded.full_name,
    display_name = excluded.display_name,
    avatar_url = excluded.avatar_url,
    phone = excluded.phone,
    locale_code = excluded.locale_code,
    status = excluded.status,
    updated_at = timezone('utc', now());

  select id
  into customer_role_id
  from public.roles
  where slug = 'customer'
  limit 1;

  if customer_role_id is not null then
    insert into public.user_roles (user_id, role_id, granted_by)
    values (new.id, customer_role_id, new.id)
    on conflict do nothing;
  end if;

  return new;
end;
$$;

do $$
begin
  execute 'drop trigger if exists auth_user_created on auth.users';
  execute 'create trigger auth_user_created after insert on auth.users for each row execute function public.handle_new_user()';
end $$;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'roles',
    'profiles',
    'translations',
    'site_settings',
    'media',
    'navigation_menus',
    'navigation_menu_items',
    'footer_sections',
    'footer_links',
    'announcements',
    'pages',
    'page_sections',
    'hero_slides',
    'blogs',
    'faqs',
    'policies',
    'categories',
    'collections',
    'products',
    'product_images',
    'reviews',
    'review_replies',
    'addresses',
    'coupons',
    'orders',
    'order_items',
    'order_status_events',
    'site_content'
  ] loop
    execute format('drop trigger if exists set_updated_at on public.%I', table_name);
    execute format(
      'create trigger set_updated_at before update on public.%I for each row execute function public.set_updated_at()',
      table_name
    );
  end loop;
end $$;

alter table public.roles enable row level security;
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.languages enable row level security;
alter table public.translations enable row level security;
alter table public.site_settings enable row level security;
alter table public.media enable row level security;
alter table public.navigation_menus enable row level security;
alter table public.navigation_menu_items enable row level security;
alter table public.footer_sections enable row level security;
alter table public.footer_links enable row level security;
alter table public.announcements enable row level security;
alter table public.pages enable row level security;
alter table public.page_sections enable row level security;
alter table public.hero_slides enable row level security;
alter table public.blogs enable row level security;
alter table public.faqs enable row level security;
alter table public.policies enable row level security;
alter table public.categories enable row level security;
alter table public.collections enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.reviews enable row level security;
alter table public.review_replies enable row level security;
alter table public.addresses enable row level security;
alter table public.coupons enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_status_events enable row level security;
alter table public.site_content enable row level security;

create policy "roles_select_authenticated"
on public.roles
for select
to authenticated, anon
using (true);

create policy "roles_manage_super_admin"
on public.roles
for all
to authenticated
using (public.is_super_admin())
with check (public.is_super_admin());

create policy "profiles_select_self_or_admin"
on public.profiles
for select
to authenticated
using (id = auth.uid() or public.is_super_admin());

create policy "profiles_update_self_or_admin"
on public.profiles
for update
to authenticated
using (id = auth.uid() or public.is_super_admin())
with check (id = auth.uid() or public.is_super_admin());

create policy "profiles_insert_admin"
on public.profiles
for insert
to authenticated
with check (public.is_super_admin());

create policy "user_roles_select_self_or_admin"
on public.user_roles
for select
to authenticated
using (user_id = auth.uid() or public.is_super_admin());

create policy "user_roles_manage_admin"
on public.user_roles
for all
to authenticated
using (public.is_super_admin())
with check (public.is_super_admin());

create policy "languages_public_read"
on public.languages
for select
to anon, authenticated
using (is_enabled);

create policy "languages_manage_admin"
on public.languages
for all
to authenticated
using (public.is_super_admin())
with check (public.is_super_admin());

create policy "translations_public_read"
on public.translations
for select
to anon, authenticated
using (is_active);

create policy "translations_manage_admin"
on public.translations
for all
to authenticated
using (public.is_super_admin())
with check (public.is_super_admin());

create policy "site_settings_public_read"
on public.site_settings
for select
to anon, authenticated
using (is_public or public.is_super_admin());

create policy "site_settings_manage_admin"
on public.site_settings
for all
to authenticated
using (public.is_super_admin())
with check (public.is_super_admin());

create policy "media_public_read"
on public.media
for select
to anon, authenticated
using (is_public or public.is_super_admin());

create policy "media_manage_admin"
on public.media
for all
to authenticated
using (public.is_super_admin())
with check (public.is_super_admin());

create policy "navigation_menus_public_read"
on public.navigation_menus
for select
to anon, authenticated
using (is_active);

create policy "navigation_menus_manage_admin"
on public.navigation_menus
for all
to authenticated
using (public.is_super_admin())
with check (public.is_super_admin());

create policy "navigation_menu_items_public_read"
on public.navigation_menu_items
for select
to anon, authenticated
using (is_active);

create policy "navigation_menu_items_manage_admin"
on public.navigation_menu_items
for all
to authenticated
using (public.is_super_admin())
with check (public.is_super_admin());

create policy "footer_sections_public_read"
on public.footer_sections
for select
to anon, authenticated
using (is_active);

create policy "footer_sections_manage_admin"
on public.footer_sections
for all
to authenticated
using (public.is_super_admin())
with check (public.is_super_admin());

create policy "footer_links_public_read"
on public.footer_links
for select
to anon, authenticated
using (is_active);

create policy "footer_links_manage_admin"
on public.footer_links
for all
to authenticated
using (public.is_super_admin())
with check (public.is_super_admin());

create policy "announcements_public_read"
on public.announcements
for select
to anon, authenticated
using (
  is_active
  and (starts_at is null or starts_at <= timezone('utc', now()))
  and (ends_at is null or ends_at >= timezone('utc', now()))
);

create policy "announcements_manage_admin"
on public.announcements
for all
to authenticated
using (public.is_super_admin())
with check (public.is_super_admin());

create policy "pages_public_read"
on public.pages
for select
to anon, authenticated
using (is_public and is_active);

create policy "pages_manage_admin"
on public.pages
for all
to authenticated
using (public.is_super_admin())
with check (public.is_super_admin());

create policy "page_sections_public_read"
on public.page_sections
for select
to anon, authenticated
using (
  is_active
  and exists (
    select 1
    from public.pages page
    where page.id = page_sections.page_id
      and page.is_public
      and page.is_active
  )
);

create policy "page_sections_manage_admin"
on public.page_sections
for all
to authenticated
using (public.is_super_admin())
with check (public.is_super_admin());

create policy "hero_slides_public_read"
on public.hero_slides
for select
to anon, authenticated
using (is_active);

create policy "hero_slides_manage_admin"
on public.hero_slides
for all
to authenticated
using (public.is_super_admin())
with check (public.is_super_admin());

create policy "blogs_public_read"
on public.blogs
for select
to anon, authenticated
using (is_active and published_at is not null);

create policy "blogs_manage_admin"
on public.blogs
for all
to authenticated
using (public.is_super_admin())
with check (public.is_super_admin());

create policy "faqs_public_read"
on public.faqs
for select
to anon, authenticated
using (is_active);

create policy "faqs_manage_admin"
on public.faqs
for all
to authenticated
using (public.is_super_admin())
with check (public.is_super_admin());

create policy "policies_public_read"
on public.policies
for select
to anon, authenticated
using (is_active);

create policy "policies_manage_admin"
on public.policies
for all
to authenticated
using (public.is_super_admin())
with check (public.is_super_admin());

create policy "categories_public_read"
on public.categories
for select
to anon, authenticated
using (is_active);

create policy "categories_manage_admin"
on public.categories
for all
to authenticated
using (public.is_super_admin())
with check (public.is_super_admin());

create policy "collections_public_read"
on public.collections
for select
to anon, authenticated
using (is_active);

create policy "collections_manage_admin"
on public.collections
for all
to authenticated
using (public.is_super_admin())
with check (public.is_super_admin());

create policy "products_public_read"
on public.products
for select
to anon, authenticated
using (is_active and stock_status = 'active');

create policy "products_manage_admin"
on public.products
for all
to authenticated
using (public.is_super_admin())
with check (public.is_super_admin());

create policy "product_images_public_read"
on public.product_images
for select
to anon, authenticated
using (exists (
  select 1
  from public.products product
  where product.id = product_images.product_id
    and product.is_active
));

create policy "product_images_manage_admin"
on public.product_images
for all
to authenticated
using (public.is_super_admin())
with check (public.is_super_admin());

create policy "reviews_public_read"
on public.reviews
for select
to anon, authenticated
using (status = 'approved');

create policy "reviews_insert_authenticated"
on public.reviews
for insert
to authenticated
with check (user_id = auth.uid());

create policy "reviews_manage_owner_or_admin"
on public.reviews
for update
to authenticated
using (user_id = auth.uid() or public.is_super_admin())
with check (user_id = auth.uid() or public.is_super_admin());

create policy "reviews_delete_owner_or_admin"
on public.reviews
for delete
to authenticated
using (user_id = auth.uid() or public.is_super_admin());

create policy "review_replies_public_read"
on public.review_replies
for select
to anon, authenticated
using (exists (
  select 1
  from public.reviews review
  where review.id = review_replies.review_id
    and review.status = 'approved'
));

create policy "review_replies_manage_admin"
on public.review_replies
for all
to authenticated
using (public.is_super_admin())
with check (public.is_super_admin());

create policy "addresses_manage_self_or_admin"
on public.addresses
for all
to authenticated
using (user_id = auth.uid() or public.is_super_admin())
with check (user_id = auth.uid() or public.is_super_admin());

create policy "coupons_public_read"
on public.coupons
for select
to anon, authenticated
using (
  is_active
  and (starts_at is null or starts_at <= timezone('utc', now()))
  and (ends_at is null or ends_at >= timezone('utc', now()))
);

create policy "coupons_manage_admin"
on public.coupons
for all
to authenticated
using (public.is_super_admin())
with check (public.is_super_admin());

create policy "orders_select_self_or_admin"
on public.orders
for select
to authenticated
using (user_id = auth.uid() or public.is_super_admin());

create policy "orders_insert_self_or_admin"
on public.orders
for insert
to authenticated
with check (user_id = auth.uid() or public.is_super_admin());

create policy "orders_update_self_or_admin"
on public.orders
for update
to authenticated
using (user_id = auth.uid() or public.is_super_admin())
with check (user_id = auth.uid() or public.is_super_admin());

create policy "orders_delete_admin"
on public.orders
for delete
to authenticated
using (public.is_super_admin());

create policy "order_items_select_self_or_admin"
on public.order_items
for select
to authenticated
using (
  exists (
    select 1
    from public.orders ord
    where ord.id = order_items.order_id
      and (ord.user_id = auth.uid() or public.is_super_admin())
  )
);

create policy "order_items_manage_admin"
on public.order_items
for all
to authenticated
using (public.is_super_admin())
with check (public.is_super_admin());

create policy "order_status_events_select_self_or_admin"
on public.order_status_events
for select
to authenticated
using (
  exists (
    select 1
    from public.orders ord
    where ord.id = order_status_events.order_id
      and (ord.user_id = auth.uid() or public.is_super_admin())
  )
);

create policy "order_status_events_manage_admin"
on public.order_status_events
for all
to authenticated
using (public.is_super_admin())
with check (public.is_super_admin());

create policy "site_content_public_read"
on public.site_content
for select
to anon, authenticated
using (is_active);

create policy "site_content_manage_admin"
on public.site_content
for all
to authenticated
using (public.is_super_admin())
with check (public.is_super_admin());

grant usage on schema public to anon, authenticated;
grant select on all tables in schema public to anon, authenticated;
grant insert, update, delete on all tables in schema public to authenticated;

grant execute on function public.has_role(public.role_slug) to anon, authenticated;
grant execute on function public.is_super_admin() to anon, authenticated;

create or replace function public.get_public_order_tracking(
  p_order_number text,
  p_email text default null,
  p_phone text default null,
  p_tracking_code text default null
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  order_row record;
  payload jsonb;
begin
  select
    ord.id,
    ord.order_number,
    ord.public_tracking_code,
    ord.status,
    ord.updated_at,
    ord.tracking_summary,
    ord.contact_email,
    ord.contact_phone
  into order_row
  from public.orders ord
  where ord.order_number = p_order_number
    and (
      (p_tracking_code is not null and ord.public_tracking_code = p_tracking_code)
      or (p_email is not null and lower(ord.contact_email) = lower(p_email))
      or (p_phone is not null and ord.contact_phone = p_phone)
    )
  limit 1;

  if order_row.id is null then
    raise exception 'Order not found or access denied';
  end if;

  select jsonb_build_object(
    'id', order_row.id,
    'orderNumber', order_row.order_number,
    'order_number', order_row.order_number,
    'publicTrackingCode', order_row.public_tracking_code,
    'public_tracking_code', order_row.public_tracking_code,
    'status', order_row.status,
    'updatedAt', order_row.updated_at,
    'updated_at', order_row.updated_at,
    'eta', coalesce(order_row.tracking_summary ->> 'eta', null),
    'estimatedDelivery', coalesce(order_row.tracking_summary ->> 'eta', null),
    'summary', coalesce(order_row.tracking_summary ->> 'summary', null),
    'message', coalesce(order_row.tracking_summary ->> 'summary', null),
    'events', coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'title', coalesce(event.note_key, event.status),
            'status', event.status,
            'note', event.note_key,
            'note_key', event.note_key,
            'eventAt', event.event_at,
            'event_at', event.event_at
          )
          order by event.event_at asc
        )
        from public.order_status_events event
        where event.order_id = order_row.id
      ),
      '[]'::jsonb
    ),
    'timeline', coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'title', coalesce(event.note_key, event.status),
            'status', event.status,
            'note', event.note_key,
            'note_key', event.note_key,
            'eventAt', event.event_at,
            'event_at', event.event_at
          )
          order by event.event_at asc
        )
        from public.order_status_events event
        where event.order_id = order_row.id
      ),
      '[]'::jsonb
    )
  )
  into payload;

  return payload;
end;
$$;

grant execute on function public.get_public_order_tracking(
  text,
  text,
  text,
  text
) to anon, authenticated;
