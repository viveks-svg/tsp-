/**
 * Centralized route constants for the application.
 * Use these instead of hardcoded strings to prevent typos
 * and enable easy refactoring.
 *
 * Route groups (see route-ownership.ts):
 * - PUBLIC tools (horoscope, chat, free-services, calculators) → (marketing)
 * - USER portal (dashboard, consultations, kundli, etc.) → (user)
 * - Never duplicate the same path in both groups.
 */
export const ROUTES = {
  // Marketing
  HOME: "/",
  ABOUT: "/about",
  PRICING: "/pricing",
  CONTACT: "/contact",
  BUSINESS_VASTU: "/business-vastu",
  FAQ: "/faq",
  BLOG: "/blog",
  PRIVACY_POLICY: "/privacy-policy",
  TERMS: "/terms",

  // Public tools — (marketing) only
  CHAT: "/consultation/chat",
  CALL: "/consultation/call",
  HOROSCOPE: "/horoscope",
  FREE_SERVICES: "/free-services",
  CALCULATORS: "/calculators",
  SHOP: "/shop",
  // BUSINESS_VASTUE: "/business-vastu",

  // Free services sub-pages
  FREE_KUNDALI: "/free-services/kundali",
  FREE_KUNDALI_MATCHING: "/free-services/kundali-matching",
  FREE_TAROT: "/free-services/tarot",
  FREE_NUMEROLOGY: "/free-services/numerology",
  FREE_PANCHANG: "/free-services/panchang",
  FREE_MANGAL_DOSHA: "/free-services/mangal-dosha",

  // Calculator sub-pages
  CALC_LOVE: "/calculators/love",
  CALC_NAME_COMPATIBILITY: "/calculators/name-compatibility",
  CALC_DASHA: "/calculators/dasha",
  CALC_MULAANK: "/calculators/mulaank",
  CALC_RASHI: "/calculators/rashi",
  CALC_LAGNA: "/calculators/lagna",
  CALC_LUCKY_NUMBER: "/calculators/lucky-number",
  CALC_LUCKY_COLOR: "/calculators/lucky-color",
  CALC_BABY_NAME: "/calculators/baby-name",
  CALC_SHUBH_MUHURAT: "/calculators/shubh-muhurat",
  CALC_SATURN_RETURN: "/calculators/saturn-return",
  CALC_NAKSHATRA: "/calculators/nakshatra",
  CALC_AYANAMSA: "/calculators/ayanamsa",
  CALC_HORA: "/calculators/hora",
  CALC_CHOGHADIYA: "/calculators/choghadiya",

  // Auth
  LOGIN: "/login",
  SIGNUP: "/signup",
  FORGOT_PASSWORD: "/forgot-password",
  RESET_PASSWORD: "/reset-password",
  VERIFY_EMAIL: "/verify-email",

  // User portal — (user) only
  DASHBOARD: "/dashboard",
  /** Logged-in personalized horoscope (future). Public hub is HOROSCOPE. */
  DASHBOARD_HOROSCOPE: "/dashboard/horoscope",
  CONSULTATIONS: "/consultations",
  KUNDLI: "/kundli",
  WALLET: "/wallet",
  PROFILE: "/profile",
  SUBSCRIPTIONS: "/subscriptions",
  ORDERS: "/orders",
  SETTINGS: "/settings",
} as const;

export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES];
