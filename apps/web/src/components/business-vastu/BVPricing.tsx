"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { CheckCircle2, Sparkles, Crown, Gem } from "lucide-react";
import { PRICING_PLANS } from "@/lib/data/business-vastu";
import type { BVPricingPlan } from "@/lib/data/business-vastu";
import { cn } from "@/lib/cn";

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0 },
};
const transition = { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const };

const PLAN_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  rising: Sparkles,
  celestial: Crown,
  zenith: Gem,
};

function PricingCard({
  plan,
  index,
}: {
  plan: BVPricingPlan;
  index: number;
}) {
  const router = useRouter();
  const Icon = PLAN_ICONS[plan.slug];

  const isFeatured = plan.variant === "featured";
  const isDark = plan.variant === "dark";
  const isLight = plan.variant === "light";

  return (
    <motion.div
      className={cn(
        "relative rounded-2xl p-8",
        isLight && "bg-white border border-[#071B8D]/15",
        isFeatured &&
          "bg-[#071B8D] text-white ring-2 ring-[#F6A000] shadow-2xl scale-100 lg:scale-[1.03]",
        isDark && "bg-[#0A0A0A] text-white border border-[#F6A000]/20"
      )}
      variants={fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      transition={{ ...transition, delay: index * 0.1 }}
    >
      {/* Featured Badge */}
      {isFeatured && (
        <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#F6A000] text-[#071B8D] px-4 py-1 rounded-full text-xs font-poppins font-bold tracking-wider whitespace-nowrap">
          ✦ MOST POPULAR
        </span>
      )}

      {/* Icon */}
      {Icon && (
        <Icon
          className={cn(
            "w-6 h-6 mb-3",
            isLight ? "text-[#071B8D]" : "text-[#F6A000]"
          )}
        />
      )}

      {/* Plan Name */}
      <span
        className={cn(
          "block font-poppins uppercase tracking-[0.2em] text-sm font-semibold",
          isLight ? "text-[#071B8D]" : "text-[#F6A000]"
        )}
      >
        {plan.name}
      </span>

      {/* Tagline */}
      <p
        className={cn(
          "font-playfair italic text-base mt-1",
          isLight ? "text-gray-500" : "text-white/50"
        )}
      >
        {plan.tagline}
      </p>

      {/* Price */}
      <div className="mt-4 mb-6">
        <span
          className={cn(
            "font-playfair font-bold text-5xl",
            isLight ? "text-[#071B8D]" : "text-white"
          )}
        >
          <span className="text-2xl align-top">₹</span>
          {plan.price.replace("₹", "")}
        </span>
        <span
          className={cn(
            "font-inter text-sm ml-1",
            isLight ? "text-gray-400" : "text-white/40"
          )}
        >
          /audit
        </span>
      </div>

      {/* Features */}
      <ul className="space-y-3 mb-8">
        {plan.features.map((feat) => (
          <li key={feat} className="flex items-start gap-3">
            <CheckCircle2 className="w-4 h-4 text-[#F6A000] shrink-0 mt-0.5" />
            <span
              className={cn(
                "font-inter text-sm",
                isLight ? "text-gray-600" : "text-white/70"
              )}
            >
              {feat}
            </span>
          </li>
        ))}
      </ul>

      {/* CTA Button */}
      <button
        onClick={() =>
          router.push(`/business-vastu/plans/${plan.slug}`)
        }
        className={cn(
          "w-full py-3 rounded-full font-poppins font-semibold transition-all text-sm",
          isLight &&
            "border border-[#071B8D] text-[#071B8D] hover:bg-[#071B8D] hover:text-white",
          isFeatured &&
            "bg-[#F6A000] text-[#071B8D] hover:brightness-110",
          isDark &&
            "border border-[#F6A000] text-[#F6A000] hover:bg-[#F6A000] hover:text-[#071B8D]"
        )}
      >
        {plan.ctaText}
      </button>
    </motion.div>
  );
}

export default function BVPricing() {
  return (
    <section id="pricing" className="bg-[#F7F4EE] py-20 lg:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          className="text-center mb-16"
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          transition={transition}
        >
          <span className="block font-poppins text-[#F6A000] text-xs tracking-[0.25em] uppercase font-semibold mb-4">
            INVESTMENT IN YOUR BUSINESS DESTINY
          </span>
          <h2 className="font-playfair text-3xl sm:text-4xl lg:text-[44px] font-bold text-[#071B8D] leading-tight">
            Choose the Depth
            <br />
            Your Business Deserves
          </h2>
          <p className="font-inter text-base text-gray-500 mt-4 max-w-xl mx-auto">
            All plans include a signed Vastu Report, direct expert access, and
            90-day implementation support.
          </p>
        </motion.div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto items-start">
          {PRICING_PLANS.map((plan, i) => (
            <PricingCard key={plan.slug} plan={plan} index={i} />
          ))}
        </div>

        {/* Trust Footnote */}
        <p className="text-center mt-12 text-gray-400 font-inter text-sm">
          🔒 All consultations are confidential. Vastu Report delivered within 7
          working days.
        </p>
      </div>
    </section>
  );
}
