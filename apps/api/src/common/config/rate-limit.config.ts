/**
 * Centralized rate-limit tier definitions.
 * All throttle limits are defined here — controllers reference these
 * constants instead of inline magic numbers.
 *
 * Two windows are registered globally (app.module.ts): "default" (per minute)
 * and "long" (per hour). A tier sets both; the key is the signed-in user, or
 * the client IP for anonymous requests, per route.
 *
 * TTL values are in milliseconds (Throttler v6 default).
 */

const MINUTE = 60_000;
const HOUR = 3_600_000;

// ─── Tier 1: Auth & Identity (strict, per-IP) ───────────────────────────────
// Login, signup, social sign-in, invites. Brute-force / credential-stuffing
// targets. (Per-account lockout on top of this lives in AuthService.)
export const TIER_AUTH_STRICT = {
  default: { limit: 5, ttl: MINUTE },
  long: { limit: 20, ttl: HOUR },
};

// Slightly relaxed variant for token refresh (more legitimate retries)
export const TIER_AUTH_REFRESH = {
  default: { limit: 10, ttl: MINUTE },
  long: { limit: 120, ttl: HOUR },
};

// ─── Tier 2: Free SEO Tools (generous + abuse-gated) ─────────────────────────
// Panchang, Kundali Matching, birth charts, horoscopes, blog, listings.
// Primary SEO/acquisition surface — must not block organic users.
export const TIER_PUBLIC_TOOLS = {
  default: { limit: 60, ttl: MINUTE },
  long: { limit: 300, ttl: HOUR },
};

// Place search calls a paid geocoding API on every new query.
export const TIER_GEOCODING = {
  default: { limit: 20, ttl: MINUTE },
  long: { limit: 200, ttl: HOUR },
};

// ─── Tier 3: Authenticated Core Actions (moderate, per-user) ─────────────────
// Profile reads, consultation management, chat, call signaling, etc.
// This is also the GLOBAL DEFAULT applied to any undecorated endpoint.
export const TIER_AUTHENTICATED_DEFAULT = {
  default: { limit: 30, ttl: MINUTE },
  long: { limit: 1000, ttl: HOUR },
};

// ─── Tier 4: Payments & Wallet (strict, per-user + per-IP) ──────────────────
// Checkout, wallet top-up, payment verification. Direct financial impact.
export const TIER_FINANCIAL = {
  default: { limit: 10, ttl: MINUTE },
  long: { limit: 60, ttl: HOUR },
};

// Stricter variant for order creation
export const TIER_FINANCIAL_CREATE = {
  default: { limit: 5, ttl: MINUTE },
  long: { limit: 30, ttl: HOUR },
};

// Starting a checkout holds a consultation slot (or creates a gateway order):
// a handful per visitor, so nobody can hold every slot without paying.
export const TIER_CHECKOUT_HOLD = {
  default: { limit: 3, ttl: MINUTE },
  long: { limit: 10, ttl: HOUR },
};

// ─── Tier 5: Admin & Astrologer Internal (strict, per-user) ─────────────────
// Admin dashboards, astrologer availability/status, KYC review.
// Low traffic volume — internal users only.
export const TIER_ADMIN_INTERNAL = {
  default: { limit: 100, ttl: MINUTE },
  long: { limit: 3000, ttl: HOUR },
};

// Spreadsheet exports read a lot of rows.
export const TIER_ADMIN_EXPORT = {
  default: { limit: 5, ttl: MINUTE },
  long: { limit: 60, ttl: HOUR },
};

// ─── Tier 6: Excluded ────────────────────────────────────────────────────────
// Razorpay webhooks, health checks. Use @SkipThrottle() on these routes.
// No constant needed — exclusion is via decorator, not config.
