import { ZodiacSign } from '@prisma/client';
import { ThemeTag } from './planet-transit-rules';

/**
 * Lucky color palettes mapped by zodiac sign.
 * Each sign has a base palette; the specific color chosen depends on dominant theme tags.
 */
const SIGN_COLORS: Record<ZodiacSign, string[]> = {
  ARIES: ['Crimson Red', 'Coral Orange', 'Fiery Gold', 'Rust Brown', 'Scarlet'],
  TAURUS: ['Emerald Green', 'Rose Pink', 'Ivory White', 'Pastel Blue', 'Forest Green'],
  GEMINI: ['Lemon Yellow', 'Sky Blue', 'Light Green', 'Silver Grey', 'Mint'],
  CANCER: ['Pearl White', 'Silver', 'Sea Green', 'Cream', 'Moonstone Blue'],
  LEO: ['Golden Yellow', 'Burnt Orange', 'Royal Purple', 'Amber', 'Sunflower'],
  VIRGO: ['Sage Green', 'Earth Brown', 'Navy Blue', 'Wheat', 'Olive'],
  LIBRA: ['Pastel Pink', 'Baby Blue', 'Lavender', 'Ivory', 'Rose Gold'],
  SCORPIO: ['Deep Maroon', 'Black', 'Blood Red', 'Dark Purple', 'Charcoal'],
  SAGITTARIUS: ['Royal Blue', 'Purple', 'Turquoise', 'Plum', 'Indigo'],
  CAPRICORN: ['Dark Brown', 'Charcoal Grey', 'Forest Green', 'Khaki', 'Steel Blue'],
  AQUARIUS: ['Electric Blue', 'Turquoise', 'Violet', 'Neon Green', 'Aquamarine'],
  PISCES: ['Sea Green', 'Lilac', 'Aqua Blue', 'Mauve', 'Soft Yellow'],
};

/**
 * Lucky number ranges mapped by sign element.
 * Fire (1,3,9), Earth (2,4,8), Air (5,6,7), Water (2,7,9)
 */
const SIGN_NUMBERS: Record<ZodiacSign, number[]> = {
  ARIES: [1, 9, 3, 5, 8],
  TAURUS: [2, 6, 4, 8, 5],
  GEMINI: [3, 5, 7, 6, 1],
  CANCER: [2, 7, 9, 4, 6],
  LEO: [1, 4, 9, 5, 3],
  VIRGO: [5, 3, 6, 2, 8],
  LIBRA: [6, 5, 3, 7, 2],
  SCORPIO: [9, 1, 8, 4, 2],
  SAGITTARIUS: [3, 9, 5, 7, 1],
  CAPRICORN: [8, 4, 6, 1, 2],
  AQUARIUS: [4, 7, 8, 3, 9],
  PISCES: [7, 3, 9, 2, 5],
};

/**
 * Lucky time slots anchored to Vedic hora concepts.
 */
const TIME_SLOTS: string[] = [
  '6:00 AM - 7:30 AM',
  '7:30 AM - 9:00 AM',
  '9:00 AM - 10:30 AM',
  '10:30 AM - 12:00 PM',
  '12:00 PM - 1:30 PM',
  '1:30 PM - 3:00 PM',
  '3:00 PM - 4:30 PM',
  '4:30 PM - 6:00 PM',
  '6:00 PM - 7:30 PM',
  '7:30 PM - 9:00 PM',
];

/** Theme tag → index offset for deterministic variety */
const TAG_WEIGHT: Partial<Record<ThemeTag, number>> = {
  'career-growth': 0,
  'financial-gain': 1,
  'romance-favorable': 2,
  'health-vitality': 3,
  'confidence-boost': 4,
  'spiritual-growth': 5,
  'creative-expression': 6,
  'travel-favorable': 7,
  'education-focus': 8,
  'communication-clarity': 9,
  'career-obstacles': 2,
  'financial-caution': 3,
  'romance-friction': 4,
  'health-caution': 5,
  'family-harmony': 1,
  'family-tension': 6,
  'communication-conflict': 7,
  'hidden-obstacles': 8,
  'sudden-change': 9,
  'emotional-sensitivity': 0,
};

export interface LuckyAttributes {
  color: string;
  number: number;
  time: string;
}

/**
 * Picks lucky color, number, and time for a given sign and dominant theme tags.
 * Uses the tag combination to deterministically select from sign-specific palettes.
 */
export function pickLuckyAttributes(
  sign: ZodiacSign,
  dominantTags: ThemeTag[],
): LuckyAttributes {
  const tagOffset = dominantTags.reduce((sum, tag) => sum + (TAG_WEIGHT[tag] ?? 0), 0);

  const colors = SIGN_COLORS[sign];
  const numbers = SIGN_NUMBERS[sign];

  return {
    color: colors[tagOffset % colors.length],
    number: numbers[tagOffset % numbers.length],
    time: TIME_SLOTS[tagOffset % TIME_SLOTS.length],
  };
}
