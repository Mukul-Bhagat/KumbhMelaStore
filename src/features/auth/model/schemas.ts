import { z } from 'zod'

export const signInSchema = z.object({
  email: z.string().email('Enter a valid email address.'),
  password: z.string().min(8, 'Password must be at least 8 characters.'),
  rememberMe: z.boolean().optional(),
})

export type SignInValues = z.infer<typeof signInSchema>

export const signUpSchema = z
  .object({
    fullName: z.string().min(2, 'Enter your full name.'),
    email: z.string().email('Enter a valid email address.'),
    phone: z.string().min(8, 'Enter a valid phone number.'),
    password: z.string().min(8, 'Password must be at least 8 characters.'),
    confirmPassword: z.string(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  })

export type SignUpValues = z.infer<typeof signUpSchema>
