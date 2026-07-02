import { Mail, MapPinned, Phone, Send } from 'lucide-react'
import { toast } from 'sonner'

import { Reveal } from '@/components/layout/reveal'
import { Seo } from '@/components/layout/seo'
import { SectionHeading } from '@/components/layout/section-heading'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { site } from '@/shared/config/site'

export function Component() {
  return (
    <div className="space-y-16">
      <Seo title="Contact" description="Get in touch with the KumbhMelaStore studio." />

      <Reveal>
        <section className="space-y-5">
          <Badge variant="premium">Contact the studio</Badge>
          <div className="space-y-4">
            <h1 className="font-display text-5xl font-semibold tracking-tight sm:text-6xl">
              We’d love to hear about your gifting or ritual needs.
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
              Reach out for product guidance, bulk gifting, or support with an existing
              order. We respond with care and attention to detail.
            </p>
          </div>
        </section>
      </Reveal>

      <section className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
        <Reveal>
          <Card className="shadow-[var(--shadow-elevated)]">
            <CardContent className="space-y-6 p-6 sm:p-8">
              <SectionHeading
                eyebrow="Send a message"
                title="Tell us what you are looking for."
                description="Use this form for gifting support, product questions, or general store feedback."
              />
              <form
                className="space-y-5"
                onSubmit={(event) => {
                  event.preventDefault()
                  toast.success('Your message has been sent.')
                }}
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="contact-name">Name</Label>
                    <Input id="contact-name" placeholder="Mukul Sharma" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact-email">Email</Label>
                    <Input id="contact-email" type="email" placeholder="name@example.com" />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="contact-phone">Phone</Label>
                    <Input id="contact-phone" placeholder="+91 98765 43210" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact-subject">Subject</Label>
                    <Input id="contact-subject" placeholder="Bulk gifting" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contact-message">Message</Label>
                  <Textarea
                    id="contact-message"
                    rows={5}
                    placeholder="Tell us about your gifting request or ritual setup."
                  />
                </div>

                <Button type="submit">
                  <Send className="h-4 w-4" aria-hidden="true" />
                  Send inquiry
                </Button>
              </form>
            </CardContent>
          </Card>
        </Reveal>

        <Reveal delay={0.08}>
          <div className="space-y-6">
            <Card className="shadow-[var(--shadow-soft)]">
              <CardContent className="space-y-4 p-6">
                <Badge variant="premium">Studio details</Badge>
                <div className="space-y-3 text-sm leading-6 text-muted-foreground">
                  <p className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-primary" aria-hidden="true" />
                    {site.supportEmail}
                  </p>
                  <p className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-primary" aria-hidden="true" />
                    +91 98765 43210
                  </p>
                  <p className="flex items-center gap-2">
                    <MapPinned className="h-4 w-4 text-primary" aria-hidden="true" />
                    Jaipur, Rajasthan, India
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-[var(--shadow-soft)]">
              <CardContent className="space-y-4 p-6">
                <h2 className="font-display text-3xl font-semibold tracking-tight">
                  What we help with
                </h2>
                <ul className="space-y-3 text-sm leading-6 text-muted-foreground">
                  <li>Festival gifting and premium bulk orders</li>
                  <li>Product fit guidance for home sanctums</li>
                  <li>Order support and delivery tracking</li>
                  <li>Business and partnership inquiries</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </Reveal>
      </section>
    </div>
  )
}
