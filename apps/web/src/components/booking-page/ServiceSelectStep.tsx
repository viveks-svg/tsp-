"use client";

import { motion } from "framer-motion";
import {
  SERVICE_CATALOG,
  CATEGORY_LABELS,
  getServicesByCategoryMap,
  type ServiceCategory,
  type ServiceDefinition,
} from "@/lib/data/service-catalog";
import {
  Building2, Landmark, Factory, ShoppingBag, Hotel, Map, Laptop,
  Target, Handshake, TrendingUp, Type,
  Briefcase, Heart, Activity, Users,
  Home, Building, Castle, HardHat, Check,
} from "lucide-react";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Building2, Landmark, Factory, ShoppingBag, Hotel, Map, Laptop,
  Target, Handshake, TrendingUp, Type,
  Briefcase, Heart, Activity, Users,
  Home, Building, Castle, HardHat,
};

const CATEGORY_ORDER: ServiceCategory[] = ['business', 'leadership', 'personal', 'property'];

interface Props {
  selectedServiceId: string | null;
  onSelect: (service: ServiceDefinition) => void;
}

export default function ServiceSelectStep({ selectedServiceId, onSelect }: Props) {
  const servicesByCategory = getServicesByCategoryMap();

  return (
    <div className="p-6 sm:p-8">
      <div className="mb-8">
        <h2 className="font-heading text-2xl sm:text-3xl font-bold text-[#1E1A16]">
          What service are you looking for?
        </h2>
        <p className="text-[#6B5F52] text-sm mt-2">
          Select the service that best matches your needs.
        </p>
      </div>

      {CATEGORY_ORDER.map((cat) => {
        const services = servicesByCategory[cat];
        if (!services?.length) return null;

        return (
          <div key={cat} className="mb-8 last:mb-0">
            <h3 className="text-xs font-bold text-[#8B6914] uppercase tracking-[0.2em] mb-3 font-poppins">
              {CATEGORY_LABELS[cat]}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {services.map((service, i) => {
                const Icon = ICON_MAP[service.icon];
                const isSelected = selectedServiceId === service.id;
                const startingPrice = service.plans.length > 0
                  ? service.plans.reduce((min, p) => Math.min(min, p.priceINR), Infinity)
                  : null;

                return (
                  <motion.button
                    key={service.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03, duration: 0.3 }}
                    onClick={() => onSelect(service)}
                    className={`relative text-left p-4 rounded-xl border-2 transition-all duration-300 ${
                      isSelected
                        ? 'border-[#C8A04A] bg-[#C8A04A]/5 shadow-[0_0_0_1px_rgba(200,160,74,0.3)]'
                        : 'border-[#EFEBE1] bg-white hover:border-[#C8A04A]/30 hover:shadow-sm'
                    }`}
                  >
                    {/* Selected check */}
                    {isSelected && (
                      <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-[#C8A04A] flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}

                    <div className="flex items-start gap-3">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                        isSelected
                          ? 'bg-[#C8A04A]/15'
                          : 'bg-[#F7F4EE]'
                      }`}>
                        {Icon && <Icon className={`w-4 h-4 ${isSelected ? 'text-[#C8A04A]' : 'text-[#8B6914]'}`} />}
                      </div>
                      <div className="min-w-0">
                        <span className="block text-sm font-semibold text-[#1E1A16] truncate">
                          {service.name}
                        </span>
                        <span className="block text-xs text-[#6B5F52] mt-0.5 line-clamp-2">
                          {service.shortDescription}
                        </span>
                        {startingPrice && (
                          <span className="block text-xs text-[#8B6914] font-medium mt-1">
                            From ₹{startingPrice.toLocaleString('en-IN')}
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
