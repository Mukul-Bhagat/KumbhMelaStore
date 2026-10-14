insert into public.roles (slug, name, description, is_system)
values
  ('customer', 'Customer', 'Default shopper role', true),
  ('super_admin', 'Super Admin', 'Full system access', true),
  ('admin', 'Admin', 'Back office access', true),
  ('vendor', 'Vendor', 'Merchant access', true)
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  is_system = excluded.is_system;

insert into public.user_roles (user_id, role_id, granted_by)
select
  user_row.id,
  role.id,
  user_row.id
from auth.users user_row
join public.roles role on role.slug = 'super_admin'
where lower(user_row.email) = lower('kumbhmelamukul@kumbhmelastore.in')
on conflict do nothing;

insert into public.languages (code, name, native_name, content_language, is_default, is_enabled, sort_order)
values
  ('en', 'English', 'English', 'en-IN', true, true, 0),
  ('hi', 'Hindi', 'हिन्दी', 'hi-IN', false, true, 1)
on conflict (code) do update set
  name = excluded.name,
  native_name = excluded.native_name,
  content_language = excluded.content_language,
  is_default = excluded.is_default,
  is_enabled = excluded.is_enabled,
  sort_order = excluded.sort_order;

insert into public.site_settings (setting_key, setting_value, is_public, sort_order)
values
  ('brand.name', to_jsonb('brand.name'::text), true, 0),
  ('brand.devanagari', to_jsonb('brand.devanagari'::text), true, 1),
  ('brand.tagline', to_jsonb('brand.tagline'::text), true, 2),
  ('brand.description', to_jsonb('brand.description'::text), true, 3),
  ('support.email', to_jsonb('hello@kumbhmelastore.in'::text), true, 4),
  ('site.url', to_jsonb('https://kumbhmelastore.in'::text), true, 5)
on conflict (setting_key) do update set
  setting_value = excluded.setting_value,
  is_public = excluded.is_public,
  sort_order = excluded.sort_order;

insert into public.navigation_menus (menu_key, location, is_active, sort_order)
values
  ('header-primary', 'header', true, 0),
  ('shop-primary', 'shop', true, 1),
  ('account-primary', 'account', true, 2)
on conflict (menu_key) do update set
  location = excluded.location,
  is_active = excluded.is_active,
  sort_order = excluded.sort_order;

insert into public.navigation_menu_items (menu_id, label_key, href, route_type, sort_order, is_active)
select menu.id, item.label_key, item.href, item.route_type::public.link_route_type, item.sort_order, true
from (
  values
    ('header-primary', 'nav.home', '/', 'internal', 0),
    ('header-primary', 'nav.collections', '/collections', 'internal', 1),
    ('header-primary', 'nav.categories', '/categories', 'internal', 2),
    ('header-primary', 'nav.blog', '/blog', 'internal', 3),
    ('header-primary', 'nav.about', '/about', 'internal', 4),
    ('header-primary', 'nav.contact', '/contact', 'internal', 5),
    ('header-primary', 'nav.faq', '/faq', 'internal', 6),
    ('shop-primary', 'nav.collections', '/collections', 'internal', 0),
    ('shop-primary', 'nav.categories', '/categories', 'internal', 1),
    ('shop-primary', 'nav.blog', '/blog', 'internal', 2),
    ('account-primary', 'nav.sign_in', '/auth/sign-in', 'internal', 0),
    ('account-primary', 'nav.sign_up', '/auth/sign-up', 'internal', 1),
    ('account-primary', 'nav.track_order', '/track-order', 'internal', 2),
    ('account-primary', 'nav.dashboard', '/dashboard', 'internal', 3),
    ('account-primary', 'nav.orders', '/dashboard/orders', 'internal', 4),
    ('account-primary', 'nav.profile', '/dashboard/profile', 'internal', 5),
    ('account-primary', 'nav.settings', '/dashboard/settings', 'internal', 6)
) as item(menu_key, label_key, href, route_type, sort_order)
join public.navigation_menus menu on menu.menu_key = item.menu_key
on conflict do nothing;

insert into public.footer_sections (section_key, title_key, sort_order, is_active)
values
  ('footer-explore', 'footer.explore', 0, true),
  ('footer-support', 'footer.support', 1, true),
  ('footer-policies', 'footer.policies', 2, true)
on conflict (section_key) do update set
  title_key = excluded.title_key,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

insert into public.footer_links (section_id, label_key, href, route_type, sort_order, is_active)
select section.id, link.label_key, link.href, link.route_type::public.link_route_type, link.sort_order, true
from (
  values
    ('footer-explore', 'nav.collections', '/collections', 'internal', 0),
    ('footer-explore', 'nav.categories', '/categories', 'internal', 1),
    ('footer-explore', 'nav.blog', '/blog', 'internal', 2),
    ('footer-support', 'nav.contact', '/contact', 'internal', 0),
    ('footer-support', 'nav.faq', '/faq', 'internal', 1),
    ('footer-support', 'nav.track_order', '/track-order', 'internal', 2),
    ('footer-policies', 'nav.privacy_policy', '/privacy-policy', 'internal', 0),
    ('footer-policies', 'nav.terms', '/terms', 'internal', 1),
    ('footer-policies', 'nav.refund_policy', '/refund-policy', 'internal', 2),
    ('footer-policies', 'nav.shipping_policy', '/shipping-policy', 'internal', 3)
) as link(section_key, label_key, href, route_type, sort_order)
join public.footer_sections section on section.section_key = link.section_key
on conflict do nothing;

