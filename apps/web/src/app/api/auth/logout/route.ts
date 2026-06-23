import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api/v1";

/**
 * POST /api/auth/logout
 *
 * Same-origin proxy for the NestJS /auth/logout endpoint.
 * Forwards the logout to NestJS and relays the Set-Cookie header
 * that clears the access_token cookie.
 */
export async function POST(request: NextRequest) {
  const accessToken = request.cookies.get("access_token")?.value;

  if (!accessToken) {
    // Already logged out — return success
    return NextResponse.json({ success: true });
  }

  try {
    const response = await fetch(`${API_BASE_URL}/auth/logout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Cookie": `access_token=${accessToken}`,
      },
      cache: "no-store",
    });

    // Relay the Set-Cookie header from NestJS so the browser clears the cookie
    const setCookieHeader = response.headers.get("set-cookie");
    const nextResponse = NextResponse.json({ success: true });

    if (setCookieHeader) {
      nextResponse.headers.set("set-cookie", setCookieHeader);
    } else {
      // Fallback: clear the cookie directly from Next.js
      nextResponse.cookies.delete("access_token");
    }

    return nextResponse;
  } catch {
    // Clear cookie even if NestJS is down
    const nextResponse = NextResponse.json({ success: true });
    nextResponse.cookies.delete("access_token");
    return nextResponse;
  }
}
