/* ─────────────────────────────────────────────────────────────────────────────
 * SERVICE CATALOG — Single Source of Truth
 * ─────────────────────────────────────────────────────────────────────────────
 * Every service, plan, pricing, and form schema is defined here.
 * Navbar mega menu, Solutions page, Booking flow, and API pricing
 * all derive from this one file.
 *
 * To add a new service:
 *   1. Add an entry to SERVICE_CATALOG below
 *   2. Add pricing in apps/api/src/common/constants/service-prices.ts
 *   3. Done — no routing changes needed.
 * ──────────────────────────────────────────────────────────────────────────── */

// ── Types ────────────────────────────────────────────────────────────────────

export type ServiceCategory = 'business' | 'leadership' | 'personal' | 'property';

export interface ServicePlan {
  slug: string;           // e.g. "rising", "celestial", "zenith"
  name: string;           // display name, e.g. "Rising"
  tagline: string;        // short subtitle
  priceINR: number;       // in rupees (not paise)
  priceLabel: string;     // formatted, e.g. "₹24,999"
  features: string[];     // included items
  ctaText: string;        // button label
  variant: 'light' | 'featured' | 'dark';
}

export type FormFieldType =
  | 'text'
  | 'email'
  | 'tel'
  | 'textarea'
  | 'select'
  | 'date'
  | 'time'
  | 'file'
  | 'number';

export interface FormField {
  name: string;           // form field key
  label: string;          // display label
  type: FormFieldType;
  placeholder?: string;
  required: boolean;
  options?: string[];     // for select fields
  section?: string;       // group label, e.g. "Business Details"
}

export interface ServiceDefinition {
  id: string;             // slug, e.g. "business-vastu"
  category: ServiceCategory;
  name: string;           // "Business Vastu"
  shortDescription: string;
  icon: string;           // lucide icon name
  plans: ServicePlan[];
  formFields: FormField[];
  requiresSlot: boolean;
  tags: string[];         // for filtering/search
}

// ── Category Labels ──────────────────────────────────────────────────────────

export const CATEGORY_LABELS: Record<ServiceCategory, string> = {
  business: 'Business Solutions',
  leadership: 'Leadership & Strategy',
  personal: 'Personal Solutions',
  property: 'Property Solutions',
};

export const CATEGORY_DESCRIPTIONS: Record<ServiceCategory, string> = {
  business: 'Spatial intelligence for commercial growth and operational harmony.',
  leadership: 'Strategic clarity for leaders navigating complexity.',
  personal: 'Guidance for life\'s pivotal decisions and personal growth.',
  property: 'Vastu-aligned living spaces for health, peace and prosperity.',
};

// ── Form Field Templates ─────────────────────────────────────────────────────

const COMMON_FIELDS: FormField[] = [
  { name: 'fullName', label: 'Full Name', type: 'text', required: true, section: 'Your Details' },
  { name: 'email', label: 'Email Address', type: 'email', required: true, section: 'Your Details' },
  { name: 'phone', label: 'Phone Number', type: 'tel', required: true, section: 'Your Details' },
];


const BUSINESS_VASTU_FIELDS: FormField[] = [
  ...COMMON_FIELDS,
  { name: 'businessName', label: 'Business Name', type: 'text', required: true, section: 'Business Details' },
  { name: 'spaceType', label: 'Space Type', type: 'select', required: true, options: ['Office', 'Factory', 'Retail / Showroom', 'Hotel / Hospitality', 'Co-working Space', 'Warehouse', 'Other'], section: 'Business Details' },
  { name: 'businessProblems', label: 'Current Challenges (optional)', type: 'textarea', placeholder: 'Describe any specific issues or goals…', required: false, section: 'Business Details' },
];

const RESIDENTIAL_VASTU_FIELDS: FormField[] = [
  ...COMMON_FIELDS,
  { name: 'houseType', label: 'House Type', type: 'select', required: true, options: ['Independent House', 'Apartment', 'Villa', 'Penthouse', 'Duplex', 'Row House', 'Other'], section: 'Property Details' },
  { name: 'address', label: 'Property Address (optional)', type: 'textarea', required: false, section: 'Property Details' },
];

