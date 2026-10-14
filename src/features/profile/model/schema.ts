import { z } from 'zod'

export const profileSchema = z.object({
  fullName: z.string().min(2, 'Enter your full name.'),
  displayName: z.string().min(2, 'Enter a display name.'),
  email: z.string().email('Enter a valid email address.'),
  phone: z.string().min(8, 'Enter a valid phone number.'),
  locale: z.enum(['hi', 'en']),
  avatarUrl: z.string().url('Enter a valid image URL.').optional().or(z.literal('')),
})

export type ProfileValues = z.infer<typeof profileSchema>
