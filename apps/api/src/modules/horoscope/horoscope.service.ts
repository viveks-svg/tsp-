import { Injectable, Logger, NotFoundException, ConflictException } from '@nestjs/common';
import { ZodiacSign, HoroscopePeriod } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { RedisService } from '../../integrations/redis/redis.service';
import { HoroscopeRepository } from './horoscope.repository';
import { HoroscopeTransitService } from './horoscope-transit.service';
import { HoroscopeContentService } from './horoscope-content.service';
import { HoroscopeResponseDto } from './dto/horoscope-response.dto';

const SIGN_ORDER: ZodiacSign[] = [
  'ARIES', 'TAURUS', 'GEMINI', 'CANCER', 'LEO', 'VIRGO',
  'LIBRA', 'SCORPIO', 'SAGITTARIUS', 'CAPRICORN', 'AQUARIUS', 'PISCES',
];

/**
 * Returns today's date key in IST (Asia/Kolkata) as YYYY-MM-DD.
 */
function todayKeyIST(): string {
  const now = new Date();
  // IST is UTC+5:30
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istDate = new Date(now.getTime() + istOffset);
  return istDate.toISOString().split('T')[0];
}

@Injectable()
export class HoroscopeService {
  private readonly logger = new Logger(HoroscopeService.name);

  constructor(
    private readonly repository: HoroscopeRepository,
    private readonly transitService: HoroscopeTransitService,
    private readonly contentService: HoroscopeContentService,
    private readonly redisService: RedisService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Public read path — Redis-cached, serves the latest reading for sign + period.
   */
  async getReading(
    sign: ZodiacSign,
    period: HoroscopePeriod,
  ): Promise<HoroscopeResponseDto> {
    const cacheKey = `horoscope:${sign}:${period}:${todayKeyIST()}`;

    // Check Redis cache first
    const cached = await this.redisService.get(cacheKey);
    if (cached) {
      try {
        return JSON.parse(cached) as HoroscopeResponseDto;
      } catch {
        // Corrupt cache entry — fall through to DB
      }
    }

    const reading = await this.repository.findLatest(sign, period);
    if (!reading) {
      throw new NotFoundException(
        `Horoscope reading for ${sign}/${period} is not yet available. Please try again shortly.`,
      );
    }

    const dto = HoroscopeResponseDto.fromEntity(reading);

    // Cache for 24 hours
    await this.redisService.set(cacheKey, JSON.stringify(dto), 60 * 60 * 24);

    return dto;
  }

  /**
   * Personalized read path — auth-guarded, resolves user's natal Moon sign.
   */
  async getPersonalizedReading(
    userId: string,
    period: HoroscopePeriod,
  ): Promise<HoroscopeResponseDto> {
    const preference = await this.prisma.userHoroscopePreference.findUnique({
      where: { userId },
    });

    if (!preference?.natalMoonSign) {
      throw new ConflictException({
        code: 'KUNDALI_REQUIRED',
        message: 'Generate your Kundali first to receive personalized horoscope readings.',
        redirectTo: '/tools/kundali',
      });
    }

    return this.getReading(preference.natalMoonSign, period);
  }

  /**
   * Generates horoscope readings for all 12 signs for a given period.
   * Called by the BullMQ processor and the manual trigger endpoint.
   */
  async generateAllReadings(
    period: HoroscopePeriod,
    date?: Date,
  ): Promise<{ generated: number }> {
    const targetDate = date ?? new Date();
    const transitMap = this.transitService.buildTransitMapForAllSigns(targetDate);

    let generated = 0;
    for (const sign of SIGN_ORDER) {
      const transits = transitMap[sign];
      const assembled = this.contentService.assembleReading(sign, transits, targetDate);
      await this.repository.upsertReading(
        sign,
        period,
        targetDate,
        assembled,
        transits,
      );
      generated++;
    }

    this.logger.log(
      `Generated ${generated} ${period} horoscope readings for ${targetDate.toISOString().split('T')[0]}`,
    );

    return { generated };
  }
}
