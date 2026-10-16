import { describe, expect, it } from 'vitest';
import { adapters, configuredAdapters } from '../src/lib/affiliate/adapters';
import { offerToDraft, slugify } from '../src/lib/affiliate/normalize';
import { AdapterNotConfiguredError, type NormalizedOffer } from '../src/lib/affiliate/types';
import { dealSchema } from '../src/lib/schemas';

const offer: NormalizedOffer = {
  sourceId: '1',
  network: 'cj',
  programId: '999',
  merchant: { slug: 'best-buy', name: 'Best Buy', domain: 'bestbuy.com', websiteUrl: 'https://www.bestbuy.com/' },
  title: 'Headphones sale',
  description: 'A normalized offer used in tests of the import pipeline.',
  offerType: 'sale',
  currency: 'USD',
  price: 50,
  referencePrice: 40, // invalid pair: must be dropped
  merchantUrl: 'https://www.bestbuy.com/x',
  affiliateUrl: 'https://www.anrdoezrs.net/click-1-2',
  restrictions: [],
};

describe('affiliate adapters', () => {
  it('report missing credentials instead of calling an API', async () => {
    await expect(adapters.cj!.fetchOffers({})).rejects.toBeInstanceOf(AdapterNotConfiguredError);
    expect(configuredAdapters({})).toHaveLength(0);
  });
  it('detect configuration from env', () => {
    expect(adapters.awin!.isConfigured({ AWIN_API_TOKEN: 'x', AWIN_PUBLISHER_ID: '1' })).toBe(true);
  });
});

describe('import normalization', () => {
  it('creates pending-verification drafts that validate and never publish automatically', () => {
    const draft = offerToDraft(offer, new Date('2026-10-16T12:00:00Z'));
    expect(draft.status).toBe('pending-verification');
    expect('referencePrice' in draft).toBe(false);
    expect(() => dealSchema.parse(draft)).not.toThrow();
    expect(() => dealSchema.parse({ ...draft, status: 'published' })).toThrow(); // TODO summary blocks publishing
  });
  it('slugifies titles', () => {
    expect(slugify('Best Buy: 20% off Headphones & Audio!')).toBe('best-buy-20-off-headphones-and-audio');
  });
});
