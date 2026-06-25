import { ROUTES } from "./routes";

export interface NavLink {
  label: string;
  type?: "dropdown" | "link";
  href: string;
  dropdownType?: "consultations" | "solutions" | "horoscope" | "free-services" | "calculators";
}

export const navLinks: NavLink[] = [
  {
    label: "Home",
    href: ROUTES.HOME,
    type: "link",
  },
  {
    label: "Solutions",
    type: "dropdown",
    href: ROUTES.SOLUTIONS,
    dropdownType: "solutions",
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
    type: "link",
  },
  {
    label: "Blog",
    href: ROUTES.BLOG,
    type: "link",
  },
];
