/**
 * Affiliate networks the site is prepared to work with.
 *
 * `status` describes the *publisher account* for this site. Keep it honest:
 * only set "approved" after the network has actually approved the site.
 * Nothing on the public site claims a relationship based on this list alone —
 * public disclosures are driven by per-merchant program status in the merchant files.
 */

export const networkIds = ['flexoffers', 'cj', 'awin', 'skimlinks', 'sovrn', 'impact', 'rakuten', 'direct'] as const;
export type NetworkId = (typeof networkIds)[number];

export type PublisherAccountStatus = 'not-applied' | 'applied' | 'approved' | 'rejected' | 'paused';

export interface AffiliateNetwork {
  id: NetworkId;
  name: string;
  /** How links are produced: per-merchant deep links, or a site-wide script that rewrites links. */
  linkModel: 'deep-link' | 'script-rewrite' | 'merchant-program';
  publisherSignupUrl: string;
  /** Where to find current API / feed documentation once approved. */
  docsUrl: string;
  status: PublisherAccountStatus;
  /** Environment variables the integration reads. Never commit their values. */
  credentials: readonly string[];
  notes: string;
}

export const networks: Record<NetworkId, AffiliateNetwork> = {
  flexoffers: {
    id: 'flexoffers',
    name: 'FlexOffers',
    linkModel: 'deep-link',
    publisherSignupUrl: 'https://www.flexoffers.com/affiliate-programs/',
    docsUrl: 'https://publisherpro.flexoffers.com/',
    status: 'not-applied',
    credentials: ['FLEXOFFERS_API_KEY', 'FLEXOFFERS_DOMAIN_ID'],
    notes: 'Apply per advertiser after the publisher account is approved. Use links generated in the publisher dashboard or API.',
  },
  cj: {
    id: 'cj',
    name: 'CJ Affiliate',
    linkModel: 'deep-link',
    publisherSignupUrl: 'https://signup.cj.com/member/signup/publisher/',
    docsUrl: 'https://developers.cj.com/',
    status: 'not-applied',
    credentials: ['CJ_PERSONAL_ACCESS_TOKEN', 'CJ_COMPANY_ID', 'CJ_WEBSITE_ID'],
    notes: 'Advertisers approve publishers individually. Product and link data are available through CJ developer APIs once joined.',
  },
  awin: {
    id: 'awin',
    name: 'Awin',
    linkModel: 'deep-link',
    publisherSignupUrl: 'https://www.awin.com/us/publishers',
    docsUrl: 'https://wiki.awin.com/index.php/Publisher_API',
    status: 'not-applied',
    credentials: ['AWIN_API_TOKEN', 'AWIN_PUBLISHER_ID'],
    notes: 'US publisher sign-up may require a refundable deposit. Product feeds are licensed per advertiser.',
  },
  skimlinks: {
    id: 'skimlinks',
    name: 'Skimlinks',
    linkModel: 'script-rewrite',
    publisherSignupUrl: 'https://skimlinks.com/publishers/',
    docsUrl: 'https://developers.skimlinks.com/',
    status: 'not-applied',
    credentials: ['PUBLIC_SKIMLINKS_PUBLISHER_ID'],
    notes: 'Site-wide JavaScript converts eligible merchant links. Do not enable at the same time as Sovrn Commerce.',
  },
  sovrn: {
    id: 'sovrn',
    name: 'Sovrn Commerce',
    linkModel: 'script-rewrite',
    publisherSignupUrl: 'https://www.sovrn.com/publishers/commerce/',
    docsUrl: 'https://knowledge.sovrn.com/',
    status: 'not-applied',
    credentials: ['PUBLIC_SOVRN_COMMERCE_KEY'],
    notes: 'Site-wide JavaScript converts eligible merchant links. Do not enable at the same time as Skimlinks.',
  },
  impact: {
    id: 'impact',
    name: 'impact.com',
    linkModel: 'deep-link',
    publisherSignupUrl: 'https://impact.com/partners/',
    docsUrl: 'https://integrations.impact.com/',
    status: 'not-applied',
    credentials: ['IMPACT_ACCOUNT_SID', 'IMPACT_AUTH_TOKEN'],
    notes: 'Many large US retailers run programs on impact.com. Optional; not part of the initial application list.',
  },
  rakuten: {
    id: 'rakuten',
    name: 'Rakuten Advertising',
    linkModel: 'deep-link',
    publisherSignupUrl: 'https://rakutenadvertising.com/publishers/',
    docsUrl: 'https://developers.rakutenadvertising.com/',
    status: 'not-applied',
    credentials: ['RAKUTEN_SECURITY_TOKEN', 'RAKUTEN_SITE_ID'],
    notes: 'Optional; not part of the initial application list.',
  },
  direct: {
    id: 'direct',
    name: 'Merchant-direct program',
    linkModel: 'merchant-program',
    publisherSignupUrl: '',
    docsUrl: '',
    status: 'not-applied',
    credentials: [],
    notes: 'A merchant’s in-house affiliate program (for example Amazon Associates). Record approval per merchant.',
  },
};