insert into public.announcements (announcement_key, is_active, dismissible, variant, starts_at, ends_at)
values
  ('site.launch', true, true, 'premium', null, null)
on conflict (announcement_key) do update set
  is_active = excluded.is_active,
  dismissible = excluded.dismissible,
  variant = excluded.variant,
  starts_at = excluded.starts_at,
  ends_at = excluded.ends_at;

insert into public.pages (slug, template, title_key, description_key, seo_title_key, seo_description_key, is_public, is_active, sort_order)
values
  ('home', 'landing', 'pages.home.title', 'pages.home.description', 'pages.home.seo_title', 'pages.home.seo_description', true, true, 0),
  ('about', 'document', 'pages.about.title', 'pages.about.description', 'pages.about.seo_title', 'pages.about.seo_description', true, true, 1),
  ('blog', 'blog', 'pages.blog.title', 'pages.blog.description', 'pages.blog.seo_title', 'pages.blog.seo_description', true, true, 2),
  ('contact', 'document', 'pages.contact.title', 'pages.contact.description', 'pages.contact.seo_title', 'pages.contact.seo_description', true, true, 3),
  ('collections', 'collection', 'pages.collections.title', 'pages.collections.description', 'pages.collections.seo_title', 'pages.collections.seo_description', true, true, 4),
  ('categories', 'category', 'pages.categories.title', 'pages.categories.description', 'pages.categories.seo_title', 'pages.categories.seo_description', true, true, 5),
  ('faq', 'document', 'pages.faq.title', 'pages.faq.description', 'pages.faq.seo_title', 'pages.faq.seo_description', true, true, 6),
  ('privacy-policy', 'document', 'pages.privacy_policy.title', 'pages.privacy_policy.description', 'pages.privacy_policy.seo_title', 'pages.privacy_policy.seo_description', true, true, 7),
  ('terms', 'document', 'pages.terms.title', 'pages.terms.description', 'pages.terms.seo_title', 'pages.terms.seo_description', true, true, 8),
  ('refund-policy', 'document', 'pages.refund_policy.title', 'pages.refund_policy.description', 'pages.refund_policy.seo_title', 'pages.refund_policy.seo_description', true, true, 9),
  ('shipping-policy', 'document', 'pages.shipping_policy.title', 'pages.shipping_policy.description', 'pages.shipping_policy.seo_title', 'pages.shipping_policy.seo_description', true, true, 10)
on conflict (slug) do update set
  template = excluded.template,
  title_key = excluded.title_key,
  description_key = excluded.description_key,
  seo_title_key = excluded.seo_title_key,
  seo_description_key = excluded.seo_description_key,
  is_public = excluded.is_public,
  is_active = excluded.is_active,
  sort_order = excluded.sort_order;

