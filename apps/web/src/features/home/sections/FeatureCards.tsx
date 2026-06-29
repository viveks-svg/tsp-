import { MessageCircle, Scroll, Clock } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const cards = [
  {
    title: "First Chat @ ₹1",
    description: "Experience executive-level guidance for your most pressing life questions.",
    icon: MessageCircle,
    linkText: "REDEEM OFFER →",
    highlighted: false,
    href: "/consultations/chat"
  },
  {
    title: "Free Kundli Analysis",
    description: "Deep dive into your birth chart with professional-grade astrological mapping.",
    icon: Scroll,
    linkText: "START ANALYSIS →",
    highlighted: true,
    href: "free-services/kundali"
  },
  {
    title: "Get 5 Minutes Free",
    description: "Trial any specialist for five minutes to ensure the perfect energetic match.",
    icon: Clock,
    linkText: "CLAIM MINUTES →",
    highlighted: false,
    href: "/consultations/chat"
  },
];

export default function FeatureCards() {
  return (
    <section className="relative w-full py-12 md:py-16 lg:py-24 bg-gradient-to-b from-[#FAF7F1] to-[#F5F0E6] overflow-hidden" id="feature-cards">
      <div className="w-full max-w-7xl mx-auto px-4 md:px-8 lg:px-16 xl:px-24">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.title}
                className={`relative rounded-2xl p-6 md:p-8 lg:p-10 card-premium overflow-hidden ${card.highlighted
                  ? "bg-gradient-to-b from-[#F6A000] to-[#D88D14] text-white shadow-[0_15px_40px_rgba(246,160,0,0.2)] border border-gold/20"
                  : "bg-white text-[#1A1A1A] shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-[#F0ECE4]"
                  }`}
              >
                {/* Zodiac Wheel Watermark Background */}
                <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none select-none">
                  <Image
                    src="/images/wheel image.png"
                    alt="Watermark"
                    width={350}
                    height={350}
                    className={`absolute -right-16 -bottom-16 w-[260px] h-[260px] object-contain select-none pointer-events-none transition-opacity duration-300 ${card.highlighted
                      ? "opacity-[0.06] invert brightness-200"
                      : "opacity-[0.04] grayscale brightness-75"
                      }`}
                  />
                </div>

                {/* Card Icon */}
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 relative z-10 ${card.highlighted
                  ? "bg-white/15 text-white"
                  : "bg-gold/[0.07] text-gold"
                  }`}>
                  <Icon className="w-6 h-6" strokeWidth={1.75} />
                </div>

                {/* Card Title */}
                <h3 className={`font-heading text-2xl lg:text-[1.65rem] font-bold mb-3 relative z-10 ${card.highlighted ? "text-white" : "text-[#1A1A1A]"
                  }`}>
                  {card.title}
                </h3>

                {/* Card Description */}
                <p className={`text-sm lg:text-[0.95rem] leading-relaxed mb-8 relative z-10 max-w-[280px] ${card.highlighted ? "text-white/85" : "text-[#6B6B6B]"
                  }`}>
                  {card.description}
                </p>

                {/* Card Action Link */}
                <Link
                  href={card.href}
                  className={`inline-flex items-center gap-1.5 text-[11px] font-bold tracking-[0.15em] relative z-10 transition-transform duration-200 hover:translate-x-1 ${card.highlighted ? "text-white/90" : "text-gold"
                    }`}
                >
                  {card.linkText}
                </Link>
              </div>
            );
          })}
        </div>
      </div>

      {/* Elegant section transition instead of brown bar */}
      <div className="w-full">
        <div className="max-w-4xl mx-auto px-8">
          <div className="gradient-line-gold" />
        </div>
      </div>
    </section>
  );
}
