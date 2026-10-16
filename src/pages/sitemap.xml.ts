import type { APIContext } from 'astro';
import { absoluteUrl } from '../config/site';
import {
  BUILD_TIME,
  getActiveDeals,
  getCategoriesWithContent,
  getDealsWithPages,
  getGuides,
  getOfferTypesWithContent,
  getPublishedMerchants,
  isDealIndexable,
  isStoreIndexable,
} from '../lib/catalog';
import { POLICY_DATES } from '../config/policies';

/**
 * Hand-built sitemap so it only lists indexable URLs: no expired offers,
 * fixtures, thin store pages, thank-you pages, or filtered URLs.
 */
export async function GET(_context: APIContext) {
  const [deals, active, merchants, cats, programs, guides] = await Promise.all([
    getDealsWithPages(),
    getActiveDeals(),
    getPublishedMerchants(),
    getCategoriesWithContent(),
    getOfferTypesWithContent(),
    getGuides(),
  ]);
  const latest = (dates: Date[]) => new Date(Math.max(...dates.map((d) => d.getTime()), 0));
  const latestDeal = active.length ? latest(active.map((d) => d.data.updatedAt ?? d.data.lastVerified)) : BUILD_TIME;

  const urls: { loc: string; lastmod?: Date | undefined }[] = [
    { loc: '/', lastmod: latestDeal },
    { loc: '/deals/', lastmod: latestDeal },
    { loc: '/stores/' },
    { loc: '/categories/' },
    { loc: '/discounts/' },
    { loc: '/guides/', lastmod: guides.length ? latest(guides.map((g) => g.data.updatedAt ?? g.data.publishedAt)) : undefined },
    { loc: '/about/' },
    { loc: '/how-we-find-deals/', lastmod: POLICY_DATES.howWeFind },
    { loc: '/editorial-policy/', lastmod: POLICY_DATES.editorial },
    { loc: '/affiliate-disclosure/', lastmod: POLICY_DATES.affiliate },
    { loc: '/privacy/', lastmod: POLICY_DATES.privacy },
    { loc: '/terms/', lastmod: POLICY_DATES.terms },
    { loc: '/cookies/', lastmod: POLICY_DATES.cookies },
    { loc: '/contact/' },
    { loc: '/partners/' },
    { loc: '/newsletter/' },
    ...deals.filter(isDealIndexable).map((d) => ({ loc: `/deals/${d.id}/`, lastmod: d.data.updatedAt ?? d.data.lastVerified })),
    ...merchants
      .filter((m) => isStoreIndexable(m, active.filter((d) => d.data.merchant === m.id).length))
      .map((m) => ({ loc: `/stores/${m.id}/` })),
    ...cats.map((c) => ({ loc: `/categories/${c.slug}/` })),
    ...programs.map((p) => ({ loc: `/discounts/${p.slug}/` })),
    ...guides.map((g) => ({ loc: `/guides/${g.id}/`, lastmod: g.data.updatedAt ?? g.data.publishedAt })),
  ];

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map((u) => `  <url><loc>${absoluteUrl(u.loc)}</loc>${u.lastmod && u.lastmod.getTime() > 0 ? `<lastmod>${u.lastmod.toISOString()}</lastmod>` : ''}</url>`)
  .join('\n')}
</urlset>
`;
  return new Response(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
}
