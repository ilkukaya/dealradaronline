/**
 * Site-wide behavior (loaded on every page, ~2 KB):
 *  - analytics event helper (Plausible / Umami, only if loaded)
 *  - outbound merchant click logging (first-party, cookieless)
 *  - client-side expiry guard for offers that end between builds
 *  - copy-coupon buttons
 */

type Props = Record<string, string | number | boolean>;

declare global {
  interface Window {
    plausible?: (event: string, options?: { props?: Props }) => void;
    umami?: { track: (event: string, props?: Props) => void };
    drTrack?: (event: string, props?: Props) => void;
  }
}

export function track(event: string, props: Props = {}): void {
  try {
    window.plausible?.(event, { props });
    window.umami?.track(event, props);
  } catch {
    /* analytics must never break the page */
  }
}
window.drTrack = track;

const clickEndpoint = document.body.dataset.clickEndpoint || '';

function logOutbound(a: HTMLAnchorElement): void {
  const payload = {
    deal: a.dataset.deal || '',
    merchant: a.dataset.merchant || '',
    kind: a.dataset.linkKind || 'direct',
    placement: a.dataset.placement || '',
    page: location.pathname,
  };
  track('Outbound Click', payload);
  if (!clickEndpoint) return;
  const body = JSON.stringify(payload);
  try {
    if (!navigator.sendBeacon?.(clickEndpoint, new Blob([body], { type: 'application/json' }))) {
      void fetch(clickEndpoint, { method: 'POST', body, keepalive: true, headers: { 'content-type': 'application/json' } });
    }
  } catch {
    /* ignore */
  }
}

document.addEventListener(
  'click',
  (e) => {
    const target = e.target as Element | null;
    const outbound = target?.closest<HTMLAnchorElement>('a[data-outbound]');
    if (outbound) {
      logOutbound(outbound);
      return;
    }
    const tracked = target?.closest<HTMLElement>('[data-track]');
    if (tracked?.dataset.track) {
      let props: Props = {};
      try {
        props = tracked.dataset.trackProps ? (JSON.parse(tracked.dataset.trackProps) as Props) : {};
      } catch {
        props = {};
      }
      track(tracked.dataset.track, props);
    }
  },
  { capture: true },
);

// Track form submissions marked with data-track-submit (newsletter, contact).
document.addEventListener('submit', (e) => {
  const form = e.target as HTMLFormElement;
  if (form.dataset.trackSubmit) track(form.dataset.trackSubmit, { form: form.getAttribute('name') || '' });
});

// Expiry guard: static pages are rebuilt daily, but an offer can end in between.
function applyExpiry(): void {
  const now = Date.now();
  document.querySelectorAll<HTMLElement>('[data-expires]').forEach((el) => {
    const ends = Date.parse(el.dataset.expires || '');
    if (Number.isNaN(ends) || ends > now) return;
    if (el.dataset.expireAction === 'hide') {
      el.hidden = true;
    } else {
      el.dataset.expired = 'true';
      el.querySelectorAll<HTMLElement>('[data-expired-notice]').forEach((n) => (n.hidden = false));
      el.querySelectorAll<HTMLElement>('[data-active-only]').forEach((n) => (n.hidden = true));
    }
  });
}
applyExpiry();

// Copy buttons (coupon codes, share links)
document.querySelectorAll<HTMLButtonElement>('[data-copy]').forEach((btn) => {
  const label = btn.querySelector<HTMLElement>('[data-copy-label]');
  const original = label?.textContent ?? '';
  btn.addEventListener('click', async () => {
    const value = btn.dataset.copy || '';
    try {
      await navigator.clipboard.writeText(value);
      if (label) label.textContent = 'Copied';
      track(value.startsWith('http') ? 'Link Copy' : 'Coupon Copy', { value: value.slice(0, 120) });
      setTimeout(() => label && (label.textContent = original), 2000);
    } catch {
      if (label) label.textContent = value;
    }
  });
});

// Close the mobile menu when navigating within the page or pressing Escape.
const menu = document.querySelector<HTMLDetailsElement>('[data-mobile-menu]');
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && menu?.open) menu.open = false;
});