insert into public.page_sections (
  page_id,
  section_key,
  section_type,
  sort_order,
  is_active,
  payload
)
values
  (
    (select id from public.pages where slug = 'home'),
    'home-hero',
    'hero',
    0,
    true,
    '{
      "eyebrow": "pages.home.hero.eyebrow",
      "title": "pages.home.hero.title",
      "description": "pages.home.hero.description",
      "actions": [
        { "label": "pages.home.hero.primary_cta", "href": "/collections", "variant": "default" },
        { "label": "pages.home.hero.secondary_cta", "href": "/track-order", "variant": "outline" }
      ]
    }'::jsonb
  ),
  (
    (select id from public.pages where slug = 'home'),
    'home-collection-promise',
    'cta',
    1,
    true,
    '{
      "eyebrow": "pages.home.cta.eyebrow",
      "title": "pages.home.cta.title",
      "description": "pages.home.cta.description",
      "actions": [
        { "label": "pages.home.cta.primary_cta", "href": "/contact", "variant": "premium" }
      ]
    }'::jsonb
  ),
  (
    (select id from public.pages where slug = 'about'),
    'about-story',
    'rich-text',
    0,
    true,
    '{
      "title": "pages.about.section.title",
      "body": "pages.about.section.body"
    }'::jsonb
  ),
  (
    (select id from public.pages where slug = 'blog'),
    'blog-story',
    'rich-text',
    0,
    true,
    '{
      "title": "pages.blog.section.title",
      "body": "pages.blog.section.body"
    }'::jsonb
  ),
  (
    (select id from public.pages where slug = 'contact'),
    'contact-connect',
    'contact-grid',
    0,
    true,
    '{
      "title": "pages.contact.section.title",
      "description": "pages.contact.section.description",
      "items": [
        { "type": "phone", "title": "contact.phone.title", "value": "contact.phone.value", "badge": "contact.phone.badge" },
        { "type": "email", "title": "contact.email.title", "value": "contact.email.value", "badge": "contact.email.badge" },
        { "type": "location", "title": "contact.address.title", "value": "contact.address.value", "badge": "contact.address.badge" }
      ]
    }'::jsonb
  ),
  (
    (select id from public.pages where slug = 'contact'),
    'contact-cta',
    'cta',
    1,
    true,
    '{
      "title": "pages.contact.cta.title",
      "description": "pages.contact.cta.description",
      "actions": [
        { "label": "pages.contact.cta.primary_cta", "href": "mailto:hello@kumbhmelastore.in", "variant": "default" }
      ]
    }'::jsonb
  ),
  (
    (select id from public.pages where slug = 'collections'),
    'collections-intro',
    'rich-text',
    0,
    true,
    '{
      "title": "pages.collections.section.title",
      "body": "pages.collections.section.body"
    }'::jsonb
  ),
  (
    (select id from public.pages where slug = 'categories'),
    'categories-intro',
    'rich-text',
    0,
    true,
    '{
      "title": "pages.categories.section.title",
      "body": "pages.categories.section.body"
    }'::jsonb
  ),
  (
    (select id from public.pages where slug = 'faq'),
    'faq-intro',
    'faq-grid',
    0,
    true,
    '{
      "title": "pages.faq.section.title",
      "description": "pages.faq.section.description",
      "items": [
        { "question": "faq.order.question", "answer": "faq.order.answer" },
        { "question": "faq.support.question", "answer": "faq.support.answer" },
        { "question": "faq.shipping.question", "answer": "faq.shipping.answer" }
      ]
    }'::jsonb
  ),
  (
    (select id from public.pages where slug = 'privacy-policy'),
    'privacy-policy-body',
    'rich-text',
    0,
    true,
    '{
      "title": "pages.privacy_policy.section.title",
      "body": "pages.privacy_policy.section.body"
    }'::jsonb
  ),
  (
    (select id from public.pages where slug = 'terms'),
    'terms-body',
    'rich-text',
    0,
    true,
    '{
      "title": "pages.terms.section.title",
      "body": "pages.terms.section.body"
    }'::jsonb
  ),
  (
    (select id from public.pages where slug = 'refund-policy'),
    'refund-policy-body',
    'rich-text',
    0,
    true,
    '{
      "title": "pages.refund_policy.section.title",
      "body": "pages.refund_policy.section.body"
    }'::jsonb
  ),
  (
    (select id from public.pages where slug = 'shipping-policy'),
    'shipping-policy-body',
    'rich-text',
    0,
    true,
    '{
      "title": "pages.shipping_policy.section.title",
      "body": "pages.shipping_policy.section.body"
    }'::jsonb
  )
on conflict (page_id, section_key) do update set
  section_type = excluded.section_type,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active,
  payload = excluded.payload;

