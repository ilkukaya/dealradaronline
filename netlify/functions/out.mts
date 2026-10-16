/**
 * First-party, cookieless outbound-click counter.
 *
 * The browser sends a small beacon when a visitor clicks a link to a store
 * (src/scripts/site.ts). We store one tiny record per click in Netlify Blobs:
 * offer slug, store slug, link type, placement, page path, and timestamp.
 * No IP address, cookie, user agent, or other identifier is stored.
 *
 * Read aggregated counts with:  GET /api/out-stats  (see out-stats.mts)
 */
import type { Config, Context } from '@netlify/functions';
import { getStore } from '@netlify/blobs';

const SLUG = /^[a-z0-9-]{0,100}$/;
const KINDS = new Set(['affiliate', 'direct']);
const BOT = /bot|crawl|spider|slurp|preview|headless|monitor|lighthouse/i;

/** Calendar day in US Eastern time, used as the key prefix. */
function easternDay(d: Date): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
}

export default async (req: Request, context: Context) => {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'POST' } });

  // Only accept beacons from our own pages.
  const origin = req.headers.get('origin');
  const siteUrl = context.site?.url ? new URL(context.site.url).host : '';
  const host = new URL(req.url).host;
  if (origin) {
    const originHost = new URL(origin).host;
    if (originHost !== host && originHost !== siteUrl) return new Response(null, { status: 204 });
  }
  if (BOT.test(req.headers.get('user-agent') ?? '')) return new Response(null, { status: 204 });

  const text = await req.text();
  if (text.length > 1000) return new Response('Payload too large', { status: 413 });

  let body: Record<string, unknown>;
  try {
    body = JSON.parse(text) as Record<string, unknown>;
  } catch {
    return new Response('Bad Request', { status: 400 });
  }

  const deal = String(body.deal ?? '');
  const merchant = String(body.merchant ?? '');
  const kind = String(body.kind ?? '');
  const placement = String(body.placement ?? '').slice(0, 40);
  const page = String(body.page ?? '').slice(0, 200);
  if (!SLUG.test(deal) || !SLUG.test(merchant) || !merchant || !KINDS.has(kind) || !page.startsWith('/')) {
    return new Response('Bad Request', { status: 400 });
  }

  const now = new Date();
  const key = `${easternDay(now)}/${now.getTime()}-${crypto.randomUUID().slice(0, 8)}`;
  const store = getStore('outbound-clicks');
  context.waitUntil(store.setJSON(key, { deal, merchant, kind, placement: placement.replace(/[^a-z0-9-]/g, ''), page, at: now.toISOString() }));

  return new Response(null, { status: 204, headers: { 'Cache-Control': 'no-store' } });
};

export const config: Config = {
  path: '/api/out',
  method: ['POST'],
};
