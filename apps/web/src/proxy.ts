import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ADMIN_ROUTES, ASTROLOGER_ROUTES, AUTH_ROUTES, USER_PORTAL_ROUTES, homeForRole } from "@/lib/constants/route-ownership";

/**
 * Reads the role claim from the access token WITHOUT verifying it — only used to
 * pick a redirect target. The API verifies the token on every request.
 */
function roleFromToken(token: string): string | undefined {
  try {
    const payload = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(payload)).role;
  } catch {
    return undefined;
  }
}

/**
 * Next.js Request Interceptor (Proxy) — Route Protection
 *
 * Runs before every matched request. Handles:
 * - Redirecting unauthenticated users away from protected (user) routes
 * - Redirecting authenticated users away from auth pages (login/signup)
 *
 * The access_token cookie is set by the API on login/signup.
 * We only check for cookie presence here (not validity) since
 * the API will return 401 if the token is expired/invalid.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("access_token")?.value;
  const isAuthenticated = Boolean(token);

  // Protected user portal routes — redirect to home if not authenticated
  const isUserPortalRoute = USER_PORTAL_ROUTES.some((route) =>
    pathname.startsWith(route)
  );
  const isPanelRoute = [...ADMIN_ROUTES, ...ASTROLOGER_ROUTES].some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
  if (!isAuthenticated && isPanelRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (!isAuthenticated && isUserPortalRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  // Auth routes (login/signup) — send signed-in users to their role's home
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname === route);
  if (isAuthenticated && isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = homeForRole(roleFromToken(token!));
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api routes
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, sitemap.xml, robots.txt
     * - public assets (images, fonts, etc.)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|logo|images|fonts).*)",
  ],
};
