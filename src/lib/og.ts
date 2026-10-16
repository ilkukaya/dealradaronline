import { existsSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Returns the generated social image for a page if it exists (see
 * scripts/generate-images.mjs), otherwise the default card. Runs at build time.
 */
export function ogImageFor(kind: 'deals' | 'guides', id: string): string {
  const rel = `/og/${kind}/${id}.png`;
  return existsSync(join(process.cwd(), 'public', rel)) ? rel : '/og/default.png';
}

export function pinImageFor(id: string): string | undefined {
  const rel = `/pins/guides/${id}.png`;
  return existsSync(join(process.cwd(), 'public', rel)) ? rel : undefined;
}
