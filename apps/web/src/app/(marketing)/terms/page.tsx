import Link from "next/link";
import { ROUTES } from "@/lib/constants/routes";
import { ArrowLeft, Clock, ShieldCheck, Scale } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms & Conditions | Time Space & Planets",
  description: "Terms and conditions for Time Space & Planets.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-cream">
      {/* Hero Section */}
      <section className="bg-gradient-navy text-white pt-[125px] pb-16 lg:pt-[140px] relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gold via-transparent to-transparent" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-gold/10 border border-gold/20 rounded-full px-4 py-1.5 mb-6">
            <Clock className="w-3.5 h-3.5 text-gold" />
            <span className="text-gold text-xs font-semibold uppercase tracking-[0.2em] font-poppins">
              Coming Soon
            </span>
          </div>
          <h1 className="font-heading text-4xl md:text-5xl font-bold tracking-tight mb-4 text-gradient-gold">
            Terms & Conditions
          </h1>
          <p className="text-cream/80 max-w-2xl mx-auto text-sm md:text-base font-inter leading-relaxed">
            We are currently updating our terms of service and conditions to better serve you.
          </p>
        </div>
      </section>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Coming Soon Notice */}
        <div className="bg-white rounded-2xl border border-border p-10 shadow-card text-center">
          <Scale className="w-10 h-10 text-gold mx-auto mb-4 opacity-60" />
          <h2 className="font-heading text-xl font-bold text-dark mb-3">
            Legal Terms Coming Soon
          </h2>
          <p className="text-sm text-paragraph max-w-lg mx-auto mb-6 leading-relaxed">
            Our legal team is finalizing the Terms & Conditions. The comprehensive document detailing our service agreement will be published here shortly.
          </p>
          <Link
            href={ROUTES.HOME}
            className="inline-flex items-center gap-2 text-sm font-semibold text-navy hover:text-gold transition-colors font-poppins"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
