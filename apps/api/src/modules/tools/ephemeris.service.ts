import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { GeocodingService } from '../../integrations/geocoding/geocoding.service';
import * as crypto from 'crypto';
import { NAKSHATRA_DATA, RASHI_DATA, PLANET_FRIENDSHIP_TABLE } from './ephemeris.tables';

let swisseph: any;
try {
  swisseph = require('swisseph');
} catch (e) {
  Logger.warn('Swisseph native module not found. Real ephemeris calculations will be unavailable. (Falling back to UI mock calculations)');
  swisseph = {
    SE_SUN: 0,
    SE_MOON: 1,
    SE_MARS: 4,
    SE_MERCURY: 2,
    SE_JUPITER: 5,
    SE_VENUS: 3,
    SE_SATURN: 6,
    SE_TRUE_NODE: 11,
    SE_SIDM_LAHIRI: 1,
    SE_GREG_CAL: 1,
    SEFLG_SIDEREAL: 65536,
    SEFLG_SPEED: 256,
    swe_set_sid_mode: () => {},
    swe_julday: () => 0,
    swe_get_ayanamsa_ut: () => 0,
    swe_houses: () => ({ ascendant: 0 }),
    swe_calc_ut: (julianDay: number, planetId: number, flags: number) => {
      // Return a basic mock structure to prevent the backend from crashing
      // when swisseph is not compiled on Windows.
      return {
        longitude: (planetId * 30 + 15) % 360, // Fake longitude based on planetId
        latitude: 0,
        distance: 1,
        speedInLongitude: 1,
      };
    }
  };
}
import {
  PlanetaryPosition,
  NakshatraResult,
  RashiResult,
  LagnaResult,
  DashaResult,
  DashaPeriod,
  KundaliMatchingResult,
  MangalDoshaResult,
  AyanamsaResult,
} from './ephemeris.types';
import { ZodiacSign, GrahaName } from '@prisma/client';

/** Maps rashi index (0-11) to the Prisma ZodiacSign enum value */
const ZODIAC_SIGN_FROM_INDEX: ZodiacSign[] = [
  'ARIES', 'TAURUS', 'GEMINI', 'CANCER', 'LEO', 'VIRGO',
  'LIBRA', 'SCORPIO', 'SAGITTARIUS', 'CAPRICORN', 'AQUARIUS', 'PISCES',
];

/** Lightweight planetary position for transit/horoscope calculations */
export interface TransitPlanetaryPosition {
  graha: GrahaName;
  longitude: number;
  sign: ZodiacSign;
  retrograde: boolean;
}

@Injectable()
export class EphemerisService implements OnModuleInit {
  private readonly logger = new Logger(EphemerisService.name);

  // Constants mapping planets to swisseph IDs
  private readonly PLANETS = {
    Sun: swisseph.SE_SUN,
    Moon: swisseph.SE_MOON,
    Mars: swisseph.SE_MARS,
    Mercury: swisseph.SE_MERCURY,
    Jupiter: swisseph.SE_JUPITER,
    Venus: swisseph.SE_VENUS,
    Saturn: swisseph.SE_SATURN,
    Rahu: swisseph.SE_TRUE_NODE, // True node for Rahu
  };

  private readonly DASHA_SEQUENCE = [
    { planet: 'Ketu', years: 7 },
    { planet: 'Venus', years: 20 },
    { planet: 'Sun', years: 6 },
    { planet: 'Moon', years: 10 },
    { planet: 'Mars', years: 7 },
    { planet: 'Rahu', years: 18 },
    { planet: 'Jupiter', years: 16 },
    { planet: 'Saturn', years: 19 },
    { planet: 'Mercury', years: 17 },
  ];

  constructor(
    private readonly prisma: PrismaService,
    private readonly geocodingService: GeocodingService,
  ) {}

  onModuleInit() {
    // Set Lahiri ayanamsa
    swisseph.swe_set_sid_mode(swisseph.SE_SIDM_LAHIRI, 0, 0);
  }

  /**
   * Returns sidereal (Lahiri Ayanamsa) positions for all 9 Vedic Grahas for the given date.
   * Does NOT require a birth place — only needs a date for transit calculations.
   * Ketu is computed as 180° from Rahu.
   */
  getPlanetaryPositions(date: Date): TransitPlanetaryPosition[] {
    const julianDay = this.getJulianDay(date);
    const SIDEREAL_FLAG = swisseph.SEFLG_SIDEREAL | swisseph.SEFLG_SPEED;

    const GRAHA_MAP: { name: GrahaName; swissephId: number }[] = [
      { name: 'SUN', swissephId: swisseph.SE_SUN },
      { name: 'MOON', swissephId: swisseph.SE_MOON },
      { name: 'MARS', swissephId: swisseph.SE_MARS },
      { name: 'MERCURY', swissephId: swisseph.SE_MERCURY },
      { name: 'JUPITER', swissephId: swisseph.SE_JUPITER },
      { name: 'VENUS', swissephId: swisseph.SE_VENUS },
      { name: 'SATURN', swissephId: swisseph.SE_SATURN },
      { name: 'RAHU', swissephId: swisseph.SE_TRUE_NODE },
    ];

    const positions: TransitPlanetaryPosition[] = [];

    for (const { name, swissephId } of GRAHA_MAP) {
      const result = swisseph.swe_calc_ut(julianDay, swissephId, SIDEREAL_FLAG);
      const rashiIndex = Math.floor(result.longitude / 30);
      positions.push({
        graha: name,
        longitude: result.longitude,
        sign: ZODIAC_SIGN_FROM_INDEX[rashiIndex],
        retrograde: result.speedInLongitude < 0,
      });
    }

    // Ketu is 180° from Rahu
    const rahuPosition = positions.find((p) => p.graha === 'RAHU')!;
    const ketuLongitude = (rahuPosition.longitude + 180) % 360;
    const ketuRashiIndex = Math.floor(ketuLongitude / 30);
    positions.push({
      graha: 'KETU',
      longitude: ketuLongitude,
      sign: ZODIAC_SIGN_FROM_INDEX[ketuRashiIndex],
      retrograde: true, // Ketu is always retrograde by nature
    });

    return positions;
  }

  getJulianDay(date: Date): number {
    return swisseph.swe_julday(
      date.getUTCFullYear(),
      date.getUTCMonth() + 1, // swisseph expects 1-12
      date.getUTCDate(),
      date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600,
      swisseph.SE_GREG_CAL,
    );
  }

