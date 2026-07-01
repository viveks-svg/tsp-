import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { HoroscopeService } from './horoscope.service';
import { HoroscopePeriod } from '@prisma/client';

@Processor('horoscope-generation')
export class HoroscopeGenerationProcessor extends WorkerHost {
  private readonly logger = new Logger(HoroscopeGenerationProcessor.name);

  constructor(private readonly horoscopeService: HoroscopeService) {
    super();
  }

  async process(job: Job): Promise<void> {
    const period: HoroscopePeriod = job.data?.period ?? 'DAILY';
    this.logger.log(`Starting ${period} horoscope generation job: ${job.id}`);

    const result = await this.horoscopeService.generateAllReadings(period);

    this.logger.log(
      `Horoscope generation complete: ${result.generated} ${period} readings created`,
    );
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, err: Error) {
    this.logger.error(
      `Horoscope generation job ${job.id} failed: ${err.message}`,
      err.stack,
    );
  }
}
