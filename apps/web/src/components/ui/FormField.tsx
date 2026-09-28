"use client";

import React, { useState, useEffect } from "react";
import { cn } from "@/lib/cn";
import { fetchPlaces } from "@/lib/api/ephemeris";

interface FormFieldProps {
  label: string;
  name: string;
  type?: "text" | "tel" | "email" | "password" | "date" | "time" | "select" | "places-autocomplete" | "textarea";
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  placeholder?: string;
  error?: string | null;
  options?: any[]; // for select (string or {value, label})
  className?: string;
  inputClassName?: string;
  min?: string;
  max?: string;
  /** Show the error even if the field hasn't been touched (e.g. after a submit attempt). */
  forceShowError?: boolean;
  maxLength?: number;
  rows?: number;
}

export default function FormField({
  label,
  name,
  type = "text",
  value,
  onChange,
  required = false,
  placeholder,
  error,
  options = [],
  className,
  inputClassName,
  min,
  max,
  forceShowError = false,
  maxLength,
  rows = 4,
}: FormFieldProps) {
  const [touched, setTouched] = useState(false);
  const [suggestions, setSuggestions] = useState<{ name: string }[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  const showError = (touched || forceShowError) && error;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleAutocompleteChange = async (val: string) => {
    onChange(val);
    setTouched(true);
    if (val.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setShowSuggestions(true);
    try {
      const results = await fetchPlaces(val);
      setSuggestions(results);
    } catch (err) {
      setSuggestions([]);
    }
  };

  const selectSuggestion = (suggestionName: string) => {
    onChange(suggestionName);
    setShowSuggestions(false);
  };

  const inputStyles = cn(
    "w-full px-4 py-3 bg-white shadow-sm border rounded-xl text-sm font-poppins outline-none transition-all",
    showError
      ? "border-rose-500 focus:ring-1 focus:ring-rose-500"
      : "border-border focus:border-gold focus:ring-1 focus:ring-gold",
    inputClassName
  );

  return (
    <div className={cn("space-y-1.5", className)} data-field={name}>
      <label className="block text-xs font-semibold text-dark font-poppins uppercase tracking-wider">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>

      {type === "select" ? (
        <select
          name={name}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setTouched(true);
          }}
          onBlur={() => setTouched(true)}
          required={required}
          aria-invalid={showError ? true : undefined}
          className={cn(inputStyles, "appearance-none cursor-pointer")}
        >
          <option value="" disabled>
            {placeholder || `Select ${label}`}
          </option>
          {options.map((opt) => {
            const val = typeof opt === "string" ? opt : opt.value;
            const label = typeof opt === "string" ? opt : opt.label;
            return (
              <option key={val} value={val}>
                {label}
              </option>
            );
          })}
        </select>
      ) : type === "places-autocomplete" ? (
        <div className="relative" ref={dropdownRef}>
          <input
            type="text"
            value={value}
            onChange={(e) => handleAutocompleteChange(e.target.value)}
            onFocus={() => {
              if (suggestions.length > 0) setShowSuggestions(true);
            }}
            onBlur={() => setTouched(true)}
            placeholder={placeholder || "City, Country"}
            required={required}
            className={inputStyles}
          />
          {showSuggestions && value.length >= 2 && (
            <div className="absolute z-50 w-full mt-1 bg-card border border-border shadow-card rounded-xl max-h-60 overflow-y-auto">
              {suggestions.length > 0 ? (
                suggestions.map((s, idx) => (
                  <div
                    key={idx}
                    onClick={() => selectSuggestion(s.name)}
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
      ) : type === "tel" ? (
        <div className="flex">
          {/* India numbers only — the booking API requires exactly 10 digits. */}
          <span
            className={cn(
              "px-3 py-3 bg-white shadow-sm border border-r-0 border-border rounded-l-xl text-sm font-poppins text-muted select-none",
              { "border-rose-500": showError }
            )}
            aria-hidden="true"
          >
            +91
          </span>
          <input
            type="tel"
            name={name}
            inputMode="numeric"
            autoComplete="tel-national"
            aria-invalid={showError ? true : undefined}
            value={value}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, ""); // strip non-digits automatically
              onChange(val);
              setTouched(true);
            }}
            onBlur={() => setTouched(true)}
            placeholder={placeholder || "10-digit mobile number"}
            required={required}
            className={cn(inputStyles, "rounded-l-none")}
            maxLength={10}
          />
        </div>
      ) : type === "textarea" ? (
        <textarea
          name={name}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setTouched(true);
          }}
          onBlur={() => setTouched(true)}
          placeholder={placeholder}
          required={required}
          rows={rows}
          aria-invalid={showError ? true : undefined}
          className={cn(inputStyles, "resize-y min-h-[96px]")}
          {...(maxLength ? { maxLength } : {})}
        />
      ) : type === "time" ? (
        <div className="flex gap-2">
          <select
            className={cn(inputStyles, "flex-1 px-2 cursor-pointer")}
            value={value ? (parseInt(value.split(":")[0]) % 12 || 12).toString() : ""}
            onChange={(e) => {
              const h = parseInt(e.target.value);
              const ampm = value && parseInt(value.split(":")[0]) >= 12 ? "PM" : "AM";
              const newH = ampm === "PM" ? (h === 12 ? 12 : h + 12) : (h === 12 ? 0 : h);
              const m = value ? value.split(":")[1] : "00";
              onChange(`${newH.toString().padStart(2, "0")}:${m}`);
              setTouched(true);
            }}
          >
            <option value="" disabled>HH</option>
            {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
              <option key={h} value={h.toString()}>
                {h.toString().padStart(2, "0")}
              </option>
            ))}
          </select>
          <span className="self-center font-bold text-muted">:</span>
          <select
            className={cn(inputStyles, "flex-1 px-2 cursor-pointer")}
            value={value ? value.split(":")[1] : ""}
            onChange={(e) => {
              const m = e.target.value;
              const h = value ? value.split(":")[0] : "12";
              onChange(`${h}:${m}`);
              setTouched(true);
            }}
          >
            <option value="" disabled>MM</option>
            {Array.from({ length: 60 }, (_, i) => i).map((m) => (
              <option key={m} value={m.toString().padStart(2, "0")}>
                {m.toString().padStart(2, "0")}
              </option>
            ))}
          </select>
          <select
            className={cn(inputStyles, "flex-1 px-2 cursor-pointer")}
            value={value && parseInt(value.split(":")[0]) >= 12 ? "PM" : "AM"}
            onChange={(e) => {
              const ampm = e.target.value;
              let h = parseInt(value ? value.split(":")[0] : "12");
              const m = value ? value.split(":")[1] : "00";
              if (ampm === "PM" && h < 12) h += 12;
              if (ampm === "AM" && h >= 12) h -= 12;
              onChange(`${h.toString().padStart(2, "0")}:${m}`);
              setTouched(true);
            }}
          >
            <option value="AM">AM</option>
            <option value="PM">PM</option>
          </select>
        </div>
      ) : (
        <input
          type={type}
          name={name}
          aria-invalid={showError ? true : undefined}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setTouched(true);
          }}
          onBlur={() => setTouched(true)}
          placeholder={placeholder}
          required={required}
          className={inputStyles}
          {...(min ? { min } : {})}
          {...(max ? { max } : {})}
          {...(maxLength ? { maxLength } : {})}
        />
      )}

      {showError && <p className="text-xs text-rose-500 font-medium mt-1">{error}</p>}
    </div>
  );
}
