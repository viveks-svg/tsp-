"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { ReportCard } from "@/types/home";
import { useCart } from "@/providers/CartProvider";
import ReportsCarousel from "./ReportsCarousel";

const fadeInRightVariant = {
  hidden: { opacity: 0, x: 20 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { delay: i * 0.1, duration: 0.5 }
  })
};


const reports: ReportCard[] = [
  { title: "Astro SWOT Analysis", price: 3399, slug: "astro-swot", imagePlaceholder: "/images/01.png" },
  { title: "Career Blueprint Report", price: 3201, slug: "career-blueprint", imagePlaceholder: "/images/02.png" },
  { title: "Business Alignment", price: 5199, slug: "business-alignment", imagePlaceholder: "/images/03 (1).png" },
  { title: "Relationship Analysis", price: 2499, slug: "relationship-analysis", imagePlaceholder: "/images/04.png" },
  { title: "Annual Forecast Report", price: 3399, slug: "annual-forecast", imagePlaceholder: "/images/05.png" }
];

export default function ReportsSection() {
  const { addToCart } = useCart();

  const handleAddReport = (report: ReportCard) => {
    addToCart({
      id: report.slug,
      name: report.title,
      price: report.price,
      type: "report",
      image: report.imagePlaceholder,
      description: report.title,
    });
  };

  return (
    <section className="relative w-full bg-gradient-to-b from-[#2E2740] via-[#1A1730] to-[#12101F] py-12 md:py-16 lg:py-24 overflow-hidden">
      <div className="w-full max-w-7xl mx-auto px-4 md:px-8 lg:px-16 xl:px-24">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 md:mb-12">
          <div className="max-w-2xl overflow-hidden break-words">
            <span className="text-[#F6A000] font-poppins text-[11px] font-semibold uppercase tracking-[0.28em] mb-3 block">
              Premium Astrology Reports
            </span>
            <h2 className="font-playfair text-2xl md:text-3xl lg:text-4xl leading-tight text-white">
              In-Depth Reports For Powerful Insights
            </h2>
          </div>

          <div className="mt-4 md:mt-0 hidden md:block">
            <Link
              href="/reports"
              className="font-poppins border border-[#F6A000] border-[1px] rounded-[30px] p-2 text-[#F6A000] text-[12px] uppercase tracking-wider hover:underline transition-all"
            >
              View All Reports →
            </Link>
          </div>
        </div>

        <div className="mt-12 w-full">
          <ReportsCarousel reports={reports} onAddReport={handleAddReport} />
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
