import { ROUTES } from "./routes";

export const footerLinks = {
  solutions: [
    { label: "Business Vastu", href: "/solutions/business-vastu" },
    { label: "Strategic Consulting", href: "/solutions/strategic-consulting" },
    { label: "Career Guidance", href: "/solutions/career-guidance" },
    { label: "Residential Vastu", href: "/solutions/residential-vastu" },
    { label: "Relationship Guidance", href: "/solutions/relationship-guidance" },
    { label: "View All Solutions", href: ROUTES.SOLUTIONS },
  ],
  horoscopes: [
    { label: "Today's Horoscope", href: ROUTES.HOROSCOPE },
    { label: "Daily Horoscope", href: "/horoscope/daily" },
    { label: "Weekly Horoscope", href: "/horoscope/weekly" },
    { label: "Monthly Horoscope", href: "/horoscope/monthly" },
    { label: "Yearly Horoscope", href: "/horoscope/yearly" },
  ],
  freeServices: [
    { label: "Free Kundli", href: ROUTES.FREE_KUNDALI },
    { label: "Kundli Matching", href: ROUTES.FREE_KUNDALI_MATCHING },
    { label: "Mangal Dosha", href: ROUTES.FREE_MANGAL_DOSHA },
    { label: "Numerology", href: ROUTES.FREE_NUMEROLOGY },
    { label: "Today's Panchang", href: ROUTES.FREE_PANCHANG },
    { label: "Free Tarot", href: ROUTES.FREE_TAROT },
  ],
  calculators: [
    { label: "Love Calculator", href: ROUTES.CALC_LOVE },
    { label: "Name Compatibility", href: ROUTES.CALC_NAME_COMPATIBILITY },
    { label: "Mulaank Calculator", href: ROUTES.CALC_MULAANK },
    { label: "Rashi Calculator", href: ROUTES.CALC_RASHI },
    { label: "Lagna Calculator", href: ROUTES.CALC_LAGNA },
    { label: "Shubh Muhurat", href: ROUTES.CALC_SHUBH_MUHURAT },
    { label: "Choghadiya", href: ROUTES.CALC_CHOGHADIYA },
  ],
  shop: [
    { label: "Astro Shop", href: ROUTES.SHOP },
    { label: "Business Vastu Plans", href: ROUTES.BUSINESS_VASTU },
  ],
  corporate: [
    { label: "About Us", href: ROUTES.ABOUT },
    { label: "Contact Us", href: ROUTES.CONTACT },
    { label: "Pricing Plans", href: ROUTES.PRICING },
    { label: "FAQs", href: ROUTES.FAQ },
    { label: "Blog", href: ROUTES.BLOG },
  ],
  legal: [
    { label: "Privacy Policy", href: ROUTES.PRIVACY_POLICY },
    { label: "Terms of Service", href: ROUTES.TERMS },
    { label: "Refund Policy", href: "#" },
    { label: "Disclaimer", href: "#" },
  ],
};
