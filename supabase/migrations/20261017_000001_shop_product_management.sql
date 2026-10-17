alter table public.products
  add column if not exists barcode text,
  add column if not exists product_type text,
  add column if not exists vendor text,
  add column if not exists short_description text,
  add column if not exists cost_per_item numeric(12, 2),
  add column if not exists taxable boolean not null default true,
  add column if not exists track_inventory boolean not null default false,
  add column if not exists inventory_quantity integer not null default 0,
  add column if not exists continue_selling_when_out_of_stock boolean not null default false,
  add column if not exists low_stock_threshold integer not null default 5,
  add column if not exists is_physical boolean not null default true,
  add column if not exists weight numeric(10, 3),
  add column if not exists weight_unit text not null default 'kg',
  add column if not exists length numeric(10, 2),
  add column if not exists width numeric(10, 2),
  add column if not exists height numeric(10, 2),
  add column if not exists measurement_unit text not null default 'cm',
  add column if not exists country_of_origin text,
  add column if not exists hs_code text,
  add column if not exists product_options jsonb not null default '[]'::jsonb,
  add column if not exists created_by uuid references auth.users(id) on delete set null,
  add column if not exists updated_by uuid references auth.users(id) on delete set null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.products'::regclass
      and conname = 'products_inventory_nonnegative_check'
  ) then
    alter table public.products
      add constraint products_inventory_nonnegative_check
      check (inventory_quantity >= 0 and low_stock_threshold >= 0);
  end if;
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.products'::regclass
      and conname = 'products_prices_nonnegative_check'
  ) then
    alter table public.products
      add constraint products_prices_nonnegative_check
      check (
        base_price >= 0
        and (compare_at_price is null or compare_at_price >= base_price)
        and (cost_per_item is null or cost_per_item >= 0)
      );
  end if;
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.products'::regclass
      and conname = 'products_dimensions_nonnegative_check'
  ) then
    alter table public.products
      add constraint products_dimensions_nonnegative_check
      check (
        (weight is null or weight >= 0)
        and (length is null or length >= 0)
        and (width is null or width >= 0)
        and (height is null or height >= 0)
      );
  end if;
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.products'::regclass
      and conname = 'products_product_options_array_check'
  ) then
    alter table public.products
      add constraint products_product_options_array_check
      check (jsonb_typeof(product_options) = 'array');
  end if;
end $$;

create index if not exists products_status_created_idx
  on public.products (stock_status, created_at desc);
create index if not exists products_category_status_idx
  on public.products (category_id, stock_status);
create index if not exists products_collection_status_idx
  on public.products (collection_id, stock_status);
create index if not exists products_inventory_idx
  on public.products (track_inventory, inventory_quantity);
create unique index if not exists products_barcode_unique
  on public.products (barcode)
  where barcode is not null and barcode <> '';

create table if not exists public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  title text not null,
  option_values jsonb not null default '{}'::jsonb,
  sku text,
  barcode text,
  price numeric(12, 2) not null,
  compare_at_price numeric(12, 2),
  track_inventory boolean not null default true,
  inventory_quantity integer not null default 0,
  continue_selling_when_out_of_stock boolean not null default false,
  weight numeric(10, 3),
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint product_variants_price_check
    check (
      price >= 0
      and (compare_at_price is null or compare_at_price >= price)
      and inventory_quantity >= 0
      and (weight is null or weight >= 0)
    ),
  constraint product_variants_option_values_object_check
    check (jsonb_typeof(option_values) = 'object')
);

create unique index if not exists product_variants_sku_unique
  on public.product_variants (lower(sku))
  where sku is not null and sku <> '';
create unique index if not exists product_variants_barcode_unique
  on public.product_variants (barcode)
  where barcode is not null and barcode <> '';
create index if not exists product_variants_product_sort_idx
  on public.product_variants (product_id, sort_order);

create table if not exists public.product_collections (
  product_id uuid not null references public.products(id) on delete cascade,
  collection_id uuid not null references public.collections(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (product_id, collection_id)
);
create index if not exists product_collections_collection_idx
  on public.product_collections (collection_id, product_id);

create table if not exists public.product_tags (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default timezone('utc', now())
);
create unique index if not exists product_tags_name_unique
  on public.product_tags (lower(name));

create table if not exists public.product_tag_assignments (
  product_id uuid not null references public.products(id) on delete cascade,
  tag_id uuid not null references public.product_tags(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (product_id, tag_id)
);
create index if not exists product_tag_assignments_tag_idx
  on public.product_tag_assignments (tag_id, product_id);

create table if not exists public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  variant_id uuid references public.product_variants(id) on delete set null,
  quantity_delta integer not null,
  quantity_after integer not null check (quantity_after >= 0),
  reason text not null,
  source text not null check (source in ('admin', 'order')),
  order_id uuid references public.orders(id) on delete set null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now())
);
create index if not exists inventory_movements_product_created_idx
  on public.inventory_movements (product_id, created_at desc);
create index if not exists inventory_movements_variant_created_idx
  on public.inventory_movements (variant_id, created_at desc);

alter table public.order_items
  add column if not exists variant_id uuid references public.product_variants(id) on delete set null;

grant select on public.product_variants, public.product_collections, public.product_tags,
  public.product_tag_assignments, public.inventory_movements to anon, authenticated;
grant insert, update, delete on public.product_variants, public.product_collections,
  public.product_tags, public.product_tag_assignments to authenticated;
grant insert on public.inventory_movements to authenticated;

do $$
begin
  update public.product_images image
  set is_primary = false
  where image.is_primary
    and exists (
      select 1
      from public.product_images preferred
      where preferred.product_id = image.product_id
        and preferred.is_primary
        and (preferred.sort_order, preferred.created_at, preferred.id)
          < (image.sort_order, image.created_at, image.id)
    );
end $$;

create unique index if not exists product_images_one_primary_idx
  on public.product_images (product_id)
  where is_primary;

