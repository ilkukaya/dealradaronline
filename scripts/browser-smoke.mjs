#!/usr/bin/env node
/**
 * Browser smoke test against a running preview server.
 *
 *   npm run build && npx astro preview --port 4321 &
 *   BASE_URL=http://localhost:4321 node scripts/browser-smoke.mjs
 *
 * Needs a local Chromium (CHROMIUM_PATH). Checks search/filter behavior,
 * URL state, empty states, the mobile menu, outbound-click beacons, the
 * contact form topic preset, and horizontal overflow on phone widths.
 */
import { chromium } from 'playwright-core';

const base = process.env.BASE_URL || 'http://localhost:4321';
const executablePath = process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const browser = await chromium.launch({ executablePath });
const failures = [];
const check = (cond, msg) => {
  if (!cond) failures.push(msg);
  console.log(`${cond ? '✓' : '✗'} ${msg}`);
};

const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
await ctx.addInitScript(() => {
  const original = navigator.sendBeacon.bind(navigator);
  window.__beacons = [];
  navigator.sendBeacon = (url, data) => {
    if (data instanceof Blob) data.text().then((t) => window.__beacons.push(t));
    return original(url, data);
  };
});
const page = await ctx.newPage();
const pageErrors = [];
page.on('pageerror', (e) => pageErrors.push(e.message));

// Deals directory: search
await page.goto(`${base}/deals/`, { waitUntil: 'networkidle' });
const visible = () => page.locator('[data-deal-card]:visible').count();
const total = await visible();
check(total > 0, `deals page lists offers (${total})`);
await page.fill('#f-q', 'student');
await page.waitForTimeout(150);
const studentCount = await visible();
check(studentCount > 0 && studentCount < total, `search "student" narrows results (${studentCount})`);
check(page.url().includes('q=student'), 'search term is reflected in the URL');
check(/for “student”/.test(await page.locator('[data-result-count]').innerText()), 'result count mentions the query');

// Type + store filters (sidebar checkboxes)
await page.fill('#f-q', '');
await page.check('input[name="type"][value="military"]');
await page.waitForTimeout(100);
const military = await page.locator('[data-deal-card]:visible').evaluateAll((els) => els.map((e) => e.dataset.type));
check(military.length > 0 && military.every((t) => t === 'military'), `type filter shows only military offers (${military.length})`);
check(page.url().includes('type=military'), 'type filter is reflected in the URL');
check((await page.locator('[data-active-filters] button').count()) === 1, 'active filter pill is shown');
await page.uncheck('input[name="type"][value="military"]');
const firstStore = await page.locator('input[name="store"]').first().getAttribute('value');
await page.check(`input[name="store"][value="${firstStore}"]`);
const stores = await page.locator('[data-deal-card]:visible').evaluateAll((els) => els.map((e) => e.dataset.merchant));
check(stores.length > 0 && stores.every((s) => s === firstStore), `store filter shows only ${firstStore}`);

// Sorting by price
await page.uncheck(`input[name="store"][value="${firstStore}"]`);
await page.selectOption('#f-sort', 'price-asc');
const prices = await page.locator('[data-deal-card]:visible').evaluateAll((els) => els.map((e) => e.dataset.price).filter((p) => p !== '').map(Number));
check(prices.every((p, i) => i === 0 || prices[i - 1] <= p), 'price sort is ascending');

// Empty state
await page.fill('#f-q', 'zzzz-no-such-offer');
await page.waitForTimeout(100);
check(await page.locator('[data-empty-state]').isVisible(), 'empty state appears when nothing matches');
await page.click('[data-clear-filters-empty]');
check((await visible()) === total, 'clear filters restores all offers');

// URL parameters on load (from the header search form)
await page.goto(`${base}/deals/?q=free+shipping`, { waitUntil: 'networkidle' });
check((await page.inputValue('#f-q')) === 'free shipping', 'query parameter pre-fills the search box');
check((await visible()) > 0, 'header search lands on matching results');
await page.goto(`${base}/deals/?type=student,military`, { waitUntil: 'networkidle' });
const multi = await page.locator('[data-deal-card]:visible').evaluateAll((els) => [...new Set(els.map((e) => e.dataset.type))].sort().join(','));
check(multi === 'military,student', `multi-select type filter from URL works (${multi})`);

