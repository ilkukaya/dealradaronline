# Deployment

## Current state (Oct 16, 2026)

| Item | Status |
| --- | --- |
| GitHub repository | `ilkukaya/dealradaronline` — code pushed to branch `claude/wonderful-goodall-8vmzog` (no `main` branch yet) |
| Netlify project | **Created**: `dealradaronline` (team `ilkukaya`), site ID `ef00168b-6cff-4268-b8fb-94c5395a93f1`, URL `https://dealradaronline.netlify.app` |
| Netlify Forms | Form detection **enabled** |
| `PUBLIC_SITE_URL` env var | Set to `https://dealradaronline.netlify.app` (all contexts) so canonicals match the live host until the domain is connected |
| First deploy | **Not yet** — the build environment used to create the site could not reach Netlify's upload API. Linking the repository (step 2) triggers the first deploy. |
| Custom domain `dealradaronline.com` | **Not configured** — ownership and DNS access weren't available |

## 1. Create the `main` branch

Netlify and the CI workflow treat `main` as production.

On GitHub: open the repository → **Branches** → create branch `main` from `claude/wonderful-goodall-8vmzog` → **Settings → General → Default branch** → choose `main`.

(From a terminal: `git push origin claude/wonderful-goodall-8vmzog:main`.)

## 2. Link the repository to Netlify (enables automatic deploys)

1. Open https://app.netlify.com/projects/dealradaronline
2. **Project configuration → Build & deploy → Continuous deployment → Link repository**.
3. Choose **GitHub**, authorize the Netlify app for `ilkukaya/dealradaronline` if asked, and select the repository.
4. Production branch: `main`. Build settings are read from `netlify.toml` (build `npm run build`, publish `dist`, Node 22) — leave the UI fields empty or matching.
5. Save. Netlify starts the first production deploy. It takes about a minute.
6. Verify: open https://dealradaronline.netlify.app — the homepage, `/deals/`, `/sitemap.xml`, and `/robots.txt` should load. Under **Forms**, "contact" and "newsletter" appear after the first deploy.

From then on, every push to `main` deploys automatically, and pull requests get deploy previews (Netlify marks previews `noindex`).

## 3. Turn on the daily expiry rebuild

1. **Project configuration → Build & deploy → Build hooks → Add build hook** — name "Daily refresh", branch `main`. Copy the URL.
2. **Environment variables → Add a variable**: `BUILD_HOOK_URL` = that URL, scope **Functions**. Mark it secret.
3. Redeploy. The scheduled function `daily-rebuild` now runs at 09:00 UTC (5 AM EDT / 4 AM EST). Check **Logs → Functions → daily-rebuild** the next day.

Daily builds use roughly 30 build minutes a month, within the free allowance.

## 4. Click statistics (optional)

Add `CLICK_STATS_TOKEN` (scope **Functions**, secret) with a long random value — e.g. the output of `openssl rand -base64 32`. Redeploy, then:

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" "https://dealradaronline.netlify.app/api/out-stats?days=7"
```

These are counts of clicks on store links — not purchases or commissions.

## 5. Connect the custom domain (after you own `dealradaronline.com`)

1. **Domain management → Add a domain** → `dealradaronline.com`. Add `www.dealradaronline.com` too; Netlify redirects `www` to the apex automatically when apex is primary.
2. Point DNS, either:
   - **Netlify DNS** (simplest): change the nameservers at your registrar to the four Netlify nameservers shown, or
   - **External DNS**: apex `A` record → `75.2.60.5`, and `CNAME www` → `dealradaronline.netlify.app`. (Confirm the current values on Netlify's "external DNS" instructions — they show them in the UI.)
3. Wait for DNS to propagate. Netlify provisions a Let's Encrypt certificate automatically (**Domain management → HTTPS**). Enable **Force HTTPS** if offered.
4. Change the environment variable `PUBLIC_SITE_URL` to `https://dealradaronline.com` and redeploy. This updates canonical URLs, the sitemap, RSS, and social cards.
5. Verify:
   - `https://dealradaronline.com` loads with a valid certificate.
   - `http://dealradaronline.com` and `https://www.dealradaronline.com` redirect to `https://dealradaronline.com`.
   - View source on any page: `<link rel="canonical" href="https://dealradaronline.com/...">`.
   - `https://dealradaronline.com/sitemap.xml` lists `dealradaronline.com` URLs.
   - `https://dealradaronline.netlify.app` still works; its canonicals point at the custom domain.

## 6. Search engines

- **Google Search Console**: add a *Domain* property (DNS TXT verification) or a *URL-prefix* property using the HTML tag method — put the tag's `content` value in `PUBLIC_GOOGLE_SITE_VERIFICATION` and redeploy. Submit `https://dealradaronline.com/sitemap.xml`.
- **Bing Webmaster Tools**: import from Google Search Console, or use `PUBLIC_BING_SITE_VERIFICATION`. Submit the sitemap.

Do this after the custom domain is live; submitting the `netlify.app` URL first creates a property you'll later abandon.

## Rollback

Netlify keeps every deploy: **Deploys → pick an earlier deploy → Publish deploy**. Or revert the commit on GitHub.

## Local verification before pushing

```bash
npm run qa                               # types, tests, build, post-build audit
npx astro preview --port 4321 &          # then, with a local Chromium:
npm run test:browser
```

GitHub Actions runs `npm run qa` on every push to `main` and on pull requests (`.github/workflows/ci.yml`).
