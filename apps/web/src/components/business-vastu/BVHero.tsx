"use client";

import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { HERO_STATS } from "@/lib/data/business-vastu";

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0 },
};

const transition = { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const };

function TomorrowDate() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return (
    <span>
      {tomorrow.toLocaleDateString("en-IN", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })}
    </span>
  );
}

export default function BVHero() {
  const handleScrollToPricing = () => {
    const el = document.getElementById("pricing");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative min-h-screen flex items-center pt-10 lg:pt-14 overflow-hidden bg-gradient-to-br from-[#0A0A0A] via-[#071B8D]/40 to-[#0A0A0A]">      {/* Subtle radial overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(246,160,0,0.06),transparent_60%)]" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-32 lg:py-0">
        <div className="grid lg:grid-cols-[55%_45%] gap-12 items-center min-h-screen">
          {/* ── Left Content ── */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            transition={transition}
          >
            {/* Eyebrow */}
            <span className="inline-block bg-[#F6A000]/10 border border-[#F6A000]/30 text-[#F6A000] text-xs font-poppins tracking-[0.2em] uppercase px-4 py-1.5 rounded-full mb-8">
              VEDIC SPATIAL SCIENCE FOR BUSINESS
            </span>

            {/* Headline */}
            <h1 className="font-playfair font-bold text-4xl sm:text-5xl lg:text-[56px] leading-[1.1] mb-6">
              <span className="text-white block">Transform Your</span>
              <span className="text-[#F6A000] block drop-shadow-[0_2px_12px_rgba(246,160,0,0.3)]">
                Business Space
              </span>
              <span className="text-white block">Into a Prosperity Engine</span>
            </h1>

            {/* Subheading */}
            <p className="font-inter text-lg text-white/70 max-w-lg leading-relaxed mb-8">
              Ancient Vastu principles aligned with modern corporate
              architecture. We audit, redesign, and realign your workspace to
              maximise productivity, harmony, and financial flow.
            </p>

            {/* CTA Row */}
            <div className="flex flex-wrap gap-4">
              <button
                onClick={handleScrollToPricing}
                className="bg-[#F6A000] text-[#071B8D] font-poppins font-semibold px-8 py-4 rounded-full hover:brightness-110 transition text-sm sm:text-base"
              >
                Book a Vastu Audit
              </button>
              <button className="border border-white/30 text-white backdrop-blur-sm px-8 py-4 rounded-full hover:bg-white/10 transition font-poppins text-sm sm:text-base">
                Watch How It Works
              </button>
            </div>

            {/* Trust Strip */}
            <div className="flex flex-wrap gap-8 mt-10">
              {HERO_STATS.map((stat) => (
                <div key={stat.label}>
                  <span className="block font-playfair text-[#F6A000] text-2xl font-bold">
                    {stat.value}
                  </span>
                  <span className="block font-inter text-white/50 text-sm mt-0.5">
                    {stat.label}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* ── Right: Floating Slot Card ── */}
          <motion.div
            className="hidden lg:flex justify-end items-end pb-32"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            transition={{ ...transition, delay: 0.3 }}
          >
            <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6 shadow-2xl max-w-xs w-full">
              <span className="block font-poppins text-[#F6A000] text-xs tracking-wider uppercase font-semibold mb-3">
                Next Available Slot
              </span>
              <div className="space-y-2 text-white/70 font-inter text-sm">
                <p>
                  <span className="text-white/40 text-xs">Date:</span>{" "}
                  <TomorrowDate />
                </p>
                <p>
                  <span className="text-white/40 text-xs">Time:</span> 10:00 AM
                  – 12:00 PM
                </p>
                <p>
                  <span className="text-white/40 text-xs">Expert:</span> Dr.
                  Pradeep Sharma
                </p>
              </div>
              <Link
                href="/consultation"
                className="block mt-5 text-center bg-[#F6A000]/10 text-[#F6A000] font-poppins font-semibold text-sm py-3 rounded-full border border-[#F6A000]/30 hover:bg-[#F6A000]/20 transition"
              >
                Reserve This Slot →
              </Link>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── Scroll Indicator ── */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
      >
        <ChevronDown className="w-6 h-6 text-[#F6A000]/60" />
      </motion.div>
    </section>
  );
}
