import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  PRICING_PLANS,
  PLAN_DETAIL_DATA,
} from "@/lib/data/business-vastu";
import PlanHero from "@/components/business-vastu/plans/PlanHero";
import PlanFeatureBreakdown from "@/components/business-vastu/plans/PlanFeatureBreakdown";
import PlanProcess from "@/components/business-vastu/plans/PlanProcess";
import PlanGuarantee from "@/components/business-vastu/plans/PlanGuarantee";
import PlanCTA from "@/components/business-vastu/plans/PlanCTA";
import { SectionErrorBoundary } from "@/components/shared/SectionErrorBoundary";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/* ── Static Params ─────────────────────────────────────── */

const VALID_SLUGS = ["rising", "celestial", "zenith"] as const;

export function generateStaticParams() {
  return VALID_SLUGS.map((slug) => ({ slug }));
}

/* ── Dynamic SEO Metadata ──────────────────────────────── */

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const plan = PRICING_PLANS.find((p) => p.slug === slug);
  const detail = PLAN_DETAIL_DATA[slug];

  if (!plan || !detail) {
    return { title: "Plan Not Found | Time Space & Planets" };
  }

  const displayName =
    plan.name.charAt(0) + plan.name.slice(1).toLowerCase();

  return {
    title: `${displayName} Plan — Business Vastu | Time Space & Planets`,
    description: `${detail.heroTagline} Starting at ${plan.price}. Includes ${plan.features.length} features with 90-day support.`,
    openGraph: {
      title: `${displayName} Business Vastu Plan | Time Space & Planets`,
      description: detail.heroTagline,
      type: "website",
    },
  };
}

/* ── Page Component ────────────────────────────────────── */

export default async function PlanDetailPage({
  params,
}: PageProps) {
  const { slug } = await params;
  const plan = PRICING_PLANS.find((p) => p.slug === slug);
  const detail = PLAN_DETAIL_DATA[slug];

  if (!plan || !detail) {
    notFound();
  }

  const displayName =
    plan.name.charAt(0) + plan.name.slice(1).toLowerCase();

  return (
    <>
      <SectionErrorBoundary sectionName="PlanHero">
        <PlanHero plan={plan} detail={detail} />
      </SectionErrorBoundary>
      <SectionErrorBoundary sectionName="PlanFeatureBreakdown">
        <PlanFeatureBreakdown features={detail.features} />
      </SectionErrorBoundary>
      <SectionErrorBoundary sectionName="PlanProcess">
        <PlanProcess planName={displayName} steps={detail.processSteps} />
      </SectionErrorBoundary>
      <SectionErrorBoundary sectionName="PlanGuarantee">
        <PlanGuarantee />
      </SectionErrorBoundary>
      <SectionErrorBoundary sectionName="PlanCTA">
        <PlanCTA plan={plan} />
      </SectionErrorBoundary>
    </>
  );
}
