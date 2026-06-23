import { ROUTES } from "@/lib/constants/routes";
import type { FreeServiceItem } from "@/types/free-services";

export const freeServices: FreeServiceItem[] = [
  {
    id: "kundali",
    title: "Kundali",
    description:
      "Generate your Vedic birth chart with planetary positions, houses, and cosmic insights tailored to your birth details.",
    href: ROUTES.FREE_KUNDALI,
    icon: "☉",
  },
  {
    id: "kundali-matching",
    title: "Kundali Matching",
    description:
      "Discover compatibility through Ashtakoot Guna Milan — dosha analysis and harmony score for two souls.",
    href: ROUTES.FREE_KUNDALI_MATCHING,
    icon: "♡",
  },
  {
    id: "tarot",
    title: "Tarot Reading",
    description:
      "Draw cards from the cosmic deck — 1-card, 3-card, or Celtic Cross spreads reveal your path forward.",
    href: ROUTES.FREE_TAROT,
    icon: "✦",
  },
  {
    id: "numerology",
    title: "Numerology",
    description:
      "Uncover your life path, destiny, and soul numbers — the hidden mathematics of your cosmic blueprint.",
    href: ROUTES.FREE_NUMEROLOGY,
    icon: "∞",
  },
  {
    id: "panchang",
    title: "Panchang",
    description:
      "Today's sacred almanac — tithi, nakshatra, yoga, karan, and Rahu Kaal for auspicious timing.",
    href: ROUTES.FREE_PANCHANG,
    icon: "☽",
  },
  {
    id: "mangal-dosha",
    title: "Mangal Dosha",
    description:
      "Check Mars placement in your chart and receive personalised remedies for harmonious relationships.",
    href: ROUTES.FREE_MANGAL_DOSHA,
    icon: "♂",
  },
];
