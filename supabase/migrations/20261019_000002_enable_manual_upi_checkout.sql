-- Explicitly enabled by the store owner after confirming the configured
-- UPI destination and QR image. Reapply the complete approved configuration
-- in case a prior placeholder row already existed before the checkout migration.
insert into public.site_settings (setting_key, setting_value, is_public, sort_order)
values (
  'payments.manual_upi',
  '{
    "mode": "manual_upi",
    "enabled": true,
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
on conflict (setting_key) do update
set setting_value = excluded.setting_value,
  is_public = false,
  sort_order = excluded.sort_order;
