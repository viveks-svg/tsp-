import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { AUTH_ROUTES, USER_PORTAL_ROUTES, } from "@/lib/constants/route-ownership";

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
  if (!isAuthenticated && isUserPortalRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  // Auth routes (login/signup) — redirect to home if already authenticated
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname === route);
  if (isAuthenticated && isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
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
