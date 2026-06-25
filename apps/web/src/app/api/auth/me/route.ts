import { NextRequest, NextResponse } from "next/server";
import { appendFileSync } from "node:fs";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api/v1";

// TEMP DEBUG: append every hit to a file we can inspect from outside the browser.
function debugLog(line: string) {
  try {
    appendFileSync("D:\\TSP\\auth-debug.log", line + "\n");
  } catch {
    // ignore
  }
}

/**
 * GET /api/auth/me
 *
 * Same-origin proxy for the NestJS /auth/me endpoint.
 *
 * Why this exists:
 * The browser cannot reliably send cross-origin credentialed fetch requests
 * from BFCache-restored pages. By routing /auth/me through Next.js (same origin),
 * the cookie is read server-side from the incoming request and forwarded
 * to NestJS via a server-to-server call. This works under all navigation
 * scenarios including BFCache restore, hard refresh, and normal navigation.
 */
export async function GET(request: NextRequest) {
  // Read the access_token cookie from the browser's request to Next.js
  const accessToken = request.cookies.get("access_token")?.value;

  const allCookies = request.cookies.getAll().map((c) => c.name).join(",");
  debugLog(
    `[me] hit | referer=${request.headers.get("referer") ?? "-"} | ` +
      `hasAccessToken=${Boolean(accessToken)} | cookies=[${allCookies}] | ` +
      `rawCookieHeader=${request.headers.get("cookie") ? "present" : "ABSENT"}`
  );

  if (!accessToken) {
    debugLog("[me] -> 401 (no access_token cookie reached the proxy)");
    return NextResponse.json(
      { message: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    // Server-to-server call to NestJS — no BFCache or CORS issues here
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        // Forward the token as a cookie header so NestJS jwt.strategy reads it
        "Cookie": `access_token=${accessToken}`,
      },
      // No credentials needed — this is server-to-server
      cache: "no-store",
    });

    debugLog(`[me] upstream NestJS status=${response.status}`);

    if (!response.ok) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (e) {
    debugLog(`[me] upstream fetch threw: ${String(e)}`);
    return NextResponse.json(
      { message: "Unauthorized" },
      { status: 401 }
    );
  }
}
