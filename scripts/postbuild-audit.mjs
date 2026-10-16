#!/usr/bin/env node
/**
 * Post-build quality audit of dist/. Fails (exit 1) on problems that would hurt
 * users, SEO, or affiliate compliance:
 *  - missing/duplicate titles and descriptions, missing canonicals, H1 count
 *  - broken internal links and anchors to missing pages
 *  - store links without nofollow; affiliate links without rel="sponsored"
 *  - development fixtures or example.com URLs in production output
 *  - sitemap URLs that 404 or are noindexed; indexable pages missing from sitemap
 *  - invalid JSON-LD, images without alt text
 *  - strings that look like leaked secrets
 *
 *   npm run build && node scripts/postbuild-audit.mjs
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
if (!existsSync(dist)) {
  console.error('dist/ not found — run `npm run build` first.');
  process.exit(1);
}

const errors = [];
const warnings = [];
const walk = (d) => readdirSync(d).flatMap((f) => (statSync(join(d, f)).isDirectory() ? walk(join(d, f)) : [join(d, f)]));
const files = walk(dist);
const htmlFiles = files.filter((f) => f.endsWith('.html'));

const routeOf = (file) => {
  const rel = '/' + relative(dist, file).replace(/\\/g, '/');
  return rel.endsWith('/index.html') ? rel.slice(0, -'index.html'.length) : rel;
};
const exists = (path) => {
  const clean = decodeURIComponent(path.split('#')[0].split('?')[0]);
  if (clean === '' || clean === '/') return existsSync(join(dist, 'index.html'));
  const p = join(dist, clean);
  return existsSync(p) && statSync(p).isFile() ? true : existsSync(join(p, 'index.html'));
};
const attr = (tag, name) => tag.match(new RegExp(`\\s${name}="([^"]*)"`, 'i'))?.[1];

const pages = new Map();
const titles = new Map();
const descriptions = new Map();

for (const file of htmlFiles) {
  const route = routeOf(file);
  const html = readFileSync(file, 'utf8');
  const isRedirectStub = /<meta http-equiv="refresh"/i.test(html);
  if (isRedirectStub) continue;
  const noindex = /<meta name="robots" content="noindex/i.test(html);
  pages.set(route, { noindex });

  if (!/<html lang="en-US"/.test(html)) errors.push(`${route}: missing <html lang="en-US">`);
  const title = html.match(/<title>([^<]*)<\/title>/)?.[1];
  const desc = html.match(/<meta name="description" content="([^"]*)"/)?.[1];
  const canonical = html.match(/<link rel="canonical" href="([^"]*)"/)?.[1];
  if (!title) errors.push(`${route}: missing <title>`);
  if (!desc) errors.push(`${route}: missing meta description`);
  else if (desc.length < 50 || desc.length > 170) warnings.push(`${route}: meta description length ${desc.length}`);
  if (!canonical) errors.push(`${route}: missing canonical`);
  else if (route !== '/404.html' && !canonical.endsWith(route)) errors.push(`${route}: canonical ${canonical} does not match route`);
  const h1s = html.match(/<h1[\s>]/g)?.length ?? 0;
  if (h1s !== 1) errors.push(`${route}: expected 1 <h1>, found ${h1s}`);
  if (!/<meta property="og:image" content="https?:\/\//.test(html)) errors.push(`${route}: missing absolute og:image`);

  if (!noindex && title) {
    if (titles.has(title)) errors.push(`Duplicate title "${title}" on ${route} and ${titles.get(title)}`);
    titles.set(title, route);
    if (desc) {
      if (descriptions.has(desc)) warnings.push(`Duplicate description on ${route} and ${descriptions.get(desc)}`);
      descriptions.set(desc, route);
    }
  }

  // Links
  for (const tag of html.match(/<a\s[^>]*>/g) ?? []) {
    const href = attr(tag, 'href');
    if (!href) continue;
    if (href.startsWith('/') && !href.startsWith('//')) {
      if (href.startsWith('/api/')) continue;
      if (!exists(href)) errors.push(`${route}: broken internal link ${href}`);
    } else if (/^https?:\/\//.test(href)) {
      const rel = attr(tag, 'rel') ?? '';
      if (/data-outbound/.test(tag)) {
        if (!rel.includes('nofollow')) errors.push(`${route}: store link without nofollow: ${href}`);
        if (/data-link-kind="affiliate"/.test(tag) && !rel.includes('sponsored')) errors.push(`${route}: affiliate link without rel="sponsored": ${href}`);
        if (!/data-merchant="[a-z0-9-]+"/.test(tag)) errors.push(`${route}: store link missing data-merchant: ${href}`);
      }
      if (/target="_blank"/.test(tag) && !rel.includes('noopener')) errors.push(`${route}: target=_blank without noopener: ${href}`);
    }
  }

  // Images
  for (const tag of html.match(/<img\s[^>]*>/g) ?? []) {
    if (attr(tag, 'alt') === undefined) errors.push(`${route}: <img> without alt`);
  }

  // JSON-LD
  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try {
      const data = JSON.parse(m[1]);
      for (const item of Array.isArray(data) ? data : [data]) {
        if (!item['@context'] || !item['@type']) errors.push(`${route}: JSON-LD missing @context/@type`);
        if (['AggregateRating', 'Review', 'Offer', 'Product'].includes(item['@type'])) errors.push(`${route}: unsupported ${item['@type']} schema`);
      }
    } catch {
      errors.push(`${route}: invalid JSON-LD`);
    }
  }

  // Production must not contain development data.
  if (/example\.(com|org|net)\/sample/i.test(html) || />Sample data</.test(html) || /development fixture/i.test(html)) {
    errors.push(`${route}: contains development fixture content`);
  }
}

// Sitemap
const sitemapPath = join(dist, 'sitemap.xml');
if (!existsSync(sitemapPath)) errors.push('sitemap.xml missing');
else {
  const xml = readFileSync(sitemapPath, 'utf8');
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  const inSitemap = new Set();
  for (const loc of locs) {
    const path = new URL(loc).pathname;
    inSitemap.add(path);
    if (!exists(path)) errors.push(`sitemap: ${path} does not exist`);
    else if (pages.get(path)?.noindex) errors.push(`sitemap: ${path} is noindex`);
  }
  for (const [route, info] of pages) {
    if (!info.noindex && route.endsWith('/') && !inSitemap.has(route)) warnings.push(`indexable page not in sitemap: ${route}`);
  }
  console.log(`sitemap: ${locs.length} URLs`);
}

const robots = existsSync(join(dist, 'robots.txt')) ? readFileSync(join(dist, 'robots.txt'), 'utf8') : '';
if (!/Sitemap: https?:\/\/.+\/sitemap\.xml/.test(robots)) errors.push('robots.txt missing Sitemap line');
if (!existsSync(join(dist, 'rss.xml'))) errors.push('rss.xml missing');

// Netlify Forms must be present in static HTML.
for (const form of ['contact', 'newsletter']) {
  if (!htmlFiles.some((f) => readFileSync(f, 'utf8').includes(`name="${form}"`))) errors.push(`form "${form}" not found in built HTML`);
}

// Secret scan (built output + source, excluding dependencies)
const secretPatterns = [
  /AKIA[0-9A-Z]{16}/,
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
  /\bsk_(live|test)_[0-9a-zA-Z]{16,}/,
  /\bghp_[0-9A-Za-z]{30,}/,
  /\bnfp_[0-9A-Za-z]{30,}/,
  /xox[baprs]-[0-9A-Za-z-]{10,}/,
  /AIza[0-9A-Za-z_-]{35}/,
];
const sourceFiles = ['src', 'scripts', 'netlify', 'docs', 'public']
  .filter((d) => existsSync(join(root, d)))
  .flatMap((d) => walk(join(root, d)))
  .concat(['netlify.toml', '.env.example', 'README.md', 'astro.config.mjs', 'package.json'].map((f) => join(root, f)).filter(existsSync));
for (const f of [...files, ...sourceFiles]) {
  if (/\.(png|ico|woff2?|jpg|webp)$/.test(f)) continue;
  const text = readFileSync(f, 'utf8');
  for (const p of secretPatterns) if (p.test(text)) errors.push(`possible secret in ${relative(root, f)} (${p})`);
}

console.log(`audited ${pages.size} HTML pages`);
for (const w of warnings) console.log(`warn: ${w}`);
if (errors.length) {
  for (const e of errors) console.error(`ERROR: ${e}`);
  console.error(`\n${errors.length} error(s).`);
  process.exit(1);
}
console.log('postbuild audit passed.');
