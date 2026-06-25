"use client";

import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import {
  VASTU_NAV_SERVICES,
  VASTU_NAV_STATS,
  VASTU_NAV_FEATURED_PLAN,
} from "@/lib/data/business-vastu-nav";

interface BusinessVastuMegaDropdownProps {
  onClose: () => void;
}

export default function BusinessVastuMegaDropdown({
  onClose,
}: BusinessVastuMegaDropdownProps) {
  return (
    <div className="grid grid-cols-[1fr_auto_1fr_auto_1fr] min-w-[860px] bg-[#F7F4EE] border border-[#F6A000]/20 rounded-2xl shadow-2xl overflow-hidden">
      {/* ── Left Column: Services ── */}
      <div className="p-6">
        <span className="block text-[10px] font-bold text-[#071B8D] uppercase tracking-[0.15em] font-poppins mb-4">
          Our Vastu Services
        </span>
        <div className="space-y-1">
          {VASTU_NAV_SERVICES.map((service) => (
            <Link
              key={service.href}
              href={service.href}
              onClick={onClose}
              className="flex items-start gap-3 px-3 py-2.5 rounded-xl hover:bg-[#071B8D]/[0.04] transition-colors group"
            >
              <span className="mt-0.5 p-1.5 rounded-lg bg-[#F6A000]/10 text-[#F6A000] shrink-0">
                <service.Icon className="w-4 h-4" />
              </span>
              <div>
                <span className="block text-sm font-semibold text-[#071B8D] font-poppins group-hover:text-[#F6A000] transition-colors">
                  {service.title}
                </span>
                <span className="block text-[11px] text-gray-500 leading-snug mt-0.5 font-inter">
                  {service.description}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Divider ── */}
      <div className="w-px bg-[#071B8D]/10" />

      {/* ── Middle Column: Philosophy ── */}
      <div className="p-6 flex flex-col justify-between">
        <div>
          <span className="block text-[10px] font-bold text-[#071B8D] uppercase tracking-[0.15em] font-poppins mb-4">
            Why Vastu Matters
          </span>
          <p className="text-[13px] text-gray-600 leading-relaxed font-inter">
            Vastu is not superstition — it is applied spatial science rooted in
            Vedic physics. The direction your boardroom faces can determine the
            outcome of your next negotiation.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4 mt-6 pt-5 border-t border-[#071B8D]/10">
          {VASTU_NAV_STATS.map((stat) => (
            <div key={stat.value}>
              <span className="block text-xl font-bold text-[#071B8D] font-playfair">
                {stat.value}
              </span>
              <span className="block text-[11px] text-gray-500 font-inter leading-tight mt-1">
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Divider ── */}
      <div className="w-px bg-[#071B8D]/10" />

      {/* ── Right Column: Featured Plan ── */}
      <div className="p-4">
        <span className="block text-[10px] font-bold text-[#071B8D] uppercase tracking-[0.15em] font-poppins mb-3">
          Featured Plan
        </span>
        <div className="bg-[#071B8D] rounded-xl p-5 border border-[#F6A000]/30 relative">
          {/* Badge */}
          <span className="inline-block bg-[#F6A000] text-[#071B8D] text-[10px] font-bold font-poppins tracking-wider px-2.5 py-0.5 rounded-full mb-3">
            {VASTU_NAV_FEATURED_PLAN.badge}
          </span>
          <h4 className="text-white font-playfair text-base font-bold">
            {VASTU_NAV_FEATURED_PLAN.name}
          </h4>
          <p className="text-[#F6A000] font-playfair text-2xl font-bold mt-1">
            {VASTU_NAV_FEATURED_PLAN.price}
          </p>
          <ul className="mt-3 space-y-2">
            {VASTU_NAV_FEATURED_PLAN.features.map((feat) => (
              <li
                key={feat}
                className="flex items-start gap-2 text-white/70 text-[11px] font-inter"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-[#F6A000] shrink-0 mt-0.5" />
                {feat}
              </li>
            ))}
          </ul>
          <Link
            href={VASTU_NAV_FEATURED_PLAN.ctaHref}
            onClick={onClose}
            className="block mt-4 text-center bg-[#F6A000] text-[#071B8D] text-xs font-bold font-poppins py-2.5 rounded-full hover:brightness-110 transition"
          >
            {VASTU_NAV_FEATURED_PLAN.ctaText}
          </Link>
        </div>
      </div>
    </div>
  );
}
