"use client";

import Link from "next/link";
import Image from "next/image";
import { type ServiceDefinition, type ServicePlan } from "@/lib/data/service-catalog";
import { ArrowLeft, ArrowRight } from "lucide-react";
import PricingCard from "@/features/home/components/PricingCard";

interface OfficeVastuPageProps {
  service: ServiceDefinition;
  details: any;
}

export default function OfficeVastuPage({ service, details }: OfficeVastuPageProps) {
  return (
    <div className="bg-[#FDF9F3] min-h-screen text-[#1A1816] relative font-inter">
      {/* Subtle Premium Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

      {/* Top Nav */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 relative z-20">
        <Link href="/solutions" className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.15em] text-[#8B6914] hover:text-[#1A1A1A] transition-colors font-poppins bg-white/40 px-4 py-2 rounded-full border border-[#E6D3A3]/40 backdrop-blur-md">
          <ArrowLeft className="w-3.5 h-3.5" /> Return to Solutions
        </Link>
      </div>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-8 items-center">

          {/* Left Content */}
          <div className="space-y-10 order-2 lg:order-1">
            <div className="space-y-5">
              <div className="inline-flex items-center gap-3">
                <span className="w-8 h-[1px] bg-[#C8A04A]" />
                <span className="text-[10px] font-bold tracking-[0.25em] text-[#C8A04A] font-poppins uppercase">
                  Workspace Optimization
                </span>
              </div>
              <h1 className="font-heading text-5xl sm:text-6xl lg:text-[5rem] font-medium leading-[1.05] tracking-tight">
                {service.name}
              </h1>
            </div>

            <p className="text-[#6B5F52] text-sm md:text-base leading-relaxed max-w-lg font-light">
              {details.importance}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link href={`/book?service=${service.id}`} className="inline-flex items-center justify-center gap-3 bg-[#1E1A16] text-white px-8 py-4 rounded-full text-xs font-bold uppercase tracking-[0.15em] hover:bg-[#C8A04A] transition-colors font-poppins group">
                Begin Transformation
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <a href="#plans" className="inline-flex items-center justify-center gap-3 bg-[#FDF9F3] border border-[#C8A04A]/30 text-[#8B6914] px-8 py-4 rounded-full text-xs font-bold uppercase tracking-[0.15em] hover:bg-[#C8A04A]/10 transition-colors font-poppins">
                View Scopes
              </a>
            </div>

            {/* Quote block */}
            <div className="mt-12 pt-8 border-t border-[#E6D3A3]/40 flex gap-6 items-start">
              <div className="text-4xl text-[#C8A04A] font-tiro-sanskrit leading-none opacity-50">"</div>
              <div>
                <p className="font-tiro-sanskrit text-lg italic text-[#8B6914] tracking-wide mb-2">
                  "कर्मण्येवाधिकारस्ते मा फलेषु कदाचन।"
                </p>
                <p className="text-[10px] uppercase tracking-widest text-[#C8A04A] font-poppins font-medium">
                  Optimize your space for action, and success will naturally follow.
                </p>
              </div>
            </div>
          </div>

          {/* Right Imagery */}
          <div className="order-1 lg:order-2 relative lg:h-[600px] flex items-center justify-center lg:justify-end">
            <div className="relative w-full max-w-[480px] aspect-[4/3] lg:aspect-auto lg:h-[520px] rounded-[2rem] overflow-hidden shadow-[0_20px_80px_rgba(200,160,74,0.15)] border border-[#E6D3A3]/40">
              <Image
                src="/images/premium-office.jpg"
                alt="Premium Office Workspace"
                fill
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#FDF9F3]/60 via-transparent to-transparent" />
            </div>

            {/* Overlay detail card */}
            <div className="absolute -bottom-8 lg:bottom-12 left-4 lg:-left-12 bg-white/90 backdrop-blur-xl p-6 rounded-2xl border border-[#E6D3A3]/40 shadow-xl max-w-[280px]">
              <div className="flex items-center gap-4 mb-3">
                <div className="w-1.5 h-1.5 rounded-full bg-[#C8A04A] animate-pulse" />
                <span className="text-[10px] uppercase tracking-[0.2em] text-[#8B6914] font-bold font-poppins">Focus Zones</span>
              </div>
              <p className="text-xs text-[#4A4A4A] leading-relaxed font-medium">
                Strategic placement of key personnel to enhance productivity and decision-making clarity.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* Structural Highlights */}
      <section className="border-y border-[#E6D3A3]/30 py-24 bg-[#FFFDF9]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-16">
            {details.importancePoints.map((point: string, idx: number) => (
              <div key={idx} className="group cursor-default">
                <span className="text-5xl font-heading text-[#C8A04A]/10 group-hover:text-[#C8A04A]/30 transition-colors block mb-4">
                  0{idx + 1}
                </span>
                <p className="text-sm text-[#6B5F52] leading-relaxed font-light group-hover:text-[#1A1A1A] transition-colors">
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
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#C8A04A] font-poppins">Scope Matrix</span>
          <h2 className="font-heading text-4xl lg:text-5xl font-medium tracking-tight text-[#1A1A1A]">Select Your Blueprint</h2>
        </div>

        <div className={`grid gap-8 max-w-5xl mx-auto ${service.plans.length === 1 ? "grid-cols-1 max-w-md" :
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
