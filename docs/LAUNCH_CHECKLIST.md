# Launch checklist

Legend: ✅ done and verified · ⏳ owner action required · ➖ optional / later

## Built and verified in the repository

- ✅ Production build: 61 pages, static output (`npm run build`).
- ✅ Type check (`astro check`): 0 errors. Unit + content tests: 62 passing. Post-build audit passing (titles, descriptions, canonicals, H1s, internal links, rel attributes, JSON-LD, sitemap/noindex consistency, fixture leakage, secret scan).
- ✅ Browser smoke test: search, filters, sorting, URL state, empty state, outbound click beacon, contact topic preset, mobile menu, no horizontal overflow at 375px, no JS errors.
- ✅ axe-core accessibility scan: no WCAG 2 A/AA violations on the sampled templates.
- ✅ Pages: home, deals directory, 14 deal pages, 11 store pages, 5 category pages (single-offer categories are `noindex`), 5 discount-program pages, 7 guides, About, Contact (+ thanks), How We Find Deals, Editorial Policy, Affiliate Disclosure, Privacy, Terms, Cookies, Work With Us, Newsletter (+ thanks), 404, RSS, sitemap, robots.txt.
- ✅ No development fixtures, fake prices, reviews, ratings, or partnership claims in production output.
- ✅ Netlify project `dealradaronline` created; Forms enabled; `PUBLIC_SITE_URL` set to the netlify.app URL.

## Before the site is public

- ⏳ **Create `main` and link the repo in Netlify** (DEPLOYMENT.md §1–2). This produces the first live deploy.
- ⏳ **Review every published offer against the live merchant page.** The 14 launch offers were confirmed from text on each merchant's official domain via a search index, because the build environment couldn't load merchant pages directly. That is disclosed on each offer page. Open each `sourceUrl`, confirm price/eligibility/restrictions, then set `verificationMethod: merchant-page` and update `lastVerified`. Prices that most deserve a recheck: YouTube Premium Student ($8.99), Spotify Premium Student ($6.99), Audible ($14.95), Walmart+ plans ($6.47/$12.95), Prime plans ($7.49/$6.99/$14.99).
- ⏳ **Read the seven guides and the policy pages** and edit anything you don't want to stand behind. The Editorial Policy says content is reviewed against sources before publication — make that true.
- ⏳ Submit a test message through `/contact/` and `/newsletter/` after the first deploy; confirm both appear under Netlify → Forms. Set up an email notification for the contact form (Forms → Form notifications).
- ⏳ Set `BUILD_HOOK_URL` for the daily rebuild (DEPLOYMENT.md §3).

## Before applying to affiliate networks

- ⏳ Register/confirm ownership of `dealradaronline.com` and connect it (DEPLOYMENT.md §5). Then change `PUBLIC_SITE_URL` to `https://dealradaronline.com`.
- ⏳ Trademark: "DealRadar" is used by other businesses. Do a basic USPTO search (TESS / trademark search) and consider professional clearance before investing in branding. If you rename, set `PUBLIC_SITE_NAME` and rerun `npm run images`.
- ⏳ `PUBLIC_OWNER_LEGAL_NAME` — legal name of the operator (shown on About, Privacy, Terms). Networks and tax forms (W-9 / W-8BEN) need this anyway.
- ⏳ `PUBLIC_OWNER_JURISDICTION` — governing law for the Terms (omitted until set).
- ➖ `PUBLIC_CONTACT_EMAIL` — a mailbox on your domain looks more professional to network reviewers.
- ⏳ Have a lawyer review the Privacy Policy and Terms if you can. They're written to match what the site actually does, but they aren't legal advice.

## Before sending any newsletter

- ⏳ `PUBLIC_MAILING_ADDRESS` (CAN-SPAM requires a postal address in commercial email).
- ⏳ Choose a provider (Buttondown or MailerLite free tiers), set `PUBLIC_NEWSLETTER_PROVIDER`, import the Netlify Forms waitlist (export CSV), and send a confirmation email to imported addresses.

## Analytics and measurement

- ✅ First-party cookieless click counter (`/api/out`) is built in; counts start after the first deploy.
- ⏳ Optional: `CLICK_STATS_TOKEN` to read counts via `/api/out-stats`.
- ➖ Optional: Plausible (`PUBLIC_PLAUSIBLE_DOMAIN`) or Umami Cloud free tier (`PUBLIC_UMAMI_WEBSITE_ID`). Add the custom events as goals.
- ⏳ Google Search Console + Bing Webmaster Tools after the domain is live; submit `/sitemap.xml`.

## Affiliate programs (see AFFILIATE_INTEGRATION.md)

- ⏳ Apply: FlexOffers, CJ Affiliate, Awin, Skimlinks **or** Sovrn Commerce (not both), and merchant programs relevant to listed stores.
- ⏳ After each approval: record it in the merchant file, add approved `affiliateUrl`s, and redeploy. Disclosures update automatically.
- ⏳ Never paste a link you didn't generate in your own dashboard.

## Ongoing

- Recheck featured offers weekly and all offers monthly (pages show a warning after 30 days).
- Add new offers only after confirming terms on the merchant site.
- Run `npm run images` after adding guides or deals so they get social cards.
