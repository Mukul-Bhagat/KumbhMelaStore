import { useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { queryKeys } from '@/shared/api/keys'
import {
  fetchPageContent,
  fetchPublicOrderTracking,
  fetchSiteShell,
  fetchTranslations,
  buildTranslationMap,
} from '@/shared/cms/repository'
import type {
  CmsPageContent,
  CmsShellContent,
  TranslationMap,
} from '@/shared/cms/types'
import { normalizeLocale, type Locale } from '@/shared/config/locales'
import { useUiStore } from '@/shared/stores/ui-store'

const fallbackTranslations: Partial<Record<Locale, Record<string, string>>> = {
  hi: {
    'auth.email': 'ईमेल',
    'auth.password': 'पासवर्ड',
    'auth.confirm_password': 'पासवर्ड की पुष्टि करें',
    'auth.full_name': 'पूरा नाम',
    'auth.full_name_placeholder': 'जैसे, राहुल शर्मा',
    'auth.phone': 'फ़ोन',
    'auth.google': 'Google से जारी रखें',
    'auth.github': 'GitHub से जारी रखें',
    'auth.back_to_sign_in': 'साइन इन पर लौटें',
    'auth.go_to_dashboard': 'डैशबोर्ड पर जाएँ',
    'auth.connection_error': 'प्रमाणीकरण सेवा से कनेक्ट नहीं हो सका। अपना कनेक्शन और Supabase URL जांचें, फिर पुनः प्रयास करें।',
    'auth.sign_up.validation.full_name': 'अपना पूरा नाम दर्ज करें।',
    'auth.sign_up.validation.email': 'मान्य ईमेल पता दर्ज करें।',
    'auth.sign_up.validation.phone': '6, 7, 8 या 9 से शुरू होने वाला 10 अंकों का मान्य भारतीय मोबाइल नंबर दर्ज करें।',
    'auth.sign_up.validation.password': 'पासवर्ड कम से कम 8 अक्षरों का होना चाहिए।',
    'auth.sign_up.validation.confirm_password': 'दोनों पासवर्ड मेल नहीं खाते।',
    'auth.sign_up.show_password': 'पासवर्ड दिखाएं',
    'auth.sign_up.hide_password': 'पासवर्ड छिपाएं',
    'auth.sign_up.confirmation_title': 'अपना ईमेल देखें',
    'auth.sign_up.confirmation_required': 'खाते की पुष्टि करने के लिए अपना ईमेल देखें। पुष्टि के बाद साइन इन करें।',
    'auth.sign_up.pending': 'खाता बनाया जा रहा है...',
    'auth.sign_up.rate_limit': 'बहुत अधिक साइनअप अनुरोध हुए हैं। {delay}',
    'auth.sign_up.rate_limit_wait_fallback': 'कृपया पुनः प्रयास करने से पहले कुछ मिनट प्रतीक्षा करें।',
    'auth.sign_up.rate_limit_wait_seconds': 'कृपया पुनः प्रयास करने से पहले {time} सेकंड प्रतीक्षा करें।',
    'auth.sign_up.rate_limit_wait_minutes': 'कृपया पुनः प्रयास करने से पहले लगभग {time} मिनट प्रतीक्षा करें।',
    'auth.sign_up.account_help': 'यदि आपका पहले से खाता है, तो साइन इन करें या पासवर्ड रीसेट करें।',
    'auth.sign_up.invalid_email': 'मान्य ईमेल पता दर्ज करें।',
    'auth.sign_up.weak_password': 'कम से कम 8 अक्षरों का मजबूत पासवर्ड चुनें।',
    'auth.sign_up.signup_disabled': 'खाता पंजीकरण अभी उपलब्ध नहीं है। कृपया बाद में पुनः प्रयास करें।',
    'auth.sign_up.redirect_error': 'खाता पुष्टि लिंक सही तरीके से कॉन्फ़िगर नहीं है। कृपया सहायता से संपर्क करें।',
    'auth.sign_up.generic_error': 'खाता नहीं बनाया जा सका। कृपया बाद में पुनः प्रयास करें।',
    'auth.sign_in.title': 'वापसी पर स्वागत है',
    'auth.sign_in.description': 'अपने ऑर्डर, विशलिस्ट और सहेजे गए पते देखने के लिए साइन इन करें।',
    'auth.sign_in.error': 'साइन इन नहीं हो सका। कृपया पुनः प्रयास करें।',
    'auth.sign_in.error_title': 'साइन इन विफल',
    'auth.sign_in.remember': '30 दिनों तक याद रखें',
    'auth.sign_in.cta': 'साइन इन',
    'auth.sign_in.forgot': 'पासवर्ड भूल गए?',
    'auth.sign_in.password_placeholder': 'अपना पासवर्ड दर्ज करें',
    'auth.sign_in.no_account': 'खाता नहीं है?',
    'auth.sign_in.create_account': 'खाता बनाएं',
    'auth.sign_up.title': 'अपना खाता बनाएं',
    'auth.sign_up.description': 'तेज़ चेकआउट, ऑर्डर ट्रैकिंग और उपहार संबंधी सहायता के लिए जुड़ें।',
    'auth.sign_up.error_title': 'खाता नहीं बन सका',
    'auth.sign_up.success_title': 'खाता बन गया',
    'auth.sign_up.success': 'खाता बन गया। ईमेल पुष्टि चालू होने पर अपना इनबॉक्स देखें, या जारी रखने के लिए साइन इन करें।',
    'auth.sign_up.cta': 'खाता बनाएं',
    'auth.sign_up.have_account': 'क्या आपका पहले से खाता है?',
    'auth.forgot_password.title': 'पासवर्ड रीसेट करें',
    'auth.forgot_password.description': 'नया पासवर्ड बनाने के लिए हम आपको एक सुरक्षित लिंक ईमेल करेंगे।',
    'auth.forgot_password.error_title': 'अनुरोध विफल',
    'auth.forgot_password.success_title': 'रिकवरी ईमेल भेजा गया',
    'auth.forgot_password.cta': 'रिकवरी लिंक भेजें',
    'auth.reset_password.title': 'नया पासवर्ड बनाएं',
    'auth.reset_password.description': 'अपने खाते को सुरक्षित करने के लिए एक मजबूत पासवर्ड चुनें।',
    'auth.reset_password.error_title': 'रीसेट विफल',
    'auth.reset_password.success_title': 'पासवर्ड अपडेट हो गया',
    'auth.reset_password.cta': 'पासवर्ड अपडेट करें',
    'auth.reset_password.password_placeholder': 'नया पासवर्ड दर्ज करें',
    'auth.reset_password.confirm_placeholder': 'पासवर्ड की पुष्टि करें',
    'dashboard.label': 'खाता कार्यक्षेत्र',
    'dashboard.navigation': 'खाता नेविगेशन',
    'dashboard.overview': 'अवलोकन',
    'dashboard.orders': 'ऑर्डर',
    'dashboard.profile': 'प्रोफ़ाइल',
    'dashboard.settings': 'सेटिंग्स',
    'dashboard.visit_store': 'स्टोर पर जाएँ',
    'dashboard.sign_out': 'साइन आउट',
    'dashboard.load_error': 'डैशबोर्ड लोड नहीं हो सका',
    'dashboard.load_error_description': 'खाते का सारांश लोड नहीं हो सका।',
    'dashboard.retry': 'पुनः प्रयास करें',
    'dashboard.welcome': 'वापसी पर स्वागत है',
    'dashboard.recent_order': 'हाल का ऑर्डर',
    'dashboard.view_orders': 'सभी ऑर्डर देखें',
    'dashboard.no_orders': 'अभी तक कोई ऑर्डर नहीं',
    'dashboard.explore_collection': 'संग्रह देखें; आपके ऑर्डर यहाँ दिखाई देंगे।',
    'dashboard.browse_products': 'उत्पाद देखें',
    'dashboard.seo_description': 'आपका ग्राहक खाता डैशबोर्ड Supabase से संचालित है।',
    'dashboard.orders_description': 'डेटाबेस से ऑर्डर, भुगतान और पूर्ति की स्थिति देखें।',
    'dashboard.orders_seo_description': 'Supabase से आपका ऑर्डर इतिहास।',
    'dashboard.orders_load_error': 'ऑर्डर लोड नहीं हो सके',
    'dashboard.orders_load_error_description': 'ऑर्डर इतिहास लोड नहीं हो सका।',
    'dashboard.orders_empty_description': 'Supabase में ऑर्डर बनने पर वे यहाँ दिखाई देंगे।',
    'dashboard.track_order': 'ऑर्डर ट्रैक करें',
    'dashboard.order_placed_on': 'ऑर्डर की तारीख',
    'dashboard.order_status.pending': 'लंबित',
    'dashboard.order_status.processing': 'प्रक्रिया में',
    'dashboard.order_status.shipped': 'भेज दिया गया',
    'dashboard.order_status.delivered': 'डिलीवर हो गया',
    'dashboard.order_status.cancelled': 'रद्द',
    'dashboard.order_status.refunded': 'रिफंड किया गया',
    'dashboard.payment_status.pending': 'लंबित',
    'dashboard.payment_status.paid': 'भुगतान हो गया',
    'dashboard.payment_status.failed': 'विफल',
    'dashboard.payment_status.refunded': 'रिफंड किया गया',
    'dashboard.payment_status.partially_refunded': 'आंशिक रिफंड',
    'dashboard.total': 'कुल',
    'dashboard.payment': 'भुगतान',
    'dashboard.status': 'स्थिति',
    'dashboard.tracking_note': 'ऑर्डर ट्रैकिंग सार्वजनिक जानकारी के माध्यम से उपलब्ध है; पूरे ऑर्डर का विवरण सुरक्षित रहता है।',
    'dashboard.track_an_order': 'ऑर्डर ट्रैक करें',
    'dashboard.profile_description': 'अपनी सार्वजनिक जानकारी, भाषा और अवतार को Supabase के साथ सिंक रखें।',
    'dashboard.profile_saved': 'प्रोफ़ाइल सेव हो गई',
    'dashboard.profile_save_failed': 'प्रोफ़ाइल अपडेट विफल',
    'dashboard.profile_saved_description': 'प्रोफ़ाइल Supabase Auth के साथ सेव और सिंक हो गई।',
    'dashboard.profile_signed_in_required': 'प्रोफ़ाइल अपडेट करने के लिए आपको साइन इन करना होगा।',
    'dashboard.profile_update_failed': 'प्रोफ़ाइल सेव नहीं हो सकी।',
    'dashboard.full_name': 'पूरा नाम',
    'dashboard.display_name': 'डिस्प्ले नाम',
    'dashboard.email': 'ईमेल',
    'dashboard.phone': 'फ़ोन',
    'dashboard.preferred_language': 'पसंदीदा भाषा',
    'dashboard.language.hi': 'हिन्दी',
    'dashboard.language.en': 'अंग्रेज़ी',
    'dashboard.avatar_url': 'अवतार URL',
    'dashboard.saving': 'सेव हो रहा है',
    'dashboard.save_changes': 'बदलाव सेव करें',
    'dashboard.settings_description': 'खाते की सुरक्षा प्रबंधित करें और इस डिवाइस से साइन आउट करें।',
    'dashboard.security': 'सुरक्षा',
    'dashboard.security_description': 'Supabase Auth से पासवर्ड रीसेट करें या इस डिवाइस से साइन आउट करें।',
    'dashboard.reset_password': 'पासवर्ड रीसेट करें',
    'admin.label': 'सुपर एडमिन',
    'admin.products': 'उत्पाद',
    'admin.overview': 'अवलोकन',
    'admin.content': 'सामग्री',
    'admin.catalog': 'कैटलॉग',
    'admin.orders': 'ऑर्डर',
    'admin.users': 'उपयोगकर्ता',
    'admin.settings': 'सेटिंग्स',
    'admin.visit_store': 'स्टोर पर जाएँ',
    'admin.store_short': 'स्टोर',
    'admin.workspace': 'एडमिन कार्यक्षेत्र',
    'admin.navigation': 'एडमिन नेविगेशन',
    'admin.load_error': 'एडमिन अवलोकन लोड नहीं हो सका',
    'admin.load_error_description': 'एडमिन सारांश लोड नहीं हो सका।',
    'admin.seo_description': 'Supabase से लाइव एडमिन सारांश।',
    'admin.back_office_description': 'बैक ऑफिस Supabase डेटा और अनुमतियों पर चलता है।',
    'admin.customers': 'ग्राहक',
    'admin.pages': 'पृष्ठ',
    'admin.media': 'मीडिया',
    'admin.reviews': 'समीक्षाएँ',
    'admin.next_title': 'आगे क्या प्रबंधित करें',
    'admin.next_description': 'कैटलॉग में उत्पाद, संग्रह और श्रेणियाँ संपादित करें। सामग्री में CMS, नेविगेशन, फ़ूटर, नीतियाँ और भाषाएँ प्रबंधित करें।',
    'role.super_admin': 'सुपर एडमिन',
    'role.customer': 'ग्राहक',
    'roles.super_admin': 'सुपर एडमिन',
    'roles.customer': 'ग्राहक',
  },
}

function humanizeTranslationKey(key: string) {
  const label = key
    .split('.')
    .at(-1)
    ?.replace(/[_-]+/g, ' ')
    .replace(/\b[a-z]/g, (character) => character.toUpperCase())

  return label || key
}

export function useCurrentLocale() {
  return normalizeLocale(useUiStore((state) => state.locale))
}

export function useTranslations() {
  return useQuery({
    queryKey: queryKeys.translations,
    queryFn: fetchTranslations,
    staleTime: Infinity,
    gcTime: Infinity,
    select: buildTranslationMap,
  })
}

export function useTranslate() {
  const locale = useCurrentLocale()
  const translations = useTranslations()

  return useMemo(() => {
    const map = translations.data ?? { hi: {}, en: {} }

    const resolve = (key: string, fallback?: string) => {
      const readableFallback = fallback && fallback !== key ? fallback : humanizeTranslationKey(key)
      const value = map[locale][key]
      return typeof value === 'string' && value.trim() && value !== key
        ? value
        : fallbackTranslations[locale]?.[key] ?? readableFallback
    }

    const resolveJson = <T,>(key: string, fallback?: T) => {
      const value = map[locale][key]
      return (value ?? fallback) as T
    }

    return {
      locale,
      t: resolve,
      j: resolveJson,
      ready: translations.isSuccess,
      isLoading: translations.isLoading,
      error: translations.error,
    }
  }, [locale, translations.data, translations.error, translations.isLoading, translations.isSuccess])
}

export function useSiteShell() {
  return useQuery({
    queryKey: queryKeys.shell.detail(useCurrentLocale()),
    queryFn: fetchSiteShell,
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
  })
}

export function usePageContent(slug: string) {
  return useQuery({
    queryKey: queryKeys.pages.detail(slug),
    queryFn: () => fetchPageContent(slug),
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
  })
}

export function useOrderTrackingMutation() {
  return useMutation({
    mutationFn: fetchPublicOrderTracking,
  })
}

export function useCmsPrefetch() {
  const queryClient = useQueryClient()
  const locale = useCurrentLocale()

  return useMemo(
    () => ({
      preloadAll: async () => {
        await Promise.all([
          queryClient.prefetchQuery({
            queryKey: queryKeys.translations,
            queryFn: fetchTranslations,
          }),
          queryClient.prefetchQuery({
            queryKey: queryKeys.shell.detail(locale),
            queryFn: fetchSiteShell,
          }),
          queryClient.prefetchQuery({
            queryKey: queryKeys.shell.detail(locale === 'hi' ? 'en' : 'hi'),
            queryFn: fetchSiteShell,
          }),
        ])
      },
      preloadPage: async (slug: string) => {
        await queryClient.prefetchQuery({
          queryKey: queryKeys.pages.detail(slug),
          queryFn: () => fetchPageContent(slug),
        })
      },
    }),
    [locale, queryClient],
  )
}

export type { CmsPageContent, CmsShellContent, TranslationMap }
