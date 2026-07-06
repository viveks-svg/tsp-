"use client";

import { useState, useEffect, useRef } from "react";
import type { FormField as FormFieldType } from "@/types/free-services";
import type { ReactNode } from "react";
import Button from "@/components/ui/Button";
import FormField from "@/components/ui/FormField";

interface FreeServicePageShellProps {
  title: string;
  description: string;
  fields: FormFieldType[];
  submitLabel?: string;
  onSubmit: (values: Record<string, string>) => ReactNode | Promise<ReactNode>;
}

import { filterNameInput, filterLocationInput } from "@/lib/validations/validators";

export default function FreeServicePageShell({
  title,
  description,
  fields,
  submitLabel = "Calculate",
  onSubmit,
}: FreeServicePageShellProps) {
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [result, setResult] = useState<ReactNode | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (name: string, value: string) => {
    let finalValue = value;
    if (name.toLowerCase().includes("name")) {
      finalValue = filterNameInput(value);
    } else if (name.toLowerCase().includes("place")) {
      finalValue = filterLocationInput(value);
    }
    
    setFormValues((prev) => ({ ...prev, [name]: finalValue }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors: Record<string, string> = {};
    for (const field of fields) {
      if (field.required && !formValues[field.name]) {
        newErrors[field.name] = `${field.label} is required`;
      }
      if (field.name.toLowerCase().includes("name") && formValues[field.name]) {
        if (!/^[a-zA-Z\s]+$/.test(formValues[field.name])) {
          newErrors[field.name] = "Name must contain only letters and spaces.";
        }
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setErrors({});
    setIsSubmitting(true);
    try {
      const calculatedResult = await onSubmit(formValues);
      setResult(calculatedResult);
    } catch (err: any) {
      setErrors({ submit: err.message || "Something went wrong. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
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
              <div key={field.name} className="space-y-2 relative">
                {field.type === "button-group" ? (
                  <>
                    <label className="block text-xs font-semibold text-dark font-poppins uppercase tracking-wider">
                      {field.label} {field.required && <span className="text-rose-500">*</span>}
                    </label>
                    <div className="flex items-center gap-3">
                      {field.options?.map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => handleChange(field.name, option)}
                          className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-full border transition-all text-sm font-poppins ${
                            value === option
                              ? "border-gold bg-gold/10 text-gold font-semibold shadow-sm"
                              : "border-border bg-card text-muted-foreground hover:border-gold/50 hover:bg-gold/5"
                          }`}
                        >
                          {option === "Male" && <span className="text-lg leading-none">♂</span>}
                          {option === "Female" && <span className="text-lg leading-none">♀</span>}
                          {option === "Other" && <span className="text-lg leading-none">⚧</span>}
                          {option}
                        </button>
                      ))}
                    </div>
                    {errors[field.name] && <p className="text-xs text-rose-500 font-medium">{errors[field.name]}</p>}
                  </>
                ) : (
                  <FormField
                    label={field.label}
                    name={field.name}
                    type={field.type as any}
                    value={value}
                    onChange={(val) => handleChange(field.name, val)}
                    required={field.required}
                    placeholder={field.placeholder}
                    options={field.options}
                    error={errors[field.name]}
                    {...(field.type === "date" ? { max: new Date().toISOString().split("T")[0] } : {})}
                  />
                )}
              </div>
            );
          })}
        </div>

        <div className="flex flex-col items-end pt-2 gap-2">
          {errors.submit && <p className="text-sm font-semibold text-rose-500">{errors.submit}</p>}
          <Button type="submit" variant="gold" size="lg" className="w-full md:w-auto font-poppins font-semibold" disabled={isSubmitting}>
            {isSubmitting ? "Calculating..." : submitLabel}
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
