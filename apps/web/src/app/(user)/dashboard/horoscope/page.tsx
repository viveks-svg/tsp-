"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ROUTES } from "@/lib/constants/routes";
import { apiClient } from "@/lib/http/client";
import { ENDPOINTS } from "@/lib/constants/http/endpoints";
import type { HoroscopeReading } from "@/types/horoscope";
import HoroscopeCard from "@/features/horoscope/components/HoroscopeCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles } from "lucide-react";

export default function DashboardHoroscopePage() {
  const [reading, setReading] = useState<HoroscopeReading | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsKundali, setNeedsKundali] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchPersonalized = async () => {
      try {
        const data = await apiClient.get<HoroscopeReading>(
          ENDPOINTS.HOROSCOPE.PERSONALIZED
        );
        if (isMounted) {
          setReading(data);
        }
      } catch (error: any) {
        if (isMounted) {
          if (error.message?.includes("Kundali")) {
            setNeedsKundali(true);
          }
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchPersonalized();
    return () => { isMounted = false; };
  }, []);

  return (
    <section className="min-h-screen py-20 bg-cream">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="font-heading text-3xl font-bold text-dark mb-4">
            Your Personal Horoscope
          </h1>
          <p className="text-paragraph text-sm leading-relaxed max-w-md mx-auto">
            Based on your exact natal Moon sign.
          </p>
        </div>

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-64 w-full rounded-2xl" />
          </div>
        ) : needsKundali ? (
          <div className="text-center bg-white rounded-2xl p-8 border border-border shadow-card">
            <Sparkles className="w-10 h-10 text-gold mx-auto mb-4" />
            <h3 className="font-heading text-xl font-bold text-dark mb-2">
              Generate Your Kundali First
            </h3>
            <p className="text-paragraph text-sm mb-6">
              To provide personalized horoscopes based on your natal Moon sign, we need your birth chart details.
            </p>
            <Link
              href={ROUTES.KUNDLI}
              className="inline-flex items-center justify-center bg-navy text-white px-6 py-3 rounded-button text-sm font-semibold hover:bg-navy-hover transition-colors font-poppins"
            >
              Generate Kundali
            </Link>
          </div>
        ) : reading ? (
          <HoroscopeCard sign={reading.sign.charAt(0).toUpperCase() + reading.sign.slice(1).toLowerCase()} period="DAILY" data={reading} />
        ) : (
          <div className="text-center bg-white rounded-2xl p-8 border border-border shadow-card">
            <p className="text-paragraph text-sm mb-6">
              Something went wrong. Could not load your personalized reading.
            </p>
            <Link
              href={ROUTES.HOROSCOPE}
              className="inline-flex items-center justify-center bg-navy text-white px-6 py-3 rounded-button text-sm font-semibold hover:bg-navy-hover transition-colors font-poppins"
            >
              Browse Free Horoscope Hub
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
