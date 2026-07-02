import { Reveal } from '@/components/layout/reveal'
import { Seo } from '@/components/layout/seo'
import { SectionHeading } from '@/components/layout/section-heading'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { profile } from '@/shared/data/site-content'
import { ProfileForm } from '@/features/profile/ui/profile-form'

export function Component() {
  return (
    <div className="space-y-16">
      <Seo title="Profile" description="Manage your KumbhMelaStore profile." />

      <Reveal>
        <SectionHeading
          eyebrow="Profile"
          title="Personal details and delivery preferences."
          description="The profile screen uses the same form foundation as checkout so user data stays consistent."
        />
      </Reveal>

      <section className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
        <Reveal>
          <Card className="shadow-[var(--shadow-elevated)]">
            <CardContent className="p-6 sm:p-8">
              <ProfileForm />
            </CardContent>
          </Card>
        </Reveal>

        <Reveal delay={0.08}>
          <Card className="shadow-[var(--shadow-soft)]">
            <CardContent className="space-y-4 p-6">
              <Badge variant="premium">Account snapshot</Badge>
              <div className="space-y-2">
                <p className="font-display text-3xl font-semibold tracking-tight">
                  {profile.name}
                </p>
                <p className="text-sm text-muted-foreground">{profile.email}</p>
              </div>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>{profile.phone}</p>
                <p>{profile.location}</p>
                <p>Loyalty tier: {profile.tier}</p>
              </div>
            </CardContent>
          </Card>
        </Reveal>
      </section>
    </div>
  )
}
