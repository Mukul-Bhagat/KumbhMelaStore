import { zodResolver } from '@hookform/resolvers/zod'
import { Mail, MapPinned, Phone, User } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import {
  profileSchema,
  type ProfileValues,
} from '@/features/profile/model/schema'

export function ProfileForm() {
  const form = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: 'Mukul Sharma',
      email: 'mukul@example.com',
      phone: '+91 98765 43210',
      location: 'Jaipur, India',
      preferredCurrency: 'INR',
      newsletterOptIn: true,
    },
  })

  const onSubmit = form.handleSubmit(() => {
    toast.success('Profile settings saved.')
  })

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="profile-name">Full name</Label>
          <div className="relative">
            <User className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="profile-name"
              className="pl-11"
              {...form.register('fullName')}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="profile-email">Email</Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="profile-email"
              type="email"
              className="pl-11"
              {...form.register('email')}
            />
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="profile-phone">Phone</Label>
          <div className="relative">
            <Phone className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="profile-phone"
              type="tel"
              className="pl-11"
              {...form.register('phone')}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="profile-location">Location</Label>
          <div className="relative">
            <MapPinned className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="profile-location"
              className="pl-11"
              {...form.register('location')}
            />
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="profile-currency">Preferred currency</Label>
          <Select id="profile-currency" {...form.register('preferredCurrency')}>
            <option value="INR">INR</option>
            <option value="USD">USD</option>
          </Select>
        </div>
        <label className="flex h-full items-center gap-3 rounded-[var(--radius-field)] border border-border bg-background px-4 py-3 text-sm text-muted-foreground">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
            {...form.register('newsletterOptIn')}
          />
          Keep me subscribed to editorial and gifting updates
        </label>
      </div>

      <Button type="submit" className="w-full sm:w-auto">
        Save changes
      </Button>
    </form>
  )
}
