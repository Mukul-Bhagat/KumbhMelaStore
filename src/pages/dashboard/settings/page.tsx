import { Reveal } from '@/components/layout/reveal'
import { Seo } from '@/components/layout/seo'
import { SectionHeading } from '@/components/layout/section-heading'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Select } from '@/components/ui/select'
import { useUiStore } from '@/shared/stores/ui-store'

export function Component() {
  const theme = useUiStore((state) => state.theme)
  const currency = useUiStore((state) => state.currency)
  const setTheme = useUiStore((state) => state.setTheme)
  const setCurrency = useUiStore((state) => state.setCurrency)

  return (
    <div className="space-y-16">
      <Seo title="Settings" description="Adjust your KumbhMelaStore preferences." />

      <Reveal>
        <SectionHeading
          eyebrow="Settings"
          title="Personalize the experience without losing the calm aesthetic."
          description="State that affects the interface, such as theme and currency, is persisted in Zustand for future use across the app."
        />
      </Reveal>

      <section className="grid gap-6 lg:grid-cols-2">
        <Reveal>
          <Card className="shadow-[var(--shadow-soft)]">
            <CardContent className="space-y-4 p-6">
              <Badge variant="premium">Theme</Badge>
              <p className="text-sm leading-6 text-muted-foreground">
                Current theme: <span className="font-medium text-foreground">{theme}</span>
              </p>
              <div className="flex flex-wrap gap-3">
                <Button variant="outline" onClick={() => setTheme('light')}>
                  Light
                </Button>
                <Button variant="outline" onClick={() => setTheme('dark')}>
                  Dark
                </Button>
                <Button variant="outline" onClick={() => setTheme('system')}>
                  System
                </Button>
              </div>
            </CardContent>
          </Card>
        </Reveal>

        <Reveal delay={0.08}>
          <Card className="shadow-[var(--shadow-soft)]">
            <CardContent className="space-y-4 p-6">
              <Badge variant="premium">Currency</Badge>
              <p className="text-sm leading-6 text-muted-foreground">
                Current currency: <span className="font-medium text-foreground">{currency}</span>
              </p>
              <Select value={currency} onChange={(event) => setCurrency(event.target.value)}>
                <option value="INR">INR - Indian Rupee</option>
                <option value="USD">USD - US Dollar</option>
              </Select>
            </CardContent>
          </Card>
        </Reveal>
      </section>
    </div>
  )
}
