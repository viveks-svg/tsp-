"use client";

import { useState, useEffect, useRef } from "react";
import type { FormField } from "@/types/free-services";
import type { ReactNode } from "react";
import Button from "@/components/ui/Button";
import { fetchPlaces } from "@/lib/api/ephemeris";

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

  // Autocomplete state
  const [suggestions, setSuggestions] = useState<{ name: string }[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleChange = (name: string, value: string) => {
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleAutocompleteChange = async (name: string, value: string) => {
    handleChange(name, value);
    if (value.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsSearching(true);
    setShowSuggestions(true);
    try {
      const results = await fetchPlaces(value);
      setSuggestions(results);
    } catch (err) {
      console.error("Error fetching places:", err);
      setSuggestions([]);
    } finally {
      setIsSearching(false);
    }
  };

  const selectSuggestion = (name: string, suggestionName: string) => {
    handleChange(name, suggestionName);
    setShowSuggestions(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
              <div key={field.name} className="space-y-2 relative" ref={field.type === "places-autocomplete" ? dropdownRef : null}>
                <label className="block text-xs font-semibold text-dark font-poppins uppercase tracking-wider">
                  {field.label} {field.required && <span className="text-rose-500">*</span>}
                </label>

                {field.type === "button-group" ? (
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
                ) : field.type === "select" ? (
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
                ) : field.type === "places-autocomplete" ? (
                  <div className="relative">
                    <input
                      type="text"
                      value={value}
                      placeholder={field.placeholder ?? "Search city..."}
                      required={field.required}
                      onChange={(e) => handleAutocompleteChange(field.name, e.target.value)}
                      onFocus={() => {
                        if (suggestions.length > 0) setShowSuggestions(true);
                      }}
                      className="w-full bg-cream border border-border focus:border-gold focus:ring-1 focus:ring-gold rounded-xl px-4 py-3 text-sm font-poppins outline-none transition-all"
                    />
                    {showSuggestions && value.length >= 2 && (
                      <div className="absolute z-50 w-full mt-1 bg-card border border-border shadow-card rounded-xl max-h-60 overflow-y-auto">
                        {isSearching ? (
                          <div className="p-3 text-sm text-muted text-center animate-pulse">Searching...</div>
                        ) : suggestions.length > 0 ? (
                          suggestions.map((s, idx) => (
                            <div
                              key={idx}
                              onClick={() => selectSuggestion(field.name, s.name)}
                              className="px-4 py-3 hover:bg-cream-dark cursor-pointer text-sm font-poppins border-b border-border/50 last:border-0 transition-colors"
                            >
                              {s.name}
                            </div>
                          ))
                        ) : (
                          <div className="p-3 text-sm text-muted text-center">No places found</div>
                        )}
                      </div>
                    )}
                  </div>
                ) : field.type === "date" ? (
                  <div className="relative">
                    <input
                      type="date"
                      value={value}
                      required={field.required}
                      onChange={(e) => handleChange(field.name, e.target.value)}
                      className="w-full bg-cream border border-border focus:border-gold focus:ring-1 focus:ring-gold rounded-xl px-4 py-3 text-sm font-poppins outline-none transition-all appearance-none"
                      style={{ colorScheme: "light" }}
                    />
                  </div>
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
