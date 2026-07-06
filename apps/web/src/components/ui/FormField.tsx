"use client";

import React, { useState, useEffect } from "react";
import { cn } from "@/lib/cn";
import { fetchPlaces } from "@/lib/api/ephemeris";

interface FormFieldProps {
  label: string;
  name: string;
  type?: "text" | "tel" | "email" | "password" | "date" | "time" | "select" | "places-autocomplete";
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  placeholder?: string;
  error?: string | null;
  options?: string[]; // for select
  className?: string;
  inputClassName?: string;
  min?: string;
  max?: string;
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
}: FormFieldProps) {
  const [touched, setTouched] = useState(false);
  const [suggestions, setSuggestions] = useState<{ name: string }[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  const showError = touched && error;

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
    "w-full px-4 py-3 bg-cream border rounded-xl text-sm font-poppins outline-none transition-all",
    showError
      ? "border-rose-500 focus:ring-1 focus:ring-rose-500"
      : "border-border focus:border-gold focus:ring-1 focus:ring-gold",
    inputClassName
  );

  return (
    <div className={cn("space-y-1.5", className)}>
      <label className="block text-xs font-semibold text-dark font-poppins uppercase tracking-wider">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>

      {type === "select" ? (
        <select
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setTouched(true);
          }}
          onBlur={() => setTouched(true)}
          required={required}
          className={cn(inputStyles, "appearance-none cursor-pointer")}
        >
          <option value="" disabled>
            {placeholder || `Select ${label}`}
          </option>
          {options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
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
          <select
            className={cn(
              "px-3 py-3 bg-cream border border-r-0 border-border rounded-l-xl text-sm font-poppins outline-none appearance-none cursor-pointer focus:border-gold focus:ring-1 focus:ring-gold focus:z-10 bg-no-repeat bg-right",
              { "border-rose-500": showError }
            )}
            style={{ backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%231c253c%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")', backgroundSize: '0.65rem auto', backgroundPosition: 'calc(100% - 0.5rem) center', paddingRight: '1.75rem' }}
          >
            <option value="+91">🇮🇳 +91</option>
            <option value="+1">🇺🇸 +1</option>
            <option value="+44">🇬🇧 +44</option>
            <option value="+61">🇦🇺 +61</option>
            <option value="+971">🇦🇪 +971</option>
          </select>
          <input
            type="tel"
            value={value}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, ""); // strip non-digits automatically
              onChange(val);
              setTouched(true);
            }}
            onBlur={() => setTouched(true)}
            placeholder={placeholder || "10-digit number"}
            required={required}
            className={cn(inputStyles, "rounded-l-none")}
            maxLength={10}
          />
        </div>
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
        />
      )}

      {showError && <p className="text-xs text-rose-500 font-medium mt-1">{error}</p>}
    </div>
  );
}