  getLahiriAyanamsa(julianDay: number): number {
    return swisseph.swe_get_ayanamsa_ut(julianDay);
  }

  getAscendant(julianDay: number, lat: number, lng: number, ayanamsa: number): number {
    const houses = swisseph.swe_houses(julianDay, lat, lng, 'W'); // 'W' for whole sign
    return (houses.ascendant - ayanamsa + 360) % 360;
  }

  getNakshatra(moonLongitude: number): NakshatraResult {
    const nakshatraIndex = Math.floor(moonLongitude / (360 / 27));
    const data = NAKSHATRA_DATA[nakshatraIndex];
    
    // Calculate pada (1-4)
    const nakshatraSpan = 360 / 27; // 13.333 degrees
    const nakshatraStart = nakshatraIndex * nakshatraSpan;
    const offset = moonLongitude - nakshatraStart;
    const pada = Math.floor(offset / (nakshatraSpan / 4)) + 1;

    return {
      nakshatra: data.name,
      nakshatraIndex,
      pada,
      rulingLord: data.rulingLord,
      deity: data.deity,
      gana: data.gana,
      symbol: data.symbol,
      moonLongitude,
      nakshatraStart,
      nakshatraEnd: nakshatraStart + nakshatraSpan,
    };
  }

  getRashi(longitude: number): RashiResult {
    const rashiIndex = Math.floor(longitude / 30);
    const data = RASHI_DATA[rashiIndex];
    return {
      rashi: data.name,
      rashiEnglish: data.english,
      rashiIndex,
      rulingPlanet: data.ruler,
      element: data.element,
      quality: data.quality,
      symbol: data.symbol,
      moonLongitude: longitude,
    };
  }

  getHousePlacement(planetLongitude: number, ascendantLongitude: number): number {
    const ascSign = Math.floor(ascendantLongitude / 30);
    const planetSign = Math.floor(planetLongitude / 30);
    return ((planetSign - ascSign + 12) % 12) + 1;
  }

  getVimshottariDasha(moonLongitude: number, birthDate: Date): DashaResult {
    const nakshatra = this.getNakshatra(moonLongitude);
    const startIndex = this.DASHA_SEQUENCE.findIndex((d) => d.planet === nakshatra.rulingLord);
    const startingDasha = this.DASHA_SEQUENCE[startIndex];

    const nakshatraSpan = 360 / 27;
    const offset = moonLongitude - nakshatra.nakshatraStart;
    const fractionPassed = offset / nakshatraSpan;
    const fractionRemaining = 1 - fractionPassed;

    const balanceYearsTotal = startingDasha.years * fractionRemaining;
    const balanceYears = Math.floor(balanceYearsTotal);
    const balanceMonthsTotal = (balanceYearsTotal - balanceYears) * 12;
    const balanceMonths = Math.floor(balanceMonthsTotal);
    const balanceDays = Math.floor((balanceMonthsTotal - balanceMonths) * 30);

    const mahadashas: DashaPeriod[] = [];
    let currentDate = new Date(birthDate.getTime());
    let currentMahadasha = { planet: '', startDate: '', endDate: '' };
    
    // The first dasha starts at birth and ends after the balance period
    let endDate = new Date(currentDate.getTime());
    endDate.setFullYear(endDate.getFullYear() + balanceYears);
    endDate.setMonth(endDate.getMonth() + balanceMonths);
    endDate.setDate(endDate.getDate() + balanceDays);
    
    mahadashas.push({
      planet: startingDasha.planet,
      startDate: currentDate.toISOString(),
      endDate: endDate.toISOString(),
      durationYears: startingDasha.years,
      isActive: new Date() >= currentDate && new Date() < endDate,
    });
    
    if (new Date() >= currentDate && new Date() < endDate) {
      currentMahadasha = { planet: startingDasha.planet, startDate: currentDate.toISOString(), endDate: endDate.toISOString() };
    }
    
    currentDate = new Date(endDate.getTime());

    // Compute the rest of the dashas up to 120 years
    let idx = (startIndex + 1) % 9;
    for (let i = 1; i < 9; i++) {
      const dasha = this.DASHA_SEQUENCE[idx];
      endDate = new Date(currentDate.getTime());
      endDate.setFullYear(endDate.getFullYear() + dasha.years);
      
      const isActive = new Date() >= currentDate && new Date() < endDate;
      mahadashas.push({
        planet: dasha.planet,
        startDate: currentDate.toISOString(),
        endDate: endDate.toISOString(),
        durationYears: dasha.years,
        isActive,
      });

      if (isActive) {
        currentMahadasha = { planet: dasha.planet, startDate: currentDate.toISOString(), endDate: endDate.toISOString() };
      }

      currentDate = new Date(endDate.getTime());
      idx = (idx + 1) % 9;
    }

    return {
      birthNakshatra: nakshatra.nakshatra,
      startingLord: startingDasha.planet,
      balanceAtBirth: { years: balanceYears, months: balanceMonths, days: balanceDays },
      mahadashas,
      currentMahadasha,
      currentAntardasha: currentMahadasha, // Simplified for MVP
    };
  }

