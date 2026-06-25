"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { AstrologerCard } from "@/types/home";

const fadeUpVariant = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.12, duration: 0.5, ease: "easeOut" as const }
  })
};

const astrologers: AstrologerCard[] = [
  {
    id: "1",
    name: "Dr. Aniket Rao",
    speciality: "Vedic Astrology",
    experience: "12+ Yrs Exp.",
    rating: 4.8,
    reviewCount: 136,
    languages: ["Hindi", "English"],
    avatarUrl: "/astrologers/aniket.jpg"
  },
  {
    id: "2",
    name: "Acharya Meera",
    speciality: "Tarot & Astrology",
    experience: "8+ Yrs Exp.",
    rating: 4.8,
    reviewCount: 180,
    languages: ["Hindi"],
    avatarUrl: "/astrologers/meera.jpg"
  },
  {
    id: "3",
    name: "Dr. Raj Sharma",
    speciality: "KP Astrology",
    experience: "15+ Yrs Exp.",
    rating: 4.9,
    reviewCount: 214,
    languages: ["Hindi", "English"],
    avatarUrl: "/astrologers/raj.jpg"
  },
  {
    id: "4",
    name: "Acharya Pooja",
    speciality: "Vedic Astrology",
    experience: "10+ Yrs Exp.",
    rating: 4.8,
    reviewCount: 130,
    languages: ["Hindi"],
    avatarUrl: "/astrologers/pooja.jpg"
  }
];

// 1x1 gray pixel for placeholder
const blurDataURL = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkqAcAAIUAgUW0RjgAAAAASUVORK5CYII=";

export default function AstrologersSection() {
  return (
    <section className="w-full bg-cream py-16 md:py-24 overflow-hidden relative">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-[1400px]">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 md:mb-14">
          <div className="max-w-2xl">
            <span className="text-gold font-poppins text-[11px] font-semibold uppercase tracking-widest mb-3 block">
              TOP RATED ASTROLOGERS
            </span>
            <h2 className="font-playfair text-[28px] md:text-[38px] leading-tight text-navy">
              Consult With Our Handpicked Experts
            </h2>
          </div>
          <div className="mt-4 md:mt-0 flex items-center gap-6">
            {/* Desktop Navigation Arrows Placeholder */}
            <div className="hidden lg:flex gap-3">
              <button className="w-10 h-10 rounded-full border border-[#E5E7EB] bg-white flex items-center justify-center text-navy hover:bg-navy hover:text-white transition-colors" aria-label="Previous">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button className="w-10 h-10 rounded-full border border-[#E5E7EB] bg-white flex items-center justify-center text-navy hover:bg-navy hover:text-white transition-colors" aria-label="Next">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
            
            <Link 
              href="/astrologers" 
              className="hidden md:block font-poppins text-navy text-[12px] uppercase tracking-wider hover:underline transition-all font-medium"
            >
              VIEW ALL ASTROLOGERS &rarr;
            </Link>
          </div>
        </div>

        <div className="flex overflow-x-auto pb-8 -mx-4 px-4 lg:mx-0 lg:px-0 lg:pb-0 lg:grid lg:grid-cols-4 gap-4 md:gap-6 snap-x snap-mandatory scrollbar-hide">
          {astrologers.map((astrologer, index) => (
            <motion.div
              key={astrologer.id}
              custom={index}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              variants={fadeUpVariant}
              className="min-w-[260px] md:min-w-[230px] lg:min-w-0 flex-shrink-0 snap-start bg-white rounded-[16px] p-6 flex flex-col items-center text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(7,27,141,0.12)] shadow-[0_4px_24px_rgba(7,27,141,0.08)]"
            >
              <div className="w-[80px] h-[80px] rounded-full border-2 border-gold p-0.5 mb-4 relative overflow-hidden bg-gray-100 shrink-0">
                <div className="w-full h-full rounded-full overflow-hidden relative">
                  {/* Using next/image with a fallback generic icon if image fails to load or path is absent */}
                  <Image
                    src={astrologer.avatarUrl}
                    alt={astrologer.name}
                    fill
                    sizes="80px"
                    className="object-cover"
                    placeholder="blur"
                    blurDataURL={blurDataURL}
                    onError={(e) => {
                      // Simple fallback to hide broken image and show background
                      (e.currentTarget as any).style.opacity = '0';
                    }}
                  />
                  <svg className="absolute inset-0 w-full h-full text-gray-400 p-2 -z-10" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
              </div>

              <h3 className="font-playfair text-[17px] text-navy font-semibold mb-1">
                {astrologer.name}
              </h3>
              
              <p className="font-inter text-[12px] text-navy/60 mb-1">
                {astrologer.speciality}
              </p>
              
              <p className="font-inter text-[12px] text-[#6B7280] mb-3">
                {astrologer.experience}
              </p>

              <div className="flex items-center gap-1 mb-4">
                <svg className="w-3.5 h-3.5 text-gold" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span className="font-inter text-[12px] font-medium text-[#1A1A2E]">
                  {astrologer.rating}
                </span>
                <span className="font-inter text-[12px] text-[#6B7280]">
                  ({astrologer.reviewCount})
                </span>
              </div>

              <div className="flex flex-wrap justify-center gap-2 mb-5">
                {astrologer.languages.map((lang) => (
                  <span 
                    key={lang}
                    className="bg-cream text-navy font-inter text-[11px] px-2.5 py-0.5 rounded-full"
                  >
                    {lang}
                  </span>
                ))}
              </div>

              <div className="w-full mt-auto flex flex-col gap-2">
                <button className="w-full bg-navy hover:bg-[#03115D] text-white font-poppins text-[12px] py-2.5 rounded-[8px] transition-colors font-medium">
                  Chat Now
                </button>
                <button className="w-full bg-white border border-navy text-navy hover:bg-navy/5 font-poppins text-[12px] py-2.5 rounded-[8px] transition-colors font-medium">
                  Call Now
                </button>
              </div>
            </motion.div>
          ))}
        </div>
        
        <div className="mt-6 md:hidden">
          <Link 
            href="/astrologers" 
            className="font-poppins text-navy text-[12px] uppercase tracking-wider hover:underline transition-all block font-medium"
          >
            VIEW ALL ASTROLOGERS &rarr;
          </Link>
        </div>
      </div>
    </section>
  );
}
