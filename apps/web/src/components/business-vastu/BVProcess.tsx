"use client";

import { motion } from "framer-motion";
import { PROCESS_STEPS } from "@/lib/data/business-vastu";

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0 },
};
const transition = { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const };

export default function BVProcess() {
  return (
    <section className="bg-[#F7F4EE] py-20 lg:py-28">
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
            HOW IT WORKS
          </span>
          <h2 className="font-playfair text-3xl sm:text-4xl lg:text-[40px] font-bold text-[#071B8D] leading-tight">
            Your Vastu Journey
            <br />
            in 4 Precise Steps
          </h2>
        </motion.div>

        {/* Steps */}
        <div className="relative flex flex-col lg:flex-row gap-0">
          {/* Connecting line (desktop only) */}
          <div className="hidden lg:block absolute top-7 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-[#F6A000]/40 to-transparent" />

          {PROCESS_STEPS.map((step, i) => (
            <motion.div
              key={step.step}
              className="flex-1 flex flex-col items-center text-center px-6 py-6 lg:py-0"
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              transition={{ ...transition, delay: i * 0.12 }}
            >
              {/* Step Number */}
              <span className="w-14 h-14 rounded-full bg-[#071B8D] text-[#F6A000] font-playfair text-xl font-bold flex items-center justify-center ring-4 ring-[#F6A000]/20 relative z-10">
                {step.step}
              </span>

              {/* Title */}
              <h3 className="font-poppins font-semibold text-base text-[#071B8D] mt-5">
                {step.title}
              </h3>

              {/* Description */}
              <p className="font-inter text-sm text-gray-500 mt-2 leading-relaxed max-w-xs">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
