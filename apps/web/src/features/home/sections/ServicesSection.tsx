import ServiceCard from "@/features/home/components/ServiceCard";
import FadeUp from "@/components/animations/FadeUp";
import { services } from "@/lib/data/services";

export default function ServicesSection() {
  return (
    <section
      className="relative py-16 lg:py-24 overflow-hidden bg-gradient-to-br from-[#F6A000] via-[#E89500] to-[#D88D14]"
      id="services"
    >
      {/* Subtle noise overlay */}
      <div className="absolute inset-0 bg-noise pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <FadeUp>
          <div className="text-center mb-14">
            <div className="flex items-center justify-center gap-4 mb-3">
              <div className="w-12 h-px bg-white/25" />
              <span className="text-white/60 text-sm">✦</span>
              <div className="w-12 h-px bg-white/25" />
            </div>
            <h2 className="font-heading text-4xl md:text-5xl font-bold text-white text-balance">
              Our Services
            </h2>
          </div>
        </FadeUp>

        {/* Service Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {services.map((service) => (
            <ServiceCard
              key={service.title}
              title={service.title}
              description={service.description}
              icon={service.icon}
            />
          ))}
        </div>

        {/* Bottom CTA */}
        <FadeUp delay={0.4}>
          <div className="mt-12 text-center">
            <a
              href="#"
              className="inline-flex items-center gap-2 bg-transparent text-white border border-white/40 px-8 py-3.5 rounded-full text-sm font-semibold hover:bg-white hover:text-[#D88D14] hover:border-white hover:shadow-[0_8px_30px_rgba(255,255,255,0.2)] active:scale-[0.98] transition-all duration-300"
            >
              View All Services
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </a>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}
