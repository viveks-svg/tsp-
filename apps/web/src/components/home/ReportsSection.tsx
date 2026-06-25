"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image"; // ⚡ Added Next.js Image import
import { ReportCard } from "@/types/home";

const fadeInRightVariant = {
  hidden: { opacity: 0, x: 20 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { delay: i * 0.1, duration: 0.5 }
  })
};

// 🛠️ Fixed image placeholder extensions and names to exactly match your sidebar structure
const reports: ReportCard[] = [
  { title: "Astro SWOT Analysis", price: 1999, slug: "astro-swot", imagePlaceholder: "/images/vastu.png" },
  { title: "Career Blueprint Report", price: 2999, slug: "career-blueprint", imagePlaceholder: "/images/career-blueprint.png" },
  { title: "Business Alignment", price: 6999, slug: "business-alignment", imagePlaceholder: "/images/business-alignment.png" },
  { title: "Relationship Analysis", price: 2499, slug: "relationship-analysis", imagePlaceholder: "/images/relationship.png" },
  { title: "Annual Forecast Report", price: 2499, slug: "annual-forecast", imagePlaceholder: "/images/annual.png" }
];

export default function ReportsSection() {
  return (
    <section className="w-full bg-gradient-to-b from-[#2E2740] via-[#1A1730] to-[#12101F] py-20 md:py-28 overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-[1400px]">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 md:mb-14">
          <div className="max-w-2xl">
            <span className="text-[#F6A000] font-poppins text-[11px] font-semibold uppercase tracking-[0.28em] mb-3 block">
              Premium Astrology Reports
            </span>
            <h2 className="font-playfair text-[28px] md:text-[38px] leading-tight text-white">
              In-Depth Reports For Powerful Insights
            </h2>
          </div>

          <div className="mt-4 md:mt-0 hidden md:block">
            <Link
              href="/reports"
              className="font-poppins text-[#F6A000] text-[12px] uppercase tracking-wider hover:underline transition-all"
            >
              View All Reports →
            </Link>
          </div>
        </div>

        <div className="flex overflow-x-auto pb-8 -mx-4 px-4 lg:mx-0 lg:px-0 lg:pb-0 lg:grid lg:grid-cols-5 gap-4 md:gap-5 snap-x snap-mandatory scrollbar-hide">
          {reports.map((report, index) => (
            <motion.div
              key={index}
              custom={index}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              variants={fadeInRightVariant}
              className="group min-w-[250px] md:min-w-[230px] lg:min-w-0 flex-shrink-0 snap-start rounded-[22px] overflow-hidden border border-[#332D68]/55 shadow-[0_20px_60px_rgba(0,0,0,0.24)] hover:-translate-y-2 hover:shadow-[0_30px_80px_rgba(0,0,0,0.35)] transition-all duration-500 bg-[#11102A] h-[390px] md:h-[410px]"
            >
              {/* Top visual area with integrated Next.js Image component */}
              <div className="relative h-[57%] w-full overflow-hidden bg-gradient-to-br from-[#332D73] via-[#241F56] to-[#15142F]">

                <Image
                  src={report.imagePlaceholder || ""}
                  alt={report.title}
                  fill
                  sizes="(max-w-768px) 250px, (max-w-1024px) 230px, 250px"
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                  priority={index < 2} // Optimizes loading speeds for above-the-fold elements
                />

                {/* Overlays applied directly on top of the image container */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60" />

                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-10">
                  <span className="inline-flex rounded-full border border-white/20 bg-black/45 backdrop-blur-md px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white">
                    Detailed Report
                  </span>
                </div>

                <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-[#11102A] to-transparent z-10" />
              </div>

              {/* Bottom content area */}
              <div className="h-[43%] bg-gradient-to-b from-[#FFFEFB] to-[#F4EEE3] px-4 py-4 md:px-5 md:py-5 flex flex-col justify-between">
                <div>
                  <h3 className="font-playfair text-[16px] md:text-[17px] text-[#1E1A16] font-semibold leading-tight line-clamp-2">
                    {report.title}
                  </h3>

                  <p className="mt-2 text-[11px] md:text-[12px] leading-relaxed text-[#6F665B] line-clamp-2">
                    Personalized insights designed to bring clarity, direction, and practical guidance.
                  </p>

                  <div className="mt-4 h-px w-full bg-gradient-to-r from-transparent via-[#E2C15D] to-transparent" />
                </div>

                <div className="flex items-end justify-between gap-3 mt-auto">
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase tracking-[0.22em] text-[#8A8274] mb-1">
                      Starting at
                    </span>
                    <span className="font-playfair text-[22px] md:text-[24px] text-[#C99411] font-bold leading-none">
                      ₹{report.price.toLocaleString("en-IN")}
                    </span>
                  </div>

                  <Link
                    href={`/reports/${report.slug}`}
                    className="inline-flex items-center justify-center rounded-full bg-[#0F1023] px-4 py-2 text-[11px] font-semibold text-white whitespace-nowrap shrink-0 transition-all duration-300 hover:bg-[#C99411] hover:text-black shadow-[0_8px_24px_rgba(15,16,35,0.25)]"
                  >
                    Get Report
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-6 md:hidden">
          <Link
            href="/reports"
            className="font-poppins text-[#F6A000] text-[12px] uppercase tracking-wider hover:underline transition-all block"
          >
            View All Reports →
          </Link>
        </div>
      </div>
    </section>
  );
}
