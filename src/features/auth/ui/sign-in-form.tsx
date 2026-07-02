import { zodResolver } from '@hookform/resolvers/zod'
import { Mail, Lock } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { signInSchema, type SignInValues } from '@/features/auth/model/schemas'

export function SignInForm() {
  const form = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: 'hello@kumbhmelastore.in',
      password: '',
      rememberMe: true,
    },
  })

  const onSubmit = form.handleSubmit(() => {
    toast.success('Signed in successfully.')
  })

  return (
    <form onSubmit={onSubmit} className="space-y-6 p-6 sm:p-8">
      <div className="space-y-2">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground">
          Welcome back
        </h1>
        <p className="text-sm leading-6 text-muted-foreground">
          Sign in to access your orders, wishlist, and saved addresses.
        </p>
      </div>

      <Separator />

      <div className="space-y-2">
        <Label htmlFor="signin-email">Email</Label>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="signin-email"
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
        <Label htmlFor="signin-password">Password</Label>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="signin-password"
            type="password"
            className="pl-11"
            placeholder="Enter your password"
            {...form.register('password')}
          />
        </div>
        {form.formState.errors.password ? (
          <p className="text-xs text-error">
            {form.formState.errors.password.message}
          </p>
        ) : null}
      </div>

      <label className="flex items-center gap-3 text-sm text-muted-foreground">
        <input
          type="checkbox"
          className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
          {...form.register('rememberMe')}
        />
        Remember me for 30 days
      </label>

      <Button type="submit" className="w-full">
        Sign in
      </Button>
    </form>
  )
}
