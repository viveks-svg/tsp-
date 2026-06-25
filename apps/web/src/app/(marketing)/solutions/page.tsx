import type { Metadata } from "next";
import SolutionsContent from "./SolutionsContent";

export const metadata: Metadata = {
  title: "Solutions | Time Space & Planets",
  description:
    "Discover premium consulting solutions by Dr. Pradeep Sharma — Business Vastu, Strategic Consulting, Career Guidance, Residential Vastu, and more.",
  openGraph: {
    title: "Solutions | Time Space & Planets",
    description:
      "Solutions designed around your challenges. Premium Vastu, astrology, and strategic consulting services.",
    type: "website",
  },
};

export default function SolutionsPage() {
  return <SolutionsContent />;
}
