/**
 * Zod schemas for all structured content. Shared by Astro content collections
 * (src/content.config.ts) and the unit tests, so a malformed deal fails both the
 * build and `npm test`.
 */
import { z } from 'astro/zod';
import { categorySlugs, offerTypeSlugs } from '../config/taxonomy';
import { networkIds } from './affiliate/networks';

const httpsUrl = z
  .url()
  .refine((u) => u.startsWith('https://'), { message: 'URLs must use https://' });

const slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase letters, numbers and hyphens');

/** Accepts YAML dates or ISO strings; always yields a Date. */
const dateLike = z.coerce.date();

export const publicationStates = ['draft', 'pending-verification', 'published', 'expired', 'archived'] as const;
export type PublicationState = (typeof publicationStates)[number];

/** How the offer terms were checked. Shown to readers on the deal page. */
export const verificationMethods = [
  'merchant-page', // an editor loaded the merchant's page and confirmed the terms
  'merchant-official-search', // terms read from the merchant's own domain via a search index
  'network-feed', // terms supplied by an authorized affiliate network feed
  'merchant-communication', // terms supplied by the merchant directly (keep the email)
] as const;

export const affiliateProgramSchema = z.object({
  network: z.enum(networkIds),
  status: z.enum(['not-applied', 'applied', 'approved', 'rejected', 'paused']),
  /** Network's advertiser / program ID. Never invent one. */
  programId: z.string().optional(),
  /** Commission terms exactly as stated by the network. Optional, internal only. */
  commissionNote: z.string().optional(),
  approvedAt: dateLike.optional(),
  notes: z.string().optional(),
});

export const storeFactSchema = z.object({
  label: z.string().min(2),
  /** Optional short headline for the store-page stat tiles, e.g. "Free shipping over $35". */
  short: z.string().max(48).optional(),
  value: z.string().min(2),
  sourceUrl: httpsUrl,
  checkedAt: dateLike,
});

export const merchantSchema = z.object({
  name: z.string().min(1),
  domain: z.string().regex(/^[a-z0-9.-]+\.[a-z]{2,}$/),
  websiteUrl: httpsUrl,
  status: z.enum(['draft', 'published', 'archived']).default('published'),
  categories: z.array(z.enum(categorySlugs)).min(1),
  /** One-line neutral description for cards. */
  tagline: z.string().min(10).max(140),
  /** Original editorial overview (Markdown not supported; plain paragraphs separated by blank lines). */
  overview: z.string().min(80),
  /** Practical shopping tips written by the editors. */
  tips: z.array(z.string().min(10)).default([]),
  /** Policy facts, each with its official source and the date it was checked. */
  facts: z.array(storeFactSchema).default([]),
  affiliatePrograms: z.array(affiliateProgramSchema).default([]),
});

export const dealSchema = z
  .object({
    title: z.string().min(8).max(140),
    merchant: z.string(), // merchant id (file name without extension); resolved via reference in content.config
    category: z.enum(categorySlugs),
    offerType: z.enum(offerTypeSlugs),
    /** One or two sentences: what the offer is. */
    description: z.string().min(20).max(320),
    /** Original editorial take: who it is for and what to watch out for. */
    editorialSummary: z.string().min(40),
    eligibility: z.string().optional(),
    restrictions: z.array(z.string().min(3)).default([]),
    image: z
      .object({
        src: z.string(),
        alt: z.string().min(3),
        /** Required for third-party images: who owns it and under what permission it is used. */
        credit: z.string().min(3),
      })
      .optional(),

    currency: z.literal('USD').default('USD'),
    /** Price the shopper pays. Leave out if not verified. */
    price: z.number().nonnegative().optional(),
    pricePeriod: z.enum(['one-time', 'month', 'year']).default('one-time'),
    /** Short qualifier shown with the price, e.g. "after the 30-day trial". */
    priceNote: z.string().max(80).optional(),
    /** Regular price — only when the merchant itself states it. */
    referencePrice: z.number().positive().optional(),
    referencePriceNote: z.string().optional(),
    /** A percent-off value stated by the merchant, used when there is no price pair. */
    statedPercentOff: z.number().int().min(1).max(100).optional(),
    couponCode: z.string().regex(/^[A-Za-z0-9_-]{3,40}$/).optional(),

    merchantUrl: httpsUrl,
    /** Approved affiliate tracking link from a network dashboard/API. Never invent one. */
    affiliateUrl: httpsUrl.optional(),
    affiliateNetwork: z.enum(networkIds).optional(),
    /** Where the terms were confirmed (usually the merchant’s terms page). */
    sourceUrl: httpsUrl,
    verificationMethod: z.enum(verificationMethods),
    lastVerified: dateLike,

    startDate: dateLike.optional(),
    endDate: dateLike.optional(),
    publishedAt: dateLike,
    updatedAt: dateLike.optional(),

    status: z.enum(publicationStates),
    featured: z.boolean().default(false),
    editorsPick: z.boolean().default(false),
    tags: z.array(z.string()).default([]),
    /** Sample data for development only. Never shown in production builds. */
    fixture: z.boolean().default(false),
  })
  .superRefine((d, ctx) => {
    if (d.referencePrice !== undefined && d.price === undefined) {
      ctx.addIssue({ code: 'custom', path: ['referencePrice'], message: 'referencePrice requires price' });
    }
    if (d.referencePrice !== undefined && d.price !== undefined && d.referencePrice <= d.price) {
      ctx.addIssue({ code: 'custom', path: ['referencePrice'], message: 'referencePrice must be higher than price' });
    }
    if (d.affiliateUrl && !d.affiliateNetwork) {
      ctx.addIssue({ code: 'custom', path: ['affiliateNetwork'], message: 'affiliateUrl requires affiliateNetwork' });
    }
    if (d.startDate && d.endDate && d.endDate < d.startDate) {
      ctx.addIssue({ code: 'custom', path: ['endDate'], message: 'endDate is before startDate' });
    }
    if (d.status === 'published' && /\bTODO\b/.test(`${d.title} ${d.description} ${d.editorialSummary}`)) {
      ctx.addIssue({ code: 'custom', path: ['editorialSummary'], message: 'Published deals cannot contain TODO placeholders' });
    }
    if (!d.fixture && /example\.(com|org|net)/.test(`${d.merchantUrl} ${d.sourceUrl} ${d.affiliateUrl ?? ''}`)) {
      ctx.addIssue({ code: 'custom', path: ['merchantUrl'], message: 'example.* URLs are only allowed in fixtures' });
    }
  });

export const guideSchema = z.object({
  title: z.string().min(10).max(110),
  /** Meta description, ~150 characters. */
  description: z.string().min(50).max(170),
  /** Short dek shown under the title. */
  summary: z.string().min(20).max(280),
  publishedAt: dateLike,
  updatedAt: dateLike.optional(),
  category: z.enum(categorySlugs).optional(),
  tags: z.array(z.string()).default([]),
  relatedGuides: z.array(slug).default([]),
  relatedStores: z.array(slug).default([]),
  relatedOfferTypes: z.array(z.enum(offerTypeSlugs)).default([]),
  draft: z.boolean().default(false),
});

export type DealData = z.infer<typeof dealSchema>;
export type MerchantData = z.infer<typeof merchantSchema>;
export type GuideData = z.infer<typeof guideSchema>;
