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

const socialLinks = [
  { label: 'Email', href: `mailto:${site.supportEmail}`, icon: Mail },
  { label: 'Website', href: site.url, icon: Globe },
]

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
    <footer className="relative mt-8 overflow-hidden border-t border-[#d7b670]/80 bg-[#f6efe7] text-[#2a211a]">
      <div className="absolute inset-x-0 bottom-0 h-[210px]">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-90"
          style={{ backgroundImage: `url('${site.footerBackgroundUrl}')`, backgroundPosition: 'center bottom' }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#f6efe7]/85 via-[#f6efe7]/30 to-transparent" />
      </div>

      <div className="relative mx-auto w-full max-w-[1600px] px-4 pb-5 pt-8 sm:px-6 lg:px-10">
        <div className="grid gap-6 xl:grid-cols-[1.25fr_0.8fr_0.8fr_0.8fr_0.9fr]">
          <div className="space-y-4 xl:pr-6">
            <BrandMark linked size="md" className="inline-flex" />
            <p className="max-w-lg text-sm leading-7 text-[#3a2d26] sm:text-base">
              {description}
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild className="border border-[#d3ad5d] bg-[#d9b26f] text-[#1e1712] hover:bg-[#e1ba76]">
                <Link to={routes.collections}>
                  {t('footer.explore_collections', isHindi ? 'संग्रह देखें' : 'Explore Collections')}
                </Link>
              </Button>
              <Button asChild variant="outline" className="border border-[#d3ad5d] bg-[#f6efe7] text-[#2a211a] hover:bg-[#f3e6cc]">
                <Link to={routes.contact}>
                  {t('footer.contact_studio', isHindi ? 'हमसे संपर्क करें' : 'Get in touch')}
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
                  className="inline-flex items-center gap-2 rounded-full border border-[#d3ad5d] bg-[#f9f4ea] px-3 py-2 text-[11px] font-medium text-[#2f261f] transition-colors hover:bg-[#f1e0bb]"
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
                <h3 className="text-[0.8rem] font-medium uppercase tracking-[0.18em] text-[#472f1f]">
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
                <span className="h-px flex-1 bg-[#d3ad5d]/70" />
              </div>

              <ul className="space-y-2.5 text-sm text-[#3b2f2a]">
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
                          className="inline-flex items-center gap-2 transition-colors hover:text-[#4c3528]"
                        >
                          <ArrowUpRight className="h-3.5 w-3.5 text-[#b88942]" />
                          <span>{t(link.labelKey, footerLabelFallback(link.labelKey, locale))}</span>
                        </a>
                      ) : (
                        <Link
                          to={resolveLocalizedHref(link.href, locale)}
                          className="inline-flex items-center gap-2 transition-colors hover:text-[#4c3528]"
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
              <h3 className="text-[0.8rem] font-medium uppercase tracking-[0.18em] text-[#472f1f]">
                {t('footer.contact', isHindi ? 'संपर्क' : 'Get in touch')}
              </h3>
              <span className="h-px flex-1 bg-[#d3ad5d]/70" />
            </div>
            <div className="space-y-3 text-sm text-[#3b2f2a]">
              <a href={url} className="flex items-center gap-3 transition-colors hover:text-[#4c3528]" target="_blank" rel="noreferrer">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[#d3ad5d] bg-[#f9f4ea]">
                  <Globe className="h-3.5 w-3.5 text-[#7b5731]" />
                </span>
                <span>{url}</span>
              </a>
              <a href={`mailto:${supportEmail}`} className="flex items-center gap-3 transition-colors hover:text-[#4c3528]">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[#d3ad5d] bg-[#f9f4ea]">
                  <Mail className="h-3.5 w-3.5 text-[#7b5731]" />
                </span>
                <span>{supportEmail}</span>
              </a>
              <a href="tel:+918180891464" className="flex items-center gap-3 transition-colors hover:text-[#4c3528]">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[#d3ad5d] bg-[#f9f4ea]">
                  <Mail className="h-3.5 w-3.5 text-[#7b5731]" />
                </span>
                <span>+91 81808 91464</span>
              </a>
            </div>
          </div>
        </div>

        <div className="relative mt-6 border-t border-[#d3ad5d]/70 pt-4">
          <div className="flex flex-col gap-3 text-sm text-[#3b2f2a] sm:flex-row sm:items-center sm:justify-between">
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
