"use client";

import { use } from "react";
import { notFound, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  getServiceById,
  type ServiceDefinition,
  type ServicePlan,
} from "@/lib/data/service-catalog";
import { SOLUTION_DETAILS } from "@/lib/data/solutions-details";
import {
  Building2, Landmark, Factory, ShoppingBag, Hotel, Map, Laptop,
  Target, Handshake, TrendingUp, Type,
  Briefcase, Heart, Activity, Users,
  Home as HomeIcon, Building, Castle, HardHat,
  ChevronRight, ArrowLeft, Check, Sparkles,
  Phone, PenTool
} from "lucide-react";

import BusinessVastuPage from "@/features/solutions/components/BusinessVastuPage";
import OfficeVastuPage from "@/features/solutions/components/OfficeVastuPage";
import HomeVastuPage from "@/features/solutions/components/HomeVastuPage";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Building2, Landmark, Factory, ShoppingBag, Hotel, Map, Laptop,
  Target, Handshake, TrendingUp, Type,
  Briefcase, Heart, Activity, Users,
  Home: HomeIcon, Building, Castle, HardHat,
  Phone, PenTool
};

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } }
};

/* Custom Rotating Starburst Badge */
function StarburstBadge({ text }: { text: string }) {
  return (
    <div className="absolute -top-7 -right-7 w-20 h-20 flex items-center justify-center pointer-events-none select-none z-20">
      <div className="absolute w-full h-full animate-[spin_25s_linear_infinite]">
        <svg viewBox="0 0 100 100" className="w-full h-full text-rose-600 fill-current drop-shadow-[0_2px_6px_rgba(225,29,72,0.25)]">
          <polygon points="50,0 54,12 66,7 66,19 78,16 74,27 85,28 79,39 89,42 80,51 88,58 77,64 82,76 71,79 73,91 61,91 60,100 50,96 40,100 39,91 29,91 31,79 20,76 25,64 14,58 22,51 13,42 23,39 17,28 28,27 24,16 36,19 36,7 48,12" />
        </svg>
      </div>
      <span className="absolute text-[7px] font-bold tracking-widest text-white uppercase text-center px-1 font-poppins max-w-[58px] leading-tight select-none transform rotate-12">
        {text}
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. BUSINESS VASTU LAYOUT (Category: 'business')
// ─────────────────────────────────────────────────────────────────────────────
function BusinessVastuLayout({
  service,
  details,
}: {
  service: ServiceDefinition;
  details: any;
}) {
  return (
    <div className="bg-[#FDF9F3] min-h-screen text-[#1E1A16]">
      {/* Back to Solutions bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28">
        <Link href="/solutions" className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-[#8B6914] hover:text-[#C99411] transition-colors font-poppins">
          <ArrowLeft className="w-3 h-3" /> Back to Portfolio
        </Link>
      </div>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left: Text & Shloka */}
          <div className="lg:col-span-7 space-y-6">
            <span className="text-[10px] font-bold tracking-[0.2em] text-[#C8A04A] font-poppins uppercase block">
              Spatial Resonance Science
            </span>
            <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.08] tracking-tight">
              {service.name}
            </h1>
            
            {/* Sanskrit Quote */}
            <div className="border-l-2 border-[#C8A04A]/60 pl-4 py-1.5 my-6 space-y-1">
              <p className="font-tiro-sanskrit text-lg italic text-[#8B6914] tracking-wide">
                &ldquo;वास्तुशास्त्रं प्रवक्ष्यामि लोकानां हितकाम्यया।&rdquo;
              </p>
              <p className="text-[10px] uppercase tracking-wider text-black/40 font-poppins">
                — Vastu Shastra: Written for the prosperity of all operations
              </p>
            </div>

            <p className="text-[#6B5F52] text-sm leading-relaxed max-w-2xl font-inter">
              {details.importance}
            </p>

            <div className="pt-4 flex items-center gap-4">
              <Link href={`/book?service=${service.id}`} className="bg-[#1E1A16] hover:bg-[#C8A04A] hover:shadow-md text-white text-xs font-bold uppercase tracking-widest px-8 py-4 rounded-full transition-all font-poppins">
                Book Vetting
              </Link>
              <a href="#plans" className="text-xs font-bold uppercase tracking-widest text-[#8B6914] hover:underline font-poppins">
                View Plans &rarr;
              </a>
            </div>
          </div>

          {/* Right: Elegant Advisor Portrait cutout */}
          <div className="lg:col-span-5 relative flex justify-center">
            <div className="relative w-[320px] aspect-[4/5] bg-gradient-to-tr from-[#E6D3A3]/20 to-[#FFFDF9] rounded-2xl overflow-hidden border border-[#E6D3A3]/40 p-4">
              <Image
                src="/images/dr-pradeep-sharma.png"
                alt="Dr. Pradeep Sharma"
                fill
                className="object-cover object-top p-1"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      {/* Structural Highlights */}
      <section className="bg-white border-y border-[#E6D3A3]/30 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {details.importancePoints.map((point: string, idx: number) => (
              <div key={idx} className="space-y-3 p-4">
                <div className="w-8 h-8 rounded-full bg-[#C8A04A]/10 flex items-center justify-center">
                  <span className="text-xs font-bold text-[#8B6914] font-poppins">0{idx+1}</span>
                </div>
                <p className="text-xs text-[#6B5F52] leading-relaxed font-inter">{point}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Grid */}
      <section id="plans" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center max-w-xl mx-auto mb-16 space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#C8A04A] font-poppins">Scope Matrix</span>
          <h2 className="font-heading text-3xl font-bold">Select Scope & Plan</h2>
        </div>

        <div className={`grid gap-8 max-w-5xl mx-auto ${
          service.plans.length === 1 ? "grid-cols-1 max-w-md" :
          service.plans.length === 2 ? "grid-cols-1 md:grid-cols-2 max-w-3xl" : "grid-cols-1 lg:grid-cols-3"
        }`}>
          {service.plans.map((plan: ServicePlan) => {
            const isFeatured = plan.variant === "featured";
            return (
              <div key={plan.slug} className="bg-white border border-[#E6D3A3]/45 rounded-3xl p-8 shadow-sm flex flex-col justify-between relative min-h-[420px]">
                {isFeatured && details.spikyBadgeText && <StarburstBadge text={details.spikyBadgeText} />}
                
                <div>
                  <h3 className="font-heading text-lg font-bold text-[#1E1A16]">{plan.name}</h3>
                  <p className="text-[11px] text-[#6B5F52] mt-1 font-inter leading-relaxed">{plan.tagline}</p>
                  
                  <div className="h-px bg-[#EFEBE1] w-full my-4" />

                  <ul className="space-y-3 mb-8">
                    {plan.features.map((f, i) => (
                      <li key={i} className="flex gap-2 items-start text-[11px] text-[#4B5563] font-inter">
                        <Check className="w-3.5 h-3.5 text-[#C8A04A] shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Link href={`/book?service=${service.id}&plan=${plan.slug}`} className="w-full text-center bg-[#1E1A16] hover:bg-[#C8A04A] text-white text-xs font-bold uppercase tracking-wider py-3.5 rounded-full transition-all font-poppins">
                  Choose Plan
                </Link>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. LEADERSHIP STRATEGY LAYOUT (Category: 'leadership')
// ─────────────────────────────────────────────────────────────────────────────
function LeadershipStrategyLayout({
  service,
  details,
}: {
  service: ServiceDefinition;
  details: any;
}) {
  return (
    <div className="bg-[#FAFBF9] min-h-screen text-[#1E1A16]">
      {/* Navigation bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28">
        <Link href="/solutions" className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-[#8B6914] hover:text-[#C99411] transition-colors font-poppins">
          <ArrowLeft className="w-3 h-3" /> Back to Portfolio
        </Link>
      </div>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left: Alternate portrait of Dr Pradeep */}
          <div className="lg:col-span-5 order-last lg:order-first flex justify-center">
            <div className="relative w-[320px] aspect-[4/5] bg-gradient-to-tr from-[#C8A04A]/10 to-[#FAFBF9] rounded-2xl overflow-hidden border border-[#E6D3A3]/40 p-4">
              <Image
                src="/images/dr-pradeep.png"
                alt="Dr. Pradeep Sharma"
                fill
                className="object-cover object-top p-1"
                priority
              />
            </div>
          </div>

          {/* Right: Copy & Shloka */}
          <div className="lg:col-span-7 space-y-6">
            <span className="text-[10px] font-bold tracking-[0.2em] text-[#C8A04A] font-poppins uppercase block">
              Astrological Timeline Optimization
            </span>
            <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.08] tracking-tight">
              {service.name}
            </h1>

            {/* Sanskrit Quote */}
            <div className="border-l-2 border-[#8B6914] pl-4 py-1.5 my-6 space-y-1">
              <p className="font-tiro-sanskrit text-lg italic text-[#8B6914] tracking-wide">
                &ldquo;योगः कर्मसु कौशलम्॥&rdquo;
              </p>
              <p className="text-[10px] uppercase tracking-wider text-black/40 font-poppins">
                — Bhagavad Gita 2.50: Strategy is alignment and skill in action
              </p>
            </div>

            <p className="text-[#6B5F52] text-sm leading-relaxed max-w-2xl font-inter">
              {details.importance}
            </p>

            <div className="pt-4">
              <Link href={`/book?service=${service.id}`} className="bg-[#1E1A16] hover:bg-[#C8A04A] text-white text-xs font-bold uppercase tracking-widest px-8 py-4 rounded-full transition-all font-poppins inline-block">
                Initiate Vetting
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Strategic Process Framework */}
      <section className="bg-white border-y border-[#E6D3A3]/30 py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h3 className="font-heading text-xl font-bold text-[#1E1A16]">The Calibration Steps</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-inter text-xs">
            {details.process.map((step: any, idx: number) => (
              <div key={idx} className="border-t border-[#E6D3A3] pt-4 space-y-2">
                <span className="text-[10px] font-bold text-[#C8A04A] block">PHASE 0{idx+1}</span>
                <h4 className="font-bold text-[#1E1A16]">{step.title}</h4>
                <p className="text-[#6B5F52] leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <div className="bg-white border border-[#E6D3A3]/45 rounded-3xl p-10 shadow-sm relative">
          {details.spikyBadgeText && <StarburstBadge text={details.spikyBadgeText} />}
          
          <span className="text-[10px] font-bold tracking-widest uppercase text-[#C8A04A] font-poppins block mb-2">Scope & Analysis</span>
          <h3 className="font-heading text-2xl font-bold text-[#1E1A16] mb-4">{service.name} Analysis</h3>

          <p className="text-xs text-[#6B5F52] font-inter max-w-md mx-auto mb-8 leading-relaxed">
            Includes high-resolution planetary calculations, corporate synastry, and direct timing directives.
          </p>

          <Link href={`/book?service=${service.id}&plan=${service.plans[0]?.slug}`} className="bg-[#1E1A16] hover:bg-[#C8A04A] text-white text-xs font-bold uppercase tracking-widest px-8 py-4 rounded-full transition-all font-poppins inline-block">
            Book Consulting Session
          </Link>
        </div>
      </section>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. PERSONAL BLUEPRINT LAYOUT (Category: 'personal')
// ─────────────────────────────────────────────────────────────────────────────
function PersonalBlueprintLayout({
  service,
  details,
}: {
  service: ServiceDefinition;
  details: any;
}) {
  return (
    <div className="bg-[#FDFBF7] min-h-screen text-[#1E1A16]">
      {/* Back button */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28">
        <Link href="/solutions" className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-[#8B6914] hover:text-[#C99411] transition-colors font-poppins">
          <ArrowLeft className="w-3 h-3" /> Back to Portfolio
        </Link>
      </div>

      {/* Split layout */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Left Column: Sanskrit shloka + Dr. Pradeep photo */}
          <div className="lg:col-span-5 space-y-8 flex flex-col items-center">
            {/* Sanskrit shloka */}
            <div className="bg-[#FFFDF9] border border-[#E6D3A3]/40 rounded-2xl p-6 text-center w-full max-w-[360px] space-y-2">
              <p className="font-tiro-sanskrit text-base italic text-[#8B6914] leading-relaxed">
                &ldquo;कर्मण्येवाधिकारस्ते मा फलेषु कदाचन।&rdquo;
              </p>
              <p className="text-[9px] uppercase tracking-wider text-black/45 font-poppins">
                — Action alone is in your sphere of influence
              </p>
            </div>

            <div className="relative w-[280px] aspect-[4/5] bg-gradient-to-tr from-[#E6D3A3]/20 to-[#FFFDF7] rounded-2xl overflow-hidden border border-[#E6D3A3]/40 p-4">
              <Image
                src="/images/dr-pradeep-sharma.png"
                alt="Dr. Pradeep Sharma"
                fill
                className="object-cover object-top p-1"
              />
            </div>
          </div>

          {/* Right Column: Content and plans list */}
          <div className="lg:col-span-7 space-y-8">
            <div className="space-y-4">
              <span className="text-[9px] font-bold uppercase tracking-widest text-[#C8A04A] font-poppins block">
                Personal Vedic Audit
              </span>
              <h1 className="font-heading text-4xl sm:text-5xl font-bold leading-tight text-[#1E1A16]">
                {service.name}
              </h1>
              <p className="text-[#6B5F52] text-xs leading-relaxed font-inter">
                {details.importance}
              </p>
            </div>

            {/* Service Plans */}
            <div className="space-y-6">
              {service.plans.map((plan: ServicePlan) => (
                <div key={plan.slug} className="bg-white border border-[#E6D3A3]/30 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 hover:border-[#C8A04A]/60 transition-colors shadow-sm relative overflow-hidden">
                  <div className="space-y-2">
                    <h3 className="font-heading text-base font-bold text-[#1E1A16]">{plan.name}</h3>
                    <p className="text-[11px] text-[#6B5F52] font-inter">{plan.tagline}</p>
                  </div>

                  <Link href={`/book?service=${service.id}&plan=${plan.slug}`} className="bg-[#1E1A16] hover:bg-[#C8A04A] text-white text-[11px] font-bold uppercase tracking-wider px-6 py-3 rounded-full transition-all font-poppins shrink-0">
                    Get Started
                  </Link>
                </div>
              ))}
            </div>

          </div>

        </div>
      </section>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. PROPERTY / RESIDENTIAL LAYOUT (Category: 'property')
// ─────────────────────────────────────────────────────────────────────────────
function PropertyVastuLayout({
  service,
  details,
}: {
  service: ServiceDefinition;
  details: any;
}) {
  return (
    <div className="bg-[#FAF6F0] min-h-screen text-[#1E1A16]">
      {/* Back link */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28">
        <Link href="/solutions" className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-[#8B6914] hover:text-[#C99411] transition-colors font-poppins">
          <ArrowLeft className="w-3 h-3" /> Back to Portfolio
        </Link>
      </div>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Text */}
          <div className="lg:col-span-8 space-y-6">
            <span className="text-[10px] font-bold tracking-[0.2em] text-[#C8A04A] font-poppins uppercase block">
              Residential Harmony Engineering
            </span>
            <h1 className="font-heading text-4xl sm:text-5xl font-bold leading-tight">
              {service.name}
            </h1>

            {/* Sanskrit Shloka */}
            <div className="border-l-2 border-[#C8A04A] pl-4 py-1 my-6 space-y-1">
              <p className="font-tiro-sanskrit text-base italic text-[#8B6914] tracking-wide">
                &ldquo;गृहं हि राज्याधिकं सौख्यदं स्यात्।&rdquo;
              </p>
              <p className="text-[9px] uppercase tracking-wider text-black/45 font-poppins">
                — A Vastu-aligned home provides joy exceeding a kingdom
              </p>
            </div>

            <p className="text-[#6B5F52] text-sm leading-relaxed max-w-2xl font-inter">
              {details.importance}
            </p>

            <div className="pt-2">
              <Link href={`/book?service=${service.id}`} className="bg-[#1E1A16] hover:bg-[#C8A04A] text-white text-xs font-bold uppercase tracking-widest px-8 py-4 rounded-full transition-all font-poppins inline-block">
                Schedule Audit
              </Link>
            </div>
          </div>

          {/* Right Image */}
          <div className="lg:col-span-4 flex justify-center">
            <div className="relative w-[280px] aspect-[4/5] bg-gradient-to-tr from-[#C8A04A]/10 to-[#FAF6F0] rounded-2xl overflow-hidden border border-[#E6D3A3]/40 p-4">
              <Image
                src="/images/dr-pradeep.png"
                alt="Dr. Pradeep Sharma"
                fill
                className="object-cover object-top p-1"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Pricing plans */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20 border-t border-[#E6D3A3]/25">
        <div className="text-center mb-16">
          <h2 className="font-heading text-2xl font-bold">Plans & Deliverables</h2>
        </div>

        <div className={`grid gap-8 max-w-4xl mx-auto ${
          service.plans.length === 1 ? "grid-cols-1 max-w-md" : "grid-cols-1 md:grid-cols-2"
        }`}>
          {service.plans.map((plan: ServicePlan) => {
            const isFeatured = plan.variant === "featured";
            return (
              <div key={plan.slug} className="bg-white border border-[#E6D3A3]/45 rounded-3xl p-8 shadow-sm flex flex-col justify-between relative min-h-[420px]">
                {isFeatured && details.spikyBadgeText && <StarburstBadge text={details.spikyBadgeText} />}
                
                <div>
                  <h3 className="font-heading text-lg font-bold text-[#1E1A16]">{plan.name}</h3>
                  <p className="text-[11px] text-[#6B5F52] mt-1 font-inter leading-relaxed">{plan.tagline}</p>
                  
                  <div className="h-px bg-[#EFEBE1] w-full my-4" />

                  <ul className="space-y-3.5 mb-8">
                    {plan.features.map((f, i) => (
                      <li key={i} className="flex gap-2 items-start text-[11px] text-[#4B5563] font-inter">
                        <Check className="w-3.5 h-3.5 text-[#C8A04A] shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Link href={`/book?service=${service.id}&plan=${plan.slug}`} className="w-full text-center bg-[#1E1A16] hover:bg-[#C8A04A] text-white text-xs font-bold uppercase tracking-wider py-3.5 rounded-full transition-all font-poppins">
                  Select Plan
                </Link>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function SolutionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const service = getServiceById(id);
  const details = SOLUTION_DETAILS[id];

  if (!service || !details) {
    notFound();
  }

  // Branch layout based on exact service ID for custom premium layouts
  if (service.id === "business-vastu") {
    return <BusinessVastuPage service={service} details={details} />;
  }
  if (service.id === "office-vastu") {
    return <OfficeVastuPage service={service} details={details} />;
  }
  if (service.id === "home-vastu") {
    return <HomeVastuPage service={service} details={details} />;
  }

  // Branch layout based on the category for custom layouts per solution category
  if (service.category === "business") {
    return <BusinessVastuLayout service={service} details={details} />;
  }

  if (service.category === "leadership") {
    return <LeadershipStrategyLayout service={service} details={details} />;
  }

  if (service.category === "personal") {
    return <PersonalBlueprintLayout service={service} details={details} />;
  }

  if (service.category === "property") {
    return <PropertyVastuLayout service={service} details={details} />;
  }

  notFound();
}
