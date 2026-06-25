"use client";

import { useEffect, useState } from "react";
import FadeUp from "@/components/animations/FadeUp";
import { motion } from "framer-motion";

export default function AdvisorCTA() {
  const [time, setTime] = useState({ hours: 9, minutes: 44, seconds: 51 });

  useEffect(() => {
    const interval = setInterval(() => {
      setTime((prev) => {
        let { hours, minutes, seconds } = prev;
        seconds--;
        if (seconds < 0) {
          seconds = 59;
          minutes--;
          if (minutes < 0) {
            minutes = 59;
            hours--;
            if (hours < 0) {
              hours = 23;
            }
          }
        }
        return { hours, minutes, seconds };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <section className="relative pt-16 pb-20 bg-gradient-to-b from-[#FEFBF6] to-[#FAF7F1] overflow-visible" id="advisor-cta">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <FadeUp>
          <div className="bg-[#0A0A0A] rounded-[28px] md:rounded-[36px] p-8 md:p-14 text-center relative overflow-hidden shadow-[0_25px_60px_rgba(0,0,0,0.2)] border border-white/[0.03]">
            {/* Subtle inner gold glow */}
            <div className="absolute top-0 right-0 w-[350px] h-[350px] bg-[radial-gradient(circle,rgba(246,160,0,0.06)_0%,transparent_70%)] pointer-events-none" />
            <div className="absolute -left-10 -bottom-10 w-[250px] h-[250px] bg-[radial-gradient(circle,rgba(246,160,0,0.04)_0%,transparent_70%)] pointer-events-none" />

            <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl font-medium text-white leading-tight mb-4 relative z-10 text-balance">
              Get Excellence Advice
            </h2>

            <p className="font-inter text-gold/80 text-sm md:text-base max-w-2xl mx-auto mb-8 relative z-10 leading-relaxed">
              Exclusive Offer: Talk to an Executive Advisor at just ₹1 for <br />your first session
            </p>

            {/* Countdown Timer Pill */}
            <div className="inline-flex items-center justify-center gap-4 bg-white/[0.04] border border-white/[0.06] rounded-full px-6 py-3.5 mb-10 relative z-10">
              <span className="text-gold/70 text-[11px] font-inter uppercase tracking-[0.2em]">
                Offers Expires In
              </span>
              <div className="flex items-center gap-2 font-libre-mono text-xl text-white/90 tracking-wider">
                <span>{pad(time.hours)}</span>
                <span className="text-gold/50 animate-pulse">:</span>
                <span>{pad(time.minutes)}</span>
                <span className="text-gold/50 animate-pulse">:</span>
                <span>{pad(time.seconds)}</span>
              </div>
            </div>

            <div className="flex justify-center relative z-10">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                className="btn-shine bg-gradient-to-r from-[#F6A000] to-[#E89500] text-white px-12 py-5 rounded-full text-base font-heading font-semibold shadow-[0_4px_30px_rgba(246,160,0,0.25)] hover:shadow-[0_8px_40px_rgba(246,160,0,0.35)] transition-shadow duration-300"
                onClick={() => {
                  window.location.href = "/consultations/chat"
                }}>
                Talk @ ₹1 Only
              </motion.button>
            </div>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}
