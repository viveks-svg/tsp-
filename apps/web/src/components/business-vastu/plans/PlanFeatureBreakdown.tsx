"use client";

import { motion } from "framer-motion";
import {
  ScrollText,
  TrendingUp,
  Clock,
  Video,
  FileText,
  Mail,
  Handshake,
  LayoutGrid,
  Compass,
  ListChecks,
  MessageCircle,
  Globe,
  Crown,
  Activity,
  CalendarRange,
  MapPin,
  Ruler,
  Phone,
  ShieldCheck,
  Zap,
} from "lucide-react";
import type { PlanDetailFeature } from "@/lib/data/business-vastu";

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0 },
};
const transition = { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const };

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  ScrollText,
  TrendingUp,
  Clock,
  Video,
  FileText,
  Mail,
  Handshake,
  LayoutGrid,
  Compass,
  ListChecks,
  MessageCircle,
  Globe,
  Crown,
  Activity,
  CalendarRange,
  MapPin,
  Ruler,
  Phone,
  ShieldCheck,
  Zap,
};

function FeatureCard({
  feature,
  index,
}: {
  feature: PlanDetailFeature;
  index: number;
}) {
  const Icon = ICON_MAP[feature.icon];

  return (
    <motion.div
      className="bg-white rounded-2xl border border-[#071B8D]/[0.08] p-8 flex flex-col lg:flex-row gap-8 items-start"
      variants={fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      transition={{ ...transition, delay: index * 0.06 }}
    >
      {/* Icon Block */}
      <div className="w-16 h-16 rounded-xl bg-[#071B8D]/5 flex items-center justify-center shrink-0">
        {Icon && <Icon className="w-7 h-7 text-[#F6A000]" />}
      </div>

      {/* Content */}
      <div className="flex-1">
        <h3 className="font-poppins font-semibold text-lg text-[#071B8D]">
          {feature.title}
        </h3>
        <p className="font-inter text-[15px] text-gray-600 leading-relaxed mt-2">
          {feature.description}
        </p>
        <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 text-xs font-poppins px-3 py-1 rounded-full mt-3">
          <Zap className="w-3 h-3" />
          {feature.impact}
        </span>
      </div>
    </motion.div>
  );
}

interface PlanFeatureBreakdownProps {
  features: PlanDetailFeature[];
}

export default function PlanFeatureBreakdown({
  features,
}: PlanFeatureBreakdownProps) {
  return (
    <section className="bg-[#F7F4EE] py-20 lg:py-28">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          className="text-center mb-16"
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          transition={transition}
        >
          <h2 className="font-playfair text-3xl sm:text-4xl font-bold text-[#071B8D] leading-tight">
            Every Element of Your Audit — Explained
          </h2>
          <p className="font-inter text-base text-gray-500 mt-3">
            You&apos;re not buying a service. You&apos;re investing in
            precision.
          </p>
        </motion.div>

        {/* Feature Cards */}
        <div className="space-y-6">
          {features.map((feature, i) => (
            <FeatureCard key={feature.title} feature={feature} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
