import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { calculatorConfigs } from "@/lib/data/calculator-configs";
import { calculators } from "@/lib/data/calculators";
import CalculatorPageShell from "@/features/calculator/components/CalculatorPageShell";
import ToolPageLayout from "@/features/tools/components/ToolPageLayout";
import { CALCULATOR_CATEGORY_LABELS } from "@/types/calculator";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return calculators.map((calc) => ({
    slug: calc.id,
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const config = calculatorConfigs[slug];
  const item = calculators.find((c) => c.id === slug);

  if (!config || !item) return {};

  const categoryLabel = CALCULATOR_CATEGORY_LABELS[item.category];

  return {
    title: `${item.title} — Free Online Vedic Calculator | Astro Space`,
    description: `${item.description} Access free detailed astrology calculations, compatibility reports, and auspicious timings instantly.`,
    openGraph: {
      title: `${item.title} — Free Online Vedic Calculator`,
      description: item.description,
      type: "website",
      url: `https://astrospace.com/calculators/${slug}`,
    },
    alternates: {
      canonical: `https://astrospace.com/calculators/${slug}`,
    },
  };
}

export default async function CalculatorPage({ params }: Props) {
  const { slug } = await params;
  const config = calculatorConfigs[slug];
  const item = calculators.find((c) => c.id === slug);

  if (!config || !item) {
    notFound();
  }

  const categoryLabel = CALCULATOR_CATEGORY_LABELS[item.category];

  // Fetch related calculators in the same category
  const relatedCalculators = calculators
    .filter((c) => c.category === item.category && c.id !== item.id)
    .map((c) => ({
      id: c.id,
      title: c.title,
      description: c.description,
      href: c.href,
      icon: c.icon,
      categoryLabel: CALCULATOR_CATEGORY_LABELS[c.category],
    }));

  // Render Category-specific rich SEO content
  const renderSeoContent = () => {
    switch (item.category) {
      case "love":
        return (
          <div className="space-y-4 text-paragraph text-sm leading-relaxed">
            <h2 className="font-heading text-xl font-bold text-dark border-b border-border pb-2">
              Understanding Love Compatibility in Vedic Astrology
            </h2>
            <p>
              In Vedic relationship compatibility (known as Guna Milan or relationship alchemy), the alignment of planets and the numeric vibrations of your names hold key insights into the dynamics of your bond. By measuring these cosmic parameters, you can identify areas of harmony, potential growth challenges, and the energetic patterns of communication between you and your partner.
            </p>
            <p>
              Vedic traditions teach us that every name carries a unique frequency. When two people come together, their individual frequencies interact, creating either a constructive resonance or points of friction. Using tools like the Love Calculator and Name Compatibility report allows you to explore these vibrations and understand how to navigate relationship milestones with patience, respect, and mutual alignment.
            </p>
          </div>
        );
      case "numerology":
        return (
          <div className="space-y-4 text-paragraph text-sm leading-relaxed">
            <h2 className="font-heading text-xl font-bold text-dark border-b border-border pb-2">
              Numerology and the Mathematics of the Soul
            </h2>
            <p>
              Numerology is the ancient study of numbers and their symbolic significance. Each number holds a unique vibrational imprint that shapes your character, path, and destiny. By checking your core numbers (such as Mulaank/root number or Lucky Number), you can gain a deeper understanding of your inherent strengths, weaknesses, and the specific energy cycles guiding your actions at any point in time.
            </p>
            <p>
              Your birth date is not a random occurrence; it is a spiritual coordinate. The numbers derived from your name and birth date reveal the underlying lessons and destiny paths you are meant to navigate. Embracing numerology helps you align your choices with the divine mathematics of the universe.
            </p>
          </div>
        );
      case "vedic":
        return (
          <div className="space-y-4 text-paragraph text-sm leading-relaxed">
            <h2 className="font-heading text-xl font-bold text-dark border-b border-border pb-2">
              Vedic Astrology and the Birth Chart Blueprint
            </h2>
            <p>
              Vedic Astrology (Jyotish) is the science of light, mapping the positions of stars and planets at the exact moment of your birth. Your rising sign (Lagna), moon sign (Rashi), and the planetary periods (Dasha) act as a cosmic blueprint for your life's unfolding. Understanding these coordinates helps you align with your natural strengths, anticipate life stages with clarity, and navigate challenges with spiritual grace.
            </p>
            <p>
              Unlike Western astrology, Vedic astrology is sidereal-based, taking into account the actual precession of equinoxes. This precession offset (Ayanamsa) ensures high mathematical precision. Exploring your nakshatra, lagna, and planetary periods enables you to make informed decisions and find remedy pathways to ease karmic obstacles.
            </p>
          </div>
        );
      case "timing":
        return (
          <div className="space-y-4 text-paragraph text-sm leading-relaxed">
            <h2 className="font-heading text-xl font-bold text-dark border-b border-border pb-2">
              Muhurat: The Science of Auspicious Cosmic Timing
            </h2>
            <p>
              In Vedic philosophy, timing is everything. Starting a business, getting married, or beginning a journey during an auspicious planetary window (Shubh Muhurat, Choghadiya, or Hora) aligns your efforts with the natural flow of cosmic energy. By avoiding inauspicious times like Rahu Kaal, you minimize obstacles and cultivate long-term success and peace.
            </p>
            <p>
              Every hour is ruled by a specific planetary force. The Hora and Choghadiya calculators help you divide your day into favorable and unfavorable segments so you can schedule meetings, travels, and investments during periods that support prosperity, intellect, and physical strength.
            </p>
          </div>
        );
      default:
        return null;
    }
  };

  const structuredSchema = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": item.title,
    "description": item.description,
    "applicationCategory": "Astrology Calculator",
    "operatingSystem": "All",
    "browserRequirements": "Requires JavaScript. Requires HTML5.",
  };

  return (
    <ToolPageLayout
      title={item.title}
      description={item.description}
      categoryLabel={categoryLabel}
      categoryHref="/calculators"
      breadcrumbItems={[
        { label: "Calculators", href: "/calculators" },
        { label: item.title },
      ]}
      seoContent={renderSeoContent()}
      relatedTools={relatedCalculators}
      structuredSchema={structuredSchema}
    >
      <div className="bg-card rounded-2xl p-6 border border-border shadow-card">
        <CalculatorPageShell slug={slug} />
      </div>
    </ToolPageLayout>
  );
}
