import { z } from 'zod'

export const checkoutSchema = z.object({
  fullName: z.string().min(2, 'Enter the full name for delivery.'),
  email: z.string().email('Enter a valid email address.'),
  phone: z.string().min(8, 'Enter a valid phone number.'),
  addressLine1: z.string().min(5, 'Enter a delivery address.'),
  addressLine2: z.string().optional(),
  city: z.string().min(2, 'Enter a city.'),
  state: z.string().min(2, 'Enter a state.'),
  postalCode: z.string().min(4, 'Enter a postal code.'),
  paymentMethod: z.enum(['card', 'upi', 'cod']),
  notes: z.string().optional(),
})

export type CheckoutValues = z.infer<typeof checkoutSchema>
