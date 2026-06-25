import type { Metadata } from "next";
import Link from "next/link";
import { getServicesByCategory, CATEGORY_LABELS, type ServiceDefinition } from "@/lib/data/service-catalog";

export const metadata: Metadata = {
  title: "Consultations | Time Space & Planets",
  description: "Premium consultation services by Dr. Pradeep Sharma — Business Vastu, Strategic Consulting, Career Guidance, and more.",
};

export default function ConsultationsPage() {
  // Consultation-type services = business + leadership + personal
  const services: ServiceDefinition[] = [
    ...getServicesByCategory('business').filter(s => s.id === 'business-vastu'),
    ...getServicesByCategory('leadership'),
    ...getServicesByCategory('personal'),
  ];

  return (
    <div className="min-h-screen bg-[#F7F4EE]">
      <section className="relative pt-32 pb-16 lg:pt-40 lg:pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#22201C] to-[#1A1815]" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-block text-[#C8A04A] text-xs font-semibold tracking-[0.25em] uppercase mb-4 font-poppins">
            Consultations
          </span>
          <h1 className="font-heading text-4xl sm:text-5xl font-bold text-white leading-tight mb-4">
            Expert Consulting Services
          </h1>
          <p className="text-white/50 text-base max-w-2xl mx-auto font-inter">
            One-on-one consultations with Dr. Pradeep Sharma for business strategy, Vastu, and personal guidance.
          </p>
        </div>
      </section>

      <section className="py-12 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service) => (
              <div
                key={service.id}
                className="bg-white rounded-2xl p-6 border border-[#EFEBE1] hover:shadow-md hover:border-[#C8A04A]/20 transition-all duration-300"
              >
                <h3 className="font-heading text-lg font-bold text-[#1E1A16] mb-2">{service.name}</h3>
                <p className="text-sm text-[#6B5F52] mb-4 leading-relaxed">{service.shortDescription}</p>
                <p className="text-xs text-[#8B6914] font-semibold mb-4">
                  From ₹{service.plans[0]?.priceINR.toLocaleString('en-IN')}
                </p>
                <Link
                  href={`/book?service=${service.id}`}
                  className="inline-flex items-center gap-1 text-sm font-semibold text-[#C8A04A] hover:text-[#8B6914] transition-colors"
                >
                  Book Now →
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
