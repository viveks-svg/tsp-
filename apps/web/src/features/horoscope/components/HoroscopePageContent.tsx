"use client";

import { useState, useEffect, useTransition } from "react";
import PageWrapper from "@/components/layout/PageWrapper";
import ZodiacPicker from "./ZodiacPicker";
import HoroscopeTabNav from "./HoroscopeTabNav";
import HoroscopeCard from "./HoroscopeCard";
import { apiClient } from "@/lib/http/client";
import { ENDPOINTS } from "@/lib/constants/http/endpoints";
import type { HoroscopePeriod, HoroscopeReading } from "@/types/horoscope";

interface HoroscopePageContentProps {
  initialSign?: string;
  initialPeriod?: HoroscopePeriod;
}

export default function HoroscopePageContent({
  initialSign = "Aries",
  initialPeriod = "DAILY",
}: HoroscopePageContentProps) {
  const [sign, setSign] = useState(initialSign);
  const [period, setPeriod] = useState<HoroscopePeriod>(initialPeriod);
  const [isPending, startTransition] = useTransition();
  const [reading, setReading] = useState<HoroscopeReading | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

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

  useEffect(() => {
    let isMounted = true;
    const fetchReading = async () => {
      setLoading(true);
      try {
        const data = await apiClient.get<HoroscopeReading>(
          ENDPOINTS.HOROSCOPE.GET(sign.toUpperCase(), period)
        );
        if (isMounted) {
          setReading(data);
        }
      } catch (error) {
        console.error("Failed to fetch horoscope:", error);
        if (isMounted) setReading(null);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchReading();
    return () => {
      isMounted = false;
    };
  }, [sign, period]);

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
              loading={isPending || loading}
            />
          </HoroscopeTabNav>
        </div>
      </div>
    </PageWrapper>
  );
}
