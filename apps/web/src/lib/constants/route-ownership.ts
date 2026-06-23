/**
 * Route ownership map — prevents duplicate paths across route groups.
 *
 * (marketing)  → Public SEO pages + public tools (Navbar/Footer layout)
 * (auth)       → Login/signup flows
 * (user)       → Authenticated user portal (sidebar layout, auth required)
 * astrologer/  → Astrologer dashboard (future)
 * admin/       → Admin dashboard (future)
 *
 * Rule: a URL path must exist in exactly ONE route group.
 */

/** Public tool pages — live under (marketing), no auth required */
export const PUBLIC_TOOL_ROUTES = [
  "/consultation/chat",
  "/consultation/call",
  "/horoscope",
  "/free-services",
  "/calculators",
  "/shop",
] as const;

/** User portal pages — live under (user), auth required */
export const USER_PORTAL_ROUTES = ["/dashboard", "/consultations", "/kundli", "/wallet", "/profile", "/settings", "/subscriptions", "/orders",] as const;

/**
 * Personalized horoscope for logged-in users (future).
 * Public free hub stays at /horoscope — do NOT recreate (user)/horoscope.
 */
export const USER_HOROSCOPE_ROUTE = "/dashboard/horoscope" as const;

export const AUTH_ROUTES = ["/login", "/signup", "/forgot-password", "/reset-password", "/verify-email",] as const;

export const ADMIN_ROUTES = ["/admin"] as const;

export const ASTROLOGER_ROUTES = ["/astrologer"] as const;
