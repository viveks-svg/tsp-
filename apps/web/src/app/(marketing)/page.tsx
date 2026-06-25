import HeroSection from "@/features/home/sections/HeroSection";
import TrustStrip from "@/features/home/sections/TrustStrip";
import WhatWeDoSection from "@/components/home/WhatWeDoSection";
import AstrologersSection from "@/components/home/AstrologersSection";
import ReportsSection from "@/components/home/ReportsSection";
import AdvisorCTA from "@/features/home/sections/AdvisorCTA";
import FeatureCards from "@/features/home/sections/FeatureCards";
import HowItWorks from "@/features/home/sections/HowItWorks";
import PricingSection from "@/features/home/sections/PricingSection";
import FounderSection from "@/features/home/sections/FounderSection";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <TrustStrip />
      <WhatWeDoSection />
      <AstrologersSection />
      <ReportsSection />
      <FeatureCards />
      <HowItWorks />
      <PricingSection />
      <AdvisorCTA />
      <FounderSection />
    </>
  );
}