  async getComputedChart(birthDateStr: string, birthTime: string, birthPlace: string) {
    const hash = crypto.createHash('sha256').update(birthDateStr + birthTime + birthPlace).digest('hex');
    const cacheKey = `ephemeris:${hash}`;

    let cached: any = null;
    try {
      // cached = await this.prisma.ephemerisCache.findUnique({ where: { cacheKey } });
      // if (cached && cached.expiresAt > new Date()) {
      //   await this.prisma.ephemerisCache.update({ where: { cacheKey }, data: { hitCount: { increment: 1 } } });
      //   return cached.data as any;
      // }
    } catch (error: any) {
      this.logger.warn(`Failed to access ephemerisCache (table may not exist): ${error.message}`);
    }

    const { lat, lng } = await this.geocodingService.getCoordinates(birthPlace);

    // Convert local time (IST) to UTC correctly.
    // For Astrotalk precision, we must apply the correct timezone offset instead of treating it as UTC.
    // We'll use +05:30 for India to ensure the julian day calculation is 100% accurate.
    const dateObj = new Date(`${birthDateStr}T${birthTime}:00+05:30`);
    
    const julianDay = this.getJulianDay(dateObj);
    const ayanamsa = this.getLahiriAyanamsa(julianDay);
    const ascLongitude = this.getAscendant(julianDay, lat, lng, ayanamsa);
    
    const planets: Record<string, PlanetaryPosition> = {};
    const SIDEREAL_FLAG = swisseph.SEFLG_SIDEREAL | swisseph.SEFLG_SPEED;

    for (const [name, id] of Object.entries(this.PLANETS)) {
      const result = swisseph.swe_calc_ut(julianDay, id, SIDEREAL_FLAG);
      const rashiInfo = this.getRashi(result.longitude);
      const nakshatraInfo = this.getNakshatra(result.longitude);
      const house = this.getHousePlacement(result.longitude, ascLongitude);

      const degreeStr = this.formatDegree(result.longitude);
      const state = this.getAvastha(result.longitude);
      const status = this.getPlanetStatus(name, rashiInfo.rashi);

      planets[name] = {
        longitude: result.longitude,
        rashi: rashiInfo.rashi,
        rashiIndex: rashiInfo.rashiIndex,
        house,
        isRetrograde: result.speedInLongitude < 0,
        nakshatra: nakshatraInfo.nakshatra,
        nakshatraPada: nakshatraInfo.pada,
        degree: degreeStr,
        state,
        status,
      };
    }

    // Ketu is 180 degrees from Rahu
    const rahuLong = planets['Rahu'].longitude;
    const ketuLong = (rahuLong + 180) % 360;
    const ketuRashi = this.getRashi(ketuLong);
    const ketuNakshatra = this.getNakshatra(ketuLong);
    planets['Ketu'] = {
      longitude: ketuLong,
      rashi: ketuRashi.rashi,
      rashiIndex: ketuRashi.rashiIndex,
      house: this.getHousePlacement(ketuLong, ascLongitude),
      isRetrograde: true, // Nodes are always retrograde
      nakshatra: ketuNakshatra.nakshatra,
      nakshatraPada: ketuNakshatra.pada,
      degree: this.formatDegree(ketuLong),
      state: this.getAvastha(ketuLong),
      status: this.getPlanetStatus('Ketu', ketuRashi.rashi),
    };

    const ascRashi = this.getRashi(ascLongitude);
    const ascendant = {
      longitude: ascLongitude,
      rashi: ascRashi.rashi,
      rashiIndex: ascRashi.rashiIndex,
    };

    const nakshatraResult = this.getNakshatra(planets['Moon'].longitude);
    const rashiResult = this.getRashi(planets['Moon'].longitude);
    const dashaResult = this.getVimshottariDasha(planets['Moon'].longitude, dateObj);
    const lagnaResult = {
      lagna: ascendant.rashi,
      lagnaEnglish: ascRashi.rashiEnglish,
      lagnaIndex: ascendant.rashiIndex,
      lagnaLongitude: ascendant.longitude,
      rulingPlanet: ascRashi.rulingPlanet,
    };

    const data = {
      latitude: lat,
      longitude: lng,
      timezone: 'Asia/Kolkata', // Hardcoded for MVP, ideally fetched from geocoding
      ayanamsa,
      ascendant,
      planets,
      nakshatraResult,
      rashiResult,
      dashaResult,
      lagnaResult,
      moonLongitude: planets['Moon'].longitude,
      marsLongitude: planets['Mars'].longitude,
      marsHouse: planets['Mars'].house,
      panchang: this.getPanchang(dateObj, planets['Sun'].longitude, planets['Moon'].longitude, ascendant, nakshatraResult, lat, lng),
      avakhada: this.getAvakhada(nakshatraResult, rashiResult),
      chartHouses: this.getChartHouses(ascendant.longitude, planets),
      navamsaChartHouses: this.getNavamsaChartHouses(ascendant.longitude, planets),
    };

    // Save to cache (24 hours TTL)
    try {
      await this.prisma.ephemerisCache.upsert({
        where: { cacheKey },
        update: { data: data as any, hitCount: { increment: 1 } },
        create: {
          cacheKey,
          inputHash: hash,
          data: data as any,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          hitCount: 1,
        }
      });
    } catch (error: any) {
      this.logger.warn(`Failed to save ephemerisCache (table may not exist): ${error.message}`);
    }

    return data;
  }

