/**
 * Network adapters. Each one validates credentials and normalizes data into
 * src/lib/affiliate/types.ts. API mappings are intentionally left unimplemented
 * until the publisher account is approved and the network's *current*
 * documentation is available — we don't guess at response formats.
 *
 * Script-based networks (Skimlinks, Sovrn Commerce) don't need an offer feed to
 * monetize links: enable them with PUBLIC_SKIMLINKS_PUBLISHER_ID or
 * PUBLIC_SOVRN_COMMERCE_KEY after approval. Their adapters exist for optional
 * reporting/merchant-list APIs.
 */
import type { NetworkId } from '../networks';
import type { AffiliateAdapter } from '../types';
import { createAdapter } from './base';

export const adapters: Partial<Record<NetworkId, AffiliateAdapter>> = {
  flexoffers: createAdapter('flexoffers'),
  cj: createAdapter('cj'),
  awin: createAdapter('awin'),
  skimlinks: createAdapter('skimlinks'),
  sovrn: createAdapter('sovrn'),
  // Merchant-specific programs (e.g. a store's in-house program) usually provide
  // links through a dashboard rather than an API: paste approved links into the
  // deal file's affiliateUrl with affiliateNetwork: direct.
  direct: createAdapter('direct'),
};

export function configuredAdapters(env: Record<string, string | undefined>): AffiliateAdapter[] {
  return Object.values(adapters).filter((a): a is AffiliateAdapter => Boolean(a && a.requiredEnv.length && a.isConfigured(env)));
}
