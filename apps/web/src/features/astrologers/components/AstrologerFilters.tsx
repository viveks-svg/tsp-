"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/cn";
import {
  astrologerLanguages,
  astrologerSpecialties,
} from "@/lib/data/astrologers";
import type { AstrologerFilters as Filters } from "@/types/astrologer";

interface AstrologerFiltersProps {
  filters: Filters;
  onChange: (filters: Filters) => void;
  className?: string;
}

export default function AstrologerFiltersBar({
  filters,
  onChange,
  className,
}: AstrologerFiltersProps) {
  const update = (partial: Partial<Filters>) => {
    onChange({ ...filters, ...partial });
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
        <Input
          type="search"
          placeholder="Search by name or specialty..."
          value={filters.search}
          onChange={(e) => update({ search: e.target.value })}
          className="pl-9 rounded-input h-11 bg-card border-border font-body"
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Select
          value={filters.language}
          onValueChange={(v) => update({ language: v })}
        >
          <SelectTrigger className="rounded-input h-10 bg-card">
            <SelectValue placeholder="Language" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Languages</SelectItem>
            {astrologerLanguages.map((lang) => (
              <SelectItem key={lang} value={lang}>
                {lang}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.specialty}
          onValueChange={(v) => update({ specialty: v })}
        >
          <SelectTrigger className="rounded-input h-10 bg-card">
            <SelectValue placeholder="Specialty" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Specialties</SelectItem>
            {astrologerSpecialties.map((spec) => (
              <SelectItem key={spec} value={spec}>
                {spec}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={String(filters.minRating)}
          onValueChange={(v) => update({ minRating: Number(v) })}
        >
          <SelectTrigger className="rounded-input h-10 bg-card">
            <SelectValue placeholder="Rating" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0">Any Rating</SelectItem>
            <SelectItem value="4.5">4.5+ Stars</SelectItem>
            <SelectItem value="4.7">4.7+ Stars</SelectItem>
            <SelectItem value="4.8">4.8+ Stars</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={String(filters.maxPrice)}
          onValueChange={(v) => update({ maxPrice: Number(v) })}
        >
          <SelectTrigger className="rounded-input h-10 bg-card">
            <SelectValue placeholder="Price/min" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="50">Any Price</SelectItem>
            <SelectItem value="10">Up to ₹10/min</SelectItem>
            <SelectItem value="15">Up to ₹15/min</SelectItem>
            <SelectItem value="20">Up to ₹20/min</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.sort}
          onValueChange={(v) =>
            update({ sort: v as Filters["sort"] })
          }
        >
          <SelectTrigger className="rounded-input h-10 bg-card">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="popular">Most Popular</SelectItem>
            <SelectItem value="price-low">Price: Low to High</SelectItem>
            <SelectItem value="price-high">Price: High to Low</SelectItem>
            <SelectItem value="rating">Highest Rating</SelectItem>
            <SelectItem value="experience">Most Experience</SelectItem>
          </SelectContent>
        </Select>

        <button
          type="button"
          onClick={() => update({ onlineOnly: !filters.onlineOnly })}
          className={cn(
            "h-10 px-3 rounded-input border text-sm font-poppins font-medium transition-colors",
            filters.onlineOnly
              ? "bg-success/10 border-success text-success"
              : "bg-card border-border text-paragraph hover:border-navy/30"
          )}
        >
          {filters.onlineOnly ? "Online Only ✓" : "Online Only"}
        </button>
      </div>
    </div>
  );
}
