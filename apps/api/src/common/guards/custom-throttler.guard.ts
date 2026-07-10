import { ExecutionContext, Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { ThrottlerLimitDetail } from '@nestjs/throttler/dist/throttler.guard.interface';
import { ThrottlerException } from '@nestjs/throttler';
import { Request, Response } from 'express';

/**
 * Custom ThrottlerGuard that:
 * 1. Keys by user ID (from JWT payload) for authenticated requests,
 *    falling back to client IP for anonymous requests.
 * 2. Returns 429 errors matching our global HttpExceptionFilter shape:
 *    { statusCode, timestamp, path, message }
 * 3. Adds Retry-After and X-RateLimit-* response headers.
 */
@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  /**
   * Determine the tracker key for rate limiting.
   * - Authenticated requests: use user.id from JWT payload
   * - Anonymous requests: use client IP (respects X-Forwarded-For via trust proxy)
   */
  protected async getTracker(req: Record<string, any>): Promise<string> {
    // If user is authenticated (JWT guard already ran and set req.user),
    // key by user ID for accurate per-user rate limiting
    if (req.user?.id) {
      return req.user.id;
    }

    // Fall back to IP for anonymous/public endpoints
    // With trust proxy enabled, req.ip returns the real client IP from X-Forwarded-For
    return req.ip || req.connection?.remoteAddress || 'unknown';
  }

  /**
   * Throw a 429 error that matches our global exception filter response shape:
   * { statusCode, timestamp, path, message }
   *
   * Also sets Retry-After header for the frontend to display proper wait UX.
   */
  protected async throwThrottlingException(
    context: ExecutionContext,
    throttlerLimitDetail: ThrottlerLimitDetail,
  ): Promise<void> {
    const httpCtx = context.switchToHttp();
    const res = httpCtx.getResponse<Response>();
    const req = httpCtx.getRequest<Request>();

    const retryAfter = throttlerLimitDetail.timeToExpire;

    // Set rate-limit headers so frontend can render "please wait X seconds"
    res.header('Retry-After', String(retryAfter));
    res.header('X-RateLimit-Limit', String(throttlerLimitDetail.limit));
    res.header('X-RateLimit-Remaining', '0');
    res.header('X-RateLimit-Reset', String(retryAfter));

    // Send a response matching our HttpExceptionFilter shape
    res.status(429).json({
      statusCode: 429,
      timestamp: new Date().toISOString(),
      path: req.url,
      message: 'Too many requests. Please try again later.',
    });
  }
}
