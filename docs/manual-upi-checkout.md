# Manual UPI checkout and order workflow

## Overview

Manual UPI is the only customer-facing payment method. Checkout creates an
order with payment status 'pending' and fulfilment status 'unfulfilled'. No
customer action, screenshot, or submitted UTR can mark an order paid.

The database is the authority for products, variants, active state, inventory,
unit price, totals, currency, address validation, duplicate submission, and
state transitions. Prices and totals sent by the browser are ignored.

Inventory is deducted when an order is created and restored on cancellation or
pending-payment expiry. All movements are transactional and recorded in
'inventory_movements'; stock is released at most once.

## State transitions

Payment transitions:

- pending → paid: only 'admin_verify_manual_upi_payment', after a Super Admin
  confirms actual receipt of the exact INR amount.
- paid → refunded: only 'admin_record_manual_refund', after the actual full
  refund is confirmed.
- A normal workflow never moves paid back to pending or failed.

Fulfilment transitions:

- unfulfilled → processing → shipped → delivered
- unfulfilled or processing → cancelled
- Processing, shipment, and delivery require verified payment. A cancelled or
  delivered order cannot be reopened by normal operations.

'orders.status' remains only for existing screen/data compatibility.
'orders.fulfillment_status' is the authoritative fulfilment field.

## Apply safely

1. Back up the approved target database and test in a Supabase staging project.
2. Apply migrations in timestamp order, including
   'supabase/migrations/20261019_000001_manual_upi_order_security.sql'. Do not
   run a database reset against production.
3. Confirm existing orders were backfilled with a fulfilment status.
4. Configure payment details while the feature is disabled.
5. Run the staging checklist below with test products and a test customer.
6. Enable manual UPI only after the merchant has checked both receiving UPI ID
   and QR destination.

The migration locks direct browser table writes to order state. It replaces the
former generic admin order update RPC with narrowly scoped payment,
fulfilment, refund, cancellation, expiry, and audit functions.

## Configure the receiving UPI destination

As a Super Admin, add or edit the private 'site_settings' row with key
'payments.manual_upi'. Leave 'is_public' set to false. Use this JSON shape:

    {
      "mode": "manual_upi",
      "enabled": false,
      "merchant_name": "Approved merchant display name",
      "upi_id": "merchant@bank",
      "qr_image_url": "https://approved-controlled-cdn.example/merchant-upi-qr.png",
      "pending_payment_minutes": 30,
      "instructions": "Please pay the exact amount shown for this order. Your order will be confirmed after we verify receipt of the payment. Do not pay again if your transaction is still processing. Contact support if you need assistance.",
      "support_contact": "hello@example.com"
    }

The QR URL must be HTTPS and the UPI ID must be a valid receiving ID. Do not
enable this setting or upload a QR image until its destination and intended
commercial use are independently confirmed. The UPI ID and QR are payment
destinations, not secrets. They are exposed only to authenticated customers
viewing current payment instructions for an eligible order.

After independent verification, set 'enabled' to true. Checkout safely stays
unavailable when configuration is missing or invalid.

## Pending-payment expiry

Set 'pending_payment_minutes' from 5 to 1440; the default is 30. Schedule this
command every five minutes with a trusted Supabase scheduler, CI worker, or
another server-only operator:

    select public.expire_pending_manual_upi_orders(100);

Run it with the Supabase service role or a trusted database scheduler. Never
put a service-role credential in Vite environment variables or the browser.
The function cancels only overdue, pending, unfulfilled manual-UPI orders and
releases their stock once. Paid orders are never automatically expired.

## Admin operating procedure

1. Open **Admin → Orders**, normally filtered to payment 'pending'.
2. Inspect the order total and any submitted UTR/reference. It is evidence for
   review, not proof.
3. Check the actual merchant UPI/bank receiving account outside the storefront.
   Never request or enter UPI PINs, passwords, or OTPs in the admin screen.
4. Choose **Verify exact payment**, enter the received amount and reference
   when available, then check the confirmation box. The server rejects amount
   and currency mismatches and an improperly reused recorded reference.
5. Use **Update fulfilment** only after verification. The server rejects
   processing, shipment, and delivery while payment is pending.
6. For a paid cancelled order, make the actual refund first, then use
   **Record full refund** with the confirmed refund reference.

Every creation, customer reference submission, verification, expiry,
cancellation, fulfilment change, and confirmed refund is retained in
'order_audit_events'.

## Security and RLS

- Customer reads remain scoped to their own order/item/status-event rows; Super
  Admin access uses the existing 'is_super_admin()' authorization.
- Direct client update/insert/delete policies for order state and order items
  are removed. Workflow changes occur only through security-definer functions
  that set a local workflow context and check the authenticated actor.
- Audit events have no client mutation policy and are readable only by Super
  Admins.
- Submitted transaction references are visible only to their owner or Super
  Admins. Receipt upload is deliberately not implemented: no private storage
  bucket existed for it, and a reference does not confirm payment.
- Order creation requires a UUID idempotency key. It is unique per customer,
  its request fingerprint must match on retry, and a database advisory lock
  protects concurrent submission.
- A database-backed per-user hourly checkout limit exists. Add an edge/API
  rate limit if guest checkout or public payment endpoints are introduced.

## Staging checklist

- Disabled payment configuration must block checkout.
- An enabled INR order starts pending/unfulfilled with the database total.
- Browser-side price, tax, shipping, or product-price tampering cannot change
  the stored total.
- Retrying a request ID creates one order/stock movement; reusing it with
  different cart/address details is rejected.
- Concurrent purchase of the final tracked item lets only one order succeed.
- Customer direct payment/fulfilment updates and UTR submission cannot mark
  payment paid.
- Incorrect amount/currency, missing account check, and duplicate transaction
  reference are rejected; exact payment verifies once.
- Shipment/delivery is blocked until verification; cancellation releases stock
  exactly once.
- Invoke expiry twice on an overdue unpaid order and confirm one cancellation
  and one stock release; a paid order remains.
- Review dashboard, tracking lookup, Admin filters, audit history, and RLS as
  customer, unrelated customer, and Super Admin.

## Future Razorpay checklist

Keep 'payment_provider' distinct ('manual_upi' vs 'razorpay'). Before enabling
Razorpay:

1. Create gateway orders server-side from the authoritative stored total.
2. Store gateway order/payment IDs in a dedicated payment-record table.
3. Verify checkout signatures and raw-body webhook signatures server-side.
4. Deduplicate webhooks with a durable unique event ID and reconcile delayed or
   out-of-order events.
5. Check gateway order ID, payment ID, amount, currency, and expected state
   before changing payment status.
6. Keep credentials server-only; add integration and reconciliation tests
   before switching provider.

## Current limitations and owner decisions

- This project has no server route layer or test framework. The trusted paths
  are Supabase RPCs and must be exercised against staging after migration; no
  production database was modified here.
- Orders require authentication because that is the existing checkout model.
  Guest checkout was not added.
- Receipt upload is not implemented by design. Add private storage, strict
  MIME/size validation, and scoped signed access before introducing it.
- Coupon, shipping, tax, and rewards retain their existing zero/default
  behaviour; no reward credit path was found, so none was added or changed.
- Owner-confirmation items remain in 'unresolvedBusinessDetails', including
  grievance officer details and support hours.
