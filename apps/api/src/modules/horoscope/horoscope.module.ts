import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ToolsModule } from '../tools/tools.module';
import { RedisService } from '../../integrations/redis/redis.service';
import { HoroscopeController } from './horoscope.controller';
import { HoroscopeService } from './horoscope.service';
import { HoroscopeTransitService } from './horoscope-transit.service';
import { HoroscopeContentService } from './horoscope-content.service';
import { HoroscopeRepository } from './horoscope.repository';
import { HoroscopeGenerationProcessor } from './horoscope-generation.processor';
import { HoroscopeGenerationScheduler } from './horoscope-generation.scheduler';

@Module({
  imports: [
    ToolsModule,
    BullModule.registerQueue({ name: 'horoscope-generation' }),
  ],
  controllers: [HoroscopeController],
  providers: [
    HoroscopeService,
    HoroscopeTransitService,
    HoroscopeContentService,
    HoroscopeRepository,
    HoroscopeGenerationProcessor,
    HoroscopeGenerationScheduler,
    RedisService,
  ],
  exports: [HoroscopeService],
})
export class HoroscopeModule {}
