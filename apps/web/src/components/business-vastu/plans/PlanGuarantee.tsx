"use client";

import { motion } from "framer-motion";
import { ShieldCheck, FileText, RefreshCw, Lock } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0 },
};
const transition = { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const };

const PILLARS = [
  {
    Icon: FileText,
    label: "Written Report",
    sub: "Detailed, signed audit report",
  },
  {
    Icon: RefreshCw,
    label: "Re-audit Included",
    sub: "90-day review at no cost",
  },
  {
    Icon: Lock,
    label: "Full Confidentiality",
    sub: "NDAs available on request",
  },
];

export default function PlanGuarantee() {
  return (
    <section className="bg-[#F7F4EE] py-20 lg:py-28">
      <motion.div
        className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center"
        variants={fadeUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        transition={transition}
      >
        {/* Icon */}
        <ShieldCheck className="w-16 h-16 text-[#071B8D] mx-auto mb-6" />

        {/* Headline */}
        <h2 className="font-playfair text-3xl sm:text-4xl font-bold text-[#071B8D] leading-tight">
          Our 90-Day
          <br />
          Alignment Guarantee
        </h2>

        {/* Description */}
        <p className="font-inter text-base text-gray-600 leading-relaxed mt-4 max-w-xl mx-auto">
          If you implement our recommendations faithfully and don&apos;t feel a
          meaningful positive shift in your workspace energy and business
          outcomes within 90 days — we conduct a complimentary re-audit, no
          questions asked.
        </p>

        {/* 3 Pillars */}
        <div className="flex flex-wrap gap-8 mt-10 justify-center">
          {PILLARS.map((pillar) => (
            <div
              key={pillar.label}
              className="flex flex-col items-center gap-2"
            >
              <pillar.Icon className="w-6 h-6 text-[#F6A000]" />
              <span className="font-poppins font-semibold text-sm text-[#071B8D]">
                {pillar.label}
              </span>
              <span className="font-inter text-xs text-gray-500">
                {pillar.sub}
              </span>
            </div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
