import { Global, Module } from '@nestjs/common';
import { RedisService } from './redis.service';

/**
 * Global Redis module that provides and exports RedisService.
 * Imported once in AppModule — all other modules can inject RedisService
 * without declaring it as a local provider.
 */
@Global()
@Module({
  providers: [RedisService],
  exports: [RedisService],
})
export class RedisModule {}
