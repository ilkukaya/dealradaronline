#!/usr/bin/env node
/**
 * Import normalized offers (JSON) as draft deal files for editorial review.
 *
 *   npm run import:offers -- path/to/offers.json [--dry-run]
 *
 * The JSON must be an array of objects shaped like NormalizedOffer
 * (src/lib/affiliate/types.ts) — typically produced by a network adapter or
 * converted from a network's licensed CSV export. Every imported file gets
 * status "pending-verification" and is NOT shown on the site until an editor
 * checks the terms, writes the summary, and sets status: published.
 * Existing files are never overwritten.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { stringify } from 'yaml';
import { offerToDraft, slugify } from '../src/lib/affiliate/normalize.ts';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const [file, ...flags] = process.argv.slice(2);
const dryRun = flags.includes('--dry-run');
if (!file) {
  console.error('Usage: npm run import:offers -- <offers.json> [--dry-run]');
  process.exit(1);
}

const offers = JSON.parse(readFileSync(file, 'utf8'));
if (!Array.isArray(offers)) throw new Error('Expected a JSON array of offers.');

let created = 0;
let skipped = 0;
for (const raw of offers) {
  const offer = {
    ...raw,
    startDate: raw.startDate ? new Date(raw.startDate) : undefined,
    endDate: raw.endDate ? new Date(raw.endDate) : undefined,
    sourceUpdatedAt: raw.sourceUpdatedAt ? new Date(raw.sourceUpdatedAt) : undefined,
    restrictions: raw.restrictions ?? [],
  };
  for (const k of ['sourceId', 'network', 'merchant', 'title', 'description', 'offerType', 'merchantUrl', 'affiliateUrl']) {
    if (!offer[k]) throw new Error(`Offer is missing "${k}": ${JSON.stringify(raw).slice(0, 200)}`);
  }
  if (!existsSync(join(root, 'src/content/merchants', `${offer.merchant.slug}.yaml`))) {
    console.warn(`! Merchant "${offer.merchant.slug}" has no file in src/content/merchants/. Create it before publishing.`);
  }
  const slug = slugify(`${offer.merchant.slug} ${offer.title}`);
  const path = join(root, 'src/content/deals', `${slug}.yaml`);
  if (existsSync(path)) {
    skipped++;
    continue;
  }
  const body = `# Imported from ${offer.network} (source id ${offer.sourceId}) — PENDING VERIFICATION.\n# Check every field against the merchant's live terms before setting status: published.\n${stringify(offerToDraft(offer))}`;
  if (dryRun) console.log(`--- ${slug}.yaml\n${body}`);
  else writeFileSync(path, body);
  created++;
}
console.log(`${dryRun ? '[dry run] ' : ''}${created} draft(s) created, ${skipped} skipped (already exist).`);
