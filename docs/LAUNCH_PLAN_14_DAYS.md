# 14-day launch and distribution plan

A realistic plan for a one-person, near-zero-budget launch. It assumes 1–2 hours a day. It doesn't promise traffic or commissions: new sites typically see little organic search traffic for months, so the first weeks rely on direct distribution, and the goal is to learn what people actually click.

**Positioning to repeat everywhere:** *"Standing discounts most people never check — student, military, and assistance pricing, free trials, shipping minimums — with the fine print written down."*

## Days 1–2: Go live properly

- Create `main`, link the repo in Netlify, confirm the live site (DEPLOYMENT.md).
- Connect `dealradaronline.com`, wait for HTTPS, switch `PUBLIC_SITE_URL`.
- Recheck all 14 offers on the merchant pages; switch them to `verificationMethod: merchant-page`.
- Fill in owner details; test both forms; set `BUILD_HOOK_URL`.

## Day 3: Search engines and measurement

- Google Search Console (Domain property via DNS) and Bing Webmaster Tools; submit the sitemap.
- In Search Console, use URL Inspection → Request indexing for the homepage, `/deals/`, the five `/discounts/` pages, and the seven guides.
- Optional: Umami Cloud free tier or Plausible trial; add goals for `Outbound Click`, `Search`, `Newsletter Signup`.

## Day 4: Social profiles (only ones you'll maintain)

- **Pinterest business account** (highest fit for evergreen shopping guides). Claim the website (`PUBLIC_PINTEREST_SITE_VERIFICATION`). Create boards: "Student Discounts," "Military Discounts," "Smart Shopping Tips," "Free Shipping & Returns."
- Pin the seven vertical pins in `public/pins/guides/` (1000×1500), each linking to its guide. Write descriptions in plain language; no hashtag stuffing.
- Optional: one of X / Threads / Facebook Page. Add profile URLs via `PUBLIC_SOCIAL_*` once they exist.

## Days 5–6: Affiliate applications

- Apply to FlexOffers, CJ Affiliate, Awin, and one of Skimlinks / Sovrn Commerce, describing the site exactly as it is (content site, US audience, promotional methods: website, email list in development, Pinterest). Don't overstate traffic.
- In CJ/Awin, search for programs of stores already covered and of stores with standing programs (student/military discounts); note which accept new content publishers.
- Record every application in `src/lib/affiliate/networks.ts` (`status: applied`).

## Days 7–8: Content that matches high-intent searches

Add offers and pages where the site can be genuinely more useful than a coupon aggregator:

- 6–10 more **standing programs** confirmed on official pages (teacher discounts, first-responder discounts, more student plans, more free-shipping thresholds). Each needs eligibility, restrictions, and a source.
- One new guide targeting a specific question people search, e.g. "Is Walmart+ or Amazon Prime cheaper for students?" — a factual comparison using the existing offer pages.
- Once a program page has 4+ offers, it becomes a strong internal hub; link to it from guides.

## Days 9–10: Legitimate community participation

- Answer real questions where deal and budgeting advice is welcome — subreddits like r/Frugal, r/povertyfinance, r/college, r/Military and r/Veterans, and relevant Facebook groups — **following each community's self-promotion rules**. Most forbid link-dropping: give the full answer in the post itself, and link only when allowed and directly useful (e.g., "Walmart+ and Prime both have half-price plans for SNAP recipients; here's how verification works…").
- Never use multiple accounts, vote manipulation, or paid upvotes.

## Day 11: Email audience

- Pick Buttondown or MailerLite (free tier), set `PUBLIC_MAILING_ADDRESS` and the provider env vars.
- Write issue #1: five standing savings most people don't claim, each with its catch. Send it to the waitlist with a clear unsubscribe link.
- Add a one-line signup mention at the end of your best guides (already present as a form).

## Day 12: Merchant and program outreach

- For stores with in-house or network programs, send a short note through their affiliate contact: what the site covers, the page where their offer appears, and a request to join or for current publisher offers. Use `/partners/` as the reference page.
- For any store page with outdated info, ask the store's affiliate manager to confirm current terms.

## Day 13: Review the data

- Search Console: which pages have impressions, which queries appear.
- `/api/out-stats` (or analytics): which offers and placements get clicks.
- Double down: write the next guide around the best-performing topic; add related offers.

## Day 14: Make it routine

- Weekly: recheck featured offers, add 3–5 new confirmed offers, pin 3–5 times, one community answer per day where relevant.
- Monthly: recheck all offers, update guides, review affiliate approvals and apply to programs for stores readers click most.

## What not to do

No automated posting or comment spam, no buying links or followers, no fake reviews or "limited time" claims, no coupon codes from aggregator sites, no bidding on store trademarks in paid search unless a program explicitly allows it, no clicking your own affiliate links or ads.
