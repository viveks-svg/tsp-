import type { ReactNode } from "react";
import type { AppRoute } from "@/lib/constants/routes";
import type { FormField } from "@/types/free-services";

export type CalculatorCategory =
  | "love"
  | "numerology"
  | "vedic"
  | "timing";

export interface CalculatorItem {
  id: string;
  title: string;
  description: string;
  href: AppRoute;
  category: CalculatorCategory;
  icon: string;
}

export interface CalculatorConfig {
  title: string;
  description: string;
  fields: FormField[];
  submitLabel?: string;
  compute: (values: Record<string, string>) => ReactNode;
}

export const CALCULATOR_CATEGORY_LABELS: Record<CalculatorCategory, string> = {
  love: "Love & Relationships",
  numerology: "Numerology",
  vedic: "Vedic",
  timing: "Timing & Muhurat",
};
