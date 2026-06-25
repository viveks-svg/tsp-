"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/cn";
import type { BVPricingPlan } from "@/lib/data/business-vastu";


const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0 },
};
const transition = { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const };

interface PlanCTAProps {
  plan: BVPricingPlan;
}

export default function PlanCTA({ plan }: PlanCTAProps) {
  const router = useRouter();
  const displayName = plan.name.charAt(0) + plan.name.slice(1).toLowerCase();

  const handleBook = () => {
    router.push(`/book?service=${plan.slug}`);
  };

  return (
    <section className="bg-gradient-to-br from-[#071B8D] to-[#041B8C] py-20 lg:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* ── Left: Text ── */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            transition={transition}
          >
            <h2 className="font-playfair text-3xl sm:text-4xl lg:text-[40px] font-bold text-white leading-tight">
              Ready to Align Your
              <br />
              Business with the Cosmos?
            </h2>

            <p className="font-inter text-base text-white/70 mt-4 leading-relaxed max-w-lg">
              Dr. Pradeep Sharma personally handles all {displayName} audits.
              Book now to secure your slot.
            </p>

            {/* Urgency */}
            <div className="flex items-center gap-3 mt-6">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400" />
              </span>
              <span className="font-inter text-sm text-white/70">
                Only 2–3 {displayName} slots available this month
              </span>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mt-8">
              <button
                onClick={handleBook}
                className="bg-[#F6A000] text-[#071B8D] font-poppins font-semibold px-8 py-4 rounded-full hover:brightness-110 transition text-base"
              >
                Book This Plan Now →
              </button>
              <button
                onClick={() =>
                  router.push(`/contact?plan=${plan.slug}`)
                }
                className="border border-white/30 text-white font-poppins px-8 py-4 rounded-full hover:bg-white/10 transition text-base"
              >
                Talk to Us First
              </button>
            </div>
          </motion.div>

          {/* ── Right: Summary Card ── */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            transition={{ ...transition, delay: 0.15 }}
          >
            <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-8">
              {/* Plan Name */}
              <span className="block font-poppins text-[#F6A000] text-xs tracking-[0.2em] uppercase font-semibold">
                {plan.name}
              </span>

              {/* Price */}
              <span className="block font-playfair text-4xl font-bold text-white mt-2">
                {plan.price}
              </span>

              {/* Divider */}
              <div className="border-t border-white/10 my-6" />

              {/* Features */}
              <ul className="space-y-2.5">
                {plan.features.map((feat) => (
                  <li key={feat} className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-[#F6A000] shrink-0 mt-0.5" />
                    <span className="font-inter text-[13px] text-white/70">
                      {feat}
                    </span>
                  </li>
                ))}
              </ul>

              {/* Footer */}
              <p className="font-inter text-xs text-white/50 mt-4">
                Includes 90-day implementation support
              </p>
            </div>
          </motion.div>
        </div>
      </div>

    </section>
  );
}
