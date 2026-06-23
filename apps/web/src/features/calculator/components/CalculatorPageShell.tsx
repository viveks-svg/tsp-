"use client";

import FreeServicePageShell from "@/features/free-services/components/FreeServicePageShell";
import { calculatorConfigs } from "@/lib/data/calculator-configs";

interface CalculatorPageShellProps {
  slug: string;
}

export default function CalculatorPageShell({ slug }: CalculatorPageShellProps) {
  const config = calculatorConfigs[slug];
  if (!config) return null;

  return (
    <FreeServicePageShell
      title={config.title}
      description={config.description}
      fields={config.fields}
      submitLabel={config.submitLabel ?? "Calculate"}
      onSubmit={config.compute}
    />
  );
}

