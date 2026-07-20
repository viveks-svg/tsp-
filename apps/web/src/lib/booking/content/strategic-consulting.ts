import type { BookingContentConfig } from '../types';
import type { FormField } from '@/lib/data/service-catalog';

const STRATEGIC_CONSULTING_DETAIL_FIELDS: FormField[] = [
  { name: 'decisionType', label: 'Decision Area', type: 'select', required: true, options: ['Expansion', 'Investment', 'Partnership', 'Acquisition', 'Market Entry', 'Restructuring', 'Other'], section: 'Strategic Context' },
  { name: 'background', label: 'Brief Background', type: 'textarea', placeholder: 'Describe the situation requiring strategic guidance — timeline, stakes, and key considerations…', required: true, section: 'Strategic Context' },
  { name: 'dateOfBirth', label: 'Date of Birth', type: 'date', required: true, section: 'Birth Details' },
  { name: 'timeOfBirth', label: 'Time of Birth', type: 'time', required: false, section: 'Birth Details' },
  { name: 'placeOfBirth', label: 'Place of Birth', type: 'text', required: false, section: 'Birth Details' },
];

export const STRATEGIC_CONSULTING_CONTENT: BookingContentConfig = {
  solutionSlug: 'strategic-consulting',
  solutionName: 'Strategic Decision Consulting',
  detailFields: STRATEGIC_CONSULTING_DETAIL_FIELDS,
  requiresSlot: true,

  hero: {
    subtitle: 'Astrological Timeline Optimization',
    title: 'Strategic Decision Consulting',
    description:
      'Every critical business decision — expansion, investment, partnership — has an optimal execution window. Strategic Decision Consulting maps your leadership chart against planetary cycles to identify windows of maximum leverage and minimal resistance.',
    shloka: {
      text: '\"योगः कर्मसु कौशलम्॥\"',
      attribution: '— Bhagavad Gita 2.50: Strategy is alignment and skill in action',
    },
    ctaText: 'Initiate Strategy Session',
    image: '/images/dr-pradeep.png',
  },

  narrative: {
    heading: 'Why Timing Dictates Outcome',
    points: [
      'Map expansion and investment decisions against your most favorable planetary periods for maximum ROI.',
      'Identify partnership compatibility through corporate synastry — before signing on the dotted line.',
      'Navigate restructuring and pivots during stable transits to minimize organizational disruption.',
    ],
  },

  process: [
    {
      title: 'Leadership Chart Analysis',
      description:
        'Constructing a detailed birth chart for the primary decision-maker and cross-referencing with current transits.',
    },
    {
      title: 'Timeline Mapping',
      description:
        'Identifying optimal execution windows for the specific decision type — when to act, when to hold.',
    },
    {
      title: 'Strategic Directives',
      description:
        'Delivering actionable timing directives and contingency windows with clear reasoning.',
    },
  ],
};
