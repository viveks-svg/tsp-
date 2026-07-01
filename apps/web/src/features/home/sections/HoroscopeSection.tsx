"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import FadeUp from "@/components/animations/FadeUp";
import { zodiacEmojis, row1Signs, row2Signs } from "@/lib/data/zodiac";
import { apiClient } from "@/lib/http/client";
import { ENDPOINTS } from "@/lib/constants/http/endpoints";
import type { HoroscopeReading } from "@/types/horoscope";

export default function HoroscopeSection() {
  const [activeSign, setActiveSign] = useState("Aries");
  const [reading, setReading] = useState<string>("Loading your cosmic insights...");
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    const fetchReading = async () => {
      setLoading(true);
      try {
        const data = await apiClient.get<HoroscopeReading>(
          ENDPOINTS.HOROSCOPE.GET(activeSign.toUpperCase(), "DAILY")
        );
        if (isMounted) {
          setReading(data.overallText);
        }
      } catch (error) {
        console.error("Failed to fetch daily horoscope:", error);
        if (isMounted) {
          setReading("The stars are currently aligning. Check back later for your reading.");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchReading();
    return () => {
      isMounted = false;
    };
  }, [activeSign]);

  return (
    <section className="py-16 lg:py-20 bg-gradient-to-b from-cream to-white overflow-visible" id="kundli">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Title Block */}
        <FadeUp>
          <div className="text-center mb-8">
            <span className="font-playfair text-lg font-bold text-[#1A1A1A] leading-none mb-1 block">
              Free Daily
            </span>
            <h2 className="font-playfair text-4xl md:text-5xl lg:text-[3.25rem] font-bold text-[#1A1A1A] leading-tight">
              Horoscopes
            </h2>
            <p className="font-inter text-xs text-[#8A8A8A] mt-3 max-w-md mx-auto leading-relaxed">
              Join over 7 million people who love our horoscopes.
            </p>
          </div>
        </FadeUp>

        {/* Zodiac Selector Section */}
        <FadeUp delay={0.1}>
          <div className="max-w-4xl mx-auto mb-10">
            {/* Left-aligned Label */}
            <p className="font-inter text-[10px] md:text-xs font-semibold text-[#8A8A8A] tracking-[0.1em] uppercase mb-4 pl-2 text-center md:text-left">
              Select your sign:
            </p>

            {/* Selector Pills in Two Rows */}
            <div className="flex flex-col gap-3 items-center">
              {/* Row 1 */}
              <div className="flex flex-wrap justify-center gap-2.5">
                {row1Signs.map((sign) => (
                  <button
                    key={sign}
                    onClick={() => setActiveSign(sign)}
                    className={`flex items-center px-4 py-2 rounded-full border transition-all duration-300 ${
                      activeSign === sign
                        ? "border-[#9333EA]/60 bg-[#FAF5FF] text-[#1E293B] shadow-[0_2px_12px_rgba(147,51,234,0.1)]"
                        : "border-[#E8E4DC] bg-white text-[#1E293B] hover:border-[#9333EA]/25 hover:shadow-[0_2px_8px_rgba(0,0,0,0.03)]"
                    }`}
                  >
                    {/* Small Purple Badge */}
                    <div className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold mr-2 shrink-0 transition-colors duration-300 ${
                      activeSign === sign ? "bg-[#9333EA] text-white" : "bg-[#FAF5FF] text-[#9333EA]"
                    }`}>
                      {zodiacEmojis[sign]}
                    </div>
                    <span className="font-poppins text-xs font-medium tracking-wide">
                      {sign}
                    </span>
                  </button>
                ))}
              </div>

              {/* Row 2 */}
              <div className="flex flex-wrap justify-center gap-2.5">
                {row2Signs.map((sign) => (
                  <button
                    key={sign}
                    onClick={() => setActiveSign(sign)}
                    className={`flex items-center px-4 py-2 rounded-full border transition-all duration-300 ${
                      activeSign === sign
                        ? "border-[#9333EA]/60 bg-[#FAF5FF] text-[#1E293B] shadow-[0_2px_12px_rgba(147,51,234,0.1)]"
                        : "border-[#E8E4DC] bg-white text-[#1E293B] hover:border-[#9333EA]/25 hover:shadow-[0_2px_8px_rgba(0,0,0,0.03)]"
                    }`}
                  >
                    {/* Small Purple Badge */}
                    <div className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold mr-2 shrink-0 transition-colors duration-300 ${
                      activeSign === sign ? "bg-[#9333EA] text-white" : "bg-[#FAF5FF] text-[#9333EA]"
                    }`}>
                      {zodiacEmojis[sign]}
                    </div>
                    <span className="font-poppins text-xs font-medium tracking-wide">
                      {sign}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </FadeUp>

        {/* Premium Horoscope Display Card */}
        <FadeUp delay={0.2}>
          <div className="max-w-2xl mx-auto text-center bg-white rounded-2xl p-8 md:p-10 shadow-[0_8px_30px_rgba(0,0,0,0.03)] border border-[#E8E4DC] relative overflow-hidden">
            {/* Elegant Background Glow */}
            <div className="absolute -top-24 -left-24 w-48 h-48 rounded-full bg-[radial-gradient(circle,rgba(250,245,255,0.8)_0%,transparent_70%)] pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-48 h-48 rounded-full bg-[radial-gradient(circle,rgba(247,244,238,0.6)_0%,transparent_70%)] pointer-events-none" />

            <AnimatePresence mode="wait">
              <motion.div
                key={activeSign}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
              >
                {/* Zodiac Sign Emoji */}
                <div className="w-16 h-16 rounded-full bg-[#FAF5FF] text-[#9333EA] text-3xl mx-auto mb-4 flex items-center justify-center shadow-[inset_0_2px_4px_rgba(0,0,0,0.04)] border border-purple-50">
                  {zodiacEmojis[activeSign]}
                </div>
                
                {/* Sign Name */}
                <h3 className="font-playfair text-3xl font-bold text-[#050B5C] mb-1">
                  {activeSign}
                </h3>
                
                {/* Subtitle */}
                <p className="font-inter text-[10px] font-semibold tracking-[0.2em] text-gold uppercase mb-5">
                  Daily Horoscope • Today
                </p>

                {/* Horoscope Description */}
                <p className="font-inter text-sm md:text-base font-normal text-[#6B6B6B] leading-relaxed max-w-xl mx-auto px-4 min-h-[80px]">
                  {loading ? (
                    <span className="animate-pulse">Consulting the stars...</span>
                  ) : (
                    reading
                  )}
                </p>
              </motion.div>
            </AnimatePresence>

            {/* Bottom Accent Element */}
            <div className="flex items-center justify-center gap-2 mt-8 opacity-30">
              <div className="w-1.5 h-1.5 bg-[#050B5C] rotate-45" />
              <div className="w-8 h-[0.5px] bg-[#050B5C]" />
              <div className="w-1.5 h-1.5 bg-[#050B5C] rotate-45" />
            </div>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}
