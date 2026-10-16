#!/usr/bin/env node
/**
 * Generates brand and social images into public/:
 *   favicon.svg, favicon.ico (PNG-in-ICO), apple-touch-icon.png, icon-192.png, icon-512.png
 *   og/default.png                    1200×630 default social card
 *   og/guides/<slug>.png              1200×630 card per guide
 *   og/deals/<slug>.png               1200×630 card per published (non-fixture) deal
 *   pins/guides/<slug>.png            1000×1500 Pinterest-friendly pin per guide
 *
 * Requires a local Chromium (set CHROMIUM_PATH, defaults to Playwright's bundled path).
 * Run after adding guides/deals:  npm run images
 * Images are committed to the repo, so Netlify builds don't need a browser.
 */
import { chromium } from 'playwright-core';
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';
import sharp from 'sharp';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const pub = join(root, 'public');
const brand = process.env.PUBLIC_SITE_NAME || 'DealRadar Online';
const tagline = process.env.PUBLIC_SITE_TAGLINE || 'Discover Deals. Save More.';
const domain = new URL(process.env.PUBLIC_SITE_URL || 'https://dealradaronline.com').host;

const font = (p) => readFileSync(join(root, 'node_modules', p)).toString('base64');
const display = font('@fontsource-variable/newsreader/files/newsreader-latin-wght-normal.woff2');
const inter = font('@fontsource-variable/inter/files/inter-latin-wght-normal.woff2');

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const mark = (size, ink = '#0e1a35') => `
<svg viewBox="0 0 40 40" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <circle cx="20" cy="20" r="18" fill="none" stroke="${ink}" stroke-width="2.4"/>
  <circle cx="20" cy="20" r="11.5" fill="none" stroke="${ink}" stroke-width="1.6" opacity="0.35"/>
  <path d="M20 20 L20 2 A18 18 0 0 1 35.6 11 Z" fill="#f0603c" opacity="0.9"/>
  <circle cx="20" cy="20" r="2.6" fill="${ink}"/>
  <circle cx="28.5" cy="9.8" r="2.4" fill="${ink}"/>
</svg>`;

const words = brand.split(' ');
const wordmark = (ink, sub) =>
  `<span style="font-family:Display;font-weight:600;color:${ink};letter-spacing:-0.01em">${esc(words.length > 1 ? words.slice(0, -1).join(' ') : brand)}</span>` +
  (words.length > 1 ? `<span style="font-family:Inter;font-weight:700;color:${sub};letter-spacing:0.14em;text-transform:uppercase;font-size:0.5em;margin-left:0.35em">${esc(words.at(-1))}</span>` : '');

const baseCss = `
@font-face{font-family:Display;src:url(data:font/woff2;base64,${display}) format('woff2');font-weight:100 900}
@font-face{font-family:Inter;src:url(data:font/woff2;base64,${inter}) format('woff2');font-weight:100 900}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:Inter;-webkit-font-smoothing:antialiased}
.radar{position:absolute;border-radius:50%;border:2px solid rgba(255,255,255,.12)}
`;

function socialCard({ eyebrow, title, footer }) {
  const size = title.length > 70 ? 54 : title.length > 45 ? 62 : 72;
  return `<!doctype html><html><head><style>${baseCss}
  body{width:1200px;height:630px;background:#0e1a35;position:relative;overflow:hidden;color:#fff}
  </style></head><body>
  <div class="radar" style="width:900px;height:900px;right:-330px;top:-300px"></div>
  <div class="radar" style="width:600px;height:600px;right:-180px;top:-150px"></div>
  <div class="radar" style="width:300px;height:300px;right:-30px;top:0px"></div>
  <svg style="position:absolute;right:-330px;top:-300px" width="900" height="900" viewBox="0 0 200 200"><path d="M100 100 L100 0 A100 100 0 0 1 186.6 50 Z" fill="#f0603c" opacity=".22"/></svg>
  <div style="position:absolute;left:72px;top:64px;display:flex;align-items:center;gap:16px;font-size:34px">${mark(52, '#ffffff')}<span>${wordmark('#ffffff', '#fbd5c7')}</span></div>
  <div style="position:absolute;left:72px;right:200px;top:190px">
    <div style="font-size:22px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#f8a58c">${esc(eyebrow)}</div>
    <div style="font-family:Display;font-weight:600;font-size:${size}px;line-height:1.08;margin-top:18px;letter-spacing:-0.015em">${esc(title)}</div>
  </div>
  <div style="position:absolute;left:72px;bottom:56px;font-size:24px;color:rgba(255,255,255,.7)">${esc(footer)}</div>
  <div style="position:absolute;left:0;right:0;bottom:0;height:10px;background:#f0603c"></div>
  </body></html>`;
}