insert into public.translations (namespace, translation_key, language_code, value_text, value_json, is_active)
values
  ('site', 'brand.name', 'hi', 'कुम्भ मेला स्टोर', null, true),
  ('site', 'brand.name', 'en', 'KumbhMelaStore', null, true),
  ('site', 'brand.devanagari', 'hi', 'कुम्भ मेला स्टोर', null, true),
  ('site', 'brand.devanagari', 'en', 'Kumbh Mela Store', null, true),
  ('site', 'brand.tagline', 'hi', 'पवित्र परंपरा के लिए प्रीमियम संग्रह', null, true),
  ('site', 'brand.tagline', 'en', 'Premium pieces rooted in sacred tradition', null, true),
  ('site', 'brand.description', 'hi', 'कुंभ मेले की आत्मा से प्रेरित, सोच-समझकर चुने गए वस्त्र, स्मारक और उपहार।', null, true),
  ('site', 'brand.description', 'en', 'Thoughtfully curated clothing, keepsakes, and gifts inspired by the spirit of the Kumbh Mela.', null, true),
  ('site', 'language.hi.name', 'hi', 'हिन्दी', null, true),
  ('site', 'language.hi.name', 'en', 'Hindi', null, true),
  ('site', 'language.hi.native_name', 'hi', 'हिन्दी', null, true),
  ('site', 'language.hi.native_name', 'en', 'हिन्दी', null, true),
  ('site', 'language.en.name', 'hi', 'अंग्रेज़ी', null, true),
  ('site', 'language.en.name', 'en', 'English', null, true),
  ('site', 'language.en.native_name', 'hi', 'English', null, true),
  ('site', 'language.en.native_name', 'en', 'English', null, true),
  ('site', 'nav.home', 'hi', 'होम', null, true),
  ('site', 'nav.home', 'en', 'Home', null, true),
  ('site', 'nav.collections', 'hi', 'कलेक्शन', null, true),
  ('site', 'nav.collections', 'en', 'Collections', null, true),
  ('site', 'nav.categories', 'hi', 'श्रेणियाँ', null, true),
  ('site', 'nav.categories', 'en', 'Categories', null, true),
  ('site', 'nav.blog', 'hi', 'ब्लॉग', null, true),
  ('site', 'nav.blog', 'en', 'Journal', null, true),
  ('site', 'nav.about', 'hi', 'हमारे बारे में', null, true),
  ('site', 'nav.about', 'en', 'About', null, true),
  ('site', 'nav.contact', 'hi', 'संपर्क', null, true),
  ('site', 'nav.contact', 'en', 'Contact', null, true),
  ('site', 'nav.faq', 'hi', 'सामान्य प्रश्न', null, true),
  ('site', 'nav.faq', 'en', 'FAQ', null, true),
  ('site', 'nav.sign_in', 'hi', 'साइन इन', null, true),
  ('site', 'nav.sign_in', 'en', 'Sign in', null, true),
  ('site', 'nav.sign_up', 'hi', 'खाता बनाएं', null, true),
  ('site', 'nav.sign_up', 'en', 'Create account', null, true),
  ('site', 'nav.track_order', 'hi', 'ऑर्डर ट्रैक करें', null, true),
  ('site', 'nav.track_order', 'en', 'Track order', null, true),
  ('site', 'nav.dashboard', 'hi', 'डैशबोर्ड', null, true),
  ('site', 'nav.dashboard', 'en', 'Dashboard', null, true),
  ('site', 'nav.orders', 'hi', 'ऑर्डर', null, true),
  ('site', 'nav.orders', 'en', 'Orders', null, true),
  ('site', 'nav.profile', 'hi', 'प्रोफाइल', null, true),
  ('site', 'nav.profile', 'en', 'Profile', null, true),
  ('site', 'nav.settings', 'hi', 'सेटिंग्स', null, true),
  ('site', 'nav.settings', 'en', 'Settings', null, true),
  ('site', 'nav.language', 'hi', 'भाषा बदलें', null, true),
  ('site', 'nav.language', 'en', 'Change language', null, true),
  ('site', 'nav.cart', 'hi', 'कार्ट', null, true),
  ('site', 'nav.cart', 'en', 'Cart', null, true),
  ('site', 'nav.wishlist', 'hi', 'विशलिस्ट', null, true),
  ('site', 'nav.wishlist', 'en', 'Wishlist', null, true),
  ('site', 'nav.admin', 'hi', 'एडमिन', null, true),
  ('site', 'nav.admin', 'en', 'Admin', null, true),
  ('site', 'nav.content', 'hi', 'सामग्री', null, true),
  ('site', 'nav.content', 'en', 'Content', null, true),
  ('site', 'nav.catalog', 'hi', 'कैटलॉग', null, true),
  ('site', 'nav.catalog', 'en', 'Catalog', null, true),
  ('site', 'nav.users', 'hi', 'उपयोगकर्ता', null, true),
  ('site', 'nav.users', 'en', 'Users', null, true),
  ('site', 'nav.privacy_policy', 'hi', 'गोपनीयता नीति', null, true),
  ('site', 'nav.privacy_policy', 'en', 'Privacy Policy', null, true),
  ('site', 'nav.terms', 'hi', 'नियम और शर्तें', null, true),
  ('site', 'nav.terms', 'en', 'Terms', null, true),
  ('site', 'nav.refund_policy', 'hi', 'रिफंड नीति', null, true),
  ('site', 'nav.refund_policy', 'en', 'Refund Policy', null, true),
  ('site', 'nav.shipping_policy', 'hi', 'शिपिंग नीति', null, true),
  ('site', 'nav.shipping_policy', 'en', 'Shipping Policy', null, true),
  ('site', 'footer.explore', 'hi', 'एक्सप्लोर करें', null, true),
  ('site', 'footer.explore', 'en', 'Explore', null, true),
  ('site', 'footer.support', 'hi', 'सहायता', null, true),
  ('site', 'footer.support', 'en', 'Support', null, true),
  ('site', 'footer.policies', 'hi', 'नीतियाँ', null, true),
  ('site', 'footer.policies', 'en', 'Policies', null, true),
  ('site', 'footer.explore_collections', 'hi', 'कलेक्शन देखें', null, true),
  ('site', 'footer.explore_collections', 'en', 'Explore collections', null, true),
  ('site', 'footer.contact_studio', 'hi', 'हमसे बात करें', null, true),
  ('site', 'footer.contact_studio', 'en', 'Talk to us', null, true),
  ('site', 'footer.rights', 'hi', 'सर्वाधिकार सुरक्षित।', null, true),
  ('site', 'footer.rights', 'en', 'All rights reserved.', null, true),
  ('site', 'pages.home.title', 'hi', 'मुख्य पृष्ठ', null, true),
  ('site', 'pages.home.title', 'en', 'Home', null, true),
  ('site', 'pages.home.description', 'hi', 'कुंभ मेले की परंपरा से प्रेरित एक प्रीमियम शॉपिंग अनुभव।', null, true),
  ('site', 'pages.home.description', 'en', 'A premium shopping experience inspired by the tradition of the Kumbh Mela.', null, true),
  ('site', 'pages.home.seo_title', 'hi', 'कुम्भ मेला स्टोर', null, true),
  ('site', 'pages.home.seo_title', 'en', 'KumbhMelaStore', null, true),
  ('site', 'pages.home.seo_description', 'hi', 'पवित्र परंपरा से प्रेरित प्रीमियम शॉपिंग।', null, true),
  ('site', 'pages.home.seo_description', 'en', 'Premium shopping inspired by sacred tradition.', null, true),
  ('site', 'pages.home.hero.eyebrow', 'hi', 'प्रीमियम धरोहर', null, true),
  ('site', 'pages.home.hero.eyebrow', 'en', 'Premium heritage', null, true),
  ('site', 'pages.home.hero.title', 'hi', 'कुंभ मेले की भावना को घर तक लाएँ।', null, true),
  ('site', 'pages.home.hero.title', 'en', 'Bring the spirit of Kumbh Mela home.', null, true),
  ('site', 'pages.home.hero.description', 'hi', 'सांस्कृतिक गहराई, शुद्ध सौंदर्य और उपयोगी उत्पादों का शांत, सुरुचिपूर्ण संग्रह।', null, true),
  ('site', 'pages.home.hero.description', 'en', 'A calm, elegant curation of culturally rooted, useful pieces with lasting beauty.', null, true),
  ('site', 'pages.home.hero.primary_cta', 'hi', 'कलेक्शन देखें', null, true),
  ('site', 'pages.home.hero.primary_cta', 'en', 'Browse collections', null, true),
  ('site', 'pages.home.hero.secondary_cta', 'hi', 'ऑर्डर ट्रैक करें', null, true),
  ('site', 'pages.home.hero.secondary_cta', 'en', 'Track order', null, true),
  ('site', 'pages.home.stats.crafted', 'hi', 'करे हुए डिज़ाइन्स', null, true),
  ('site', 'pages.home.stats.crafted', 'en', 'Curated pieces', null, true),
  ('site', 'pages.home.stats.languages', 'hi', 'भाषा तैयार', null, true),
  ('site', 'pages.home.stats.languages', 'en', 'Locales ready', null, true),
  ('site', 'pages.home.stats.support', 'hi', 'सहायता घंटे', null, true),
  ('site', 'pages.home.stats.support', 'en', 'Support hours', null, true),
  ('site', 'pages.home.cta.eyebrow', 'hi', 'नए संग्रह', null, true),
  ('site', 'pages.home.cta.eyebrow', 'en', 'New collection', null, true),
  ('site', 'pages.home.cta.title', 'hi', 'अपनी अगली पवित्र खरीदारी की शुरुआत करें।', null, true),
  ('site', 'pages.home.cta.title', 'en', 'Start your next meaningful purchase.', null, true),
  ('site', 'pages.home.cta.description', 'hi', 'हर संग्रह को विस्तार, सादगी और लंबे समय तक चलने वाले मूल्य के साथ चुना गया है।', null, true),
  ('site', 'pages.home.cta.description', 'en', 'Each collection is chosen for detail, simplicity, and lasting value.', null, true),
  ('site', 'pages.home.cta.primary_cta', 'hi', 'संपर्क करें', null, true),
  ('site', 'pages.home.cta.primary_cta', 'en', 'Contact us', null, true),
  ('site', 'pages.about.title', 'hi', 'हमारे बारे में', null, true),
  ('site', 'pages.about.title', 'en', 'About', null, true),
  ('site', 'pages.about.description', 'hi', 'कुम्भ मेला स्टोर का उद्देश्य पवित्र यात्रा की भावना को रोज़मर्रा की सुंदरता से जोड़ना है।', null, true),
  ('site', 'pages.about.description', 'en', 'KumbhMelaStore exists to connect the spirit of sacred journeys with everyday beauty.', null, true),
  ('site', 'pages.about.seo_title', 'hi', 'हमारे बारे में', null, true),
  ('site', 'pages.about.seo_title', 'en', 'About KumbhMelaStore', null, true),
  ('site', 'pages.about.seo_description', 'hi', 'ब्रांड, धरोहर और डिजाइन के बारे में।', null, true),
  ('site', 'pages.about.seo_description', 'en', 'Brand, heritage, and design in one place.', null, true),
  ('site', 'pages.about.section.title', 'hi', 'हमारी कहानी', null, true),
  ('site', 'pages.about.section.title', 'en', 'Our story', null, true),
  ('site', 'pages.about.section.body', 'hi', 'हम पारंपरिक शिल्प, सोच-समझकर चुने गए सामग्रियों, और स्पष्ट डिजिटल अनुभवों के माध्यम से एक प्रीमियम भारतीय ब्रांड बनाते हैं।', null, true),
  ('site', 'pages.about.section.body', 'en', 'We build a premium Indian brand through traditional craft, thoughtful materials, and a clear digital experience.', null, true),
  ('site', 'pages.blog.title', 'hi', 'ब्लॉग', null, true),
  ('site', 'pages.blog.title', 'en', 'Journal', null, true),
  ('site', 'pages.blog.description', 'hi', 'कहानियाँ, संग्रह और पर्दे के पीछे की झलकियाँ।', null, true),
  ('site', 'pages.blog.description', 'en', 'Stories, collections, and behind-the-scenes notes.', null, true),
  ('site', 'pages.blog.seo_title', 'hi', 'ब्लॉग', null, true),
  ('site', 'pages.blog.seo_title', 'en', 'Journal', null, true),
  ('site', 'pages.blog.seo_description', 'hi', 'ब्रांड कहानियाँ और संपादकीय सामग्री।', null, true),
  ('site', 'pages.blog.seo_description', 'en', 'Brand stories and editorial content.', null, true),
  ('site', 'pages.blog.section.title', 'hi', 'संपादकीय नोट्स', null, true),
  ('site', 'pages.blog.section.title', 'en', 'Editorial notes', null, true),
  ('site', 'pages.blog.section.body', 'hi', 'यहाँ भविष्य में क्यूरेटेड लेख, लॉन्च, और ब्रांड अपडेट प्रकाशित किए जाएंगे।', null, true),
  ('site', 'pages.blog.section.body', 'en', 'This is where curated articles, launches, and brand updates will live.', null, true),
  ('site', 'pages.contact.title', 'hi', 'संपर्क करें', null, true),
  ('site', 'pages.contact.title', 'en', 'Contact', null, true),
  ('site', 'pages.contact.description', 'hi', 'हमसे जुड़ें, और हम प्रीमियम अनुभव में आपकी मदद करेंगे।', null, true),
  ('site', 'pages.contact.description', 'en', 'Reach out and we will help you with a premium experience.', null, true),
  ('site', 'pages.contact.seo_title', 'hi', 'संपर्क करें', null, true),
  ('site', 'pages.contact.seo_title', 'en', 'Contact KumbhMelaStore', null, true),
  ('site', 'pages.contact.seo_description', 'hi', 'संपर्क जानकारी और अगला कदम।', null, true),
  ('site', 'pages.contact.seo_description', 'en', 'Contact information and next steps.', null, true),
  ('site', 'pages.contact.section.title', 'hi', 'संपर्क विवरण', null, true),
  ('site', 'pages.contact.section.title', 'en', 'Contact details', null, true),
  ('site', 'pages.contact.section.description', 'hi', 'ऑर्डर, साझेदारी या सामान्य प्रश्नों के लिए सीधे संपर्क करें।', null, true),
  ('site', 'pages.contact.section.description', 'en', 'Reach out directly for orders, partnerships, or general questions.', null, true),
  ('site', 'contact.phone.title', 'hi', 'फोन', null, true),
  ('site', 'contact.phone.title', 'en', 'Phone', null, true),
  ('site', 'contact.phone.value', 'hi', '+91 98765 43210', null, true),
  ('site', 'contact.phone.value', 'en', '+91 98765 43210', null, true),
  ('site', 'contact.phone.badge', 'hi', 'कॉल करें', null, true),
  ('site', 'contact.phone.badge', 'en', 'Call', null, true),
  ('site', 'contact.email.title', 'hi', 'ईमेल', null, true),
  ('site', 'contact.email.title', 'en', 'Email', null, true),
  ('site', 'contact.email.value', 'hi', 'hello@kumbhmelastore.in', null, true),
  ('site', 'contact.email.value', 'en', 'hello@kumbhmelastore.in', null, true),
  ('site', 'contact.email.badge', 'hi', 'लिखें', null, true),
  ('site', 'contact.email.badge', 'en', 'Write', null, true),
  ('site', 'contact.address.title', 'hi', 'स्थान', null, true),
  ('site', 'contact.address.title', 'en', 'Location', null, true),
  ('site', 'contact.address.value', 'hi', 'प्रयागराज, उत्तर प्रदेश, भारत', null, true),
  ('site', 'contact.address.value', 'en', 'Prayagraj, Uttar Pradesh, India', null, true),
  ('site', 'contact.address.badge', 'hi', 'देखें', null, true),
  ('site', 'contact.address.badge', 'en', 'Visit', null, true),
  ('site', 'pages.contact.cta.title', 'hi', 'किसी विशेष अनुरोध के लिए टीम से बात करें।', null, true),
  ('site', 'pages.contact.cta.title', 'en', 'Talk to the team for special requests.', null, true),
  ('site', 'pages.contact.cta.description', 'hi', 'हम डिजाइन, ऑर्डर और सहायता के लिए उपलब्ध हैं।', null, true),
  ('site', 'pages.contact.cta.description', 'en', 'We are available for design, order, and support questions.', null, true),
  ('site', 'pages.contact.cta.primary_cta', 'hi', 'ईमेल भेजें', null, true),
  ('site', 'pages.contact.cta.primary_cta', 'en', 'Send email', null, true),
  ('site', 'pages.collections.title', 'hi', 'कलेक्शन', null, true),
  ('site', 'pages.collections.title', 'en', 'Collections', null, true),
  ('site', 'pages.collections.description', 'hi', 'कुंभ मेले से प्रेरित प्रीमियम कलेक्शन।', null, true),
  ('site', 'pages.collections.description', 'en', 'Premium collections inspired by the Kumbh Mela.', null, true),
  ('site', 'pages.collections.seo_title', 'hi', 'कलेक्शन', null, true),
  ('site', 'pages.collections.seo_title', 'en', 'Collections', null, true),
  ('site', 'pages.collections.seo_description', 'hi', 'संग्रह जो परंपरा को डिज़ाइन से जोड़ते हैं।', null, true),
  ('site', 'pages.collections.seo_description', 'en', 'Collections that connect tradition and design.', null, true),
  ('site', 'pages.collections.section.title', 'hi', 'कलेक्शन तैयार हैं', null, true),
  ('site', 'pages.collections.section.title', 'en', 'Collections are ready', null, true),
  ('site', 'pages.collections.section.body', 'hi', 'संग्रहों को Supabase से नियंत्रित करें, उन्हें तुरंत सार्वजनिक अनुभव में प्रकाशित करें, और हर कार्ड को बिना कोड बदले अपडेट करें।', null, true),
  ('site', 'pages.collections.section.body', 'en', 'Manage collections in Supabase, publish them instantly, and keep every card editable without code changes.', null, true),
  ('site', 'pages.categories.title', 'hi', 'श्रेणियाँ', null, true),
  ('site', 'pages.categories.title', 'en', 'Categories', null, true),
  ('site', 'pages.categories.description', 'hi', 'उत्पादों को साफ, स्पष्ट श्रेणियों में ब्राउज़ करें।', null, true),
  ('site', 'pages.categories.description', 'en', 'Browse products through clean, clear categories.', null, true),
  ('site', 'pages.categories.seo_title', 'hi', 'श्रेणियाँ', null, true),
  ('site', 'pages.categories.seo_title', 'en', 'Categories', null, true),
  ('site', 'pages.categories.seo_description', 'hi', 'भविष्य के कैटलॉग संगठन के लिए CMS-आधारित श्रेणियाँ।', null, true),
  ('site', 'pages.categories.seo_description', 'en', 'CMS-driven categories for future catalog organization.', null, true),
  ('site', 'pages.categories.section.title', 'hi', 'श्रेणी संरचना', null, true),
  ('site', 'pages.categories.section.title', 'en', 'Category structure', null, true),
  ('site', 'pages.categories.section.body', 'hi', 'यह पृष्ठ उत्पाद श्रेणियों के लिए एक मजबूत संरचना प्रदान करता है।', null, true),
  ('site', 'pages.categories.section.body', 'en', 'This page provides a strong structure for product categories.', null, true),
  ('site', 'pages.faq.title', 'hi', 'सामान्य प्रश्न', null, true),
  ('site', 'pages.faq.title', 'en', 'FAQ', null, true),
  ('site', 'pages.faq.description', 'hi', 'उन सवालों के जवाब जो लोग अक्सर पूछते हैं।', null, true),
  ('site', 'pages.faq.description', 'en', 'Answers to the questions people ask most often.', null, true),
  ('site', 'pages.faq.seo_title', 'hi', 'सामान्य प्रश्न', null, true),
  ('site', 'pages.faq.seo_title', 'en', 'FAQ', null, true),
  ('site', 'pages.faq.seo_description', 'hi', 'ग्राहक सहायता और प्रक्रिया से जुड़े सवाल।', null, true),
  ('site', 'pages.faq.seo_description', 'en', 'Questions about support and process.', null, true),
  ('site', 'pages.faq.section.title', 'hi', 'सबसे सामान्य सवाल', null, true),
  ('site', 'pages.faq.section.title', 'en', 'Most common questions', null, true),
  ('site', 'pages.faq.section.description', 'hi', 'भविष्य में CMS में FAQ प्रविष्टियाँ जोड़ी जा सकती हैं।', null, true),
  ('site', 'pages.faq.section.description', 'en', 'FAQ entries can be expanded in the CMS later.', null, true),
  ('site', 'faq.order.question', 'hi', 'मैं अपने ऑर्डर की स्थिति कैसे देखूं?', null, true),
  ('site', 'faq.order.question', 'en', 'How do I check my order status?', null, true),
  ('site', 'faq.order.answer', 'hi', 'ऑर्डर ट्रैक पृष्ठ पर अपना ऑर्डर नंबर और सत्यापन जानकारी दर्ज करें।', null, true),
  ('site', 'faq.order.answer', 'en', 'Use the Track Order page with your order number and verification details.', null, true),
  ('site', 'faq.support.question', 'hi', 'सहायता कैसे मिलेगी?', null, true),
  ('site', 'faq.support.question', 'en', 'How do I get support?', null, true),
  ('site', 'faq.support.answer', 'hi', 'हम ईमेल और संपर्क पृष्ठ के माध्यम से उपलब्ध हैं।', null, true),
  ('site', 'faq.support.answer', 'en', 'We are available by email and through the contact page.', null, true),
  ('site', 'faq.shipping.question', 'hi', 'शिपिंग कितनी जल्दी होती है?', null, true),
  ('site', 'faq.shipping.question', 'en', 'How fast is shipping?', null, true),
  ('site', 'faq.shipping.answer', 'hi', 'भविष्य में शिपिंग समय उत्पाद और स्थान के अनुसार सेट होगा।', null, true),
  ('site', 'faq.shipping.answer', 'en', 'Shipping times will be configured by product and destination later.', null, true),
  ('site', 'pages.privacy_policy.title', 'hi', 'गोपनीयता नीति', null, true),
  ('site', 'pages.privacy_policy.title', 'en', 'Privacy Policy', null, true),
  ('site', 'pages.privacy_policy.description', 'hi', 'डेटा का उपयोग, संग्रह और सुरक्षा।', null, true),
  ('site', 'pages.privacy_policy.description', 'en', 'How we use, store, and protect data.', null, true),
  ('site', 'pages.privacy_policy.seo_title', 'hi', 'गोपनीयता नीति', null, true),
  ('site', 'pages.privacy_policy.seo_title', 'en', 'Privacy Policy', null, true),
  ('site', 'pages.privacy_policy.seo_description', 'hi', 'डेटा और गोपनीयता से जुड़ी नीतियाँ।', null, true),
  ('site', 'pages.privacy_policy.seo_description', 'en', 'Data and privacy policies.', null, true),
  ('site', 'pages.privacy_policy.section.title', 'hi', 'हमारी गोपनीयता प्रतिबद्धता', null, true),
  ('site', 'pages.privacy_policy.section.title', 'en', 'Our privacy commitment', null, true),
  ('site', 'pages.privacy_policy.section.body', 'hi', 'आपकी गोपनीयता, संग्रहण और डेटा उपयोग के नियम बाद में Supabase CMS से प्रबंधित किए जाएंगे।', null, true),
  ('site', 'pages.privacy_policy.section.body', 'en', 'Privacy, storage, and data-handling terms are managed from Supabase CMS.', null, true),
  ('site', 'pages.terms.title', 'hi', 'नियम और शर्तें', null, true),
  ('site', 'pages.terms.title', 'en', 'Terms', null, true),
  ('site', 'pages.terms.description', 'hi', 'सेवा उपयोग से जुड़े नियम।', null, true),
  ('site', 'pages.terms.description', 'en', 'Rules for using the service.', null, true),
  ('site', 'pages.terms.seo_title', 'hi', 'नियम और शर्तें', null, true),
  ('site', 'pages.terms.seo_title', 'en', 'Terms', null, true),
  ('site', 'pages.terms.seo_description', 'hi', 'सेवा की शर्तें और उपयोग नीति।', null, true),
  ('site', 'pages.terms.seo_description', 'en', 'Service terms and usage policy.', null, true),
  ('site', 'pages.terms.section.title', 'hi', 'उपयोग की शर्तें', null, true),
  ('site', 'pages.terms.section.title', 'en', 'Terms of use', null, true),
  ('site', 'pages.terms.section.body', 'hi', 'इस अनुभाग में सेवा उपयोग, खाता जिम्मेदारियों और स्वीकार्य उपयोग की शर्तें शामिल होंगी।', null, true),
  ('site', 'pages.terms.section.body', 'en', 'This section will hold service usage, account responsibilities, and acceptable-use terms.', null, true),
  ('site', 'pages.refund_policy.title', 'hi', 'रिफंड नीति', null, true),
  ('site', 'pages.refund_policy.title', 'en', 'Refund Policy', null, true),
  ('site', 'pages.refund_policy.description', 'hi', 'रिफंड, वापसी और समर्थन प्रक्रिया।', null, true),
  ('site', 'pages.refund_policy.description', 'en', 'Refund, returns, and support process.', null, true),
  ('site', 'pages.refund_policy.seo_title', 'hi', 'रिफंड नीति', null, true),
  ('site', 'pages.refund_policy.seo_title', 'en', 'Refund Policy', null, true),
  ('site', 'pages.refund_policy.seo_description', 'hi', 'रिफंड और वापसी दिशानिर्देश।', null, true),
  ('site', 'pages.refund_policy.seo_description', 'en', 'Refund and return guidelines.', null, true),
  ('site', 'pages.refund_policy.section.title', 'hi', 'रिफंड और वापसी', null, true),
  ('site', 'pages.refund_policy.section.title', 'en', 'Refunds and returns', null, true),
  ('site', 'pages.refund_policy.section.body', 'hi', 'रिफंड, रिटर्न और सहायता प्रक्रिया Supabase CMS से प्रकाशित और अपडेट की जाएगी।', null, true),
  ('site', 'pages.refund_policy.section.body', 'en', 'Refunds, returns, and support process details are published and updated from Supabase CMS.', null, true),
  ('site', 'pages.shipping_policy.title', 'hi', 'शिपिंग नीति', null, true),
  ('site', 'pages.shipping_policy.title', 'en', 'Shipping Policy', null, true),
  ('site', 'pages.shipping_policy.description', 'hi', 'शिपिंग और डिलीवरी के दिशानिर्देश।', null, true),
  ('site', 'pages.shipping_policy.description', 'en', 'Shipping and delivery guidelines.', null, true),
  ('site', 'pages.shipping_policy.seo_title', 'hi', 'शिपिंग नीति', null, true),
  ('site', 'pages.shipping_policy.seo_title', 'en', 'Shipping Policy', null, true),
  ('site', 'pages.shipping_policy.seo_description', 'hi', 'डिलीवरी और शिपिंग की जानकारी।', null, true),
  ('site', 'pages.shipping_policy.seo_description', 'en', 'Delivery and shipping information.', null, true),
  ('site', 'pages.shipping_policy.section.title', 'hi', 'शिपिंग विवरण', null, true),
  ('site', 'pages.shipping_policy.section.title', 'en', 'Shipping details', null, true),
  ('site', 'pages.shipping_policy.section.body', 'hi', 'डिलीवरी समय, पैकेजिंग और शिपिंग नियम इसी CMS रिकॉर्ड से नियंत्रित होंगे।', null, true),
  ('site', 'pages.shipping_policy.section.body', 'en', 'Delivery timelines, packaging, and shipping rules are controlled from this CMS record.', null, true)
on conflict (namespace, translation_key, language_code) do update set
  value_text = excluded.value_text,
  value_json = excluded.value_json,
  is_active = excluded.is_active;
