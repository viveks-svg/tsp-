import type { Metadata } from "next";
import { notFound } from "next/navigation";
import HoroscopePageContent from "@/features/horoscope/components/HoroscopePageContent";
import { zodiacSigns } from "@/lib/data/zodiac";
import type { HoroscopePeriod } from "@/types/horoscope";
import { PERIOD_SLUG_MAP } from "@/types/horoscope";

interface Props {
  params: Promise<{ slug: string; period: string }>;
}

export async function generateStaticParams() {
  const paramsList: { slug: string; period: string }[] = [];
  zodiacSigns.forEach((sign) => {
    Object.keys(PERIOD_SLUG_MAP).forEach((tf) => {
      paramsList.push({
        slug: sign.toLowerCase(),
        period: tf,
      });
    });
  });
  return paramsList;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, period } = await params;
  const sign = slug.charAt(0).toUpperCase() + slug.slice(1);
  const mappedPeriod = PERIOD_SLUG_MAP[period];

  if (!zodiacSigns.includes(sign) || !mappedPeriod) {
    return {};
  }

  return {
    title: `${sign} ${period.charAt(0).toUpperCase() + period.slice(1)} Horoscope | Astro Space`,
    description: `Read your free detailed ${sign} ${period} horoscope report. Focus on love, career, health, and finance.`,
  };
}

export default async function HoroscopeSlugPeriodPage({ params }: Props) {
  const { slug, period } = await params;
  const sign = slug.charAt(0).toUpperCase() + slug.slice(1);
  const mappedPeriod = PERIOD_SLUG_MAP[period];

  if (!zodiacSigns.includes(sign) || !mappedPeriod) {
    notFound();
  }

  return <HoroscopePageContent initialSign={sign} initialPeriod={mappedPeriod} />;
}
