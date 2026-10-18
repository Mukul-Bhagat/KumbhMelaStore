import { ArrowUpRight, Globe, Mail } from 'lucide-react'
import { Link } from 'react-router-dom'

import { BrandMark } from '@/components/brand/brand-mark'
import { Button } from '@/components/ui/button'
import { useSiteShell, useTranslate } from '@/shared/cms/hooks'
import type { CmsFooterSection } from '@/shared/cms/types'
import { routes } from '@/shared/config/routes'
import { site } from '@/shared/config/site'
import { resolveLocalizedHref } from '@/shared/lib/navigation'
import { LanguageToggleButton } from './language-toggle'

export function SiteFooter() {
  const { t, locale } = useTranslate()
  const shell = useSiteShell()
  const isHindi = locale === 'hi'

  const brandName = shell.data ? t(shell.data.brand.nameKey, site.name) : site.name
  const description = shell.data
    ? t(shell.data.brand.descriptionKey, site.description)
    : site.description
  const supportEmail = shell.data?.brand.supportEmail ?? site.supportEmail
  const url = shell.data?.brand.url ?? site.url
  const socialLinks = [
    { label: 'Email', href: `mailto:${supportEmail}`, icon: Mail },
    { label: 'Website', href: url, icon: Globe },
  ]
  const footerSections: CmsFooterSection[] = shell.data?.footer.sections.length
    ? shell.data.footer.sections
    : [
        {
          id: 'store-links',
          sectionKey: 'store',
          titleKey: 'footer.store',
          sortOrder: 1,
          links: [
            { id: 'about', labelKey: 'nav.about', href: routes.about, routeType: 'internal', sortOrder: 1 },
            { id: 'collections', labelKey: 'nav.collections', href: routes.collections, routeType: 'internal', sortOrder: 2 },
            { id: 'products', labelKey: 'nav.products', href: routes.products, routeType: 'internal', sortOrder: 3 },
            { id: 'blog', labelKey: 'nav.blog', href: routes.blog, routeType: 'internal', sortOrder: 4 },
          ],
        },
        {
          id: 'help-links',
          sectionKey: 'help',
          titleKey: 'footer.help',
          sortOrder: 2,
          links: [
            { id: 'contact', labelKey: 'nav.contact', href: routes.contact, routeType: 'internal', sortOrder: 1 },
            { id: 'faq', labelKey: 'nav.faq', href: routes.faq, routeType: 'internal', sortOrder: 2 },
            { id: 'track-order', labelKey: 'nav.track_order', href: routes.trackOrder, routeType: 'internal', sortOrder: 3 },
            { id: 'my-account', labelKey: 'nav.account', href: routes.account, routeType: 'internal', sortOrder: 4 },
          ],
        },
        {
          id: 'policies-links',
          sectionKey: 'policies',
          titleKey: 'footer.policies',
          sortOrder: 3,
          links: [
            { id: 'privacy', labelKey: 'footer.privacy', href: routes.privacyPolicy, routeType: 'internal', sortOrder: 1 },
            { id: 'terms', labelKey: 'footer.terms', href: routes.terms, routeType: 'internal', sortOrder: 2 },
            { id: 'shipping', labelKey: 'footer.shipping', href: routes.shippingPolicy, routeType: 'internal', sortOrder: 3 },
            { id: 'refund', labelKey: 'footer.refund', href: routes.refundPolicy, routeType: 'internal', sortOrder: 4 },
            { id: 'cancellation', labelKey: 'footer.cancellation', href: routes.cancellationPolicy, routeType: 'internal', sortOrder: 5 },
          ],
        },
      ]

  return (
    <footer className="relative mt-8 overflow-hidden border-t border-[#d7b670]/90 text-[#2a211a]">
      <div className="absolute inset-0">
        <div
          className="absolute inset-0 bg-cover bg-[position:58%_center] bg-no-repeat sm:bg-center"
          style={{ backgroundImage: `url('${site.footerBackgroundUrl}')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#f8efd9]/72 via-[#f7e9cc]/50 to-[#f6e5c3]/70" />
      </div>

      <div className="relative mx-auto w-full max-w-[1600px] px-4 py-10 sm:px-6 sm:py-12 lg:px-10 lg:py-14">
        <div className="grid gap-x-8 gap-y-10 xl:grid-cols-[1.25fr_0.8fr_0.8fr_0.8fr_0.9fr]">
          <div className="space-y-4 xl:pr-6">
            <BrandMark linked size="md" className="inline-flex" />
            <p className="max-w-lg text-sm leading-7 text-[#34241a] sm:text-base">
              {description}
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild className="border-[#6d4524] bg-[#6d4524] text-[#fff7e7] hover:border-[#4d2e19] hover:bg-[#4d2e19]">
                <Link to={routes.collections}>
                  {t('footer.explore_collections', isHindi ? 'संग्रह देखें' : 'Explore Collections')}
                </Link>
              </Button>
              <Button asChild variant="outline" className="border-[#8d6236] bg-[#fff7e7]/85 text-[#2a211a] hover:border-[#6d4524] hover:bg-[#fff1d7]">
                <Link to={routes.contact}>
                  {t('footer.talk_to_us', isHindi ? 'हमसे संपर्क करें' : 'Talk to us')}
                </Link>
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              {socialLinks.map(({ label, href, icon: Icon }) => (
                <a
                  key={label}
                  href={href}
                  target={href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('tel:') ? '_blank' : undefined}
                  rel={href.startsWith('http') ? 'noreferrer' : undefined}
                  className="inline-flex items-center gap-2 rounded-full border border-[#a87840] bg-[#fff7e7]/82 px-3 py-2 text-[11px] font-medium text-[#2f261f] shadow-sm transition-[background-color,border-color,box-shadow,transform] duration-200 hover:-translate-y-px hover:border-[#6d4524] hover:bg-[#fff1d7] hover:shadow-[var(--shadow-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6d4524] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f7e9cc] active:translate-y-px"
                  aria-label={label}
                >
                  <Icon className="h-3.5 w-3.5 text-[#7b5731]" />
                  <span>{label}</span>
                </a>
              ))}
            </div>
          </div>

          {footerSections.map((section) => (
            <div key={section.sectionKey} className="space-y-3">
              <div className="flex items-center gap-3">
                <h3 className="text-[0.8rem] font-semibold uppercase tracking-[0.18em] text-[#3e2618]">
                  {t(
                    section.titleKey,
                    isHindi
                      ? section.sectionKey === 'help'
                        ? 'सहायता'
                        : section.sectionKey === 'policies'
                          ? 'नीतियाँ'
                          : 'स्टोर'
                      : section.sectionKey === 'help'
                        ? 'Help & Support'
                        : section.sectionKey === 'policies'
                          ? 'Policies'
                          : 'Shop',
                  )}
                </h3>
                <span className="h-px flex-1 bg-[#a87840]/80" />
              </div>

              <ul className="space-y-2.5 text-sm text-[#34241a]">
                {section.links.map((link) => {
                  const external =
                    link.href.startsWith('http://') ||
                    link.href.startsWith('https://') ||
                    link.href.startsWith('mailto:') ||
                    link.href.startsWith('tel:')

                  return (
                    <li key={link.href}>
                      {external ? (
                        <a
                          href={link.href}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 rounded-sm transition-[color,transform] duration-200 hover:translate-x-0.5 hover:text-[#6d4524] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6d4524]"
                        >
                          <ArrowUpRight className="h-3.5 w-3.5 text-[#b88942]" />
                          <span>{t(link.labelKey, footerLabelFallback(link.labelKey, locale))}</span>
                        </a>
                      ) : (
                        <Link
                          to={resolveLocalizedHref(link.href, locale)}
                          className="inline-flex items-center gap-2 rounded-sm transition-[color,transform] duration-200 hover:translate-x-0.5 hover:text-[#6d4524] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6d4524]"
                        >
                          <ArrowUpRight className="h-3.5 w-3.5 text-[#b88942]" />
                          <span>{t(link.labelKey, footerLabelFallback(link.labelKey, locale))}</span>
                        </Link>
                      )}
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}

          <div className="space-y-3 xl:pl-2">
            <div className="flex items-center gap-3">
              <h3 className="text-[0.8rem] font-semibold uppercase tracking-[0.18em] text-[#3e2618]">
                {t('footer.contact', isHindi ? 'संपर्क' : 'Get in touch')}
              </h3>
              <span className="h-px flex-1 bg-[#a87840]/80" />
            </div>
            <div className="space-y-3 text-sm text-[#34241a]">
              <a href={url} className="flex items-center gap-3 rounded-sm transition-[color,transform] duration-200 hover:translate-x-0.5 hover:text-[#6d4524] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6d4524]" target="_blank" rel="noreferrer">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[#a87840] bg-[#fff7e7]/82">
                  <Globe className="h-3.5 w-3.5 text-[#7b5731]" />
                </span>
                <span>{url}</span>
              </a>
              <a href={`mailto:${supportEmail}`} className="flex items-center gap-3 rounded-sm transition-[color,transform] duration-200 hover:translate-x-0.5 hover:text-[#6d4524] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6d4524]">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[#a87840] bg-[#fff7e7]/82">
                  <Mail className="h-3.5 w-3.5 text-[#7b5731]" />
                </span>
                <span>{supportEmail}</span>
              </a>
              <a href="tel:+918180891464" className="flex items-center gap-3 rounded-sm transition-[color,transform] duration-200 hover:translate-x-0.5 hover:text-[#6d4524] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6d4524]">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[#a87840] bg-[#fff7e7]/82">
                  <Mail className="h-3.5 w-3.5 text-[#7b5731]" />
                </span>
                <span>+91 81808 91464</span>
              </a>
            </div>
          </div>
        </div>

        <div className="relative mt-10 border-t border-[#a87840]/80 pt-5">
          <div className="flex flex-col gap-3 text-sm text-[#34241a] sm:flex-row sm:items-center sm:justify-between">
            <p>
              © {new Date().getFullYear()} {brandName}. {t('footer.rights', isHindi ? 'सर्वाधिकार सुरक्षित।' : 'All rights reserved.')}
            </p>
            <LanguageToggleButton />
          </div>
        </div>
      </div>
    </footer>
  )
}

function footerLabelFallback(key: string, locale: 'hi' | 'en') {
  const labels: Record<'hi' | 'en', Record<string, string>> = {
    en: {
      'nav.about': 'About',
      'nav.collections': 'Collections',
      'nav.products': 'Products',
      'nav.contact': 'Contact',
      'nav.faq': 'FAQ',
      'nav.track_order': 'Track order',
      'nav.blog': 'Blog',
      'nav.account': 'My account',
      'footer.privacy': 'Privacy policy',
      'footer.terms': 'Terms & Conditions',
      'footer.shipping': 'Shipping policy',
      'footer.refund': 'Refund policy',
      'footer.cancellation': 'Cancellation policy',
    },
    hi: {
      'nav.about': 'हमारे बारे में',
      'nav.collections': 'संग्रह',
      'nav.products': 'उत्पाद',
      'nav.contact': 'संपर्क',
      'nav.faq': 'अक्सर पूछे जाने वाले प्रश्न',
      'nav.track_order': 'ऑर्डर ट्रैक करें',
      'nav.blog': 'ब्लॉग',
      'nav.account': 'मेरा खाता',
      'footer.privacy': 'गोपनीयता नीति',
      'footer.terms': 'नियम और शर्तें',
      'footer.shipping': 'शिपिंग नीति',
      'footer.refund': 'रिफंड नीति',
      'footer.cancellation': 'रद्दीकरण नीति',
    },
  }

  return labels[locale][key] ?? key
}
