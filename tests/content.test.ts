/**
 * Validates every content file the way the build does, plus cross-references
 * and internal links, so mistakes are caught by `npm test` before deploy.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';
import { dealSchema, guideSchema, merchantSchema } from '../src/lib/schemas';
import { offerTypes } from '../src/config/taxonomy';

const root = join(__dirname, '..');
const dir = (p: string) => join(root, 'src/content', p);
const files = (p: string, ext: RegExp) => readdirSync(dir(p)).filter((f) => ext.test(f));
const id = (f: string) => f.replace(/\.(ya?ml|md)$/, '');

const merchantFiles = files('merchants', /\.ya?ml$/);
const dealFiles = files('deals', /\.ya?ml$/);
const guideFiles = files('guides', /\.md$/);
const merchantIds = new Set(merchantFiles.map(id));
const dealIds = new Set(dealFiles.map(id));
const guideIds = new Set(guideFiles.map(id));

const deals = dealFiles.map((f) => ({ id: id(f), data: dealSchema.parse(parse(readFileSync(join(dir('deals'), f), 'utf8'))) }));

describe('merchants', () => {
  it.each(merchantFiles)('%s is valid', (f) => {
    expect(() => merchantSchema.parse(parse(readFileSync(join(dir('merchants'), f), 'utf8')))).not.toThrow();
  });
});

describe('deals', () => {
  it.each(dealFiles)('%s is valid and references a known merchant', (f) => {
    const d = dealSchema.parse(parse(readFileSync(join(dir('deals'), f), 'utf8')));
    expect(merchantIds.has(d.merchant)).toBe(true);
  });
  it('uses URL-safe file names', () => {
    for (const f of dealFiles) expect(id(f)).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });
  it('never marks fixtures as anything but sample data', () => {
    for (const d of deals.filter((x) => x.data.fixture)) {
      expect(d.id.startsWith('fixture-')).toBe(true);
      expect(d.data.title.toLowerCase()).toContain('sample');
    }
  });
  it('has no affiliate URLs without an approved program on the merchant', () => {
    for (const d of deals.filter((x) => x.data.affiliateUrl && x.data.status === 'published')) {
      const m = merchantSchema.parse(parse(readFileSync(join(dir('merchants'), `${d.data.merchant}.yaml`), 'utf8')));
      expect(m.affiliatePrograms.some((p) => p.network === d.data.affiliateNetwork && p.status === 'approved')).toBe(true);
    }
  });
});

describe('guides', () => {
  const staticRoutes = new Set([
    '/', '/deals/', '/stores/', '/categories/', '/discounts/', '/guides/', '/about/', '/contact/', '/how-we-find-deals/',
    '/editorial-policy/', '/affiliate-disclosure/', '/privacy/', '/terms/', '/cookies/', '/partners/', '/newsletter/',
    ...offerTypes.map((t) => `/discounts/${t.slug}/`),
  ]);

  it.each(guideFiles)('%s has valid front matter and working internal links', (f) => {
    const raw = readFileSync(join(dir('guides'), f), 'utf8');
    const fm = raw.match(/^---\n([\s\S]*?)\n---/);
    expect(fm).toBeTruthy();
    const data = guideSchema.parse(parse(fm![1]!));
    for (const g of data.relatedGuides) expect(guideIds.has(g), `relatedGuides: ${g}`).toBe(true);
    for (const s of data.relatedStores) expect(merchantIds.has(s), `relatedStores: ${s}`).toBe(true);

    const links = [...raw.matchAll(/\]\((\/[^)\s]*)\)/g)].map((m) => m[1]!.split('#')[0]!);
    for (const href of links) {
      const ok =
        staticRoutes.has(href) ||
        (/^\/deals\/([^/]+)\/$/.test(href) && dealIds.has(href.split('/')[2]!)) ||
        (/^\/stores\/([^/]+)\/$/.test(href) && merchantIds.has(href.split('/')[2]!)) ||
        (/^\/guides\/([^/]+)\/$/.test(href) && guideIds.has(href.split('/')[2]!));
      expect(ok, `broken internal link ${href} in ${f}`).toBe(true);
    }
  });
});
