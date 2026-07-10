import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../../common/decorators/public.decorator';
import { TIER_PUBLIC_TOOLS } from '../../common/config/rate-limit.config';
import { EphemerisService } from './ephemeris.service';
import {
  PlanetaryPositionsDto,
  NakshatraDto,
  RashiDto,
  LagnaDto,
  DashaDto,
  KundaliMatchingDto,
  MangalDoshaDto,
  AyanamsaDto,
  BirthChartDto,
} from './ephemeris.dto';

@ApiTags('Ephemeris')
@Controller('ephemeris')
@Public()
@Throttle(TIER_PUBLIC_TOOLS)
export class EphemerisController {
  constructor(private readonly ephemerisService: EphemerisService) {}

  @Post('planetary-positions')
  @ApiOperation({ summary: 'Get sidereal planetary positions' })
  async getPlanetaryPositions(@Body() dto: PlanetaryPositionsDto) {
    const data = await this.ephemerisService.getComputedChart(dto.birthDate, dto.birthTime, dto.birthPlace);
    return {
      ayanamsa: data.ayanamsa,
      ascendant: data.ascendant,
      planets: data.planets,
    };
  }

  @Post('nakshatra')
  @ApiOperation({ summary: 'Get Moon Nakshatra details' })
  async getNakshatra(@Body() dto: NakshatraDto) {
    const data = await this.ephemerisService.getComputedChart(dto.birthDate, dto.birthTime, dto.birthPlace);
    return data.nakshatraResult;
  }

  @Post('rashi')
  @ApiOperation({ summary: 'Get Moon Rashi (Sign) details' })
  async getRashi(@Body() dto: RashiDto) {
    const data = await this.ephemerisService.getComputedChart(dto.birthDate, dto.birthTime, dto.birthPlace);
    return data.rashiResult;
  }

  @Post('lagna')
  @ApiOperation({ summary: 'Get Ascendant (Lagna) details' })
  async getLagna(@Body() dto: LagnaDto) {
    const data = await this.ephemerisService.getComputedChart(dto.birthDate, dto.birthTime, dto.birthPlace);
    return data.lagnaResult;
  }

  @Post('dasha')
  @ApiOperation({ summary: 'Get Vimshottari Dasha timeline' })
  async getDasha(@Body() dto: DashaDto) {
    const data = await this.ephemerisService.getComputedChart(dto.birthDate, dto.birthTime, dto.birthPlace);
    return data.dashaResult;
  }

  @Post('kundali-matching')
  @ApiOperation({ summary: 'Calculate Ashtakoota Guna Milan' })
  async getKundaliMatching(@Body() dto: KundaliMatchingDto) {
    const p1 = await this.ephemerisService.getComputedChart(dto.person1.birthDate, dto.person1.birthTime, dto.person1.birthPlace);
    const p2 = await this.ephemerisService.getComputedChart(dto.person2.birthDate, dto.person2.birthTime, dto.person2.birthPlace);

    const result = this.ephemerisService.calculateAshtakoota(
      { moonLongitude: p1.moonLongitude, rashiIndex: p1.rashiResult.rashiIndex },
      { moonLongitude: p2.moonLongitude, rashiIndex: p2.rashiResult.rashiIndex }
    );

    const isManglik = (house: number) => [1, 2, 4, 7, 8, 12].includes(house);
    result.doshas.mangalDosha = {
      person1: isManglik(p1.marsHouse),
      person2: isManglik(p2.marsHouse),
    };

    return result;
  }

  @Post('mangal-dosha')
  @ApiOperation({ summary: 'Check Mangal Dosha (Mars blemish)' })
  async getMangalDosha(@Body() dto: MangalDoshaDto) {
    const data = await this.ephemerisService.getComputedChart(dto.birthDate, dto.birthTime, dto.birthPlace);
    const marsHouse = data.marsHouse;
    const isManglik = [1, 2, 4, 7, 8, 12].includes(marsHouse);
    
    let severity: "High" | "Medium" | "Low" | "None" = "None";
    if (isManglik) {
      if ([7, 8].includes(marsHouse)) severity = "High";
      else severity = "Medium";
    }

    return {
      marsLongitude: data.marsLongitude,
      marsHouse,
      isManglik,
      severity,
      cancellationFactors: [], // Mocked for MVP
      remedies: isManglik ? ["Consult an astrologer for specific remedies"] : [],
    };
  }

  @Post('ayanamsa')
  @ApiOperation({ summary: 'Get Lahiri Ayanamsa' })
  async getAyanamsa(@Body() dto: AyanamsaDto) {
    const dateObj = new Date(`${dto.birthDate}T00:00:00Z`);
    const julianDay = this.ephemerisService.getJulianDay(dateObj);
    const ayanamsa = this.ephemerisService.getLahiriAyanamsa(julianDay);
    
    const degrees = Math.floor(ayanamsa);
    const remainder = (ayanamsa - degrees) * 60;
    const minutes = Math.floor(remainder);
    const seconds = Math.floor((remainder - minutes) * 60);

    return {
      ayanamsaType: "Lahiri (Chitrapaksha)",
      degrees,
      minutes,
      seconds,
      decimal: ayanamsa,
      epoch: julianDay,
    };
  }

  @Post('birth-chart')
  @ApiOperation({ summary: 'Get full birth chart data' })
  async getBirthChart(@Body() dto: BirthChartDto) {
    const data = await this.ephemerisService.getComputedChart(dto.birthDate, dto.birthTime, dto.birthPlace);
    
    return {
      name: dto.name,
      birthDate: dto.birthDate,
      birthTime: dto.birthTime,
      birthPlace: dto.birthPlace,
      latitude: data.latitude,
      longitude: data.longitude,
      timezone: data.timezone, 
      ayanamsa: data.ayanamsa,
      ascendant: data.ascendant,
      planets: data.planets,
      nakshatra: data.nakshatraResult,
      rashi: data.rashiResult,
      lagna: data.lagnaResult,
      dasha: data.dashaResult,
      panchang: data.panchang,
      avakhada: data.avakhada,
      chartHouses: data.chartHouses,
      navamsaChartHouses: data.navamsaChartHouses,
    };
  }
}
