import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About Dr. Pradeep Sharma | Time Space & Planets",
  description:
    "25+ years of Vedic wisdom, Vastu science, and strategic astrology. Dr. Pradeep Sharma helps leaders and individuals make aligned decisions.",
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#F7F4EE]">
      {/* Hero */}
      <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-28 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#22201C] to-[#1A1815]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(200,160,74,0.06)_0%,transparent_50%)]" />

        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <span className="inline-block text-[#C8A04A] text-xs font-semibold tracking-[0.25em] uppercase mb-4 font-poppins">
              About
            </span>
            <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
              Dr. Pradeep Sharma
            </h1>
            <p className="text-white/50 text-base lg:text-lg leading-relaxed font-inter">
              Vedic Advisor • Business Consultant • Vastu Expert
            </p>
          </div>
        </div>
      </section>

      {/* Bio */}
      <section className="py-16 lg:py-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
            <div className="lg:col-span-3 space-y-6">
              <h2 className="font-heading text-3xl font-bold text-[#1E1A16]">
                Integrating Ancient Wisdom with Modern Strategy
              </h2>
              <div className="space-y-4 text-[#6B5F52] text-base leading-relaxed font-inter">
                <p>
                  With over 25 years of practice, Dr. Pradeep Sharma has guided
                  500+ businesses and individuals through critical decisions using
                  a unique blend of Vedic astrology, Vastu Shastra, and modern
                  business strategy.
                </p>
                <p>
                  His approach is not about superstition — it&apos;s about spatial
                  intelligence, cosmic timing, and strategic alignment. Clients
                  include CEOs, founders, real estate developers, and professionals
                  across India and globally.
                </p>
                <p>
                  Every consultation is confidential, data-driven, and focused on
                  actionable outcomes. No generic predictions — only personalised
                  guidance backed by decades of expertise.
                </p>
              </div>
              <Link
                href="/book"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-[#C8A04A] to-[#A6832E] text-white px-7 py-3 rounded-full text-sm font-semibold hover:from-[#D4AC5A] hover:to-[#B8933E] shadow-[0_4px_24px_rgba(200,160,74,0.25)] transition-all duration-300"
              >
                Book a Consultation
              </Link>
            </div>

            <div className="lg:col-span-2 space-y-6">
              {[
                { value: "25+", label: "Years of Practice" },
                { value: "500+", label: "Business Audits" },
                { value: "98%", label: "Client Satisfaction" },
                { value: "3,000+", label: "Consultations" },
              ].map((stat) => (
                <div key={stat.label} className="bg-white rounded-xl p-5 border border-[#EFEBE1]">
                  <p className="font-heading text-3xl font-bold text-[#C8A04A]">{stat.value}</p>
                  <p className="text-sm text-[#6B5F52] mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
