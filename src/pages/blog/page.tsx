import { Link } from 'react-router-dom'

import { Reveal } from '@/components/layout/reveal'
import { Seo } from '@/components/layout/seo'
import { SectionHeading } from '@/components/layout/section-heading'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { blogPosts } from '@/shared/data/site-content'
import { routes } from '@/shared/config/routes'

export function Component() {
  return (
    <div className="space-y-16">
      <Seo title="Blog" description="Editorial notes from the KumbhMelaStore studio." />

      <Reveal>
        <section className="space-y-5">
          <Badge variant="premium">Journal</Badge>
          <div className="space-y-4">
            <h1 className="font-display text-5xl font-semibold tracking-tight sm:text-6xl">
              Editorial notes on ritual, materials, and gifting.
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
              The journal gives the brand space to educate, inspire, and support future
              SEO without breaking the calm visual language.
            </p>
          </div>
        </section>
      </Reveal>

      <Reveal>
        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Card className="shadow-[var(--shadow-elevated)]">
            <CardContent className="space-y-4 p-6 sm:p-8">
              <Badge variant="premium">Featured article</Badge>
              <h2 className="font-display text-4xl font-semibold tracking-tight">
                Designing a sacred corner at home
              </h2>
              <p className="max-w-2xl text-sm leading-7 text-muted-foreground">
                How to bring calm, balance, and subtle ritual into a modern living space
                without visual clutter.
              </p>
              <Button asChild>
                <Link to={routes.contact}>Ask the studio</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-[var(--shadow-soft)]">
            <CardContent className="space-y-4 p-6">
              <h3 className="font-display text-3xl font-semibold tracking-tight">
                What we write about
              </h3>
              <ul className="space-y-3 text-sm leading-6 text-muted-foreground">
                <li>Ritual setup guides and material stories</li>
                <li>Festival gifting and premium wrapping tips</li>
                <li>Space planning for home sanctums</li>
              </ul>
            </CardContent>
          </Card>
        </section>
      </Reveal>

      <Reveal>
        <section className="space-y-8">
          <SectionHeading
            eyebrow="Latest posts"
            title="Small editorial drops with premium visual breathing room."
            description="The blog card system can later expand into CMS-fed content without changing the surface structure."
          />
          <div className="grid gap-6 md:grid-cols-3">
            {blogPosts.map((post) => (
              <Card key={post.title} className="shadow-[var(--shadow-soft)]">
                <CardContent className="space-y-4 p-6">
                  <Badge variant="outline">{post.readTime}</Badge>
                  <h3 className="font-display text-2xl font-semibold tracking-tight">
                    {post.title}
                  </h3>
                  <p className="text-sm leading-6 text-muted-foreground">{post.excerpt}</p>
                  <Button asChild variant="ghost" className="px-0">
                    <Link to={routes.blog}>Read article</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </Reveal>
    </div>
  )
}
