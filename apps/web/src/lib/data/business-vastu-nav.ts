import type { LucideIcon } from "lucide-react";
import {
  Building2,
  Factory,
  Map,
  ShoppingBag,
  Hotel,
  Laptop,
} from "lucide-react";

/* ── Types ────────────────────────────────────────────── */

export interface VastuNavService {
  title: string;
  description: string;
  href: string;
  Icon: LucideIcon;
}

export interface VastuNavStat {
  value: string;
  label: string;
}

export interface VastuNavFeaturedPlan {
  badge: string;
  name: string;
  price: string;
  features: string[];
  ctaText: string;
  ctaHref: string;
}

/* ── Data ─────────────────────────────────────────────── */

export const VASTU_NAV_SERVICES: VastuNavService[] = [
  {
    title: "Office Vastu",
    description: "Spatial alignment for corporate offices",
    href: "/business-vastu/office",
    Icon: Building2,
  },
  {
    title: "Factory & Warehouse",
    description: "Industrial Vastu for production units",
    href: "/business-vastu/factory",
    Icon: Factory,
  },
  {
    title: "Commercial Plots",
    description: "Pre-purchase land Vastu analysis",
    href: "/business-vastu/commercial-plots",
    Icon: Map,
  },
  {
    title: "Retail & Showroom",
    description: "Customer flow & cash counter Vastu",
    href: "/business-vastu/retail",
    Icon: ShoppingBag,
  },
  {
    title: "Hotel & Hospitality",
    description: "Room, reception & kitchen alignment",
    href: "/business-vastu/hotel",
    Icon: Hotel,
  },
  {
    title: "Co-working Spaces",
    description: "Modern workspace Vastu for startups",
    href: "/business-vastu/coworking",
    Icon: Laptop,
  },
];

export const VASTU_NAV_STATS: VastuNavStat[] = [
  { value: "500+", label: "Business Vastu Audits Completed" },
  { value: "₹2Cr+", label: "Revenue Unlocked for Clients" },
];

export const VASTU_NAV_FEATURED_PLAN: VastuNavFeaturedPlan = {
  badge: "MOST POPULAR",
  name: "Celestial Business Audit",
  price: "₹90,000",
  features: [
    "Full Vastu Floor Plan Audit",
    "Direction & Zone Mapping Report",
    "90-day implementation oversight",
  ],
  ctaText: "View All Plans →",
  ctaHref: "/business-vastu#pricing",
};
