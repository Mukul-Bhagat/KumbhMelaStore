import { z } from 'zod'

export const checkoutSchema = z.object({
  label: z.string().min(2, 'Enter an address label.'),
  recipientName: z.string().min(2, 'Enter the full name for delivery.'),
  phone: z.string().min(8, 'Enter a valid phone number.'),
  addressLine1: z.string().min(5, 'Enter a delivery address.'),
  addressLine2: z.string().optional(),
  city: z.string().min(2, 'Enter a city.'),
  state: z.string().min(2, 'Enter a state.'),
  postalCode: z.string().min(4, 'Enter a postal code.'),
  countryCode: z.string().length(2, 'Enter a country code.'),
  landmark: z.string().optional(),
})

export type CheckoutValues = z.infer<typeof checkoutSchema>
