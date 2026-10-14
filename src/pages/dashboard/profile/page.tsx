import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { SectionHeading } from '@/components/layout/section-heading'
import { Seo } from '@/components/layout/seo'
import { ProfileForm } from '@/features/profile/ui/profile-form'
import { useAuth } from '@/shared/auth/provider'
import { site } from '@/shared/config/site'
import { useTranslate } from '@/shared/cms/hooks'

export function Component() {
  const auth = useAuth()
  const { t } = useTranslate()
  const profile = auth.profile
  const displayName = profile?.displayName ?? profile?.fullName ?? auth.user?.email ?? site.name
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')

  return (
    <div className="space-y-8">
      <Seo
        title={t('dashboard.profile', 'Profile')}
        description={t('dashboard.profile_description', 'Manage your account profile and synced Supabase user data.')}
      />
      <SectionHeading
        eyebrow={t('dashboard.label', 'Dashboard')}
        title={t('dashboard.profile', 'Profile')}
        description={t('dashboard.profile_description', 'Keep your public account details, language preference, and avatar in sync with Supabase.')}
      />

      <Card className="shadow-[var(--shadow-soft)]">
        <CardContent className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Avatar
              src={profile?.avatarUrl ?? undefined}
              fallback={initials}
              alt={displayName}
              size="lg"
            />
            <div className="space-y-1">
              <p className="font-display text-2xl font-semibold tracking-tight">{displayName}</p>
              <p className="text-sm text-muted-foreground">{auth.user?.email}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {(profile?.roles ?? ['customer']).map((role) => (
              <Badge key={role} variant={role === 'super_admin' ? 'premium' : 'outline'}>
                {t(`roles.${role}`, role.replaceAll('_', ' '))}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <ProfileForm />
    </div>
  )
}
