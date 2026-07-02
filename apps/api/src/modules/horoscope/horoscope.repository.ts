import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { ZodiacSign, HoroscopePeriod, HoroscopeReading } from '@prisma/client';

interface AssembledReading {
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
export class HoroscopeRepository {
  private readonly logger = new Logger(HoroscopeRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  async upsertReading(
    sign: ZodiacSign,
    period: HoroscopePeriod,
    date: Date,
    assembled: AssembledReading,
    transitSnapshot: unknown,
  ): Promise<HoroscopeReading> {
    // Normalize to date-only (strip time component) based on IST
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istDate = new Date(date.getTime() + istOffset);
    const dateStringIST = istDate.toISOString().split('T')[0];
    const periodStartDate = new Date(dateStringIST);
    const periodEndDate = this.computePeriodEndDate(period, periodStartDate);

    return this.prisma.horoscopeReading.upsert({
      where: {
        sign_period_periodStartDate: { sign, period, periodStartDate },
      },
      update: {
        ...assembled,
        transitSnapshot: transitSnapshot as any,
        generatedAt: new Date(),
      },
      create: {
        sign,
        period,
        periodStartDate,
        periodEndDate,
        ...assembled,
        transitSnapshot: transitSnapshot as any,
      },
    });
  }

  /**
   * Finds the most recent reading for the given sign and period.
   * Fallback: if today's row is missing (cron failure), serves the most recent available
   * periodStartDate row rather than throwing — logs a warning, never 500s the public page.
   */
  async findLatest(
    sign: ZodiacSign,
    period: HoroscopePeriod,
  ): Promise<HoroscopeReading | null> {
    const reading = await this.prisma.horoscopeReading.findFirst({
      where: { sign, period },
      orderBy: { periodStartDate: 'desc' },
    });

    if (reading) {
      const istOffset = 5.5 * 60 * 60 * 1000;
      const todayIST = new Date(Date.now() + istOffset);
      const todayKey = todayIST.toISOString().split('T')[0];
      const readingKey = reading.periodStartDate.toISOString().split('T')[0];
      if (readingKey !== todayKey && period === 'DAILY') {
        this.logger.warn(
          `Serving stale horoscope for ${sign}/${period}: ` +
          `latest is ${readingKey}, expected ${todayKey}. Cron may have failed.`,
        );
      }
    }

    return reading;
  }

  private computePeriodEndDate(period: HoroscopePeriod, startDate: Date): Date {
    const end = new Date(startDate);
    switch (period) {
      case 'DAILY':
        // Same day
        break;
      case 'WEEKLY':
        end.setDate(end.getDate() + 6);
        break;
      case 'MONTHLY':
        end.setMonth(end.getMonth() + 1);
        end.setDate(end.getDate() - 1);
        break;
      case 'YEARLY':
        end.setFullYear(end.getFullYear() + 1);
        end.setDate(end.getDate() - 1);
        break;
    }
    return end;
  }
}
