# DealRadar Online

**Discover Deals. Save More.** — an independent US deal discovery and shopping-guide website.

- Production URL (once DNS is connected): https://dealradaronline.com
- Stack: Astro 7 (static output) · TypeScript (strict) · Tailwind CSS 4 · Zod-validated content collections · Netlify (hosting, Forms, two small Functions)
- No database, CMS, or paid service is required. Deals, stores, and guides are plain files edited on GitHub.

The brand name is configurable (`PUBLIC_SITE_NAME`) because "DealRadar" is used by other businesses; no trademark ownership is claimed.

## Quick start

```bash
nvm use            # Node 22 (see .nvmrc)
npm install
npm run dev        # http://localhost:4321 — development fixtures (sample deals) are shown, clearly labeled
npm run qa         # type check + unit tests + production build + post-build audit
```

| Command | What it does |
| --- | --- |
| `npm run dev` | Local dev server |
| `npm run build` | Production build into `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run check` | TypeScript / Astro diagnostics |
| `npm test` | Unit + content-validation tests (Vitest) |
| `npm run qa` | Everything above plus `scripts/postbuild-audit.mjs` |
| `npm run test:browser` | Browser smoke test against a running preview (needs local Chromium) |
| `npm run images` | Regenerate favicons, social cards, and Pinterest pins (needs local Chromium) |
| `npm run import:offers -- file.json` | Import normalized network offers as *pending-verification* drafts |

## How the site is organized

```
src/
  config/site.ts          brand, owner, analytics, newsletter, feature flags (env-driven)
  config/taxonomy.ts      categories and discount programs
  content/deals/*.yaml    one offer per file
  content/merchants/*.yaml one store per file (file name = URL slug)
  content/guides/*.md     shopping guides
  lib/schemas.ts          Zod schemas — the build fails on invalid content
  lib/catalog.ts          publishing rules: expiry, fixtures, thin-page suppression
  lib/deal-utils.ts       prices, discounts, outbound-link selection (unit tested)
  lib/affiliate/          provider-agnostic affiliate model + network adapters
  pages/                  routes (see below)
netlify/functions/        out.mts (click counter), out-stats.mts, daily-rebuild.mts
scripts/                  image generation, offer import, post-build audit, browser smoke test
docs/                     owner documentation
```

### Routes

`/` · `/deals/` · `/deals/[slug]/` · `/stores/` · `/stores/[slug]/` · `/categories/` · `/categories/[slug]/` · `/discounts/` · `/discounts/[slug]/` · `/guides/` · `/guides/[slug]/` · `/about/` · `/contact/` · `/how-we-find-deals/` · `/editorial-policy/` · `/affiliate-disclosure/` · `/privacy/` · `/terms/` · `/cookies/` · `/partners/` · `/newsletter/` · `/rss.xml` · `/sitemap.xml` · `/robots.txt`

Category and discount-program pages are generated **only** when they have enough active offers. Store pages without offers or sourced policy facts are `noindex`. Expired offers keep their URL (so links don't break) but are labeled as ended, `noindex`, and removed from listings, the sitemap, and RSS.

## Documentation

- [docs/CONTENT_GUIDE.md](docs/CONTENT_GUIDE.md) — add, edit, expire, and remove deals, stores, and guides
- [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) — GitHub → Netlify setup, domain, HTTPS, environment variables
- [docs/AFFILIATE_INTEGRATION.md](docs/AFFILIATE_INTEGRATION.md) — networks, link rules, adapters, importing feeds
- [docs/OWNER_CONFIGURATION.md](docs/OWNER_CONFIGURATION.md) — every setting and where it appears
- [docs/LAUNCH_CHECKLIST.md](docs/LAUNCH_CHECKLIST.md) — what's done and what the owner still needs to do
- [docs/LAUNCH_PLAN_14_DAYS.md](docs/LAUNCH_PLAN_14_DAYS.md) — realistic first-two-weeks distribution plan

## Principles baked into the code

- No fake discounts, reference prices, codes, reviews, ratings, urgency, or partnerships. The schema rejects reference prices that aren't higher than the price, affiliate URLs without a network, `example.com` URLs outside fixtures, and `TODO` text on published offers.
- Outbound links go through one component (`OutboundButton.astro`): approved affiliate URL if present, otherwise the plain merchant URL; affiliate links get `rel="sponsored"`; every link is labeled for readers.
- Analytics are optional and cookieless; nothing loads unless configured.
- Ads stay disabled until an ad network actually approves the site.
