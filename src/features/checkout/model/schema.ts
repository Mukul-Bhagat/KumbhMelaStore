import { z } from 'zod'

const indianPhonePattern = /^(?:\+91|0091|91|0)?[6-9]\d{9}$/
const indianPostalCodePattern = /^[1-9]\d{5}$/

function normalizeIndianPhone(value: string) {
  return value.replace(/[\s()-]/g, '')
}

export const checkoutSchema = z.object({
  label: z.string().trim().min(2, 'Enter an address label.'),
  recipientName: z.string().trim().min(2, 'Enter the full name for delivery.'),
  phone: z.string().trim().refine(
    (value) => indianPhonePattern.test(normalizeIndianPhone(value)),
    'Enter a valid Indian mobile number.',
  ),
  addressLine1: z.string().trim().min(5, 'Enter a delivery address.'),
  addressLine2: z.string().trim().optional(),
  city: z.string().trim().min(2, 'Enter a city.'),
  state: z.string().trim().min(2, 'Enter a state.'),
  postalCode: z.string().trim().regex(indianPostalCodePattern, 'Enter a valid 6-digit Indian PIN code.'),
  countryCode: z.literal('IN', 'Delivery is currently available only in India.'),
  landmark: z.string().trim().optional(),
})

export type CheckoutValues = z.infer<typeof checkoutSchema>
