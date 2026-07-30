import Link from "next/link";
import { ROUTES } from "@/lib/constants/routes";
import { ArrowLeft, Clock, Sparkles, HelpCircle } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FAQs | Time Space & Planets",
  description:
    "Frequently asked questions about astrology consultations, Vastu services, and the TSP platform. Our FAQ page is coming soon.",
};

const PLACEHOLDER_FAQS = [
  {
    q: "What services does TSP offer?",
    a: "We provide premium Vedic astrology consultations, Kundli analysis, Vastu Shastra guidance, horoscope readings, and strategic astrology for business leaders.",
  },
  {
    q: "How do I book a consultation?",
    a: "You can book a session through our 'Book a Session' button. Choose your preferred astrologer, select a time slot, and complete the booking in minutes.",
  },
  {
    q: "Are the consultations confidential?",
    a: "Absolutely. All consultations are fully confidential. We follow strict privacy policies to protect your personal information and birth details.",
  },
  {
    q: "What payment methods do you accept?",
    a: "We accept all major payment methods including UPI, credit/debit cards, and net banking through secure payment gateways.",
  },
];

export default function FaqPage() {
  return (
    <div className="min-h-screen bg-cream">
      {/* Hero Section */}
      <section className="bg-gradient-navy text-white pt-[125px] pb-16 lg:pt-[140px] relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gold via-transparent to-transparent" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-gold/10 border border-gold/20 rounded-full px-4 py-1.5 mb-6">
            <Clock className="w-3.5 h-3.5 text-gold" />
            <span className="text-gold text-xs font-semibold uppercase tracking-[0.2em] font-poppins">
              More Questions Coming Soon
            </span>
          </div>
          <h1 className="font-heading text-4xl md:text-5xl font-bold tracking-tight mb-4 text-gradient-gold">
            Frequently Asked Questions
          </h1>
          <p className="text-cream/80 max-w-2xl mx-auto text-sm md:text-base font-inter leading-relaxed">
            Find answers to common questions about our astrology services,
            consultations, and platform features.
          </p>
        </div>
      </section>

      {/* FAQ List */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="space-y-4 mb-12">
          {PLACEHOLDER_FAQS.map((faq, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-border p-6 shadow-card hover:shadow-card-hover transition-all duration-300"
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-gold/10 flex items-center justify-center shrink-0 mt-0.5">
                  <HelpCircle className="w-4 h-4 text-gold" />
                </div>
                <div>
                  <h3 className="font-heading text-sm font-bold text-dark mb-2">
                    {faq.q}
                  </h3>
                  <p className="text-xs text-paragraph leading-relaxed font-poppins">
                    {faq.a}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* More FAQs Coming */}
        <div className="bg-white rounded-2xl border border-border p-10 shadow-card text-center">
          <Sparkles className="w-10 h-10 text-gold mx-auto mb-4 opacity-60" />
          <h2 className="font-heading text-xl font-bold text-dark mb-3">
            More FAQs Coming Soon
          </h2>
          <p className="text-sm text-paragraph max-w-lg mx-auto mb-6 leading-relaxed">
            We&apos;re compiling a comprehensive FAQ section to address all your
            questions. Have a specific query? Reach out to us directly.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href={ROUTES.HOME}
              className="inline-flex items-center gap-2 text-sm font-semibold text-navy hover:text-gold transition-colors font-poppins"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
            <a
              href="mailto:contact@timespaceplanets.com"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-[#C8A04A] to-[#A6832E] text-white px-5 py-2 rounded-full text-xs font-semibold hover:from-[#D4AC5A] hover:to-[#B8933E] shadow-[0_2px_12px_rgba(200,160,74,0.20)] transition-all duration-300 font-poppins"
            >
              Email Us
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
