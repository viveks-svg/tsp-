import type { Metadata } from "next";

import BVHero from "@/components/business-vastu/BVHero";
import BVMarquee from "@/components/business-vastu/BVMarquee";
import BVPhilosophy from "@/components/business-vastu/BVPhilosophy";
import BVServices from "@/components/business-vastu/BVServices";
import BVProcess from "@/components/business-vastu/BVProcess";
import BVTestimonials from "@/components/business-vastu/BVTestimonials";
import BVPricing from "@/components/business-vastu/BVPricing";
import BVFaq from "@/components/business-vastu/BVFaq";
import BVCta from "@/components/business-vastu/BVCta";
import { SectionErrorBoundary } from "@/components/shared/SectionErrorBoundary";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Business Vastu Consultation | Time Space & Planets",
  description:
    "Transform your business space into a prosperity engine. Expert Vastu audits for offices, factories, retail, hotels & co-working spaces. 500+ audits completed.",
  openGraph: {
    title: "Business Vastu Consultation | Time Space & Planets",
    description:
      "Ancient Vastu principles aligned with modern corporate architecture. Book your Business Vastu audit today.",
    type: "website",
  },
};

export default function BusinessVastuPage() {
  return (
    <>
      <SectionErrorBoundary sectionName="BVHero">
        <BVHero />
      </SectionErrorBoundary>
      <SectionErrorBoundary sectionName="BVMarquee">
        <BVMarquee />
      </SectionErrorBoundary>
      <SectionErrorBoundary sectionName="BVPhilosophy">
        <BVPhilosophy />
      </SectionErrorBoundary>
      <SectionErrorBoundary sectionName="BVServices">
        <BVServices />
      </SectionErrorBoundary>
      <SectionErrorBoundary sectionName="BVProcess">
        <BVProcess />
      </SectionErrorBoundary>
      <SectionErrorBoundary sectionName="BVTestimonials">
        <BVTestimonials />
      </SectionErrorBoundary>
      <SectionErrorBoundary sectionName="BVPricing">
        <BVPricing />
      </SectionErrorBoundary>
      <SectionErrorBoundary sectionName="BVFaq">
        <BVFaq />
      </SectionErrorBoundary>
      <SectionErrorBoundary sectionName="BVCta">
        <BVCta />
      </SectionErrorBoundary>
    </>
  );
}
