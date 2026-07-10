/**
 * Centralized rate-limit tier definitions.
 * All throttle limits are defined here — controllers reference these
 * constants instead of inline magic numbers.
 *
 * Each tier is shaped as a @nestjs/throttler ThrottlerOptions record
 * for use with @Throttle() decorator.
 *
 * TTL values are in milliseconds (Throttler v6 default).
 */

// ─── Tier 1: Auth & Identity (strict, per-IP) ───────────────────────────────
// Login, signup, OTP, password reset, token refresh.
// Classic brute-force / credential-stuffing targets.
export const TIER_AUTH_STRICT = {
  default: { limit: 5, ttl: 60_000 },        // 5 req / 60s
};

// Slightly relaxed variant for token refresh (more legitimate retries)
export const TIER_AUTH_REFRESH = {
  default: { limit: 10, ttl: 60_000 },       // 10 req / 60s
};

// ─── Tier 2: Free SEO Tools (generous + abuse-gated) ─────────────────────────
// Panchang, Kundali Matching, birth charts, horoscopes, astrologer listings.
// Primary SEO/acquisition surface — must not block Googlebot or organic users.
// Dual throttle: generous per-minute + hourly abuse gate.
export const TIER_PUBLIC_TOOLS = {
  short: { limit: 60, ttl: 60_000 },          // 60 req / 60s (per-minute)
  long:  { limit: 300, ttl: 3_600_000 },      // 300 req / 1 hour (abuse gate)
};

// ─── Tier 3: Authenticated Core Actions (moderate, per-user) ─────────────────
// Profile reads, consultation management, chat, call signaling, etc.
// This is also the GLOBAL DEFAULT applied to any undecorated endpoint.
export const TIER_AUTHENTICATED_DEFAULT = {
  default: { limit: 30, ttl: 60_000 },       // 30 req / 60s
};

// ─── Tier 4: Payments & Wallet (strict, per-user + per-IP) ──────────────────
// Checkout, wallet top-up, payment verification. Direct financial impact.
export const TIER_FINANCIAL = {
  default: { limit: 10, ttl: 60_000 },       // 10 req / 60s
};

// Stricter variant for order creation
export const TIER_FINANCIAL_CREATE = {
  default: { limit: 5, ttl: 60_000 },        // 5 req / 60s
};

// ─── Tier 5: Admin & Astrologer Internal (strict, per-user) ─────────────────
// Admin dashboards, astrologer availability/status, KYC review.
// Low traffic volume — internal users only.
export const TIER_ADMIN_INTERNAL = {
  default: { limit: 10, ttl: 60_000 },       // 10 req / 60s
};

// ─── Tier 6: Excluded ────────────────────────────────────────────────────────
// Razorpay webhooks, health checks. Use @SkipThrottle() on these routes.
// No constant needed — exclusion is via decorator, not config.
