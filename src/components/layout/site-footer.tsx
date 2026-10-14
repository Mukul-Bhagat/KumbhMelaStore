import { ArrowUpRight, Camera, Mail, MapPin, Phone, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'

import { BrandMark } from '@/components/brand/brand-mark'
import { Button } from '@/components/ui/button'
import { useSiteShell, useTranslate } from '@/shared/cms/hooks'
import type { CmsFooterSection } from '@/shared/cms/types'
import { routes } from '@/shared/config/routes'
import { site } from '@/shared/config/site'
import { resolveLocalizedHref } from '@/shared/lib/navigation'

const socialLinks = [
  { label: 'Instagram', href: 'https://instagram.com', icon: Camera },
  { label: 'Email', href: 'mailto:hello@kumbhmelastore.in', icon: Mail },
  { label: 'Contact', href: 'tel:+919999999999', icon: Phone },
]

export function SiteFooter() {
  const { t, locale } = useTranslate()
  const shell = useSiteShell()
  const isHindi = locale === 'hi'

  const brandName = shell.data ? t(shell.data.brand.nameKey, site.name) : site.name
  const brandDevanagari = shell.data
    ? t(shell.data.brand.devanagariKey, site.devanagari)
    : site.devanagari
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
            { id: 'privacy', labelKey: 'footer.privacy', href: routes.privacyPolicy, routeType: 'internal', sortOrder: 4 },
            { id: 'terms', labelKey: 'footer.terms', href: routes.terms, routeType: 'internal', sortOrder: 5 },
          ],
        },
      ]

  return (
    <footer className="relative mt-10 overflow-hidden border-t border-[#d9c08d]/30 bg-[#160f0b] text-[#f9f4ea]">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-60"
        style={{ backgroundImage: `url('${site.footerBackgroundUrl}')` }}
      />
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(23,16,12,0.72),rgba(32,22,15,0.82),rgba(20,14,10,0.92))]" />

      <div className="relative mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.35fr_1fr_0.8fr]">
          <div className="space-y-6">
            <BrandMark linked size="md" name={brandName} devanagari={brandDevanagari} />
            <p className="max-w-xl text-sm leading-7 text-[#f6ead7]/80">{description}</p>
            <div className="flex flex-wrap gap-3">
              <Button asChild className="border border-[#f2cf7c]/40 bg-[#d5a75e] text-[#1b120d] hover:bg-[#e7c77a]">
                <Link to={routes.collections}>
                  {t('footer.explore_collections', isHindi ? 'संग्रह देखें' : 'Explore collections')}
                </Link>
              </Button>
              <Button asChild variant="outline" className="border border-[#f2cf7c]/35 bg-white/5 text-[#f9f4ea] hover:border-[#f2cf7c]/60 hover:bg-white/10">
                <Link to={routes.contact}>
                  {t('footer.contact_studio', isHindi ? 'हमसे संपर्क करें' : 'Talk to us')}
                </Link>
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              {socialLinks.map(({ label, href, icon: Icon }) => (
                <a
                  key={label}
                  href={href}
                  target={href.startsWith('http') ? '_blank' : undefined}
                  rel={href.startsWith('http') ? 'noreferrer' : undefined}
                  className="group inline-flex items-center gap-2 rounded-full border border-[#f2cf7c]/25 bg-white/5 px-3 py-2 text-xs font-medium text-[#f6ead7]/80 transition-colors hover:border-[#f2cf7c]/50 hover:bg-[#f2cf7c]/10 hover:text-[#fffaf0]"
                  aria-label={label}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{label}</span>
                </a>
              ))}
            </div>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:col-span-1">
            {footerSections.map((section) => (
              <div key={section.sectionKey} className="space-y-4">
                <h3 className="text-xs font-semibold uppercase tracking-[0.28em] text-[#f0d188]">
                  {t(
                    section.titleKey,
                    isHindi
                      ? section.sectionKey === 'help'
                        ? 'सहायता'
                        : 'स्टोर'
                      : section.sectionKey.replace(/[-_]+/g, ' '),
                  )}
                </h3>
                <ul className="space-y-3 text-sm text-[#f6ead7]/80">
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
                            className="inline-flex items-center gap-2 transition-colors hover:text-[#fff5d9]"
                          >
                            <ArrowUpRight className="h-3.5 w-3.5 text-[#f0d188]" />
                            <span>{t(link.labelKey, footerLabelFallback(link.labelKey, locale))}</span>
                          </a>
                        ) : (
                          <Link
                            to={resolveLocalizedHref(link.href, locale)}
                            className="inline-flex items-center gap-2 transition-colors hover:text-[#fff5d9]"
                          >
                            <ArrowUpRight className="h-3.5 w-3.5 text-[#f0d188]" />
                            <span>{t(link.labelKey, footerLabelFallback(link.labelKey, locale))}</span>
                          </Link>
                        )}
                      </li>
                    )
                  })}
                </ul>
              </div>
            ))}
          </div>

          <div className="space-y-4 rounded-[1.5rem] border border-[#f2cf7c]/20 bg-[#1d140f]/50 p-5 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.26em] text-[#f0d188]">
              <Sparkles className="h-4 w-4" />
              {t('footer.contact', isHindi ? 'संपर्क' : 'Contact')}
            </div>
            <div className="space-y-4 text-sm text-[#f6ead7]/82">
              <a href={url} className="flex items-start gap-3 transition-colors hover:text-[#fff2ce]" target="_blank" rel="noreferrer">
                <MapPin className="mt-0.5 h-4 w-4 text-[#f0d188]" />
                <span>{url}</span>
              </a>
              <a href={`mailto:${supportEmail}`} className="flex items-start gap-3 transition-colors hover:text-[#fff2ce]">
                <Mail className="mt-0.5 h-4 w-4 text-[#f0d188]" />
                <span>{supportEmail}</span>
              </a>
              <a href="tel:+919999999999" className="flex items-start gap-3 transition-colors hover:text-[#fff2ce]">
                <Phone className="mt-0.5 h-4 w-4 text-[#f0d188]" />
                <span>+91 99999 99999</span>
              </a>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-[#f2cf7c]/15 pt-6 text-sm text-[#f6ead7]/75 md:flex md:items-center md:justify-between">
          <p>
            © {new Date().getFullYear()} {brandName}. {t('footer.rights', isHindi ? 'सर्वाधिकार सुरक्षित।' : 'All rights reserved.')}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-4 md:mt-0">
            <Link to={routes.privacyPolicy} className="transition-colors hover:text-[#fff5d9]">
              {t('footer.privacy', isHindi ? 'गोपनीयता नीति' : 'Privacy policy')}
            </Link>
            <Link to={routes.terms} className="transition-colors hover:text-[#fff5d9]">
              {t('footer.terms', isHindi ? 'नियम और शर्तें' : 'Terms')}
            </Link>
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
      'footer.privacy': 'Privacy policy',
      'footer.terms': 'Terms',
    },
    hi: {
      'nav.about': 'हमारे बारे में',
      'nav.collections': 'संग्रह',
      'nav.products': 'उत्पाद',
      'nav.contact': 'संपर्क',
      'nav.faq': 'अक्सर पूछे जाने वाले प्रश्न',
      'nav.track_order': 'ऑर्डर ट्रैक करें',
      'footer.privacy': 'गोपनीयता नीति',
      'footer.terms': 'नियम और शर्तें',
    },
  }

  return labels[locale][key] ?? key
}
