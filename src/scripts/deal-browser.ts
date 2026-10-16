/**
 * Client-side search, filtering, sorting and paging for /deals/.
 * All cards are rendered server-side (crawlable); this script only hides,
 * shows and reorders them. Filter state is mirrored in the query string
 * (?q=&type=a,b&category=&store=&sort=) so filtered views are shareable,
 * while the canonical URL stays /deals/.
 */
import { track } from './site';

const GROUPS = ['type', 'category', 'store'] as const;
type Group = (typeof GROUPS)[number];
const DATASET_KEY: Record<Group, 'type' | 'category' | 'merchant'> = { type: 'type', category: 'category', store: 'merchant' };

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
  const pillsEl = root.querySelector<HTMLElement>('[data-active-filters]');
  const empty = root.querySelector<HTMLElement>('[data-empty-state]');
  const moreWrap = root.querySelector<HTMLElement>('[data-load-more-wrap]');
  const toggle = root.querySelector<HTMLButtonElement>('[data-filter-toggle]');
  const toggleCount = root.querySelector<HTMLElement>('[data-filter-count]');
  const q = form.elements.namedItem('q') as HTMLInputElement;
  const sort = document.getElementById('f-sort') as HTMLSelectElement | null;
  const boxes = (g: Group) => Array.from(form.querySelectorAll<HTMLInputElement>(`input[type=checkbox][name="${g}"]`));
  const labelOf = (box: HTMLInputElement) => box.closest('label')?.querySelector('span.flex-1')?.textContent?.trim() || box.value;
  let visibleLimit = pageSize;
  let searchTimer: number | undefined;

  // Restore state from the URL
  const params = new URLSearchParams(location.search);
  q.value = params.get('q') ?? '';
  for (const g of GROUPS) {
    const wanted = new Set((params.get(g) ?? '').split(',').filter(Boolean));
    boxes(g).forEach((b) => (b.checked = wanted.has(b.value)));
  }
  const sortParam = params.get('sort');
  if (sort && sortParam && Array.from(sort.options).some((o) => o.value === sortParam)) sort.value = sortParam;

  const selected = (g: Group) => new Set(boxes(g).filter((b) => b.checked).map((b) => b.value));
  const num = (v: string | undefined, fallback: number) => (v === undefined || v === '' ? fallback : Number(v));

  function renderPills(): number {
    if (!pillsEl) return 0;
    pillsEl.replaceChildren();
    let n = 0;
    for (const g of GROUPS) {
      for (const box of boxes(g).filter((b) => b.checked)) {
        n++;
        const pill = document.createElement('button');
        pill.type = 'button';
        pill.className = 'pill bg-shell text-ink hover:bg-sand !normal-case !tracking-normal !text-xs !py-1 !px-2.5';
        pill.textContent = `${labelOf(box)} ✕`;
        pill.setAttribute('aria-label', `Remove filter ${labelOf(box)}`);
        pill.addEventListener('click', () => {
          box.checked = false;
          apply(true);
        });
        pillsEl.appendChild(pill);
      }
    }
    return n;
  }

  function apply(resetPaging = false): void {
    if (resetPaging) visibleLimit = pageSize;
    const terms = norm(q.value).split(/\s+/).filter(Boolean);
    const sets = Object.fromEntries(GROUPS.map((g) => [g, selected(g)])) as Record<Group, Set<string>>;
    const matches = cards.filter((c) => {
      for (const g of GROUPS) {
        const set = sets[g];
        if (set.size && !set.has(c.dataset[DATASET_KEY[g]] || '')) return false;
      }
      if (terms.length) {
        const hay = norm(c.dataset.search || '');
        if (!terms.every((t) => hay.includes(t))) return false;
      }
      return true;
    });

    const order = sort?.value || 'newest';
    const newest = (a: HTMLElement, b: HTMLElement) => num(b.dataset.published, 0) - num(a.dataset.published, 0);
    const sorted = [...matches].sort((a, b) => {
      switch (order) {
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
    if (countEl) countEl.textContent = `Showing ${n} ${n === 1 ? 'offer' : 'offers'}${q.value.trim() ? ` for “${q.value.trim()}”` : ''}`;
    if (empty) empty.hidden = n > 0;
    grid!.hidden = n === 0;
    if (moreWrap) moreWrap.hidden = n <= visibleLimit;
    const active = renderPills() + (q.value.trim() ? 1 : 0);
    if (toggleCount) {
      toggleCount.textContent = String(active);
      toggleCount.classList.toggle('hidden', active === 0);
    }

    const next = new URLSearchParams();
    if (q.value.trim()) next.set('q', q.value.trim());
    for (const g of GROUPS) if (sets[g].size) next.set(g, [...sets[g]].join(','));
    if (order !== 'newest') next.set('sort', order);
    const qs = next.toString();
    history.replaceState(null, '', qs ? `?${qs}` : location.pathname);
  }

  function clear(): void {
    q.value = '';
    for (const g of GROUPS) boxes(g).forEach((b) => (b.checked = false));
    apply(true);
  }

  q.addEventListener('input', () => {
    apply(true);
    window.clearTimeout(searchTimer);
    searchTimer = window.setTimeout(() => {
      const term = q.value.trim();
      if (term.length >= 2) track('Search', { query: term.slice(0, 60), results: cards.filter((c) => !c.hidden).length });
    }, 1200);
  });
  form.addEventListener('change', (e) => {
    const box = e.target as HTMLInputElement;
    if (box.type !== 'checkbox') return;
    apply(true);
    if (box.checked) track('Category Select', { [box.name]: box.value, placement: 'deals-filter' });
  });
  sort?.addEventListener('change', () => apply(true));
  root.querySelector('[data-clear-filters]')?.addEventListener('click', clear);
  root.querySelector('[data-clear-filters-empty]')?.addEventListener('click', clear);
  root.querySelector('[data-load-more]')?.addEventListener('click', () => {
    visibleLimit += pageSize;
    apply(false);
  });
  toggle?.addEventListener('click', () => {
    const open = form.classList.toggle('hidden') === false;
    toggle.setAttribute('aria-expanded', String(open));
  });

  apply(true);
  if (q.value.trim().length >= 2) track('Search', { query: q.value.trim().slice(0, 60), source: 'url' });
}
