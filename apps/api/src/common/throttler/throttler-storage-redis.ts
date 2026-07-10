import { Logger } from '@nestjs/common';
import { ThrottlerStorage } from '@nestjs/throttler';
import { ThrottlerStorageRecord } from '@nestjs/throttler/dist/throttler-storage-record.interface';
import { RedisService } from '../../integrations/redis/redis.service';

/**
 * Redis-backed ThrottlerStorage implementation for @nestjs/throttler v6.
 *
 * Uses the existing RedisService (ioredis) client — no new Redis connections.
 * Keys: `throttle:{throttlerName}:{key}` with TTL auto-expiry.
 *
 * Fail-open: if Redis is unavailable, requests are allowed through
 * rather than blocking all traffic.
 *
 * Instantiated directly in ThrottlerModule.forRootAsync() factory
 * (not managed by NestJS DI) because forRootAsync runs in ThrottlerModule's
 * own DI context where AppModule-level providers aren't visible.
 */
export class ThrottlerStorageRedis implements ThrottlerStorage {
  private readonly logger = new Logger(ThrottlerStorageRedis.name);

  constructor(private readonly redisService: RedisService) {
    this.logger.log('ThrottlerStorageRedis initialized — using existing Redis connection');
  }

  /**
   * Increment the hit count for a key within a TTL window.
   *
   * @param key - The throttle key (composed of tracker + suffix by the guard)
   * @param ttl - Time-to-live in milliseconds
   * @param limit - Max allowed hits
   * @param blockDuration - How long to block after limit exceeded (ms)
   * @param throttlerName - Name of the throttler (e.g. 'default', 'short', 'long')
   */
  async increment(
    key: string,
    ttl: number,
    limit: number,
    blockDuration: number,
    throttlerName: string,
  ): Promise<ThrottlerStorageRecord> {
    const redis = this.redisService.getClient();

    // Fail-open: if Redis is not connected, allow the request
    if (redis.status !== 'ready') {
      this.logger.warn('Redis not ready — allowing request through (fail-open)');
      return {
        totalHits: 0,
        timeToExpire: 0,
        isBlocked: false,
        timeToBlockExpire: 0,
      };
    }

    const redisKey = `throttle:${throttlerName}:${key}`;
    const blockKey = `throttle:${throttlerName}:${key}:blocked`;

    try {
      // Check if currently blocked
      const blockedTtl = await redis.pttl(blockKey);
      if (blockedTtl > 0) {
        const totalHits = parseInt(await redis.get(redisKey) || '0', 10);
        return {
          totalHits,
          timeToExpire: Math.ceil(blockedTtl / 1000),
          isBlocked: true,
          timeToBlockExpire: Math.ceil(blockedTtl / 1000),
        };
      }

      // Atomic increment + set expiry
      const totalHits = await redis.incr(redisKey);

      // Set TTL on first hit only
      if (totalHits === 1) {
        await redis.pexpire(redisKey, ttl);
      }

      // Get remaining TTL for the response
      const pttl = await redis.pttl(redisKey);
      const timeToExpire = pttl > 0 ? Math.ceil(pttl / 1000) : Math.ceil(ttl / 1000);

      // If limit exceeded and blockDuration is set, create a block key
      if (totalHits > limit && blockDuration > 0) {
        await redis.set(blockKey, '1', 'PX', blockDuration);
        return {
          totalHits,
          timeToExpire,
          isBlocked: true,
          timeToBlockExpire: Math.ceil(blockDuration / 1000),
        };
      }

      return {
        totalHits,
        timeToExpire,
        isBlocked: false,
        timeToBlockExpire: 0,
      };
    } catch (error) {
      // Fail-open on Redis errors
      this.logger.warn(`Redis throttle error: ${(error as Error).message} — allowing request`);
      return {
        totalHits: 0,
        timeToExpire: 0,
        isBlocked: false,
        timeToBlockExpire: 0,
      };
    }
  }
}
