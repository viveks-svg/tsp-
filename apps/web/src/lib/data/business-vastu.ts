/* ── Types ────────────────────────────────────────────── */

export interface BVHeroStat {
  value: string;
  label: string;
}

export interface BVPrinciple {
  icon: string;
  title: string;
  description: string;
}

export interface BVService {
  title: string;
  description: string;
  iconName: string;
  href: string;
}

export interface BVProcessStep {
  step: string;
  title: string;
  description: string;
}

export interface BVTestimonial {
  quote: string;
  name: string;
  role: string;
  initials: string;
}

export interface BVPricingPlan {
  slug: string;
  name: string;
  tagline: string;
  price: string;
  priceNum: number;
  features: string[];
  ctaText: string;
  variant: "light" | "featured" | "dark";
}

export interface BVFaqItem {
  question: string;
  answer: string;
}

/* ── Hero ─────────────────────────────────────────────── */

export const HERO_STATS: BVHeroStat[] = [
  { value: "500+", label: "Business Audits" },
  { value: "20+", label: "Years in Vastu Practice" },
  { value: "98%", label: "Client Satisfaction" },
];

/* ── Marquee ──────────────────────────────────────────── */

export const MARQUEE_ITEMS: string[] = [
  "OFFICE VASTU",
  "FACTORY AUDIT",
  "RETAIL HARMONY",
  "COMMERCIAL PLOTS",
  "DIRECTION ALIGNMENT",
  "ENERGY MAPPING",
  "GEOPATHIC STRESS REMOVAL",
];

/* ── Philosophy Principles ────────────────────────────── */

export const PHILOSOPHY_PRINCIPLES: BVPrinciple[] = [
  {
    icon: "Compass",
    title: "Direction Science",
    description: "Each of 8 directions governs a business function",
  },
  {
    icon: "Waves",
    title: "Five Element Theory",
    description: "Balancing earth, water, fire, air & space in layout",
  },
  {
    icon: "Zap",
    title: "Energy Mapping",
    description: "Geopathic stress detection and neutralisation",
  },
  {
    icon: "Ruler",
    title: "Grid Alignment",
    description: "Furniture, entrances & cabins on Vastu grid axes",
  },
];

/* ── Services ─────────────────────────────────────────── */

export const SERVICES: BVService[] = [
  {
    title: "Office Vastu Audit",
    description:
      "Complete spatial analysis of your office — from entrance to MD cabin. Direction alignment, desk placement, and energy zone optimisation.",
    iconName: "Building2",
    href: "/business-vastu/office",
  },
  {
    title: "Factory & Warehouse",
    description:
      "Industrial Vastu for production facilities. Machinery placement, worker safety zones, and output maximisation through spatial flow.",
    iconName: "Factory",
    href: "/business-vastu/factory",
  },
  {
    title: "Commercial Plot Selection",
    description:
      "Pre-purchase Vastu analysis of land shape, direction, road placement, and underground water to ensure you build on prosperous ground.",
    iconName: "Map",
    href: "/business-vastu/commercial-plots",
  },
  {
    title: "Retail & Showroom",
    description:
      "Cash counter placement, product display zones, entrance Vastu, and customer flow engineering to maximise retail conversion.",
    iconName: "ShoppingBag",
    href: "/business-vastu/retail",
  },
  {
    title: "Hotel & Hospitality",
    description:
      "Room numbering, reception direction, kitchen placement, and restaurant seating Vastu for occupancy and guest satisfaction.",
    iconName: "Hotel",
    href: "/business-vastu/hotel",
  },
  {
    title: "Co-working & Startups",
    description:
      "Flexible workspace Vastu for modern offices — hot desks, collaboration zones, and founder cabin alignment.",
    iconName: "Laptop",
    href: "/business-vastu/coworking",
  },
];

/* ── Process Steps ────────────────────────────────────── */