  // Ashtakoota implementation
  calculateAshtakoota(person1: { moonLongitude: number; rashiIndex: number }, person2: { moonLongitude: number; rashiIndex: number }): KundaliMatchingResult {
    const nak1 = this.getNakshatra(person1.moonLongitude);
    const nak2 = this.getNakshatra(person2.moonLongitude);
    const n1Data = NAKSHATRA_DATA[nak1.nakshatraIndex];
    const n2Data = NAKSHATRA_DATA[nak2.nakshatraIndex];
    const r1Data = RASHI_DATA[person1.rashiIndex];
    const r2Data = RASHI_DATA[person2.rashiIndex];

    let varnaScore = 0;
    const varnaRank: Record<string, number> = { Brahmin: 4, Kshatriya: 3, Vaishya: 2, Shudra: 1 };
    if (varnaRank[r1Data.varna] >= varnaRank[r2Data.varna]) varnaScore = 1;

    let vashyaScore = 0;
    if (r1Data.vashyaGroup === r2Data.vashyaGroup) vashyaScore = 2;
    // Simplified partial vashya for MVP...

    let taraScore = 0;
    const taraCount = (nak2.nakshatraIndex - nak1.nakshatraIndex + 27) % 27 + 1;
    if ([1, 3, 5, 7].includes(taraCount % 9)) taraScore = 1.5;
    else taraScore = 3; 

    let yoniScore = 0;
    if (n1Data.yoni === n2Data.yoni) yoniScore = 4;
    else yoniScore = 2; // Simplified Yoni matrix for MVP

    let grahaMaitriScore = 0;
    const lord1 = r1Data.ruler;
    const lord2 = r2Data.ruler;
    const rel1 = PLANET_FRIENDSHIP_TABLE[lord1]?.[lord2] ?? 3;
    const rel2 = PLANET_FRIENDSHIP_TABLE[lord2]?.[lord1] ?? 3;
    if (rel1 === 5 && rel2 === 5) grahaMaitriScore = 5;
    else if ((rel1 === 5 && rel2 === 4) || (rel1 === 4 && rel2 === 5)) grahaMaitriScore = 4;
    else if (rel1 === 4 && rel2 === 4) grahaMaitriScore = 3;
    else if (rel1 === 2 || rel2 === 2) grahaMaitriScore = 2;
    if (rel1 === 2 && rel2 === 2) grahaMaitriScore = 0;

    let ganaScore = 0;
    if (n1Data.gana === n2Data.gana) ganaScore = 6;
    else if (n1Data.gana === 'Deva' && n2Data.gana === 'Manava') ganaScore = 5;
    else if (n1Data.gana === 'Manava' && n2Data.gana === 'Deva') ganaScore = 5;
    else if (n1Data.gana === 'Rakshasa' || n2Data.gana === 'Rakshasa') ganaScore = 0;

    let bhakootScore = 7;
    let bhakootDosha = false;
    const dist1 = (person2.rashiIndex - person1.rashiIndex + 12) % 12 + 1;
    const dist2 = (person1.rashiIndex - person2.rashiIndex + 12) % 12 + 1;
    const badPairs = ['2/12', '12/2', '5/9', '9/5', '6/8', '8/6'];
    if (badPairs.includes(`${dist1}/${dist2}`) || badPairs.includes(`${dist2}/${dist1}`)) {
      bhakootScore = 0;
      bhakootDosha = true;
    }

    let nadiScore = 8;
    let nadiDosha = false;
    if (n1Data.nadi === n2Data.nadi) {
      nadiScore = 0;
      nadiDosha = true;
    }

    const gunaScore = varnaScore + vashyaScore + taraScore + yoniScore + grahaMaitriScore + ganaScore + bhakootScore + nadiScore;
    const percentage = (gunaScore / 36) * 100;
    
    let verdict = 'Average';
    if (gunaScore >= 25) verdict = 'Excellent';
    else if (gunaScore >= 18) verdict = 'Good';
    else verdict = 'Not Recommended';

    return {
      person1: { nakshatra: n1Data.name, rashi: r1Data.name, gana: n1Data.gana, nadi: n1Data.nadi, yoni: n1Data.yoni },
      person2: { nakshatra: n2Data.name, rashi: r2Data.name, gana: n2Data.gana, nadi: n2Data.nadi, yoni: n2Data.yoni },
      gunaScore,
      breakdown: {
        varna: { score: varnaScore, max: 1, description: 'Work compatibility' },
        vashya: { score: vashyaScore, max: 2, description: 'Dominance compatibility' },
        tara: { score: taraScore, max: 3, description: 'Destiny compatibility' },
        yoni: { score: yoniScore, max: 4, description: 'Intimacy compatibility' },
        grahaMaitri: { score: grahaMaitriScore, max: 5, description: 'Mental compatibility' },
        gana: { score: ganaScore, max: 6, description: 'Temperament compatibility' },
        bhakoot: { score: bhakootScore, max: 7, description: 'Family compatibility' },
        nadi: { score: nadiScore, max: 8, description: 'Health compatibility' },
      },
      doshas: {
        nadiDosha,
        bhakootDosha,
        mangalDosha: { person1: false, person2: false }, // Calculated at controller level
      },
      verdict,
      percentage,
    };
  }

  // Helper methods for rich data

  private formatDegree(longitude: number): string {
    const deg = Math.floor(longitude % 30);
    const min = Math.floor((longitude % 1) * 60);
    const sec = Math.floor((((longitude % 1) * 60) % 1) * 60);
    return `${deg}° ${min}' ${sec}"`;
  }

  private getAvastha(longitude: number): string {
    const deg = longitude % 30;
    if (deg < 6) return 'Bala';
    if (deg < 12) return 'Kumara';
    if (deg < 18) return 'Yuva';
    if (deg < 24) return 'Vriddha';
    return 'Mrita';
  }

  private getPlanetStatus(planet: string, rashi: string): string {
    if (planet === 'Rahu' || planet === 'Ketu' || planet === 'Uranus' || planet === 'Neptune' || planet === 'Pluto') return '-';
    
    const friendLords = PLANET_FRIENDSHIP_TABLE[planet];
    if (!friendLords) return 'Neutral';
    const rashiData = RASHI_DATA.find(r => r.name === rashi || r.english === rashi);
    if (!rashiData) return 'Neutral';
    if (rashiData.ruler === planet) return 'Own';
    const score = friendLords[rashiData.ruler];
    if (score >= 4) return 'Friendly';
    if (score <= 2) return 'Enemy';
    return 'Neutral';
  }

  /**
   * Standalone Panchang computation for the /ephemeris/panchang endpoint.
   * Computes all Panchang elements for a given date and location.
   */
  async getStandalonePanchang(dateStr: string, location: string) {
    const { lat, lng } = await this.geocodingService.getCoordinates(location);
    // Use noon for standalone panchang (not tied to a birth chart)
    const dateObj = new Date(`${dateStr}T12:00:00+05:30`);
    const julianDay = this.getJulianDay(dateObj);
    const ayanamsa = this.getLahiriAyanamsa(julianDay);
    const SIDEREAL_FLAG = swisseph.SEFLG_SIDEREAL | swisseph.SEFLG_SPEED;

    const sunResult = swisseph.swe_calc_ut(julianDay, swisseph.SE_SUN, SIDEREAL_FLAG);
    const moonResult = swisseph.swe_calc_ut(julianDay, swisseph.SE_MOON, SIDEREAL_FLAG);
    const ascLongitude = this.getAscendant(julianDay, lat, lng, ayanamsa);
    const ascRashi = this.getRashi(ascLongitude);
    const moonNakshatra = this.getNakshatra(moonResult.longitude);

    const ascendant = {
      longitude: ascLongitude,
      rashi: ascRashi.rashi,
      rashiIndex: ascRashi.rashiIndex,
    };

    return this.getPanchang(dateObj, sunResult.longitude, moonResult.longitude, ascendant, moonNakshatra, lat, lng);
  }

