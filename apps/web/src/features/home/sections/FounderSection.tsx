"use client";

import { Check, ArrowRight, Users, ThumbsUp } from "lucide-react";
import FadeUp from "@/components/animations/FadeUp";
import { founderBullets } from "@/lib/data/home";
import Image from "next/image";

export default function FounderSection() {
  return (
    <section className="py-16 lg:py-24 bg-cream" id="experts">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* LEFT — Founder Image */}
          <FadeUp>
            <div className="relative">
              <Image
                src="/images/pandit g.png"
                alt="Founder"
                width={560}
                height={560}
                className="w-full h-auto object-cover rounded-2xl"
              />
              

              {/* Certified Badge */}


               {/* Certificate Badge */}
                  <div className="absolute bottom-10 right-10 z-10">
                    <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-gold to-[#D88D14] shadow-[0_8px_30px_rgba(246,160,0,0.25)] border-[3px] border-white flex items-center justify-center">
                      
                      {/* Inner Dashed Ring */}
                      <div className="absolute inset-1.5 rounded-full border border-dashed border-white/50"></div>

                      {/* Badge Content */}
                      <div className="text-center text-white">
                        <p className="text-[9px] font-semibold tracking-[2px]">
                          CERTIFIED
                        </p>

                        <p className="text-lg font-bold leading-none mt-1">
                          25+
                        </p>

                        <p className="text-[8px] tracking-wider mt-1 opacity-80">
                          YEARS
                        </p>
                      </div>
                    </div>
                </div>  

              </div>
          </FadeUp>

          {/* RIGHT — Content */}
          <div>
            <FadeUp>
              <h2 className="font-heading text-3xl md:text-4xl lg:text-[2.75rem] font-bold text-[#1A1A1A] leading-tight mb-6 text-balance">
                Guiding Global Leaders with Divine Intelligence
              </h2>
            </FadeUp>

            <FadeUp delay={0.1}>
              <p className="text-[#6B6B6B] text-base leading-[1.8] mb-4">
                With over 25 years of practice in Vedic Astrology and corporate
                governance strategy, our founder has been the trusted cosmic
                advisor to Fortune 500 executives, tech entrepreneurs, and
                political leaders worldwide.
              </p>
              <p className="text-[#6B6B6B] text-base leading-[1.8] mb-8">
                Combining ancient Jyotish Shastra with modern data-driven
                methodologies, we deliver strategic predictions that have guided
                mergers, product launches, and career-defining decisions.
              </p>
            </FadeUp>

            {/* Bullet Points */}
            <FadeUp delay={0.2}>
              <ul className="space-y-3 mb-8">
                {founderBullets.map((bullet) => (
                  <li key={bullet} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-gold/10 flex items-center justify-center mt-0.5 shrink-0">
                      <Check className="w-3 h-3 text-gold" />
                    </div>
                    <span className="text-[#6B6B6B] text-sm">{bullet}</span>
                  </li>
                ))}
              </ul>
            </FadeUp>

            {/* Stats */}
            <FadeUp delay={0.3}>
              <div className="flex gap-8 mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gold/[0.07] flex items-center justify-center">
                    <Users className="w-5 h-5 text-gold" />
                  </div>
                  <div>
                    <p className="font-heading text-2xl font-bold text-[#071B8D]">10k+</p>
                    <p className="text-[#8A8A8A] text-xs">Lives Impacted</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gold/[0.07] flex items-center justify-center">
                    <ThumbsUp className="w-5 h-5 text-gold" />
                  </div>
                  <div>
                    <p className="font-heading text-2xl font-bold text-[#071B8D]">99%</p>
                    <p className="text-[#8A8A8A] text-xs">Client Satisfaction</p>
                  </div>
                </div>
              </div>
            </FadeUp>

          {/* CTA */}
            <FadeUp delay={0.4}>
              <a
                href="#"
                className="btn-shine inline-flex items-center gap-3 bg-gradient-to-r from-[#F6A000] to-[#E89500] hover:from-[#E89500] hover:to-[#D88D14] text-white font-semibold text-sm md:text-base px-8 py-4 rounded-full shadow-[0_8px_30px_rgba(246,160,0,0.25)] hover:shadow-[0_12px_40px_rgba(246,160,0,0.3)] transition-all duration-300 group hover:scale-[1.02]"
              >
                Learn More About Our Methodology

                <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                </div>
              </a>
            </FadeUp>
          </div>
        </div>
      </div>
    </section>
  );
}
