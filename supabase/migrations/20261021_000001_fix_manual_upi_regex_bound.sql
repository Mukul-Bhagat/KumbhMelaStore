-- PostgreSQL accepts bounded repetitions up to 255. The prior local-part
-- bound of {2,256} raised SQLSTATE 2201B before configuration could be read.
-- This is forward-only: it does not alter settings, orders, or payment state.

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
    or v_upi_id !~ '^[A-Za-z0-9._-]{2,255}@[A-Za-z0-9._-]{2,64}$'
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

-- Reload the PostgREST routine definition after replacing the function body.
notify pgrst, 'reload schema';