const CAREER_GUIDANCE_FIELDS: FormField[] = [
  ...COMMON_FIELDS,
  { name: 'dateOfBirth', label: 'Date of Birth', type: 'date', required: true, section: 'Birth Details' },
  { name: 'timeOfBirth', label: 'Time of Birth', type: 'time', required: true, section: 'Birth Details' },
  { name: 'placeOfBirth', label: 'Place of Birth', type: 'text', required: true, section: 'Birth Details' },
];

const RELATIONSHIP_FIELDS: FormField[] = [
  ...COMMON_FIELDS,
  { name: 'dateOfBirth', label: 'Your Date of Birth', type: 'date', required: true, section: 'Birth Details' },
  { name: 'partnerDob', label: "Partner's Date of Birth (optional)", type: 'date', required: false, section: "Partner's Birth Details" },
];

const STRATEGIC_CONSULTING_FIELDS: FormField[] = [
  ...COMMON_FIELDS,
  { name: 'decisionType', label: 'Decision Area', type: 'select', required: true, options: ['Expansion', 'Investment', 'Partnership', 'Acquisition', 'Market Entry', 'Restructuring', 'Other'], section: 'Context' },
  { name: 'background', label: 'Brief Background', type: 'textarea', placeholder: 'Describe the situation requiring strategic guidance…', required: true, section: 'Context' },
];

const GENERIC_CONSULTATION_FIELDS: FormField[] = [
  ...COMMON_FIELDS,
  { name: 'dateOfBirth', label: 'Date of Birth', type: 'date', required: true, section: 'Birth Details' },
  { name: 'concerns', label: 'What would you like guidance on? (optional)', type: 'textarea', required: false, section: 'Your Concerns' },
];

const MOBILE_ANALYSIS_FIELDS: FormField[] = [
  ...COMMON_FIELDS,
  { name: 'currentMobileNumber', label: 'Current Mobile Number', type: 'text', required: true, section: 'Analysis Details' },
  { name: 'dateOfBirth', label: 'Date of Birth', type: 'date', required: true, section: 'Birth Details' },
  { name: 'concerns', label: 'Any specific challenges or financial/health goals? (optional)', type: 'textarea', required: false, section: 'Your Goals' },
];

const SIGNATURE_ANALYSIS_FIELDS: FormField[] = [
  ...COMMON_FIELDS,
  { name: 'signatureImage', label: 'Upload Signature Image (optional)', type: 'file', required: false, section: 'Analysis Details' },
  { name: 'dateOfBirth', label: 'Date of Birth', type: 'date', required: true, section: 'Birth Details' },
  { name: 'concerns', label: 'What would you like to improve? (e.g. confidence, career, wealth) (optional)', type: 'textarea', required: false, section: 'Your Goals' },
];

// ── SERVICE CATALOG ──────────────────────────────────────────────────────────

