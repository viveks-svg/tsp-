"use client";

import { useState } from "react";
import type { FormField } from "@/types/free-services";
import type { ReactNode } from "react";
import Button from "@/components/ui/Button";

interface FreeServicePageShellProps {
  title: string;
  description: string;
  fields: FormField[];
  submitLabel?: string;
  onSubmit: (values: Record<string, string>) => ReactNode;
}

export default function FreeServicePageShell({
  title,
  description,
  fields,
  submitLabel = "Calculate",
  onSubmit,
}: FreeServicePageShellProps) {
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [result, setResult] = useState<ReactNode | null>(null);

  const handleChange = (name: string, value: string) => {
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const calculatedResult = onSubmit(formValues);
    setResult(calculatedResult);
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-heading text-2xl font-bold text-dark mb-2 animate-fade-in">
          {title}
        </h2>
        <p className="text-paragraph text-sm font-body leading-relaxed max-w-2xl">
          {description}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {fields.map((field) => {
            const value = formValues[field.name] ?? "";
            return (
              <div key={field.name} className="space-y-2">
                <label className="block text-xs font-semibold text-dark font-poppins uppercase tracking-wider">
                  {field.label} {field.required && <span className="text-rose-500">*</span>}
                </label>

                {field.type === "select" ? (
                  <select
                    value={value}
                    onChange={(e) => handleChange(field.name, e.target.value)}
                    required={field.required}
                    className="w-full bg-cream border border-border focus:border-gold focus:ring-1 focus:ring-gold rounded-xl px-4 py-3 text-sm font-poppins outline-none transition-all appearance-none cursor-pointer"
                  >
                    <option value="" disabled>
                      {field.placeholder ?? `Select ${field.label}`}
                    </option>
                    {field.options?.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={field.type}
                    value={value}
                    placeholder={field.placeholder}
                    required={field.required}
                    onChange={(e) => handleChange(field.name, e.target.value)}
                    className="w-full bg-cream border border-border focus:border-gold focus:ring-1 focus:ring-gold rounded-xl px-4 py-3 text-sm font-poppins outline-none transition-all"
                  />
                )}
              </div>
            );
          })}
        </div>

        <div className="flex justify-end pt-2">
          <Button type="submit" variant="gold" size="lg" className="w-full md:w-auto font-poppins font-semibold">
            {submitLabel}
          </Button>
        </div>
      </form>

      {result && (
        <div className="pt-6 border-t border-border mt-8 animate-fade-in">
          {result}
        </div>
      )}
    </div>
  );
}
