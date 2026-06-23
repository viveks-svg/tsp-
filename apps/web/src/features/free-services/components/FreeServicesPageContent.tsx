"use client";

import PageWrapper from "@/components/layout/PageWrapper";
import StaggerContainer, { StaggerItem } from "@/components/animations/StaggerContainer";
import FreeServiceHubCard from "@/features/free-services/components/FreeServiceHubCard";
import { freeServices } from "@/lib/data/free-services";

export default function FreeServicesPageContent() {
  return (
    <PageWrapper
      title="Free Cosmic Services"
      description="Explore ancient Vedic tools at no cost — birth charts, compatibility, tarot, numerology, panchang, and dosha analysis await your discovery."
    >
      <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {freeServices.map((service) => (
          <StaggerItem key={service.id}>
            <FreeServiceHubCard service={service} />
          </StaggerItem>
        ))}
      </StaggerContainer>
    </PageWrapper>
  );
}
