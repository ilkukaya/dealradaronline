/**
 * Visual treatment per discount program (tint, text color, icon). Used by cards,
 * chips and hub pages so each program keeps one recognizable color.
 */
import type { OfferTypeSlug } from './taxonomy';

export const programStyle: Record<OfferTypeSlug, { tint: string; text: string; ring: string; icon: string }> = {
  student: { tint: 'bg-positive-soft', text: 'text-positive', ring: 'ring-positive/15', icon: 'student' },
  military: { tint: 'bg-lilac-soft', text: 'text-lilac', ring: 'ring-lilac/15', icon: 'shield' },
  assistance: { tint: 'bg-accent-soft', text: 'text-accent-deep', ring: 'ring-accent/20', icon: 'heart' },
  trial: { tint: 'bg-caution-soft', text: 'text-caution', ring: 'ring-caution/15', icon: 'calendar' },
  shipping: { tint: 'bg-navy-soft', text: 'text-ink-2', ring: 'ring-ink/10', icon: 'truck' },
  coupon: { tint: 'bg-accent-soft', text: 'text-accent-deep', ring: 'ring-accent/20', icon: 'ticket' },
  sale: { tint: 'bg-accent-soft', text: 'text-accent-deep', ring: 'ring-accent/20', icon: 'tag' },
  other: { tint: 'bg-sand', text: 'text-ink-2', ring: 'ring-ink/10', icon: 'tag' },
};

/** Short, human labels for the header chip row and footer. */
export const programShortName: Record<OfferTypeSlug, string> = {
  student: 'Student Discounts',
  military: 'Military Discounts',
  assistance: 'Assistance Discounts',
  trial: 'Free Trials',
  shipping: 'Free Shipping',
  coupon: 'Promo Codes',
  sale: 'Sales',
  other: 'Other Offers',
};
