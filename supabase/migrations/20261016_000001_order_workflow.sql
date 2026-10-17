alter table public.orders
  add column if not exists checkout_request_id uuid;

create unique index if not exists orders_user_checkout_request_unique
  on public.orders (user_id, checkout_request_id)
  where checkout_request_id is not null;

drop policy if exists "orders_insert_self_or_admin" on public.orders;
drop policy if exists "orders_update_self_or_admin" on public.orders;
drop policy if exists "orders_update_admin" on public.orders;

create policy "orders_update_admin"
on public.orders
for update
to authenticated
using (public.is_super_admin())
with check (public.is_super_admin());

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
  v_line jsonb;
  v_product_id uuid;
  v_quantity integer;
  v_line_total numeric(12, 2);
  v_subtotal numeric(12, 2) := 0;
  v_currency text;
  v_seen_product_ids uuid[] := array[]::uuid[];
  v_order_lines jsonb := '[]'::jsonb;
  v_product_name text;
  v_product_image text;
  v_line_count integer := 0;
  v_inserted_count integer;
  v_now timestamptz := timezone('utc', now());
  v_order_number text;
  v_tracking_code text;
begin
  if v_user_id is null then
    raise exception 'Sign in to place an order.' using errcode = '42501';
  end if;

  if p_checkout_request_id is null then
    raise exception 'A checkout request identifier is required.';
  end if;

  select *
  into v_existing_order
  from public.orders
  where user_id = v_user_id
    and checkout_request_id = p_checkout_request_id;

  if found then
    return query
      select v_existing_order.id, v_existing_order.order_number,
        v_existing_order.public_tracking_code, v_existing_order.grand_total,
        v_existing_order.currency;
    return;
  end if;

  if p_cart_items is null or jsonb_typeof(p_cart_items) is distinct from 'array' then
    raise exception 'Your cart must be a list of products.';
  end if;

  if jsonb_array_length(p_cart_items) = 0 or jsonb_array_length(p_cart_items) > 100 then
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

  select email
  into v_email
  from auth.users
  where id = v_user_id;

  if nullif(trim(v_email), '') is null then
    raise exception 'Your account needs an email address before checkout.';
  end if;

  select coalesce(profile.locale_code::text, 'en')
  into v_locale
  from (select 1) seed
  left join public.profiles profile on profile.id = v_user_id;

  for v_line in
    select value from jsonb_array_elements(p_cart_items) as cart(value)
  loop
    v_line_count := v_line_count + 1;

    if jsonb_typeof(v_line) <> 'object' then
      raise exception 'Each cart item must include a product and quantity.';
    end if;

    v_product_id := (v_line ->> 'productId')::uuid;
    v_quantity := (v_line ->> 'quantity')::integer;

    if v_product_id is null or v_quantity is null or v_quantity < 1 or v_quantity > 99 then
      raise exception 'Cart quantities must be between 1 and 99.';
    end if;

    if v_product_id = any(v_seen_product_ids) then
      raise exception 'Your cart contains a duplicate product.';
    end if;
    v_seen_product_ids := array_append(v_seen_product_ids, v_product_id);

    select *
    into v_product
    from public.products
    where id = v_product_id
      and is_active
      and stock_status = 'active'
    for share;

    if not found then
      raise exception 'A product in your cart is no longer available.';
    end if;

    if v_currency is not null and v_currency <> v_product.currency then
      raise exception 'All items in one order must use the same currency.';
    end if;
    v_currency := v_product.currency;
    v_line_total := round(v_product.base_price * v_quantity, 2);
    v_subtotal := v_subtotal + v_line_total;
    v_product_name := coalesce(
      v_product.metadata #>> array['name', v_locale],
      v_product.metadata #>> array['name', 'en'],
      v_product.metadata ->> 'name',
      v_product.slug
    );

    select media.secure_url
    into v_product_image
    from public.product_images image
    join public.media media on media.id = image.media_id
    where image.product_id = v_product.id
    order by image.is_primary desc, image.sort_order asc
    limit 1;

    v_order_lines := v_order_lines || jsonb_build_array(jsonb_build_object(
      'product_id', v_product.id,
      'quantity', v_quantity,
      'unit_price', v_product.base_price,
      'line_total', v_line_total,
      'currency', v_product.currency,
      'product_snapshot', jsonb_build_object(
        'name', v_product_name,
        'slug', v_product.slug,
        'sku', v_product.sku,
        'image_url', v_product_image
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
  select id
  into v_address_id
  from public.addresses
  where user_id = v_user_id and is_default
  order by updated_at desc
  limit 1
  for update;

  update public.addresses
  set is_default = false
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
    v_now, jsonb_build_object('summary', 'Order placed. Awaiting confirmation.')
  )
  on conflict (user_id, checkout_request_id)
    where checkout_request_id is not null
  do nothing
  returning * into v_order;

  if v_order.id is null then
    select *
    into v_order
    from public.orders
    where user_id = v_user_id
      and checkout_request_id = p_checkout_request_id;

    return query
      select v_order.id, v_order.order_number, v_order.public_tracking_code,
        v_order.grand_total, v_order.currency;
    return;
  end if;

  insert into public.order_items (
    order_id, product_id, product_snapshot, quantity, unit_price, line_total, currency
  )
  select
    v_order.id,
    (item ->> 'product_id')::uuid,
    item -> 'product_snapshot',
    (item ->> 'quantity')::integer,
    (item ->> 'unit_price')::numeric,
    (item ->> 'line_total')::numeric,
    item ->> 'currency'
  from jsonb_array_elements(v_order_lines) as lines(item);

  insert into public.order_status_events (order_id, status, note_key, event_at, metadata)
  values (
    v_order.id,
    'placed',
    'Order placed',
    v_now,
    jsonb_build_object('source', 'checkout')
  );

  return query
    select v_order.id, v_order.order_number, v_order.public_tracking_code,
      v_order.grand_total, v_order.currency;
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
  if not public.is_super_admin() then
    raise exception 'Super Admin permission is required to update orders.' using errcode = '42501';
  end if;

  select *
  into v_order
  from public.orders
  where id = p_order_id
  for update;

  if not found then
    raise exception 'Order not found.';
  end if;
  v_previous_status := v_order.status;

  update public.orders
  set status = p_status,
    payment_status = p_payment_status,
    tracking_summary = p_tracking_summary,
    confirmed_at = case when p_status = 'confirmed' then coalesce(confirmed_at, v_now) else confirmed_at end,
    shipped_at = case when p_status = 'in_transit' then coalesce(shipped_at, v_now) else shipped_at end,
    delivered_at = case when p_status = 'delivered' then coalesce(delivered_at, v_now) else delivered_at end,
    cancelled_at = case when p_status = 'cancelled' then coalesce(cancelled_at, v_now) else cancelled_at end
  where id = p_order_id;

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

revoke all on function public.place_order(jsonb, jsonb, uuid) from public, anon;
revoke all on function public.cancel_order(uuid) from public, anon;
revoke all on function public.admin_update_order(uuid, public.order_status, public.payment_status, jsonb) from public, anon;
grant execute on function public.place_order(jsonb, jsonb, uuid) to authenticated;
grant execute on function public.cancel_order(uuid) to authenticated;
grant execute on function public.admin_update_order(uuid, public.order_status, public.payment_status, jsonb) to authenticated;
