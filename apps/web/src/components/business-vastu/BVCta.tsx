"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0 },
};
const transition = { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const };

export default function BVCta() {
  const router = useRouter();

  return (
    <section className="bg-gradient-to-br from-[#071B8D] to-[#041B8C] py-24">
      <motion.div
        className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white"
        variants={fadeUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        transition={transition}
      >
        {/* Eyebrow Pill */}
        <span className="inline-block bg-[#F6A000]/15 border border-[#F6A000]/30 text-[#F6A000] text-xs font-poppins tracking-[0.2em] uppercase px-4 py-1.5 rounded-full mb-6">
          LIMITED SLOTS THIS MONTH
        </span>

        {/* Headline */}
        <h2 className="font-playfair text-3xl sm:text-4xl lg:text-[44px] font-bold leading-tight">
          Your Vastu Audit Is
          <br />
          One Decision Away
        </h2>

        {/* Description */}
        <p className="font-inter text-base text-white/70 mt-4 leading-relaxed">
          Dr. Pradeep Sharma personally reviews every audit. We limit intake to
          8 new clients per month to maintain quality.
        </p>

        {/* Availability Indicator */}
        <div className="flex items-center justify-center gap-3 mt-6">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400" />
          </span>
          <span className="font-inter text-sm text-white/70">
            3 slots remaining this month
          </span>
        </div>

        {/* CTA Button */}
        <button
          onClick={() =>
            router.push("/consultation?service=business-vastu")
          }
          className="mt-8 bg-[#F6A000] text-[#071B8D] font-poppins font-bold px-10 py-5 rounded-full text-lg hover:brightness-110 transition shadow-lg shadow-[#F6A000]/25"
        >
          Book Your Business Vastu Audit →
        </button>
      </motion.div>
    </section>
  );
}
