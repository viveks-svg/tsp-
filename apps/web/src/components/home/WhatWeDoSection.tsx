"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ServiceCard } from "@/types/home";

const fadeUpVariant = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" as const }
  })
};

const services: ServiceCard[] = [
  {
    icon: "🏠",
    title: "Business Vastu",
    description: "Harmonise your workspace to attract growth, abundance and decisive energy.",
    href: "/solutions/business-vastu"
  },
  {
    icon: "⭐",
    title: "Strategic Consulting",
    description: "High-impact decisions with astrological precision and karmic awareness.",
    href: "/solutions/strategic-consulting"
  },
  {
    icon: "👥",
    title: "Partnership Alignment",
    description: "Evaluate compatibility and long-term success of business partnerships.",
    href: "/solutions/partnership-analysis"
  },
  {
    icon: "🏡",
    title: "Personal Life Guidance",
    description: "Clarity in relationships, health, career and major life milestones.",
    href: "/solutions/career-guidance"
  }
];

export default function WhatWeDoSection() {
  return (
    <section
      id="what-we-do"
      className="relative w-full py-12 md:py-16 lg:py-24 overflow-hidden bg-gradient-to-br from-[#F7ECD4] via-[#F1E0B6] to-[#E5C774] border-t border-[#E7D29B]/70"
    >
      <div className="absolute inset-0 bg-noise pointer-events-none opacity-35" />

      <div className="w-full max-w-7xl mx-auto px-4 md:px-8 lg:px-16 xl:px-24 relative z-10">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={{
            hidden: { opacity: 0, y: 30 },
            visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
          }}
          className="text-center mb-12 md:mb-14 overflow-hidden break-words"
        >
          <span className="text-[#8B6914] font-poppins text-xs md:text-sm font-semibold uppercase tracking-[0.3em] mb-3 block">
            What We Do
          </span>
          <h2 className="font-heading text-2xl md:text-3xl lg:text-4xl font-bold text-[#1E1A16] text-balance">
            Holistic Solutions For Businesses & Leaders
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {services.map((service, index) => (
            <motion.div
              key={index}
              custom={index}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              variants={fadeUpVariant}
              className="group relative overflow-hidden bg-gradient-to-b from-[#FFFDF8] to-[#F8F1E2] rounded-3xl p-5 md:p-6 lg:p-8 border border-[#E6D3A3] shadow-[0_20px_60px_rgba(0,0,0,0.08)] hover:-translate-y-2 hover:shadow-[0_28px_80px_rgba(0,0,0,0.12)] transition-all duration-500 text-center flex flex-col h-full"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/70 via-transparent to-transparent pointer-events-none" />

              <div className="relative z-10 flex flex-col h-full">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#F8E7B1] via-[#E2C15D] to-[#C99411] shadow-[0_12px_28px_rgba(212,175,55,0.25)] border border-white/60 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-all duration-500 shrink-0">
                  {service.icon === "🏠" && (
                    <svg className="w-6 h-6 text-[#8B6914]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                  )}
                  {service.icon === "⭐" && (
                    <svg className="w-6 h-6 text-[#8B6914]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                  )}
                  {service.icon === "👥" && (
                    <svg className="w-6 h-6 text-[#8B6914]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  )}
                  {service.icon === "🏡" && (
                    <svg className="w-6 h-6 text-[#8B6914]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  )}
                </div>

                <h3 className="font-heading text-lg font-bold text-[#1E1A16] mb-2">
                  {service.title}
                </h3>

                <p className="text-[#6B5F52] text-sm leading-relaxed mb-5 flex-grow">
                  {service.description}
                </p>

                <div className="gradient-line-gold mx-auto my-3 w-full" />

                {service.title === "Business Vastu" ? (
                  /*
                  <Link
                    href={service.href}
                    className="inline-flex items-center justify-center text-sm font-semibold text-[#8B6914] group-hover:text-[#C99411] transition-colors duration-300 uppercase tracking-[0.12em]"
                  >
                    Explore
                    <svg
                      className="w-4 h-4 ml-1.5 group-hover:translate-x-1.5 transition-transform duration-300"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                  */
                  <button
                    onClick={(e) => e.preventDefault()}
                    className="inline-flex items-center justify-center text-sm font-semibold text-[#8B6914]/60 transition-colors duration-300 uppercase tracking-[0.12em] cursor-not-allowed"
                  >
                    Coming Soon
                  </button>
                ) : (
                  <Link
                    href={service.href}
                    className="inline-flex items-center justify-center text-sm font-semibold text-[#8B6914] group-hover:text-[#C99411] transition-colors duration-300 uppercase tracking-[0.12em]"
                  >
                    Explore
                    <svg
                      className="w-4 h-4 ml-1.5 group-hover:translate-x-1.5 transition-transform duration-300"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={{
            hidden: { opacity: 0, y: 30 },
            visible: { opacity: 1, y: 0, transition: { delay: 0.4, duration: 0.5, ease: "easeOut" } }
          }}
          className="mt-12 text-center"
        >
          <Link
            href="/solutions"
            className="inline-flex w-full sm:w-auto justify-center items-center gap-2 bg-[#1E1A16] text-white border border-[#1E1A16] px-8 py-4 sm:py-3.5 rounded-full text-sm font-semibold hover:bg-[#D4AF37] hover:text-[#1E1A16] hover:border-[#D4AF37] hover:shadow-[0_12px_40px_rgba(212,175,55,0.30)] active:scale-[0.98] transition-all duration-300"
          >
            View All Solutions
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}