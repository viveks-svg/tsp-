"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/cn";
import type { BVPricingPlan, PlanDetail } from "@/lib/data/business-vastu";

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0 },
};
const transition = { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const };

interface PlanHeroProps {
  plan: BVPricingPlan;
  detail: PlanDetail;
}

const BG_MAP: Record<string, string> = {
  light: "bg-gradient-to-br from-[#F7F4EE] via-white to-[#F7F4EE]",
  featured: "bg-gradient-to-br from-[#071B8D] via-[#071B8D]/90 to-[#041B8C]",
  dark: "bg-gradient-to-br from-[#0A0A0A] via-[#0A0A0A] to-[#071B8D]/30",
};

export default function PlanHero({ plan, detail }: PlanHeroProps) {
  const router = useRouter();
  const isDark = plan.variant !== "light";
  const textColor = isDark ? "text-white" : "text-[#071B8D]";
  const mutedColor = isDark ? "text-white/50" : "text-gray-500";

  return (
    <section
      className={cn(
        "relative min-h-[70vh] flex items-center",
        BG_MAP[plan.variant]
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-32 lg:py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* ── Left Content ── */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            transition={transition}
          >
            {/* Back Link */}
            <Link
              href="/business-vastu#pricing"
              className={cn(
                "inline-flex items-center gap-1.5 text-sm font-poppins hover:underline mb-8",
                isDark ? "text-[#F6A000]" : "text-[#F6A000]"
              )}
            >
              <ArrowLeft className="w-4 h-4" />
              All Business Vastu Plans
            </Link>

            {/* Plan Badge */}
            <span
              className={cn(
                "inline-block text-[10px] font-poppins font-bold tracking-[0.2em] uppercase px-4 py-1.5 rounded-full mb-4",
                plan.variant === "light" &&
                  "bg-[#071B8D]/10 text-[#071B8D] border border-[#071B8D]/20",
                plan.variant === "featured" &&
                  "bg-[#F6A000]/15 text-[#F6A000] border border-[#F6A000]/30",
                plan.variant === "dark" &&
                  "bg-white/10 text-white border border-white/20"
              )}
            >
              {plan.name} PLAN
            </span>

            {/* Headline */}
            <h1
              className={cn(
                "font-playfair font-bold text-4xl sm:text-5xl lg:text-[52px] leading-[1.1] mt-4 whitespace-pre-line",
                textColor
              )}
            >
              {detail.heroHeadline}
            </h1>

            {/* Tagline */}
            <p
              className={cn(
                "font-inter text-lg leading-relaxed mt-4 max-w-lg",
                mutedColor
              )}
            >
              {detail.heroTagline}
            </p>

            {/* Price Block */}
            <div className="mt-8">
              <span
                className={cn(
                  "block font-inter text-xs uppercase tracking-wider mb-1",
                  mutedColor
                )}
              >
                Starting at
              </span>
              <span
                className={cn(
                  "font-playfair font-bold text-5xl lg:text-[56px]",
                  isDark ? "text-[#F6A000]" : "text-[#071B8D]"
                )}
              >
                {plan.price}
              </span>
              <span className={cn("font-inter text-sm ml-2", mutedColor)}>
                /one-time audit
              </span>
            </div>

            {/* CTA */}
            <button
              onClick={() =>
                router.push(
                  `/consultation?plan=${plan.slug}&service=business-vastu`
                )
              }
              className={cn(
                "mt-8 px-8 py-4 rounded-full font-poppins font-semibold transition-all text-base",
                plan.variant === "light" &&
                  "bg-[#071B8D] text-white hover:bg-[#071B8D]/90",
                plan.variant === "featured" &&
                  "bg-[#F6A000] text-[#071B8D] hover:brightness-110",
                plan.variant === "dark" &&
                  "bg-[#F6A000] text-[#071B8D] hover:brightness-110"
              )}
            >
              Book {plan.name.charAt(0) + plan.name.slice(1).toLowerCase()} Audit Now →
            </button>

            {/* Trust Micro-copy */}
            <div
              className={cn(
                "mt-4 flex flex-wrap gap-6 text-xs font-inter",
                mutedColor
              )}
            >
              <span>✓ Report in 7 days</span>
              <span>✓ 90-day support</span>
              <span>✓ Confidential</span>
            </div>
          </motion.div>

          {/* ── Right: Feature Summary Card ── */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            transition={{ ...transition, delay: 0.2 }}
            className="hidden lg:block"
          >
            <div
              className={cn(
                "rounded-2xl p-8 shadow-2xl",
                isDark
                  ? "bg-white/10 backdrop-blur border border-white/10"
                  : "bg-white border border-[#071B8D]/10"
              )}
            >
              <span className="block font-poppins font-semibold text-sm text-[#F6A000] mb-4">
                What&apos;s Included
              </span>

              <ul className="space-y-3">
                {plan.features.map((feat) => (
                  <li key={feat} className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-[#F6A000] shrink-0 mt-0.5" />
                    <span
                      className={cn(
                        "font-inter text-sm",
                        isDark ? "text-white/70" : "text-gray-600"
                      )}
                    >
                      {feat}
                    </span>
                  </li>
                ))}
              </ul>

              <div
                className={cn(
                  "border-t my-6",
                  isDark ? "border-white/10" : "border-[#071B8D]/10"
                )}
              />

              {/* Expert Line */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#071B8D] flex items-center justify-center text-white font-poppins font-bold text-xs">
                  PS
                </div>
                <div>
                  <span
                    className={cn(
                      "block font-inter text-[13px] font-medium",
                      isDark ? "text-white" : "text-[#071B8D]"
                    )}
                  >
                    Audited by Dr. Pradeep Sharma
                  </span>
                  <span
                    className={cn(
                      "block font-inter text-xs",
                      mutedColor
                    )}
                  >
                    20+ Years Experience
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
