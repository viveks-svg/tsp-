"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { FAQS } from "@/lib/data/business-vastu";
import type { BVFaqItem } from "@/lib/data/business-vastu";
import { cn } from "@/lib/cn";

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0 },
};
const transition = { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const };

function FaqItem({ faq, index }: { faq: BVFaqItem; index: number }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-gray-200 last:border-b-0">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full text-left py-5 gap-4 group"
        aria-expanded={open}
      >
        <span
          className={cn(
            "font-poppins font-semibold text-base transition-colors",
            open ? "text-[#071B8D]" : "text-gray-800 group-hover:text-[#071B8D]"
          )}
        >
          {faq.question}
        </span>
        <ChevronDown
          className={cn(
            "w-5 h-5 shrink-0 text-gray-400 transition-transform duration-300",
            open && "rotate-180 text-[#F6A000]"
          )}
        />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <p className="font-inter text-sm text-gray-600 leading-relaxed pb-5">
              {faq.answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function BVFaq() {
  return (
    <section className="bg-white py-20 lg:py-28">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          className="text-center mb-12"
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          transition={transition}
        >
          <span className="block font-poppins text-[#F6A000] text-xs tracking-[0.25em] uppercase font-semibold mb-4">
            FREQUENTLY ASKED QUESTIONS
          </span>
          <h2 className="font-playfair text-3xl sm:text-4xl font-bold text-[#071B8D] leading-tight">
            Have Questions?
            <br />
            We Have Answers
          </h2>
        </motion.div>

        {/* Accordion */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          transition={{ ...transition, delay: 0.15 }}
        >
          {FAQS.map((faq, i) => (
            <FaqItem key={i} faq={faq} index={i} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
