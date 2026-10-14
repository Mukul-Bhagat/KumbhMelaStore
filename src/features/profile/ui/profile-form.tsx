import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Mail, User } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'

import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { useAuth } from '@/shared/auth/provider'
import { useTranslate } from '@/shared/cms/hooks'
import { getSupabaseBrowserClient } from '@/shared/api/supabase'
import { profileSchema, type ProfileValues } from '@/features/profile/model/schema'

const defaultValues: ProfileValues = {
  fullName: '',
  displayName: '',
  email: '',
  phone: '',
  locale: 'hi',
  avatarUrl: '',
}

export function ProfileForm() {
  const auth = useAuth()
  const { t } = useTranslate()
  const supabase = getSupabaseBrowserClient()
  const [message, setMessage] = useState<string | null>(null)
  const [messageVariant, setMessageVariant] = useState<'success' | 'error'>('success')
  const form = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues,
  })

  useEffect(() => {
    form.reset({
      fullName: auth.profile?.fullName ?? '',
      displayName: auth.profile?.displayName ?? '',
      email: auth.user?.email ?? '',
      phone: auth.profile?.phone ?? '',
      locale: auth.profile?.localeCode ?? 'hi',
      avatarUrl: auth.profile?.avatarUrl ?? '',
    })
  }, [auth.profile, auth.user?.email, form])

  const onSubmit = form.handleSubmit(async (values) => {
    setMessage(null)

    try {
      if (!auth.user) {
        throw new Error(t('dashboard.profile_signed_in_required', 'You must be signed in to update your profile.'))
      }

      const payload = {
        id: auth.user.id,
        full_name: values.fullName,
        display_name: values.displayName,
        phone: values.phone,
        locale_code: values.locale,
        avatar_url: values.avatarUrl || null,
      }

      const { error: profileError } = await supabase.from('profiles').upsert(payload)
      if (profileError) {
        throw profileError
      }

      const { error: authError } = await supabase.auth.updateUser({
        email: values.email,
        data: {
          full_name: values.fullName,
          display_name: values.displayName,
          phone: values.phone,
          locale: values.locale,
          avatar_url: values.avatarUrl || null,
        },
      })
      if (authError) {
        throw authError
      }

      await auth.refresh()
      setMessageVariant('success')
      setMessage(t('dashboard.profile_saved_description', 'Profile saved and synced with Supabase Auth.'))
    } catch (error) {
      setMessageVariant('error')
      setMessage(error instanceof Error ? error.message : t('dashboard.profile_update_failed', 'Unable to save profile.'))
    }
  })

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {message ? (
        <Alert
          title={
            messageVariant === 'success'
              ? t('dashboard.profile_saved', 'Profile updated')
              : t('dashboard.profile_save_failed', 'Profile update failed')
          }
          description={message}
          variant={messageVariant === 'success' ? 'success' : 'error'}
        />
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="profile-name">{t('dashboard.full_name', 'Full name')}</Label>
          <div className="relative">
            <User className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input id="profile-name" className="pl-11" {...form.register('fullName')} />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="profile-display-name">{t('dashboard.display_name', 'Display name')}</Label>
          <Input id="profile-display-name" {...form.register('displayName')} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="profile-email">{t('dashboard.email', 'Email')}</Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input id="profile-email" type="email" className="pl-11" {...form.register('email')} />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="profile-phone">{t('dashboard.phone', 'Phone')}</Label>
          <Input id="profile-phone" type="tel" {...form.register('phone')} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="profile-locale">{t('dashboard.preferred_language', 'Preferred language')}</Label>
          <Select id="profile-locale" {...form.register('locale')}>
            <option value="hi">{t('dashboard.language.hi', 'Hindi')}</option>
            <option value="en">{t('dashboard.language.en', 'English')}</option>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="profile-avatar">{t('dashboard.avatar_url', 'Avatar URL')}</Label>
          <Input
            id="profile-avatar"
            type="url"
            placeholder="https://res.cloudinary.com/..."
            {...form.register('avatarUrl')}
          />
        </div>
      </div>

      <Button type="submit" className="w-full sm:w-auto" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? (
          <span className="inline-flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            {t('dashboard.saving', 'Saving')}
          </span>
        ) : (
          t('dashboard.save_changes', 'Save changes')
        )}
      </Button>
    </form>
  )
}
