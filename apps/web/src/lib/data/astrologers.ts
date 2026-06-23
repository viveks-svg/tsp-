import type { Astrologer, AstrologerFilters } from "@/types/astrologer";
import type { ApiAstrologer } from "@/types/api";

export const astrologerLanguages = [
  "Hindi",
  "English",
  "Tamil",
  "Telugu",
  "Bengali",
  "Marathi",
  "Gujarati",
  "Kannada",
] as const;

export const astrologerSpecialties = [
  "Vedic",
  "Tarot",
  "Numerology",
  "Palmistry",
  "Vastu",
  "Love & Marriage",
  "Career",
  "Remedies",
] as const;

export const astrologers: Astrologer[] = [
  {
    id: "1",
    name: "Pandit Rajesh Sharma",
    specialties: ["Vedic", "Career", "Remedies"],
    languages: ["Hindi", "English"],
    rating: 4.9,
    reviewCount: 12480,
    pricePerMin: 18,
    experienceYears: 22,
    isOnline: true,
    initials: "RS",
  },
  {
    id: "2",
    name: "Acharya Priya Mehta",
    specialties: ["Love & Marriage", "Tarot", "Numerology"],
    languages: ["Hindi", "English", "Gujarati"],
    rating: 4.8,
    reviewCount: 9340,
    pricePerMin: 15,
    experienceYears: 15,
    isOnline: true,
    initials: "PM",
  },
  {
    id: "3",
    name: "Dr. Venkatesh Iyer",
    specialties: ["Vedic", "Palmistry", "Vastu"],
    languages: ["Tamil", "English", "Telugu"],
    rating: 4.7,
    reviewCount: 7820,
    pricePerMin: 22,
    experienceYears: 28,
    isOnline: false,
    initials: "VI",
  },
  {
    id: "4",
    name: "Guru Ananya Das",
    specialties: ["Numerology", "Career", "Remedies"],
    languages: ["Bengali", "Hindi", "English"],
    rating: 4.9,
    reviewCount: 11200,
    pricePerMin: 12,
    experienceYears: 18,
    isOnline: true,
    initials: "AD",
  },
  {
    id: "5",
    name: "Pandit Suresh Kulkarni",
    specialties: ["Vedic", "Love & Marriage"],
    languages: ["Marathi", "Hindi", "English"],
    rating: 4.6,
    reviewCount: 6540,
    pricePerMin: 10,
    experienceYears: 12,
    isOnline: true,
    initials: "SK",
  },
  {
    id: "6",
    name: "Acharya Lakshmi Reddy",
    specialties: ["Tarot", "Love & Marriage", "Career"],
    languages: ["Telugu", "Kannada", "English"],
    rating: 4.8,
    reviewCount: 8900,
    pricePerMin: 20,
    experienceYears: 16,
    isOnline: false,
    initials: "LR",
  },
  {
    id: "7",
    name: "Pandit Mohan Joshi",
    specialties: ["Vedic", "Remedies", "Vastu"],
    languages: ["Hindi", "Marathi"],
    rating: 4.5,
    reviewCount: 4320,
    pricePerMin: 8,
    experienceYears: 30,
    isOnline: true,
    initials: "MJ",
  },
  {
    id: "8",
    name: "Dr. Kavitha Nair",
    specialties: ["Palmistry", "Numerology", "Career"],
    languages: ["Tamil", "English", "Kannada"],
    rating: 4.7,
    reviewCount: 5670,
    pricePerMin: 16,
    experienceYears: 14,
    isOnline: true,
    initials: "KN",
  },
];

export function mapApiAstrologer(astrologer: ApiAstrologer): Astrologer {
  const name = astrologer.user.name || "TSP Astrologer";
  const nameParts = name.trim().split(/\s+/);
  const initials = nameParts
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

  return {
    id: astrologer.id,
    name,
    specialties: astrologer.expertises.map(
      ({ expertise }) => expertise.name
    ),
    languages: astrologer.languages.map(({ language }) => language.name),
    rating: astrologer.rating,
    reviewCount: 0,
    pricePerMin: Number(astrologer.pricingPerMin),
    experienceYears: 0,
    isOnline: astrologer.isAvailable,
    initials: initials || "TA",
  };
}

export function filterAstrologers(
  list: Astrologer[],
  filters: AstrologerFilters
): Astrologer[] {
  let result = [...list];

  if (filters.search.trim()) {
    const q = filters.search.toLowerCase();
    result = result.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.specialties.some((s) => s.toLowerCase().includes(q))
    );
  }

  if (filters.language !== "all") {
    result = result.filter((a) => a.languages.includes(filters.language));
  }

  if (filters.specialty !== "all") {
    result = result.filter((a) => a.specialties.includes(filters.specialty));
  }

  if (filters.minRating > 0) {
    result = result.filter((a) => a.rating >= filters.minRating);
  }

  result = result.filter((a) => a.pricePerMin <= filters.maxPrice);

  if (filters.onlineOnly) {
    result = result.filter((a) => a.isOnline);
  }

  switch (filters.sort) {
    case "price-low":
      result.sort((a, b) => a.pricePerMin - b.pricePerMin);
      break;
    case "price-high":
      result.sort((a, b) => b.pricePerMin - a.pricePerMin);
      break;
    case "rating":
      result.sort((a, b) => b.rating - a.rating);
      break;
    case "experience":
      result.sort((a, b) => b.experienceYears - a.experienceYears);
      break;
    case "popular":
    default:
      result.sort((a, b) => b.reviewCount - a.reviewCount);
      break;
  }

  return result;
}
