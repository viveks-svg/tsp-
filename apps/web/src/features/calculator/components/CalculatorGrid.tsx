"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/cn";
import { calculators } from "@/lib/data/calculators";
import {
  CALCULATOR_CATEGORY_LABELS,
  type CalculatorCategory,
} from "@/types/calculator";

const categories: (CalculatorCategory | "all")[] = [
  "all",
  "love",
  "numerology",
  "vedic",
  "timing",
];

export default function CalculatorGrid() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<CalculatorCategory | "all">("all");

  const filtered = useMemo(() => {
    return calculators.filter((calc) => {
      const matchesSearch =
        !search.trim() ||
        calc.title.toLowerCase().includes(search.toLowerCase()) ||
        calc.description.toLowerCase().includes(search.toLowerCase());
      const matchesCategory =
        category === "all" || calc.category === category;
      return matchesSearch && matchesCategory;
    });
  }, [search, category]);

  return (
    <div className="space-y-6">
      <div className="relative max-w-md mx-auto">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
        <Input
          type="search"
          placeholder="Search calculators..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 rounded-input h-11 bg-card"
        />
      </div>

      <div className="flex flex-wrap justify-center gap-2">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setCategory(cat)}
            className={cn(
              "px-4 py-2 rounded-button text-xs font-poppins font-medium transition-colors border",
              category === cat
                ? "bg-navy text-white border-navy"
                : "bg-card text-paragraph border-border hover:border-navy/30"
            )}
          >
            {cat === "all" ? "All" : CALCULATOR_CATEGORY_LABELS[cat]}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="text-center text-muted text-sm py-12">
          No calculators match your search. Try a different term or category.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((calc) => (
            <motion.div key={calc.id} whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
              <Link href={calc.href}>
                <Card className="rounded-card shadow-card border-border card-hover h-full group">
                  <CardContent className="pt-6 pb-6">
                    <span className="text-2xl mb-3 block">{calc.icon}</span>
                    <h3 className="font-heading text-base font-semibold text-dark group-hover:text-navy transition-colors">
                      {calc.title}
                    </h3>
                    <p className="text-paragraph text-xs mt-2 leading-relaxed">
                      {calc.description}
                    </p>
                    <span className="inline-block mt-3 text-[10px] font-poppins font-medium text-gold uppercase tracking-wide">
                      {CALCULATOR_CATEGORY_LABELS[calc.category]}
                    </span>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
