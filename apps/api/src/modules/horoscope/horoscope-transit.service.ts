import { Injectable } from '@nestjs/common';
import { EphemerisService } from '../tools/ephemeris.service';
import { ZodiacSign, GrahaName } from '@prisma/client';
import { TransitSnapshot } from './interfaces/transit-snapshot.interface';

const SIGN_ORDER: ZodiacSign[] = [
  'ARIES', 'TAURUS', 'GEMINI', 'CANCER', 'LEO', 'VIRGO',
  'LIBRA', 'SCORPIO', 'SAGITTARIUS', 'CAPRICORN', 'AQUARIUS', 'PISCES',
];

@Injectable()
export class HoroscopeTransitService {
  constructor(private readonly ephemerisService: EphemerisService) {}

  /**
   * Returns sidereal (Lahiri Ayanamsa) positions for all 9 Grahas for the given date.
   * Delegates entirely to EphemerisService — no independent swisseph calls here.
   */
  getCurrentTransitPositions(date: Date): TransitSnapshot[] {
    const positions = this.ephemerisService.getPlanetaryPositions(date);
    return positions.map((p) => ({
      graha: p.graha,
      sign: p.sign,
      longitudeDegrees: p.longitude,
      retrograde: p.retrograde,
    }));
  }

  /**
   * Computes which house (1-12) a transiting planet occupies relative to a given Moon sign.
   * This is the core Gochar (transit) calculation.
   */
  computeHouseFromMoonSign(moonSign: ZodiacSign, planetSign: ZodiacSign): number {
    const moonIndex = SIGN_ORDER.indexOf(moonSign);
    const planetIndex = SIGN_ORDER.indexOf(planetSign);
    return ((planetIndex - moonIndex + 12) % 12) + 1;
  }

  /**
   * Builds the full per-sign transit map used by the content assembler:
   * for every Moon sign, for every planet, which house is it transiting.
   */
  buildTransitMapForAllSigns(date: Date): Record<
    ZodiacSign,
    { graha: GrahaName; house: number; retrograde: boolean }[]
  > {
    const snapshot = this.getCurrentTransitPositions(date);
    const result = {} as Record<
      ZodiacSign,
      { graha: GrahaName; house: number; retrograde: boolean }[]
    >;

    for (const sign of SIGN_ORDER) {
      result[sign] = snapshot.map((p) => ({
        graha: p.graha,
        house: this.computeHouseFromMoonSign(sign, p.sign),
        retrograde: p.retrograde,
      }));
    }
    return result;
  }
}
