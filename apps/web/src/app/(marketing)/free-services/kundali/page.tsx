import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ToolPageLayout from "@/features/tools/components/ToolPageLayout";
import FreeServicePageClient from "@/features/free-services/components/FreeServicePageClient";
import { freeServices } from "@/lib/data/free-services";

export const metadata: Metadata = {
  title: "Free Online Kundali Generation | Astro Space",
  description: "Generate your detailed Vedic birth chart with planetary placements, houses, and cosmic insights.",
};

export default function KundaliPage() {
  const item = freeServices.find((s) => s.id === "kundali");

  if (!item) {
    notFound();
  }

  const relatedTools = freeServices
    .filter((s) => s.id !== "kundali")
    .map((s) => ({
      id: s.id,
      title: s.title,
      description: s.description,
      href: s.href,
      icon: s.icon,
      categoryLabel: "Free Service",
    }));

  return (
    <ToolPageLayout
      title={item.title}
      description={item.description}
      categoryLabel="Free Service"
      categoryHref="/free-services"
      breadcrumbItems={[
        { label: "Free Services", href: "/free-services" },
        { label: item.title },
      ]}
      relatedTools={relatedTools}
    >
      <div className="bg-card rounded-2xl p-6 border border-border shadow-card">
        <FreeServicePageClient slug="kundali" />
      </div>
    </ToolPageLayout>
  );
}
