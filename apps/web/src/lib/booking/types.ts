import type { FormField } from '@/lib/data/service-catalog';

// ── Booking Form Engine Types ────────────────────────────────────────────────

export type BookingStep = 'contact' | 'details' | 'review' | 'payment' | 'success';

export interface BookingContentConfig {
  solutionSlug: string;
  solutionName: string;
  // Form field schema for the Details step
  detailFields: FormField[];
  // Whether this solution requires a scheduled slot
  requiresSlot: boolean;
  // Hero content for the custom page (not used by the engine itself, but co-located)
  hero?: {
    subtitle: string;
    title: string;
    description: string;
    shloka?: { text: string; attribution: string };
    ctaText: string;
    image?: string;
  };
  // Narrative block
  narrative?: {
    heading: string;
    points: string[];
  };
  // Process steps
  process?: {
    title: string;
    description: string;
  }[];
}

export interface LeadContactData {
  sessionId: string;
  solutionSlug: string;
  solutionName: string;
  name: string;
  phone: string;
  email?: string;
  consentToContact: boolean;
}

export interface PriceRevealResponse {
  sessionId: string;
  solutionSlug: string;
  solutionName: string;
  basePaise: number;
  priceINR: number;
  priceLabel: string;
}
