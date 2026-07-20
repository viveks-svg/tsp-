"use client";

import { use } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  getServiceById,
  type ServiceDefinition,
  type ServicePlan,
} from "@/lib/data/service-catalog";
import { SOLUTION_DETAILS, type SolutionDetail } from "@/lib/data/solutions-details";
import {
  Building2, Landmark, Factory, ShoppingBag, Hotel, Map, Laptop,
  Target, Handshake, TrendingUp, Type,
  Briefcase, Heart, Activity, Users,
  Home as HomeIcon, Building, Castle, HardHat,
  ArrowLeft, Check, Sparkles, Compass, ShieldCheck, Award, ArrowRight
} from "lucide-react";

import BusinessVastuPage from "@/features/solutions/components/BusinessVastuPage";
import OfficeVastuPage from "@/features/solutions/components/OfficeVastuPage";
import HomeVastuPage from "@/features/solutions/components/HomeVastuPage";

/* Rotating Starburst Badge */
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
// BESPOKE THEME GENERATOR FOR ALL 34 SOLUTIONS
// ─────────────────────────────────────────────────────────────────────────────
interface ThemeConfig {
  styleKey: 'dark-obsidian' | 'royal-crimson' | 'sapphire-navy' | 'emerald-forest' | 'sandstone' | 'solar-amber';
  pageBg: string;
  heroBg: string;
  textColor: string;
  subtextColor: string;
  headingColor: string;
  accentColor: string;
  cardBg: string;
  cardBorder: string;
  shlokaBorder: string;
  shlokaBg: string;
  shlokaQuote: string;
  shlokaTranslation: string;
  domainLabel: string;
  primaryBtn: string;
  secondaryBtn: string;
  portraitSrc: string;
  processBg: string;
}

