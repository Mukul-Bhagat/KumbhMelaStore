import { z } from 'zod'

export const profileSchema = z.object({
  fullName: z.string().min(2, 'Enter your full name.'),
  email: z.string().email('Enter a valid email address.'),
  phone: z.string().min(8, 'Enter a valid phone number.'),
  location: z.string().min(2, 'Enter your city or state.'),
  preferredCurrency: z.enum(['INR', 'USD']),
  newsletterOptIn: z.boolean().optional(),
})

export type ProfileValues = z.infer<typeof profileSchema>
