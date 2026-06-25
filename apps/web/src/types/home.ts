export interface ServiceCard {
  icon: string;       // SVG component name or emoji fallback
  title: string;
  description: string;
  href: string;
}

export interface ReportCard {
  title: string;
  price: number;
  slug: string;
  imagePlaceholder?: string;
}

export interface AstrologerCard {
  id: string;
  name: string;
  speciality: string;
  experience: string;
  rating: number;
  reviewCount: number;
  languages: string[];
  avatarUrl: string;
}
