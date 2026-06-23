import FadeUp from "@/components/animations/FadeUp";
import { pricingPlans } from "@/lib/data/pricing";
import PricingCard from "@/features/home/components/PricingCard";

export default function PricingSection() {
  return (
    <section className="py-16 lg:py-24 bg-white overflow-visible" id="pricing">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 overflow-visible">
        {/* Heading Section */}
        <FadeUp>
          <div className="text-center mb-14">
            <h2 className="font-playfair text-3xl md:text-4xl lg:text-[2.65rem] font-bold text-[#1A1A1A] tracking-tight leading-tight text-balance">
              Guided by the <span className="text-[#9333EA]">Stars</span>
              <br />
              Aligned for <span className="text-[#9333EA]">Greatness</span>
            </h2>
            
            <p className="font-inter text-xs md:text-sm font-medium text-[#8A8A8A] tracking-[0.1em] mt-4 max-w-2xl mx-auto">
              Astrological intelligence for leaders. Clarity for decisions. Success by design.
            </p>

            {/* Simple elegant gold line divider */}
            <div className="flex justify-center mt-6 mb-2">
              <div className="w-24 gradient-line-gold" />
            </div>
          </div>
        </FadeUp>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto items-start overflow-visible pt-6">
          {pricingPlans.map((plan) => (
            <PricingCard
              key={plan.name}
              name={plan.name}
              subtitle={plan.subtitle}
              description={plan.description || ""}
              price={plan.price}
              features={plan.features}
              variant={plan.variant}
              cta={plan.cta}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
