-- Manual UPI checkout and order workflow hardening.
-- This migration deliberately keeps the legacy orders.status column for existing
-- customer views, while introducing fulfillment_status as the authoritative
-- fulfillment state. Payment and fulfillment therefore remain independent.

do $$
begin
  create type public.fulfillment_status as enum (
    'unfulfilled', 'processing', 'shipped', 'delivered', 'cancelled'
  );
exception
  when duplicate_object then null;
end $$;

alter table public.orders
  add column if not exists fulfillment_status public.fulfillment_status,
  add column if not exists checkout_request_fingerprint text,
  add column if not exists payment_due_at timestamptz,
  add column if not exists payment_provider text,
  add column if not exists payment_verified_at timestamptz,
  add column if not exists payment_verified_by uuid references auth.users(id) on delete set null,
  add column if not exists payment_transaction_reference text,
  add column if not exists payment_received_amount numeric(12, 2),
  add column if not exists payment_received_currency text,
  add column if not exists refund_status text not null default 'not_requested',
  add column if not exists refunded_amount numeric(12, 2) not null default 0,
  add column if not exists refund_transaction_reference text,
  add column if not exists refunded_at timestamptz,
  add column if not exists refunded_by uuid references auth.users(id) on delete set null,
  add column if not exists inventory_released_at timestamptz;

update public.orders
set fulfillment_status = case status
  when 'confirmed' then 'processing'::public.fulfillment_status
  when 'packed' then 'processing'::public.fulfillment_status
  when 'in_transit' then 'shipped'::public.fulfillment_status
  when 'delivered' then 'delivered'::public.fulfillment_status
  when 'cancelled' then 'cancelled'::public.fulfillment_status
  else 'unfulfilled'::public.fulfillment_status
end
where fulfillment_status is null;

alter table public.orders
  alter column fulfillment_status set default 'unfulfilled',
  alter column fulfillment_status set not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.orders'::regclass
      and conname = 'orders_amounts_nonnegative_check'
  ) then
    alter table public.orders add constraint orders_amounts_nonnegative_check
      check (
        subtotal >= 0 and discount_total >= 0 and shipping_total >= 0
        and tax_total >= 0 and grand_total > 0
        and refunded_amount >= 0 and refunded_amount <= grand_total
      );
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.orders'::regclass
      and conname = 'orders_refund_status_check'
  ) then
    alter table public.orders add constraint orders_refund_status_check
      check (refund_status in ('not_requested', 'requested', 'initiated', 'confirmed', 'failed'));
  end if;
end $$;

create table if not exists public.order_audit_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete restrict,
  actor_id uuid references auth.users(id) on delete set null,
  action text not null check (length(trim(action)) between 3 and 100),
  before_state jsonb,
  after_state jsonb,
  transaction_reference text,
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.order_payment_submissions (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete restrict,
  user_id uuid not null references auth.users(id) on delete restrict,
  transaction_reference text not null check (length(trim(transaction_reference)) between 4 and 128),
  note text check (note is null or length(note) <= 500),
  created_at timestamptz not null default timezone('utc', now()),
  unique (order_id, transaction_reference)
);

create table if not exists public.checkout_rate_limits (
  user_id uuid not null references auth.users(id) on delete cascade,
  window_started_at timestamptz not null,
  request_count integer not null default 0 check (request_count >= 0),
  primary key (user_id, window_started_at)
);

create index if not exists orders_customer_history_idx
  on public.orders (user_id, created_at desc);
create index if not exists orders_payment_fulfillment_admin_idx
  on public.orders (payment_status, fulfillment_status, created_at desc);
create index if not exists orders_pending_payment_expiry_idx
  on public.orders (payment_due_at)
  where payment_status = 'pending' and fulfillment_status = 'unfulfilled';
create unique index if not exists orders_manual_upi_reference_unique
  on public.orders (payment_provider, payment_transaction_reference)
  where payment_provider = 'manual_upi' and payment_transaction_reference is not null;
create index if not exists order_audit_events_order_created_idx
  on public.order_audit_events (order_id, created_at desc);
create index if not exists order_payment_submissions_order_created_idx
  on public.order_payment_submissions (order_id, created_at desc);

-- The receiving details are deliberately private configuration. They are exposed
-- only through the narrow read functions below after validation.
insert into public.site_settings (setting_key, setting_value, is_public, sort_order)
values (
  'payments.manual_upi',
  '{
    "mode": "manual_upi",
    "enabled": false,
    "merchant_name": "Kumbh Mela Store",
    "upi_id": "8180891464@kotakbank",
    "qr_image_url": "https://res.cloudinary.com/dvkyvryei/image/upload/v1792396336/WhatsApp_Image_2026-10-19_at_13.18.19_igyo43.jpg",
    "pending_payment_minutes": 30,
    "instructions": "Pay the exact order amount using UPI. Your order will remain pending until our team verifies the payment.",
    "support_contact": "8180891464"
  }'::jsonb,
  false,
  100
)
on conflict (setting_key) do nothing;

