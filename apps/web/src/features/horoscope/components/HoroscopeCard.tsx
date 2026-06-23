"use client";

import { Heart, Briefcase, Activity, Wallet, Sparkles } from "lucide-react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { zodiacEmojis } from "@/lib/data/zodiac";
import type { HoroscopePeriod, HoroscopeReading } from "@/types/horoscope";
import { HOROSCOPE_PERIODS } from "@/types/horoscope";

interface HoroscopeCardProps {
  sign: string;
  period: HoroscopePeriod;
  data?: HoroscopeReading | null;
  loading?: boolean;
}

const sections = [
  { key: "love" as const, label: "Love", icon: Heart },
  { key: "career" as const, label: "Career", icon: Briefcase },
  { key: "health" as const, label: "Health", icon: Activity },
  { key: "finance" as const, label: "Finance", icon: Wallet },
];

function HoroscopeCardSkeleton() {
  return (
    <Card className="rounded-card-lg shadow-card border-border">
      <CardHeader>
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64 mt-2" />
      </CardHeader>
      <CardContent className="space-y-6">
        {sections.map((section) => (
          <div key={section.key} className="space-y-2">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        ))}
      </CardContent>
      <CardFooter>
        <Skeleton className="h-10 w-full" />
      </CardFooter>
    </Card>
  );
}

function HoroscopeEmptyState({ sign, period }: { sign: string; period: HoroscopePeriod }) {
  const periodLabel = HOROSCOPE_PERIODS.find((p) => p.value === period)?.label ?? period;

  return (
    <Card className="rounded-card-lg shadow-card border-border text-center py-12">
      <CardContent>
        <Sparkles className="w-10 h-10 text-gold mx-auto mb-4" />
        <h3 className="font-heading text-xl font-bold text-dark mb-2">
          The stars are still aligning
        </h3>
        <p className="text-paragraph text-sm max-w-md mx-auto mb-6">
          We could not find a reading for {sign} ({periodLabel}). Choose another
          sign or period to discover what the planets say about your path.
        </p>
        <Badge variant="outline" className="border-gold text-navy">
          Try selecting Today or Weekly
        </Badge>
      </CardContent>
    </Card>
  );
}

export default function HoroscopeCard({
  sign,
  period,
  data,
  loading = false,
}: HoroscopeCardProps) {
  if (loading) return <HoroscopeCardSkeleton />;
  if (!data) return <HoroscopeEmptyState sign={sign} period={period} />;

  const periodLabel = HOROSCOPE_PERIODS.find((p) => p.value === period)?.label ?? period;

  return (
    <Card className="rounded-card-lg shadow-card border-border overflow-hidden">
      <CardHeader className="border-b border-border bg-card">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{zodiacEmojis[sign]}</span>
          <div>
            <CardTitle className="font-heading text-2xl font-bold text-dark">
              {sign}
            </CardTitle>
            <p className="text-muted text-sm font-body mt-0.5">
              {periodLabel} — What the planets say about your cosmic path
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-6 space-y-6">
        {sections.map(({ key, label, icon: Icon }) => (
          <div key={key}>
            <div className="flex items-center gap-2 mb-2">
              <Icon className="w-4 h-4 text-gold" />
              <h3 className="font-heading text-base font-semibold text-dark">
                {label}
              </h3>
            </div>
            <p className="text-paragraph text-sm leading-relaxed">{data[key]}</p>
          </div>
        ))}
      </CardContent>

      <CardFooter className="border-t border-border bg-cream/50 flex flex-wrap gap-3 justify-center sm:justify-start py-4">
        <Badge className="bg-navy text-white hover:bg-navy-hover">
          Lucky Number: {data.luckyNumber}
        </Badge>
        <Badge variant="outline" className="border-gold text-navy">
          Lucky Color: {data.luckyColor}
        </Badge>
        <Badge variant="secondary" className="bg-gold/15 text-navy">
          Compatible: {data.compatibleSign} {zodiacEmojis[data.compatibleSign]}
        </Badge>
      </CardFooter>
    </Card>
  );
}
