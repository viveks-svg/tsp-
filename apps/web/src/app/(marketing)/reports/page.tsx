import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Premium Reports | Time Space & Planets",
  description: "In-depth astrological and Vastu reports by Dr. Pradeep Sharma — Astro SWOT, Career Blueprint, Business Alignment, and more.",
};

const reports = [
  {
    title: "Astro SWOT Analysis",
    description: "Comprehensive strengths, weaknesses, opportunities, and threats mapped through your birth chart.",
    price: "₹1,999",
    slug: "astro-swot",
  },
  {
    title: "Career Blueprint Report",
    description: "Detailed career direction analysis with Dasha-based timing for optimal career moves.",
    price: "₹2,999",
    slug: "career-blueprint",
  },
  {
    title: "Business Alignment Report",
    description: "Strategic alignment report for your business — partnerships, timing, and directional analysis.",
    price: "₹6,999",
    slug: "business-alignment",
  },
  {
    title: "Relationship Analysis",
    description: "Compatibility analysis and relationship timing insights for lasting partnerships.",
    price: "₹2,499",
    slug: "relationship-analysis",
  },
  {
    title: "Annual Forecast Report",
    description: "Month-by-month forecast for the coming year — finances, career, health, and relationships.",
    price: "₹2,499",
    slug: "annual-forecast",
  },
];

export default function ReportsPage() {
  return (
    <div className="min-h-screen bg-[#F7F4EE]">
      <section className="relative pt-32 pb-16 lg:pt-40 lg:pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#22201C] to-[#1A1815]" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-block text-[#C8A04A] text-xs font-semibold tracking-[0.25em] uppercase mb-4 font-poppins">
            Reports
          </span>
          <h1 className="font-heading text-4xl sm:text-5xl font-bold text-white leading-tight mb-4">
            Premium Reports
          </h1>
          <p className="text-white/50 text-base max-w-2xl mx-auto font-inter">
            In-depth, personalised reports delivered as signed PDFs within 7 working days.
          </p>
        </div>
      </section>

      <section className="py-12 lg:py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {reports.map((report) => (
              <div
                key={report.slug}
                className="bg-white rounded-2xl p-6 border border-[#EFEBE1] hover:shadow-md hover:border-[#C8A04A]/20 transition-all duration-300 flex flex-col"
              >
                <h3 className="font-heading text-lg font-bold text-[#1E1A16] mb-2">{report.title}</h3>
                <p className="text-sm text-[#6B5F52] mb-4 leading-relaxed flex-grow">{report.description}</p>
                <div className="flex items-center justify-between mt-auto">
                  <span className="text-lg font-bold text-[#1E1A16]">{report.price}</span>
                  <Link
                    href={`/book?service=${report.slug}`}
                    className="inline-flex items-center gap-1 text-sm font-semibold text-[#C8A04A] hover:text-[#8B6914] transition-colors"
                  >
                    Order Report →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