export const SERVICE_CATALOG: ServiceDefinition[] = [
  // ─── Business Solutions ────────────────────────────────────────────────────
  {
    id: 'business-vastu',
    category: 'business',
    name: 'Business Vastu',
    shortDescription: 'Transform your commercial space into a prosperity engine with expert Vastu analysis.',
    icon: 'Building2',
    requiresSlot: true,
    tags: ['vastu', 'business', 'office', 'commercial'],
    formFields: BUSINESS_VASTU_FIELDS,
    plans: [
      {
        slug: 'rising',
        name: 'Rising',
        tagline: 'Foundational Vastu clarity for growing businesses',
        priceINR: 24999,
        priceLabel: '₹24,999',
        features: [
          'Personal Kundali Analysis (business birth chart)',
          'Career & Wealth Guidance',
          'Favourable Timing Insights',
          '1:1 Consultation (60 Min)',
          'Written Vastu Summary Report',
          'Email support for 30 days',
        ],
        ctaText: 'Explore Rising →',
        variant: 'light',
      },
      {
        slug: 'celestial',
        name: 'Celestial',
        tagline: 'Advanced insights for business growth & expansion',
        priceINR: 90000,
        priceLabel: '₹90,000',
        features: [
          'Business & Partnership Analysis',
          'Detailed Horoscope Reading',
          'Wealth & Opportunity Cycles',
          'Priority Consultations (90 Min × 2)',
          'Full Vastu Floor Plan Audit',
          'Direction & Zone Mapping Report',
          'Implementation Checklist',
          '60-day WhatsApp support',
        ],
        ctaText: 'Get Celestial →',
        variant: 'featured',
      },
      {
        slug: 'zenith',
        name: 'Zenith',
        tagline: 'The astro-vastu system for market leaders',
        priceINR: 99000,
        priceLabel: '₹99,000',
        features: [
          'Complete Cosmic Blueprint',
          'Leadership & Legacy Mapping',
          'Geopathic Stress Detection',
          'Exclusive Annual Forecast Report',
          'On-site Audit (1 day, Delhi NCR)',
          'Architect Briefing Session included',
          'Direct line to Dr. Pradeep Sharma',
          '90-day implementation oversight',
        ],
        ctaText: 'Unlock Zenith →',
        variant: 'dark',
      },
    ],
  },
  {
    id: 'office-vastu',
    category: 'business',
    name: 'Office Vastu',
    shortDescription: 'Direction alignment, desk placement, and energy zone optimisation for your office.',
    icon: 'Landmark',
    requiresSlot: true,
    tags: ['vastu', 'office', 'workspace'],
    formFields: BUSINESS_VASTU_FIELDS,
    plans: [
      {
        slug: 'standard',
        name: 'Standard',
        tagline: 'Complete office Vastu audit',
        priceINR: 24999,
        priceLabel: '₹24,999',
        features: ['Full office spatial analysis', 'Direction alignment report', 'Desk placement recommendations', '60-min consultation', 'Written report'],
        ctaText: 'Book Audit →',
        variant: 'featured',
      },
    ],
  },
  {
    id: 'factory-vastu',
    category: 'business',
    name: 'Factory & Warehouse',
    shortDescription: 'Industrial Vastu for production facilities, machinery placement, and output maximisation.',
    icon: 'Factory',
    requiresSlot: true,
    tags: ['vastu', 'factory', 'warehouse', 'industrial'],
    formFields: BUSINESS_VASTU_FIELDS,
    plans: [
      {
        slug: 'standard',
        name: 'Standard',
        tagline: 'Industrial Vastu audit',
        priceINR: 34999,
        priceLabel: '₹34,999',
        features: ['Machinery placement analysis', 'Worker safety zone mapping', 'Production flow optimisation', 'On-site or remote audit', 'Written report with checklist'],
        ctaText: 'Book Audit →',
        variant: 'featured',
      },
    ],
  },
  {
    id: 'retail-vastu',
    category: 'business',
    name: 'Retail & Showroom',
    shortDescription: 'Cash counter placement, display zones, and customer flow engineering for retail.',
    icon: 'ShoppingBag',
    requiresSlot: true,
    tags: ['vastu', 'retail', 'showroom', 'shop'],
    formFields: BUSINESS_VASTU_FIELDS,
    plans: [
      {
        slug: 'standard',
        name: 'Standard',
        tagline: 'Retail space Vastu analysis',
        priceINR: 24999,
        priceLabel: '₹24,999',
        features: ['Cash counter & display zone analysis', 'Entrance Vastu', 'Customer flow engineering', '60-min consultation', 'Written report'],
        ctaText: 'Book Audit →',
        variant: 'featured',
      },
    ],
  },
  {
    id: 'hotel-vastu',
    category: 'business',
    name: 'Hotel & Hospitality',
    shortDescription: 'Room numbering, reception direction, kitchen placement for occupancy and satisfaction.',
    icon: 'Hotel',
    requiresSlot: true,
    tags: ['vastu', 'hotel', 'hospitality', 'restaurant'],
    formFields: BUSINESS_VASTU_FIELDS,
    plans: [
      {
        slug: 'standard',
        name: 'Standard',
        tagline: 'Hospitality Vastu audit',
        priceINR: 44999,
        priceLabel: '₹44,999',
        features: ['Room & reception analysis', 'Kitchen placement Vastu', 'Restaurant seating alignment', 'On-site or remote audit', 'Detailed written report'],
        ctaText: 'Book Audit →',
        variant: 'featured',
      },
    ],
  },
  {
    id: 'commercial-plot',
    category: 'business',
    name: 'Commercial Plot Selection',
    shortDescription: 'Pre-purchase Vastu analysis of land shape, direction, and underground water.',
    icon: 'Map',
    requiresSlot: true,
    tags: ['vastu', 'plot', 'land', 'commercial', 'pre-purchase'],
    formFields: BUSINESS_VASTU_FIELDS,
    plans: [
      {
        slug: 'standard',
        name: 'Standard',
        tagline: 'Pre-purchase land analysis',
        priceINR: 19999,
        priceLabel: '₹19,999',
        features: ['Land shape & direction analysis', 'Road placement assessment', 'Underground water mapping', 'Written recommendation report'],
        ctaText: 'Book Analysis →',
        variant: 'featured',
      },
    ],
  },
  {
    id: 'coworking-vastu',
    category: 'business',
    name: 'Co-working & Startup',
    shortDescription: 'Flexible workspace Vastu — hot desks, collaboration zones, founder cabin alignment.',
    icon: 'Laptop',
    requiresSlot: true,
    tags: ['vastu', 'coworking', 'startup', 'flexible'],
    formFields: BUSINESS_VASTU_FIELDS,
    plans: [
      {
        slug: 'standard',
        name: 'Standard',
        tagline: 'Startup workspace Vastu',
        priceINR: 19999,
        priceLabel: '₹19,999',
        features: ['Hot desk zone mapping', 'Collaboration zone alignment', 'Founder cabin direction', 'Energy flow analysis', 'Written report'],
        ctaText: 'Book Audit →',
        variant: 'featured',
      },
    ],
  },

  // ─── Leadership & Strategy ─────────────────────────────────────────────────
  {
    id: 'strategic-consulting',
    category: 'leadership',
    name: 'Strategic Decision Consulting',
    shortDescription: 'High-impact business decisions with astrological precision and cosmic timing.',
    icon: 'Target',
    requiresSlot: true,
    tags: ['strategy', 'consulting', 'decision', 'leadership'],
    formFields: STRATEGIC_CONSULTING_FIELDS,
    plans: [
      {
        slug: 'standard',
        name: 'Standard',
        tagline: 'Single strategic decision analysis',
        priceINR: 24999,
        priceLabel: '₹24,999',
        features: ['90-min deep-dive consultation', 'Astrological timing analysis', 'Decision framework report', '30-day follow-up support'],
        ctaText: 'Book Session →',
        variant: 'featured',
      },
    ],
  },
  {
    id: 'partnership-analysis',
    category: 'leadership',
    name: 'Business Partnership Analysis',
    shortDescription: 'Evaluate compatibility and long-term success potential of business partnerships.',
    icon: 'Handshake',
    requiresSlot: true,
    tags: ['partnership', 'compatibility', 'business'],
    formFields: STRATEGIC_CONSULTING_FIELDS,
    plans: [
      {
        slug: 'standard',
        name: 'Standard',
        tagline: 'Partnership compatibility analysis',
        priceINR: 14999,
        priceLabel: '₹14,999',
        features: ['Partner chart comparison', 'Synergy & friction zones', 'Long-term forecast', '60-min consultation', 'Written report'],
        ctaText: 'Book Analysis →',
        variant: 'featured',
      },
    ],
  },
  {
    id: 'expansion-timing',
    category: 'leadership',
    name: 'Expansion & Investment Timing',
    shortDescription: 'Identify optimal windows for expansion, investment, and market entry.',
    icon: 'TrendingUp',
    requiresSlot: true,
    tags: ['expansion', 'investment', 'timing', 'growth'],
    formFields: STRATEGIC_CONSULTING_FIELDS,
    plans: [
      {
        slug: 'standard',
        name: 'Standard',
        tagline: 'Timing analysis for major moves',
        priceINR: 14999,
        priceLabel: '₹14,999',
        features: ['Dasha-based timing forecast', 'Transit analysis', 'Risk period identification', '60-min consultation', 'Written timing report'],
        ctaText: 'Book Analysis →',
        variant: 'featured',
      },
    ],
  },
  {
    id: 'brand-analysis',
    category: 'leadership',
    name: 'Brand & Name Analysis',
    shortDescription: 'Numerological analysis of brand names, company names, and product naming.',
    icon: 'Type',
    requiresSlot: true,
    tags: ['brand', 'naming', 'numerology'],
    formFields: STRATEGIC_CONSULTING_FIELDS,
    plans: [
      {
        slug: 'standard',
        name: 'Standard',
        tagline: 'Brand name numerology',
        priceINR: 9999,
        priceLabel: '₹9,999',
        features: ['Name vibration analysis', 'Alternative name suggestions', 'Logo colour guidance', '45-min consultation', 'Written report'],
        ctaText: 'Book Analysis →',
        variant: 'featured',
      },
    ],
  },

  // ─── Personal Solutions ────────────────────────────────────────────────────
  {
    id: 'career-guidance',
    category: 'personal',
    name: 'Career Guidance',
    shortDescription: 'Strategic career insights powered by planetary transits and Dasha predictions.',
    icon: 'Briefcase',
    requiresSlot: true,
    tags: ['career', 'job', 'professional', 'personal'],
    formFields: CAREER_GUIDANCE_FIELDS,
    plans: [
      {
        slug: 'standard',
        name: 'Standard',
        tagline: 'Career direction clarity',
        priceINR: 9999,
        priceLabel: '₹9,999',
        features: ['Birth chart career analysis', 'Planetary transit insights', '60-min consultation', 'Written career report'],
        ctaText: 'Book Session →',
        variant: 'light',
      },
      {
        slug: 'executive',
        name: 'Executive',
        tagline: 'Deep career + wealth strategy',
        priceINR: 24999,
        priceLabel: '₹24,999',
        features: ['Full career & wealth house analysis', 'Dasha-based 5-year forecast', '90-min consultation × 2', 'Quarterly timing updates', 'Priority support for 60 days'],
        ctaText: 'Book Executive →',
        variant: 'featured',
      },
    ],
  },
  {
    id: 'relationship-guidance',
    category: 'personal',
    name: 'Relationship Guidance',
    shortDescription: 'Clarity in romantic, familial, and interpersonal relationships.',
    icon: 'Heart',
    requiresSlot: true,
    tags: ['relationship', 'marriage', 'compatibility', 'personal'],
    formFields: RELATIONSHIP_FIELDS,
    plans: [
      {
        slug: 'standard',
        name: 'Standard',
        tagline: 'Relationship compatibility insight',
        priceINR: 9999,
        priceLabel: '₹9,999',
        features: ['Compatibility analysis', 'Relationship timing insights', '60-min consultation', 'Written report'],
        ctaText: 'Book Session →',
        variant: 'featured',
      },
    ],
  },
  {
    id: 'health-wellness',
    category: 'personal',
    name: 'Health & Wellness',
    shortDescription: 'Astrological insights for physical and mental health optimisation.',
    icon: 'Activity',
    requiresSlot: true,
    tags: ['health', 'wellness', 'medical', 'personal'],
    formFields: GENERIC_CONSULTATION_FIELDS,
    plans: [
      {
        slug: 'standard',
        name: 'Standard',
        tagline: 'Health-focused astrological guidance',
        priceINR: 9999,
        priceLabel: '₹9,999',
        features: ['Health house analysis', 'Favourable periods identification', '60-min consultation', 'Lifestyle recommendations report'],
        ctaText: 'Book Session →',
        variant: 'featured',
      },
    ],
  },
  {
    id: 'family-harmony',
    category: 'personal',
    name: 'Family Harmony',
    shortDescription: 'Restore balance and harmony within family dynamics through cosmic insight.',
    icon: 'Users',
    requiresSlot: true,
    tags: ['family', 'harmony', 'personal'],
    formFields: GENERIC_CONSULTATION_FIELDS,
    plans: [
      {
        slug: 'standard',
        name: 'Standard',
        tagline: 'Family dynamics analysis',
        priceINR: 9999,
        priceLabel: '₹9,999',
        features: ['Family chart analysis', 'Conflict resolution guidance', '60-min consultation', 'Written recommendations'],
        ctaText: 'Book Session →',
        variant: 'featured',
      },
    ],
  },
  {
    id: 'mobile-analysis',
    category: 'personal',
    name: 'Mobile Number Analysis',
    shortDescription: 'Discover the hidden vibrational frequency of your phone number and align it with your destiny.',
    icon: 'Phone',
    requiresSlot: true,
    tags: ['mobile', 'number', 'numerology', 'personal'],
    formFields: MOBILE_ANALYSIS_FIELDS,
    plans: [
      {
        slug: 'standard',
        name: 'Standard',
        tagline: 'Complete Mobile Number Vetting',
        priceINR: 4999,
        priceLabel: '₹4,999',
        features: [
          'Current number vibration analysis',
          'Astro-numerological chart matching',
          '3 custom lucky alternative number suggestions',
          '45-min one-on-one consultation',
          'Detailed PDF recommendation report',
        ],
        ctaText: 'Book Analysis →',
        variant: 'featured',
      },
    ],
  },
  {
    id: 'signature-analysis',
    category: 'personal',
    name: 'Signature & Handwriting Analysis',
    shortDescription: 'Calibrate your signature and handwriting strokes to unlock confidence, leadership, and prosperity.',
    icon: 'PenTool',
    requiresSlot: true,
    tags: ['signature', 'handwriting', 'alignment', 'personal'],
    formFields: SIGNATURE_ANALYSIS_FIELDS,
    plans: [
      {
        slug: 'standard',
        name: 'Standard',
        tagline: 'Signature & Stroke Alignment',
        priceINR: 4999,
        priceLabel: '₹4,999',
        features: [
          'Analysis of your current signature and handwriting',
          'Stroke-by-stroke vibration and angle check',
          'Optimized signature design templates',
          '45-min one-on-one consultation',
          'Written guidelines for handwriting correctives',
        ],
        ctaText: 'Book Analysis →',
        variant: 'featured',
      },
    ],
  },

  // ─── Property Solutions ────────────────────────────────────────────────────
  {
    id: 'residential-vastu',
    category: 'property',
    name: 'Residential Vastu',
    shortDescription: 'Complete Vastu analysis for your home — harmony, health, and prosperity.',
    icon: 'Home',
    requiresSlot: true,
    tags: ['vastu', 'residential', 'home', 'property'],
    formFields: RESIDENTIAL_VASTU_FIELDS,
    plans: [
      {
        slug: 'basic',
        name: 'Basic',
        tagline: 'Essential home Vastu audit',
        priceINR: 14999,
        priceLabel: '₹14,999',
        features: ['Directional analysis', 'Room-wise Vastu scoring', '60-min consultation', 'Written summary report', '30-day email support'],
        ctaText: 'Book Basic →',
        variant: 'light',
      },
      {
        slug: 'premium',
        name: 'Premium',
        tagline: 'Comprehensive home Vastu transformation',
        priceINR: 34999,
        priceLabel: '₹34,999',
        features: ['Full zone-by-zone audit', 'Geopathic stress check', '90-min consultation × 2', 'Detailed colour-coded report', 'Implementation checklist', '60-day WhatsApp support'],
        ctaText: 'Book Premium →',
        variant: 'featured',
      },
    ],
  },
  {
    id: 'apartment-vastu',
    category: 'property',
    name: 'Apartment Vastu',
    shortDescription: 'Vastu corrections for apartment living — renter-friendly, no structural changes.',
    icon: 'Building',
    requiresSlot: true,
    tags: ['vastu', 'apartment', 'flat', 'property'],
    formFields: RESIDENTIAL_VASTU_FIELDS,
    plans: [
      {
        slug: 'standard',
        name: 'Standard',
        tagline: 'Apartment-specific Vastu',
        priceINR: 12999,
        priceLabel: '₹12,999',
        features: ['Furniture-based corrections', 'No structural changes needed', 'Direction alignment', '60-min consultation', 'Written report'],
        ctaText: 'Book Audit →',
        variant: 'featured',
      },
    ],
  },
  {
    id: 'villa-planning',
    category: 'property',
    name: 'Villa Planning',
    shortDescription: 'Pre-construction Vastu planning for luxury villas and independent homes.',
    icon: 'Castle',
    requiresSlot: true,
    tags: ['vastu', 'villa', 'construction', 'planning'],
    formFields: RESIDENTIAL_VASTU_FIELDS,
    plans: [
      {
        slug: 'standard',
        name: 'Standard',
        tagline: 'Pre-construction Vastu planning',
        priceINR: 49999,
        priceLabel: '₹49,999',
        features: ['Plot analysis', 'Architecture direction guidance', 'Room placement recommendations', 'Architect briefing session', 'Detailed construction report'],
        ctaText: 'Book Planning →',
        variant: 'featured',
      },
    ],
  },
  {
    id: 'new-construction',
    category: 'property',
    name: 'New Construction',
    shortDescription: 'Ground-up Vastu integration for new residential construction projects.',
    icon: 'HardHat',
    requiresSlot: true,
    tags: ['vastu', 'construction', 'new', 'building'],
    formFields: RESIDENTIAL_VASTU_FIELDS,
    plans: [
      {
        slug: 'standard',
        name: 'Standard',
        tagline: 'New build Vastu integration',
        priceINR: 59999,
        priceLabel: '₹59,999',
        features: ['Complete ground-up Vastu plan', 'Foundation ceremony timing', 'Architect & contractor briefing', 'Construction phase oversight', 'Post-completion audit'],
        ctaText: 'Book Consultation →',
        variant: 'featured',
      },
    ],
  },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Get all services in a specific category */
export function getServicesByCategory(category: ServiceCategory): ServiceDefinition[] {
  return SERVICE_CATALOG.filter((s) => s.category === category);
}

/** Find a service by its slug (id) */
export function getServiceById(id: string): ServiceDefinition | undefined {
  return SERVICE_CATALOG.find((s) => s.id === id);
}

/** Find a specific plan within a service */
export function getServicePlan(serviceId: string, planSlug: string): ServicePlan | undefined {
  const service = getServiceById(serviceId);
  return service?.plans.find((p) => p.slug === planSlug);
}

/** Get all categories that have at least one service */
export function getActiveCategories(): ServiceCategory[] {
  const cats = new Set(SERVICE_CATALOG.map((s) => s.category));
  return Array.from(cats) as ServiceCategory[];
}

/** Flat list of all services grouped by category (for mega menus, solutions page) */
export function getServicesByCategoryMap(): Record<ServiceCategory, ServiceDefinition[]> {
  return {
    business: getServicesByCategory('business'),
    leadership: getServicesByCategory('leadership'),
    personal: getServicesByCategory('personal'),
    property: getServicesByCategory('property'),
  };
}

/** Featured services for the homepage (first from each category) */
export function getFeaturedServices(): ServiceDefinition[] {
  return [
    SERVICE_CATALOG.find((s) => s.id === 'business-vastu')!,
    SERVICE_CATALOG.find((s) => s.id === 'strategic-consulting')!,
    SERVICE_CATALOG.find((s) => s.id === 'career-guidance')!,
    SERVICE_CATALOG.find((s) => s.id === 'residential-vastu')!,
  ];
}
