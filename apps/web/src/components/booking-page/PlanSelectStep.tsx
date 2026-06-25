"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Sparkles, Crown, Gem } from "lucide-react";
import { cn } from "@/lib/cn";
import type { ServiceDefinition, ServicePlan } from "@/lib/data/service-catalog";

const PLAN_ACCENT_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  rising: Sparkles,
  celestial: Crown,
  zenith: Gem,
};

interface Props {
  service: ServiceDefinition;
  selectedPlanSlug: string | null;
  onSelect: (plan: ServicePlan) => void;
  onBack: () => void;
}

export default function PlanSelectStep({ service, selectedPlanSlug, onSelect, onBack }: Props) {
  return (
    <div className="p-6 sm:p-8">
      <button
        onClick={onBack}
        className="text-sm text-[#8B6914] hover:text-[#C99411] font-medium mb-6 flex items-center gap-1 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Change Service
      </button>

      <div className="mb-8">
        <h2 className="font-heading text-2xl sm:text-3xl font-bold text-[#1E1A16]">
          Choose Your Plan
        </h2>
        <p className="text-[#6B5F52] text-sm mt-2">
          Select the package that best fits your needs for <span className="font-semibold text-[#1E1A16]">{service.name}</span>.
        </p>
      </div>

      <div className={cn(
        "grid gap-6 max-w-5xl",
        service.plans.length === 1 ? "grid-cols-1 max-w-lg" :
        service.plans.length === 2 ? "grid-cols-1 md:grid-cols-2" :
        "grid-cols-1 md:grid-cols-3"
      )}>
        {service.plans.map((plan, index) => {
          const isSelected = selectedPlanSlug === plan.slug;
          const isFeatured = plan.variant === "featured";
          const isDark = plan.variant === "dark";
          const isLight = plan.variant === "light";
          const AccentIcon = PLAN_ACCENT_ICONS[plan.slug];

          return (
            <motion.button
              key={plan.slug}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.4 }}
              onClick={() => onSelect(plan)}
              className={cn(
                "relative rounded-2xl p-6 text-left transition-all duration-300 border-2",
                isLight && !isSelected && "bg-white border-[#EFEBE1] hover:border-[#C8A04A]/30",
                isFeatured && !isSelected && "bg-[#1E1A16] text-white border-[#C8A04A]/30 hover:border-[#C8A04A]",
                isDark && !isSelected && "bg-[#0A0A0A] text-white border-[#C8A04A]/20 hover:border-[#C8A04A]/50",
                isSelected && "border-[#C8A04A] ring-2 ring-[#C8A04A]/20 shadow-lg",
                isSelected && isLight && "bg-[#C8A04A]/5",
                isSelected && (isFeatured || isDark) && "bg-[#1E1A16]",
              )}
            >
              {/* Featured Badge */}
              {isFeatured && service.plans.length > 1 && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#C8A04A] text-[#1E1A16] px-3 py-0.5 rounded-full text-[10px] font-bold tracking-wider whitespace-nowrap">
                  ✦ MOST POPULAR
                </span>
              )}

              {/* Icon */}
              {AccentIcon && (
                <AccentIcon
                  className={cn(
                    "w-5 h-5 mb-2",
                    isLight ? "text-[#8B6914]" : "text-[#C8A04A]"
                  )}
                />
              )}

              {/* Plan Name */}
              <span
                className={cn(
                  "block font-poppins uppercase tracking-[0.15em] text-sm font-semibold",
                  isLight ? "text-[#1E1A16]" : "text-[#C8A04A]"
                )}
              >
                {plan.name}
              </span>

              {/* Tagline */}
              <p
                className={cn(
                  "text-xs mt-1 italic",
                  isLight ? "text-[#6B5F52]" : "text-white/50"
                )}
              >
                {plan.tagline}
              </p>

              {/* Price */}
              <div className="mt-3 mb-4">
                <span
                  className={cn(
                    "font-heading font-bold text-3xl",
                    isLight ? "text-[#1E1A16]" : "text-white"
                  )}
                >
                  {plan.priceLabel}
                </span>
              </div>

              {/* Features */}
              <ul className="space-y-2 mb-4">
                {plan.features.slice(0, 5).map((feat) => (
                  <li key={feat} className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#C8A04A] shrink-0 mt-0.5" />
                    <span
                      className={cn(
                        "text-xs",
                        isLight ? "text-[#6B5F52]" : "text-white/60"
                      )}
                    >
                      {feat}
                    </span>
                  </li>
                ))}
                {plan.features.length > 5 && (
                  <li className={cn("text-xs font-medium pl-5.5", isLight ? "text-[#8B6914]" : "text-[#C8A04A]")}>
                    +{plan.features.length - 5} more
                  </li>
                )}
              </ul>

              {/* Selection indicator */}
              <div className={cn(
                "w-full py-2 rounded-full text-center text-sm font-semibold transition-all",
                isSelected
                  ? "bg-[#C8A04A] text-white"
                  : isLight
                    ? "bg-[#F7F4EE] text-[#8B6914]"
                    : "bg-white/10 text-white/70"
              )}>
                {isSelected ? '✓ Selected' : 'Select Plan'}
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
