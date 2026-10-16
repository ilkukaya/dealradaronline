/**
 * Triggers a fresh production build once a day so offers that passed their
 * end date drop out of listings, the sitemap, and the RSS feed.
 *
 * Setup: Netlify → Site configuration → Build & deploy → Build hooks → Add build hook
 * (branch: main), then save its URL as the BUILD_HOOK_URL environment variable
 * (scope: Functions). Without it this function does nothing.
 *
 * Schedule: 09:00 UTC = 5:00 AM Eastern (EDT) / 4:00 AM Eastern (EST).
 */
import type { Config } from '@netlify/functions';

export default async () => {
  const hook = Netlify.env.get('BUILD_HOOK_URL');
  if (!hook) {
    console.log('daily-rebuild: BUILD_HOOK_URL not set; skipping.');
    return;
  }
  const res = await fetch(`${hook}?trigger_title=${encodeURIComponent('Daily expiry refresh')}`, { method: 'POST' });
  console.log(`daily-rebuild: build hook responded ${res.status}`);
};

export const config: Config = {
  schedule: '0 9 * * *',
};
