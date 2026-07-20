import type { BookingContentConfig } from '../types';
import type { FormField } from '@/lib/data/service-catalog';

const CAREER_GUIDANCE_DETAIL_FIELDS: FormField[] = [
  { name: 'dateOfBirth', label: 'Date of Birth', type: 'date', required: true, section: 'Birth Details' },
  { name: 'timeOfBirth', label: 'Time of Birth', type: 'time', required: true, section: 'Birth Details' },
  { name: 'placeOfBirth', label: 'Place of Birth', type: 'text', required: true, section: 'Birth Details' },
  { name: 'currentRole', label: 'Current Role / Profession', type: 'text', required: false, section: 'Career Context', placeholder: 'e.g. Marketing Manager at XYZ Corp' },
  { name: 'careerGoals', label: 'Career Goals or Challenges', type: 'textarea', placeholder: 'What specific career guidance are you seeking? Describe your aspirations or concerns…', required: false, section: 'Career Context' },
];

export const CAREER_GUIDANCE_CONTENT: BookingContentConfig = {
  solutionSlug: 'career-guidance',
  solutionName: 'Career Guidance',
  detailFields: CAREER_GUIDANCE_DETAIL_FIELDS,
  requiresSlot: true,

  hero: {
    subtitle: 'Personal Vedic Career Audit',
    title: 'Career Guidance Consultation',
    description:
      'Your birth chart holds a blueprint of your professional strengths, ideal industries, and peak career periods. Career Guidance maps your astrological profile to actionable career moves — whether you\'re pivoting, climbing, or starting fresh.',
    shloka: {
      text: '\"कर्मण्येवाधिकारस्ते मा फलेषु कदाचन।\"',
      attribution: '— Bhagavad Gita 2.47: Your right is to action alone, not to its fruits',
    },
    ctaText: 'Book Career Session',
    image: '/images/dr-pradeep-sharma.png',
  },

  narrative: {
    heading: 'Why Your Chart Knows Your Career',
    points: [
      'Identify your Dashamsa (career house) strengths to align with industries where you naturally excel.',
      'Map upcoming planetary transits to find the optimal window for job changes, promotions, or entrepreneurship.',
      'Understand recurring career blockages and receive targeted remedies to break through stagnation.',
    ],
  },

  process: [
    {
      title: 'Birth Chart Construction',
      description:
        'Building your precise natal chart with Dashamsa divisional analysis for career-specific insights.',
    },
    {
      title: 'Strength & Gap Mapping',
      description:
        'Identifying your planetary strengths aligned to professional domains and pinpointing areas of friction.',
    },
    {
      title: 'Career Roadmap',
      description:
        'Delivering a personalized timeline of favorable periods with specific action recommendations.',
    },
  ],
};
