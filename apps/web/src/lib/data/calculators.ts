import { ROUTES } from "@/lib/constants/routes";
import type { CalculatorItem } from "@/types/calculator";

export const calculators: CalculatorItem[] = [
  { id: "love", title: "Love Calculator", description: "Measure the cosmic chemistry between two names.", href: ROUTES.CALC_LOVE, category: "love", icon: "♥" },
  { id: "name-compatibility", title: "Name Compatibility", description: "Discover how your names vibrate together in harmony.", href: ROUTES.CALC_NAME_COMPATIBILITY, category: "love", icon: "✿" },
  { id: "dasha", title: "Dasha Calculator", description: "Vimshottari dasha timeline — your planetary periods revealed.", href: ROUTES.CALC_DASHA, category: "vedic", icon: "☊" },
  { id: "mulaank", title: "Mulaank (Root Number)", description: "Your birth date root number and its cosmic meaning.", href: ROUTES.CALC_MULAANK, category: "numerology", icon: "①" },
  { id: "rashi", title: "Rashi Calculator", description: "Find your Moon sign — the emotional core of your chart.", href: ROUTES.CALC_RASHI, category: "vedic", icon: "☽" },
  { id: "lagna", title: "Lagna Calculator", description: "Discover your Ascendant — the mask you wear for the world.", href: ROUTES.CALC_LAGNA, category: "vedic", icon: "↑" },
  { id: "lucky-number", title: "Lucky Number", description: "Your personal lucky number based on birth details.", href: ROUTES.CALC_LUCKY_NUMBER, category: "numerology", icon: "✧" },
  { id: "lucky-color", title: "Lucky Color", description: "The colour that amplifies your cosmic energy today.", href: ROUTES.CALC_LUCKY_COLOR, category: "numerology", icon: "◉" },
  { id: "baby-name", title: "Baby Name Finder", description: "Find auspicious names aligned with your baby's nakshatra.", href: ROUTES.CALC_BABY_NAME, category: "vedic", icon: "☺" },
  { id: "shubh-muhurat", title: "Shubh Muhurat", description: "Find the most auspicious time for your important event.", href: ROUTES.CALC_SHUBH_MUHURAT, category: "timing", icon: "⏱" },
  { id: "saturn-return", title: "Saturn Return", description: "When Saturn returns to your natal position — a life milestone.", href: ROUTES.CALC_SATURN_RETURN, category: "vedic", icon: "♄" },
  { id: "nakshatra", title: "Nakshatra Finder", description: "Identify your birth star and its divine qualities.", href: ROUTES.CALC_NAKSHATRA, category: "vedic", icon: "★" },
  { id: "ayanamsa", title: "Ayanamsa Calculator", description: "Calculate the precession offset for precise chart work.", href: ROUTES.CALC_AYANAMSA, category: "vedic", icon: "⟳" },
  { id: "hora", title: "Hora Calculator", description: "Planetary hours for choosing the right moment.", href: ROUTES.CALC_HORA, category: "timing", icon: "◷" },
  { id: "choghadiya", title: "Choghadiya", description: "Auspicious and inauspicious time slots for today.", href: ROUTES.CALC_CHOGHADIYA, category: "timing", icon: "▦" },
];
