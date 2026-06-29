import Image from "next/image";
import { howItWorksSteps } from "@/lib/data/home";

export default function HowItWorks() {
  return (
    <section className="relative w-full overflow-hidden bg-gradient-to-b from-[#FAF8F5] to-cream py-12 md:py-16 lg:py-24 pt-24 md:pt-28">
      <div className="w-full max-w-7xl mx-auto px-4 md:px-8 lg:px-16 xl:px-24">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-24 gap-x-8 lg:gap-8 mt-12 md:mt-8">
          {howItWorksSteps.map((step) => (
            <div
              key={step.step}
              className="relative overflow-visible rounded-2xl bg-white border border-[#E8E4DC] px-6 pb-8 pt-8 shadow-[0_8px_30px_rgba(0,0,0,0.04)] min-h-62.5 card-premium"
            >
              {/* Step number badge */}
              <div className="absolute top-5 left-5 z-10">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#071B8D] text-white shadow-[0_4px_12px_rgba(7,27,141,0.2)]">
                  <span className="text-[11px] font-bold">{step.step}</span>
                </div>
              </div>

              {/* Circular image area */}
              <div className="absolute -top-16 right-6 z-10 h-40 w-40 overflow-hidden rounded-full border-[3px] border-white bg-[#F7F4EE] shadow-[0_8px_30px_rgba(0,0,0,0.08)]">
                <Image
                  src={step.imageUrl}
                  alt={step.title}
                  fill
                  sizes="160px"
                  className="object-cover"
                />
              </div>

              {/* Content area */}
              <div className="mt-14 space-y-3 max-w-[70%] overflow-hidden break-words">
                <h3 className="font-playfair text-xl sm:text-2xl font-bold leading-tight text-[#1A1A1A]">
                  {step.title}
                </h3>
                <p className="font-inter text-sm font-normal leading-7 text-[#8A8A8A]">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
