-- Repair the public RPC contract used by checkout without exposing site_settings.
-- This is intentionally forward-only: it preserves orders and only replaces the
-- zero-argument configuration reader with the approved authenticated contract.

create or replace function public.get_manual_upi_payment_config()
returns jsonb
language plpgsql
stable
security definer
set search_path = pg_catalog, public, pg_temp
as $$
declare
  v_config jsonb;
  v_upi_id text;
  v_qr_url text;
  v_merchant_name text;
  v_pending_minutes integer;
  v_instructions text;
  v_support_contact text;
begin
  if auth.uid() is null then
    raise exception 'Sign in to view payment instructions.' using errcode = '42501';
  end if;

  select setting_value
  into v_config
  from public.site_settings
  where setting_key = 'payments.manual_upi'
  limit 1;

  if v_config is null or jsonb_typeof(v_config) <> 'object' then
    return jsonb_build_object('available', false, 'reason', 'missing_configuration');
  end if;
  if lower(coalesce(v_config ->> 'enabled', 'false')) <> 'true'
    or v_config ->> 'mode' <> 'manual_upi' then
    return jsonb_build_object('available', false, 'reason', 'disabled');
  end if;

  v_upi_id := nullif(trim(v_config ->> 'upi_id'), '');
  v_qr_url := nullif(trim(v_config ->> 'qr_image_url'), '');
  v_merchant_name := nullif(trim(v_config ->> 'merchant_name'), '');
  v_instructions := nullif(trim(v_config ->> 'instructions'), '');
  v_support_contact := nullif(trim(v_config ->> 'support_contact'), '');

  if coalesce(v_config ->> 'pending_payment_minutes', '') ~ '^[0-9]+$' then
    v_pending_minutes := (v_config ->> 'pending_payment_minutes')::integer;
  end if;

  if v_upi_id is null
    or v_upi_id !~ '^[A-Za-z0-9._-]{2,256}@[A-Za-z0-9._-]{2,64}$'
    or v_qr_url is null
    or v_qr_url !~ '^https://[^[:space:]]+$'
    or v_merchant_name is null
    or v_pending_minutes is null
    or v_pending_minutes not between 5 and 1440 then
    return jsonb_build_object('available', false, 'reason', 'invalid_configuration');
  end if;

  return jsonb_build_object(
    'available', true,
    'mode', 'manual_upi',
    'merchantName', v_merchant_name,
    'upiId', v_upi_id,
    'qrImageUrl', v_qr_url,
    'pendingPaymentMinutes', v_pending_minutes,
    'instructions', coalesce(v_instructions, 'Pay the exact order amount shown. Your order remains pending until payment is verified.'),
    'supportContact', v_support_contact
  );
end;
$$;

revoke all on function public.get_manual_upi_payment_config() from public, anon;
grant execute on function public.get_manual_upi_payment_config() to authenticated;

-- A quote lets the customer see the server-calculated INR amount before paying.
-- It is read-only and intentionally revalidated by place_order, which remains
-- the only operation that creates an order or changes inventory.
create or replace function public.get_manual_upi_checkout_quote(p_cart_items jsonb)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, pg_temp
as $$
declare
  v_config jsonb;
  v_line jsonb;
  v_product public.products%rowtype;
  v_variant public.product_variants%rowtype;
  v_product_id uuid;
  v_variant_id uuid;
  v_quantity integer;
  v_unit_price numeric(12, 2);
  v_total numeric(12, 2) := 0;
  v_currency text;
  v_seen_lines text[] := array[]::text[];
  v_line_key text;
begin
  if auth.uid() is null then
    raise exception 'Sign in to check the payment total.' using errcode = '42501';
  end if;
  if p_cart_items is null or jsonb_typeof(p_cart_items) <> 'array'
    or jsonb_array_length(p_cart_items) not between 1 and 100 then
    raise exception 'Your cart must contain between 1 and 100 products.';
  end if;

  v_config := public.get_manual_upi_payment_config();
  if coalesce((v_config ->> 'available')::boolean, false) is not true then
    raise exception 'Manual UPI payment is currently unavailable. Please contact support.';
  end if;

  for v_line in select value from jsonb_array_elements(p_cart_items) as cart(value)
  loop
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
    v_line_key := v_product_id::text || ':' || coalesce(v_variant_id::text, '');
    if v_line_key = any(v_seen_lines) then
      raise exception 'Your cart contains a duplicate product option.';
    end if;
    v_seen_lines := array_append(v_seen_lines, v_line_key);

    select * into v_product
    from public.products
    where id = v_product_id and is_active and stock_status = 'active';
    if not found then
      raise exception 'A product in your cart is no longer available.';
    end if;

    v_unit_price := v_product.base_price;
    if v_variant_id is not null then
      select * into v_variant
      from public.product_variants
      where id = v_variant_id and product_id = v_product_id and is_active;
      if not found then
        raise exception 'A selected product option is no longer available.';
      end if;
      v_unit_price := v_variant.price;
      if v_variant.track_inventory and v_variant.inventory_quantity < v_quantity
        and not v_variant.continue_selling_when_out_of_stock then
        raise exception 'Insufficient stock for product option "%".', v_variant.title;
      end if;
    elsif exists (
      select 1 from public.product_variants variant
      where variant.product_id = v_product_id and variant.is_active
    ) then
      raise exception 'Choose an available option for each product with variants.';
    elsif v_product.track_inventory and v_product.inventory_quantity < v_quantity
      and not v_product.continue_selling_when_out_of_stock then
      raise exception 'Insufficient stock for this product.';
    end if;

    if v_currency is not null and v_currency <> v_product.currency then
      raise exception 'All items in one order must use the same currency.';
    end if;
    if v_product.currency <> 'INR' or v_unit_price < 0 then
      raise exception 'Manual UPI checkout is available only for valid INR orders.';
    end if;
    v_currency := v_product.currency;
    v_total := v_total + round(v_unit_price * v_quantity, 2);
  end loop;

  if v_currency is distinct from 'INR' or v_total <= 0 then
    raise exception 'Unable to calculate the payment total.';
  end if;

  return jsonb_build_object(
    'amount', v_total,
    'currency', v_currency,
    'payment', v_config
  );
end;
$$;

revoke all on function public.get_manual_upi_checkout_quote(jsonb) from public, anon;
grant execute on function public.get_manual_upi_checkout_quote(jsonb) to authenticated;

-- PostgREST caches routine signatures. Reload it so POST /rpc/get_manual_upi_payment_config
-- resolves the zero-argument function immediately after this migration is applied.
notify pgrst, 'reload schema';
