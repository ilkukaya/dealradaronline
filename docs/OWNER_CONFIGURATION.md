# Owner configuration

All settings are environment variables read at build time (`src/config/site.ts`). Set them in **Netlify → Site configuration → Environment variables**, then trigger a redeploy. For local development, copy `.env.example` to `.env`.

`PUBLIC_*` variables end up in public HTML — never put secrets in them.

## Identity and brand

| Variable | Default | Where it appears |
| --- | --- | --- |
| `PUBLIC_SITE_URL` | `https://dealradaronline.com` | Canonical URLs, sitemap, RSS, social cards. **Must match the domain the site is actually served from.** |
| `PUBLIC_SITE_NAME` | `DealRadar Online` | Logo wordmark, titles, legal pages. Change this if trademark clearance requires a rename. |
| `PUBLIC_SITE_SHORT_NAME` | `DealRadar` | Short contexts |
| `PUBLIC_SITE_TAGLINE` | `Discover Deals. Save More.` | Footer, social card |
| `PUBLIC_FOUNDED_YEAR` | `2026` | Copyright line |

After a rename also update `public/site.webmanifest` and run `npm run images` (social cards contain the name).

## Operator details (legal pages)

These are shown only when set. Missing values are **not** replaced with placeholders.

| Variable | Used on | Notes |
| --- | --- | --- |
| `PUBLIC_OWNER_LEGAL_NAME` | About, Privacy, Terms | Your legal name or registered business name. Recommended before affiliate applications. |
| `PUBLIC_OWNER_JURISDICTION` | Terms (governing law) | e.g. `the State of Texas`. The governing-law section is omitted until set. |
| `PUBLIC_CONTACT_EMAIL` | Contact, Privacy | Optional; the contact form works without it. Use an address on your domain if possible. |
| `PUBLIC_MAILING_ADDRESS` | Privacy | **Required before sending marketing email** (CAN-SPAM requires a valid postal address in each email). A PO box or registered mail service is acceptable. |

## Social and verification

`PUBLIC_SOCIAL_*` — links appear in the footer and the Organization schema once set. Only add profiles that exist.

`PUBLIC_GOOGLE_SITE_VERIFICATION`, `PUBLIC_BING_SITE_VERIFICATION`, `PUBLIC_PINTEREST_SITE_VERIFICATION`, `PUBLIC_IMPACT_SITE_VERIFICATION` — paste only the `content` value of the meta tag each service gives you. (Google Search Console's DNS verification is an alternative that needs no code.)

## Analytics

| Variable | Effect |
| --- | --- |
| `PUBLIC_PLAUSIBLE_DOMAIN` (+ optional `PUBLIC_PLAUSIBLE_SRC`) | Loads Plausible (cookieless, paid after trial). Use the script URL from your Plausible dashboard if it differs. |
| `PUBLIC_UMAMI_WEBSITE_ID` (+ `PUBLIC_UMAMI_SRC`) | Loads Umami (cookieless; Umami Cloud has a free tier). |
| `PUBLIC_CLICK_ENDPOINT` | Default `/api/out` (first-party click counter). Set to `off` to disable. |
| `CLICK_STATS_TOKEN` (secret, Functions scope) | Enables `GET /api/out-stats` with `Authorization: Bearer <token>`. |

Custom events sent to Plausible/Umami: `Outbound Click`, `Deal Click`, `Search`, `Category Select`, `Newsletter Signup`, `Newsletter Confirmed`, `Contact Submit`, `Coupon Copy`, `Link Copy`, `Share`. In Plausible, add them as goals to see them. Page views are automatic.

Don't add a cookie-based tool (e.g. Google Analytics 4) without first adding a consent banner and updating the Privacy and Cookie pages.

## Newsletter

| `PUBLIC_NEWSLETTER_PROVIDER` | Behavior |
| --- | --- |
| `netlify` (default) | Sign-ups go to Netlify Forms ("newsletter" form). The copy says truthfully that the newsletter hasn't launched. Export the list as CSV from Netlify when you pick a provider. |
| `buttondown` + `PUBLIC_BUTTONDOWN_USERNAME` | Form posts to Buttondown, which handles confirmation and unsubscribe. Free tier available. |
| `mailerlite` + `PUBLIC_MAILERLITE_FORM_ACTION` | Form posts to your MailerLite embedded-form action URL. Free tier available. |

When you switch providers, the Privacy page updates automatically. Set `PUBLIC_MAILING_ADDRESS` first.

## Monetization switches

- `PUBLIC_SKIMLINKS_PUBLISHER_ID` **or** `PUBLIC_SOVRN_COMMERCE_KEY` — only after approval (see AFFILIATE_INTEGRATION.md).
- `PUBLIC_ADS_ENABLED=true` — only after an ad network approves the site. Then add the network's code to `src/components/integrations/AdSlot.astro`. Slots are labeled "Advertisement" and reserve space to avoid layout shift. Never click your own ads or ask others to.

## Daily rebuild

`BUILD_HOOK_URL` (secret, Functions scope) — a Netlify build hook URL. The scheduled function `daily-rebuild` calls it at 09:00 UTC so expired offers drop out of listings, the sitemap, and RSS.