function pin({ eyebrow, title, summary }) {
  return `<!doctype html><html><head><style>${baseCss}
  body{width:1000px;height:1500px;background:#f7f5f1;position:relative;overflow:hidden;color:#0e1a35}
  </style></head><body>
  <div style="position:absolute;inset:0 0 auto 0;height:560px;background:#0e1a35;overflow:hidden">
    <div class="radar" style="width:900px;height:900px;left:50%;margin-left:-450px;top:-170px"></div>
    <div class="radar" style="width:600px;height:600px;left:50%;margin-left:-300px;top:-20px"></div>
    <div class="radar" style="width:300px;height:300px;left:50%;margin-left:-150px;top:130px"></div>
    <svg style="position:absolute;left:50px;top:-170px" width="900" height="900" viewBox="0 0 200 200"><path d="M100 100 L100 0 A100 100 0 0 1 186.6 50 Z" fill="#f0603c" opacity=".3"/></svg>
    <div style="position:absolute;left:0;right:0;top:230px;display:flex;justify-content:center">${mark(120, '#ffffff')}</div>
  </div>
  <div style="position:absolute;left:80px;right:80px;top:640px">
    <div style="font-size:26px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#c8401a">${esc(eyebrow)}</div>
    <div style="font-family:Display;font-weight:600;font-size:${title.length > 60 ? 70 : 80}px;line-height:1.06;margin-top:22px;letter-spacing:-0.015em">${esc(title)}</div>
    <div style="font-size:32px;line-height:1.45;margin-top:30px;color:#2b3752">${esc(summary)}</div>
  </div>
  <div style="position:absolute;left:80px;right:80px;bottom:70px;display:flex;align-items:center;justify-content:space-between;font-size:30px">
    <span>${wordmark('#0e1a35', '#c8401a')}</span><span style="color:#5b6478;font-size:26px">${esc(domain)}</span>
  </div>
  </body></html>`;
}

function iconHtml(size, padding) {
  return `<!doctype html><html><head><style>*{margin:0}body{width:${size}px;height:${size}px;background:#ffffff;display:flex;align-items:center;justify-content:center}</style></head><body>${mark(size - padding * 2)}</body></html>`;
}

const readCollection = (dir, ext) => {
  const full = join(root, 'src/content', dir);
  if (!existsSync(full)) return [];
  return readdirSync(full)
    .filter((f) => ext.some((e) => f.endsWith(e)))
    .map((f) => ({ id: f.replace(/\.(ya?ml|md)$/, ''), raw: readFileSync(join(full, f), 'utf8') }));
};
const frontmatter = (raw) => parseYaml(raw.match(/^---\n([\s\S]*?)\n---/)?.[1] ?? '');

const executablePath = process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const browser = await chromium.launch({ executablePath });
const page = await browser.newPage();

async function shot(html, w, h, out) {
  await page.setViewportSize({ width: w, height: h });
  await page.setContent(html, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  mkdirSync(dirname(out), { recursive: true });
  const buf = await page.screenshot({ type: 'png' });
  await sharp(buf).png({ compressionLevel: 9, palette: w * h < 300000 }).toFile(out);
}

// Icons
writeFileSync(join(pub, 'favicon.svg'), mark(40).trim().replace('width="40" height="40" ', ''));
await shot(iconHtml(180, 18), 180, 180, join(pub, 'apple-touch-icon.png'));
await shot(iconHtml(192, 16), 192, 192, join(pub, 'icon-192.png'));
await shot(iconHtml(512, 40), 512, 512, join(pub, 'icon-512.png'));
// favicon.ico: a single 32×32 PNG wrapped in an ICO container
{
  await page.setViewportSize({ width: 32, height: 32 });
  await page.setContent(iconHtml(32, 1));
  const png = await sharp(await page.screenshot({ type: 'png' })).png().toBuffer();
  const header = Buffer.alloc(22);
  header.writeUInt16LE(0, 0); header.writeUInt16LE(1, 2); header.writeUInt16LE(1, 4);
  header.writeUInt8(32, 6); header.writeUInt8(32, 7); header.writeUInt8(0, 8); header.writeUInt8(0, 9);
  header.writeUInt16LE(1, 10); header.writeUInt16LE(32, 12); header.writeUInt32LE(png.length, 14); header.writeUInt32LE(22, 18);
  writeFileSync(join(pub, 'favicon.ico'), Buffer.concat([header, png]));
}

// Social cards
await shot(socialCard({ eyebrow: 'Independent US deal discovery', title: 'Real savings, with the fine print up front.', footer: `${tagline}  ·  ${domain}` }), 1200, 630, join(pub, 'og/default.png'));

let n = 0;
for (const { id, raw } of readCollection('guides', ['.md'])) {
  const fm = frontmatter(raw);
  if (fm.draft) continue;
  await shot(socialCard({ eyebrow: 'Shopping guide', title: fm.title, footer: domain }), 1200, 630, join(pub, `og/guides/${id}.png`));
  await shot(pin({ eyebrow: 'Shopping guide', title: fm.title, summary: fm.summary }), 1000, 1500, join(pub, `pins/guides/${id}.png`));
  n++;
}
for (const { id, raw } of readCollection('deals', ['.yaml', '.yml'])) {
  const d = parseYaml(raw);
  if (d.fixture || d.status !== 'published') continue;
  await shot(socialCard({ eyebrow: 'Offer', title: d.title, footer: `Restrictions and last-checked date on ${domain}` }), 1200, 630, join(pub, `og/deals/${id}.png`));
  n++;
}

await browser.close();
console.log(`Generated icons, default card, and ${n} content images.`);
