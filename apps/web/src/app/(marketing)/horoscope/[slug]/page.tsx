import type { Metadata } from "next";
import { notFound } from "next/navigation";
import HoroscopePageContent from "@/features/horoscope/components/HoroscopePageContent";
import { zodiacSigns } from "@/lib/data/zodiac";
import type { HoroscopePeriod } from "@/types/horoscope";

interface Props {
  params: Promise<{ slug: string }>;
}

const timeframes: Record<string, HoroscopePeriod> = {
  daily: "today",
  weekly: "weekly",
  monthly: "monthly",
  yearly: "this-year",
};

export async function generateStaticParams() {
  const signParams = zodiacSigns.map((sign) => ({
    slug: sign.toLowerCase(),
  }));
  const timeframeParams = Object.keys(timeframes).map((tf) => ({
    slug: tf,
  }));
  return [...signParams, ...timeframeParams];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const timeframePeriod = timeframes[slug];

  if (timeframePeriod) {
    return {
      title: `${slug.charAt(0).toUpperCase() + slug.slice(1)} Horoscope | Astro Space`,
      description: `Read your free ${slug} horoscope report and plan your tasks according to planetary trends.`,
    };
  }

  const sign = slug.charAt(0).toUpperCase() + slug.slice(1);
  if (!zodiacSigns.includes(sign)) {
    return {};
  }

  return {
    title: `${sign} Daily Horoscope — Free Zodiac Reading | Astro Space`,
    description: `Read your free ${sign} daily horoscope report on love, career, health, and finance.`,
  };
}

export default async function HoroscopeSlugPage({ params }: Props) {
  const { slug } = await params;
  const timeframePeriod = timeframes[slug];

  if (timeframePeriod) {
    return <HoroscopePageContent initialPeriod={timeframePeriod} />;
  }

  const sign = slug.charAt(0).toUpperCase() + slug.slice(1);
  if (!zodiacSigns.includes(sign)) {
    notFound();
  }

  return <HoroscopePageContent initialSign={sign} />;
}
