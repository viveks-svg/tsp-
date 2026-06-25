"use client";

import { motion } from "framer-motion";
import type { PlanDetailProcessStep } from "@/lib/data/business-vastu";

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0 },
};
const transition = { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const };

interface PlanProcessProps {
  planName: string;
  steps: PlanDetailProcessStep[];
}

export default function PlanProcess({ planName, steps }: PlanProcessProps) {
  return (
    <section className="bg-[#071B8D] py-20 lg:py-28">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
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
            YOUR JOURNEY
          </span>
          <h2 className="font-playfair text-3xl sm:text-4xl font-bold text-white leading-tight">
            Your {planName} Journey
          </h2>
        </motion.div>

        {/* Timeline */}
        <div className="relative">
          {/* Vertical gold line */}
          <div className="absolute left-6 top-0 bottom-0 w-px bg-[#F6A000]/30" />

          <div className="space-y-0">
            {steps.map((step, i) => (
              <motion.div
                key={step.title}
                className="flex gap-8 items-start relative pb-12 last:pb-0"
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.2 }}
                transition={{ ...transition, delay: i * 0.1 }}
              >
                {/* Step Dot */}
                <div className="w-12 h-12 rounded-full border-2 border-[#F6A000] bg-[#071B8D] z-10 shrink-0 flex items-center justify-center">
                  <span className="font-playfair text-[#F6A000] font-bold text-sm">
                    {i + 1}
                  </span>
                </div>

                {/* Content */}
                <div className="flex-1 pt-1">
                  <div className="flex flex-wrap items-center gap-3 mb-1">
                    <h3 className="font-poppins font-semibold text-base text-white">
                      {step.title}
                    </h3>
                    <span className="inline-block bg-[#F6A000]/15 text-[#F6A000] text-[10px] font-poppins font-bold tracking-wider px-2.5 py-0.5 rounded-full">
                      {step.day}
                    </span>
                  </div>
                  <p className="font-inter text-sm text-white/60 leading-relaxed mt-1">
                    {step.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
