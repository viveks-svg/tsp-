"use client";

import { motion } from "framer-motion";
import { Compass, Waves, Zap, Ruler } from "lucide-react";
import VastuCompass from "@/components/business-vastu/VastuCompass";
import { PHILOSOPHY_PRINCIPLES } from "@/lib/data/business-vastu";
import type { BVPrinciple } from "@/lib/data/business-vastu";

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0 },
};
const transition = { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const };

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Compass,
  Waves,
  Zap,
  Ruler,
};

function PrincipleCard({ principle }: { principle: BVPrinciple }) {
  const Icon = ICON_MAP[principle.icon];
  return (
    <div className="bg-white rounded-xl p-5 border border-[#071B8D]/[0.08] shadow-sm hover:shadow-md hover:border-[#F6A000]/40 transition-all duration-300">
      {Icon && <Icon className="w-5 h-5 text-[#F6A000] mb-2" />}
      <h4 className="font-poppins font-semibold text-sm text-[#071B8D]">
        {principle.title}
      </h4>
      <p className="font-inter text-[13px] text-gray-500 mt-1 leading-relaxed">
        {principle.description}
      </p>
    </div>
  );
}

export default function BVPhilosophy() {
  return (
    <section className="bg-[#F7F4EE] py-20 lg:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* ── Left: Compass Illustration ── */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            transition={transition}
            className="aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-[#071B8D]/10 to-[#F6A000]/10 border border-[#071B8D]/10 flex items-center justify-center p-12"
          >
            <VastuCompass />
          </motion.div>

          {/* ── Right: Content ── */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            transition={{ ...transition, delay: 0.15 }}
          >
            <span className="block font-poppins text-[#F6A000] text-xs tracking-[0.2em] uppercase font-semibold mb-4">
              THE SCIENCE BEHIND THE SPACE
            </span>

            <h2 className="font-playfair text-3xl sm:text-4xl lg:text-[40px] font-bold text-[#071B8D] leading-tight mb-6">
              Vastu Is Architecture
              <br />
              Engineered by the Cosmos
            </h2>

            <p className="font-inter text-base text-gray-600 leading-relaxed mb-8">
              Every direction holds a frequency. The North-East is the zone of
              knowledge and clarity. The South-West anchors stability and wealth
              retention. When your boardroom, finance cabin, and MD&apos;s desk
              align with these cosmic axes — decisions sharpen, deals close
              faster, and energy stops leaking.
            </p>

            {/* Principle Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {PHILOSOPHY_PRINCIPLES.map((p) => (
                <PrincipleCard key={p.title} principle={p} />
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
