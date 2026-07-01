import { GrahaName } from '@prisma/client';

export type ThemeTag =
  | 'career-growth'
  | 'career-obstacles'
  | 'financial-gain'
  | 'financial-caution'
  | 'romance-favorable'
  | 'romance-friction'
  | 'family-harmony'
  | 'family-tension'
  | 'health-vitality'
  | 'health-caution'
  | 'travel-favorable'
  | 'communication-clarity'
  | 'communication-conflict'
  | 'spiritual-growth'
  | 'education-focus'
  | 'creative-expression'
  | 'hidden-obstacles'
  | 'sudden-change'
  | 'emotional-sensitivity'
  | 'confidence-boost';

export interface TransitRule {
  graha: GrahaName;
  house: number; // 1-12, house from the Moon sign
  retrograde?: boolean; // omit = applies to direct motion; true = retrograde-specific override
  tags: ThemeTag[];
  weight: number; // 1-5, contributes to the overall daily "rating" score
}

export const PLANET_TRANSIT_RULES: TransitRule[] = [
  // ─── SUN — vitality, authority, career visibility (~1 month/sign) ─────────
  { graha: 'SUN', house: 1, tags: ['confidence-boost', 'health-vitality'], weight: 4 },
  { graha: 'SUN', house: 2, tags: ['financial-gain', 'family-harmony'], weight: 3 },
  { graha: 'SUN', house: 3, tags: ['confidence-boost', 'communication-clarity'], weight: 4 },
  { graha: 'SUN', house: 4, tags: ['family-tension', 'health-caution'], weight: 2 },
  { graha: 'SUN', house: 5, tags: ['creative-expression', 'education-focus'], weight: 4 },
  { graha: 'SUN', house: 6, tags: ['career-growth', 'health-caution'], weight: 3 },
  { graha: 'SUN', house: 7, tags: ['romance-friction', 'career-obstacles'], weight: 2 },
  { graha: 'SUN', house: 8, tags: ['sudden-change', 'hidden-obstacles'], weight: 1 },
  { graha: 'SUN', house: 9, tags: ['spiritual-growth', 'travel-favorable'], weight: 5 },
  { graha: 'SUN', house: 10, tags: ['career-growth', 'confidence-boost'], weight: 5 },
  { graha: 'SUN', house: 11, tags: ['financial-gain', 'career-growth'], weight: 5 },
  { graha: 'SUN', house: 12, tags: ['health-caution', 'hidden-obstacles'], weight: 1 },

  // ─── MOON — daily mood/emotional tone (~2.25 days/sign — dominant DAILY driver) ─
  { graha: 'MOON', house: 1, tags: ['emotional-sensitivity', 'confidence-boost'], weight: 4 },
  { graha: 'MOON', house: 2, tags: ['financial-gain', 'family-harmony'], weight: 4 },
  { graha: 'MOON', house: 3, tags: ['communication-clarity', 'travel-favorable'], weight: 4 },
  { graha: 'MOON', house: 4, tags: ['family-harmony', 'emotional-sensitivity'], weight: 5 },
  { graha: 'MOON', house: 5, tags: ['romance-favorable', 'creative-expression'], weight: 5 },
  { graha: 'MOON', house: 6, tags: ['health-caution', 'career-obstacles'], weight: 2 },
  { graha: 'MOON', house: 7, tags: ['romance-favorable', 'family-harmony'], weight: 4 },
  { graha: 'MOON', house: 8, tags: ['emotional-sensitivity', 'hidden-obstacles'], weight: 1 },
  { graha: 'MOON', house: 9, tags: ['spiritual-growth', 'travel-favorable'], weight: 5 },
  { graha: 'MOON', house: 10, tags: ['career-growth', 'confidence-boost'], weight: 4 },
  { graha: 'MOON', house: 11, tags: ['financial-gain', 'family-harmony'], weight: 5 },
  { graha: 'MOON', house: 12, tags: ['emotional-sensitivity', 'health-caution'], weight: 2 },

  // ─── MARS — energy, conflict, courage (~1.5-2 months/sign) ────────────────
  { graha: 'MARS', house: 1, tags: ['confidence-boost', 'health-vitality'], weight: 4 },
  { graha: 'MARS', house: 2, tags: ['financial-caution', 'family-tension'], weight: 2 },
  { graha: 'MARS', house: 3, tags: ['confidence-boost', 'sudden-change'], weight: 4 },
  { graha: 'MARS', house: 4, tags: ['family-tension'], weight: 2 },
  { graha: 'MARS', house: 5, tags: ['romance-friction', 'creative-expression'], weight: 3 },
  { graha: 'MARS', house: 6, tags: ['career-growth', 'health-caution'], weight: 4 },
  { graha: 'MARS', house: 7, tags: ['romance-friction', 'communication-conflict'], weight: 2 },
  { graha: 'MARS', house: 8, tags: ['sudden-change', 'health-caution'], weight: 1 },
  { graha: 'MARS', house: 9, tags: ['travel-favorable', 'sudden-change'], weight: 3 },
  { graha: 'MARS', house: 10, tags: ['career-growth', 'confidence-boost'], weight: 5 },
  { graha: 'MARS', house: 11, tags: ['financial-gain', 'career-growth'], weight: 5 },
  { graha: 'MARS', house: 12, tags: ['health-caution', 'hidden-obstacles'], weight: 1 },
  { graha: 'MARS', house: 7, retrograde: true, tags: ['romance-friction', 'communication-conflict', 'hidden-obstacles'], weight: 1 },

  // ─── MERCURY — communication, intellect, business (~3-4 weeks/sign; retro ~3x/year) ─
  { graha: 'MERCURY', house: 1, tags: ['communication-clarity', 'confidence-boost'], weight: 4 },
  { graha: 'MERCURY', house: 2, tags: ['financial-gain', 'communication-clarity'], weight: 3 },
  { graha: 'MERCURY', house: 3, tags: ['communication-clarity', 'travel-favorable'], weight: 5 },
  { graha: 'MERCURY', house: 4, tags: ['family-harmony', 'education-focus'], weight: 3 },
  { graha: 'MERCURY', house: 5, tags: ['creative-expression', 'education-focus'], weight: 4 },
  { graha: 'MERCURY', house: 6, tags: ['career-growth', 'communication-conflict'], weight: 3 },
  { graha: 'MERCURY', house: 7, tags: ['romance-favorable', 'communication-clarity'], weight: 3 },
  { graha: 'MERCURY', house: 8, tags: ['hidden-obstacles', 'sudden-change'], weight: 2 },
  { graha: 'MERCURY', house: 9, tags: ['education-focus', 'travel-favorable'], weight: 4 },
  { graha: 'MERCURY', house: 10, tags: ['career-growth', 'communication-clarity'], weight: 5 },
  { graha: 'MERCURY', house: 11, tags: ['financial-gain', 'communication-clarity'], weight: 4 },
  { graha: 'MERCURY', house: 12, tags: ['hidden-obstacles', 'communication-conflict'], weight: 1 },
  { graha: 'MERCURY', house: 1, retrograde: true, tags: ['communication-conflict', 'hidden-obstacles'], weight: 1 },
  { graha: 'MERCURY', house: 3, retrograde: true, tags: ['communication-conflict', 'travel-favorable'], weight: 2 },
  { graha: 'MERCURY', house: 10, retrograde: true, tags: ['career-obstacles', 'communication-conflict'], weight: 1 },

  // ─── JUPITER — fortune, wisdom, growth (~1 year/sign — dominant MONTHLY/YEARLY) ─
  { graha: 'JUPITER', house: 1, tags: ['confidence-boost', 'spiritual-growth'], weight: 5 },
  { graha: 'JUPITER', house: 2, tags: ['financial-gain', 'family-harmony'], weight: 5 },
  { graha: 'JUPITER', house: 3, tags: ['communication-clarity', 'travel-favorable'], weight: 3 },
  { graha: 'JUPITER', house: 4, tags: ['family-harmony', 'financial-gain'], weight: 4 },
  { graha: 'JUPITER', house: 5, tags: ['education-focus', 'romance-favorable', 'creative-expression'], weight: 5 },
  { graha: 'JUPITER', house: 6, tags: ['career-obstacles', 'health-caution'], weight: 2 },
  { graha: 'JUPITER', house: 7, tags: ['romance-favorable', 'family-harmony'], weight: 4 },
  { graha: 'JUPITER', house: 8, tags: ['hidden-obstacles', 'sudden-change'], weight: 2 },
  { graha: 'JUPITER', house: 9, tags: ['spiritual-growth', 'travel-favorable', 'education-focus'], weight: 5 },
  { graha: 'JUPITER', house: 10, tags: ['career-growth', 'confidence-boost'], weight: 5 },
  { graha: 'JUPITER', house: 11, tags: ['financial-gain', 'career-growth'], weight: 5 },
  { graha: 'JUPITER', house: 12, tags: ['spiritual-growth', 'hidden-obstacles'], weight: 3 },
  { graha: 'JUPITER', house: 1, retrograde: true, tags: ['spiritual-growth', 'career-obstacles'], weight: 3 },

  // ─── VENUS — love, beauty, finance (~3-4 weeks/sign; retro ~40 days/~18 months) ─
  { graha: 'VENUS', house: 1, tags: ['romance-favorable', 'confidence-boost'], weight: 5 },
  { graha: 'VENUS', house: 2, tags: ['financial-gain', 'family-harmony'], weight: 4 },
  { graha: 'VENUS', house: 3, tags: ['communication-clarity', 'creative-expression'], weight: 3 },
  { graha: 'VENUS', house: 4, tags: ['family-harmony', 'romance-favorable'], weight: 4 },
  { graha: 'VENUS', house: 5, tags: ['romance-favorable', 'creative-expression'], weight: 5 },
  { graha: 'VENUS', house: 6, tags: ['romance-friction', 'health-caution'], weight: 2 },
  { graha: 'VENUS', house: 7, tags: ['romance-favorable', 'family-harmony'], weight: 5 },
  { graha: 'VENUS', house: 8, tags: ['romance-friction', 'hidden-obstacles'], weight: 1 },
  { graha: 'VENUS', house: 9, tags: ['spiritual-growth', 'travel-favorable'], weight: 4 },
  { graha: 'VENUS', house: 10, tags: ['career-growth', 'creative-expression'], weight: 4 },
  { graha: 'VENUS', house: 11, tags: ['financial-gain', 'romance-favorable'], weight: 5 },
  { graha: 'VENUS', house: 12, tags: ['romance-favorable', 'spiritual-growth'], weight: 3 },
  { graha: 'VENUS', house: 7, retrograde: true, tags: ['romance-friction', 'communication-conflict'], weight: 1 },
  { graha: 'VENUS', house: 2, retrograde: true, tags: ['financial-caution'], weight: 2 },

  // ─── SATURN — discipline, delay, karma (~2.5 years/sign — dominant YEARLY) ─
  { graha: 'SATURN', house: 1, tags: ['career-obstacles', 'health-caution'], weight: 2 },
  { graha: 'SATURN', house: 2, tags: ['financial-caution', 'family-tension'], weight: 2 },
  { graha: 'SATURN', house: 3, tags: ['career-growth', 'confidence-boost'], weight: 4 },
  { graha: 'SATURN', house: 4, tags: ['family-tension', 'health-caution'], weight: 1 },
  { graha: 'SATURN', house: 5, tags: ['education-focus', 'career-obstacles'], weight: 2 },
  { graha: 'SATURN', house: 6, tags: ['career-growth', 'health-caution'], weight: 4 },
  { graha: 'SATURN', house: 7, tags: ['romance-friction', 'career-obstacles'], weight: 2 },
  { graha: 'SATURN', house: 8, tags: ['hidden-obstacles', 'sudden-change'], weight: 1 },
  { graha: 'SATURN', house: 9, tags: ['spiritual-growth', 'career-obstacles'], weight: 3 },
  { graha: 'SATURN', house: 10, tags: ['career-growth', 'career-obstacles'], weight: 4 },
  { graha: 'SATURN', house: 11, tags: ['financial-gain', 'career-growth'], weight: 5 },
  { graha: 'SATURN', house: 12, tags: ['spiritual-growth', 'hidden-obstacles'], weight: 2 },

  // ─── RAHU — ambition, sudden gain, illusion (always retro; ~1.5 years/sign) ─
  { graha: 'RAHU', house: 1, tags: ['confidence-boost', 'sudden-change'], weight: 3 },
  { graha: 'RAHU', house: 2, tags: ['financial-caution', 'sudden-change'], weight: 2 },
  { graha: 'RAHU', house: 3, tags: ['confidence-boost', 'sudden-change'], weight: 3 },
  { graha: 'RAHU', house: 4, tags: ['family-tension', 'sudden-change'], weight: 2 },
  { graha: 'RAHU', house: 5, tags: ['creative-expression', 'sudden-change'], weight: 3 },
  { graha: 'RAHU', house: 6, tags: ['career-growth', 'hidden-obstacles'], weight: 2 },
  { graha: 'RAHU', house: 7, tags: ['romance-friction', 'sudden-change'], weight: 2 },
  { graha: 'RAHU', house: 8, tags: ['hidden-obstacles', 'sudden-change'], weight: 1 },
  { graha: 'RAHU', house: 9, tags: ['travel-favorable', 'sudden-change'], weight: 3 },
  { graha: 'RAHU', house: 10, tags: ['career-growth', 'sudden-change'], weight: 4 },
  { graha: 'RAHU', house: 11, tags: ['financial-gain', 'sudden-change'], weight: 4 },
  { graha: 'RAHU', house: 12, tags: ['hidden-obstacles', 'financial-caution'], weight: 1 },

  // ─── KETU — detachment, spirituality, hidden loss (always retro; ~1.5 years/sign) ─
  { graha: 'KETU', house: 1, tags: ['emotional-sensitivity', 'hidden-obstacles'], weight: 2 },
  { graha: 'KETU', house: 2, tags: ['financial-caution', 'hidden-obstacles'], weight: 2 },
  { graha: 'KETU', house: 3, tags: ['spiritual-growth', 'communication-conflict'], weight: 2 },
  { graha: 'KETU', house: 4, tags: ['family-tension', 'spiritual-growth'], weight: 2 },
  { graha: 'KETU', house: 5, tags: ['creative-expression', 'spiritual-growth'], weight: 3 },
  { graha: 'KETU', house: 6, tags: ['health-caution', 'hidden-obstacles'], weight: 2 },
  { graha: 'KETU', house: 7, tags: ['romance-friction', 'hidden-obstacles'], weight: 1 },
  { graha: 'KETU', house: 8, tags: ['hidden-obstacles', 'sudden-change'], weight: 1 },
  { graha: 'KETU', house: 9, tags: ['spiritual-growth', 'travel-favorable'], weight: 4 },
  { graha: 'KETU', house: 10, tags: ['career-obstacles', 'spiritual-growth'], weight: 2 },
  { graha: 'KETU', house: 11, tags: ['financial-caution', 'spiritual-growth'], weight: 2 },
  { graha: 'KETU', house: 12, tags: ['spiritual-growth', 'hidden-obstacles'], weight: 3 },
];
