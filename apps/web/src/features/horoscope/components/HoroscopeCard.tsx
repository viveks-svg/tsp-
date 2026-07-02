"use client";

import { useState } from "react";
import { Heart, Briefcase, Activity, Wallet, Sparkles, ChevronRight, Zap, Sun } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { zodiacEmojis, zodiacSigns } from "@/lib/data/zodiac";
import type { HoroscopePeriod, HoroscopeReading } from "@/types/horoscope";
import { HOROSCOPE_PERIODS } from "@/types/horoscope";

interface HoroscopeCardProps {
  sign: string;
  period: HoroscopePeriod;
  data?: HoroscopeReading | null;
  loading?: boolean;
}

// Pseudo-random generator for stable daily scores
function getDeterministicScore(sign: string, dateStr: string, category: string): number {
  let hash = 0;
  const str = `${sign}-${dateStr}-${category}`;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return 55 + (Math.abs(hash) % 41); // Score between 55 and 95
}

function getCompatibilityScore(sign1: string, sign2: string): number {
  let hash = 0;
  const str = [sign1, sign2].sort().join('-');
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return 40 + (Math.abs(hash) % 55); // Score between 40 and 95
}

function ExpandableReadingCard({ 
  title, 
  text, 
  icon: Icon, 
  colorClasses 
}: { 
  title: string;
  text: string;
  icon: any;
  colorClasses: {
    border: string;
    borderHover: string;
    bg: string;
    text: string;
    shadow: string;
  }
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div 
      className={`bg-white rounded-2xl p-5 border ${colorClasses.border} ${colorClasses.shadow} relative overflow-hidden group ${colorClasses.borderHover} transition-all duration-300 cursor-pointer`}
      onClick={() => setExpanded(!expanded)}
    >
      <div className={`absolute top-0 left-0 w-1 h-full ${colorClasses.bg}`} />
      <div className="flex items-center gap-2 mb-3">
        <Icon className={`w-4 h-4 ${colorClasses.text}`} />
        <h4 className={`text-xs font-bold ${colorClasses.text} tracking-wider uppercase`}>{title}</h4>
      </div>
      
      {expanded ? (
        <div className="space-y-3 mb-4 animate-in fade-in slide-in-from-top-2 duration-300">
          {text.split('. ').map((sentence: string, i: number) => {
            if (!sentence.trim()) return null;
            return <p key={i} className="text-sm text-gray-600 leading-relaxed">{sentence.trim()}.</p>;
          })}
        </div>
      ) : (
        <p className={`text-sm text-gray-600 leading-relaxed mb-4 line-clamp-2 transition-all`}>
          {text}
        </p>
      )}

      <button className={`text-xs font-semibold ${colorClasses.text} flex items-center gap-1 group-hover:gap-2 transition-all`}>
        {expanded ? 'Read Less' : 'Read More'} <ChevronRight className={`w-3 h-3 ${expanded ? '-rotate-90' : ''} transition-transform`} />
      </button>
    </div>
  );
}

