import type { Metadata } from "next";
import HoroscopePageContent from "@/features/horoscope/components/HoroscopePageContent";

export const metadata: Metadata = {
  title: "Free Daily Horoscope & Zodiac Readings | Astro Space",
  description: "Check your daily, weekly, monthly, and yearly horoscope readings. Access expert astrological guidance for all zodiac signs instantly.",
};

export default function HoroscopeHubPage() {
  return <HoroscopePageContent />;
}
