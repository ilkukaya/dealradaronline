/**
 * Build-time data access. All pages read content through these helpers so the
 * publishing rules (fixtures, expiry, thin-page suppression) live in one place.
 */
import { getCollection, type CollectionEntry } from 'astro:content';
import { features } from '../config/site';
import { categories, offerTypes, type CategorySlug, type OfferTypeSlug } from '../config/taxonomy';
import { getLifecycle, hasPublicPage, sortDeals } from './deal-utils';

export type Deal = CollectionEntry<'deals'>;
export type Merchant = CollectionEntry<'merchants'>;
export type Guide = CollectionEntry<'guides'>;

/** The moment this build runs. Static pages reflect state at build time; a daily rebuild keeps expiry fresh. */
export const BUILD_TIME = new Date();

let merchantCache: Map<string, Merchant> | undefined;

export async function getMerchantMap(): Promise<Map<string, Merchant>> {
  if (!merchantCache) {
    const all = await getCollection('merchants');
    merchantCache = new Map(all.map((m) => [m.id, m]));
  }
  return merchantCache;
}

export async function getPublishedMerchants(): Promise<Merchant[]> {
  const map = await getMerchantMap();
  return [...map.values()].filter((m) => m.data.status === 'published').sort((a, b) => a.data.name.localeCompare(b.data.name));
}

/** Every deal that may have a public page (published or expired; fixtures only when enabled). */
export async function getDealsWithPages(): Promise<Deal[]> {
  const merchants = await getMerchantMap();
  const all = await getCollection('deals');
  for (const d of all) {
    if (!merchants.has(d.data.merchant)) {
      throw new Error(`Deal "${d.id}" references unknown merchant "${d.data.merchant}". Add src/content/merchants/${d.data.merchant}.yaml.`);
    }
  }
  return sortDeals(
    all.filter((d) => hasPublicPage(d.data, features.showFixtures)),
    'newest',
  );
}

export async function getActiveDeals(): Promise<Deal[]> {
  return (await getDealsWithPages()).filter((d) => getLifecycle(d.data, BUILD_TIME) === 'active');
}

export function isActive(deal: Deal): boolean {
  return getLifecycle(deal.data, BUILD_TIME) === 'active';
}

/** A deal page is indexable only when the offer is active and real (not a fixture). */
export function isDealIndexable(deal: Deal): boolean {
  return isActive(deal) && !deal.data.fixture;
}

export async function getGuides(): Promise<Guide[]> {
  const all = await getCollection('guides');
  return all
    .filter((g) => !g.data.draft)
    .sort((a, b) => (b.data.updatedAt ?? b.data.publishedAt).getTime() - (a.data.updatedAt ?? a.data.publishedAt).getTime());
}

/** Merchants whose links are currently affiliate links (an approved program exists). */
export function merchantHasApprovedProgram(m: Merchant): boolean {
  return m.data.affiliatePrograms.some((p) => p.status === 'approved');
}

/**
 * A store page is indexed when it has at least one active offer, or enough
 * sourced policy facts to be genuinely useful on its own.
 */
export function isStoreIndexable(m: Merchant, activeOfferCount: number): boolean {
  return m.data.status === 'published' && (activeOfferCount > 0 || m.data.facts.length >= 2);
}

export type CategoryWithContent = (typeof categories)[number] & { deals: Deal[]; guides: Guide[] };

/** Only categories with at least one active offer get a page. */
export async function getCategoriesWithContent(): Promise<CategoryWithContent[]> {
  const [deals, guides] = await Promise.all([getActiveDeals(), getGuides()]);
  return categories
    .map((c) => ({
      ...c,
      deals: deals.filter((d) => d.data.category === c.slug),
      guides: guides.filter((g) => g.data.category === c.slug),
    }))
    .filter((c) => c.deals.length > 0);
}

export type OfferTypeWithContent = (typeof offerTypes)[number] & { deals: Deal[]; guides: Guide[] };

/** Discount-program landing pages need at least two active offers to avoid thin pages. */
export const MIN_OFFERS_FOR_PROGRAM_PAGE = 2;

export async function getOfferTypesWithContent(): Promise<OfferTypeWithContent[]> {
  const [deals, guides] = await Promise.all([getActiveDeals(), getGuides()]);
  return offerTypes
    .map((t) => ({
      ...t,
      deals: deals.filter((d) => d.data.offerType === t.slug),
      guides: guides.filter((g) => g.data.relatedOfferTypes.includes(t.slug)),
    }))
    .filter((t) => t.deals.length >= MIN_OFFERS_FOR_PROGRAM_PAGE);
}

export async function getDealsForMerchant(merchantId: string): Promise<Deal[]> {
  return (await getDealsWithPages()).filter((d) => d.data.merchant === merchantId);
}

/** Related offers: same offer type or category, excluding the deal itself, active only. */
export async function getRelatedDeals(deal: Deal, limit = 3): Promise<Deal[]> {
  const active = (await getActiveDeals()).filter((d) => d.id !== deal.id);
  const score = (d: Deal) =>
    (d.data.offerType === deal.data.offerType ? 2 : 0) + (d.data.category === deal.data.category ? 1 : 0) + (d.data.merchant === deal.data.merchant ? 1 : 0);
  return active
    .map((d) => ({ d, s: score(d) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, limit)
    .map((x) => x.d);
}

export async function getRelatedGuidesForDeal(deal: Deal, limit = 2): Promise<Guide[]> {
  const guides = await getGuides();
  const matches = guides.filter(
    (g) => g.data.relatedOfferTypes.includes(deal.data.offerType as OfferTypeSlug) || g.data.relatedStores.includes(deal.data.merchant) || g.data.category === (deal.data.category as CategorySlug),
  );
  return (matches.length ? matches : guides).slice(0, limit);
}

export function readingMinutes(body: string | undefined): number {
  const words = (body ?? '').split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 230));
}
