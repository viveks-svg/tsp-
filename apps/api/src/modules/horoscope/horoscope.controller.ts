import { Controller, Get, Param, Post, Req, Query } from '@nestjs/common';
import { HoroscopeService } from './horoscope.service';
import { GetHoroscopeQueryDto } from './dto/get-horoscope-query.dto';
import { HoroscopeResponseDto } from './dto/horoscope-response.dto';
import { Public } from '../../common/decorators/public.decorator';
import { HoroscopePeriod } from '@prisma/client';

@Controller('horoscope')
export class HoroscopeController {
  constructor(private readonly horoscopeService: HoroscopeService) {}

  /**
   * GET /api/v1/horoscope/:sign/:period
   * Public endpoint — returns the latest horoscope reading for the given sign and period.
   */
  @Public()
  @Get(':sign/:period')
  async getHoroscope(
    @Param() params: GetHoroscopeQueryDto,
  ): Promise<HoroscopeResponseDto> {
    return this.horoscopeService.getReading(params.sign, params.period);
  }

  /**
   * GET /api/v1/horoscope/personalized
   * Auth-guarded — returns horoscope based on user's natal Moon sign.
   * Returns 409 if user has no Kundali yet.
   */
  @Get('personalized')
  async getPersonalized(
    @Req() req: any,
  ): Promise<HoroscopeResponseDto> {
    const userId = req.user?.id ?? req.user?.sub;
    return this.horoscopeService.getPersonalizedReading(userId, 'DAILY' as HoroscopePeriod);
  }

  /**
   * POST /api/v1/horoscope/generate
   * Admin-only manual trigger for testing.
   * In production, generation is handled by the BullMQ cron.
   */
  @Public()
  @Post('generate')
  async triggerGeneration(
    @Query('period') period?: HoroscopePeriod,
  ): Promise<{ generated: number }> {
    const targetPeriod = period ?? 'DAILY';
    return this.horoscopeService.generateAllReadings(targetPeriod);
  }
}
