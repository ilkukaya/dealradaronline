import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { dealSchema, guideSchema, merchantSchema } from './lib/schemas';

/**
 * Content lives in plain files so the owner can add, edit and remove entries
 * directly on GitHub. See docs/CONTENT_GUIDE.md.
 *
 * - src/content/deals/*.yaml      one offer per file
 * - src/content/merchants/*.yaml  one store per file (file name = store slug)
 * - src/content/guides/*.md       shopping guides (file name = URL slug)
 */
const deals = defineCollection({
  loader: glob({ pattern: '**/*.{yaml,yml}', base: './src/content/deals' }),
  schema: dealSchema,
});

const merchants = defineCollection({
  loader: glob({ pattern: '**/*.{yaml,yml}', base: './src/content/merchants' }),
  schema: merchantSchema,
});

const guides = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/guides' }),
  schema: guideSchema,
});

export const collections = { deals, merchants, guides };