export const PROCESS_STEPS: BVProcessStep[] = [
  {
    step: "01",
    title: "Space Consultation",
    description:
      "30-min video call to understand your business, goals, challenges, and spatial layout.",
  },
  {
    step: "02",
    title: "Floor Plan Analysis",
    description:
      "You share floor plans. We run a full Vastu grid analysis with direction mapping and zone scoring.",
  },
  {
    step: "03",
    title: "Expert Audit & Report",
    description:
      "On-site or remote deep audit with a written Vastu Report — zone-wise recommendations with priority rankings.",
  },
  {
    step: "04",
    title: "Implementation Support",
    description:
      "We guide your architect/interior team through changes. Follow-up audit after 90 days included.",
  },
];

/* ── Testimonials ─────────────────────────────────────── */

export const TESTIMONIALS: BVTestimonial[] = [
  {
    quote:
      "After the Vastu audit of our manufacturing plant, we saw a 34% reduction in worker disputes and our quarterly output hit an all-time high within 6 months.",
    name: "Rajiv Mehta",
    role: "MD, Mehta Steel Industries",
    initials: "RM",
  },
  {
    quote:
      "Dr. Sharma identified our main conference room was in the Vayu (air) zone — causing indecisiveness in meetings. One structural change later, we closed 3 enterprise deals in a week.",
    name: "Priya Kapoor",
    role: "CEO, TechNova Solutions",
    initials: "PK",
  },
  {
    quote:
      "We were about to sign a ₹8Cr commercial property. The Vastu analysis flagged a south-east facing entrance as a fire hazard for finances. We renegotiated, shifted the entrance — and saved the deal.",
    name: "Arjun Singhania",
    role: "Founder, Svarit Realty",
    initials: "AS",
  },
];

/* ── Pricing Plans ────────────────────────────────────── */

export const PRICING_PLANS: BVPricingPlan[] = [
  {
    slug: "rising",
    name: "RISING",
    tagline: "Foundational Vastu clarity for growing businesses",
    price: "₹24,999",
    priceNum: 24999,
    features: [
      "Personal Kundali Analysis (business birth chart)",
      "Career & Wealth Guidance",
      "Favourable Timing Insights",
      "1:1 Consultation (60 Min)",
      "Written Vastu Summary Report",
      "Email support for 30 days",
    ],
    ctaText: "Explore Rising Plan →",
    variant: "light",
  },
  {
    slug: "celestial",
    name: "CELESTIAL",
    tagline: "Advanced insights for business growth & expansion",
    price: "₹90,000",
    priceNum: 90000,
    features: [
      "Business & Partnership Analysis",
      "Detailed Horoscope Reading",
      "Wealth & Opportunity Cycles",
      "Priority Consultations (90 Min × 2)",
      "Full Vastu Floor Plan Audit",
      "Direction & Zone Mapping Report",
      "Implementation Checklist",
      "60-day WhatsApp support",
    ],
    ctaText: "Get Celestial Audit →",
    variant: "featured",
  },
  {
    slug: "zenith",
    name: "ZENITH",
    tagline: "The astro-vastu system for market leaders",
    price: "₹99,000",
    priceNum: 99000,
    features: [
      "Complete Cosmic Blueprint",
      "Leadership & Legacy Mapping",
      "Geopathic Stress Detection",
      "Exclusive Annual Forecast Report",
      "On-site Audit (1 day, Delhi NCR)",
      "Architect Briefing Session included",
      "Direct line to Dr. Pradeep Sharma",
      "90-day implementation oversight",
    ],
    ctaText: "Unlock Zenith →",
    variant: "dark",
  },
];

/* ── FAQs ─────────────────────────────────────────────── */

