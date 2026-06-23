"use client";

import { useState, useTransition } from "react";
import PageWrapper from "@/components/layout/PageWrapper";
import ZodiacPicker from "./ZodiacPicker";
import HoroscopeTabNav from "./HoroscopeTabNav";
import HoroscopeCard from "./HoroscopeCard";
import { getHoroscopeReading } from "@/lib/data/horoscope";
import type { HoroscopePeriod } from "@/types/horoscope";

interface HoroscopePageContentProps {
  initialSign?: string;
  initialPeriod?: HoroscopePeriod;
}

export default function HoroscopePageContent({
  initialSign = "Aries",
  initialPeriod = "today",
}: HoroscopePageContentProps) {
  const [sign, setSign] = useState(initialSign);
  const [period, setPeriod] = useState<HoroscopePeriod>(initialPeriod);
  const [isPending, startTransition] = useTransition();

  const handleSignChange = (newSign: string) => {
    startTransition(() => {
      setSign(newSign);
    });
  };

  const handlePeriodChange = (newPeriod: HoroscopePeriod) => {
    startTransition(() => {
      setPeriod(newPeriod);
    });
  };

  const reading = getHoroscopeReading(sign, period);

  return (
    <PageWrapper
      title="Cosmic Horoscope Insights"
      description="Reveal planetary influences on your path. Explore customized daily, weekly, monthly, and yearly reports for all twelve zodiac signs."
    >
      <div className="space-y-8 max-w-4xl mx-auto">
        {/* Zodiac Sign Picker */}
        <ZodiacPicker selectedSign={sign} onSelect={handleSignChange} />

        {/* Tab Navigation for Period selection */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-card">
          <HoroscopeTabNav activePeriod={period} onPeriodChange={handlePeriodChange}>
            <HoroscopeCard
              sign={sign}
              period={period}
              data={reading}
              loading={isPending}
            />
          </HoroscopeTabNav>
        </div>
      </div>
    </PageWrapper>
  );
}
