"use client";

import Link from "next/link";
import Image from "next/image";
import { type ServiceDefinition, type ServicePlan } from "@/lib/data/service-catalog";
import { ArrowLeft, Home as HomeIcon } from "lucide-react";
import PricingCard from "@/features/home/components/PricingCard";

interface HomeVastuPageProps {
  service: ServiceDefinition;
  details: any;
}

export default function HomeVastuPage({ service, details }: HomeVastuPageProps) {
  return (
    <div className="bg-[#FAF7F2] min-h-screen text-[#2D2823] relative font-inter">
      
      {/* Top Nav */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 relative z-20">
        <Link href="/solutions" className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-[#9A7D5E] hover:text-[#7A5D3E] transition-colors font-poppins">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Solutions
        </Link>
      </div>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24 relative z-10">
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto space-y-8 mb-16">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#E8DDD1]">
            <HomeIcon className="w-5 h-5 text-[#9A7D5E]" />
          </div>
          
          <h1 className="font-heading text-5xl sm:text-6xl lg:text-7xl font-semibold text-[#1A1816] tracking-tight">
            {service.name}
          </h1>

          <div className="max-w-2xl mx-auto space-y-4">
             <p className="font-tiro-sanskrit text-2xl italic text-[#9A7D5E] tracking-wide">
              "गृहं तु रमास्पदं शान्तिदं सुखवर्धनम्।"
            </p>
            <p className="text-[10px] uppercase tracking-widest text-[#9A7D5E] font-poppins font-medium">
              A home should be the abode of prosperity, giving peace and increasing happiness.
            </p>
          </div>

          <p className="text-[#645C53] text-sm md:text-base leading-relaxed max-w-2xl mx-auto font-light">
            {details.importance}
          </p>

          <div className="flex items-center justify-center gap-6 pt-6">
             <Link href={`/book?service=${service.id}`} className="bg-[#1A1816] text-white px-10 py-4 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-[#3D352F] hover:shadow-lg transition-all font-poppins">
              Request Consultation
            </Link>
          </div>
        </div>

        {/* Feature Image Area */}
        <div className="relative w-full max-w-5xl mx-auto aspect-[16/9] lg:aspect-[21/9] rounded-3xl overflow-hidden shadow-2xl border border-[#E8DDD1]">
          <Image
            src="/images/home-vastu-premium.jpg"
            alt="Premium Residential Vastu"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
          
          <div className="absolute bottom-8 left-8 right-8 flex justify-between items-end">
             <div className="bg-white/90 backdrop-blur px-6 py-4 rounded-2xl max-w-sm">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#9A7D5E] font-poppins block mb-1">Harmony</span>
                <p className="text-sm text-[#2D2823] font-medium">Aligning the five elements with your living space to cultivate peace and health.</p>
             </div>
          </div>
        </div>
      </section>

      {/* Structural Highlights */}
      <section className="bg-[#F3EFE9] py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
           <div className="text-center mb-16">
             <h2 className="font-heading text-3xl font-medium text-[#1A1816]">The Foundations of a Harmonious Home</h2>
           </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {details.importancePoints.map((point: string, idx: number) => (
              <div key={idx} className="bg-white rounded-3xl p-8 shadow-sm border border-[#E8DDD1] text-center hover:-translate-y-1 transition-transform duration-300">
                <div className="w-12 h-12 rounded-full bg-[#FAF7F2] border border-[#E8DDD1] mx-auto flex items-center justify-center mb-6">
                  <span className="text-sm font-bold text-[#9A7D5E] font-poppins">0{idx+1}</span>
                </div>
                <p className="text-[13px] text-[#645C53] leading-relaxed">
                  {point}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Grid */}
      <section id="plans" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32">
        <div className="text-center max-w-2xl mx-auto mb-20 space-y-4">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#9A7D5E] font-poppins">Service Scopes</span>
          <h2 className="font-heading text-4xl lg:text-5xl font-medium tracking-tight">Consultation Plans</h2>
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
                price={plan.priceLabel}
                features={plan.features}
                variant={isFeatured ? "dark" : "default"}
                cta={plan.ctaText}
                onBook={() => window.location.href = `/book?service=${service.id}&plan=${plan.slug}`}
              />
            );
          })}
        </div>
      </section>
    </div>
  );
}
