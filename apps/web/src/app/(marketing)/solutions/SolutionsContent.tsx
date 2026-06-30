"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  SERVICE_CATALOG,
  CATEGORY_LABELS,
  CATEGORY_DESCRIPTIONS,
  getServicesByCategoryMap,
  type ServiceCategory,
  type ServiceDefinition,
} from "@/lib/data/service-catalog";
import {
  Building2, Landmark, Factory, ShoppingBag, Hotel, Map, Laptop,
  Target, Handshake, TrendingUp, Type,
  Briefcase, Heart, Activity, Users,
  Home, Building, Castle, HardHat, ArrowRight,
  Phone, PenTool
} from "lucide-react";

/* Icon lookup from lucide icon name strings */
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Building2, Landmark, Factory, ShoppingBag, Hotel, Map, Laptop,
  Target, Handshake, TrendingUp, Type,
  Briefcase, Heart, Activity, Users,
  Home, Building, Castle, HardHat,
  Phone, PenTool
};

const CATEGORY_ORDER: ServiceCategory[] = ['business', 'leadership', 'personal', 'property'];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

function ServiceCard({ service, index }: { service: ServiceDefinition; index: number }) {
  const Icon = ICON_MAP[service.icon];
  const startingPrice = service.plans.length > 0
    ? service.plans.reduce((min, p) => Math.min(min, p.priceINR), Infinity)
    : null;

  const isNew = ['mobile-analysis', 'signature-analysis'].includes(service.id);

  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.1 }}
      transition={{ duration: 0.5, delay: index * 0.04, ease: [0.22, 1, 0.36, 1] }}
      className="group relative p-8 bg-white hover:bg-gradient-to-b hover:from-[#FFFDF9] hover:to-[#FDF9F2] border border-[#E6D3A3]/40 rounded-2xl shadow-sm hover:shadow-[0_12px_36px_rgba(200,160,74,0.08)] transition-all duration-500 flex flex-col justify-between min-h-[290px] overflow-hidden"
    >
      {isNew && (
        <span className="absolute top-4 right-4 bg-gradient-to-r from-[#C8A04A] to-[#8B6914] text-white text-[8px] font-extrabold tracking-widest px-2 py-0.5 rounded-full uppercase font-poppins shadow-sm z-10">
          NEW
        </span>
      )}

      <div className="space-y-4">
        {/* Header: Icon & Category */}
        <div className="flex items-center justify-between">
          <div className="w-10 h-10 rounded-lg bg-[#C8A04A]/10 group-hover:bg-gradient-to-br group-hover:from-[#C8A04A] group-hover:to-[#8B6914] flex items-center justify-center transition-all duration-300 shadow-[0_2px_10px_rgba(200,160,74,0.05)]">
            {Icon && <Icon className="w-4.5 h-4.5 text-[#8B6914] group-hover:text-white transition-colors duration-300" />}
          </div>
          <span className="text-[9px] font-bold tracking-widest uppercase text-[#C8A04A]/70 font-poppins">
            {service.category}
          </span>
        </div>

        {/* Title */}
        <h3 className="font-heading text-lg font-bold text-[#1E1A16] group-hover:text-[#8B6914] transition-colors duration-300">
          {service.name}
        </h3>

        {/* Description */}
        <p className="text-[#6B5F52] text-xs leading-relaxed font-inter line-clamp-3">
          {service.shortDescription}
        </p>
      </div>

      <div className="pt-6 border-t border-[#EFEBE1]/60 mt-4 flex items-center justify-between">
        {startingPrice ? (
          <div className="flex flex-col">
            <span className="text-[9px] uppercase tracking-wider text-black/40 font-inter">Engagement from</span>
            <span className="text-xs font-bold text-[#8B6914] font-poppins">₹{startingPrice.toLocaleString('en-IN')}</span>
          </div>
        ) : (
          <div />
        )}

        <Link
          href={`/solutions/${service.id}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1E1A16] group-hover:text-[#C8A04A] transition-colors duration-300 font-poppins"
        >
          Explore
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform duration-300" />
        </Link>
      </div>
    </motion.div>
  );
}

export default function SolutionsContent() {
  const [activeCategory, setActiveCategory] = useState<ServiceCategory | 'all'>('all');
  const servicesByCategory = getServicesByCategoryMap();

  const filteredServices = activeCategory === 'all'
    ? SERVICE_CATALOG
    : servicesByCategory[activeCategory] || [];

  return (
    <div className="min-h-screen bg-[#F7F4EE] pb-24">
      {/* Luxury Consulting Header */}
      <section className="relative w-full pt-28 pb-12 md:pt-32 md:pb-16 lg:pt-40 lg:pb-24 overflow-hidden bg-[#1E1A16] text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(200,160,74,0.08)_0%,transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(200,160,74,0.04)_0%,transparent_50%)]" />
        
        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 md:px-8 lg:px-16 xl:px-24 text-center space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-4 overflow-hidden break-words"
          >
            <span className="inline-block text-[#C8A04A] text-[10px] md:text-xs font-semibold tracking-[0.25em] uppercase font-poppins">
              Cosmic Calibration Portfolio
            </span>
            <h1 className="font-heading text-3xl md:text-5xl lg:text-6xl font-bold leading-[1.12] tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-[#FFF8E7] to-[#C8A04A]">
              Solutions Calibrated for
              <br />
              <span className="text-[#C8A04A]">Organizational Velocity</span>
            </h1>
            <p className="text-white/50 text-xs md:text-sm lg:text-base max-w-2xl mx-auto font-inter leading-relaxed">
              Dr. Pradeep Sharma combines spatial physics, celestial timings, and strategic business consulting to remove operational friction and attract structural prosperity.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Categories Filter Tabs */}
      <section className="sticky top-[64px] md:top-[72px] z-30 bg-[#F7F4EE]/95 backdrop-blur-md border-b border-[#E6D3A3]/25 shadow-sm w-full">
        <div className="w-full max-w-7xl mx-auto px-4 md:px-8 lg:px-16 xl:px-24">
          <div className="flex items-center gap-2 py-4 overflow-x-auto no-scrollbar font-poppins">
            <button
              onClick={() => setActiveCategory('all')}
              className={`shrink-0 px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
                activeCategory === 'all'
                  ? 'bg-[#1E1A16] text-white shadow-[0_4px_12px_rgba(30,26,22,0.15)]'
                  : 'bg-white text-[#6B5F52] border border-[#E6D3A3]/30 hover:border-[#C8A04A]/40 hover:text-[#1E1A16]'
              }`}
            >
              All Engagements
            </button>
            {CATEGORY_ORDER.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`shrink-0 px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
                  activeCategory === cat
                    ? 'bg-[#1E1A16] text-white shadow-[0_4px_12px_rgba(30,26,22,0.15)]'
                    : 'bg-white text-[#6B5F52] border border-[#E6D3A3]/30 hover:border-[#C8A04A]/40 hover:text-[#1E1A16]'
              }`}
            >
              {CATEGORY_LABELS[cat]}
            </button>
          ))}
          </div>
        </div>
      </section>

      {/* Architectural Border Grid Services Layout */}
      <section className="relative w-full py-12 md:py-16 lg:py-24">
        <div className="w-full max-w-7xl mx-auto px-4 md:px-8 lg:px-16 xl:px-24">
          {activeCategory === 'all' ? (
            /* Grouped Sections layout */
            CATEGORY_ORDER.map((cat) => {
              const services = servicesByCategory[cat];
              if (!services?.length) return null;
              return (
                <div key={cat} className="mb-20 last:mb-0">
                  {/* Category Section Header */}
                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="mb-8 space-y-2 border-b border-[#E6D3A3]/30 pb-4"
                  >
                    <h2 className="font-heading text-2xl sm:text-3xl font-bold text-[#1E1A16]">
                      {CATEGORY_LABELS[cat]}
                    </h2>
                    <p className="text-[#6B5F52] text-xs font-inter max-w-xl leading-relaxed">
                      {CATEGORY_DESCRIPTIONS[cat]}
                    </p>
                  </motion.div>

                  {/* Cards grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {services.map((service, i) => (
                      <ServiceCard key={service.id} service={service} index={i} />
                    ))}
                  </div>
                </div>
              );
            })
          ) : (
            /* Filtered Flat Grid layout */
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredServices.map((service, i) => (
                <ServiceCard key={service.id} service={service} index={i} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Bottom McKinsey style CTA */}
      <section className="w-full max-w-7xl mx-auto px-4 md:px-8 lg:px-16 xl:px-24 mt-12 mb-12">
        <div className="bg-[#FFFDF9] border border-[#E6D3A3]/50 rounded-3xl p-8 md:p-12 shadow-[0_12px_40px_rgba(0,0,0,0.02)] flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-3 text-center md:text-left">
            <h2 className="font-heading text-2xl sm:text-3xl font-bold text-[#1E1A16]">
              Unsure Which Tier Matches Your Scope?
            </h2>
            <p className="text-[#6B5F52] text-xs max-w-md leading-relaxed font-inter">
              Initiate a custom scope evaluation and our scheduling algorithms will match your company requirements with Dr. Pradeep Sharma&apos;s available consultations.
            </p>
          </div>
          <Link
            href="/book"
            className="shrink-0 w-full md:w-auto text-center bg-[#1E1A16] hover:bg-[#C8A04A] hover:shadow-[0_8px_24px_rgba(200,160,74,0.2)] text-white px-8 py-4 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-wider transition-all duration-300 font-poppins"
          >
            Launch Consultation Vetting
          </Link>
        </div>
      </section>
    </div>
  );
}
