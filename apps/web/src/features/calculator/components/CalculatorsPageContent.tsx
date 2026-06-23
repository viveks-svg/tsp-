"use client";

import PageWrapper from "@/components/layout/PageWrapper";
import CalculatorGrid from "@/features/calculator/components/CalculatorGrid";

export default function CalculatorsPageContent() {
  return (
    <PageWrapper
      title="Vedic Calculators"
      description="Ancient wisdom, modern precision — explore calculators for love, numerology, Vedic astrology, and auspicious timing."
    >
      <CalculatorGrid />
    </PageWrapper>
  );
}
