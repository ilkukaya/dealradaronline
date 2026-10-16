# Affiliate integration

The site works without any affiliate approval: every "Go to store" button falls back to the plain merchant URL. As programs are approved, you switch individual offers (or the whole site, for script-based networks) to affiliate links. Nothing in the repository claims an approval that hasn't happened.

## Current status

| Network | Publisher account | How links are produced | What you need to add |
| --- | --- | --- | --- |
| FlexOffers | Not applied | Deep links per advertiser | Approval, then links from the dashboard (API key optional) |
| CJ Affiliate | Not applied | Deep links per advertiser | Approval + per-advertiser approval; links from dashboard or API |
| Awin | Not applied | Deep links per advertiser | Approval (US sign-up may need a refundable deposit) |
| Skimlinks | Not applied | Site-wide script | Publisher ID → `PUBLIC_SKIMLINKS_PUBLISHER_ID` |
| Sovrn Commerce | Not applied | Site-wide script | API key → `PUBLIC_SOVRN_COMMERCE_KEY` |
| Merchant programs (e.g. Amazon Associates) | Not applied | Links from merchant dashboard | Approval, then record it in the merchant file |

Track your real status in `src/lib/affiliate/networks.ts` (`status`) and in each merchant file's `affiliatePrograms`. Never record commission rates or program IDs you haven't received from the network.

## Link rules (enforced in code)

- One component decides every merchant link: `src/components/deals/OutboundButton.astro` via `getOutboundLink()` in `src/lib/deal-utils.ts`.
- If a deal has `affiliateUrl` + `affiliateNetwork`, that link is used with `rel="sponsored nofollow noopener"` and the disclosure next to the button says it's an affiliate link.
- Otherwise the plain `merchantUrl` is used with `rel="nofollow noopener"` and the disclosure says we don't earn from it.
- Links are not cloaked or rewritten through redirects. Paste the tracking URL exactly as the network gives it. (Some programs forbid redirects, link shorteners, or modifying parameters.)
- Clicks are counted with a separate, cookieless beacon (`/api/out`), so the destination URL is never altered.
- Tests fail if a published deal uses an affiliate URL for a merchant without an `approved` program on that network.

### After an approval

1. Edit `src/content/merchants/<store>.yaml`:
   ```yaml
   affiliatePrograms:
     - network: cj
       status: approved
       programId: "1234567"      # from the network
       approvedAt: 2026-11-02
   ```
2. For each of that store's deals, add the tracking link generated for your account:
   ```yaml
   affiliateUrl: https://www.anrdoezrs.net/click-XXXXXXX-YYYYYYY?url=...
   affiliateNetwork: cj
   ```
3. If the program has specific disclosure language (Amazon Associates requires "As an Amazon Associate, we earn from qualifying purchases"), it's already wired: an approved `direct` program on the `amazon` merchant adds that sentence to the Affiliate Disclosure page. For other required wording, add it to `src/pages/affiliate-disclosure.astro`.
4. Read the program's terms on coupon use, trademark bidding, and email/social promotion before promoting offers.

### Script-based networks (Skimlinks / Sovrn Commerce)

After approval, set **one** of `PUBLIC_SKIMLINKS_PUBLISHER_ID` or `PUBLIC_SOVRN_COMMERCE_KEY` in Netlify and redeploy. The script loads from `src/components/integrations/LinkMonetization.astro` — compare the snippet with the one in your network dashboard before enabling and update it if the network has changed it. Enabling one updates the Privacy, Cookie, and Affiliate Disclosure pages automatically. Note: these scripts rewrite eligible links in the browser, so a converted link's `rel` attribute is set by the network, not by us.

## Feed adapters

`src/lib/affiliate/` contains a provider-agnostic model:

- `types.ts` — `NormalizedMerchant`, `NormalizedProgram`, `NormalizedOffer`, `NormalizedCoupon`, and the `AffiliateAdapter` interface.
- `adapters/` — one adapter per network. Each checks its credentials (from server-side env vars) and throws `AdapterNotImplementedError` where the API mapping hasn't been written. The mapping is intentionally **not** guessed: implement `listPrograms` / `fetchOffers` against the network's current API documentation once you have access (links in `networks.ts`).
- `normalize.ts` — converts a normalized offer into a deal file with `status: pending-verification` and `verificationMethod: network-feed`.

### Importing offers

```bash
npm run import:offers -- offers.json --dry-run   # preview
npm run import:offers -- offers.json             # write drafts to src/content/deals/
```

`offers.json` is an array of `NormalizedOffer` objects — produced by an adapter or converted from a feed export you're licensed to use. Imported files are drafts: an editor must check terms, write `editorialSummary` (the build refuses `TODO` on published deals), and set `status: published`. Existing files are never overwritten.

Respect feed licenses: some networks permit displaying feed data only for joined programs, require periodic refreshes, or prohibit caching prices beyond a set time.

## Applying to networks — what reviewers look at

The site already has: original editorial content, clear navigation, an About page, contact form, privacy policy, terms, affiliate disclosure, editorial policy, and HTTPS. Before applying:

1. Connect the custom domain (applications using a `*.netlify.app` URL are often rejected).
2. Set the owner details so legal pages name the operator (see OWNER_CONFIGURATION.md).
3. Add a public contact email if you can (`PUBLIC_CONTACT_EMAIL`).
4. Describe the site accurately: "independent deal discovery and shopping guides for US consumers; promotional methods: website content, email newsletter (planned), Pinterest." Don't claim traffic you don't have.
5. Never use coupon codes in ways a program forbids, or bid on brand trademarks in paid search unless allowed.