create or replace function public.promote_product_image_after_delete()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if old.is_primary then
    update public.product_images image
    set is_primary = true
    where image.id = (
      select candidate.id
      from public.product_images candidate
      where candidate.product_id = old.product_id
      order by candidate.sort_order, candidate.created_at, candidate.id
      limit 1
    );
  end if;
  return old;
end;
$$;

drop trigger if exists promote_product_image_after_delete on public.product_images;
create trigger promote_product_image_after_delete
after delete on public.product_images
for each row execute function public.promote_product_image_after_delete();

insert into public.product_collections (product_id, collection_id)
select id, collection_id
from public.products
where collection_id is not null
on conflict do nothing;

drop policy if exists "product_images_public_read" on public.product_images;
create policy "product_images_public_read"
on public.product_images
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.products product
    where product.id = product_images.product_id
      and product.is_active
      and product.stock_status = 'active'
  )
);

alter table public.product_variants enable row level security;
alter table public.product_collections enable row level security;
alter table public.product_tags enable row level security;
alter table public.product_tag_assignments enable row level security;
alter table public.inventory_movements enable row level security;

drop policy if exists "product_variants_public_read" on public.product_variants;
create policy "product_variants_public_read"
on public.product_variants
for select
to anon, authenticated
using (
  is_active and exists (
    select 1 from public.products product
    where product.id = product_variants.product_id
      and product.is_active
      and product.stock_status = 'active'
  )
);

drop policy if exists "product_variants_manage_admin" on public.product_variants;
create policy "product_variants_manage_admin"
on public.product_variants
for all
to authenticated
using (public.is_super_admin())
with check (public.is_super_admin());

drop policy if exists "product_collections_public_read" on public.product_collections;
create policy "product_collections_public_read"
on public.product_collections
for select
to anon, authenticated
using (
  exists (
    select 1 from public.products product
    where product.id = product_collections.product_id
      and product.is_active
      and product.stock_status = 'active'
  )
  and exists (
    select 1 from public.collections collection
    where collection.id = product_collections.collection_id
      and collection.is_active
  )
);

drop policy if exists "product_collections_manage_admin" on public.product_collections;
create policy "product_collections_manage_admin"
on public.product_collections
for all
to authenticated
using (public.is_super_admin())
with check (public.is_super_admin());

drop policy if exists "product_tags_public_read" on public.product_tags;
create policy "product_tags_public_read"
on public.product_tags
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.product_tag_assignments assignment
    join public.products product on product.id = assignment.product_id
    where assignment.tag_id = product_tags.id
      and product.is_active
      and product.stock_status = 'active'
  )
);

drop policy if exists "product_tags_manage_admin" on public.product_tags;
create policy "product_tags_manage_admin"
on public.product_tags
for all
to authenticated
using (public.is_super_admin())
with check (public.is_super_admin());

drop policy if exists "product_tag_assignments_public_read" on public.product_tag_assignments;
create policy "product_tag_assignments_public_read"
on public.product_tag_assignments
for select
to anon, authenticated
using (
  exists (
    select 1 from public.products product
    where product.id = product_tag_assignments.product_id
      and product.is_active
      and product.stock_status = 'active'
  )
);

drop policy if exists "product_tag_assignments_manage_admin" on public.product_tag_assignments;
create policy "product_tag_assignments_manage_admin"
on public.product_tag_assignments
for all
to authenticated
using (public.is_super_admin())
with check (public.is_super_admin());

drop policy if exists "inventory_movements_admin_read" on public.inventory_movements;
create policy "inventory_movements_admin_read"
on public.inventory_movements
for select
to authenticated
using (public.is_super_admin());

do $$
declare
  table_name text;
begin
  foreach table_name in array array['product_variants'] loop
    execute format('drop trigger if exists set_updated_at on public.%I', table_name);
    execute format(
      'create trigger set_updated_at before update on public.%I for each row execute function public.set_updated_at()',
      table_name
    );
  end loop;
end $$;

