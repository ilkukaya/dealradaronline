/**
 * Client-side search, filtering, sorting and paging for /deals/.
 * All cards are rendered server-side (crawlable); this script only hides,
 * shows and reorders them. Filter state is mirrored in the query string so
 * filtered views are shareable, while the canonical URL stays /deals/.
 */
import { track } from './site';

type Filters = { q: string; category: string; type: string; store: string; sort: string };

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[’']/g, '')
    .trim();

export function initDealBrowser(): void {
  const root = document.querySelector<HTMLElement>('[data-deal-browser]');
  const form = root?.querySelector<HTMLFormElement>('[data-filter-form]');
  const grid = root?.querySelector<HTMLElement>('[data-deal-grid]');
  if (!root || !form || !grid) return;

  const pageSize = Number(root.dataset.pageSize || 24);
  const now = Date.now();
  const cards = Array.from(grid.querySelectorAll<HTMLElement>('[data-deal-card]')).filter((c) => {
    const ends = c.dataset.expires ? Date.parse(c.dataset.expires) : NaN;
    return Number.isNaN(ends) || ends > now; // offers that ended since the last build stay hidden
  });
  const countEl = root.querySelector<HTMLElement>('[data-result-count]');
  const empty = root.querySelector<HTMLElement>('[data-empty-state]');
  const clearBtn = root.querySelector<HTMLElement>('[data-clear-filters]');
  const clearEmpty = root.querySelector<HTMLElement>('[data-clear-filters-empty]');
  const moreWrap = root.querySelector<HTMLElement>('[data-load-more-wrap]');
  const moreBtn = root.querySelector<HTMLElement>('[data-load-more]');
  let visibleLimit = pageSize;
  let searchTimer: number | undefined;

  const fields = {
    q: form.elements.namedItem('q') as HTMLInputElement,
    category: form.elements.namedItem('category') as HTMLSelectElement,
    type: form.elements.namedItem('type') as HTMLSelectElement,
    store: form.elements.namedItem('store') as HTMLSelectElement,
    sort: form.elements.namedItem('sort') as HTMLSelectElement,
  };

  const read = (): Filters => ({
    q: fields.q.value,
    category: fields.category.value,
    type: fields.type.value,
    store: fields.store.value,
    sort: fields.sort.value || 'newest',
  });

  // Restore state from the URL (?q=&category=&type=&store=&sort=)
  const params = new URLSearchParams(location.search);
  const setIfOption = (el: HTMLSelectElement, v: string | null) => {
    if (v && Array.from(el.options).some((o) => o.value === v)) el.value = v;
  };
  fields.q.value = params.get('q') ?? '';
  setIfOption(fields.category, params.get('category'));
  setIfOption(fields.type, params.get('type'));
  setIfOption(fields.store, params.get('store'));
  setIfOption(fields.sort, params.get('sort'));

  const num = (v: string | undefined, fallback: number) => (v === undefined || v === '' ? fallback : Number(v));

  function apply(resetPaging = false): void {
    if (resetPaging) visibleLimit = pageSize;
    const f = read();
    const terms = norm(f.q).split(/\s+/).filter(Boolean);
    const matches = cards.filter((c) => {
      if (f.category && c.dataset.category !== f.category) return false;
      if (f.type && c.dataset.type !== f.type) return false;
      if (f.store && c.dataset.merchant !== f.store) return false;
      if (terms.length) {
        const hay = norm(c.dataset.search || '');
        if (!terms.every((t) => hay.includes(t))) return false;
      }
      return true;
    });

    const newest = (a: HTMLElement, b: HTMLElement) => num(b.dataset.published, 0) - num(a.dataset.published, 0);
    const sorted = [...matches].sort((a, b) => {
      switch (f.sort) {
        case 'price-asc':
          return num(a.dataset.price, Infinity) - num(b.dataset.price, Infinity) || newest(a, b);
        case 'price-desc':
          return num(b.dataset.price, -Infinity) - num(a.dataset.price, -Infinity) || newest(a, b);
        case 'discount':
          return num(b.dataset.discount, -1) - num(a.dataset.discount, -1) || newest(a, b);
        default:
          return newest(a, b);
      }
    });

    cards.forEach((c) => (c.hidden = true));
    sorted.forEach((c, i) => {
      grid!.appendChild(c);
      c.hidden = i >= visibleLimit;
    });

    const n = matches.length;
    if (countEl) countEl.textContent = `${n} ${n === 1 ? 'offer' : 'offers'}${f.q ? ` for “${f.q.trim()}”` : ''}`;
    if (empty) empty.hidden = n > 0;
    grid!.hidden = n === 0;
    const filtered = Boolean(f.q || f.category || f.type || f.store);
    if (clearBtn) clearBtn.classList.toggle('hidden', !filtered);
    if (moreWrap) moreWrap.hidden = n <= visibleLimit;

    const next = new URLSearchParams();
    if (f.q.trim()) next.set('q', f.q.trim());
    if (f.category) next.set('category', f.category);
    if (f.type) next.set('type', f.type);
    if (f.store) next.set('store', f.store);
    if (f.sort && f.sort !== 'newest') next.set('sort', f.sort);
    const qs = next.toString();
    history.replaceState(null, '', qs ? `?${qs}` : location.pathname);
  }

  function clear(): void {
    fields.q.value = '';
    fields.category.value = '';
    fields.type.value = '';
    fields.store.value = '';
    apply(true);
    fields.q.focus();
  }

  fields.q.addEventListener('input', () => {
    apply(true);
    window.clearTimeout(searchTimer);
    searchTimer = window.setTimeout(() => {
      const q = fields.q.value.trim();
      if (q.length >= 2) track('Search', { query: q.slice(0, 60), results: cards.filter((c) => !c.hidden).length });
    }, 1200);
  });
  (['category', 'type', 'store'] as const).forEach((k) =>
    fields[k].addEventListener('change', () => {
      apply(true);
      if (fields[k].value) track('Category Select', { [k]: fields[k].value, placement: 'deals-filter' });
    }),
  );
  fields.sort.addEventListener('change', () => apply(true));
  clearBtn?.addEventListener('click', clear);
  clearEmpty?.addEventListener('click', clear);
  moreBtn?.addEventListener('click', () => {
    visibleLimit += pageSize;
    apply(false);
  });

  apply(true);
  if (fields.q.value.trim().length >= 2) track('Search', { query: fields.q.value.trim().slice(0, 60), source: 'url' });
}
