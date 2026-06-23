export type AstrologerSortOption =
  | "popular"
  | "price-low"
  | "price-high"
  | "rating"
  | "experience";

export interface Astrologer {
  id: string;
  name: string;
  specialties: string[];
  languages: string[];
  rating: number;
  reviewCount: number;
  pricePerMin: number;
  experienceYears: number;
  isOnline: boolean;
  initials: string;
}

export interface AstrologerFilters {
  search: string;
  language: string;
  specialty: string;
  minRating: number;
  maxPrice: number;
  onlineOnly: boolean;
  sort: AstrologerSortOption;
}

export const DEFAULT_ASTROLOGER_FILTERS: AstrologerFilters = {
  search: "",
  language: "all",
  specialty: "all",
  minRating: 0,
  maxPrice: 50,
  onlineOnly: false,
  sort: "popular",
};