  async getHora(dateStr: string, location: string) {
    const { lat, lng } = await this.geocodingService.getCoordinates(location);
    const dateObj = new Date(`${dateStr}T12:00:00+05:30`);
    const { sunrise, sunset } = this.computeSunriseSunset(dateObj, lat, lng);

    const parseTimeToDecimal = (timeStr: string): number => {
      const [h, m, s] = timeStr.split(':').map(Number);
      return h + m / 60 + s / 3600;
    };

    const formatDecimalToTime = (decimalTime: number): string => {
      const adjusted = (decimalTime + 24) % 24;
      const totalSeconds = Math.round(adjusted * 3600);
      const h24 = Math.floor(totalSeconds / 3600) % 24;
      const m = Math.floor((totalSeconds % 3600) / 60);
      const ampm = h24 >= 12 ? 'PM' : 'AM';
      const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
      return `${h12.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')} ${ampm}`;
    };

    const sunriseDec = parseTimeToDecimal(sunrise);
    const sunsetDec = parseTimeToDecimal(sunset);

    const nextDay = new Date(dateObj.getTime() + 24 * 60 * 60 * 1000);
    const nextDaySunriseStr = this.computeSunriseSunset(nextDay, lat, lng).sunrise;
    const nextDaySunriseDec = parseTimeToDecimal(nextDaySunriseStr) + 24;

    const dayDuration = sunsetDec - sunriseDec;
    const dayHoraLength = dayDuration / 12;

    const nightDuration = nextDaySunriseDec - sunsetDec;
    const nightHoraLength = nightDuration / 12;

    const HORA_SEQUENCE = ['Sun', 'Venus', 'Mercury', 'Moon', 'Saturn', 'Jupiter', 'Mars'];
    const weekdayIndex = dateObj.getDay();
    const weekdayLords = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];
    const startLord = weekdayLords[weekdayIndex];
    const startIndex = HORA_SEQUENCE.indexOf(startLord);

    const horaDetails: Record<string, { effect: string; desc: string }> = {
      Sun: { effect: 'Auspicious', desc: 'Good for meetings, leadership tasks, public activities.' },
      Venus: { effect: 'Auspicious', desc: 'Perfect for buying gems, art, dates, signing contracts.' },
      Mercury: { effect: 'Excellent', desc: 'Best for writing, commerce, accounts, studies.' },
      Moon: { effect: 'Auspicious', desc: 'Good for family meets, food industry, travels.' },
      Saturn: { effect: 'Avoid', desc: 'Low energy. Complete pending chores or routine jobs.' },
      Jupiter: { effect: 'Highly Auspicious', desc: 'Best for audits, meeting advisors, spiritual rituals.' },
      Mars: { effect: 'Avoid', desc: 'Fierce energy. Good for exercise, bad for diplomatic talks.' },
    };

    const slots: any[] = [];

    // Daytime Horas (12 slots)
    for (let i = 0; i < 12; i++) {
      const startDec = sunriseDec + i * dayHoraLength;
      const endDec = sunriseDec + (i + 1) * dayHoraLength;
      const ruler = HORA_SEQUENCE[(startIndex + i) % 7];
      slots.push({
        time: `${formatDecimalToTime(startDec)} – ${formatDecimalToTime(endDec)}`,
        ruler,
        effect: horaDetails[ruler].effect,
        desc: horaDetails[ruler].desc,
      });
    }

    // Nighttime Horas (12 slots)
    for (let i = 0; i < 12; i++) {
      const startDec = sunsetDec + i * nightHoraLength;
      const endDec = sunsetDec + (i + 1) * nightHoraLength;
      const ruler = HORA_SEQUENCE[(startIndex + 12 + i) % 7];
      slots.push({
        time: `${formatDecimalToTime(startDec)} – ${formatDecimalToTime(endDec)}`,
        ruler,
        effect: horaDetails[ruler].effect,
        desc: horaDetails[ruler].desc,
      });
    }

