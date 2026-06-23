

  "use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/cn";
import { zodiacSigns, zodiacEmojis } from "@/lib/data/zodiac";

interface ZodiacPickerProps {
  selectedSign: string;
  onSelect: (sign: string) => void;
}

export default function ZodiacPicker({ selectedSign, onSelect }: ZodiacPickerProps) {
  return (
    <div className="mb-8 lg:mb-10">
      <p className="font-poppins text-xs font-semibold text-muted uppercase tracking-wider mb-4 text-center">
        Select your sign
      </p>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 max-w-3xl mx-auto">
        {zodiacSigns.map((sign) => {
          const active = selectedSign === sign;
          return (
            <motion.button
              key={sign}
              type="button"
              onClick={() => onSelect(sign)}
              whileTap={{ scale: 0.92 }}
              whileHover={{ scale: active ? 1 : 1.04 }}
              className={cn(
                "relative flex flex-col items-center gap-1.5 p-3 rounded-card border transition-all duration-300",
                "bg-card shadow-card",
                active
                  ? "border-gold bg-gold/10 ring-2 ring-gold/30"
                  : "border-border hover:border-gold/40 hover:shadow-card-hover"
              )}
            >
              {active && (
                <motion.span
                  layoutId="zodiac-active-ring"
                  className="absolute inset-0 rounded-card border-2 border-gold pointer-events-none"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <span
                className={cn(
                  "text-2xl leading-none",
                  active ? "scale-110" : ""
                )}
              >
                {zodiacEmojis[sign]}
              </span>
              <span
                className={cn(
                  "font-poppins text-[11px] sm:text-xs font-medium",
                  active ? "text-navy" : "text-paragraph"
                )}
              >
                {sign}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
