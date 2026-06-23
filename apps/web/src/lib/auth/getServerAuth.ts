import "server-only";
import { cookies } from "next/headers";
import type { AuthMeResponse } from "@/types/user";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api/v1";

/**
 * Reads the access_token cookie server-side and resolves the current session
 * by calling NestJS /auth/me server-to-server.
 *
 * Called from the root layout on EVERY request. The `cache: "no-store"` on
 * the fetch AND the `export const dynamic = "force-dynamic"` in the layout
 * together prevent Next.js from caching this result across requests.
 */
export async function getServerAuth(): Promise<AuthMeResponse | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;

    if (!token) return null;

    const res = await fetch(`${API_BASE_URL}/auth/me`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        // Forward cookie to NestJS — server-to-server, no CORS
        Cookie: `access_token=${token}`,
      },
      // CRITICAL: never cache this — every request must get fresh auth state
      cache: "no-store",
    });

    if (!res.ok) return null;

    return res.json() as Promise<AuthMeResponse>;
  } catch {
    return null;
  }
}