create or replace function public.admin_save_product(
  p_product_id uuid,
  p_product jsonb,
  p_variants jsonb,
  p_collection_ids uuid[],
  p_tags text[],
  p_inventory_reason text default null
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_product_id uuid := p_product_id;
  v_existing public.products%rowtype;
  v_saved public.products%rowtype;
  v_variant jsonb;
  v_variant_id uuid;
  v_variant_ids uuid[] := array[]::uuid[];
  v_old_variant public.product_variants%rowtype;
  v_saved_variant public.product_variants%rowtype;
  v_tag text;
  v_tag_id uuid;
  v_tags text[];
  v_collection_ids uuid[] := coalesce(p_collection_ids, array[]::uuid[]);
  v_reason text := nullif(trim(coalesce(p_inventory_reason, '')), '');
begin
  if v_user_id is null or not public.is_super_admin() then
    raise exception 'Super Admin permission is required to manage products.' using errcode = '42501';
  end if;

  if p_product is null or jsonb_typeof(p_product) is distinct from 'object' then
    raise exception 'Product data must be a JSON object.';
  end if;
  if p_variants is null or jsonb_typeof(p_variants) is distinct from 'array' then
    raise exception 'Product variants must be a list.';
  end if;
  if jsonb_array_length(p_variants) > 100 then
    raise exception 'A product may have at most 100 variants.';
  end if;
  if nullif(trim(coalesce(p_product ->> 'slug', '')), '') is null
    or nullif(trim(coalesce(p_product ->> 'sku', '')), '') is null
    or nullif(trim(coalesce(p_product #>> '{metadata,name,en}', '')), '') is null then
    raise exception 'Product handle, SKU, and English product title are required.';
  end if;
  if jsonb_typeof(coalesce(p_product -> 'metadata', '{}'::jsonb)) is distinct from 'object' then
    raise exception 'Product metadata must be a JSON object.';
  end if;

  if v_product_id is not null then
    select * into v_existing
    from public.products
    where id = v_product_id
    for update;
    if not found then
      raise exception 'Product not found.';
    end if;
  end if;

  insert into public.products (
    id, slug, sku, category_id, collection_id, currency, base_price,
    compare_at_price, stock_status, is_featured, is_active, material,
    dimensions, metadata, barcode, product_type, vendor, short_description,
    cost_per_item, taxable, track_inventory, inventory_quantity,
    continue_selling_when_out_of_stock, low_stock_threshold, is_physical,
    weight, weight_unit, length, width, height, measurement_unit,
    country_of_origin, hs_code, product_options, created_by, updated_by
  )
  values (
    coalesce(v_product_id, gen_random_uuid()),
    trim(p_product ->> 'slug'),
    trim(p_product ->> 'sku'),
    nullif(p_product ->> 'category_id', '')::uuid,
    coalesce(v_collection_ids[1], nullif(p_product ->> 'collection_id', '')::uuid),
    upper(coalesce(nullif(trim(p_product ->> 'currency'), ''), 'INR')),
    coalesce(nullif(p_product ->> 'base_price', '')::numeric, 0),
    nullif(p_product ->> 'compare_at_price', '')::numeric,
    coalesce(nullif(p_product ->> 'stock_status', '')::public.product_stock_status, 'draft'),
    coalesce((p_product ->> 'is_featured')::boolean, false),
    coalesce((p_product ->> 'is_active')::boolean, false),
    nullif(trim(p_product ->> 'material'), ''),
    nullif(trim(p_product ->> 'dimensions'), ''),
    coalesce(p_product -> 'metadata', '{}'::jsonb),
    nullif(trim(p_product ->> 'barcode'), ''),
    nullif(trim(p_product ->> 'product_type'), ''),
    nullif(trim(p_product ->> 'vendor'), ''),
    nullif(trim(p_product ->> 'short_description'), ''),
    nullif(p_product ->> 'cost_per_item', '')::numeric,
    coalesce((p_product ->> 'taxable')::boolean, true),
    coalesce((p_product ->> 'track_inventory')::boolean, false),
    coalesce(nullif(p_product ->> 'inventory_quantity', '')::integer, 0),
    coalesce((p_product ->> 'continue_selling_when_out_of_stock')::boolean, false),
    coalesce(nullif(p_product ->> 'low_stock_threshold', '')::integer, 5),
    coalesce((p_product ->> 'is_physical')::boolean, true),
    nullif(p_product ->> 'weight', '')::numeric,
    coalesce(nullif(p_product ->> 'weight_unit', ''), 'kg'),
    nullif(p_product ->> 'length', '')::numeric,
    nullif(p_product ->> 'width', '')::numeric,
    nullif(p_product ->> 'height', '')::numeric,
    coalesce(nullif(p_product ->> 'measurement_unit', ''), 'cm'),
    nullif(trim(p_product ->> 'country_of_origin'), ''),
    nullif(trim(p_product ->> 'hs_code'), ''),
    coalesce(p_product -> 'product_options', '[]'::jsonb),
    v_user_id,
    v_user_id
  )
  on conflict (id) do update set
    slug = excluded.slug,
    sku = excluded.sku,
    category_id = excluded.category_id,
    collection_id = excluded.collection_id,
    currency = excluded.currency,
    base_price = excluded.base_price,
    compare_at_price = excluded.compare_at_price,
    stock_status = excluded.stock_status,
    is_featured = excluded.is_featured,
    is_active = excluded.is_active,
    material = excluded.material,
    dimensions = excluded.dimensions,
    metadata = excluded.metadata,
    barcode = excluded.barcode,
    product_type = excluded.product_type,
    vendor = excluded.vendor,
    short_description = excluded.short_description,
    cost_per_item = excluded.cost_per_item,
    taxable = excluded.taxable,
    track_inventory = excluded.track_inventory,
    inventory_quantity = excluded.inventory_quantity,
    continue_selling_when_out_of_stock = excluded.continue_selling_when_out_of_stock,
    low_stock_threshold = excluded.low_stock_threshold,
    is_physical = excluded.is_physical,
    weight = excluded.weight,
    weight_unit = excluded.weight_unit,
    length = excluded.length,
    width = excluded.width,
    height = excluded.height,
    measurement_unit = excluded.measurement_unit,
    country_of_origin = excluded.country_of_origin,
    hs_code = excluded.hs_code,
    product_options = excluded.product_options,
    updated_by = v_user_id
  returning * into v_saved;
  v_product_id := v_saved.id;

  if v_existing.id is null
    and v_saved.track_inventory
    and v_saved.inventory_quantity > 0 then
    insert into public.inventory_movements (
      product_id, quantity_delta, quantity_after, reason, source, created_by
    )
    values (
      v_product_id,
      v_saved.inventory_quantity,
      v_saved.inventory_quantity,
      coalesce(v_reason, 'Initial inventory'),
      'admin',
      v_user_id
    );
  end if;

  if v_existing.id is not null
    and v_saved.track_inventory
    and (
      not v_existing.track_inventory
      or v_existing.inventory_quantity <> v_saved.inventory_quantity
    ) then
    if v_existing.track_inventory and v_reason is null then
      raise exception 'Enter a reason when changing tracked inventory.';
    end if;
    insert into public.inventory_movements (
      product_id, quantity_delta, quantity_after, reason, source, created_by
    )
    values (
      v_product_id,
      v_saved.inventory_quantity - v_existing.inventory_quantity,
      v_saved.inventory_quantity,
      coalesce(v_reason, 'Inventory tracking enabled'),
      'admin',
      v_user_id
    );
  end if;

  for v_variant in select value from jsonb_array_elements(p_variants) as variants(value)
  loop
    if jsonb_typeof(v_variant) is distinct from 'object'
      or nullif(trim(coalesce(v_variant ->> 'title', '')), '') is null
      or nullif(v_variant ->> 'price', '') is null then
      raise exception 'Each variant requires a title and price.';
    end if;
    v_variant_id := nullif(v_variant ->> 'id', '')::uuid;

    if v_variant_id is not null then
      select * into v_old_variant
      from public.product_variants
      where id = v_variant_id and product_id = v_product_id
      for update;
      if not found then
        raise exception 'A selected variant does not belong to this product.';
      end if;
      update public.product_variants
      set title = trim(v_variant ->> 'title'),
        option_values = coalesce(v_variant -> 'option_values', '{}'::jsonb),
        sku = nullif(trim(v_variant ->> 'sku'), ''),
        barcode = nullif(trim(v_variant ->> 'barcode'), ''),
        price = (v_variant ->> 'price')::numeric,
        compare_at_price = nullif(v_variant ->> 'compare_at_price', '')::numeric,
        track_inventory = coalesce((v_variant ->> 'track_inventory')::boolean, true),
        inventory_quantity = coalesce(nullif(v_variant ->> 'inventory_quantity', '')::integer, 0),
        continue_selling_when_out_of_stock = coalesce((v_variant ->> 'continue_selling_when_out_of_stock')::boolean, false),
        weight = nullif(v_variant ->> 'weight', '')::numeric,
        is_active = coalesce((v_variant ->> 'is_active')::boolean, true),
        sort_order = coalesce(nullif(v_variant ->> 'sort_order', '')::integer, 0)
      where id = v_variant_id
      returning * into v_saved_variant;

      if v_saved_variant.track_inventory
        and (
          not v_old_variant.track_inventory
          or v_old_variant.inventory_quantity <> v_saved_variant.inventory_quantity
        ) then
        if v_old_variant.track_inventory and v_reason is null then
          raise exception 'Enter a reason when changing tracked variant inventory.';
        end if;
        insert into public.inventory_movements (
          product_id, variant_id, quantity_delta, quantity_after, reason, source, created_by
        )
        values (
          v_product_id,
          v_variant_id,
          v_saved_variant.inventory_quantity - v_old_variant.inventory_quantity,
          v_saved_variant.inventory_quantity,
          coalesce(v_reason, 'Inventory tracking enabled'),
          'admin',
          v_user_id
        );
      end if;
    else
      insert into public.product_variants (
        product_id, title, option_values, sku, barcode, price,
        compare_at_price, track_inventory, inventory_quantity,
        continue_selling_when_out_of_stock, weight, is_active, sort_order
      )
      values (
        v_product_id,
        trim(v_variant ->> 'title'),
        coalesce(v_variant -> 'option_values', '{}'::jsonb),
        nullif(trim(v_variant ->> 'sku'), ''),
        nullif(trim(v_variant ->> 'barcode'), ''),
        (v_variant ->> 'price')::numeric,
        nullif(v_variant ->> 'compare_at_price', '')::numeric,
        coalesce((v_variant ->> 'track_inventory')::boolean, true),
        coalesce(nullif(v_variant ->> 'inventory_quantity', '')::integer, 0),
        coalesce((v_variant ->> 'continue_selling_when_out_of_stock')::boolean, false),
        nullif(v_variant ->> 'weight', '')::numeric,
        coalesce((v_variant ->> 'is_active')::boolean, true),
        coalesce(nullif(v_variant ->> 'sort_order', '')::integer, 0)
      )
      returning * into v_saved_variant;
      v_variant_id := v_saved_variant.id;
      if v_saved_variant.track_inventory and v_saved_variant.inventory_quantity > 0 then
        insert into public.inventory_movements (
          product_id, variant_id, quantity_delta, quantity_after, reason, source, created_by
        )
        values (
          v_product_id,
          v_variant_id,
          v_saved_variant.inventory_quantity,
          v_saved_variant.inventory_quantity,
          coalesce(v_reason, 'Initial inventory'),
          'admin',
          v_user_id
        );
      end if;
    end if;
    v_variant_ids := array_append(v_variant_ids, v_variant_id);
  end loop;

  update public.product_variants
  set is_active = false
  where product_id = v_product_id
    and not (id = any(v_variant_ids));

  delete from public.product_collections where product_id = v_product_id;
  if cardinality(v_collection_ids) > 0 then
    insert into public.product_collections (product_id, collection_id)
    select v_product_id, collection_id
    from unnest(v_collection_ids) as selected(collection_id)
    on conflict do nothing;
  end if;

  delete from public.product_tag_assignments where product_id = v_product_id;
  select coalesce(array_agg(distinct trim(tag)), array[]::text[])
  into v_tags
  from unnest(coalesce(p_tags, array[]::text[])) as supplied(tag)
  where trim(tag) <> '';

  foreach v_tag in array v_tags
  loop
    insert into public.product_tags (name)
    values (v_tag)
    on conflict (lower(name)) do update set name = excluded.name
    returning id into v_tag_id;
    insert into public.product_tag_assignments (product_id, tag_id)
    values (v_product_id, v_tag_id)
    on conflict do nothing;
  end loop;

  return v_product_id;
end;
$$;

create or replace function public.place_order(
  p_cart_items jsonb,
  p_shipping_address jsonb,
  p_checkout_request_id uuid
)
returns table (
  order_id uuid,
  order_number text,
  public_tracking_code text,
  grand_total numeric,
  currency text
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_email text;
  v_locale text;
  v_address_id uuid;
  v_address_snapshot jsonb;
  v_existing_order public.orders%rowtype;
  v_order public.orders%rowtype;
  v_product public.products%rowtype;
  v_variant public.product_variants%rowtype;
  v_line jsonb;
  v_product_id uuid;
  v_variant_id uuid;
  v_quantity integer;
  v_unit_price numeric(12, 2);
  v_line_total numeric(12, 2);
  v_subtotal numeric(12, 2) := 0;
  v_currency text;
  v_seen_product_lines text[] := array[]::text[];
  v_order_lines jsonb := '[]'::jsonb;
  v_product_name text;
  v_product_image text;
  v_line_count integer := 0;
  v_now timestamptz := timezone('utc', now());
  v_order_number text;
  v_tracking_code text;
  v_option_values jsonb;
  v_variant_title text;
  v_tracking_summary jsonb;
  v_stock_after integer;
  v_inventory_delta integer;
begin
  if v_user_id is null then
    raise exception 'Sign in to place an order.' using errcode = '42501';
  end if;
  if p_checkout_request_id is null then
    raise exception 'A checkout request identifier is required.';
  end if;
  perform pg_advisory_xact_lock(
    hashtextextended(v_user_id::text || ':' || p_checkout_request_id::text, 0)
  );

  select * into v_existing_order
  from public.orders
  where user_id = v_user_id and checkout_request_id = p_checkout_request_id;
  if found then
    return query select v_existing_order.id, v_existing_order.order_number,
      v_existing_order.public_tracking_code, v_existing_order.grand_total,
      v_existing_order.currency;
    return;
  end if;

  if p_cart_items is null or jsonb_typeof(p_cart_items) is distinct from 'array' then
    raise exception 'Your cart must be a list of products.';
  end if;
  if jsonb_array_length(p_cart_items) not between 1 and 100 then
    raise exception 'Your cart must contain between 1 and 100 products.';
  end if;
  if p_shipping_address is null or jsonb_typeof(p_shipping_address) is distinct from 'object' then
    raise exception 'A delivery address is required.';
  end if;
  if length(trim(coalesce(p_shipping_address ->> 'label', ''))) < 2
    or length(trim(coalesce(p_shipping_address ->> 'recipientName', ''))) < 2
    or length(trim(coalesce(p_shipping_address ->> 'phone', ''))) < 8
    or length(trim(coalesce(p_shipping_address ->> 'addressLine1', ''))) < 5
    or length(trim(coalesce(p_shipping_address ->> 'city', ''))) < 2
    or length(trim(coalesce(p_shipping_address ->> 'state', ''))) < 2
    or length(trim(coalesce(p_shipping_address ->> 'postalCode', ''))) < 4
    or upper(trim(coalesce(p_shipping_address ->> 'countryCode', ''))) <> 'IN' then
    raise exception 'Enter a complete and valid delivery address.';
  end if;

  select email into v_email from auth.users where id = v_user_id;
  if nullif(trim(v_email), '') is null then
    raise exception 'Your account needs an email address before checkout.';
  end if;
  select coalesce(profile.locale_code::text, 'en')
  into v_locale
  from (select 1) seed
  left join public.profiles profile on profile.id = v_user_id;

  for v_line in select value from jsonb_array_elements(p_cart_items) as cart(value)
  loop
    v_line_count := v_line_count + 1;
    if jsonb_typeof(v_line) is distinct from 'object' then
      raise exception 'Each cart item must include a product and quantity.';
    end if;
    v_product_id := (v_line ->> 'productId')::uuid;
    v_variant_id := nullif(v_line ->> 'variantId', '')::uuid;
    v_quantity := (v_line ->> 'quantity')::integer;
    if v_product_id is null or v_quantity is null or v_quantity < 1 or v_quantity > 99 then
      raise exception 'Cart quantities must be between 1 and 99.';
    end if;
    if v_product_id::text || ':' || coalesce(v_variant_id::text, '') = any(v_seen_product_lines) then
      raise exception 'Your cart contains a duplicate product.';
    end if;
    v_seen_product_lines := array_append(
      v_seen_product_lines,
      v_product_id::text || ':' || coalesce(v_variant_id::text, '')
    );

    select * into v_product
    from public.products
    where id = v_product_id and is_active and stock_status = 'active'
    for update;
    if not found then
      raise exception 'A product in your cart is no longer available.';
    end if;

    v_variant := null;
    v_variant_title := null;
    v_option_values := '{}'::jsonb;
    v_unit_price := v_product.base_price;
    v_stock_after := null;
    v_inventory_delta := 0;
    if v_variant_id is not null then
      select * into v_variant
      from public.product_variants
      where id = v_variant_id and product_id = v_product_id and is_active
      for update;
      if not found then
        raise exception 'A selected product option is no longer available.';
      end if;
      v_unit_price := v_variant.price;
      v_variant_title := v_variant.title;
      v_option_values := v_variant.option_values;
    elsif exists (
      select 1 from public.product_variants variant
      where variant.product_id = v_product_id and variant.is_active
    ) then
      raise exception 'Choose an available option for each product with variants.';
    end if;

    if v_currency is not null and v_currency <> v_product.currency then
      raise exception 'All items in one order must use the same currency.';
    end if;
    v_currency := v_product.currency;
    v_line_total := round(v_unit_price * v_quantity, 2);
    v_subtotal := v_subtotal + v_line_total;
    v_product_name := coalesce(
      v_product.metadata #>> array['name', v_locale],
      v_product.metadata #>> array['name', 'en'],
      v_product.metadata ->> 'name',
      v_product.slug
    );

    select media.secure_url into v_product_image
    from public.product_images image
    join public.media media on media.id = image.media_id
    where image.product_id = v_product.id
    order by image.is_primary desc, image.sort_order asc
    limit 1;

    if v_variant_id is not null then
      if v_variant.track_inventory and v_variant.inventory_quantity < v_quantity
        and not v_variant.continue_selling_when_out_of_stock then
        raise exception 'Insufficient stock for product option "%".', v_variant.title;
      end if;
      if v_variant.track_inventory and v_variant.inventory_quantity > 0 then
        v_stock_after := greatest(v_variant.inventory_quantity - v_quantity, 0);
        update public.product_variants
        set inventory_quantity = v_stock_after
        where id = v_variant_id;
        v_inventory_delta := v_stock_after - v_variant.inventory_quantity;
      end if;
    elsif v_product.track_inventory then
      if v_product.inventory_quantity < v_quantity
        and not v_product.continue_selling_when_out_of_stock then
        raise exception 'Insufficient stock for "%".', v_product_name;
      end if;
      if v_product.inventory_quantity > 0 then
        v_stock_after := greatest(v_product.inventory_quantity - v_quantity, 0);
        update public.products
        set inventory_quantity = v_stock_after
        where id = v_product_id;
        v_inventory_delta := v_stock_after - v_product.inventory_quantity;
      end if;
    end if;

    v_order_lines := v_order_lines || jsonb_build_array(jsonb_build_object(
      'product_id', v_product.id,
      'variant_id', v_variant_id,
      'inventory_delta', v_inventory_delta,
      'inventory_quantity_after', v_stock_after,
      'quantity', v_quantity,
      'unit_price', v_unit_price,
      'line_total', v_line_total,
      'currency', v_product.currency,
      'product_snapshot', jsonb_build_object(
        'name', v_product_name,
        'slug', v_product.slug,
        'sku', coalesce(v_variant.sku, v_product.sku),
        'image_url', v_product_image,
        'variant_title', v_variant_title,
        'variant_options', v_option_values
      )
    ));
  end loop;

  if v_line_count <> jsonb_array_length(p_cart_items) then
    raise exception 'Unable to validate every item in your cart.';
  end if;

  v_address_snapshot := jsonb_build_object(
    'label', trim(p_shipping_address ->> 'label'),
    'recipient_name', trim(p_shipping_address ->> 'recipientName'),
    'phone', trim(p_shipping_address ->> 'phone'),
    'line1', trim(p_shipping_address ->> 'addressLine1'),
    'line2', nullif(trim(coalesce(p_shipping_address ->> 'addressLine2', '')), ''),
    'city', trim(p_shipping_address ->> 'city'),
    'state', trim(p_shipping_address ->> 'state'),
    'postal_code', trim(p_shipping_address ->> 'postalCode'),
    'country_code', 'IN',
    'landmark', nullif(trim(coalesce(p_shipping_address ->> 'landmark', '')), '')
  );
  perform pg_advisory_xact_lock(hashtextextended(v_user_id::text, 0));
  select id into v_address_id from public.addresses
  where user_id = v_user_id and is_default
  order by updated_at desc limit 1 for update;
  update public.addresses set is_default = false
  where user_id = v_user_id and is_default;
  if v_address_id is null then
    insert into public.addresses (
      user_id, label, recipient_name, phone, line1, line2, city, state,
      postal_code, country_code, landmark, is_default
    )
    values (
      v_user_id, v_address_snapshot ->> 'label', v_address_snapshot ->> 'recipient_name',
      v_address_snapshot ->> 'phone', v_address_snapshot ->> 'line1',
      v_address_snapshot ->> 'line2', v_address_snapshot ->> 'city',
      v_address_snapshot ->> 'state', v_address_snapshot ->> 'postal_code',
      'IN', v_address_snapshot ->> 'landmark', true
    );
  else
    update public.addresses
    set label = v_address_snapshot ->> 'label',
      recipient_name = v_address_snapshot ->> 'recipient_name',
      phone = v_address_snapshot ->> 'phone',
      line1 = v_address_snapshot ->> 'line1',
      line2 = v_address_snapshot ->> 'line2',
      city = v_address_snapshot ->> 'city',
      state = v_address_snapshot ->> 'state',
      postal_code = v_address_snapshot ->> 'postal_code',
      country_code = 'IN',
      landmark = v_address_snapshot ->> 'landmark',
      is_default = true
    where id = v_address_id;
  end if;

  v_order_number := 'KM-' || to_char(v_now, 'YYYYMMDD') || '-' ||
    upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 16));
  v_tracking_code := encode(gen_random_bytes(24), 'hex');
  v_tracking_summary := jsonb_build_object('summary', 'Order placed. Awaiting confirmation.');
  insert into public.orders (
    user_id, checkout_request_id, order_number, public_tracking_code, status,
    payment_status, payment_method, currency, subtotal, discount_total,
    shipping_total, tax_total, grand_total, shipping_address_snapshot,
    contact_email, contact_phone, placed_at, tracking_summary
  )
  values (
    v_user_id, p_checkout_request_id, v_order_number, v_tracking_code, 'placed',
    'cash_on_delivery', 'cod', v_currency, v_subtotal, 0, 0, 0, v_subtotal,
    v_address_snapshot, lower(trim(v_email)), v_address_snapshot ->> 'phone',
    v_now, v_tracking_summary
  )
  on conflict (user_id, checkout_request_id)
    where checkout_request_id is not null
  do nothing
  returning * into v_order;

  if v_order.id is null then
    select * into v_order
    from public.orders
    where user_id = v_user_id and checkout_request_id = p_checkout_request_id;
    return query select v_order.id, v_order.order_number,
      v_order.public_tracking_code, v_order.grand_total, v_order.currency;
    return;
  end if;

  insert into public.order_items (
    order_id, product_id, variant_id, product_snapshot, quantity,
    unit_price, line_total, currency
  )
  select
    v_order.id,
    (item ->> 'product_id')::uuid,
    nullif(item ->> 'variant_id', '')::uuid,
    item -> 'product_snapshot',
    (item ->> 'quantity')::integer,
    (item ->> 'unit_price')::numeric,
    (item ->> 'line_total')::numeric,
    item ->> 'currency'
  from jsonb_array_elements(v_order_lines) as lines(item);

  for v_line in select value from jsonb_array_elements(v_order_lines) as lines(value)
  loop
    if (v_line ->> 'inventory_delta')::integer <> 0 then
      insert into public.inventory_movements (
        product_id, variant_id, quantity_delta, quantity_after, reason, source, order_id, created_by
      )
      values (
        (v_line ->> 'product_id')::uuid,
        nullif(v_line ->> 'variant_id', '')::uuid,
        (v_line ->> 'inventory_delta')::integer,
        (v_line ->> 'inventory_quantity_after')::integer,
        'Order placed',
        'order',
        v_order.id,
        v_user_id
      );
    end if;
  end loop;

  insert into public.order_status_events (order_id, status, note_key, event_at, metadata)
  values (v_order.id, 'placed', 'Order placed', v_now, jsonb_build_object('source', 'checkout'));
  return query select v_order.id, v_order.order_number,
    v_order.public_tracking_code, v_order.grand_total, v_order.currency;
end;
$$;

create or replace function public.restore_order_inventory(
  p_order_id uuid,
  p_user_id uuid
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_movement record;
  v_quantity_after integer;
begin
  for v_movement in
    select product_id, variant_id, sum(quantity_delta)::integer as net_delta
    from public.inventory_movements
    where order_id = p_order_id
      and source = 'order'
    group by product_id, variant_id
    having sum(quantity_delta) < 0
  loop
    if v_movement.variant_id is not null then
      update public.product_variants
      set inventory_quantity = inventory_quantity - v_movement.net_delta
      where id = v_movement.variant_id
        and product_id = v_movement.product_id
      returning inventory_quantity into v_quantity_after;
      if found then
        insert into public.inventory_movements (
          product_id, variant_id, quantity_delta, quantity_after,
          reason, source, order_id, created_by
        )
        values (
          v_movement.product_id, v_movement.variant_id,
          -v_movement.net_delta, v_quantity_after,
          'Order cancelled', 'order', p_order_id, p_user_id
        );
      end if;
    else
      update public.products
      set inventory_quantity = inventory_quantity - v_movement.net_delta
      where id = v_movement.product_id
      returning inventory_quantity into v_quantity_after;
      if found then
        insert into public.inventory_movements (
          product_id, quantity_delta, quantity_after,
          reason, source, order_id, created_by
        )
        values (
          v_movement.product_id, -v_movement.net_delta, v_quantity_after,
          'Order cancelled', 'order', p_order_id, p_user_id
        );
      end if;
    end if;
  end loop;
end;
$$;

create or replace function public.cancel_order(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_order public.orders%rowtype;
  v_now timestamptz := timezone('utc', now());
begin
  if auth.uid() is null then
    raise exception 'Sign in to cancel an order.' using errcode = '42501';
  end if;

  update public.orders
  set status = 'cancelled',
    cancelled_at = v_now,
    tracking_summary = jsonb_build_object('summary', 'Order cancelled by customer.')
  where id = p_order_id
    and user_id = auth.uid()
    and status in ('placed', 'confirmed')
    and payment_status in ('pending', 'cash_on_delivery')
  returning * into v_order;

  if not found then
    raise exception 'This order can no longer be cancelled.';
  end if;

  perform public.restore_order_inventory(v_order.id, auth.uid());

  insert into public.order_status_events (order_id, status, note_key, event_at, metadata)
  values (
    v_order.id,
    'cancelled',
    'Order cancelled by customer',
    v_now,
    jsonb_build_object('source', 'customer')
  );
end;
$$;

create or replace function public.admin_update_order(
  p_order_id uuid,
  p_status public.order_status,
  p_payment_status public.payment_status,
  p_tracking_summary jsonb
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_order public.orders%rowtype;
  v_previous_status public.order_status;
  v_now timestamptz := timezone('utc', now());
begin
  if auth.uid() is null or not public.is_super_admin() then
    raise exception 'Super Admin permission is required to update orders.' using errcode = '42501';
  end if;

  select * into v_order
  from public.orders
  where id = p_order_id
  for update;
  if not found then
    raise exception 'Order not found.';
  end if;
  v_previous_status := v_order.status;

  if v_previous_status = 'cancelled' and p_status <> 'cancelled' then
    raise exception 'A cancelled order cannot be reopened. Create a new order instead.';
  end if;

  update public.orders
  set status = p_status,
    payment_status = p_payment_status,
    tracking_summary = p_tracking_summary,
    confirmed_at = case when p_status = 'confirmed' then coalesce(confirmed_at, v_now) else confirmed_at end,
    shipped_at = case when p_status = 'in_transit' then coalesce(shipped_at, v_now) else shipped_at end,
    delivered_at = case when p_status = 'delivered' then coalesce(delivered_at, v_now) else delivered_at end,
    cancelled_at = case when p_status = 'cancelled' then coalesce(cancelled_at, v_now) else cancelled_at end
  where id = p_order_id;

  if p_status = 'cancelled'
    and v_previous_status in ('placed', 'confirmed', 'packed') then
    perform public.restore_order_inventory(v_order.id, auth.uid());
  end if;

  if p_status <> v_previous_status then
    insert into public.order_status_events (order_id, status, note_key, event_at, metadata)
    values (
      p_order_id,
      p_status::text,
      'Order status updated to ' || replace(p_status::text, '_', ' '),
      v_now,
      jsonb_build_object('source', 'admin', 'previous_status', v_previous_status)
    );
  end if;
end;
$$;

create or replace function public.admin_list_products(
  p_search text default null,
  p_status text default null,
  p_category_id uuid default null,
  p_collection_id uuid default null,
  p_inventory_status text default null,
  p_sort text default 'updated_at',
  p_ascending boolean default false,
  p_page integer default 1,
  p_page_size integer default 25
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_offset integer;
  v_sort text;
  v_direction text;
  v_result jsonb;
begin
  if auth.uid() is null or not public.is_super_admin() then
    raise exception 'Super Admin permission is required to view all products.' using errcode = '42501';
  end if;
  if p_page < 1 or p_page_size < 1 or p_page_size > 100 then
    raise exception 'Product page and page size are invalid.';
  end if;
  if p_status is not null and p_status not in ('draft', 'active', 'archived') then
    raise exception 'Product status filter is invalid.';
  end if;
  if p_inventory_status is not null
    and p_inventory_status not in ('in_stock', 'low_stock', 'out_of_stock', 'not_tracked') then
    raise exception 'Inventory filter is invalid.';
  end if;
  if p_sort not in ('name', 'price', 'created_at', 'updated_at', 'inventory_quantity', 'sku') then
    raise exception 'Product sort field is invalid.';
  end if;
  v_offset := (p_page - 1) * p_page_size;
  v_sort := case p_sort
    when 'name' then 'coalesce(product.metadata #>> ''{name,en}'', product.slug)'
    when 'price' then 'product.base_price'
    when 'created_at' then 'product.created_at'
    when 'inventory_quantity' then 'product.inventory_quantity'
    when 'sku' then 'product.sku'
    else 'product.updated_at'
  end;
  v_direction := case when p_ascending then 'asc' else 'desc' end;

  execute format(
    'with filtered as (
       select product.*
       from public.products product
       where ($1 is null
         or product.id::text ilike $1
         or product.slug ilike $1
         or product.sku ilike $1
         or coalesce(product.barcode, '''') ilike $1
         or coalesce(product.metadata #>> ''{name,en}'', '''') ilike $1
         or coalesce(product.metadata #>> ''{name,hi}'', '''') ilike $1)
         and ($2 is null or product.stock_status::text = $2)
         and ($3 is null or product.category_id = $3)
         and ($4 is null or product.collection_id = $4
           or exists (
             select 1 from public.product_collections product_collection
             where product_collection.product_id = product.id
               and product_collection.collection_id = $4
           ))
         and ($5 is null
           or ($5 = ''not_tracked'' and (
             (exists (select 1 from public.product_variants variant
               where variant.product_id = product.id and variant.is_active)
               and not exists (select 1 from public.product_variants variant
                 where variant.product_id = product.id and variant.is_active and variant.track_inventory))
             or (not exists (select 1 from public.product_variants variant
               where variant.product_id = product.id and variant.is_active)
               and not product.track_inventory)
           ))
           or ($5 = ''out_of_stock'' and (
             (exists (select 1 from public.product_variants variant
               where variant.product_id = product.id and variant.is_active)
               and not exists (select 1 from public.product_variants variant
                 where variant.product_id = product.id and variant.is_active
                   and (not variant.track_inventory or variant.inventory_quantity > 0
                     or variant.continue_selling_when_out_of_stock)))
             or (not exists (select 1 from public.product_variants variant
               where variant.product_id = product.id and variant.is_active)
               and product.track_inventory and product.inventory_quantity = 0
               and not product.continue_selling_when_out_of_stock)
           ))
           or ($5 = ''low_stock'' and (
             exists (select 1 from public.product_variants variant
               where variant.product_id = product.id and variant.is_active
                 and variant.track_inventory and variant.inventory_quantity > 0
                 and variant.inventory_quantity <= product.low_stock_threshold)
             or (not exists (select 1 from public.product_variants variant
               where variant.product_id = product.id and variant.is_active)
               and product.track_inventory and product.inventory_quantity > 0
               and product.inventory_quantity <= product.low_stock_threshold)
           ))
           or ($5 = ''in_stock'' and (
             exists (select 1 from public.product_variants variant
               where variant.product_id = product.id and variant.is_active
                 and (not variant.track_inventory
                   or variant.inventory_quantity > product.low_stock_threshold
                   or variant.continue_selling_when_out_of_stock))
             or (not exists (select 1 from public.product_variants variant
               where variant.product_id = product.id and variant.is_active)
               and (not product.track_inventory
                 or product.inventory_quantity > product.low_stock_threshold
                 or product.continue_selling_when_out_of_stock))
           ))
         )
     ),
     total as (select count(*) as count from filtered),
     page_rows as (
       select filtered.*,
         row_number() over(order by %s %s, filtered.id) as row_number
       from filtered
       order by %s %s, filtered.id
       limit $6 offset $7
     )
     select jsonb_build_object(
       ''totalCount'', (select count from total),
       ''products'', coalesce(
         (select jsonb_agg(to_jsonb(page_rows) - ''row_number'' order by row_number) from page_rows),
         ''[]''::jsonb
       )
     )',
    v_sort, v_direction, v_sort, v_direction
  )
  into v_result
  using
    case when nullif(trim(p_search), '') is null then null else '%' || trim(p_search) || '%' end,
    p_status,
    p_category_id,
    p_collection_id,
    p_inventory_status,
    p_page_size,
    v_offset;
  return v_result;
end;
$$;

create or replace function public.admin_reorder_product_images(
  p_product_id uuid,
  p_images jsonb
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_image jsonb;
  v_position integer := 0;
  v_image_count integer;
begin
  if auth.uid() is null or not public.is_super_admin() then
    raise exception 'Super Admin permission is required to edit product images.' using errcode = '42501';
  end if;
  if p_images is null or jsonb_typeof(p_images) is distinct from 'array' then
    raise exception 'Product image order must be a list.';
  end if;

  select count(*) into v_image_count
  from public.product_images
  where product_id = p_product_id;
  if v_image_count <> jsonb_array_length(p_images) then
    raise exception 'Refresh the product gallery before changing its images.';
  end if;

  update public.product_images
  set is_primary = false
  where product_id = p_product_id and is_primary;

  for v_image in select value from jsonb_array_elements(p_images) as images(value)
  loop
    if jsonb_typeof(v_image) is distinct from 'object' then
      raise exception 'Product image entries are invalid.';
    end if;
    update public.product_images
    set sort_order = v_position,
      is_primary = (v_position = 0),
      alt_key = nullif(trim(v_image ->> 'altText'), '')
    where id = (v_image ->> 'id')::uuid
      and product_id = p_product_id;
    if not found then
      raise exception 'A product image does not belong to this product.';
    end if;
    v_position := v_position + 1;
  end loop;
end;
$$;

revoke all on function public.admin_save_product(uuid, jsonb, jsonb, uuid[], text[], text) from public, anon;
grant execute on function public.admin_save_product(uuid, jsonb, jsonb, uuid[], text[], text) to authenticated;
revoke all on function public.restore_order_inventory(uuid, uuid) from public, anon, authenticated;
revoke all on function public.cancel_order(uuid) from public, anon;
revoke all on function public.admin_update_order(uuid, public.order_status, public.payment_status, jsonb) from public, anon;
grant execute on function public.cancel_order(uuid) to authenticated;
grant execute on function public.admin_update_order(uuid, public.order_status, public.payment_status, jsonb) to authenticated;
revoke all on function public.admin_list_products(text, text, uuid, uuid, text, text, boolean, integer, integer) from public, anon;
grant execute on function public.admin_list_products(text, text, uuid, uuid, text, text, boolean, integer, integer) to authenticated;
revoke all on function public.admin_reorder_product_images(uuid, jsonb) from public, anon;
grant execute on function public.admin_reorder_product_images(uuid, jsonb) to authenticated;

do $$
declare
  v_table_name text;
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    foreach v_table_name in array array[
      'products', 'product_variants', 'product_images', 'product_collections'
    ] loop
      if not exists (
        select 1
        from pg_publication_tables
        where pubname = 'supabase_realtime'
          and schemaname = 'public'
          and tablename = v_table_name
      ) then
        execute format('alter publication supabase_realtime add table public.%I', v_table_name);
      end if;
    end loop;
  end if;
end $$;
