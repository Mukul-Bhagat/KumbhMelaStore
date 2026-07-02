import { zodResolver } from '@hookform/resolvers/zod'
import { Mail, Lock, Phone, User } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { signUpSchema, type SignUpValues } from '@/features/auth/model/schemas'

export function SignUpForm() {
  const form = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      fullName: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
    },
  })

  const onSubmit = form.handleSubmit(() => {
    toast.success('Account created successfully.')
  })

  return (
    <form onSubmit={onSubmit} className="space-y-6 p-6 sm:p-8">
      <div className="space-y-2">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground">
          Create your account
        </h1>
        <p className="text-sm leading-6 text-muted-foreground">
          Join for faster checkout, order tracking, and premium gifting support.
        </p>
      </div>

      <Separator />

      <div className="space-y-2">
        <Label htmlFor="signup-name">Full name</Label>
        <div className="relative">
          <User className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="signup-name"
            className="pl-11"
            placeholder="Mukul Sharma"
            {...form.register('fullName')}
          />
        </div>
        {form.formState.errors.fullName ? (
          <p className="text-xs text-error">
            {form.formState.errors.fullName.message}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="signup-email">Email</Label>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="signup-email"
            type="email"
            className="pl-11"
            placeholder="name@example.com"
            {...form.register('email')}
          />
        </div>
        {form.formState.errors.email ? (
          <p className="text-xs text-error">{form.formState.errors.email.message}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="signup-phone">Phone</Label>
        <div className="relative">
          <Phone className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="signup-phone"
            type="tel"
            className="pl-11"
            placeholder="+91 98765 43210"
            {...form.register('phone')}
          />
        </div>
        {form.formState.errors.phone ? (
          <p className="text-xs text-error">{form.formState.errors.phone.message}</p>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="signup-password">Password</Label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="signup-password"
              type="password"
              className="pl-11"
              {...form.register('password')}
            />
          </div>
          {form.formState.errors.password ? (
            <p className="text-xs text-error">
              {form.formState.errors.password.message}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="signup-confirm">Confirm password</Label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="signup-confirm"
              type="password"
              className="pl-11"
              {...form.register('confirmPassword')}
            />
          </div>
          {form.formState.errors.confirmPassword ? (
            <p className="text-xs text-error">
              {form.formState.errors.confirmPassword.message}
            </p>
          ) : null}
        </div>
      </div>

      <Button type="submit" className="w-full">
        Create account
      </Button>
    </form>
  )
}
