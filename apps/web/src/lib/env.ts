/**
 * Environment variable validation and access.
 * Add runtime env checks here as the app grows.
 *
 * Usage:
 *   import { env } from "@/lib/env";
 *   const apiUrl = env.NEXT_PUBLIC_API_URL;
 */

export const env = {
  NODE_ENV: process.env.NODE_ENV ?? "development",
  // NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL ?? "",
  // NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
} as const;
