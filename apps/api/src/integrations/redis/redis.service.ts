import { Injectable, OnModuleDestroy, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private redis!: Redis;
  private readonly logger = new Logger(RedisService.name);

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    const url = this.configService.get<string>('redis.url');
    const host = this.configService.get<string>('redis.host') || 'localhost';
    const port = this.configService.get<number>('redis.port') || 6379;
    const password = this.configService.get<string>('redis.password');
    
    const options = {
      retryStrategy: (times: number) => {
        if (times > 5) {
          this.logger.warn('Redis connection failed after 5 retries. Caching will be disabled.');
          return null; // Stop retrying
        }
        return Math.min(times * 100, 2000);
      },
      maxRetriesPerRequest: 1, // Don't hang requests indefinitely
    };

    if (url) {
      this.redis = new Redis(url, options);
    } else {
      this.redis = new Redis({
        host,
        port,
        password,
        ...options,
      });
    }

    this.redis.on('error', (err) => {
      // Suppress unhandled error event spam in the console
      this.logger.debug(`Redis connection error: ${err.message}`);
    });
  }

  onModuleDestroy() {
    if (this.redis) {
      this.redis.disconnect();
    }
  }

  async get(key: string): Promise<string | null> {
    try {
      if (this.redis.status !== 'ready') return null;
      return await this.redis.get(key);
    } catch (e) {
      return null;
    }
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<'OK' | null> {
    try {
      if (this.redis.status !== 'ready') return null;
      if (ttlSeconds) {
        return await this.redis.set(key, value, 'EX', ttlSeconds);
      }
      return await this.redis.set(key, value);
    } catch (e) {
      return null;
    }
  }

  async del(key: string): Promise<number> {
    try {
      if (this.redis.status !== 'ready') return 0;
      return await this.redis.del(key);
    } catch (e) {
      return 0;
    }
  }

  getClient(): Redis {
    return this.redis;
  }
}
