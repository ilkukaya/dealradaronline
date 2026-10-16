/**
 * Site and owner configuration.
 *
 * Everything brand- or owner-specific lives here so the site can be renamed
 * (for example after trademark clearance) without touching templates.
 * Values can be overridden at build time with PUBLIC_* environment variables
 * (set them in Netlify → Site configuration → Environment variables).
 *
 * Never put secrets in PUBLIC_* variables: they are embedded in the static HTML.
 */

const env = import.meta.env;

function read(key: string, fallback = ''): string {
  const value = env[key];
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : fallback;
}

function readBool(key: string, fallback = false): boolean {
  const value = read(key);
  if (value === '') return fallback;
  return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
}

const url = read('PUBLIC_SITE_URL', 'https://dealradaronline.com').replace(/\/+$/, '');

export const site = {
  /** Public brand name. The name is not a registered trademark of the operator. */
  name: read('PUBLIC_SITE_NAME', 'DealRadar Online'),
  /** Short name used in tight spaces (logo lockup, mobile header). */
  shortName: read('PUBLIC_SITE_SHORT_NAME', 'DealRadar'),
  tagline: read('PUBLIC_SITE_TAGLINE', 'Discover Deals. Save More.'),
  description: read(
    'PUBLIC_SITE_DESCRIPTION',
    'An independent US deal discovery site. We track standing discounts, student and military pricing, free-shipping thresholds, and coupons — with the restrictions and last-checked date on every offer.',
  ),
  url,
  domain: new URL(url).host,
  locale: 'en-US',
  language: 'en',
  currency: 'USD',
  timeZone: 'America/New_York',
  market: 'United States',
  /** Year the site launched, used in the copyright line. */
  foundedYear: Number(read('PUBLIC_FOUNDED_YEAR', '2026')),
  /** Social profiles. Leave empty until the profile actually exists. */
  social: {
    x: read('PUBLIC_SOCIAL_X'),
    pinterest: read('PUBLIC_SOCIAL_PINTEREST'),
    facebook: read('PUBLIC_SOCIAL_FACEBOOK'),
    instagram: read('PUBLIC_SOCIAL_INSTAGRAM'),
    threads: read('PUBLIC_SOCIAL_THREADS'),
  },
} as const;

/**
 * Operator details. These are displayed on the About, Contact, Privacy and Terms
 * pages only when provided. Do not fill these with placeholders — missing values
 * are listed in docs/LAUNCH_CHECKLIST.md as owner actions.
 */
export const owner = {
  /** Legal name of the person or business that operates the site. */
  legalName: read('PUBLIC_OWNER_LEGAL_NAME'),
  /** US state (or "City, State") whose law governs the Terms of Use. */
  jurisdiction: read('PUBLIC_OWNER_JURISDICTION'),
  /** Public contact email. Optional — the contact form works without it. */
  contactEmail: read('PUBLIC_CONTACT_EMAIL'),
  /** Postal address. Required before sending commercial email (CAN-SPAM). */
  mailingAddress: read('PUBLIC_MAILING_ADDRESS'),
} as const;

/** Name used when referring to the operator in legal copy. */
export const operatorName = owner.legalName || `the operator of ${site.name}`;

export const features = {
  /**
   * Show development fixtures (sample, non-real deals). Always false in
   * production builds unless explicitly enabled — fixtures are also noindexed.
   */
  showFixtures: env.DEV ? readBool('PUBLIC_SHOW_FIXTURES', true) : readBool('PUBLIC_SHOW_FIXTURES', false),
  /** Advertising stays off until an ad network has actually approved the site. */
  adsEnabled: readBool('PUBLIC_ADS_ENABLED', false),
} as const;

export const analytics = {
  /** Plausible: set to the site's domain as registered in Plausible. */
  plausibleDomain: read('PUBLIC_PLAUSIBLE_DOMAIN'),
  plausibleSrc: read('PUBLIC_PLAUSIBLE_SRC', 'https://plausible.io/js/script.tagged-events.outbound-links.js'),
  /** Umami: website ID and script URL (Umami Cloud or self-hosted). */
  umamiWebsiteId: read('PUBLIC_UMAMI_WEBSITE_ID'),
  umamiSrc: read('PUBLIC_UMAMI_SRC', 'https://cloud.umami.is/script.js'),
  /**
   * First-party, cookieless outbound-click counter backed by a Netlify Function
   * (netlify/functions/out.mts). Set PUBLIC_CLICK_ENDPOINT to an empty value
   * ("off") to disable.
   */
  clickEndpoint: read('PUBLIC_CLICK_ENDPOINT', '/api/out') === 'off' ? '' : read('PUBLIC_CLICK_ENDPOINT', '/api/out'),
} as const;

export const newsletter = {
  /**
   * "netlify"    — collect sign-ups with Netlify Forms (a waitlist; no emails are
   *                sent automatically). Default.
   * "buttondown" — post directly to Buttondown (requires PUBLIC_BUTTONDOWN_USERNAME).
   * "mailerlite" — post to a MailerLite embedded-form action URL
   *                (requires PUBLIC_MAILERLITE_FORM_ACTION).
   */
  provider: read('PUBLIC_NEWSLETTER_PROVIDER', 'netlify') as 'netlify' | 'buttondown' | 'mailerlite',
  buttondownUsername: read('PUBLIC_BUTTONDOWN_USERNAME'),
  mailerliteAction: read('PUBLIC_MAILERLITE_FORM_ACTION'),
} as const;

export const verification = {
  google: read('PUBLIC_GOOGLE_SITE_VERIFICATION'),
  bing: read('PUBLIC_BING_SITE_VERIFICATION'),
  pinterest: read('PUBLIC_PINTEREST_SITE_VERIFICATION'),
  /** Some affiliate networks ask for a meta tag to verify site ownership. */
  impact: read('PUBLIC_IMPACT_SITE_VERIFICATION'),
} as const;

/** Site-wide link monetization scripts. Off until the network approves the site. */
export const linkMonetization = {
  skimlinksPublisherId: read('PUBLIC_SKIMLINKS_PUBLISHER_ID'),
  sovrnCommerceKey: read('PUBLIC_SOVRN_COMMERCE_KEY'),
} as const;

export function absoluteUrl(path: string): string {
  if (/^https?:\/\//.test(path)) return path;
  return `${site.url}${path.startsWith('/') ? '' : '/'}${path}`;
}