function getSolutionTheme(serviceId: string, category: string): ThemeConfig {
  // 1. Dark Obsidian (High-Stakes Business, M&A, Strategy, Wealth)
  if (['strategic-consulting', 'mergers-acquisitions-astrology', 'boardroom-dynamics', 'wealth-prosperity-astrology', 'signature-analysis'].includes(serviceId)) {
    return {
      styleKey: 'dark-obsidian',
      pageBg: 'bg-[#0A0907]',
      heroBg: 'bg-gradient-to-b from-[#14120E] via-[#0A0907] to-[#0A0907]',
      textColor: 'text-[#E5DFD5]',
      subtextColor: 'text-[#999285]',
      headingColor: 'text-white',
      accentColor: 'text-[#C8A04A]',
      cardBg: 'bg-[#12100D]/90 backdrop-blur-xl',
      cardBorder: 'border-[#3A3222]',
      shlokaBorder: 'border-[#C8A04A]/60',
      shlokaBg: 'bg-[#181510]/80',
      shlokaQuote: 'वास्तुशास्त्रं प्रवक्ष्यामि लोकानां हितकाम्यया।',
      shlokaTranslation: 'Vastu & Astrological Alignment: Engineered for commercial dominance and wealth retention.',
      domainLabel: 'Strategic Resonance Engine',
      primaryBtn: 'bg-gradient-to-r from-[#C8A04A] to-[#8B6914] text-white hover:from-[#D4AC5A] hover:to-[#9B7924]',
      secondaryBtn: 'border border-[#C8A04A]/40 text-[#C8A04A] hover:bg-[#C8A04A]/10',
      portraitSrc: '/images/dr-pradeep-sharma.png',
      processBg: 'bg-[#0E0C09] border-y border-[#3A3222]/50',
    };
  }

  // 2. Royal Crimson (Personal Destiny, Relationships, Gemstones, Solar Return)
  if (['relationship-guidance', 'personal-kundli-audit', 'annual-solar-return', 'gemstone-recommendation', 'brand-naming-astrology'].includes(serviceId) || category === 'personal') {
    return {
      styleKey: 'royal-crimson',
      pageBg: 'bg-[#FDF9F5]',
      heroBg: 'bg-gradient-to-br from-[#2D0B10] via-[#1F070A] to-[#120305]',
      textColor: 'text-[#2C2224]',
      subtextColor: 'text-[#6E5D61]',
      headingColor: 'text-[#1F070A]',
      accentColor: 'text-[#B82E3E]',
      cardBg: 'bg-white',
      cardBorder: 'border-[#F0D8DC]',
      shlokaBorder: 'border-[#B82E3E]/60',
      shlokaBg: 'bg-white/10 backdrop-blur-md',
      shlokaQuote: 'समानो मन्त्रः समितिः समानी॥',
      shlokaTranslation: 'May your purpose, cosmic trajectory, and inner blueprint align in perfect harmony.',
      domainLabel: 'Personal Vedic Audit',
      primaryBtn: 'bg-[#2D0B10] text-white hover:bg-[#B82E3E]',
      secondaryBtn: 'border border-[#B82E3E]/30 text-[#B82E3E] hover:bg-[#B82E3E]/10',
      portraitSrc: '/images/dr-pradeep.png',
      processBg: 'bg-[#FAF0F2] border-y border-[#F0D8DC]',
    };
  }

  // 3. Sapphire Navy (Corporate Office, Factory, Logistics, Coworking, Tech, Mobile)
  if (['factory-vastu', 'retail-vastu', 'coworking-vastu', 'warehouse-vastu', 'mobile-analysis'].includes(serviceId)) {
    return {
      styleKey: 'sapphire-navy',
      pageBg: 'bg-[#F5F8FF]',
      heroBg: 'bg-gradient-to-br from-[#0A1633] via-[#060D21] to-[#030712]',
      textColor: 'text-[#1E293B]',
      subtextColor: 'text-[#64748B]',
      headingColor: 'text-[#0A1633]',
      accentColor: 'text-[#2563EB]',
      cardBg: 'bg-white',
      cardBorder: 'border-[#DBE6FE]',
      shlokaBorder: 'border-[#3B82F6]/60',
      shlokaBg: 'bg-white/10 backdrop-blur-md',
      shlokaQuote: 'कर्मण्येवाधिकारस्ते मा फलेषु कदाचन॥',
      shlokaTranslation: 'Optimize your operational facility for zero friction, and high yield follows.',
      domainLabel: 'Industrial & Facility Engineering',
      primaryBtn: 'bg-[#0A1633] text-white hover:bg-[#1E3A8A]',
      secondaryBtn: 'border border-[#2563EB]/40 text-[#2563EB] hover:bg-[#2563EB]/10',
      portraitSrc: '/images/dr-pradeep-sharma.png',
      processBg: 'bg-[#EEF4FF] border-y border-[#DBE6FE]',
    };
  }

  // 4. Emerald Forest (Hospitality, Hospitals, Health, Wellness, Interior, Renovation)
  if (['hotel-vastu', 'restaurant-vastu', 'hospital-vastu', 'health-longevity-astrology', 'interior-vastu', 'renovation-vastu'].includes(serviceId)) {
    return {
      styleKey: 'emerald-forest',
      pageBg: 'bg-[#F4FAF6]',
      heroBg: 'bg-gradient-to-br from-[#062419] via-[#031710] to-[#010D08]',
      textColor: 'text-[#1C2C24]',
      subtextColor: 'text-[#566D60]',
      headingColor: 'text-[#062419]',
      accentColor: 'text-[#059669]',
      cardBg: 'bg-white',
      cardBorder: 'border-[#D1E7DD]',
      shlokaBorder: 'border-[#10B981]/60',
      shlokaBg: 'bg-white/10 backdrop-blur-md',
      shlokaQuote: 'शरीरमाद्यं खलु धर्मसाधनम्॥',
      shlokaTranslation: 'Biological & environmental harmony: aligning spaces to rejuvenate mind, body, and guest experience.',
      domainLabel: 'Environmental Vitality Science',
      primaryBtn: 'bg-[#062419] text-white hover:bg-[#059669]',
      secondaryBtn: 'border border-[#059669]/40 text-[#059669] hover:bg-[#059669]/10',
      portraitSrc: '/images/dr-pradeep.png',
      processBg: 'bg-[#E8F5EF] border-y border-[#D1E7DD]',
    };
  }

  // 5. Sandstone (Real Estate, Plots, Apartments, Villas, Property Vastu)
  if (['commercial-plot', 'apartment-vastu', 'villa-vastu', 'plot-vastu'].includes(serviceId) || category === 'property') {
    return {
      styleKey: 'sandstone',
      pageBg: 'bg-[#FAF6F0]',
      heroBg: 'bg-gradient-to-br from-[#26201A] via-[#1A1511] to-[#0F0C0A]',
      textColor: 'text-[#2B231D]',
      subtextColor: 'text-[#6E6156]',
      headingColor: 'text-[#26201A]',
      accentColor: 'text-[#D97706]',
      cardBg: 'bg-white',
      cardBorder: 'border-[#EAE0D3]',
      shlokaBorder: 'border-[#D97706]/60',
      shlokaBg: 'bg-white/10 backdrop-blur-md',
      shlokaQuote: 'गृहं हि राज्याधिकं सौख्यदं स्यात्॥',
      shlokaTranslation: 'A Vastu-harmonized plot and home provides stability and peace exceeding a kingdom.',
      domainLabel: 'Architectural Land & Living Audit',
      primaryBtn: 'bg-[#26201A] text-white hover:bg-[#D97706]',
      secondaryBtn: 'border border-[#D97706]/40 text-[#D97706] hover:bg-[#D97706]/10',
      portraitSrc: '/images/dr-pradeep-sharma.png',
      processBg: 'bg-[#F2E8DB] border-y border-[#EAE0D3]',
    };
  }

  // 6. Solar Amber (Career, Executive Mentorship, Education, Investment, Remedies)
  return {
    styleKey: 'solar-amber',
    pageBg: 'bg-[#FFFDF8]',
    heroBg: 'bg-gradient-to-br from-[#332211] via-[#22160A] to-[#120B04]',
    textColor: 'text-[#281D14]',
    subtextColor: 'text-[#6B5A4B]',
    headingColor: 'text-[#332211]',
    accentColor: 'text-[#E67E22]',
    cardBg: 'bg-white',
    cardBorder: 'border-[#F5E6D3]',
    shlokaBorder: 'border-[#E67E22]/60',
    shlokaBg: 'bg-white/10 backdrop-blur-md',
    shlokaQuote: 'योगः कर्मसु कौशलम्॥',
    shlokaTranslation: 'Strategy is cosmic alignment, timing precision, and skill in action.',
    domainLabel: 'Executive & Planetary Leadership',
    primaryBtn: 'bg-[#332211] text-white hover:bg-[#E67E22]',
    secondaryBtn: 'border border-[#E67E22]/40 text-[#E67E22] hover:bg-[#E67E22]/10',
    portraitSrc: '/images/dr-pradeep.png',
    processBg: 'bg-[#FDF3E7] border-y border-[#F5E6D3]',
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// BESPOKE SOLUTION ENGINE COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
function BespokeSolutionEngine({
  service,
  details,
}: {
  service: ServiceDefinition;
  details: SolutionDetail;
}) {
  const theme = getSolutionTheme(service.id, service.category);
  const isDarkTheme = theme.styleKey === 'dark-obsidian';

  return (
    <div className={`${theme.pageBg} min-h-screen ${theme.textColor} transition-colors duration-500 font-inter`}>
      {/* Navigation Top Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-4 relative z-20">
        <Link
          href="/solutions"
          className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] font-poppins px-4 py-2 rounded-full border border-current opacity-70 hover:opacity-100 transition-opacity"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Portfolio
        </Link>
      </div>

      {/* Hero Section */}
      <section className={`relative overflow-hidden ${theme.heroBg} text-white py-16 lg:py-24 border-b border-white/10`}>
        {/* Subtle Ambient Radial Glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(200,160,74,0.15),transparent_60%)] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 backdrop-blur-md">
                <Sparkles className="w-3.5 h-3.5 text-[#C8A04A]" />
                <span className="text-[10px] font-bold tracking-[0.2em] uppercase font-poppins text-white/90">
                  {theme.domainLabel}
                </span>
              </div>

              <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.08] tracking-tight">
                {service.name}
              </h1>

              {/* Sanskrit Shloka Callout */}
              <div className={`border-l-2 ${theme.shlokaBorder} pl-5 py-3 ${theme.shlokaBg} rounded-r-xl space-y-1`}>
                <p className="font-tiro-sanskrit text-lg italic text-[#E5C378] tracking-wide">
                  &ldquo;{theme.shlokaQuote}&rdquo;
                </p>
                <p className="text-[10px] uppercase tracking-wider text-white/60 font-poppins font-medium">
                  — {theme.shlokaTranslation}
                </p>
              </div>

              <p className="text-white/75 text-sm md:text-base leading-relaxed max-w-2xl font-light">
                {details.importance}
              </p>

              <div className="pt-4 flex flex-wrap items-center gap-4">
                <Link
                  href={`/book?service=${service.id}`}
                  className={`px-8 py-4 rounded-full text-xs font-bold uppercase tracking-[0.15em] font-poppins transition-all shadow-lg hover:shadow-2xl ${theme.primaryBtn}`}
                >
                  Initiate Vetting
                </Link>
                <a
                  href="#plans"
                  className={`px-6 py-4 rounded-full text-xs font-bold uppercase tracking-[0.15em] font-poppins transition-all ${theme.secondaryBtn}`}
                >
                  View Scopes &rarr;
                </a>
              </div>
            </div>

            {/* Right: Advisor Cutout Portrait */}
            <div className="lg:col-span-5 relative flex justify-center">
              <div className="relative w-full max-w-[340px] aspect-[4/5] rounded-3xl overflow-hidden border border-white/20 p-3 shadow-2xl bg-white/5 backdrop-blur-md">
                <Image
                  src={theme.portraitSrc}
                  alt="Dr. Pradeep Sharma"
                  fill
                  className="object-cover object-top p-1"
                  priority
                />
              </div>

              {/* Floating Badge */}
              <div className="absolute -bottom-6 -right-2 sm:right-4 bg-white/95 backdrop-blur-xl text-[#1E1A16] p-4 rounded-2xl shadow-2xl border border-white/40 flex items-center gap-3 max-w-[220px]">
                <div className="w-10 h-10 rounded-full bg-[#1E1A16] text-[#C8A04A] flex items-center justify-center font-bold font-heading text-lg shrink-0">
                  25+
                </div>
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-wider font-poppins">Dr. Pradeep Sharma</p>
                  <p className="text-[10px] text-[#6B5F52]">Vedic Science & Spatial Audit</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Structural Highlights Grid */}
      <section className={`py-20 ${isDarkTheme ? 'bg-[#0F0D0B]' : 'bg-white'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-14 space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#C8A04A] font-poppins">Diagnostic Pillars</span>
            <h2 className={`font-heading text-3xl font-bold ${isDarkTheme ? 'text-white' : theme.headingColor}`}>Core Scope Deliverables</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {details.importancePoints.map((point: string, idx: number) => (
              <div
                key={idx}
                className={`p-8 rounded-2xl border transition-all duration-300 hover:-translate-y-1 ${
                  isDarkTheme
                    ? 'bg-[#15120F] border-[#2A2318] text-[#D8D2C7]'
                    : `${theme.cardBg} ${theme.cardBorder} shadow-sm hover:shadow-md`
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-[#C8A04A]/15 border border-[#C8A04A]/30 flex items-center justify-center mb-6">
                  <span className="text-xs font-bold text-[#C8A04A] font-poppins">0{idx + 1}</span>
                </div>
                <p className="text-xs sm:text-sm leading-relaxed font-light">{point}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process Calibration Stepper */}
      <section className={`py-20 ${theme.processBg}`}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-14 space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#C8A04A] font-poppins">Audit Protocol</span>
            <h2 className={`font-heading text-3xl font-bold ${isDarkTheme ? 'text-white' : theme.headingColor}`}>Step-by-Step Calibration</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-inter text-xs">
            {details.process.map((step: { title: string; description: string }, idx: number) => (
              <div
                key={idx}
                className={`p-6 rounded-2xl border ${
                  isDarkTheme ? 'bg-[#161310] border-[#332A1C]' : 'bg-white border-black/5 shadow-sm'
                } space-y-3 relative overflow-hidden`}
              >
                <span className="text-[9px] font-bold tracking-widest text-[#C8A04A] uppercase font-poppins block">
                  PHASE 0{idx + 1}
                </span>
                <h4 className={`font-bold text-sm ${isDarkTheme ? 'text-white' : theme.headingColor}`}>{step.title}</h4>
                <p className={`${isDarkTheme ? 'text-white/70' : theme.subtextColor} leading-relaxed`}>{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Plans Section (NO PRICES DISPLAYED) */}
      <section id="plans" className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24`}>
        <div className="text-center max-w-xl mx-auto mb-16 space-y-3">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#C8A04A] font-poppins">Engagement Matrix</span>
          <h2 className={`font-heading text-3xl sm:text-4xl font-bold ${isDarkTheme ? 'text-white' : theme.headingColor}`}>
            Select Consultation Scope
          </h2>
          <p className={`text-xs ${isDarkTheme ? 'text-white/60' : theme.subtextColor}`}>
            Review scope features below. Pricing and payment options are presented during booking confirmation.
          </p>
        </div>

        <div
          className={`grid gap-8 max-w-5xl mx-auto ${
            service.plans.length === 1
              ? "grid-cols-1 max-w-md"
              : service.plans.length === 2
              ? "grid-cols-1 md:grid-cols-2 max-w-3xl"
              : "grid-cols-1 lg:grid-cols-3"
          }`}
        >
          {service.plans.map((plan: ServicePlan) => {
            const isFeatured = plan.variant === "featured";
            return (
              <div
                key={plan.slug}
                className={`rounded-3xl p-8 flex flex-col justify-between relative min-h-[440px] border transition-all duration-300 ${
                  isDarkTheme
                    ? isFeatured
                      ? 'bg-[#1C1813] border-[#C8A04A] shadow-[0_8px_30px_rgba(200,160,74,0.15)]'
                      : 'bg-[#12100D] border-[#2A2318]'
                    : isFeatured
                    ? 'bg-white border-[#C8A04A] shadow-xl'
                    : 'bg-white border-black/10 shadow-sm'
                }`}
              >
                {isFeatured && details.spikyBadgeText && <StarburstBadge text={details.spikyBadgeText} />}

                <div>
                  <h3 className={`font-heading text-xl font-bold ${isDarkTheme ? 'text-white' : theme.headingColor}`}>
                    {plan.name}
                  </h3>
                  <p className={`text-xs mt-1.5 font-inter leading-relaxed ${isDarkTheme ? 'text-white/70' : theme.subtextColor}`}>
                    {plan.tagline}
                  </p>

                  <div className="h-px bg-current opacity-10 w-full my-6" />

                  <ul className="space-y-3.5 mb-8">
                    {plan.features.map((f, i) => (
                      <li key={i} className="flex gap-2.5 items-start text-xs font-inter">
                        <Check className="w-4 h-4 text-[#C8A04A] shrink-0 mt-0.5" />
                        <span className={isDarkTheme ? 'text-white/80' : 'text-[#4A4A4A]'}>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Link
                  href={`/book?service=${service.id}&plan=${plan.slug}`}
                  className={`w-full text-center text-xs font-bold uppercase tracking-wider py-4 rounded-full transition-all font-poppins shadow-md hover:shadow-lg ${
                    isFeatured
                      ? 'bg-gradient-to-r from-[#C8A04A] to-[#8B6914] text-white hover:from-[#D4AC5A] hover:to-[#9B7924]'
                      : isDarkTheme
                      ? 'bg-white/10 text-white hover:bg-white/20'
                      : 'bg-[#1E1A16] text-white hover:bg-[#C8A04A]'
                  }`}
                >
                  Select Plan
                </Link>
              </div>
            );
          })}
        </div>
      </section>

      {/* McKinsey Style Custom Evaluation Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-20">
        <div className={`rounded-3xl p-8 sm:p-12 border flex flex-col md:flex-row items-center justify-between gap-8 ${
          isDarkTheme ? 'bg-[#14110E] border-[#3A3020]' : 'bg-white border-[#E6D3A3]/50 shadow-sm'
        }`}>
          <div className="space-y-3 text-center md:text-left">
            <h3 className={`font-heading text-2xl sm:text-3xl font-bold ${isDarkTheme ? 'text-white' : theme.headingColor}`}>
              Need a Custom Scope for Your Operation?
            </h3>
            <p className={`text-xs sm:text-sm max-w-xl leading-relaxed ${isDarkTheme ? 'text-white/70' : theme.subtextColor}`}>
              Schedule a preliminary assessment with our team to evaluate multi-site properties, complex leadership charts, or specialized timing directives.
            </p>
          </div>
          <Link
            href="/book"
            className={`shrink-0 px-8 py-4 rounded-full text-xs font-bold uppercase tracking-wider font-poppins transition-all ${theme.primaryBtn}`}
          >
            Launch Vetting Session
          </Link>
        </div>
      </section>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE ROUTER
// ─────────────────────────────────────────────────────────────────────────────
export default function SolutionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const service = getServiceById(id);
  const details = SOLUTION_DETAILS[id];

  if (!service || !details) {
    notFound();
  }

  // Branch layout based on exact service ID for custom custom pages
  if (service.id === "business-vastu") {
    return <BusinessVastuPage service={service} details={details} />;
  }
  if (service.id === "office-vastu") {
    return <OfficeVastuPage service={service} details={details} />;
  }
  if (service.id === "home-vastu") {
    return <HomeVastuPage service={service} details={details} />;
  }

  // Render bespoke solution UI engine configured for this exact solution
  return <BespokeSolutionEngine service={service} details={details} />;
}
