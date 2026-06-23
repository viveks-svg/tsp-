import type { Metadata } from "next";
import FreeServicesPageContent from "@/features/free-services/components/FreeServicesPageContent";
import { freeServicesMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = freeServicesMetadata;

export default function FreeServicesPage() {
  return <FreeServicesPageContent />;
}
