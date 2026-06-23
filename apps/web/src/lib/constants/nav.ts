import { ROUTES } from "./routes";

export interface NavLink {
  label: string;
  type?: "dropdown" | "link";
  href: string;
  dropdownType?: "consultations" | "horoscope" | "free-services" | "calculators";
}

export const navLinks: NavLink[] = [
  {
    label: "Consultation",
    type: "dropdown",
    href: "#",
    dropdownType: "consultations",
  },
  {
    label: "Business Vastu",
    href: "/business-vastu",
    type: "link"
  },
  {
    label: "Horoscope",
    type: "dropdown",
    href: ROUTES.HOROSCOPE,
    dropdownType: "horoscope",
  },
  {
    label: "Free Services",
    type: "dropdown",
    href: ROUTES.FREE_SERVICES,
    dropdownType: "free-services",
  },
  {
    label: "Calculators",
    type: "dropdown",
    href: ROUTES.CALCULATORS,
    dropdownType: "calculators",
  },
  {
    label: "Shop",
    href: ROUTES.SHOP,
  },
  {
    label: "Blog",
    href: ROUTES.BLOG,
  },
];
