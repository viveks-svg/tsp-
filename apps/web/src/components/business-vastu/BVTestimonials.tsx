"use client";

import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { TESTIMONIALS } from "@/lib/data/business-vastu";
import type { BVTestimonial } from "@/lib/data/business-vastu";

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0 },
};
const transition = { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const };

function TestimonialCard({
  testimonial,
  index,
}: {
  testimonial: BVTestimonial;
  index: number;
}) {
  return (
    <motion.div
      className="bg-white/5 border border-white/10 rounded-2xl p-8"
      variants={fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      transition={{ ...transition, delay: index * 0.1 }}
    >
      {/* Stars */}
      <div className="flex gap-1 mb-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className="w-4 h-4 fill-[#F6A000] text-[#F6A000]"
          />
        ))}
      </div>

      {/* Quote */}
      <p className="font-playfair italic text-base text-white/80 leading-relaxed">
        &ldquo;{testimonial.quote}&rdquo;
      </p>

      {/* Divider */}
      <div className="border-t border-white/10 my-6" />

      {/* Author */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-[#071B8D] flex items-center justify-center text-white font-poppins font-bold text-sm">
          {testimonial.initials}
        </div>
        <div>
          <span className="block font-poppins font-semibold text-sm text-white">
            {testimonial.name}
          </span>
          <span className="block font-inter text-xs text-white/50">
            {testimonial.role}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

export default function BVTestimonials() {
  return (
    <section className="bg-[#0A0A0A] py-20 lg:py-28">
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
            CLIENT RESULTS
          </span>
          <h2 className="font-playfair text-3xl sm:text-4xl lg:text-[40px] font-bold text-white leading-tight">
            Business Leaders Who
            <br />
            Trusted the Science
          </h2>
        </motion.div>

        {/* Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t, i) => (
            <TestimonialCard key={t.name} testimonial={t} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
