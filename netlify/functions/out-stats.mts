/**
 * Aggregated outbound-click counts for the site owner.
 *
 *   curl -H "Authorization: Bearer $CLICK_STATS_TOKEN" "https://<site>/api/out-stats?days=7"
 *
 * Disabled (404) unless the CLICK_STATS_TOKEN environment variable is set in
 * Netlify (scope: Functions). These are raw click counts, not sales or earnings.
 */
import type { Config } from '@netlify/functions';
import { getStore } from '@netlify/blobs';

type Click = { deal: string; merchant: string; kind: string; placement: string; page: string; at: string };

function easternDay(d: Date): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export default async (req: Request) => {
  const token = Netlify.env.get('CLICK_STATS_TOKEN');
  if (!token) return new Response('Not Found', { status: 404 });
  const auth = req.headers.get('authorization') ?? '';
  if (!safeEqual(auth, `Bearer ${token}`)) return new Response('Unauthorized', { status: 401 });

  const url = new URL(req.url);
  const days = Math.min(Math.max(Number(url.searchParams.get('days') ?? 7) || 7, 1), 90);
  const store = getStore('outbound-clicks');

  const byDay: Record<string, number> = {};
  const byDeal: Record<string, number> = {};
  const byMerchant: Record<string, number> = {};
  const byKind: Record<string, number> = {};
  const byPlacement: Record<string, number> = {};
  let total = 0;

  for (let i = 0; i < days; i++) {
    const day = easternDay(new Date(Date.now() - i * 86_400_000));
    const { blobs } = await store.list({ prefix: `${day}/` });
    byDay[day] = blobs.length;
    for (const b of blobs) {
      const c = (await store.get(b.key, { type: 'json' })) as Click | null;
      if (!c) continue;
      total++;
      if (c.deal) byDeal[c.deal] = (byDeal[c.deal] ?? 0) + 1;
      byMerchant[c.merchant] = (byMerchant[c.merchant] ?? 0) + 1;
      byKind[c.kind] = (byKind[c.kind] ?? 0) + 1;
      if (c.placement) byPlacement[c.placement] = (byPlacement[c.placement] ?? 0) + 1;
    }
  }

  const sort = (o: Record<string, number>) => Object.fromEntries(Object.entries(o).sort((a, b) => b[1] - a[1]));
  return Response.json(
    { days, total, note: 'Counts of clicks on store links. Not purchases or earnings.', byDay, byDeal: sort(byDeal), byMerchant: sort(byMerchant), byKind, byPlacement: sort(byPlacement) },
    { headers: { 'Cache-Control': 'no-store' } },
  );
};

export const config: Config = {
  path: '/api/out-stats',
  method: ['GET'],
};
