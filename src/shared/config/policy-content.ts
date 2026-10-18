export const businessProfile = {
  legalName: 'KumbhMelaStore',
  website: 'https://kumbhmelastore.in',
  supportEmail: 'hello@kumbhmelastore.in',
  supportPhone: '+91 8180891464',
  businessAddress: '5, Shivaji Nagar, Nashik - 422006',
  grievanceOfficer: '[Grievance officer details to be confirmed, if required]',
  supportHours: '[Customer support hours to be confirmed]',
} as const

export const unresolvedBusinessDetails = [
  'Grievance officer details (if required)',
  'Customer support hours',
] as const

export type PolicySection = {
  heading: string
  body?: string[]
  list?: string[]
  note?: string
}

export type PolicyMeta = {
  slug: string
  title: string
  description: string
  effectiveDate: string
  lastUpdated: string
  sections: PolicySection[]
}

export const policyContent: Record<'privacy' | 'terms' | 'shipping' | 'cancellation' | 'refund', PolicyMeta> = {
  privacy: {
    slug: 'privacy-policy',
    title: 'Privacy Policy',
    description:
      'How KumbhMelaStore collects, uses, stores and protects personal information for account, order and support operations.',
    effectiveDate: '18 October 2026',
    lastUpdated: '18 October 2026',
    sections: [
      {
        heading: '1. Information we collect',
        body: [
          'KumbhMelaStore may collect the personal information needed to create an account, place an order, provide customer support and fulfil delivery. This can include a customer name, email address, phone number, shipping address, order details, product selections, payment status and correspondence with support staff.',
          'If the customer creates an account, we may also store authentication data, locale preferences and profile details. The current application uses Supabase authentication and may support Google Sign-In when that provider is enabled in the Supabase project configuration.',
        ],
        list: [
          'Account information such as email address, password or OAuth identity details when using sign-in features.',
          'Contact and delivery information such as name, phone number, address and any landmark or delivery notes.',
          'Order details including item selections, billing or shipping status, payment status and tracking references.',
          'Customer-service information such as support conversations, messages and photographs if a dispute or product issue is reported.',
        ],
      },
      {
        heading: '2. How we use personal information',
        body: [
          'The information is used to operate the storefront, process orders, arrange delivery, handle payment status, provide account access, support order tracking and respond to customer inquiries. We may also use the information to manage product issues, fraud checks and operational communications.',
          'We do not sell personal data. However, information may be shared with service providers that process payments, provide delivery support, manage customer authentication or host the website and database infrastructure.',
        ],
      },
      {
        heading: '3. Cookies, sessions and technical data',
        body: [
          'The current application uses browser sessions and Supabase authentication to keep a customer signed in and preserve order or profile state. It may also store session information in cookies or browser storage to support account access and shopping flows.',
          'The codebase does not presently include a separate analytics, ad-tech or tracking SDK for marketing analytics. If such tools are introduced later, the relevant purpose, provider and consent steps will be disclosed here and in the interface before activation.',
        ],
      },
      {
        heading: '4. Third-party service providers',
        body: [
          'Relevant information is shared with providers that support the storefront and customer journey, including the application host, database provider, authentication provider, payment processor and delivery or shipping partners where relevant to an order.',
          'The exact provider list may change with operational needs. The store does not keep personal data in a separate private database beyond the project’s configured backend services.',
        ],
      },
      {
        heading: '5. Data storage, security and retention',
        body: [
          'KumbhMelaStore uses its configured backend and hosting platforms to maintain account and order records securely. We store personal information only as long as it is needed to operate the store, support legal obligations, manage customer enquiries and resolve disputes.',
          'Reasonable organisational and technical safeguards are used to reduce unauthorised access, loss or misuse. However, no online system can guarantee absolute security, and users should exercise normal caution with account credentials.',
        ],
        list: [
          'Account data is retained while the account remains active and for the period necessary to support order history, support requests and legal obligations.',
          'Order and delivery data may be retained for operational, tax, customer-support and fraud-prevention purposes as applicable.',
          'If the store is required to delete or restrict data under applicable law, the request will be assessed in line with lawful retention and contractual obligations.',
        ],
      },
      {
        heading: '6. Data deletion, correction and access requests',
        body: [
          'Customers may request access to, correction of or deletion of personal information where the law or the platform allows such a request. Please contact the support email with the relevant order number or account details so the request can be reviewed.',
          'Some records may need to be retained for legal, tax, dispute-resolution or operational reasons, so deletion may not always be possible in full. If a request is refused, the reason will be explained as far as is lawful and practical.',
        ],
      },
      {
        heading: '7. Children’s privacy',
        body: [
          'The website is intended for general consumers and is not directed at children below the age at which they may lawfully enter into a purchase or consent to data processing under applicable law. Parents or guardians who believe a child has shared information without proper consent should contact the support team immediately.',
        ],
      },
      {
        heading: '8. Contact, grievances and updates',
        body: [
          'For privacy questions, requests or complaints, email the support team at hello@kumbhmelastore.in. A registered business address, grievance officer information and support phone number will be added to this policy as soon as they are confirmed by the business.',
          'KumbhMelaStore may update this policy from time to time to reflect operational changes, legal requirements or service-provider updates. The effective date above will be revised when changes are made.',
        ],
      },
    ],
  },
  terms: {
    slug: 'terms-and-conditions',
    title: 'Terms and Conditions',
    description:
      'Terms of use for browsing, ordering and supporting purchases on KumbhMelaStore.',
    effectiveDate: '18 October 2026',
    lastUpdated: '18 October 2026',
    sections: [
      {
        heading: '1. Eligibility and website use',
        body: [
          'The website is operated by KumbhMelaStore and is intended for persons who are able to enter into legally binding agreements under Indian law. Customers may browse products and place orders only where the website and applicable laws allow them to do so.',
          'By using the website, customers agree to use it for lawful purposes and not to interfere with the security, operation or integrity of the platform, account systems or other users.',
        ],
      },
      {
        heading: '2. Accounts and accurate information',
        body: [
          'Customers may create an account to track orders, save preferences or complete checkouts. Account holders are responsible for keeping their login credentials secure and for ensuring that the information provided is accurate, current and complete.',
          'The application may support Google Sign-In when enabled by the project configuration. Where OAuth is used, the provider handles the authentication flow and the store receives the required user identity and profile information for account access.',
        ],
      },
      {
        heading: '3. Product information, availability and pricing',
        body: [
          'Descriptions, photographs and pricing are provided in good faith and may be updated from time to time. Product availability and pricing can change before an order is accepted, especially where catalog records or stock status are updated by the admin team.',
          'KumbhMelaStore may correct listing errors, verify product details and utilise current catalogue data when preparing an order. If a product is unavailable or a price is incorrect, the store may reject or cancel the order in line with its operational process.',
        ],
      },
      {
        heading: '4. Orders, confirmations and acceptance',
        body: [
          'A customer may submit an order through the website. An order confirmation or acknowledgement screen does not necessarily mean that the store has accepted the order. KumbhMelaStore may review, reject, cancel or modify an order before or after confirmation if stock, pricing, payment, fulfilment or compliance issues arise.',
          'The store may also cancel an order where it is unable to fulfil the order, where the information provided is inaccurate or where the order should not proceed for operational or legal reasons.',
        ],
      },
      {
        heading: '5. Payment, COD and shipping terms',
        body: [
          'The current checkout flow in this application supports cash-on-delivery ordering. Payment terms, shipping eligibility, delivery charges and related conditions are shown before a customer confirms the purchase where the app currently provides that information.',
          'Shipping charges, delivery regions and fulfilment conditions are product- or cart-dependent and should be reviewed on the relevant product page, cart summary or checkout page before completion of purchase.',
        ],
      },
      {
        heading: '6. Promotions, discounts and loyalty benefits',
        body: [
          'Any coupons, promotions, loyalty benefits or discount campaigns are subject to the precise terms stated for that offer, including validity periods, eligibility criteria and product restrictions. Where an offer is not explicitly stated in the website flow, it may not be available or may be withdrawn at the retailer’s discretion.',
        ],
      },
      {
        heading: '7. Intellectual property and permitted use',
        body: [
          'All website content, design elements, trademarks, product images, catalog copy and other materials are owned by KumbhMelaStore or its licensors unless otherwise stated. Customers may browse and use the website for personal shopping purposes only and may not copy, redistribute or republish protected content without written permission.',
        ],
      },
      {
        heading: '8. Prohibited conduct and misuse',
        body: [
          'Customers must not use the website to impersonate others, circulate fraud, manipulate reviews or promotions, attempt unauthorised access, upload harmful content or otherwise violate applicable law. The store may suspend or block accounts where such conduct is suspected or confirmed.',
        ],
      },
      {
        heading: '9. Product defects, damage and remedies',
        body: [
          'If a product is defective, damaged, incorrect or materially misdescribed, customers may raise the issue with the support team. The store will review the facts and may offer a replacement, repair, refund or another lawful remedy depending on the specific circumstances and applicable law.',
          'These terms do not limit any statutory rights that customers may have under Indian consumer law, including rights relating to defective goods or remedies for misrepresentation or non-conformity.',
        ],
      },
      {
        heading: '10. Limitations, force majeure and changes',
        body: [
          'KumbhMelaStore aims to provide a dependable shopping experience, but it is not responsible for delays or losses caused by events outside its reasonable control, including strikes, severe weather, transport disruption, supply constraints, regulatory changes or acts of government.',
          'The store may change services, features, policies or these terms from time to time. Continued use of the website after changes are posted indicates acceptance of the updated terms.',
        ],
      },
      {
        heading: '11. Governing law and contact',
        body: [
          'These terms are governed by the laws of India, and disputes shall be subject to the competent courts of the jurisdiction where the business operates and where any relevant legal proceedings may be brought under applicable law. Customers may contact the support team for questions or grievance escalation at hello@kumbhmelastore.in.',
        ],
      },
    ],
  },
  shipping: {
    slug: 'shipping-policy',
    title: 'Shipping and Delivery Policy',
    description:
      'Shipping rules, delivery regions, order processing times and product-specific conditions for KumbhMelaStore orders.',
    effectiveDate: '18 October 2026',
    lastUpdated: '18 October 2026',
    sections: [
      {
        heading: '1. Shipping eligibility and charges',
        body: [
          'Shipping eligibility and charges are product-, destination- and order-dependent, and they must be displayed on the relevant product page, cart or checkout page before the customer confirms the purchase. Free shipping or store-paid shipping may apply only where the app explicitly indicates that condition.',
          'The current checkout summary in this application states that shipping and tax are not configured and are currently zero. This is the present operating position in the codebase and should be treated as an admin-editable placeholder until a live shipping policy is configured.',
        ],
      },
      {
        heading: '2. Delivery regions and restrictions',
        body: [
          'Shipping destinations may be limited by stock availability, carrier conditions, product category, weight or service area. Some products or locations may be excluded from delivery or may require a different fulfilment workflow.',
          'Customers should check the product, cart and checkout pages for the current delivery regions and restrictions before placing an order.',
        ],
      },
      {
        heading: '3. Order processing and transit times',
        body: [
          'Order processing time is the time needed to prepare and validate the order before dispatch. Transit time is the time taken by the carrier after dispatch. The store may require additional time during peak demand periods, festival sales, stock verification or supply constraints.',
          'Estimated delivery dates are indicative only and may shift because of carrier performance, weather, public holidays, address issues or operational delays. KumbhMelaStore does not guarantee a fixed delivery date unless it is expressly confirmed in writing.',
        ],
      },
      {
        heading: '4. Tracking, delivery partners and partial fulfilment',
        body: [
          'Where tracking is available, the customer receives the tracking code or order status updates through the order flow and dashboard. Delivery partners may be involved in transport and last-mile delivery, but the store remains responsible for the order fulfilment steps it controls.',
          'Orders may be dispatched in a single shipment or in multiple shipments, depending on stock availability and product handling requirements. Partial fulfilment should be expected where items are sourced or packed separately.',
        ],
      },
      {
        heading: '5. Incorrect addresses and failed deliveries',
        body: [
          'Customers must provide a complete and accurate delivery address, including any required pin code, landmark and contact number. If an address is incomplete, incorrect or cannot be accessed, delivery may be delayed or return to origin. KumbhMelaStore may ask the customer to update the address or contact support to resolve the issue.',
          'Failed delivery attempts due to an unavailability, refusal, incorrect address or non-payment of COD may result in reattempts, additional charges or return-to-origin handling as determined by the carrier and the order conditions.',
        ],
      },
      {
        heading: '6. Undeliverable, refused and returned-to-origin shipments',
        body: [
          'Where a shipment is undeliverable, refused or returned to origin, the customer may be required to pay the relevant re-shipping or return charges, if the store or the carrier imposes them under the order terms or applicable law. The final outcome depends on the actual order circumstances and any carrier policies.',
        ],
      },
      {
        heading: '7. Lost, damaged or missing parcels',
        body: [
          'If a parcel is delayed, lost, damaged or missing, the customer should contact the support team as soon as practical and provide the order number and any supporting evidence. For damaged or defective goods, a claim may be reviewed under the refund and replacement policy and the product may be replaced or refunded where permissible.',
        ],
      },
      {
        heading: '8. Cancellation-related shipping charges',
        body: [
          'Shipping charges associated with cancelled, refused or returned orders are subject to the circumstances of the order, any carrier policy and applicable law. KumbhMelaStore may not refund shipping costs where they were directly incurred for a specific shipment and are non-recoverable, but customers should review the cancellation and return policies for the final position.',
        ],
      },
    ],
  },
  cancellation: {
    slug: 'cancellation-policy',
    title: 'Cancellation Policy',
    description:
      'How KumbhMelaStore handles cancellation requests for prepaid and cash-on-delivery orders.',
    effectiveDate: '18 October 2026',
    lastUpdated: '18 October 2026',
    sections: [
      {
        heading: '1. How to request cancellation',
        body: [
          'A customer may request cancellation by contacting the support team through the order or support contact channels and mentioning the order number, relevant product and the reason for the cancellation. The request will be reviewed after the order is placed but before fulfilment is finalised, subject to the current operational workflow.',
        ],
      },
      {
        heading: '2. When cancellation is possible',
        body: [
          'Cancellation may be accepted before the order is packed, dispatched or otherwise irrevocably committed to fulfilment. Once packing, dispatch or physical handover has begun, cancellation may no longer be possible unless the store agrees to assist or a legal remedy applies.',
          'The store may also cancel an order on its own initiative where stock is unavailable, pricing terms are corrected, fulfilment cannot be guaranteed or there is a legitimate operational concern. In such cases, the customer will be informed and any payment already made will be processed in line with the payment policy.',
        ],
      },
      {
        heading: '3. Prepaid and COD orders',
        body: [
          'Prepaid orders may be cancelled before dispatch, and the paid amount will be reversed to the original payment method if the cancellation is accepted. Cash-on-delivery orders are normally cancelled before dispatch or delivery is attempted; if the order has already been dispatched, the customer must follow the return or refund process, subject to the actual circumstances.',
        ],
      },
      {
        heading: '4. Cancellation versus returns',
        body: [
          'Cancelling an order before shipment is different from returning an already delivered product. If a product has already been delivered, the return policy applies, including any product defect, fulfilment issue or legally required remedy. A cancellation request does not automatically create a return right.',
        ],
      },
      {
        heading: '5. Legal exceptions and customer rights',
        body: [
          'This policy does not exclude mandatory consumer rights. If a product is defective, unsafe, materially misdescribed or otherwise non-conforming, the customer may be entitled to lawful remedies even where the store’s general preference is not to accept ordinary change-of-mind cancellations.',
        ],
      },
    ],
  },
  refund: {
    slug: 'refund-policy',
    title: 'Returns, Refunds and Replacement Policy',
    description:
      'How KumbhMelaStore handles ordinary returns, defective goods and approved refunds or replacements.',
    effectiveDate: '18 October 2026',
    lastUpdated: '18 October 2026',
    sections: [
      {
        heading: '1. Ordinary change-of-mind returns',
        body: [
          'KumbhMelaStore generally does not accept ordinary change-of-mind returns or refunds where legally permitted to restrict such returns. Customers should review product details, dimensions, material, shipping address and order details carefully before placing an order.',
          'This commercial position does not remove any rights customers may have in applicable circumstances, especially in relation to defective, damaged, unsafe, wrong or misdescribed goods.',
        ],
      },
      {
        heading: '2. How to report a problem',
        body: [
          'Customers who receive a damaged, defective, incorrect or materially misdescribed item should contact the support team promptly and provide the order number, a description of the issue and supporting photographs if relevant. Reasonable evidence may be required to assess the complaint and determine the best remedy.',
        ],
      },
      {
        heading: '3. Review and remedy options',
        body: [
          'Each complaint is reviewed on its facts. Depending on the circumstances, the store may offer a replacement, repair, refund, partial refund or other lawful remedy. The remedy depends on the nature of the defect, how the product differs from the description and whether the issue was caused by fulfilment, delivery damage or product quality.',
        ],
      },
      {
        heading: '4. Refund processing',
        body: [
          'Where a refund is approved or legally required, the store will normally process it through the original payment method, unless a lawful alternative is necessary or agreed. Refunds are subject to the payment processor and banking timelines, and the customer should allow time for the financial institution to complete the reversal.',
        ],
      },
      {
        heading: '5. Shipping and return costs',
        body: [
          'Shipping charges may be borne by the customer for an ordinary return request that is not accepted, but shipping costs may be reimbursed or waived where a lawful remedy applies, the item is defective, the order is incorrect or the store has caused the issue. The final position depends on applicable law and the specific order circumstances.',
        ],
      },
      {
        heading: '6. Escalation and support',
        body: [
          'For unresolved disputes, customers may escalate the issue to the support team with the order number and all relevant evidence. The support team will review the facts and communicate the next steps, which may include additional documentation, a replacement, a refund or another lawful resolution.',
        ],
      },
    ],
  },
}
