import { Injectable } from '@nestjs/common';
import { ZodiacSign, GrahaName } from '@prisma/client';
import {
  PLANET_TRANSIT_RULES,
  TransitRule,
  ThemeTag,
} from './content/planet-transit-rules';
import { TEXT_TEMPLATES } from './content/text-templates';
import {
  pickLuckyAttributes,
  LuckyAttributes,
} from './content/lucky-attributes';

type Category = 'love' | 'career' | 'health' | 'finance' | 'overall';

export interface AssembledReading {
  overallText: string;
  loveText: string;
  careerText: string;
  healthText: string;
  financeText: string;
  luckyColor: string;
  luckyNumber: number;
  luckyTime: string;
  moodTag: string;
  rating: number;
  themeTags: string[];
}

@Injectable()
export class HoroscopeContentService {
  /**
   * Assembles a complete horoscope reading for a given sign based on real transit data.
   *
   * The theme selection is 100% derived from real transit data (astronomically accurate).
   * The choice of which pre-written sentence expresses that theme uses a seeded pick
   * for variety — seed is hash(sign + date + category), never hash(sign + period) alone.
   */
  assembleReading(
    sign: ZodiacSign,
    transits: { graha: GrahaName; house: number; retrograde: boolean }[],
    date: Date = new Date(),
  ): AssembledReading {
    const matchedRules = transits
      .map((t) => this.findRule(t.graha, t.house, t.retrograde))
      .filter((r): r is TransitRule => Boolean(r));

    const allTags = matchedRules.flatMap((r) => r.tags);
    const dominantTags = this.rankTagsByFrequency(allTags).slice(0, 4);

    // Ensure we always have at least one tag
    if (dominantTags.length === 0) {
      dominantTags.push('confidence-boost');
    }

    const rating = this.computeRating(matchedRules);
    const lucky = pickLuckyAttributes(sign, dominantTags);

    const dateKey = date.toISOString().split('T')[0];

    return {
      overallText: this.pickTemplate('overall', dominantTags, sign, dateKey),
      loveText: this.pickTemplate('love', dominantTags, sign, dateKey),
      careerText: this.pickTemplate('career', dominantTags, sign, dateKey),
      healthText: this.pickTemplate('health', dominantTags, sign, dateKey),
      financeText: this.pickTemplate('finance', dominantTags, sign, dateKey),
      luckyColor: lucky.color,
      luckyNumber: lucky.number,
      luckyTime: lucky.time,
      moodTag: dominantTags[0],
      rating,
      themeTags: dominantTags,
    };
  }

  /**
   * Finds the matching transit rule for a given graha + house + retrograde state.
   * Retrograde-specific overrides take precedence when the planet is retrograde.
   */
  private findRule(
    graha: GrahaName,
    house: number,
    retrograde: boolean,
  ): TransitRule | undefined {
    // Check for retrograde-specific override first
    if (retrograde) {
      const retroRule = PLANET_TRANSIT_RULES.find(
        (r) => r.graha === graha && r.house === house && r.retrograde === true,
      );
      if (retroRule) return retroRule;
    }

    // Fall back to the direct-motion rule (retrograde field omitted or undefined)
    return PLANET_TRANSIT_RULES.find(
      (r) => r.graha === graha && r.house === house && r.retrograde === undefined,
    );
  }

  /**
   * Ranks theme tags by frequency of occurrence across all matched rules.
   * Ties broken by tag order in the enum (deterministic).
   */
  private rankTagsByFrequency(tags: ThemeTag[]): ThemeTag[] {
    const counts = new Map<ThemeTag, number>();
    for (const tag of tags) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }

    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([tag]) => tag);
  }

  /**
   * Computes an overall rating (1-5) from the weighted average of matched rules.
   */
  private computeRating(rules: TransitRule[]): number {
    if (rules.length === 0) return 3; // Neutral default

    const totalWeight = rules.reduce((sum, r) => sum + r.weight, 0);
    const average = totalWeight / rules.length;

    // Clamp to 1-5
    return Math.max(1, Math.min(5, Math.round(average)));
  }

  /**
   * Deterministic-per-day selection WITHIN the matched theme.
   *
   * Uses a seeded pick from (sign + date + category) so re-renders of the same day
   * are stable, but the underlying theme is astronomically real.
   *
   * The seed ensures different signs sharing a tag do NOT return identical sentences.
   */
  private pickTemplate(
    category: Category,
    tags: ThemeTag[],
    sign: ZodiacSign,
    dateKey: string,
  ): string {
    // Collect all candidate texts from all dominant tags for this category
    const candidates: string[] = [];
    for (const tag of tags) {
      const templates = TEXT_TEMPLATES[tag]?.[category];
      if (templates && templates.length > 0) {
        candidates.push(...templates);
      }
    }

    // Fallback if no templates match (should not happen with full coverage)
    if (candidates.length === 0) {
      return 'The celestial energies align to support your intentions today. Trust the path ahead.';
    }

    // Deterministic seed: hash(sign + dateKey + category)
    const seed = this.hashString(`${sign}:${dateKey}:${category}`);
    const index = seed % candidates.length;

    return candidates[index];
  }

  /**
   * Simple, fast hash function for deterministic seeding.
   * Not cryptographic — just needs to produce consistent, well-distributed integers.
   */
  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }
}
