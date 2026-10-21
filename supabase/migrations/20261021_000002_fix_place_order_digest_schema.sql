-- Repair the pgcrypto schema lookup used by the checkout idempotency fingerprint.
-- This is forward-only: the existing place_order behavior is preserved verbatim
-- except for resolving digest through the installed extensions schema.

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
    extensions.digest(p_cart_items::text || '|' || p_shipping_address::text, 'sha256'::text),
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

revoke all on function public.place_order(jsonb, jsonb, uuid) from public, anon;
grant execute on function public.place_order(jsonb, jsonb, uuid) to authenticated;

notify pgrst, 'reload schema';
