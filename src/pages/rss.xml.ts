import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { site } from '../config/site';
import { getActiveDeals, getGuides, getMerchantMap, isDealIndexable } from '../lib/catalog';

/** Feed of newly published guides and active, real offers (newest first). */
export async function GET(context: APIContext) {
  const [deals, guides, merchants] = await Promise.all([getActiveDeals(), getGuides(), getMerchantMap()]);
  const items = [
    ...deals.filter(isDealIndexable).map((d) => ({
      title: d.data.title,
      link: `/deals/${d.id}/`,
      pubDate: d.data.publishedAt,
      description: `${d.data.description} (Store: ${merchants.get(d.data.merchant)?.data.name ?? d.data.merchant}. Last checked ${d.data.lastVerified.toISOString().slice(0, 10)}.)`,
      categories: ['Deals'],
    })),
    ...guides.map((g) => ({
      title: g.data.title,
      link: `/guides/${g.id}/`,
      pubDate: g.data.publishedAt,
      description: g.data.summary,
      categories: ['Guides'],
    })),
  ].sort((a, b) => b.pubDate.getTime() - a.pubDate.getTime());

  return rss({
    title: `${site.name} — New deals and guides`,
    description: site.description,
    site: context.site ?? site.url,
    items,
    customData: '<language>en-us</language>',
    trailingSlash: true,
  });
}
