import Link from "next/link";
import { ROUTES } from "@/lib/constants/routes";
import { ArrowLeft, Clock, Sparkles, Gem, Star, Zap } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing Plans | Time Space & Planets",
  description:
    "Explore premium astrology consultation plans and pricing. Our pricing page is launching soon.",
};

export default function PricingPage() {
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
            Pricing Plans
          </h1>
          <p className="text-cream/80 max-w-2xl mx-auto text-sm md:text-base font-inter leading-relaxed">
            We&apos;re finalising exclusive consultation plans tailored for every need —
            from personal guidance to enterprise-level strategic astrology.
          </p>
        </div>
      </section>

      {/* Placeholder Cards */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {[
            { icon: Star, name: "Starter", desc: "Personal horoscope readings and basic consultations" },
            { icon: Gem, name: "Premium", desc: "In-depth Kundli analysis, Vastu guidance, and priority support" },
            { icon: Zap, name: "Enterprise", desc: "Strategic astrology for businesses, teams, and leadership" },
          ].map((plan) => (
            <div
              key={plan.name}
              className="bg-white rounded-2xl border border-border p-8 shadow-card text-center group hover:shadow-card-hover transition-all duration-300 relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-gold/40 via-gold to-gold/40 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="w-14 h-14 rounded-2xl bg-navy/5 flex items-center justify-center mx-auto mb-5 group-hover:bg-gold/10 transition-colors">
                <plan.icon className="w-6 h-6 text-navy group-hover:text-gold transition-colors" />
              </div>
              <h3 className="font-heading text-lg font-bold text-dark mb-2">{plan.name}</h3>
              <p className="text-xs text-paragraph font-poppins leading-relaxed mb-6">
                {plan.desc}
              </p>
              <div className="text-2xl font-bold text-navy/20 font-heading">—</div>
              <p className="text-[10px] text-muted uppercase tracking-widest mt-2 font-poppins">
                Price coming soon
              </p>
            </div>
          ))}
        </div>

        {/* Coming Soon Notice */}
        <div className="bg-white rounded-2xl border border-border p-10 shadow-card text-center">
          <Sparkles className="w-10 h-10 text-gold mx-auto mb-4 opacity-60" />
          <h2 className="font-heading text-xl font-bold text-dark mb-3">
            Detailed Pricing Launching Soon
          </h2>
          <p className="text-sm text-paragraph max-w-lg mx-auto mb-6 leading-relaxed">
            Our team is curating flexible pricing options to ensure every seeker
            gets access to premium astrological guidance. Check back soon!
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
