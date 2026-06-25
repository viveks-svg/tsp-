"use client";

import { motion } from "framer-motion";
import { Video, Calendar } from "lucide-react";
import FadeUp from "@/components/animations/FadeUp";
import Button from "@/components/ui/Button";
import { heroStats } from "@/lib/data/home";
import ZodiacWheel from "@/features/home/components/ZodiacWheel";

export default function HeroSection() {
  return (
    <section
      className="relative overflow-hidden bg-[#22201C] min-h-[92vh]"
      id="hero"
    >
      {/* Subtle warm ambient glows */}
      <div className="absolute top-0 left-[30%] w-[600px] h-[600px] bg-[radial-gradient(circle,rgba(246,160,0,0.04)_0%,transparent_60%)] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[radial-gradient(circle,rgba(7,27,141,0.05)_0%,transparent_60%)] pointer-events-none" />

      {/* Background image — right side, blends naturally with dark bg */}
      <div className="absolute right-0 top-0 bottom-0 w-[60%] lg:w-[52%]">
        <img
          src="/images/dr-pradeep-sharma.png"
          alt=""
          aria-hidden="true"
          className="w-full h-full object-cover object-top"
        />
        {/* Left edge blend into dark bg */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#22201C] via-[#22201C]/70 via-20% to-transparent" />
        {/* Bottom blend */}
        <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#22201C] to-transparent" />

        {/* Zodiac Wheel — subtle background decoration aligned with the image's zodiac chart */}
        <div className="absolute left-[3%] top-[17%]
                -translate-x-1/2 -translate-y-1/2
                scale-125
                w-[340px] sm:w-[340px] md:w-[360px] lg:w-[380px] xl:w-[400px]
                aspect-square
                pointer-events-none
                opacity-[0.20]
                mix-blend-screen">
          <ZodiacWheel />
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 w-full px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-20 pt-28 lg:pt-36 pb-16 lg:pb-24">
        <div className="max-w-[1440px] mx-auto">
          <div className="max-w-xl lg:max-w-2xl">

            {/* Premium Badge Capsule — original restored */}
            <FadeUp onMount>
              <div className="inline-flex items-center gap-2 bg-white/[0.06] backdrop-blur-sm border border-white/[0.08] px-4 py-2 rounded-full mb-8">
                <span className="text-[#C8A04A] text-xs">✦</span>
                <span className="text-white/70 text-xs font-semibold tracking-[0.12em] flex items-center gap-2">
                  <span>Guidance</span>
                  <span className="w-1 h-1 rounded-full bg-[#C8A04A]/50" />
                  <span>Wisdom</span>
                  <span className="w-1 h-1 rounded-full bg-[#C8A04A]/50" />
                  <span>Transformation</span>
                </span>
              </div>
            </FadeUp>

            {/* Headline */}
            <FadeUp delay={0.1} onMount>
              <h1 className="font-heading text-[3rem] sm:text-[4rem] lg:text-[5rem] xl:text-[5.5rem] font-semibold leading-[0.98] tracking-[-0.03em] text-white mb-8">
                Ancient Wisdom
                <br />
                <span className="text-[#C8A04A]">
                  for Modern
                </span>
                <br />
                Success
              </h1>
            </FadeUp>

            {/* Subheading */}
            <FadeUp delay={0.15} onMount>
              <p className="text-white/50 text-base lg:text-[1.05rem] leading-[1.8] max-w-lg mb-10 font-inter">
                We combine Astrology, Vedic Philosophy, Vastu & Numerology
                to unlock the secrets of your professional destiny.
              </p>
            </FadeUp>

            {/* CTA Buttons — original restored */}
            <FadeUp delay={0.2} onMount>
              <div className="flex flex-wrap gap-4 mb-14">
                <Button
                  variant="gold"
                  size="lg"
                  className="px-8 py-3.5 rounded-full btn-shine shadow-[0_4px_25px_rgba(246,160,0,0.2)]"
                  onClick={() => {
                    window.location.href = "/book";
                  }}
                >
                  <Calendar className="w-4 h-4" />
                  Book Appointment
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="px-8 py-3.5 rounded-full border-white/20 text-white hover:bg-white/10 hover:text-white hover:border-white/30"
                  onClick={() => {
                    window.location.href = "/solutions";
                  }}
                >
                  <Video className="w-4 h-4" />
                  View Solutions
                </Button>
              </div>
            </FadeUp>

            {/* Stats — clean with dividers */}
            <FadeUp delay={0.25} onMount>
              <div className="flex items-center gap-0">
                {heroStats.map((stat, i) => (
                  <div
                    key={stat.label}
                    className={`flex flex-col pr-8 sm:pr-10 ${i > 0 ? "pl-8 sm:pl-10 border-l border-white/10" : ""}`}
                  >
                    <p className="font-heading font-bold text-2xl sm:text-3xl leading-none text-white">
                      {stat.value}
                    </p>
                    <p className="font-inter text-[10px] text-white/35 mt-2 tracking-[0.08em] uppercase font-medium">
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>
            </FadeUp>
          </div>
        </div>
      </div>

      {/* Experience floating badge — top right area */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.6, duration: 0.5 }}
        className="absolute top-28 right-8 lg:right-16 z-20 hidden lg:block"
      >
        <div className="bg-white/[0.08] backdrop-blur-md border border-white/[0.08] rounded-2xl px-5 py-4">
          <p className="font-heading text-3xl font-bold text-[#C8A04A]">25+</p>
          <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-medium">
            Years Experience
          </p>
        </div>
      </motion.div>

      {/* Identity badge — bottom right */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9, duration: 0.5 }}
        className="absolute bottom-20 right-8 lg:right-16 z-20 hidden lg:block"
      >
        <div className="bg-white/[0.08] backdrop-blur-md border border-white/[0.08] rounded-2xl px-5 py-4 max-w-[260px]">
          <p className="font-heading text-lg font-semibold text-white">
            Dr. Pradeep Sharma
          </p>
          <p className="text-[12px] text-[#C8A04A] font-medium mt-0.5">
            Vedic Advisor • Business Consultant
          </p>
          <p className="text-[11px] text-white/35 mt-2 leading-relaxed">
            Integrating Vedic wisdom, astrology and modern business
            strategy for transformational growth.
          </p>
        </div>
      </motion.div>
    </section>
  );
}