function HoroscopeCardSkeleton() {
  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <Card className="rounded-card-lg shadow-card border-border min-h-[400px] flex flex-col items-center justify-center bg-white relative overflow-hidden">
        {/* Background glow effect for depth */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-100/30 via-white to-white" />

        <div className="text-center relative z-10 flex flex-col items-center">
          <div className="relative w-32 h-32 mb-6">
            <img
              src="/images/cosmic-wheel.png"
              alt="Aligning cosmic energies..."
              className="w-full h-full object-contain animate-spin-clockwise-60 filter drop-shadow-[0_0_15px_rgba(147,51,234,0.15)]"
            />
          </div>
          <h2 className="font-heading text-xl font-bold text-dark mb-1 tracking-wide">
            Consulting the Stars
          </h2>
          <p className="text-sm font-medium tracking-wider uppercase opacity-50 animate-pulse text-purple-700">
            Aligning your cosmic path...
          </p>
        </div>
      </Card>
    </div>
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

  // Format date correctly
  const startDate = new Date(data.periodStartDate);
  const formattedDate = startDate.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const loveScore = getDeterministicScore(sign, data.periodStartDate, 'love');
  const careerScore = getDeterministicScore(sign, data.periodStartDate, 'career');
  const moneyScore = getDeterministicScore(sign, data.periodStartDate, 'money');

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* Main Overall Card */}
      <Card className="rounded-card-lg shadow-card border-border overflow-hidden bg-white">
        <CardHeader className="border-b border-border bg-[#FAF5FF]/30 pb-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#9333EA] text-white text-3xl flex items-center justify-center shadow-lg shadow-purple-500/20 shrink-0">
              {zodiacEmojis[sign]}
            </div>
            <div>
              <CardTitle className="font-heading text-2xl md:text-3xl font-bold text-dark mb-1">
                {sign} Horoscope {periodLabel}
              </CardTitle>
              <div className="flex flex-wrap items-center gap-2 text-xs md:text-sm text-muted font-medium">
                <span>{formattedDate}</span>
                <span>•</span>
                <span className="flex items-center gap-1 text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-100">
                  <Sun className="w-3 h-3" />
                  Mood: <span className="capitalize">{data.moodTag.replace(/-/g, ' ')}</span>
                </span>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          {/* Main Reading */}
          <p className="text-paragraph text-[15px] leading-relaxed mb-8">
            {data.overallText}
          </p>

          {/* Progress Bars */}
          <div className="grid grid-cols-3 gap-6 mb-8">
            <div className="space-y-2">
              <div className="flex justify-between items-center text-[10px] font-bold tracking-wider text-gray-500 uppercase">
                <span>Love</span>
              </div>
              <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-pink-500 rounded-full transition-all duration-1000" style={{ width: `${loveScore}%` }} />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center text-[10px] font-bold tracking-wider text-gray-500 uppercase">
                <span>Career</span>
              </div>
              <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full transition-all duration-1000" style={{ width: `${careerScore}%` }} />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center text-[10px] font-bold tracking-wider text-gray-500 uppercase">
                <span>Money</span>
              </div>
              <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full transition-all duration-1000" style={{ width: `${moneyScore}%` }} />
              </div>
            </div>
          </div>

          {/* Today's Insights */}
          <div>
            <h4 className="text-xs font-bold text-gray-400 tracking-wider uppercase mb-3">Today's Insights</h4>
            <div className="flex flex-wrap items-center gap-3 md:gap-4">
              <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-lg text-sm font-medium text-gray-700">
                <span className="text-gray-400 text-xs uppercase tracking-wider">Mood</span>
                <span className="capitalize">{data.moodTag.replace(/-/g, ' ')}</span>
              </div>
              <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-lg text-sm font-medium text-gray-700">
                <span className="text-gray-400 text-xs uppercase tracking-wider">Lucky Colour</span>
                <div className="flex items-center gap-1.5">
                  <span className="capitalize">{data.luckyColor}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-lg text-sm font-medium text-gray-700">
                <span className="text-gray-400 text-xs uppercase tracking-wider">Lucky Number</span>
                <span>{data.luckyNumber}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Reading Grid */}
      <div>
        <h3 className="font-heading text-xl font-bold text-dark mb-4 px-1">Detailed Reading</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Love Card */}
          <ExpandableReadingCard
            title="Love"
            text={data.loveText}
            icon={Heart}
            colorClasses={{
              border: "border-pink-100",
              borderHover: "hover:border-pink-200",
              bg: "bg-pink-500",
              text: "text-pink-500",
              shadow: "shadow-[0_2px_10px_rgba(236,72,153,0.04)]",
            }}
          />

          {/* Career Card */}
          <ExpandableReadingCard
            title="Career"
            text={data.careerText}
            icon={Briefcase}
            colorClasses={{
              border: "border-blue-100",
              borderHover: "hover:border-blue-200",
              bg: "bg-blue-500",
              text: "text-blue-500",
              shadow: "shadow-[0_2px_10px_rgba(59,130,246,0.04)]",
            }}
          />

          {/* Finance Card */}
          <ExpandableReadingCard
            title="Finance"
            text={data.financeText}
            icon={Wallet}
            colorClasses={{
              border: "border-emerald-100",
              borderHover: "hover:border-emerald-200",
              bg: "bg-emerald-500",
              text: "text-emerald-500",
              shadow: "shadow-[0_2px_10px_rgba(16,185,129,0.04)]",
            }}
          />

          {/* Health Card */}
          <ExpandableReadingCard
            title="Health"
            text={data.healthText}
            icon={Activity}
            colorClasses={{
              border: "border-amber-100",
              borderHover: "hover:border-amber-200",
              bg: "bg-amber-500",
              text: "text-amber-500",
              shadow: "shadow-[0_2px_10px_rgba(245,158,11,0.04)]",
            }}
          />

        </div>
      </div>

      {/* Compatibility Grid */}
      <div className="bg-white rounded-2xl p-6 md:p-8 border border-border shadow-card">
        <h3 className="font-heading text-xl font-bold text-dark mb-1">{sign} Compatibility</h3>
        <p className="text-sm text-gray-500 mb-6">Tap any pair to see how {sign} matches up.</p>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
          {zodiacSigns.map((otherSign) => {
            const matchScore = getCompatibilityScore(sign, otherSign);
            return (
              <div
                key={otherSign}
                className="flex flex-col items-center justify-center py-4 px-2 bg-gray-50 rounded-xl border border-gray-100 hover:border-purple-200 hover:bg-purple-50 transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded bg-purple-100 text-purple-700 flex items-center justify-center text-xs">
                    {zodiacEmojis[sign]}
                  </div>
                  <div className="w-6 h-6 rounded bg-purple-100 text-purple-700 flex items-center justify-center text-xs">
                    {zodiacEmojis[otherSign]}
                  </div>
                </div>
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 group-hover:text-purple-400 transition-colors">
                  {sign.slice(0, 3)} & {otherSign.slice(0, 3)}
                </div>
                <div className="text-lg font-bold text-dark group-hover:text-purple-700 transition-colors">
                  {matchScore}%
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
