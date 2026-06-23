"use client";

import FreeServicePageShell from "./FreeServicePageShell";
import { freeServicesConfigs } from "@/lib/data/free-services-configs";

interface FreeServicePageClientProps {
  slug: string;
}

export default function FreeServicePageClient({ slug }: FreeServicePageClientProps) {
  const config = freeServicesConfigs[slug];
  if (!config) return null;

  return (
    <FreeServicePageShell
      title={config.title}
      description={config.description}
      fields={config.fields}
      submitLabel={config.submitLabel}
      onSubmit={config.compute}
    />
  );
}
