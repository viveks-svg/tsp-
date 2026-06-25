import type { Metadata } from "next";

export const siteConfig = {
  name: "Time Space & Planets",
  description:
    "Premium astrology consultation platform integrating Vedic philosophy, business strategy, and astrological intelligence for founders, leaders, and executives.",
  url: "https://astrospace.com",
} as const;

export const freeServicesMetadata: Metadata = {
  title: "Free Cosmic Services — TSP",
  description:
    "Explore free Vedic tools — kundali, matching, tarot, numerology, panchang, and mangal dosha analysis.",
  openGraph: {
    title: "Free Cosmic Services — TSP",
    description: "Discover your cosmic blueprint with our free astrology services.",
    type: "website",
    locale: "en_US",
  },
};

export const calculatorsMetadata: Metadata = {
  title: "Vedic Calculators — TSP",
  description:
    "Love calculators, dasha timelines, rashi, lagna, lucky numbers, muhurat, and more — ancient wisdom made simple.",
  openGraph: {
    title: "Vedic Calculators — TSP",
    description: "Explore 15+ Vedic and numerology calculators for every cosmic question.",
    type: "website",
    locale: "en_US",
  },
};

export const chatMetadata: Metadata = {
  title: "Chat with an Astrologer — TSP",
  description:
    "Connect with verified Vedic astrologers for personalised guidance on love, career, and life's crossroads. Chat or call from ₹1/min.",
  openGraph: {
    title: "Chat with an Astrologer — TSP",
    description:
      "Browse expert astrologers by language, specialty, and rating. Start your cosmic consultation today.",
    type: "website",
    locale: "en_US",
  },
};

export const horoscopeMetadata: Metadata = {
  title: "Your Stars Today — TSP Horoscope",
  description:
    "Discover your cosmic blueprint with daily, weekly, and yearly horoscope readings. What the planets say about your love life, career, health, and fortune.",
  openGraph: {
    title: "Your Stars Today — TSP Horoscope",
    description:
      "Select your zodiac sign and explore what the planets reveal about your path today.",
    type: "website",
    locale: "en_US",
  },
};

export const rootMetadata: Metadata = {
  title: "Astro Space — Transform Your Future with Vedic Astrology & Executive Consulting",
  description: siteConfig.description,
  keywords: [
    "astrology",
    "vedic astrology",
    "executive consulting",
    "kundli",
    "horoscope",
    "vastu shastra",
    "business astrology",
  ],
  openGraph: {
    title: "Time Space & Planets — Transform Your Future",
    description:
      "We integrate Astrology, Vedic Philosophy, and Business Strategy to unlock the next level of your professional destiny.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Time Space & Planets — Transform Your Future",
    description:
      "Premium astrology consultation for leaders and executives.",
  },
};