export const FAQS: BVFaqItem[] = [
  {
    question: "Can Vastu work for a rented office space?",
    answer:
      "Absolutely. 80% of Vastu corrections are furniture-based, requiring no structural changes. We provide renter-friendly recommendations that don't require landlord approval.",
  },
  {
    question: "Do I need to share floor plans before booking?",
    answer:
      "Floor plans are needed for the audit phase — not at booking. After you book, we send a simple floor plan template you can fill in even via a photo of a rough sketch.",
  },
  {
    question: "How long does the audit process take?",
    answer:
      "From booking to report delivery: 7–10 working days for remote audits. On-site audits (Zenith plan) are scheduled within 15 days of booking.",
  },
  {
    question: "Is Business Vastu different from Home Vastu?",
    answer:
      "Significantly. Business Vastu focuses on commercial energy — cash flow zones, MD cabin direction, conference room alignment, staff seating, entrance vastu, and profitability mapping. The methodology is the same but the application is entirely different.",
  },
  {
    question: "What if I don't see results?",
    answer:
      "We offer a 90-day review session at no additional cost. If you've implemented our recommendations and feel the alignment isn't working, we revisit the audit and refine the plan.",
  },
];

/* ── Plan Detail Types ────────────────────────────────── */

export interface PlanDetailFeature {
  title: string;
  icon: string;
  description: string;
  impact: string;
}

export interface PlanDetailProcessStep {
  day: string;
  title: string;
  description: string;
}

export interface PlanDetail {
  slug: string;
  heroHeadline: string;
  heroTagline: string;
  features: PlanDetailFeature[];
  processSteps: PlanDetailProcessStep[];
}

/* ── Plan Detail Data ─────────────────────────────────── */

