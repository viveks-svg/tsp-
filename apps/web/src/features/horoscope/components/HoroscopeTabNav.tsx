"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/cn";
import { HOROSCOPE_PERIODS, type HoroscopePeriod } from "@/types/horoscope";

interface HoroscopeTabNavProps {
  activePeriod: HoroscopePeriod;
  onPeriodChange: (period: HoroscopePeriod) => void;
  children: React.ReactNode;
}

export default function HoroscopeTabNav({
  activePeriod,
  onPeriodChange,
  children,
}: HoroscopeTabNavProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <Tabs
      value={activePeriod}
      onValueChange={(value) => onPeriodChange(value as HoroscopePeriod)}
      className="w-full"
    >
      <div className="overflow-x-auto pb-2 -mx-1 px-1">
        <TabsList
          variant="line"
          className={cn(
            "w-max min-w-full justify-start gap-1 bg-transparent h-auto flex-wrap",
            "border-b border-border rounded-none p-0"
          )}
        >
          {HOROSCOPE_PERIODS.map((period) => (
            <TabsTrigger
              key={period.value}
              value={period.value}
              className={cn(
                "font-poppins text-xs sm:text-sm px-3 sm:px-4 py-2 rounded-none",
                "data-active:text-navy data-active:after:bg-gold data-active:after:h-0.5",
                "hover:text-navy"
              )}
            >
              {period.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activePeriod}
          initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={prefersReducedMotion ? undefined : { opacity: 0, y: -8 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="mt-6"
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </Tabs>
  );
}
