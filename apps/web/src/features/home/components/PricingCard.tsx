import { cn } from "@/lib/cn";
import { Sunrise, ArrowRight, FileText, Briefcase, Calendar, MessageSquare, TrendingUp, BookOpen, Compass, Lock, Shield, Gem, Zap } from "lucide-react";

interface PricingCardProps {
  name: string;
  subtitle: string;
  description: string;
  price: string;
  features: string[];
  variant: "default" | "highlighted" | "dark";
  cta: string;
  onBook?: () => void;
}

// Function to map feature names to specific premium icons
function getFeatureIcon(featureName: string) {
  const lower = featureName.toLowerCase();
  if (lower.includes("kundli") || lower.includes("blueprint")) return FileText;
  if (lower.includes("career") || lower.includes("legacy")) return Briefcase;
  if (lower.includes("timing") || lower.includes("cycle")) return Calendar;
  if (lower.includes("consultation") || lower.includes("forecast") || lower.includes("reading")) return MessageSquare;
  if (lower.includes("partnership") || lower.includes("business")) return TrendingUp;
  if (lower.includes("horoscope")) return BookOpen;
  if (lower.includes("protection")) return Lock;
  if (lower.includes("wealth") || lower.includes("opportunity")) return Compass;
  if (lower.includes("shield")) return Shield;
  if (lower.includes("annual") || lower.includes("gem")) return Gem;
  return Zap;
}

// Custom astrological ornament divider
const CustomDivider = () => (
  <div className="w-full flex items-center justify-center my-6 relative">
    <div className="w-full h-[1.5px] bg-[#E5E3DD]" />
    <div className="absolute flex items-center gap-2.5 px-3 bg-white">
      <div className="w-1.5 h-1.5 bg-[#050B5C] rotate-45" />
      <div className="w-2.5 h-2.5 rounded-full border-[1.5px] border-[#050B5C] bg-white flex items-center justify-center">
        <div className="w-1 h-1 rounded-full bg-[#050B5C]" />
      </div>
      <div className="w-1.5 h-1.5 bg-[#050B5C] rotate-45" />
    </div>
  </div>
);

export default function PricingCard({
  name,
  subtitle,
  description,
  price,
  features,
  variant,
  cta,
  onBook,
}: PricingCardProps) {
  return (
    <div
      className={cn(
        "relative rounded-[20px] p-8 flex flex-col bg-white border border-[#E9E6E0] shadow-sm min-h-[500px]",
        "transition-all duration-300 ease-out hover:shadow-md hover:-translate-y-1.5"
      )}
    >
      {/* Top Sunrise Ornament Badge */}
      <div className="absolute -top-6 left-1/2 -translate-x-1/2">
        <div className="w-12 h-12 rounded-full bg-white border border-[#E9E6E0] shadow-sm flex items-center justify-center z-10">
          <Sunrise className="w-5 h-5 text-[#050B5C]" />
        </div>
      </div>

      {/* Plan Name - Trajan Pro */}
      <h3 className="font-trajan text-2xl tracking-[0.2em] text-[#0F172A] text-center uppercase mt-6 mb-1">
        {name}
      </h3>

      {/* Subtitle - Orange Accent uppercase Inter */}
      <p className="font-inter text-[10px] font-bold tracking-[0.15em] text-[#E88C30] text-center uppercase mb-3">
        {subtitle}
      </p>

      {/* Description */}
      <p className="font-inter text-[11px] font-normal text-[#64748B] text-center leading-relaxed max-w-[220px] mx-auto mb-2">
        {description}
      </p>

      {/* Ornament Divider */}
      <CustomDivider />

      {/* Features List */}
      <ul className="space-y-4 mb-6 flex-1">
        {features.map((feature) => {
          const FeatureIcon = getFeatureIcon(feature);
          return (
            <li key={feature} className="flex items-center gap-3">
              {/* Dark blue circular badge with white outline icon */}
              <div className="w-6 h-6 rounded-full bg-[#050B5C] flex items-center justify-center shrink-0">
                <FeatureIcon className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="font-inter text-xs text-[#1E293B] font-medium leading-none">
                {feature}
              </span>
            </li>
          );
        })}
      </ul>

      {/* Ornament Divider */}
      <CustomDivider />

      {/* Price - Playfair Display */}
      <div className="text-center mb-6">
        <span className="font-playfair text-2xl font-bold text-[#050B5C]">
          {price}
        </span>
      </div>

      {/* CTA Button */}
      <button
        onClick={onBook}
        className={cn(
          "w-full py-3 px-4 rounded-[6px] border font-poppins text-[10px] font-semibold tracking-[0.1em] uppercase flex items-center justify-center gap-2 transition-all duration-300",
          variant === "dark"
            ? "bg-[#050B5C] border-[#050B5C] text-white hover:bg-opacity-90"
            : "bg-white border-[#050B5C] text-[#050B5C] hover:bg-[#050B5C] hover:text-white"
        )}
      >
        <span>{cta}</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
