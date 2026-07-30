import Link from "next/link";
import { ROUTES } from "@/lib/constants/routes";
import { Mail, Phone, MapPin, ArrowLeft, Clock, Sparkles } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us | Time Space & Planets",
  description:
    "Get in touch with the Time Space & Planets team. We're building something extraordinary — our contact page will be live soon.",
};

export default function ContactPage() {
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
            Contact Us
          </h1>
          <p className="text-cream/80 max-w-2xl mx-auto text-sm md:text-base font-inter leading-relaxed">
            We&apos;re preparing a dedicated contact experience for you. In the meantime,
            reach out to us directly via the channels below.
          </p>
        </div>
      </section>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Contact Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white rounded-2xl border border-border p-6 shadow-card text-center group hover:shadow-card-hover transition-all duration-300">
            <div className="w-12 h-12 rounded-xl bg-navy/5 flex items-center justify-center mx-auto mb-4 group-hover:bg-gold/10 transition-colors">
              <Mail className="w-5 h-5 text-navy group-hover:text-gold transition-colors" />
            </div>
            <h3 className="font-heading text-sm font-bold text-dark mb-2">Email Us</h3>
            <a
              href="mailto:contact@timespaceplanets.com"
              className="text-xs text-gold hover:underline font-poppins break-all"
            >
              contact@timespaceplanets.com
            </a>
          </div>

          <div className="bg-white rounded-2xl border border-border p-6 shadow-card text-center group hover:shadow-card-hover transition-all duration-300">
            <div className="w-12 h-12 rounded-xl bg-navy/5 flex items-center justify-center mx-auto mb-4 group-hover:bg-gold/10 transition-colors">
              <Phone className="w-5 h-5 text-navy group-hover:text-gold transition-colors" />
            </div>
            <h3 className="font-heading text-sm font-bold text-dark mb-2">Call Us</h3>
            <p className="text-xs text-paragraph font-poppins">Available during business hours</p>
          </div>

          <div className="bg-white rounded-2xl border border-border p-6 shadow-card text-center group hover:shadow-card-hover transition-all duration-300">
            <div className="w-12 h-12 rounded-xl bg-navy/5 flex items-center justify-center mx-auto mb-4 group-hover:bg-gold/10 transition-colors">
              <MapPin className="w-5 h-5 text-navy group-hover:text-gold transition-colors" />
            </div>
            <h3 className="font-heading text-sm font-bold text-dark mb-2">Visit Us</h3>
            <p className="text-xs text-paragraph font-poppins">Location details coming soon</p>
          </div>
        </div>

        {/* Coming Soon Notice */}
        <div className="bg-white rounded-2xl border border-border p-10 shadow-card text-center">
          <Sparkles className="w-10 h-10 text-gold mx-auto mb-4 opacity-60" />
          <h2 className="font-heading text-xl font-bold text-dark mb-3">
            Full Contact Page Coming Soon
          </h2>
          <p className="text-sm text-paragraph max-w-lg mx-auto mb-6 leading-relaxed">
            We&apos;re crafting a comprehensive contact page with an enquiry form,
            live chat support, and office details. Stay tuned!
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
