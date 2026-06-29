// All amounts in PAISE (multiply ₹ by 100)
//
// Slug format: For multi-plan services, use the plan slug directly (legacy compat).
// For single-plan services, use the service ID.
//
// Adding a new service? Just add a new entry here with the service slug.

export const SERVICE_PRICES: Record<string, number> = {
  // ─── Business Vastu Plans (legacy slugs — backward compatible) ─────────────
  'rising':      2499900,   // ₹24,999
  'celestial':   9000000,   // ₹90,000
  'zenith':      9900000,   // ₹99,000

  // ─── Single-plan Business Services ─────────────────────────────────────────
  'office-vastu':      2499900,   // ₹24,999
  'factory-vastu':     3499900,   // ₹34,999
  'retail-vastu':      2499900,   // ₹24,999
  'hotel-vastu':       4499900,   // ₹44,999
  'commercial-plot':   1999900,   // ₹19,999
  'coworking-vastu':   1999900,   // ₹19,999

  // ─── Leadership & Strategy ─────────────────────────────────────────────────
  'strategic-consulting':  2499900,   // ₹24,999
  'partnership-analysis':  1499900,   // ₹14,999
  'expansion-timing':      1499900,   // ₹14,999
  'brand-analysis':         999900,   // ₹9,999

  // ─── Personal Solutions ────────────────────────────────────────────────────
  'career-guidance':        999900,   // ₹9,999  (standard plan)
  'executive':             2499900,   // ₹24,999 (executive plan for career-guidance)
  'relationship-guidance':  999900,   // ₹9,999
  'health-wellness':        999900,   // ₹9,999
  'family-harmony':         999900,   // ₹9,999
  'mobile-analysis':        499900,   // ₹4,999
  'signature-analysis':     499900,   // ₹4,999

  // ─── Property Solutions ────────────────────────────────────────────────────
  'residential-vastu':     1499900,   // ₹14,999 (basic plan)
  'premium':               3499900,   // ₹34,999 (premium plan for residential-vastu)
  'apartment-vastu':       1299900,   // ₹12,999
  'villa-planning':        4999900,   // ₹49,999
  'new-construction':      5999900,   // ₹59,999

  // ─── Legacy Consultation Packages (backward compat) ────────────────────────
  'rising-consultation':    2499900,
  'celestial-consultation': 9000000,
  'zenith-consultation':    9900000,

  // ─── Legacy Insight Reports ────────────────────────────────────────────────
  'astro-swot':          199900,   // ₹1,999
  'career-blueprint':    299900,   // ₹2,999
  'business-alignment':  699900,   // ₹6,999
  'relationship-analysis': 249900, // ₹2,499
  'annual-forecast':     249900,   // ₹2,499
};
