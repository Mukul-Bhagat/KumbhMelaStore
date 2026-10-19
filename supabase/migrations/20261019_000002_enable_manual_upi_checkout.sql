-- Explicitly enabled by the store owner after confirming the configured
-- UPI destination and QR image. The checkout RPC still rejects malformed or
-- incomplete configuration, so this does not bypass payment validation.
update public.site_settings
set setting_value = jsonb_set(coalesce(setting_value, '{}'::jsonb), '{enabled}', 'true'::jsonb, true),
  is_public = false
where setting_key = 'payments.manual_upi';
