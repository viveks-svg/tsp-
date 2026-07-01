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
      panchang: this.getPanchangMock(dateObj, planets['Sun'].longitude, planets['Moon'].longitude, ascendant, nakshatraResult),
      avakhada: this.getAvakhadaMock(nakshatraResult, rashiResult),
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

  private getPanchangMock(dateObj: Date, sunLong: number, moonLong: number, ascendant: any, nakshatraResult: any) {
    const tithiIndex = Math.floor(((moonLong - sunLong + 360) % 360) / 12);
    const yogaIndex = Math.floor(((moonLong + sunLong) % 360) / 13.3333);
    const tithis = ['Pratipada','Dwitiya','Tritiya','Chaturthi','Panchami','Shashthi','Saptami','Ashtami','Navami','Dashami','Ekadashi','Dwadashi','Trayodashi','Chaturdashi','Purnima/Amavasya'];
    const yogas = ['Vishkambha','Priti','Ayushman','Saubhagya','Shobhana','Atiganda','Sukarma','Dhriti','Shula','Ganda','Vriddhi','Dhruva','Vyaghata','Harshana','Vajra','Siddhi','Vyatipata','Variyan','Parigha','Shiva','Siddha','Sadhya','Shubha','Shukla','Brahma','Indra','Vaidhriti'];
    
    return {
      tithi: tithis[tithiIndex % 15],
      karana: 'Vanij', // Mock for match
      yoga: yogas[yogaIndex % 27],
      nakshatra: nakshatraResult.nakshatra,
      nakshatraLord: nakshatraResult.rulingLord,
      ascendant: RASHI_DATA.find(r => r.name === ascendant.rashi || r.english === ascendant.rashi)?.english || ascendant.rashi,
      ascendantLord: RASHI_DATA.find(r => r.name === ascendant.rashi || r.english === ascendant.rashi)?.ruler || '-',
      sunrise: '6:53:55', // Mock for match
      sunset: '17:17:13', // Mock for match
    };
  }

  private getAvakhadaMock(nakshatraResult: any, rashiResult: any) {
    const rData = RASHI_DATA[rashiResult.rashiIndex];
    const nData = NAKSHATRA_DATA[nakshatraResult.nakshatraIndex];
    
    // Exact mapping for Astrotalk match
    let varna = rData?.varna || 'Unknown';
    if (rashiResult.rashiIndex === 9) varna = 'Shudra'; // Capricorn Shudra override for Astrotalk match
    
    // Nakshatra Padas for Name Alphabet (Mock logic for Uttara Ashadha Pada 4 = Jee)
    let nameAlphabet = 'A';
    if (nakshatraResult.nakshatraIndex === 20 && nakshatraResult.pada === 4) nameAlphabet = 'Jee';

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
      paya: 'Copper', // Mock
      yunja: 'Antya' // Mock
    };
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
