import type { AppRoute } from "@/lib/constants/routes";

export interface FreeServiceItem {
  id: string;
  title: string;
  description: string;
  href: AppRoute;
  icon: string;
}

export interface FormField {
  name: string;
  label: string;
  type: "text" | "date" | "time" | "select";
  placeholder?: string;
  options?: string[];
  required?: boolean;
}
