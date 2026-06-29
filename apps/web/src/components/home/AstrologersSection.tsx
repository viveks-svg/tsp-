"use client";

import { useEffect, useState } from "react";
import { motion as motionFramer } from "framer-motion";
import Link from "next/link";
import { apiClient } from "@/lib/http/client";
import { ENDPOINTS } from "@/lib/constants/http/endpoints";
import { mapApiAstrologer } from "@/lib/data/astrologers";
import type { ApiAstrologer } from "@/types/api";
import type { Astrologer } from "@/types/astrologer";
import { ROUTES } from "@/lib/constants/routes";
import AstrologerCard, { AstrologerCardSkeleton } from "@/features/astrologers/components/AstrologerCard";

const fadeUpVariant = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.12, duration: 0.5, ease: "easeOut" as const }
  })
};

export default function AstrologersSection() {
  const [loading, setLoading] = useState(true);
  const [astrologers, setAstrologers] = useState<Astrologer[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const data = await apiClient.get<ApiAstrologer[]>(ENDPOINTS.ASTROLOGERS.LIST);
        if (!cancelled) {
          const mapped = data.map(mapApiAstrologer);
          setAstrologers(mapped.slice(0, 4));
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load experts.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="relative w-full py-12 md:py-16 lg:py-24 bg-[#FFFDF9] overflow-hidden">
      <div className="w-full max-w-7xl mx-auto px-4 md:px-8 lg:px-16 xl:px-24">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 md:mb-12">
          <div className="max-w-2xl overflow-hidden break-words">
            <span className="text-[#C8A04A] font-poppins text-[11px] font-semibold uppercase tracking-widest mb-3 block">
              TOP RATED CONSULTANTS
            </span>
            <h2 className="font-playfair text-2xl md:text-3xl lg:text-4xl leading-tight text-[#1E1A16]">
              Consult With Our Handpicked Experts
            </h2>
          </div>
          <div className="mt-4 md:mt-0 flex items-center gap-6">
            {/* Navigation Arrows (Decorative) */}
            <div className="hidden lg:flex gap-3">
              <button className="w-10 h-10 rounded-full border border-[#E5E7EB] bg-white flex items-center justify-center text-[#1E1A16] hover:bg-[#1E1A16] hover:text-white transition-colors" aria-label="Previous">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button className="w-10 h-10 rounded-full border border-[#E5E7EB] bg-white flex items-center justify-center text-[#1E1A16] hover:bg-[#1E1A16] hover:text-white transition-colors" aria-label="Next">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
            
            <Link 
              href={ROUTES.CHAT} 
              className="hidden md:block font-poppins text-[#1E1A16] text-[12px] uppercase tracking-wider hover:text-[#C8A04A] transition-all font-medium"
            >
              VIEW ALL EXPERTS &rarr;
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="w-full">
                <AstrologerCardSkeleton key={i} />
              </div>
            ))
          ) : error ? (
            <div className="col-span-1 md:col-span-2 lg:col-span-4 p-8 text-center text-rose-600 bg-rose-50 rounded-xl border border-rose-200 w-full font-inter text-sm">
              Failed to load experts: {error}
            </div>
          ) : astrologers.length === 0 ? (
            <div className="col-span-1 md:col-span-2 lg:col-span-4 p-8 text-center text-[#6B5F52] bg-[#FFFDF9] rounded-xl border border-[#E6D3A3]/30 w-full font-inter text-sm">
              No experts are currently available. Please try again later.
            </div>
          ) : (
            astrologers.map((astrologer, index) => (
              <motionFramer.div
                key={astrologer.id}
                custom={index}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.2 }}
                variants={fadeUpVariant}
                className="w-full"
              >
                <AstrologerCard astrologer={astrologer} mode="chat" className="h-full border-[#E6D3A3]/30 bg-white" />
              </motionFramer.div>
            ))
          )}
        </div>
        
        <div className="mt-6 md:hidden">
          <Link 
            href={ROUTES.CHAT} 
            className="font-poppins text-[#1E1A16] text-[12px] uppercase tracking-wider hover:text-[#C8A04A] transition-all block font-medium"
          >
            VIEW ALL EXPERTS &rarr;
          </Link>
        </div>
      </div>
    </section>
  );
}
