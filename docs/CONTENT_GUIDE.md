# Content guide: deals, stores, and guides

Everything is edited as files in GitHub. Every push to `main` triggers a Netlify build; if a file is invalid, the build fails and the live site stays as it was. You can edit directly in the GitHub web editor (press `.` on the repo page for a full editor).

## Publishing workflow

Each deal has a `status`:

| Status | Shown on site? | Use it when |
| --- | --- | --- |
| `draft` | No | You're still writing it |
| `pending-verification` | No | Imported from a feed, or waiting to be checked |
| `published` | Yes, while active | Terms confirmed and summary written |
| `expired` | Page kept, labeled "ended", `noindex`, removed from listings | You know it ended |
| `archived` | No (page removed) | You want it gone entirely |

A `published` deal whose `endDate` has passed is treated as expired automatically. The site rebuilds daily (once `BUILD_HOOK_URL` is set — see DEPLOYMENT.md), and visitors' browsers also hide offers whose end date passes between builds.

## Add a deal

1. Create `src/content/deals/<store>-<short-description>.yaml` (lowercase, hyphens). The file name becomes the URL: `/deals/<file-name>/`.
2. Confirm the terms **on the merchant's own site** (or in your affiliate network dashboard). Don't copy from coupon sites.
3. Fill in the fields:

```yaml
title: "Target free shipping on orders over $35"
merchant: target                  # must match a file in src/content/merchants/
category: home-kitchen            # see src/config/taxonomy.ts
offerType: shipping               # student | military | assistance | trial | shipping | coupon | sale | other
description: One or two plain sentences about what the offer is.
editorialSummary: |-
  Your own take: who it's for and what to watch out for. Two short paragraphs is ideal.

  Separate paragraphs with a blank line.
eligibility: Who qualifies (optional).
restrictions:
  - Each important exclusion or condition, in plain words.
price: 6.99                       # only if confirmed; omit otherwise
pricePeriod: month                # one-time (default) | month | year
priceNote: after the 30-day trial # optional short qualifier
referencePrice: 14.99             # ONLY if the merchant itself states the regular price
referencePriceNote: Standard monthly price, as stated by the store
statedPercentOff: 10              # use instead of prices for "10% off" programs
couponCode: SAVE10                # only codes published by the merchant or your network
merchantUrl: https://www.target.com/
affiliateUrl: https://...         # ONLY an approved tracking link from your network dashboard
affiliateNetwork: cj              # required when affiliateUrl is set
sourceUrl: https://www.target.com/help/...   # page where you confirmed the terms
verificationMethod: merchant-page # merchant-page | merchant-official-search | network-feed | merchant-communication
lastVerified: 2026-10-16T12:00:00-04:00      # include time and Eastern offset
startDate: 2026-11-01T00:00:00-04:00         # optional
endDate: 2026-11-30T23:59:00-05:00           # optional; note EST (-05:00) after early November
publishedAt: 2026-10-16T12:00:00-04:00
status: published
featured: false                   # shows in "Worth checking first" on the homepage
editorsPick: false                # shows in "Savings people often miss"
tags: [free shipping]
```

4. Commit. The build validates everything; `npm test` catches the same errors locally.
5. Optional: run `npm run images` locally to create the deal's social card (otherwise the default card is used).

**Rules the build enforces:** `https://` URLs only; `referencePrice` must be higher than `price`; `affiliateUrl` needs `affiliateNetwork`; no `example.com` URLs; no `TODO` text in published offers; the merchant must exist.

## Recheck or update a deal

Change what's different, update `lastVerified`, and add `updatedAt`. Offers not rechecked for 30 days show a "confirm before you buy" note automatically. A good routine: recheck featured offers weekly and everything else monthly.

## End or remove a deal

- Ended early: set `status: expired` (or set `endDate` to when it ended).
- Remove completely: set `status: archived`, or delete the file. Deleting breaks any links people shared, so prefer `expired`.

## Add a store

Create `src/content/merchants/<slug>.yaml` (slug becomes `/stores/<slug>/`). Write an original overview and tips. Add policy `facts` only with an official `sourceUrl` and the date you checked. Record affiliate program status honestly:

```yaml
affiliatePrograms:
  - network: cj
    status: approved        # not-applied | applied | approved | rejected | paused
    programId: "1234567"    # from the network; never invent
    approvedAt: 2026-11-02
```

When a program is `approved`, the store page and affiliate disclosure update automatically to say links may earn a commission.

**Store logo.** Logos live in `src/lib/brand-logos.ts`, keyed by the merchant slug: a `viewBox`, the brand background color, and the SVG paths (inline, so they add no requests). Single-color marks for many brands are available from [Simple Icons](https://simpleicons.org/) (CC0); if the store's affiliate program supplies official logo files, use those instead. A store without an entry shows its initials until you add one. Logos are only used to identify the store — never in a way that suggests the store endorses us.

## Add a guide

Create `src/content/guides/<slug>.md` with front matter:

```yaml
---
title: "How to …"
description: "Meta description, 120–160 characters."
summary: "Dek shown under the title."
publishedAt: 2026-10-16
updatedAt: 2026-11-01        # when you materially update it
category: memberships        # optional
tags: ["…"]
relatedGuides: ["other-guide-slug"]
relatedStores: ["target"]
relatedOfferTypes: ["shipping"]
draft: false
---
```

Use `##` headings, plain language, and internal links (the test suite checks they aren't broken). Don't state store prices or policies as permanent facts in guides — link to the deal or store page instead. Then run `npm run images` to create its social card and Pinterest pin.

## Development fixtures

Files named `fixture-*.yaml` with `fixture: true` are fake sample offers for previewing layouts. They appear only in `npm run dev` (labeled "Sample data") and are excluded from production builds; the post-build audit fails if one leaks.
