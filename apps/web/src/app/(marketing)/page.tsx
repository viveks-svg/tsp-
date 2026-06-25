import HeroSection from "@/features/home/sections/HeroSection";
import TrustStrip from "@/features/home/sections/TrustStrip";
import WhatWeDoSection from "@/components/home/WhatWeDoSection";
import ReportsSection from "@/components/home/ReportsSection";
import AstrologersSection from "@/components/home/AstrologersSection";
import AdvisorCTA from "@/features/home/sections/AdvisorCTA";
import FeatureCards from "@/features/home/sections/FeatureCards";
import HowItWorks from "@/features/home/sections/HowItWorks";
import HoroscopeSection from "@/features/home/sections/HoroscopeSection";
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
      <ReportsSection />
      <AstrologersSection />
      <AdvisorCTA />
      <FeatureCards />
      <HowItWorks />
      <HoroscopeSection />
      <PricingSection />
      <FounderSection />
    </>
  );
}
