import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class HoroscopeGenerationScheduler implements OnModuleInit {
  private readonly logger = new Logger(HoroscopeGenerationScheduler.name);

  constructor(
    @InjectQueue('horoscope-generation') private readonly queue: Queue,
  ) {}

  async onModuleInit() {
    // Daily: midnight IST
    await this.queue.upsertJobScheduler(
      'daily-horoscope-cron',
      { pattern: '0 0 * * *', tz: 'Asia/Kolkata' },
      {
        name: 'generate-horoscope',
        data: { period: 'DAILY' },
      },
    );
    this.logger.log('Registered daily horoscope cron: 00:00 IST');

    // Weekly: Monday 00:05 IST
    await this.queue.upsertJobScheduler(
      'weekly-horoscope-cron',
      { pattern: '5 0 * * 1', tz: 'Asia/Kolkata' },
      {
        name: 'generate-horoscope',
        data: { period: 'WEEKLY' },
      },
    );
    this.logger.log('Registered weekly horoscope cron: Monday 00:05 IST');

    // Monthly: 1st of month 00:10 IST
    await this.queue.upsertJobScheduler(
      'monthly-horoscope-cron',
      { pattern: '10 0 1 * *', tz: 'Asia/Kolkata' },
      {
        name: 'generate-horoscope',
        data: { period: 'MONTHLY' },
      },
    );
    this.logger.log('Registered monthly horoscope cron: 1st 00:10 IST');

    // Yearly: January 1st 00:15 IST
    await this.queue.upsertJobScheduler(
      'yearly-horoscope-cron',
      { pattern: '15 0 1 1 *', tz: 'Asia/Kolkata' },
      {
        name: 'generate-horoscope',
        data: { period: 'YEARLY' },
      },
    );
    this.logger.log('Registered yearly horoscope cron: Jan 1 00:15 IST');
  }
}
