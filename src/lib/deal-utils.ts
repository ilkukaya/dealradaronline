/**
 * Pure helpers for offers: lifecycle state, prices, discounts, outbound links.
 * No Astro imports here so everything is unit-testable (see tests/).
 */
import type { DealData } from './schemas';
import type { NetworkId } from './affiliate/networks';

export type DealLifecycle = 'active' | 'upcoming' | 'expired' | 'unpublished';

/**
 * The state a reader should see. Only `published` entries can be active; a
 * published entry past its end date is treated as expired automatically.
 */
export function getLifecycle(deal: Pick<DealData, 'status' | 'startDate' | 'endDate'>, now: Date = new Date()): DealLifecycle {
  if (deal.status === 'expired') return 'expired';
  if (deal.status !== 'published') return 'unpublished';
  if (deal.endDate && deal.endDate.getTime() < now.getTime()) return 'expired';
  if (deal.startDate && deal.startDate.getTime() > now.getTime()) return 'upcoming';
  return 'active';
}

/** Whether a deal page should be built at all. Expired deals keep their URL (noindexed). */
export function hasPublicPage(deal: Pick<DealData, 'status' | 'fixture'>, showFixtures: boolean): boolean {
  if (deal.fixture && !showFixtures) return false;
  return deal.status === 'published' || deal.status === 'expired';
}

/**
 * Discount percentage, rounded down so we never overstate it.
 * Uses the price pair when both exist, otherwise a merchant-stated percentage.
 */
export function getDiscountPercent(deal: Pick<DealData, 'price' | 'referencePrice' | 'statedPercentOff'>): number | undefined {
  if (deal.price !== undefined && deal.referencePrice !== undefined && deal.referencePrice > deal.price) {
    const pct = Math.floor(((deal.referencePrice - deal.price) / deal.referencePrice) * 100);
    return pct >= 1 ? pct : undefined;
  }
  return deal.statedPercentOff;
}

const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const usdWhole = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

export function formatPrice(amount: number): string {
  if (amount === 0) return 'Free';
  return Number.isInteger(amount) ? usdWhole.format(amount) : usd.format(amount);
}

export function formatPriceWithPeriod(amount: number, period: DealData['pricePeriod']): string {
  const base = formatPrice(amount);
  if (amount === 0) return base;
  if (period === 'month') return `${base}/mo`;
  if (period === 'year') return `${base}/yr`;
  return base;
}

/** Headline value for a card: a price, a percentage, or a short label. */
export function getHeadline(deal: DealData): { value: string; note?: string } {
  if (deal.price !== undefined) {
    return {
      value: formatPriceWithPeriod(deal.price, deal.pricePeriod),
      ...(deal.priceNote ? { note: deal.priceNote } : {}),
    };
  }
  if (deal.statedPercentOff !== undefined) return { value: `${deal.statedPercentOff}% off` };
  if (deal.offerType === 'shipping') return { value: 'Free shipping' };
  if (deal.couponCode) return { value: 'Promo code' };
  return { value: 'See offer' };
}

export type OutboundLink = {
  href: string;
  kind: 'affiliate' | 'direct';
  network?: NetworkId;
  rel: string;
};

/**
 * The single place that decides where a "Go to store" button points.
 * Uses the approved affiliate URL when present; otherwise the plain merchant URL.
 * Affiliate links are marked rel="sponsored" per Google's guidance.
 */
export function getOutboundLink(deal: Pick<DealData, 'affiliateUrl' | 'affiliateNetwork' | 'merchantUrl'>): OutboundLink {
  if (deal.affiliateUrl && deal.affiliateNetwork) {
    return {
      href: deal.affiliateUrl,
      kind: 'affiliate',
      network: deal.affiliateNetwork,
      rel: 'sponsored nofollow noopener',
    };
  }
  return { href: deal.merchantUrl, kind: 'direct', rel: 'nofollow noopener' };
}

export function isAffiliateLink(deal: Pick<DealData, 'affiliateUrl' | 'affiliateNetwork'>): boolean {
  return Boolean(deal.affiliateUrl && deal.affiliateNetwork);
}

export type SortKey = 'newest' | 'price-asc' | 'price-desc' | 'discount';

type Sortable = Pick<DealData, 'publishedAt' | 'price' | 'referencePrice' | 'statedPercentOff' | 'featured'>;

/** Sorting used both at build time and (mirrored) in the browser filter script. */
export function sortDeals<T extends { data: Sortable }>(items: T[], key: SortKey): T[] {
  const copy = [...items];
  const byNewest = (a: T, b: T) => b.data.publishedAt.getTime() - a.data.publishedAt.getTime();
  switch (key) {
    case 'price-asc':
      return copy.sort((a, b) => (a.data.price ?? Infinity) - (b.data.price ?? Infinity) || byNewest(a, b));
    case 'price-desc':
      return copy.sort((a, b) => (b.data.price ?? -Infinity) - (a.data.price ?? -Infinity) || byNewest(a, b));
    case 'discount':
      return copy.sort((a, b) => (getDiscountPercent(b.data) ?? -1) - (getDiscountPercent(a.data) ?? -1) || byNewest(a, b));
    default:
      return copy.sort(byNewest);
  }
}

const dateFmt = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', month: 'short', day: 'numeric', year: 'numeric' });
const dateTimeFmt = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/New_York',
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  timeZoneName: 'short',
});

const dateOnlyFmt = new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', month: 'short', day: 'numeric', year: 'numeric' });

/** True for values written as a plain date (YAML `2026-10-16`), which parse as UTC midnight. */
function isDateOnly(d: Date): boolean {
  return d.getUTCHours() === 0 && d.getUTCMinutes() === 0 && d.getUTCSeconds() === 0 && d.getUTCMilliseconds() === 0;
}

/** Dates are displayed in US Eastern time; plain calendar dates are shown as written. */
export function formatDate(d: Date): string {
  return isDateOnly(d) ? dateOnlyFmt.format(d) : dateFmt.format(d);
}

export function formatDateTime(d: Date): string {
  return dateTimeFmt.format(d);
}

export function daysBetween(a: Date, b: Date): number {
  return Math.floor(Math.abs(b.getTime() - a.getTime()) / 86_400_000);
}

/** Offers checked more than this many days ago get a "check before you buy" note. */
export const STALE_AFTER_DAYS = 30;
