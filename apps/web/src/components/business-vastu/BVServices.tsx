"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  Building2,
  Factory,
  Map,
  ShoppingBag,
  Hotel,
  Laptop,
  ArrowRight,
} from "lucide-react";
import { SERVICES } from "@/lib/data/business-vastu";
import type { BVService } from "@/lib/data/business-vastu";

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0 },
};
const transition = { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const };

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Building2,
  Factory,
  Map,
  ShoppingBag,
  Hotel,
  Laptop,
};

function ServiceCard({
  service,
  index,
}: {
  service: BVService;
  index: number;
}) {
  const Icon = ICON_MAP[service.iconName];

  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      transition={{ ...transition, delay: index * 0.08 }}
    >
      <Link
        href={service.href}
        className="group relative block bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-8 hover:bg-white/10 hover:border-[#F6A000]/40 transition-all duration-300 h-full overflow-hidden"
      >
        {/* Gold bottom-border animation */}
        <span className="absolute bottom-0 left-0 h-0.5 w-0 bg-[#F6A000] group-hover:w-full transition-all duration-500" />

        {/* Icon */}
        <span className="w-12 h-12 rounded-full bg-[#F6A000]/10 flex items-center justify-center">
          {Icon && <Icon className="w-5 h-5 text-[#F6A000]" />}
        </span>

        {/* Title */}
        <h3 className="font-poppins font-semibold text-lg text-white mt-5">
          {service.title}
        </h3>

        {/* Description */}
        <p className="font-inter text-sm text-white/60 mt-2 leading-relaxed">
          {service.description}
        </p>

        {/* Learn More */}
        <span className="inline-flex items-center gap-1 text-[#F6A000] text-sm font-poppins mt-4 group-hover:gap-2 transition-all">
          Learn More <ArrowRight className="w-3.5 h-3.5" />
        </span>
      </Link>
    </motion.div>
  );
}

export default function BVServices() {
  return (
    <section className="bg-[#071B8D] py-20 lg:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          className="text-center mb-16"
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          transition={transition}
        >
          <span className="block font-poppins text-[#F6A000] text-xs tracking-[0.25em] uppercase font-semibold mb-4">
            OUR EXPERTISE
          </span>
          <h2 className="font-playfair text-3xl sm:text-4xl lg:text-[42px] font-bold text-white leading-tight">
            Every Space We Touch
            <br />
            Becomes a Growth Engine
          </h2>
        </motion.div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {SERVICES.map((service, i) => (
            <ServiceCard key={service.title} service={service} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
