import { Link } from 'react-router-dom'

import { BrandMark } from '@/components/brand/brand-mark'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { footerNavigation, site } from '@/shared/config/site'

export function SiteFooter() {
  return (
    <footer className="border-t border-border/70 bg-surface/60">
      <div className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.3fr_1fr]">
          <div className="space-y-6">
            <BrandMark size="md" />
            <p className="max-w-xl text-sm leading-7 text-muted-foreground">
              {site.description}
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild>
                <Link to="/collections">Explore collections</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/contact">Talk to us</Link>
              </Button>
            </div>
          </div>

          <div className="grid gap-8 sm:grid-cols-2">
            {footerNavigation.map((column) => (
              <div key={column.title} className="space-y-4">
                <h3 className="text-sm font-semibold uppercase tracking-[0.26em] text-foreground">
                  {column.title}
                </h3>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  {column.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        to={link.href}
                        className="transition-colors hover:text-foreground"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <Separator className="my-10" />

        <div className="flex flex-col gap-4 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} {site.name}. All rights reserved.</p>
          <p>{site.url}</p>
        </div>
      </div>
    </footer>
  )
}
