"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { type ServiceDefinition, type ServicePlan } from "@/lib/data/service-catalog";
import { ArrowLeft, Check, Compass, Layers, Map, Ruler, ChevronDown } from "lucide-react";
import PricingCard from "@/features/home/components/PricingCard";
import VastuCompass from "./VastuCompass";

const faqs = [
  {
    question: "Can Vastu work for a rented office space?",
    answer: "Yes, our recommendations focus on micro-adjustments, internal placements, and energy corrections that do not require structural demolition or landlord approval."
  },
  {
    question: "Do I need to share floor plans before booking?",
    answer: "No, you don't need to share them before booking. Once you choose a plan, our team will coordinate with you to collect the necessary architectural layouts."
  },
  {
    question: "How long does the audit process take?",
    answer: "A standard comprehensive audit takes about 7 working days from the moment we receive all required documents and floor plans."
  },
  {
    question: "Is Business Vastu different from Home Vastu?",
    answer: "Absolutely. Home Vastu focuses on health, peace, and relationships. Business Vastu is entirely engineered around cash flow, employee productivity, and market dominance."
  },
  {
    question: "What if I don't see results?",
    answer: "Vastu is a science of energy alignment. While results can often be felt within weeks, full manifestation depends on the execution of our guidelines. We offer implementation support to ensure correct application."
  }
];

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b border-[#E6D3A3]/30">
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="w-full flex items-center justify-between py-6 text-left focus:outline-none group"
      >
        <span className="font-medium text-[#1A1A1A] group-hover:text-[#C8A04A] transition-colors">{question}</span>
        <ChevronDown className={`w-5 h-5 text-[#8B6914] transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />
      </button>
      <div className={`overflow-hidden transition-all duration-300 ${isOpen ? "max-h-40 pb-6 opacity-100" : "max-h-0 opacity-0"}`}>
        <p className="text-[#6B5F52] text-sm leading-relaxed">{answer}</p>
      </div>
    </div>
  );
}

interface BusinessVastuPageProps {
  service: ServiceDefinition;
  details: any;
}

export default function BusinessVastuPage({ service, details }: BusinessVastuPageProps) {
  return (
    <div className="bg-[#FDF9F3] min-h-screen text-[#1E1A16] relative">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 right-0 w-full h-[600px] bg-gradient-to-bl from-[#E6D3A3]/20 via-transparent to-transparent pointer-events-none" />

      {/* Back to Solutions bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 relative z-10">
        <Link href="/solutions" className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-[#8B6914] hover:text-[#C99411] transition-colors font-poppins">
          <ArrowLeft className="w-3 h-3" /> Back to Portfolio
        </Link>
      </div>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left: Text & Shloka */}
          <div className="lg:col-span-7 space-y-8">
            <div className="space-y-4">
              <span className="text-[10px] font-bold tracking-[0.2em] text-[#C8A04A] font-poppins uppercase block">
                Spatial Resonance Science
              </span>
              <h1 className="font-heading text-4xl sm:text-5xl lg:text-7xl font-bold leading-[1.08] tracking-tight">
                {service.name}
              </h1>
            </div>
            
            {/* Sanskrit Quote */}
            <div className="border-l-2 border-[#C8A04A]/60 pl-5 py-2 my-8 space-y-2 bg-white/40 backdrop-blur-sm rounded-r-xl p-4 shadow-[inset_1px_0_0_rgba(255,255,255,0.5)]">
              <p className="font-tiro-sanskrit text-xl italic text-[#8B6914] tracking-wide">
                &ldquo;वास्तुशास्त्रं प्रवक्ष्यामि लोकानां हितकाम्यया।&rdquo;
              </p>
              <p className="text-[10px] uppercase tracking-widest text-black/40 font-poppins font-semibold">
                — Vastu Shastra: Written for the prosperity of all operations
              </p>
            </div>

            <p className="text-[#6B5F52] text-sm md:text-base leading-relaxed max-w-2xl font-inter">
              {details.importance}
            </p>

            <div className="pt-6 flex flex-wrap items-center gap-6">
              <Link href={`/book?service=${service.id}`} className="bg-[#1E1A16] hover:bg-[#C8A04A] shadow-[0_4px_14px_rgba(0,0,0,0.1)] hover:shadow-[0_6px_20px_rgba(200,160,74,0.3)] text-white text-xs font-bold uppercase tracking-widest px-8 py-4 rounded-full transition-all font-poppins">
                Book Vetting
              </Link>
              <a href="#plans" className="text-xs font-bold uppercase tracking-widest text-[#8B6914] hover:underline font-poppins flex items-center gap-2">
                View Plans <span className="text-[16px]">↓</span>
              </a>
            </div>
          </div>

          {/* Right: Elegant Advisor Portrait cutout */}
          <div className="lg:col-span-5 relative flex justify-center">
            <div className="relative w-full max-w-[400px] aspect-[4/5] bg-gradient-to-tr from-[#E6D3A3]/20 to-[#FFFDF9] rounded-2xl overflow-hidden border border-[#E6D3A3]/40 p-4 shadow-2xl">
              <Image
                src="/images/dr-pradeep-sharma.png"
                alt="Dr. Pradeep Sharma"
                fill
                className="object-cover object-top p-1"
                priority
              />
            </div>
            {/* Floating badge */}
            <div className="absolute -bottom-6 -right-6 bg-white p-4 rounded-xl shadow-xl border border-[#E6D3A3]/30 flex items-center gap-4">
              <div className="w-12 h-12 bg-[#FDF9F3] rounded-full flex items-center justify-center">
                <span className="text-[#8B6914] font-bold font-heading text-xl">25+</span>
              </div>
              <div className="text-left">
                <p className="text-[10px] font-bold text-black uppercase tracking-widest font-poppins">Years of</p>
                <p className="text-[#6B5F52] text-xs font-inter">Vastu Expertise</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Cosmic Architecture Section */}
      <section className="bg-white border-y border-[#E6D3A3]/30 py-24 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            
            {/* Left: Compass Graphic */}
            <div className="bg-[#FDF9F3] rounded-[2rem] p-12 flex items-center justify-center border border-[#E6D3A3]/30 shadow-inner relative aspect-square max-w-[500px] mx-auto w-full">
              <VastuCompass />
            </div>

            {/* Right: Content */}
            <div className="space-y-8">
              <div className="space-y-4">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#C8A04A] font-poppins">The Science Behind The Space</span>
                <h2 className="font-heading text-4xl lg:text-5xl font-bold text-[#1A1816] leading-tight text-balance">
                  Vastu Is Architecture Engineered by the Cosmos
                </h2>
                <p className="text-[#6B5F52] text-sm md:text-base leading-relaxed">
                  Every direction holds a frequency. The North-East is the zone of knowledge and clarity. The South-West anchors stability and wealth retention. When your boardroom, finance cabin, and MD's desk align with these cosmic axes — decisions sharpen, deals close faster, and energy stops leaking.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white rounded-xl p-5 border border-[#E6D3A3]/40 shadow-sm hover:shadow-md transition-shadow">
                  <Compass className="w-5 h-5 text-[#C8A04A] mb-3" />
                  <h3 className="font-bold text-[#1E1A16] text-sm mb-1">Direction Science</h3>
                  <p className="text-xs text-[#6B5F52] leading-relaxed">Each of 8 directions governs a business function.</p>
                </div>
                <div className="bg-white rounded-xl p-5 border border-[#E6D3A3]/40 shadow-sm hover:shadow-md transition-shadow">
                  <Layers className="w-5 h-5 text-[#C8A04A] mb-3" />
                  <h3 className="font-bold text-[#1E1A16] text-sm mb-1">Five Element Theory</h3>
                  <p className="text-xs text-[#6B5F52] leading-relaxed">Balancing earth, water, fire, air & space in layout.</p>
                </div>
                <div className="bg-white rounded-xl p-5 border border-[#E6D3A3]/40 shadow-sm hover:shadow-md transition-shadow">
                  <Map className="w-5 h-5 text-[#C8A04A] mb-3" />
                  <h3 className="font-bold text-[#1E1A16] text-sm mb-1">Energy Mapping</h3>
                  <p className="text-xs text-[#6B5F52] leading-relaxed">Geopathic stress detection and neutralisation.</p>
                </div>
                <div className="bg-white rounded-xl p-5 border border-[#E6D3A3]/40 shadow-sm hover:shadow-md transition-shadow">
                  <Ruler className="w-5 h-5 text-[#C8A04A] mb-3" />
                  <h3 className="font-bold text-[#1E1A16] text-sm mb-1">Grid Alignment</h3>
                  <p className="text-xs text-[#6B5F52] leading-relaxed">Furniture, entrances & cabins on Vastu grid axes.</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Pricing Grid */}
      <section id="plans" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#C8A04A] font-poppins">Scope Matrix</span>
          <h2 className="font-heading text-4xl font-bold text-[#1A1A1A] tracking-tight text-balance">Select Scope & Plan</h2>
          <p className="font-inter text-sm font-medium text-[#8A8A8A] tracking-[0.1em] mt-4">
            Aligned for Greatness. Designed for Prosperity.
          </p>
        </div>

        <div className={`grid gap-8 max-w-5xl mx-auto ${
          service.plans.length === 1 ? "grid-cols-1 max-w-md" :
          service.plans.length === 2 ? "grid-cols-1 md:grid-cols-2 max-w-3xl" : "grid-cols-1 lg:grid-cols-3"
        }`}>
          {service.plans.map((plan: ServicePlan) => {
            const isFeatured = plan.variant === "featured";
            return (
              <PricingCard
                key={plan.slug}
                name={plan.name}
                subtitle={plan.tagline}
                description=""
                price=""
                features={plan.features}
                variant={isFeatured ? "dark" : "default"}
                cta={plan.ctaText}
                onBook={() => window.location.href = `/book?service=${service.id}&plan=${plan.slug}`}
              />
            );
          })}
        </div>
      </section>

      {/* FAQ Section */}
      <section className="bg-white py-24 border-t border-[#E6D3A3]/30">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 space-y-4">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#C8A04A] font-poppins">Frequently Asked Questions</span>
            <h2 className="font-heading text-3xl sm:text-4xl font-bold text-[#1A1A1A]">Have Questions? We Have Answers</h2>
          </div>
          <div className="space-y-2">
            {faqs.map((faq, idx) => (
              <FAQItem key={idx} question={faq.question} answer={faq.answer} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
