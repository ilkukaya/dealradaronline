/**
 * Turns a normalized network offer into a deal file body (YAML-ready object)
 * with status "pending-verification". An editor must confirm the terms, write
 * the editorial summary, and change the status to "published".
 */
import type { NormalizedOffer } from './types';

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
    .replace(/-+$/g, '');
}

export function offerToDraft(offer: NormalizedOffer, now: Date = new Date()) {
  const hasValidPricePair = offer.price !== undefined && offer.referencePrice !== undefined && offer.referencePrice > offer.price;
  return {
    title: offer.title.slice(0, 140),
    merchant: offer.merchant.slug,
    category: offer.category ?? 'coupons-promo-codes',
    offerType: offer.offerType,
    description: offer.description.slice(0, 320),
    editorialSummary: 'TODO: write an original summary — who this is for and what to watch out for. (Required before publishing.)',
    restrictions: offer.restrictions,
    currency: 'USD' as const,
    ...(offer.price !== undefined ? { price: offer.price } : {}),
    ...(hasValidPricePair ? { referencePrice: offer.referencePrice } : {}),
    ...(offer.coupon?.code ? { couponCode: offer.coupon.code } : {}),
    merchantUrl: offer.merchantUrl,
    affiliateUrl: offer.affiliateUrl,
    affiliateNetwork: offer.network,
    sourceUrl: offer.merchantUrl,
    verificationMethod: 'network-feed' as const,
    lastVerified: (offer.sourceUpdatedAt ?? now).toISOString(),
    ...(offer.startDate ? { startDate: offer.startDate.toISOString() } : {}),
    ...(offer.endDate ? { endDate: offer.endDate.toISOString() } : {}),
    publishedAt: now.toISOString(),
    status: 'pending-verification' as const,
  };
}
