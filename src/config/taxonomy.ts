/**
 * Categories and discount programs.
 *
 * Category and program pages are generated from these lists, but a page is only
 * published when it has useful content (see src/lib/catalog.ts). Adding a
 * category here does not create an empty page.
 */

export const categories = [
  {
    slug: 'electronics-tech',
    name: 'Electronics & Tech',
    short: 'Tech',
    description:
      'Laptops, phones, TV, audio, and accessories — plus the shipping and return rules that matter most for big-ticket electronics.',
    icon: 'cpu',
  },
  {
    slug: 'home-kitchen',
    name: 'Home & Kitchen',
    short: 'Home',
    description:
      'Home improvement, appliances, kitchen gear, and everyday household shopping from major US retailers.',
    icon: 'home',
  },
  {
    slug: 'fashion',
    name: 'Fashion',
    short: 'Fashion',
    description: 'Clothing, shoes, and accessories, including standing discounts for students, teachers, and the military.',
    icon: 'shirt',
  },
  {
    slug: 'beauty-personal-care',
    name: 'Beauty & Personal Care',
    short: 'Beauty',
    description: 'Skincare, makeup, haircare, and personal care offers.',
    icon: 'sparkle',
  },
  {
    slug: 'travel',
    name: 'Travel',
    short: 'Travel',
    description: 'Flights, hotels, rental cars, and travel gear.',
    icon: 'plane',
  },
  {
    slug: 'local-experiences',
    name: 'Local Experiences',
    short: 'Local',
    description: 'Restaurants, activities, and things to do near you.',
    icon: 'pin',
  },
  {
    slug: 'software-digital',
    name: 'Software & Digital',
    short: 'Digital',
    description:
      'Streaming, music, audiobooks, apps, and developer tools — including student pricing and free trials.',
    icon: 'app',
  },
  {
    slug: 'memberships',
    name: 'Memberships & Subscriptions',
    short: 'Memberships',
    description:
      'Shopping memberships like Amazon Prime and Walmart+, with the discounted plans many people qualify for but never check.',
    icon: 'badge',
  },
  {
    slug: 'coupons-promo-codes',
    name: 'Coupons & Promo Codes',
    short: 'Coupons',
    description: 'Promo codes we have checked, with their exclusions and minimums spelled out.',
    icon: 'ticket',
  },
] as const;

export type CategorySlug = (typeof categories)[number]['slug'];
export const categorySlugs = categories.map((c) => c.slug) as [CategorySlug, ...CategorySlug[]];

/**
 * Discount programs group offers by *who qualifies* or *what kind of saving it is*.
 * Each maps to a landing page at /discounts/[slug]/.
 */
export const offerTypes = [
  {
    slug: 'student',
    name: 'Student Discounts',
    label: 'Student',
    description:
      'Standing discounts for college students in the US — what each one costs, how verification works, and when the student rate ends.',
  },
  {
    slug: 'military',
    name: 'Military Discounts',
    label: 'Military',
    description:
      'Everyday military discounts from US retailers, who qualifies, how status is verified, and the common exclusions.',
  },
  {
    slug: 'assistance',
    name: 'Discounts for Government Assistance Recipients',
    label: 'Assistance',
    description:
      'Reduced-price memberships for people who receive SNAP, Medicaid, SSI, WIC, and other qualifying benefits.',
  },
  {
    slug: 'trial',
    name: 'Free Trials',
    label: 'Free trial',
    description:
      'Free trials from major subscriptions, with the price you pay afterward and how to cancel before you are charged.',
  },
  {
    slug: 'shipping',
    name: 'Free Shipping Offers',
    label: 'Free shipping',
    description: 'Free-shipping thresholds and membership shipping perks at major US stores, with the fine print.',
  },
  {
    slug: 'coupon',
    name: 'Promo Codes',
    label: 'Promo code',
    description: 'Promo codes we have checked against the merchant’s own terms.',
  },
  {
    slug: 'sale',
    name: 'Sales & Price Drops',
    label: 'Sale',
    description: 'Time-limited sales and price drops with the regular price shown only when the merchant states it.',
  },
  {
    slug: 'other',
    name: 'Other Offers',
    label: 'Offer',
    description: 'Other savings programs and offers.',
  },
] as const;

export type OfferTypeSlug = (typeof offerTypes)[number]['slug'];
export const offerTypeSlugs = offerTypes.map((t) => t.slug) as [OfferTypeSlug, ...OfferTypeSlug[]];

export function getCategory(slug: string) {
  return categories.find((c) => c.slug === slug);
}

export function getOfferType(slug: string) {
  return offerTypes.find((t) => t.slug === slug);
}
