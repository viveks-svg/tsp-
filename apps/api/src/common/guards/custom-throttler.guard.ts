import { ExecutionContext, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { ThrottlerLimitDetail } from '@nestjs/throttler/dist/throttler.guard.interface';
import { Response } from 'express';

/** Our own server (the website rendering pages) calls the API too; it isn't a visitor. */
const TRUSTED_IPS = new Set(
  (process.env.THROTTLE_TRUSTED_IPS ?? '')
    .split(',')
    .map((ip) => ip.trim())
    .filter(Boolean),
);

/**
 * Custom ThrottlerGuard that:
 * 1. Keys by user ID (from JWT payload) for authenticated requests,
 *    falling back to client IP for anonymous requests.
 * 2. Returns 429 errors shaped { statusCode, timestamp, path, message }.
 * 3. Adds Retry-After and X-RateLimit-* response headers.
 */
@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  /**
   * Determine the tracker key for rate limiting.
   * - Authenticated requests: use user.id from JWT payload
   * - Anonymous requests: use client IP (req.ip is what nginx saw; trust proxy = 1)
   */
  protected async getTracker(req: Record<string, any>): Promise<string> {
    if (req.user?.id) {
      return req.user.id;
    }
    return req.ip || req.connection?.remoteAddress || 'unknown';
  }

  protected async shouldSkip(context: ExecutionContext): Promise<boolean> {
    if (context.getType() !== 'http') return false;
    const req = context.switchToHttp().getRequest();
    return TRUSTED_IPS.size > 0 && TRUSTED_IPS.has(req.ip) && !req.user;
  }

  protected async throwThrottlingException(
    context: ExecutionContext,
    throttlerLimitDetail: ThrottlerLimitDetail,
  ): Promise<void> {
    const httpCtx = context.switchToHttp();
    const res = httpCtx.getResponse<Response>();
    const req = httpCtx.getRequest();
    const retryAfter = throttlerLimitDetail.timeToBlockExpire || throttlerLimitDetail.timeToExpire;

    // Headers so the website can say "please wait X seconds".
    res.header('Retry-After', String(retryAfter));
    res.header('X-RateLimit-Limit', String(throttlerLimitDetail.limit));
    res.header('X-RateLimit-Remaining', '0');
    res.header('X-RateLimit-Reset', String(retryAfter));

    throw new HttpException(
      {
        statusCode: HttpStatus.TOO_MANY_REQUESTS,
        timestamp: new Date().toISOString(),
        path: req.url,
        message: 'Too many requests. Please try again later.',
      },
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }
}
