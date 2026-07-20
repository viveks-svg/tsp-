import type { BookingContentConfig } from '../types';
import type { FormField } from '@/lib/data/service-catalog';

const BUSINESS_VASTU_DETAIL_FIELDS: FormField[] = [
  { name: 'businessName', label: 'Business Name', type: 'text', required: true, section: 'Business Details' },
  { name: 'spaceType', label: 'Space Type', type: 'select', required: true, options: ['Office', 'Factory', 'Retail / Showroom', 'Hotel / Hospitality', 'Co-working Space', 'Warehouse', 'Other'], section: 'Business Details' },
  { name: 'businessAddress', label: 'Business Address', type: 'textarea', required: false, section: 'Business Details', placeholder: 'Enter the full address of your business premises' },
  { name: 'businessProblems', label: 'Current Challenges', type: 'textarea', placeholder: 'Describe any specific issues or goals — e.g. cash flow, team friction, stagnation…', required: false, section: 'Business Details' },
];

export const BUSINESS_VASTU_CONTENT: BookingContentConfig = {
  solutionSlug: 'business-vastu',
  solutionName: 'Business Vastu',
  detailFields: BUSINESS_VASTU_DETAIL_FIELDS,
  requiresSlot: true,

  hero: {
    subtitle: 'Spatial Resonance Science',
    title: 'Business Vastu Consultation',
    description:
      'Transform your commercial space into a prosperity engine. Spatial alignment is the silent driver of business trajectory — by harmonising your workspace, you establish a high-resonance environment that naturally attracts growth, operational coherence, and stable wealth creation.',
    shloka: {
      text: '\"वास्तुशास्त्रं प्रवक्ष्यामि लोकानां हितकाम्यया।\"',
      attribution: '— Vastu Shastra: Written for the prosperity of all operations',
    },
    ctaText: 'Begin Your Vastu Audit',
    image: '/images/dr-pradeep-sharma.png',
  },

  narrative: {
    heading: 'Why Spatial Alignment Matters',
    points: [
      'Accelerate cash flow cycles and eliminate capital bottlenecks through directional optimization.',
      'Optimise the leadership zone to enhance strategic vision and clarity in decision-making.',
      'Harmonise employee zones to boost operational output, collaboration, and workplace satisfaction.',
    ],
  },

  process: [
    {
      title: 'Spatial Diagnostics',
      description:
        'Complete direction mapping using precision grids to analyse floor plans, exits, and core quadrants.',
    },
    {
      title: 'Founder-Space Resonance',
      description:
        "Aligning the primary decision-makers' birth charts with their desk orientation for maximum clarity.",
    },
    {
      title: 'Remedial Architecture',
      description:
        'Implementing non-destructive remedies using micro-elements, metal rods, and colors to balance spatial zones.',
    },
  ],
};