create or replace function public.write_order_audit(
  p_order_id uuid,
  p_actor_id uuid,
  p_action text,
  p_before_state jsonb default null,
  p_after_state jsonb default null,
  p_transaction_reference text default null,
  p_metadata jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.order_audit_events (
    order_id, actor_id, action, before_state, after_state,
    transaction_reference, metadata
  )
  values (
    p_order_id, p_actor_id, p_action, p_before_state, p_after_state,
    nullif(trim(p_transaction_reference), ''), coalesce(p_metadata, '{}'::jsonb)
  );
end;
$$;

create or replace function public.set_order_workflow_context()
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  perform set_config('app.order_workflow', 'active', true);
end;
$$;

create or replace function public.reject_direct_order_state_changes()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if current_setting('app.order_workflow', true) is distinct from 'active'
    and (
      new.status is distinct from old.status
      or new.fulfillment_status is distinct from old.fulfillment_status
      or new.payment_status is distinct from old.payment_status
      or new.payment_method is distinct from old.payment_method
      or new.payment_provider is distinct from old.payment_provider
      or new.payment_verified_at is distinct from old.payment_verified_at
      or new.payment_verified_by is distinct from old.payment_verified_by
      or new.payment_transaction_reference is distinct from old.payment_transaction_reference
      or new.payment_received_amount is distinct from old.payment_received_amount
      or new.payment_received_currency is distinct from old.payment_received_currency
      or new.refund_status is distinct from old.refund_status
      or new.refunded_amount is distinct from old.refunded_amount
      or new.refund_transaction_reference is distinct from old.refund_transaction_reference
      or new.refunded_at is distinct from old.refunded_at
      or new.refunded_by is distinct from old.refunded_by
      or new.inventory_released_at is distinct from old.inventory_released_at
    ) then
    raise exception 'Order payment and fulfillment state can only be changed through an authorized workflow.'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists orders_reject_direct_state_changes on public.orders;
create trigger orders_reject_direct_state_changes
before update on public.orders
for each row execute function public.reject_direct_order_state_changes();

create or replace function public.get_manual_upi_payment_config()
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_config jsonb;
  v_upi_id text;
  v_qr_url text;
  v_merchant_name text;
begin
  if auth.uid() is null then
    raise exception 'Sign in to view payment instructions.' using errcode = '42501';
  end if;

  select setting_value into v_config
  from public.site_settings
  where setting_key = 'payments.manual_upi'
  limit 1;

  if v_config is null
    or jsonb_typeof(v_config) <> 'object'
    or lower(coalesce(v_config ->> 'enabled', 'false')) <> 'true'
    or v_config ->> 'mode' <> 'manual_upi' then
    return jsonb_build_object('available', false);
  end if;

  v_upi_id := nullif(trim(v_config ->> 'upi_id'), '');
  v_qr_url := nullif(trim(v_config ->> 'qr_image_url'), '');
  v_merchant_name := nullif(trim(v_config ->> 'merchant_name'), '');
  if v_upi_id is null
    or v_upi_id !~ '^[A-Za-z0-9._-]{2,256}@[A-Za-z0-9._-]{2,64}$'
    or v_qr_url is null
    or v_qr_url !~ '^https://[^[:space:]]+$'
    or v_merchant_name is null
    or (
      coalesce(v_config ->> 'pending_payment_minutes', '') <> ''
      and not case
        when v_config ->> 'pending_payment_minutes' ~ '^[0-9]+$'
          then (v_config ->> 'pending_payment_minutes')::integer between 5 and 1440
        else false
      end
    ) then
    return jsonb_build_object('available', false);
  end if;

  return jsonb_build_object(
    'available', true,
    'mode', 'manual_upi',
    'merchantName', v_merchant_name,
    'upiId', v_upi_id,
    'qrImageUrl', v_qr_url,
    'pendingPaymentMinutes', case
      when coalesce(v_config ->> 'pending_payment_minutes', '') ~ '^[0-9]+$'
        then (v_config ->> 'pending_payment_minutes')::integer
      else 30
    end,
    'instructions', coalesce(
      nullif(trim(v_config ->> 'instructions'), ''),
      'Please pay the exact amount shown for this order. Your order will be confirmed after we verify receipt of the payment. Do not pay again if your transaction is still processing. Contact support if you need assistance.'
    ),
    'supportContact', nullif(trim(v_config ->> 'support_contact'), '')
  );
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
  v_stock_after integer;
  v_inventory_delta integer;
  v_fingerprint text;
  v_rate_window timestamptz := date_trunc('hour', timezone('utc', now()));
  v_rate_count integer;
  v_payment_config jsonb;
  v_payment_timeout_minutes integer;
begin
  if v_user_id is null then
    raise exception 'Sign in to place an order.' using errcode = '42501';
  end if;
  if p_checkout_request_id is null then
    raise exception 'A checkout request identifier is required.';
  end if;
  if p_cart_items is null or jsonb_typeof(p_cart_items) <> 'array' then
    raise exception 'Your cart must be a list of products.';
  end if;
  if jsonb_array_length(p_cart_items) not between 1 and 100 then
    raise exception 'Your cart must contain between 1 and 100 products.';
  end if;
  if p_shipping_address is null or jsonb_typeof(p_shipping_address) <> 'object' then
    raise exception 'A delivery address is required.';
  end if;

  v_fingerprint := encode(
    digest(p_cart_items::text || '|' || p_shipping_address::text, 'sha256'),
    'hex'
  );
  perform pg_advisory_xact_lock(hashtextextended(v_user_id::text || ':' || p_checkout_request_id::text, 0));
  select * into v_existing_order
  from public.orders
  where user_id = v_user_id and checkout_request_id = p_checkout_request_id;
  if found then
    if v_existing_order.checkout_request_fingerprint is distinct from v_fingerprint then
      raise exception 'This checkout request identifier was already used for different order details.';
    end if;
    return query select v_existing_order.id, v_existing_order.order_number,
      v_existing_order.public_tracking_code, v_existing_order.grand_total,
      v_existing_order.currency;
    return;
  end if;

  -- This is a shared database-backed limit, not a disabled-button heuristic.
  insert into public.checkout_rate_limits as rate_limit (user_id, window_started_at, request_count)
  values (v_user_id, v_rate_window, 1)
  on conflict (user_id, window_started_at)
  do update set request_count = rate_limit.request_count + 1
  returning request_count into v_rate_count;
  if v_rate_count > 10 then
    raise exception 'Too many checkout attempts. Please wait and try again.' using errcode = '54000';
  end if;

  v_payment_config := public.get_manual_upi_payment_config();
  if coalesce((v_payment_config ->> 'available')::boolean, false) is not true then
    raise exception 'Manual UPI payment is currently unavailable. Please contact support.';
  end if;
  if coalesce(v_payment_config ->> 'pendingPaymentMinutes', '') !~ '^[0-9]+$' then
    v_payment_timeout_minutes := 30;
  else
    v_payment_timeout_minutes := (v_payment_config ->> 'pendingPaymentMinutes')::integer;
  end if;
  if v_payment_timeout_minutes not between 5 and 1440 then
    raise exception 'Manual UPI payment configuration has an invalid pending-payment window.';
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
  select coalesce(profile.locale_code::text, 'en') into v_locale
  from (select 1) seed left join public.profiles profile on profile.id = v_user_id;

  for v_line in select value from jsonb_array_elements(p_cart_items) as cart(value)
  loop
    v_line_count := v_line_count + 1;
    if jsonb_typeof(v_line) <> 'object'
      or coalesce(v_line ->> 'productId', '') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
      or (nullif(v_line ->> 'variantId', '') is not null and nullif(v_line ->> 'variantId', '') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$')
      or coalesce(v_line ->> 'quantity', '') !~ '^[0-9]+$' then
      raise exception 'Each cart item must include valid product, option, and quantity values.';
    end if;
    v_product_id := (v_line ->> 'productId')::uuid;
    v_variant_id := nullif(v_line ->> 'variantId', '')::uuid;
    v_quantity := (v_line ->> 'quantity')::integer;
    if v_quantity not between 1 and 99 then
      raise exception 'Cart quantities must be between 1 and 99.';
    end if;
    if v_product_id::text || ':' || coalesce(v_variant_id::text, '') = any(v_seen_product_lines) then
      raise exception 'Your cart contains a duplicate product option.';
    end if;
    v_seen_product_lines := array_append(v_seen_product_lines, v_product_id::text || ':' || coalesce(v_variant_id::text, ''));

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
      select * into v_variant from public.product_variants
      where id = v_variant_id and product_id = v_product_id and is_active
      for update;
      if not found then
        raise exception 'A selected product option is no longer available.';
      end if;
      v_unit_price := v_variant.price;
      v_variant_title := v_variant.title;
      v_option_values := v_variant.option_values;
    elsif exists (select 1 from public.product_variants variant where variant.product_id = v_product_id and variant.is_active) then
      raise exception 'Choose an available option for each product with variants.';
    end if;

    if v_currency is not null and v_currency <> v_product.currency then
      raise exception 'All items in one order must use the same currency.';
    end if;
    if v_product.currency <> 'INR' then
      raise exception 'Manual UPI checkout is available only for INR orders.';
    end if;
    v_currency := v_product.currency;
    v_line_total := round(v_unit_price * v_quantity, 2);
    if v_unit_price < 0 or v_line_total <= 0 then
      raise exception 'A product price is not valid for checkout.';
    end if;
    v_subtotal := v_subtotal + v_line_total;
    v_product_name := coalesce(v_product.metadata #>> array['name', v_locale], v_product.metadata #>> array['name', 'en'], v_product.metadata ->> 'name', v_product.slug);
    select media.secure_url into v_product_image
    from public.product_images image join public.media media on media.id = image.media_id
    where image.product_id = v_product.id
    order by image.is_primary desc, image.sort_order asc limit 1;

    if v_variant_id is not null then
      if v_variant.track_inventory and v_variant.inventory_quantity < v_quantity and not v_variant.continue_selling_when_out_of_stock then
        raise exception 'Insufficient stock for product option "%".', v_variant.title;
      end if;
      if v_variant.track_inventory and v_variant.inventory_quantity > 0 then
        v_stock_after := greatest(v_variant.inventory_quantity - v_quantity, 0);
        update public.product_variants set inventory_quantity = v_stock_after where id = v_variant_id;
        v_inventory_delta := v_stock_after - v_variant.inventory_quantity;
      end if;
    elsif v_product.track_inventory then
      if v_product.inventory_quantity < v_quantity and not v_product.continue_selling_when_out_of_stock then
        raise exception 'Insufficient stock for "%".', v_product_name;
      end if;
      if v_product.inventory_quantity > 0 then
        v_stock_after := greatest(v_product.inventory_quantity - v_quantity, 0);
        update public.products set inventory_quantity = v_stock_after where id = v_product_id;
        v_inventory_delta := v_stock_after - v_product.inventory_quantity;
      end if;
    end if;

    v_order_lines := v_order_lines || jsonb_build_array(jsonb_build_object(
      'product_id', v_product.id, 'variant_id', v_variant_id,
      'inventory_delta', v_inventory_delta, 'inventory_quantity_after', v_stock_after,
      'quantity', v_quantity, 'unit_price', v_unit_price, 'line_total', v_line_total,
      'currency', v_product.currency,
      'product_snapshot', jsonb_build_object(
        'name', v_product_name, 'slug', v_product.slug,
        'sku', coalesce(v_variant.sku, v_product.sku), 'image_url', v_product_image,
        'variant_title', v_variant_title, 'variant_options', v_option_values
      )
    ));
  end loop;

  if v_line_count <> jsonb_array_length(p_cart_items) or v_subtotal <= 0 then
    raise exception 'Unable to validate the order total.';
  end if;
  v_address_snapshot := jsonb_build_object(
    'label', trim(p_shipping_address ->> 'label'), 'recipient_name', trim(p_shipping_address ->> 'recipientName'),
    'phone', trim(p_shipping_address ->> 'phone'), 'line1', trim(p_shipping_address ->> 'addressLine1'),
    'line2', nullif(trim(coalesce(p_shipping_address ->> 'addressLine2', '')), ''),
    'city', trim(p_shipping_address ->> 'city'), 'state', trim(p_shipping_address ->> 'state'),
    'postal_code', trim(p_shipping_address ->> 'postalCode'), 'country_code', 'IN',
    'landmark', nullif(trim(coalesce(p_shipping_address ->> 'landmark', '')), '')
  );
  perform pg_advisory_xact_lock(hashtextextended(v_user_id::text, 0));
  select id into v_address_id from public.addresses
  where user_id = v_user_id and is_default order by updated_at desc limit 1 for update;
  update public.addresses set is_default = false where user_id = v_user_id and is_default;
  if v_address_id is null then
    insert into public.addresses (user_id, label, recipient_name, phone, line1, line2, city, state, postal_code, country_code, landmark, is_default)
    values (v_user_id, v_address_snapshot ->> 'label', v_address_snapshot ->> 'recipient_name', v_address_snapshot ->> 'phone', v_address_snapshot ->> 'line1', v_address_snapshot ->> 'line2', v_address_snapshot ->> 'city', v_address_snapshot ->> 'state', v_address_snapshot ->> 'postal_code', 'IN', v_address_snapshot ->> 'landmark', true);
  else
    update public.addresses set label = v_address_snapshot ->> 'label', recipient_name = v_address_snapshot ->> 'recipient_name', phone = v_address_snapshot ->> 'phone', line1 = v_address_snapshot ->> 'line1', line2 = v_address_snapshot ->> 'line2', city = v_address_snapshot ->> 'city', state = v_address_snapshot ->> 'state', postal_code = v_address_snapshot ->> 'postal_code', country_code = 'IN', landmark = v_address_snapshot ->> 'landmark', is_default = true where id = v_address_id;
  end if;

  v_order_number := 'KM-' || to_char(v_now, 'YYYYMMDD') || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 16));
  v_tracking_code := encode(gen_random_bytes(24), 'hex');
  perform public.set_order_workflow_context();
  insert into public.orders (
    user_id, checkout_request_id, checkout_request_fingerprint, order_number, public_tracking_code,
    status, fulfillment_status, payment_status, payment_method, payment_provider, currency,
    subtotal, discount_total, shipping_total, tax_total, grand_total, shipping_address_snapshot,
    contact_email, contact_phone, placed_at, payment_due_at, tracking_summary
  ) values (
    v_user_id, p_checkout_request_id, v_fingerprint, v_order_number, v_tracking_code,
    'placed', 'unfulfilled', 'pending', 'manual', 'manual_upi', v_currency,
    v_subtotal, 0, 0, 0, v_subtotal, v_address_snapshot, lower(trim(v_email)),
    v_address_snapshot ->> 'phone', v_now, v_now + make_interval(mins => v_payment_timeout_minutes),
    jsonb_build_object('summary', 'Order created. Awaiting manual UPI payment verification.')
  ) returning * into v_order;

  insert into public.order_items (order_id, product_id, variant_id, product_snapshot, quantity, unit_price, line_total, currency)
  select v_order.id, (item ->> 'product_id')::uuid, nullif(item ->> 'variant_id', '')::uuid,
    item -> 'product_snapshot', (item ->> 'quantity')::integer, (item ->> 'unit_price')::numeric,
    (item ->> 'line_total')::numeric, item ->> 'currency'
  from jsonb_array_elements(v_order_lines) as lines(item);

  for v_line in select value from jsonb_array_elements(v_order_lines) as lines(value)
  loop
    if (v_line ->> 'inventory_delta')::integer <> 0 then
      insert into public.inventory_movements (product_id, variant_id, quantity_delta, quantity_after, reason, source, order_id, created_by)
      values ((v_line ->> 'product_id')::uuid, nullif(v_line ->> 'variant_id', '')::uuid,
        (v_line ->> 'inventory_delta')::integer, (v_line ->> 'inventory_quantity_after')::integer,
        'Manual UPI order created', 'order', v_order.id, v_user_id);
    end if;
  end loop;
  insert into public.order_status_events (order_id, status, note_key, event_at, metadata)
  values (v_order.id, 'placed', 'Order created; payment verification pending', v_now, jsonb_build_object('source', 'checkout'));
  perform public.write_order_audit(v_order.id, v_user_id, 'order_created', null,
    jsonb_build_object('payment_status', 'pending', 'fulfillment_status', 'unfulfilled'), null,
    jsonb_build_object('source', 'checkout', 'provider', 'manual_upi'));

  return query select v_order.id, v_order.order_number, v_order.public_tracking_code, v_order.grand_total, v_order.currency;
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
  v_order public.orders%rowtype;
  v_movement record;
  v_quantity_after integer;
begin
  select * into v_order from public.orders where id = p_order_id for update;
  if not found or v_order.inventory_released_at is not null then
    return;
  end if;
  for v_movement in
    select product_id, variant_id, sum(quantity_delta)::integer as net_delta
    from public.inventory_movements
    where order_id = p_order_id and source = 'order'
    group by product_id, variant_id having sum(quantity_delta) < 0
  loop
    if v_movement.variant_id is not null then
      update public.product_variants set inventory_quantity = inventory_quantity - v_movement.net_delta
      where id = v_movement.variant_id and product_id = v_movement.product_id
      returning inventory_quantity into v_quantity_after;
    else
      update public.products set inventory_quantity = inventory_quantity - v_movement.net_delta
      where id = v_movement.product_id returning inventory_quantity into v_quantity_after;
    end if;
    if found then
      insert into public.inventory_movements (product_id, variant_id, quantity_delta, quantity_after, reason, source, order_id, created_by)
      values (v_movement.product_id, v_movement.variant_id, -v_movement.net_delta, v_quantity_after,
        'Order inventory released', 'order', p_order_id, p_user_id);
    end if;
  end loop;
  perform public.set_order_workflow_context();
  update public.orders set inventory_released_at = timezone('utc', now()) where id = p_order_id;
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
  select * into v_order from public.orders
  where id = p_order_id and user_id = auth.uid() for update;
  if not found or v_order.payment_status not in ('pending', 'cash_on_delivery')
    or v_order.fulfillment_status <> 'unfulfilled' then
    raise exception 'This order can no longer be cancelled.';
  end if;
  perform public.set_order_workflow_context();
  update public.orders set status = 'cancelled', fulfillment_status = 'cancelled', cancelled_at = v_now,
    tracking_summary = jsonb_build_object('summary', 'Order cancelled by customer.') where id = p_order_id;
  perform public.restore_order_inventory(p_order_id, auth.uid());
  insert into public.order_status_events (order_id, status, note_key, event_at, metadata)
  values (p_order_id, 'cancelled', 'Order cancelled by customer', v_now, jsonb_build_object('source', 'customer'));
  perform public.write_order_audit(p_order_id, auth.uid(), 'order_cancelled',
    jsonb_build_object('fulfillment_status', v_order.fulfillment_status),
    jsonb_build_object('fulfillment_status', 'cancelled'), null, jsonb_build_object('source', 'customer'));
end;
$$;

create or replace function public.expire_pending_manual_upi_orders(p_limit integer default 100)
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_order public.orders%rowtype;
  v_now timestamptz := timezone('utc', now());
  v_expired integer := 0;
begin
  if p_limit not between 1 and 500 then
    raise exception 'Expiry batch size must be between 1 and 500.';
  end if;

  for v_order in
    select *
    from public.orders
    where payment_provider = 'manual_upi'
      and payment_status = 'pending'
      and fulfillment_status = 'unfulfilled'
      and payment_due_at is not null
      and payment_due_at <= v_now
    order by payment_due_at asc
    limit p_limit
    for update skip locked
  loop
    perform public.set_order_workflow_context();
    update public.orders
    set status = 'cancelled',
      fulfillment_status = 'cancelled',
      cancelled_at = v_now,
      tracking_summary = jsonb_build_object(
        'summary',
        'Order cancelled because the manual UPI payment window expired.'
      )
    where id = v_order.id;
    perform public.restore_order_inventory(v_order.id, null);
    insert into public.order_status_events (order_id, status, note_key, event_at, metadata)
    values (
      v_order.id,
      'cancelled',
      'Order cancelled after payment window expired',
      v_now,
      jsonb_build_object('source', 'pending_payment_expiry')
    );
    perform public.write_order_audit(
      v_order.id,
      null,
      'pending_payment_expired',
      jsonb_build_object('payment_status', 'pending', 'fulfillment_status', 'unfulfilled'),
      jsonb_build_object('payment_status', 'pending', 'fulfillment_status', 'cancelled'),
      null,
      jsonb_build_object('source', 'scheduled_expiry')
    );
    v_expired := v_expired + 1;
  end loop;
  return v_expired;
end;
$$;

create or replace function public.get_order_manual_payment_details(p_order_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_order public.orders%rowtype;
  v_config jsonb;
begin
  if auth.uid() is null then
    raise exception 'Sign in to view payment instructions.' using errcode = '42501';
  end if;
  select * into v_order from public.orders where id = p_order_id;
  if not found or (v_order.user_id <> auth.uid() and not public.is_super_admin()) then
    raise exception 'Order not found.' using errcode = '42501';
  end if;
  if v_order.payment_status = 'pending'
    and v_order.fulfillment_status <> 'cancelled'
    and (v_order.payment_due_at is null or v_order.payment_due_at > timezone('utc', now())) then
    v_config := public.get_manual_upi_payment_config();
  else
    v_config := jsonb_build_object('available', false);
  end if;
  return jsonb_build_object(
    'orderId', v_order.id, 'orderNumber', v_order.order_number,
    'amount', v_order.grand_total, 'currency', v_order.currency,
    'paymentStatus', v_order.payment_status,
    'fulfillmentStatus', v_order.fulfillment_status,
    'payment', v_config
  );
end;
$$;

create or replace function public.submit_manual_upi_reference(
  p_order_id uuid,
  p_transaction_reference text,
  p_note text default null
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_order public.orders%rowtype;
  v_reference text := nullif(trim(p_transaction_reference), '');
  v_note text := nullif(trim(p_note), '');
begin
  if auth.uid() is null then
    raise exception 'Sign in to submit a payment reference.' using errcode = '42501';
  end if;
  if v_reference is null or length(v_reference) not between 4 and 128 then
    raise exception 'Enter a valid transaction reference.';
  end if;
  if v_note is not null and length(v_note) > 500 then
    raise exception 'Payment note is too long.';
  end if;
  select * into v_order from public.orders where id = p_order_id and user_id = auth.uid() for update;
  if not found or v_order.payment_status <> 'pending' or v_order.fulfillment_status = 'cancelled'
    or (v_order.payment_due_at is not null and v_order.payment_due_at <= timezone('utc', now())) then
    raise exception 'This order cannot accept a payment reference.';
  end if;
  insert into public.order_payment_submissions (order_id, user_id, transaction_reference, note)
  values (p_order_id, auth.uid(), v_reference, v_note)
  on conflict (order_id, transaction_reference) do nothing;
  perform public.write_order_audit(p_order_id, auth.uid(), 'payment_reference_submitted', null, null,
    v_reference, jsonb_build_object('source', 'customer'));
end;
$$;

create or replace function public.admin_verify_manual_upi_payment(
  p_order_id uuid,
  p_received_amount numeric,
  p_received_currency text,
  p_transaction_reference text,
  p_confirmed_against_account boolean
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_order public.orders%rowtype;
  v_reference text := nullif(trim(p_transaction_reference), '');
  v_currency text := upper(trim(coalesce(p_received_currency, '')));
  v_now timestamptz := timezone('utc', now());
begin
  if auth.uid() is null or not public.is_super_admin() then
    raise exception 'Super Admin permission is required to verify payments.' using errcode = '42501';
  end if;
  if p_confirmed_against_account is not true then
    raise exception 'Confirm that the payment was checked against the receiving account.';
  end if;
  if p_received_amount is null or p_received_amount <= 0 or v_currency <> 'INR' then
    raise exception 'Enter a valid received INR amount.';
  end if;
  if v_reference is not null and length(v_reference) > 128 then
    raise exception 'Transaction reference is too long.';
  end if;
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then
    raise exception 'Order not found.';
  end if;
  if v_order.payment_status = 'paid' then
    if v_order.payment_received_amount = p_received_amount
      and v_order.payment_received_currency = v_currency
      and v_order.payment_transaction_reference is not distinct from v_reference then
      return;
    end if;
    raise exception 'This order is already verified with different payment details.';
  end if;
  if v_order.payment_status <> 'pending' or v_order.fulfillment_status = 'cancelled'
    or (v_order.payment_due_at is not null and v_order.payment_due_at <= v_now) then
    raise exception 'This order cannot be verified through the ordinary payment workflow.';
  end if;
  if p_received_amount <> v_order.grand_total or v_currency <> v_order.currency then
    raise exception 'Received amount or currency does not match the authoritative order total.';
  end if;
  perform public.set_order_workflow_context();
  update public.orders set payment_status = 'paid', payment_verified_at = v_now,
    payment_verified_by = auth.uid(), payment_transaction_reference = v_reference,
    payment_received_amount = p_received_amount, payment_received_currency = v_currency,
    tracking_summary = jsonb_build_object('summary', 'Payment verified. Your order will be processed shortly.')
  where id = p_order_id;
  insert into public.order_status_events (order_id, status, note_key, event_at, metadata)
  values (p_order_id, 'payment_verified', 'Manual UPI payment verified', v_now,
    jsonb_build_object('source', 'admin', 'provider', 'manual_upi'));
  perform public.write_order_audit(p_order_id, auth.uid(), 'payment_verified',
    jsonb_build_object('payment_status', v_order.payment_status),
    jsonb_build_object('payment_status', 'paid', 'received_amount', p_received_amount, 'currency', v_currency),
    v_reference, jsonb_build_object('provider', 'manual_upi'));
end;
$$;

create or replace function public.admin_update_order_fulfillment(
  p_order_id uuid,
  p_fulfillment_status public.fulfillment_status,
  p_tracking_summary jsonb default null
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_order public.orders%rowtype;
  v_now timestamptz := timezone('utc', now());
  v_legacy_status public.order_status;
begin
  if auth.uid() is null or not public.is_super_admin() then
    raise exception 'Super Admin permission is required to update fulfillment.' using errcode = '42501';
  end if;
  if p_tracking_summary is not null and jsonb_typeof(p_tracking_summary) <> 'object' then
    raise exception 'Tracking details must be a JSON object.';
  end if;
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then
    raise exception 'Order not found.';
  end if;
  if v_order.fulfillment_status = 'cancelled' and p_fulfillment_status <> 'cancelled'
    or v_order.fulfillment_status = 'delivered' and p_fulfillment_status <> 'delivered' then
    raise exception 'A cancelled or delivered order cannot be reopened.';
  end if;
  if p_fulfillment_status in ('processing', 'shipped', 'delivered') and v_order.payment_status <> 'paid' then
    raise exception 'Payment must be verified before fulfillment can begin.';
  end if;
  if p_fulfillment_status = 'processing' and v_order.fulfillment_status <> 'unfulfilled'
    or p_fulfillment_status = 'shipped' and v_order.fulfillment_status <> 'processing'
    or p_fulfillment_status = 'delivered' and v_order.fulfillment_status <> 'shipped' then
    raise exception 'The requested fulfillment transition is not permitted.';
  end if;
  if p_fulfillment_status = 'cancelled' then
    if v_order.fulfillment_status not in ('unfulfilled', 'processing') then
      raise exception 'This fulfillment state cannot be cancelled.';
    end if;
    if v_order.payment_status = 'paid' then
      raise exception 'Record and confirm the refund before cancelling a paid order.';
    end if;
  end if;
  v_legacy_status := case p_fulfillment_status
    when 'unfulfilled' then 'placed'::public.order_status
    when 'processing' then 'confirmed'::public.order_status
    when 'shipped' then 'in_transit'::public.order_status
    when 'delivered' then 'delivered'::public.order_status
    when 'cancelled' then 'cancelled'::public.order_status
  end;
  perform public.set_order_workflow_context();
  update public.orders set status = v_legacy_status, fulfillment_status = p_fulfillment_status,
    tracking_summary = coalesce(p_tracking_summary, tracking_summary),
    confirmed_at = case when p_fulfillment_status = 'processing' then coalesce(confirmed_at, v_now) else confirmed_at end,
    shipped_at = case when p_fulfillment_status = 'shipped' then coalesce(shipped_at, v_now) else shipped_at end,
    delivered_at = case when p_fulfillment_status = 'delivered' then coalesce(delivered_at, v_now) else delivered_at end,
    cancelled_at = case when p_fulfillment_status = 'cancelled' then coalesce(cancelled_at, v_now) else cancelled_at end
  where id = p_order_id;
  if p_fulfillment_status = 'cancelled' then
    perform public.restore_order_inventory(p_order_id, auth.uid());
  end if;
  if p_fulfillment_status <> v_order.fulfillment_status then
    insert into public.order_status_events (order_id, status, note_key, event_at, metadata)
    values (p_order_id, p_fulfillment_status::text, 'Fulfillment status updated to ' || replace(p_fulfillment_status::text, '_', ' '), v_now,
      jsonb_build_object('source', 'admin', 'previous_fulfillment_status', v_order.fulfillment_status));
    perform public.write_order_audit(p_order_id, auth.uid(), 'fulfillment_updated',
      jsonb_build_object('fulfillment_status', v_order.fulfillment_status),
      jsonb_build_object('fulfillment_status', p_fulfillment_status), null, '{}'::jsonb);
  end if;
end;
$$;

create or replace function public.admin_record_manual_refund(
  p_order_id uuid,
  p_refunded_amount numeric,
  p_currency text,
  p_transaction_reference text,
  p_confirmed_against_account boolean
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_order public.orders%rowtype;
  v_currency text := upper(trim(coalesce(p_currency, '')));
  v_reference text := nullif(trim(p_transaction_reference), '');
  v_now timestamptz := timezone('utc', now());
begin
  if auth.uid() is null or not public.is_super_admin() then
    raise exception 'Super Admin permission is required to record refunds.' using errcode = '42501';
  end if;
  if p_confirmed_against_account is not true then
    raise exception 'Confirm that the refund was verified in the payment account.';
  end if;
  if p_refunded_amount is null or p_refunded_amount <= 0 or v_currency <> 'INR' then
    raise exception 'Enter a valid refunded INR amount.';
  end if;
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then raise exception 'Order not found.'; end if;
  if v_order.payment_status = 'refunded' then
    if v_order.refunded_amount = p_refunded_amount and v_order.refund_transaction_reference is not distinct from v_reference then return; end if;
    raise exception 'This order already has a different confirmed refund record.';
  end if;
  if v_order.payment_status <> 'paid' or p_refunded_amount <> v_order.grand_total or v_currency <> v_order.currency then
    raise exception 'Only the full authoritative paid amount can be recorded by this manual refund workflow.';
  end if;
  perform public.set_order_workflow_context();
  update public.orders set payment_status = 'refunded', refund_status = 'confirmed', refunded_amount = p_refunded_amount,
    refund_transaction_reference = v_reference, refunded_at = v_now, refunded_by = auth.uid()
  where id = p_order_id;
  insert into public.order_status_events (order_id, status, note_key, event_at, metadata)
  values (p_order_id, 'refund_confirmed', 'Manual refund confirmed', v_now, jsonb_build_object('source', 'admin'));
  perform public.write_order_audit(p_order_id, auth.uid(), 'refund_confirmed',
    jsonb_build_object('payment_status', 'paid'), jsonb_build_object('payment_status', 'refunded', 'amount', p_refunded_amount),
    v_reference, jsonb_build_object('provider', 'manual_upi'));
end;
$$;

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
set search_path = public, pg_temp
as $$
declare
  v_order record;
begin
  -- The order number is non-guessable, and this requires a second matching
  -- customer detail or the high-entropy tracking code before disclosing status.
  select ord.id, ord.order_number, ord.public_tracking_code, ord.payment_status,
    ord.fulfillment_status, ord.updated_at, ord.tracking_summary
  into v_order
  from public.orders ord
  where ord.order_number = p_order_number
    and (
      (nullif(trim(p_tracking_code), '') is not null and ord.public_tracking_code = trim(p_tracking_code))
      or (nullif(trim(p_email), '') is not null and lower(ord.contact_email) = lower(trim(p_email)))
      or (nullif(trim(p_phone), '') is not null and ord.contact_phone = trim(p_phone))
    )
  limit 1;
  if v_order.id is null then
    raise exception 'Order not found or access denied';
  end if;
  return jsonb_build_object(
    'orderNumber', v_order.order_number,
    'order_number', v_order.order_number,
    'status', v_order.fulfillment_status,
    'fulfillmentStatus', v_order.fulfillment_status,
    'paymentStatus', v_order.payment_status,
    'updatedAt', v_order.updated_at,
    'updated_at', v_order.updated_at,
    'eta', v_order.tracking_summary ->> 'eta',
    'estimatedDelivery', v_order.tracking_summary ->> 'eta',
    'summary', v_order.tracking_summary ->> 'summary',
    'message', v_order.tracking_summary ->> 'summary',
    'events', coalesce((select jsonb_agg(jsonb_build_object(
      'title', coalesce(event.note_key, event.status), 'status', event.status,
      'note', event.note_key, 'note_key', event.note_key,
      'eventAt', event.event_at, 'event_at', event.event_at
    ) order by event.event_at asc) from public.order_status_events event where event.order_id = v_order.id), '[]'::jsonb),
    'timeline', coalesce((select jsonb_agg(jsonb_build_object(
      'title', coalesce(event.note_key, event.status), 'status', event.status,
      'note', event.note_key, 'note_key', event.note_key,
      'eventAt', event.event_at, 'event_at', event.event_at
    ) order by event.event_at asc) from public.order_status_events event where event.order_id = v_order.id), '[]'::jsonb)
  );
end;
$$;

-- Lock down client-table mutations. Customer and admin reads stay available through
-- RLS; all workflow writes above are security-definer functions with explicit checks.
alter table public.order_audit_events enable row level security;
alter table public.order_payment_submissions enable row level security;
alter table public.checkout_rate_limits enable row level security;
drop policy if exists "orders_update_admin" on public.orders;
drop policy if exists "orders_update_self_or_admin" on public.orders;
drop policy if exists "orders_insert_self_or_admin" on public.orders;
drop policy if exists "orders_delete_admin" on public.orders;
drop policy if exists "order_items_manage_admin" on public.order_items;
drop policy if exists "order_status_events_manage_admin" on public.order_status_events;
drop policy if exists "order_audit_events_admin_read" on public.order_audit_events;
create policy "order_audit_events_admin_read" on public.order_audit_events
for select to authenticated using (public.is_super_admin());
drop policy if exists "order_payment_submissions_select_owner_or_admin" on public.order_payment_submissions;
create policy "order_payment_submissions_select_owner_or_admin" on public.order_payment_submissions
for select to authenticated using (user_id = auth.uid() or public.is_super_admin());

drop function if exists public.admin_update_order(uuid, public.order_status, public.payment_status, jsonb);
revoke all on function public.write_order_audit(uuid, uuid, text, jsonb, jsonb, text, jsonb) from public, anon, authenticated;
revoke all on function public.set_order_workflow_context() from public, anon, authenticated;
revoke all on function public.restore_order_inventory(uuid, uuid) from public, anon, authenticated;
revoke all on function public.place_order(jsonb, jsonb, uuid) from public, anon;
revoke all on function public.cancel_order(uuid) from public, anon;
revoke all on function public.get_manual_upi_payment_config() from public, anon;
revoke all on function public.get_order_manual_payment_details(uuid) from public, anon;
revoke all on function public.submit_manual_upi_reference(uuid, text, text) from public, anon;
revoke all on function public.admin_verify_manual_upi_payment(uuid, numeric, text, text, boolean) from public, anon;
revoke all on function public.admin_update_order_fulfillment(uuid, public.fulfillment_status, jsonb) from public, anon;
revoke all on function public.admin_record_manual_refund(uuid, numeric, text, text, boolean) from public, anon;
revoke all on function public.expire_pending_manual_upi_orders(integer) from public, anon, authenticated;
grant execute on function public.place_order(jsonb, jsonb, uuid) to authenticated;
grant execute on function public.cancel_order(uuid) to authenticated;
grant execute on function public.get_manual_upi_payment_config() to authenticated;
grant execute on function public.get_order_manual_payment_details(uuid) to authenticated;
grant execute on function public.submit_manual_upi_reference(uuid, text, text) to authenticated;
grant execute on function public.admin_verify_manual_upi_payment(uuid, numeric, text, text, boolean) to authenticated;
grant execute on function public.admin_update_order_fulfillment(uuid, public.fulfillment_status, jsonb) to authenticated;
grant execute on function public.admin_record_manual_refund(uuid, numeric, text, text, boolean) to authenticated;
grant execute on function public.expire_pending_manual_upi_orders(integer) to service_role;
