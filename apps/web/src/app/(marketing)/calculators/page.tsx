import type { Metadata } from "next";
import CalculatorsPageContent from "@/features/calculator/components/CalculatorsPageContent";
import { calculatorsMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = calculatorsMetadata;

export default function CalculatorsPage() {
  return <CalculatorsPageContent />;
}
