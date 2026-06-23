import HeroSection from "@/features/home/sections/HeroSection";
import TrustStrip from "@/features/home/sections/TrustStrip";
import ServicesSection from "@/features/home/sections/ServicesSection";
import AdvisorCTA from "@/features/home/sections/AdvisorCTA";
import FeatureCards from "@/features/home/sections/FeatureCards";
import HowItWorks from "@/features/home/sections/HowItWorks";
import HoroscopeSection from "@/features/home/sections/HoroscopeSection";
import PricingSection from "@/features/home/sections/PricingSection";
import FounderSection from "@/features/home/sections/FounderSection";

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <TrustStrip />
      <ServicesSection />
      <AdvisorCTA />
      <FeatureCards />
      <HowItWorks />
      <HoroscopeSection />
      <PricingSection />
      <FounderSection />
    </>
  );
}