export const PLAN_DETAIL_DATA: Record<string, PlanDetail> = {
  rising: {
    slug: "rising",
    heroHeadline: "Vastu Clarity for\nThe Growing Business",
    heroTagline:
      "Perfect for businesses in their first 5 years. Get foundational Vastu alignment before bad spatial habits compound.",
    features: [
      {
        title: "Personal Kundali Analysis",
        icon: "ScrollText",
        description:
          "A deep-dive into the business birth chart (incorporation date & time) to map planetary influences on revenue, partnerships, and growth cycles. This becomes the foundation for all spatial recommendations.",
        impact: "Reveals hidden timing patterns for major decisions",
      },
      {
        title: "Career & Wealth Guidance",
        icon: "TrendingUp",
        description:
          "Astrological mapping of your 2nd, 10th, and 11th houses to identify peak wealth periods, career direction clarity, and investment windows aligned with your cosmic blueprint.",
        impact: "Aligns major moves with favourable planetary cycles",
      },
      {
        title: "Favourable Timing Insights",
        icon: "Clock",
        description:
          "Muhurat analysis for key business actions — office moves, launches, major hires, and contract signings. Timing can shift outcomes more than strategy alone.",
        impact: "Reduces risk on high-stakes business decisions",
      },
      {
        title: "1:1 Consultation (60 Min)",
        icon: "Video",
        description:
          "A private, uninterrupted session with Dr. Pradeep Sharma. Come with your toughest questions — from expansion decisions to partner compatibility. Every minute is focused on your business.",
        impact: "Direct expert access for personalised guidance",
      },
      {
        title: "Written Vastu Summary Report",
        icon: "FileText",
        description:
          "A professionally formatted Vastu summary covering directional analysis, zone recommendations, and priority corrections. Delivered as a signed PDF within 7 working days.",
        impact: "Actionable document your architect can implement",
      },
      {
        title: "Email Support for 30 Days",
        icon: "Mail",
        description:
          "Post-audit email access for clarifications, follow-up questions, and implementation doubts. Responses within 24 hours on business days.",
        impact: "Ensures smooth execution of recommendations",
      },
    ],
    processSteps: [
      {
        day: "Day 1–2",
        title: "Booking Confirmed",
        description:
          "Booking confirmed and pre-audit questionnaire sent. You share basic business details, incorporation date, and spatial concerns.",
      },
      {
        day: "Day 2–4",
        title: "Floor Plan Collection",
        description:
          "You share floor plans or photos. We begin preliminary zone mapping and directional assessment.",
      },
      {
        day: "Day 4–6",
        title: "Expert Analysis",
        description:
          "Dr. Sharma conducts the Vastu grid overlay analysis, identifies energy zones, and maps directional influences.",
      },
      {
        day: "Day 6–7",
        title: "Report Delivery",
        description:
          "Summary report compiled and delivered. Review call booked to walk you through every recommendation.",
      },
    ],
  },
  celestial: {
    slug: "celestial",
    heroHeadline: "The Complete Vastu System\nFor Business Growth",
    heroTagline:
      "For scaling businesses and partnerships. Multi-angle audit covering every commercial energy zone in your workspace.",
    features: [
      {
        title: "Business & Partnership Analysis",
        icon: "Handshake",
        description:
          "A thorough astrological compatibility analysis between business partners, co-founders, or key stakeholders. Identifies friction zones and synergy points in the partnership chart.",
        impact: "Prevents costly partnership conflicts",
      },
      {
        title: "Detailed Horoscope Reading",
        icon: "ScrollText",
        description:
          "Comprehensive Kundali reading covering all 12 houses with specific focus on business-relevant houses — wealth (2nd), career (10th), gains (11th), and obstacles (6th, 8th, 12th).",
        impact: "360-degree view of your business destiny",
      },
      {
        title: "Wealth & Opportunity Cycles",
        icon: "TrendingUp",
        description:
          "Dasha-based forecasting of upcoming financial cycles — peak revenue periods, cautious quarters, and windows for aggressive expansion. Plan your fiscal year around cosmic timing.",
        impact: "Time investments to maximise returns",
      },
      {
        title: "Priority Consultations (90 Min × 2)",
        icon: "Video",
        description:
          "Two dedicated sessions: the first for audit presentation and Q&A, the second for 60-day progress review. Priority scheduling — no waitlist.",
        impact: "Twice the face-time for complex businesses",
      },
      {
        title: "Full Vastu Floor Plan Audit",
        icon: "LayoutGrid",
        description:
          "Complete zone-by-zone Vastu audit of your floor plan — entrance, reception, MD cabin, finance department, conference room, pantry, and restrooms. Each zone scored and mapped.",
        impact: "Every square foot optimised for commercial energy",
      },
      {
        title: "Direction & Zone Mapping Report",
        icon: "Compass",
        description:
          "A detailed, colour-coded directional map of your space showing energy zones, Vastu doshas, and correction priorities. Includes furniture placement overlays.",
        impact: "Visual blueprint your interior team can follow",
      },
      {
        title: "Implementation Checklist",
        icon: "ListChecks",
        description:
          "A prioritised, step-by-step checklist of all recommended changes — ranked by impact and difficulty. Tick them off as you implement. No guesswork.",
        impact: "Structured execution with zero ambiguity",
      },
      {
        title: "60-Day WhatsApp Support",
        icon: "MessageCircle",
        description:
          "Direct WhatsApp access to the consulting team for 60 days post-audit. Share photos of changes for real-time feedback. Response within 4 hours.",
        impact: "Real-time guidance during implementation phase",
      },
    ],
    processSteps: [
      {
        day: "Day 1–2",
        title: "Booking & Questionnaire",
        description:
          "Booking confirmed. Detailed pre-audit questionnaire sent covering business structure, partnerships, and spatial pain points.",
      },
      {
        day: "Day 2–4",
        title: "Floor Plan Collection",
        description:
          "You share floor plans. We run preliminary zone mapping with direction marking and energy flow assessment.",
      },
      {
        day: "Day 4–7",
        title: "Deep Vastu Grid Analysis",
        description:
          "Full Vastu grid overlay, zone scoring, direction mapping, and Kundali cross-referencing. Every zone analysed for commercial energy alignment.",
      },
      {
        day: "Day 7–9",
        title: "Report & Consultation",
        description:
          "Comprehensive report compiled. First 90-min priority consultation scheduled to present findings and recommendations.",
      },
      {
        day: "Day 60",
        title: "Progress Review",
        description:
          "Second 90-min consultation to assess implementation progress, refine recommendations, and address new spatial changes.",
      },
    ],
  },
  zenith: {
    slug: "zenith",
    heroHeadline: "Command Your Space.\nCommand Your Market.",
    heroTagline:
      "For market leaders who want no compromise. Includes on-site presence, architect briefing, and Dr. Sharma's direct personal oversight.",
    features: [
      {
        title: "Complete Cosmic Blueprint",
        icon: "Globe",
        description:
          "An exhaustive astro-vastu blueprint combining birth chart analysis, progressed charts, transit forecasts, and spatial mapping into a single unified document. Your business strategy mapped to the stars.",
        impact: "The most comprehensive report we produce",
      },
      {
        title: "Leadership & Legacy Mapping",
        icon: "Crown",
        description:
          "Specialised analysis for founders and CEOs — succession planning through astrology, leadership style alignment with spatial design, and legacy-building directional recommendations.",
        impact: "Aligns your personal energy with business architecture",
      },
      {
        title: "Geopathic Stress Detection",
        icon: "Activity",
        description:
          "On-site detection of underground water veins, geological fault lines, and electromagnetic disturbances that create geopathic stress zones. These invisible forces impact health, focus, and decision-making.",
        impact: "Eliminates invisible energy drains in your workspace",
      },
      {
        title: "Exclusive Annual Forecast Report",
        icon: "CalendarRange",
        description:
          "A month-by-month forecast for the coming year — covering revenue trends, ideal hiring windows, expansion timing, and risk periods. Updated quarterly with transit adjustments.",
        impact: "Plan your entire fiscal year with cosmic intelligence",
      },
      {
        title: "On-site Audit (1 Day, Delhi NCR)",
        icon: "MapPin",
        description:
          "Dr. Sharma visits your premises personally for a full-day, room-by-room Vastu audit. Physical presence allows detection of subtle energy patterns impossible to catch remotely.",
        impact: "Nothing substitutes physical space sensing",
      },
      {
        title: "Architect Briefing Session",
        icon: "Ruler",
        description:
          "A dedicated session with your architect or interior designer to translate Vastu recommendations into actionable construction and design specs. Technical language, not spiritual jargon.",
        impact: "Zero translation gap between audit and execution",
      },
      {
        title: "Direct Line to Dr. Pradeep Sharma",
        icon: "Phone",
        description:
          "Personal phone access to Dr. Sharma for the duration of your engagement. For decisions that can't wait — call directly. Reserved exclusively for Zenith clients.",
        impact: "Instant access when stakes are highest",
      },
      {
        title: "90-Day Implementation Oversight",
        icon: "ShieldCheck",
        description:
          "Dr. Sharma's team actively monitors your implementation progress for 90 days. Weekly check-ins, photo reviews of changes, and course corrections in real time.",
        impact: "Hands-on guidance from audit to completion",
      },
    ],
    processSteps: [
      {
        day: "Day 1–2",
        title: "Booking & Deep Intake",
        description:
          "Booking confirmed. Extensive intake call with Dr. Sharma to understand business vision, leadership challenges, and spatial history.",
      },
      {
        day: "Day 3–5",
        title: "Remote Pre-Analysis",
        description:
          "Floor plans analysed remotely. Birth charts processed. Geopathic stress indicators flagged for on-site verification.",
      },
      {
        day: "Day 5–7",
        title: "On-Site Audit Day",
        description:
          "Dr. Sharma conducts a full-day on-site audit — room-by-room walkthrough, energy sensing, geopathic detection, and directional measurement.",
      },
      {
        day: "Day 7–10",
        title: "Report & Architect Briefing",
        description:
          "Complete Cosmic Blueprint compiled. Architect briefing session scheduled to translate all findings into design specs.",
      },
      {
        day: "Day 10–90",
        title: "Implementation Oversight",
        description:
          "Weekly check-ins, photo reviews, and direct line access. Dr. Sharma's team ensures every recommendation is executed with precision.",
      },
    ],
  },
};