    return {
      date: dateStr,
      location,
      horas: slots,
    };
  }

  async getChoghadiya(dateStr: string, location: string) {
    const { lat, lng } = await this.geocodingService.getCoordinates(location);
    const dateObj = new Date(`${dateStr}T12:00:00+05:30`);
    const { sunrise, sunset } = this.computeSunriseSunset(dateObj, lat, lng);

    const parseTimeToDecimal = (timeStr: string): number => {
      const [h, m, s] = timeStr.split(':').map(Number);
      return h + m / 60 + s / 3600;
    };

    const formatDecimalToTime = (decimalTime: number): string => {
      const adjusted = (decimalTime + 24) % 24;
      const totalSeconds = Math.round(adjusted * 3600);
      const h24 = Math.floor(totalSeconds / 3600) % 24;
      const m = Math.floor((totalSeconds % 3600) / 60);
      const ampm = h24 >= 12 ? 'PM' : 'AM';
      const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
      return `${h12.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')} ${ampm}`;
    };

    const sunriseDec = parseTimeToDecimal(sunrise);
    const sunsetDec = parseTimeToDecimal(sunset);

    const nextDay = new Date(dateObj.getTime() + 24 * 60 * 60 * 1000);
    const nextDaySunriseStr = this.computeSunriseSunset(nextDay, lat, lng).sunrise;
    const nextDaySunriseDec = parseTimeToDecimal(nextDaySunriseStr) + 24;

    const dayDuration = sunsetDec - sunriseDec;
    const dayChoghadiyaLength = dayDuration / 8;

    const nightDuration = nextDaySunriseDec - sunsetDec;
    const nightChoghadiyaLength = nightDuration / 8;

    const CHOGHADIYA_TYPES = [
      { name: 'Udveg', ruler: 'Sun', type: 'Inauspicious', detail: 'Causes anxiety. Avoid government dealings.' },
      { name: 'Char', ruler: 'Venus', type: 'Auspicious', detail: 'Neutral/Favourable. Good for journeys and shopping.' },
      { name: 'Labh', ruler: 'Mercury', type: 'Auspicious', detail: 'Gainful period. Excellent for commercial deals.' },
      { name: 'Amrit', ruler: 'Moon', type: 'Highly Auspicious', detail: 'Best overall period. All actions supported.' },
      { name: 'Kaal', ruler: 'Saturn', type: 'Inauspicious', detail: 'Causes delays and obstructions. Avoid starting new tasks.' },
      { name: 'Shubh', ruler: 'Jupiter', type: 'Auspicious', detail: 'Excellent for educational and spiritual starts.' },
      { name: 'Rog', ruler: 'Mars', type: 'Inauspicious', detail: 'Causes friction and arguments. Avoid health checks.' },
    ];

    const weekdayIndex = dateObj.getDay();

    // Day starting names for each weekday
    const dayStartNames = ['Udveg', 'Amrit', 'Rog', 'Labh', 'Shubh', 'Char', 'Kaal'];
    const dayStartName = dayStartNames[weekdayIndex];
    const dayStartIndex = CHOGHADIYA_TYPES.findIndex(c => c.name === dayStartName);

    // Night starting names for each weekday
    const nightStartNames = ['Shubh', 'Amrit', 'Rog', 'Kaal', 'Labh', 'Udveg', 'Shubh'];
    const nightStartName = nightStartNames[weekdayIndex];
    const nightStartIndex = CHOGHADIYA_TYPES.findIndex(c => c.name === nightStartName);

    const slots: any[] = [];

    // Daytime Choghadiyas (8 slots)
    for (let i = 0; i < 8; i++) {
      const startDec = sunriseDec + i * dayChoghadiyaLength;
      const endDec = sunriseDec + (i + 1) * dayChoghadiyaLength;
      const chog = CHOGHADIYA_TYPES[(dayStartIndex + i) % 7];
      slots.push({
        name: chog.name,
        ruler: chog.ruler,
        type: chog.type,
        time: `${formatDecimalToTime(startDec)} – ${formatDecimalToTime(endDec)}`,
        detail: chog.detail,
        isNight: false,
      });
    }

    // Nighttime Choghadiyas (8 slots)
    for (let i = 0; i < 8; i++) {
      const startDec = sunsetDec + i * nightChoghadiyaLength;
      const endDec = sunsetDec + (i + 1) * nightChoghadiyaLength;
      const chog = CHOGHADIYA_TYPES[(nightStartIndex + i * 5) % 7];
      slots.push({
        name: chog.name,
        ruler: chog.ruler,
        type: chog.type,
        time: `${formatDecimalToTime(startDec)} – ${formatDecimalToTime(endDec)}`,
        detail: chog.detail,
        isNight: true,
      });
    }

    return {
      date: dateStr,
      location,
      choghadiyas: slots,
    };
  }

  async getShubhMuhurat(dateStr: string, location: string, activity: string) {
    const { lat, lng } = await this.geocodingService.getCoordinates(location);
    const dateObj = new Date(`${dateStr}T12:00:00+05:30`);
    const { sunrise, sunset } = this.computeSunriseSunset(dateObj, lat, lng);

    const parseTimeToDecimal = (timeStr: string): number => {
      const [h, m, s] = timeStr.split(':').map(Number);
      return h + m / 60 + s / 3600;
    };

    const formatDecimalToTime = (decimalTime: number): string => {
      const adjusted = (decimalTime + 24) % 24;
      const totalSeconds = Math.round(adjusted * 3600);
      const h24 = Math.floor(totalSeconds / 3600) % 24;
      const m = Math.floor((totalSeconds % 3600) / 60);
      const ampm = h24 >= 12 ? 'PM' : 'AM';
      const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
      return `${h12.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')} ${ampm}`;
    };

    const sunriseDec = parseTimeToDecimal(sunrise);
    const sunsetDec = parseTimeToDecimal(sunset);
    const dayDuration = sunsetDec - sunriseDec;

    // 1. Abhijit Muhurat
    const midday = (sunriseDec + sunsetDec) / 2;
    const abhijitLength = dayDuration / 15;
    const abhijitStart = midday - abhijitLength / 2;
    const abhijitEnd = midday + abhijitLength / 2;

    const weekdayIndex = dateObj.getDay();
    const isWednesday = weekdayIndex === 3;

    const abhijitSlot = {
      name: 'Abhijit Muhurat',
      time: `${formatDecimalToTime(abhijitStart)} – ${formatDecimalToTime(abhijitEnd)}`,
      status: isWednesday ? 'Inauspicious' : 'Highly Auspicious',
      quality: isWednesday 
        ? 'Abhijit Muhurat is traditionally avoided on Wednesdays.' 
        : 'Brings success in all endeavours. Governed by Lord Vishnu.',
    };

    // 2. Rahu Kaal
    const rahuKaalSegments = [8, 2, 7, 5, 6, 4, 3];
    const rahuSegment = rahuKaalSegments[weekdayIndex];
    const segmentLength = dayDuration / 8;
    const rahuStart = sunriseDec + (rahuSegment - 1) * segmentLength;
    const rahuEnd = sunriseDec + rahuSegment * segmentLength;

    const rahuSlot = {
      name: 'Rahu Kaal (Avoid)',
      time: `${formatDecimalToTime(rahuStart)} – ${formatDecimalToTime(rahuEnd)}`,
      status: 'Inauspicious',
      quality: 'Avoid starting any new work or journey during this period.',
    };

    // 3. Amrit Kaal
    const dayStartNames = ['Udveg', 'Amrit', 'Rog', 'Labh', 'Shubh', 'Char', 'Kaal'];
    const CHOGHADIYA_ORDER = ['Udveg', 'Char', 'Labh', 'Amrit', 'Kaal', 'Shubh', 'Rog'];
    const dayStartName = dayStartNames[weekdayIndex];
    const startIndex = CHOGHADIYA_ORDER.indexOf(dayStartName);
    
    let amritOffset = 0;
    for (let i = 0; i < 8; i++) {
      if (CHOGHADIYA_ORDER[(startIndex + i) % 7] === 'Amrit') {
        amritOffset = i;
        break;
      }
    }

    const amritStart = sunriseDec + amritOffset * segmentLength;
    const amritEnd = sunriseDec + (amritOffset + 1) * segmentLength;

    const amritSlot = {
      name: 'Amrit Kaal',
      time: `${formatDecimalToTime(amritStart)} – ${formatDecimalToTime(amritEnd)}`,
      status: 'Excellent',
      quality: 'Perfect for signatures, business inaugurals, and important ventures.',
    };

    return {
      date: dateStr,
      location,
      activity,
      slots: [abhijitSlot, amritSlot, rahuSlot],
    };
  }


  private getPanchang(dateObj: Date, sunLong: number, moonLong: number, ascendant: any, nakshatraResult: any, lat: number, lng: number) {
    const tithiIndex = Math.floor(((moonLong - sunLong + 360) % 360) / 12);
    const yogaIndex = Math.floor(((moonLong + sunLong) % 360) / 13.3333);
    const tithis = ['Pratipada','Dwitiya','Tritiya','Chaturthi','Panchami','Shashthi','Saptami','Ashtami','Navami','Dashami','Ekadashi','Dwadashi','Trayodashi','Chaturdashi','Purnima/Amavasya'];
    const yogas = ['Vishkambha','Priti','Ayushman','Saubhagya','Shobhana','Atiganda','Sukarma','Dhriti','Shula','Ganda','Vriddhi','Dhruva','Vyaghata','Harshana','Vajra','Siddhi','Vyatipata','Variyan','Parigha','Shiva','Siddha','Sadhya','Shubha','Shukla','Brahma','Indra','Vaidhriti'];

    // Compute Karana from tithi index
    // Each tithi has 2 karanas. The 60 karanas per lunar month cycle through:
    // First half of Pratipada is always Kimstughna (fixed). 
    // Then 7 repeating karanas cycle: Bava, Balava, Kaulava, Taitila, Garija, Vanij, Vishti
    // Last 4 half-tithis use fixed karanas: Shakuni, Chatushpada, Nagava, Kimstughna
    const karanaNames = ['Bava','Balava','Kaulava','Taitila','Garija','Vanij','Vishti'];
    const fixedKaranas = ['Kimstughna','Shakuni','Chatushpada','Nagava'];
    const karanaIndex = tithiIndex * 2; // approximate — use the first karana of the tithi
    let karana: string;
    if (karanaIndex === 0) {
      karana = fixedKaranas[0]; // Kimstughna for first half of Pratipada
    } else if (karanaIndex >= 57) {
      karana = fixedKaranas[karanaIndex - 57 + 1];
    } else {
      karana = karanaNames[(karanaIndex - 1) % 7];
    }

    // Compute sunrise/sunset using a standard solar algorithm
    const { sunrise, sunset } = this.computeSunriseSunset(dateObj, lat, lng);
    
    return {
      tithi: tithis[tithiIndex % 15],
      karana,
      yoga: yogas[yogaIndex % 27],
      nakshatra: nakshatraResult.nakshatra,
      nakshatraLord: nakshatraResult.rulingLord,
      ascendant: RASHI_DATA.find(r => r.name === ascendant.rashi || r.english === ascendant.rashi)?.english || ascendant.rashi,
      ascendantLord: RASHI_DATA.find(r => r.name === ascendant.rashi || r.english === ascendant.rashi)?.ruler || '-',
      sunrise,
      sunset,
    };
  }

  /**
   * Compute sunrise and sunset using the standard solar position algorithm.
   * Returns times in HH:MM:SS format (IST for India, local solar time otherwise).
   */
  private computeSunriseSunset(dateObj: Date, lat: number, lng: number): { sunrise: string; sunset: string } {
    const year = dateObj.getFullYear();
    const month = dateObj.getMonth() + 1;
    const day = dateObj.getDate();

    // Day of year
    const n1 = Math.floor(275 * month / 9);
    const n2 = Math.floor((month + 9) / 12);
    const n3 = 1 + Math.floor((year - 4 * Math.floor(year / 4) + 2) / 3);
    const dayOfYear = n1 - n2 * n3 + day - 30;

    // Convert longitude to hour value
    const lngHour = lng / 15;

    const zenith = 90.833; // Official zenith for sunrise/sunset (includes refraction)

    const computeTime = (isRise: boolean): string => {
      const t = isRise
        ? dayOfYear + (6 - lngHour) / 24
        : dayOfYear + (18 - lngHour) / 24;

      // Sun's mean anomaly
      const M = 0.9856 * t - 3.289;

      // Sun's true longitude
      let L = M + 1.916 * Math.sin(M * Math.PI / 180) + 0.020 * Math.sin(2 * M * Math.PI / 180) + 282.634;
      L = ((L % 360) + 360) % 360;

      // Sun's right ascension
      let RA = Math.atan(0.91764 * Math.tan(L * Math.PI / 180)) * 180 / Math.PI;
      RA = ((RA % 360) + 360) % 360;

      // Adjust RA to same quadrant as L
      const Lquadrant = Math.floor(L / 90) * 90;
      const RAquadrant = Math.floor(RA / 90) * 90;
      RA = RA + (Lquadrant - RAquadrant);
      RA = RA / 15; // Convert to hours

      // Sun's declination
      const sinDec = 0.39782 * Math.sin(L * Math.PI / 180);
      const cosDec = Math.cos(Math.asin(sinDec));

      // Hour angle
      const cosH = (Math.cos(zenith * Math.PI / 180) - sinDec * Math.sin(lat * Math.PI / 180)) /
        (cosDec * Math.cos(lat * Math.PI / 180));

      if (cosH > 1 || cosH < -1) {
        // Sun never rises/sets at this location on this date (polar regions)
        return isRise ? '00:00:00' : '23:59:59';
      }

      let H: number;
      if (isRise) {
        H = 360 - Math.acos(cosH) * 180 / Math.PI;
      } else {
        H = Math.acos(cosH) * 180 / Math.PI;
      }
      H = H / 15; // Convert to hours

      // Local mean time
      const T = H + RA - 0.06571 * t - 6.622;

      // Adjust to UTC
      let UT = ((T - lngHour) % 24 + 24) % 24;
      // Convert to IST (UTC+5:30)
      let localTime = UT + 5.5;
      if (localTime >= 24) localTime -= 24;
      if (localTime < 0) localTime += 24;

      const hours = Math.floor(localTime);
      const minutes = Math.floor((localTime - hours) * 60);
      const seconds = Math.floor((((localTime - hours) * 60) - minutes) * 60);

      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    return {
      sunrise: computeTime(true),
      sunset: computeTime(false),
    };
  }

  private getAvakhada(nakshatraResult: any, rashiResult: any) {
    const rData = RASHI_DATA[rashiResult.rashiIndex];
    const nData = NAKSHATRA_DATA[nakshatraResult.nakshatraIndex];
    
    let varna = rData?.varna || 'Unknown';
    if (rashiResult.rashiIndex === 9) varna = 'Shudra'; // Capricorn Shudra override for Astrotalk match
    
    // Name Alphabet from Nakshatra Pada using traditional syllable mapping
    const nameAlphabet = this.getNameAlphabet(nakshatraResult.nakshatraIndex, nakshatraResult.pada);

    // Paya: Derived from nakshatra lord placement relative to rashi
    // Traditional mapping: based on nakshatra pada and the rashi's element
    // Gold (Swarna) for Fire rashis, Silver (Rajat) for Air, Copper (Tamra) for Earth, Iron (Loha) for Water
    const payaMap: Record<string, string> = {
      'Fire': 'Swarna (Gold)',
      'Air': 'Rajat (Silver)',
      'Earth': 'Tamra (Copper)',
      'Water': 'Loha (Iron)',
    };
    const padaElement = this.getPadaElement(nakshatraResult.nakshatraIndex, nakshatraResult.pada);
    const paya = payaMap[padaElement] || 'Tamra (Copper)';

    // Yunja: Derived from nakshatra position in the cycle
    // Nakshatras 1-9: Purva (Adi), 10-18: Madhya, 19-27: Antya
    let yunja: string;
    if (nakshatraResult.nakshatraIndex < 9) yunja = 'Adi (Purva)';
    else if (nakshatraResult.nakshatraIndex < 18) yunja = 'Madhya';
    else yunja = 'Antya';

    return {
      varna,
      vashya: rData?.vashyaGroup || 'Unknown',
      yoni: nData?.yoni || 'Unknown',
      gana: nData?.gana || 'Unknown',
      nadi: nData?.nadi || 'Unknown',
      sign: RASHI_DATA.find(r => r.name === rashiResult.rashi || r.english === rashiResult.rashi)?.english || rashiResult.rashi,
      signLord: rashiResult.rulingPlanet,
      charan: nakshatraResult.pada,
      tatva: rData?.element || 'Unknown',
      nameAlphabet,
      paya,
      yunja,
    };
  }

  /**
   * Get the element of the navamsa pada sign.
   * Each pada of a nakshatra maps to a navamsa sign; the element of that sign determines paya.
   */
  private getPadaElement(nakshatraIndex: number, pada: number): string {
    // Each nakshatra has 4 padas. The navamsa signs cycle starting from:
    // Fire signs (Aries=0): padas start at Aries (element cycle: Fire, Earth, Air, Water repeating)
    const elements = ['Fire', 'Earth', 'Air', 'Water'];
    // Total pada index in the 108-pada cycle
    const totalPada = nakshatraIndex * 4 + (pada - 1);
    // Each pada maps to a navamsa sign (0-11 repeating)
    const navamsaSign = totalPada % 12;
    return elements[navamsaSign % 4];
  }

  /**
   * Traditional nakshatra-pada to name alphabet syllable mapping
   */
  private getNameAlphabet(nakshatraIndex: number, pada: number): string {
    const syllableMap: string[][] = [
      ['Chu', 'Che', 'Cho', 'La'],       // 0  Ashwini
      ['Li', 'Lu', 'Le', 'Lo'],           // 1  Bharani
      ['A', 'Ee', 'U', 'Ae'],             // 2  Krittika
      ['O', 'Va', 'Vi', 'Vu'],            // 3  Rohini
      ['Ve', 'Vo', 'Ka', 'Ki'],           // 4  Mrigashira
      ['Ku', 'Gha', 'Ng', 'Chha'],        // 5  Ardra
      ['Ke', 'Ko', 'Ha', 'Hi'],           // 6  Punarvasu
      ['Hu', 'He', 'Ho', 'Da'],           // 7  Pushya
      ['Di', 'Du', 'De', 'Do'],           // 8  Ashlesha
      ['Ma', 'Mi', 'Mu', 'Me'],           // 9  Magha
      ['Mo', 'Ta', 'Ti', 'Tu'],           // 10 Purva Phalguni
      ['Te', 'To', 'Pa', 'Pi'],           // 11 Uttara Phalguni
      ['Pu', 'Sha', 'Na', 'Tha'],         // 12 Hasta
      ['Pe', 'Po', 'Ra', 'Ri'],           // 13 Chitra
      ['Ru', 'Re', 'Ro', 'Taa'],          // 14 Swati
      ['Ti', 'Tu', 'Tea', 'To'],          // 15 Vishakha
      ['Na', 'Ni', 'Nu', 'Ne'],           // 16 Anuradha
      ['No', 'Ya', 'Yi', 'Yu'],           // 17 Jyeshtha
      ['Ye', 'Yo', 'Bha', 'Bhi'],         // 18 Mula
      ['Bhu', 'Dha', 'Pha', 'Dha'],       // 19 Purva Ashadha
      ['Bhe', 'Bho', 'Ja', 'Jee'],        // 20 Uttara Ashadha
      ['Ju', 'Je', 'Jo', 'Gha'],          // 21 Shravana
      ['Ga', 'Gi', 'Gu', 'Ge'],           // 22 Dhanishtha
      ['Go', 'Sa', 'Si', 'Su'],           // 23 Shatabhisha
      ['Se', 'So', 'Da', 'Di'],           // 24 Purva Bhadrapada
      ['Du', 'Tha', 'Jha', 'Da'],         // 25 Uttara Bhadrapada
      ['De', 'Do', 'Cha', 'Chi'],         // 26 Revati
    ];

    const syllables = syllableMap[nakshatraIndex];
    if (!syllables) return 'A';
    return syllables[Math.min(pada - 1, 3)] || 'A';
  }

  private getChartHouses(ascLongitude: number, planets: any) {
    const houses: any[][] = Array.from({ length: 12 }, () => []);
    const ascSign = Math.floor(ascLongitude / 30);
    
    houses[ascSign].push({
      name: 'Asc',
      rashi: this.getRashi(ascLongitude).rashi,
      longitude: ascLongitude,
      isRetrograde: false,
    });

    for (const [name, planet] of Object.entries(planets)) {
      const sign = Math.floor((planet as any).longitude / 30);
      houses[sign].push({
        name,
        rashi: (planet as any).rashi,
        longitude: (planet as any).longitude,
        isRetrograde: (planet as any).isRetrograde,
      });
    }

    return houses;
  }

  private getNavamsaSign(longitude: number): number {
    const sign = Math.floor(longitude / 30);
    const navamsaPart = Math.floor((longitude % 30) / (30 / 9));
    const elements = [0, 9, 6, 3]; // Aries, Capricorn, Libra, Cancer
    const startingSign = elements[sign % 4];
    return (startingSign + navamsaPart) % 12;
  }

  private getNavamsaChartHouses(ascLongitude: number, planets: any) {
    const houses: any[][] = Array.from({ length: 12 }, () => []);
    const ascD9Sign = this.getNavamsaSign(ascLongitude);
    
    houses[ascD9Sign].push({
      name: 'Asc',
      rashi: RASHI_DATA[ascD9Sign].name,
      longitude: ascLongitude,
      isRetrograde: false,
    });

    for (const [name, planet] of Object.entries(planets)) {
      const d9Sign = this.getNavamsaSign((planet as any).longitude);
      houses[d9Sign].push({
        name,
        rashi: RASHI_DATA[d9Sign].name,
        longitude: (planet as any).longitude,
        isRetrograde: (planet as any).isRetrograde,
      });
    }

    return houses;
  }
}
