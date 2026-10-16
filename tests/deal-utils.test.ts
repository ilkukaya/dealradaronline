import { describe, expect, it } from 'vitest';
import {
  formatPrice,
  formatPriceWithPeriod,
  getDiscountPercent,
  getHeadline,
  getLifecycle,
  getOutboundLink,
  hasPublicPage,
  sortDeals,
} from '../src/lib/deal-utils';
import { dealSchema } from '../src/lib/schemas';

const base = {
  title: 'Sample offer title here',
  merchant: 'amazon',
  category: 'electronics-tech',
  offerType: 'sale',
  description: 'A sample description that is long enough.',
  editorialSummary: 'An editorial summary that is long enough to pass validation rules.',
  merchantUrl: 'https://www.amazon.com/x',
  sourceUrl: 'https://www.amazon.com/x',
  verificationMethod: 'merchant-page',
  lastVerified: '2026-10-01T12:00:00-04:00',
  publishedAt: '2026-10-01T12:00:00-04:00',
  status: 'published',
};
const deal = (over: Record<string, unknown> = {}) => dealSchema.parse({ ...base, ...over });
const now = new Date('2026-10-16T12:00:00-04:00');

describe('lifecycle', () => {
  it('treats published offers without dates as active', () => {
    expect(getLifecycle(deal(), now)).toBe('active');
  });
  it('expires published offers past their end date', () => {
    expect(getLifecycle(deal({ endDate: '2026-10-15T23:59:00-04:00' }), now)).toBe('expired');
  });
  it('marks future offers as upcoming', () => {
    expect(getLifecycle(deal({ startDate: '2026-11-01T00:00:00-04:00' }), now)).toBe('upcoming');
  });
  it('never shows drafts or pending offers', () => {
    expect(getLifecycle(deal({ status: 'draft' }), now)).toBe('unpublished');
    expect(getLifecycle(deal({ status: 'pending-verification' }), now)).toBe('unpublished');
    expect(hasPublicPage(deal({ status: 'pending-verification' }), true)).toBe(false);
    expect(hasPublicPage(deal({ status: 'archived' }), true)).toBe(false);
  });
  it('keeps explicitly expired offers reachable but not active', () => {
    const d = deal({ status: 'expired' });
    expect(getLifecycle(d, now)).toBe('expired');
    expect(hasPublicPage(d, false)).toBe(true);
  });
  it('hides fixtures unless enabled', () => {
    const d = deal({ fixture: true, merchantUrl: 'https://www.example.com/a', sourceUrl: 'https://www.example.com/a' });
    expect(hasPublicPage(d, false)).toBe(false);
    expect(hasPublicPage(d, true)).toBe(true);
  });
});

describe('prices and discounts', () => {
  it('rounds discounts down so savings are never overstated', () => {
    expect(getDiscountPercent(deal({ price: 7.49, referencePrice: 14.99 }))).toBe(50);
    expect(getDiscountPercent(deal({ price: 66.67, referencePrice: 100 }))).toBe(33);
  });
  it('uses a merchant-stated percentage only when no price pair exists', () => {
    expect(getDiscountPercent(deal({ statedPercentOff: 10 }))).toBe(10);
    expect(getDiscountPercent(deal({}))).toBeUndefined();
  });
  it('rejects a reference price that is not higher than the price', () => {
    expect(() => deal({ price: 20, referencePrice: 20 })).toThrow();
    expect(() => deal({ referencePrice: 20 })).toThrow();
  });
  it('formats USD prices', () => {
    expect(formatPrice(0)).toBe('Free');
    expect(formatPrice(35)).toBe('$35');
    expect(formatPrice(7.49)).toBe('$7.49');
    expect(formatPriceWithPeriod(6.99, 'month')).toBe('$6.99/mo');
    expect(formatPriceWithPeriod(49, 'year')).toBe('$49/yr');
  });
  it('builds a sensible headline', () => {
    expect(getHeadline(deal({ price: 6.99, pricePeriod: 'month', priceNote: 'after trial' }))).toEqual({ value: '$6.99/mo', note: 'after trial' });
    expect(getHeadline(deal({ statedPercentOff: 10 })).value).toBe('10% off');
    expect(getHeadline(deal({ offerType: 'shipping' })).value).toBe('Free shipping');
  });
});

describe('outbound links', () => {
  it('uses the plain merchant URL when no affiliate link is approved', () => {
    const link = getOutboundLink(deal());
    expect(link.kind).toBe('direct');
    expect(link.href).toBe('https://www.amazon.com/x');
    expect(link.rel).not.toContain('sponsored');
  });
  it('uses the affiliate URL and rel="sponsored" when approved', () => {
    const link = getOutboundLink(deal({ affiliateUrl: 'https://www.anrdoezrs.net/click-1-2', affiliateNetwork: 'cj' }));
    expect(link.kind).toBe('affiliate');
    expect(link.href).toBe('https://www.anrdoezrs.net/click-1-2');
    expect(link.rel).toContain('sponsored');
  });
  it('requires a network for any affiliate URL', () => {
    expect(() => deal({ affiliateUrl: 'https://www.anrdoezrs.net/click-1-2' })).toThrow();
  });
  it('rejects non-https and example URLs on real offers', () => {
    expect(() => deal({ merchantUrl: 'http://www.amazon.com/x' })).toThrow();
    expect(() => deal({ merchantUrl: 'https://www.example.com/x' })).toThrow();
  });
  it('blocks TODO placeholders on published offers', () => {
    expect(() => deal({ editorialSummary: 'TODO: write an original summary before publishing this.' })).toThrow();
    expect(() => deal({ status: 'pending-verification', editorialSummary: 'TODO: write an original summary before publishing this.' })).not.toThrow();
  });
});

describe('sorting', () => {
  const items = [
    { id: 'a', data: deal({ price: 10, referencePrice: 20, publishedAt: '2026-10-01' }) },
    { id: 'b', data: deal({ price: 5, publishedAt: '2026-10-03' }) },
    { id: 'c', data: deal({ statedPercentOff: 10, publishedAt: '2026-10-02' }) },
  ];
  it('sorts newest first', () => expect(sortDeals(items, 'newest').map((x) => x.id)).toEqual(['b', 'c', 'a']));
  it('sorts by price with unpriced offers last', () => expect(sortDeals(items, 'price-asc').map((x) => x.id)).toEqual(['b', 'a', 'c']));
  it('sorts by discount', () => expect(sortDeals(items, 'discount').map((x) => x.id)).toEqual(['a', 'c', 'b']));
});

describe('dates', async () => {
  const { formatDate } = await import('../src/lib/deal-utils');
  it('shows plain calendar dates as written', () => expect(formatDate(new Date('2026-10-16'))).toBe('Oct 16, 2026'));
  it('shows timestamps in Eastern time', () => expect(formatDate(new Date('2026-10-17T02:00:00Z'))).toBe('Oct 16, 2026'));
});
