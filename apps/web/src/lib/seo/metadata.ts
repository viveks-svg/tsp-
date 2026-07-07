import type { Metadata } from "next";

export const siteConfig = {
  name: "Time Space & Planets",
  description:
    "Premium astrology consultation platform integrating Vedic philosophy, business strategy, and astrological intelligence for founders, leaders, and executives.",
  url: "https://tsp-web.vercel.app",
} as const;

export const rootMetadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: "Time Space & Planets — Transform Your Future",
    template: "%s | TSP",
  },
  description:
    "We integrate Astrology, Vedic Philosophy, and Business Strategy to unlock your professional destiny.",
  keywords: [
    "astrology",
    "vedic astrology",
    "executive consulting",
    "kundli",
    "horoscope",
    "vastu shastra",
    "business astrology",
  ],
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: siteConfig.url,
    siteName: siteConfig.name,
    title: "Time Space & Planets — Transform Your Future",
    description:
      "Premium astrology consultation platform integrating Vedic philosophy and business strategy for leaders.",
    images: [
      {
        url: "/og/default.png",
        width: 1200,
        height: 630,
        alt: "Time Space & Planets",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Time Space & Planets — Transform Your Future",
    description: "Premium astrology consultation for leaders and executives.",
    images: ["/og/default.png"],
  },
};

export const freeServicesMetadata: Metadata = {
  title: "Free Cosmic Services",
  description:
    "Explore free Vedic tools — kundali, matching, tarot, numerology, panchang, and mangal dosha analysis.",
  keywords: [
    "free astrology tools",
    "kundali",
    "panchang",
    "mangal dosha",
    "tarot reading",
    "numerology",
    "vedic matching",
  ],
  alternates: {
    canonical: "/free-services",
  },
  openGraph: {
    title: "Free Cosmic Services",
    description: "Discover your cosmic blueprint with our free astrology services.",
    type: "website",
    locale: "en_IN",
    siteName: siteConfig.name,
    images: [{ url: "/og/default.png", width: 1200, height: 630, alt: "Free Cosmic Services" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Free Cosmic Services",
    description: "Discover your cosmic blueprint with our free astrology services.",
    images: ["/og/default.png"],
  },
};

export const calculatorsMetadata: Metadata = {
  title: "Vedic Calculators",
  description:
    "Love calculators, dasha timelines, rashi, lagna, lucky numbers, muhurat, and more — ancient wisdom made simple.",
  keywords: [
    "vedic calculators",
    "love calculator",
    "rashi calculator",
    "lagna calculator",
    "muhurat",
    "dasha timeline",
  ],
  alternates: {
    canonical: "/calculators",
  },
  openGraph: {
    title: "Vedic Calculators",
    description: "Explore 15+ Vedic and numerology calculators for every cosmic question.",
    type: "website",
    locale: "en_IN",
    siteName: siteConfig.name,
    images: [{ url: "/og/default.png", width: 1200, height: 630, alt: "Vedic Calculators" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Vedic Calculators",
    description: "Explore 15+ Vedic and numerology calculators for every cosmic question.",
    images: ["/og/default.png"],
  },
};

export const chatMetadata: Metadata = {
  title: "Chat with an Astrologer",
  description:
    "Connect with verified Vedic astrologers for personalised guidance on love, career, and life's crossroads. Chat or call from ₹1/min.",
  keywords: [
    "chat with astrologer",
    "talk to astrologer",
    "vedic astrology consultation",
    "astrology chat online",
    "live astrologer",
  ],
  alternates: {
    canonical: "/chat",
  },
  openGraph: {
    title: "Chat with an Astrologer",
    description:
      "Browse expert astrologers by language, specialty, and rating. Start your cosmic consultation today.",
    type: "website",
    locale: "en_IN",
    siteName: siteConfig.name,
    images: [{ url: "/og/default.png", width: 1200, height: 630, alt: "Chat with an Astrologer" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Chat with an Astrologer",
    description:
      "Browse expert astrologers by language, specialty, and rating. Start your cosmic consultation today.",
    images: ["/og/default.png"],
  },
};

export const horoscopeMetadata: Metadata = {
  title: "Your Stars Today — Horoscope",
  description:
    "Discover your cosmic blueprint with daily, weekly, and yearly horoscope readings. What the planets say about love, career & health.",
  keywords: [
    "daily horoscope",
    "weekly horoscope",
    "yearly horoscope",
    "zodiac sign reading",
    "astrology prediction",
    "today's horoscope",
  ],
  alternates: {
    canonical: "/horoscope",
  },
  openGraph: {
    title: "Your Stars Today — Horoscope",
    description:
      "Select your zodiac sign and explore what the planets reveal about your path today.",
    type: "website",
    locale: "en_IN",
    siteName: siteConfig.name,
    images: [{ url: "/og/default.png", width: 1200, height: 630, alt: "Your Stars Today — Horoscope" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Your Stars Today — Horoscope",
    description:
      "Select your zodiac sign and explore what the planets reveal about your path today.",
    images: ["/og/default.png"],
  },
};