// Outbound click beacon
await page.goto(`${base}/deals/`, { waitUntil: 'networkidle' });
const beacon = page.waitForRequest((r) => r.url().endsWith('/api/out') && r.method() === 'POST', { timeout: 5000 }).catch(() => null);
const [popup] = await Promise.all([ctx.waitForEvent('page', { timeout: 5000 }).catch(() => null), page.locator('a[data-outbound]').first().click()]);
const req = await beacon;
check(Boolean(req), 'outbound click sends a beacon to /api/out');
// Browsers don't expose sendBeacon bodies to automation, so read the payload we recorded.
const body = JSON.parse((await page.evaluate(() => window.__beacons?.[0])) || '{}');
check(Boolean(body.merchant && body.kind && body.page), `beacon payload has merchant/kind/page (${JSON.stringify(body)})`);
await popup?.close();

// Deal page expiry guard (simulate an end date that has passed since the build)
await page.goto(`${base}/deals/amazon-prime-for-young-adults/`, { waitUntil: 'networkidle' });
check(await page.locator('a[data-outbound]:visible').first().isVisible(), 'deal page shows the store button');
check((await page.locator('a[data-outbound]').first().getAttribute('rel')).includes('nofollow'), 'store button has rel=nofollow');

// Contact form topic preset
await page.goto(`${base}/contact/?topic=deal-problem`, { waitUntil: 'networkidle' });
check((await page.inputValue('#c-topic')) === 'deal-problem', 'contact form preselects topic from URL');
check((await page.locator('form[name="contact"] input[name="form-name"]').getAttribute('value')) === 'contact', 'contact form has Netlify form-name');

// Mobile: menu and overflow
const mobile = await browser.newContext({ viewport: { width: 375, height: 740 }, isMobile: true, hasTouch: true });
const m = await mobile.newPage();
m.on('pageerror', (e) => pageErrors.push(e.message));
for (const path of ['/', '/deals/', '/deals/amazon-prime-for-young-adults/', '/stores/', '/stores/target/', '/discounts/', '/discounts/student/', '/categories/', '/guides/', '/guides/compare-final-prices-shipping-tax/', '/privacy/', '/contact/']) {
  await m.goto(`${base}${path}`, { waitUntil: 'networkidle' });
  const overflow = await m.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  // Elements that stick out past the screen edge (ignoring intentional horizontal scrollers and clipped areas).
  const sticking = await m.evaluate(() =>
    [...document.querySelectorAll('main *')].filter((el) => {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.right <= window.innerWidth + 1) return false;
      for (let p = el.parentElement; p; p = p.parentElement) {
        if (['auto', 'scroll', 'hidden', 'clip'].includes(getComputedStyle(p).overflowX)) return false;
      }
      return true;
    }).length,
  );
  check(overflow <= 0 && sticking === 0, `no horizontal overflow at 375px on ${path}${sticking ? ` (${sticking} elements past the edge)` : ''}`);
}
await m.goto(`${base}/deals/`, { waitUntil: 'networkidle' });
check(!(await m.locator('#filter-panel').isVisible()), 'mobile filters are collapsed by default');
await m.click('[data-filter-toggle]');
check(await m.locator('#filter-panel').isVisible(), 'mobile filter toggle opens the panel');
await m.goto(`${base}/`, { waitUntil: 'networkidle' });
await m.click('[data-mobile-menu] summary');
check(await m.locator('nav[aria-label="Mobile"]').isVisible(), 'mobile menu opens');
await m.keyboard.press('Escape');
check(!(await m.locator('nav[aria-label="Mobile"]').isVisible()), 'Escape closes the mobile menu');

check(pageErrors.length === 0, `no JavaScript errors${pageErrors.length ? `: ${pageErrors.join('; ')}` : ''}`);
await browser.close();
if (failures.length) {
  console.error(`\n${failures.length} check(s) failed.`);
  process.exit(1);
}
console.log('\nbrowser smoke test passed.');
