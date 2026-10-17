import { z } from 'zod'

export const signInSchema = z.object({
  email: z.string().trim().email('Enter a valid email address.'),
  password: z.string().min(8, 'Password must be at least 8 characters.'),
  rememberMe: z.boolean().optional(),
})

export type SignInValues = z.infer<typeof signInSchema>

type SignUpValidationMessages = {
  fullName: string
  email: string
  phone: string
  password: string
  confirmPassword: string
}

export function createSignUpSchema(messages: SignUpValidationMessages) {
  return z
    .object({
      fullName: z.string().trim().min(2, messages.fullName),
      email: z.string().trim().email(messages.email),
      phone: z.string().regex(/^[6-9][0-9]{9}$/, messages.phone),
      password: z.string().min(8, messages.password),
      confirmPassword: z.string(),
    })
    .refine((values) => values.password === values.confirmPassword, {
      message: messages.confirmPassword,
      path: ['confirmPassword'],
    })
}

export type SignUpValues = z.infer<ReturnType<typeof createSignUpSchema>>
