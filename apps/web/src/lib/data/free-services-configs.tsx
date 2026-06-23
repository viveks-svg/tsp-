import type { ReactNode } from "react";
import type { FormField } from "@/types/free-services";
import ServiceResultCard from "@/features/free-services/components/ServiceResultCard";

export interface FreeServiceConfig {
  title: string;
  description: string;
  fields: FormField[];
  submitLabel?: string;
  compute: (values: Record<string, string>) => ReactNode;
}

function getSumOfDigits(num: number): number {
  let sum = num;
  while (sum > 9) {
    sum = sum
      .toString()
      .split("")
      .reduce((acc, digit) => acc + parseInt(digit, 10), 0);
  }
  return sum;
}

function getNameRootNumber(name: string): number {
  const sanitized = name.toUpperCase().replace(/[^A-Z]/g, "");
  let sum = 0;
  for (let i = 0; i < sanitized.length; i++) {
    sum += sanitized.charCodeAt(i) - 64; // A=1, B=2...
  }
  return getSumOfDigits(sum);
}

export const freeServicesConfigs: Record<string, FreeServiceConfig> = {
  kundali: {
    title: "Vedic Birth Chart (Kundali)",
    description: "Generate your detailed Vedic birth chart with planetary placements and house analyses.",
    fields: [
      { name: "name", label: "Full Name", type: "text", required: true, placeholder: "Enter your name" },
      { name: "birthDate", label: "Birth Date", type: "date", required: true },
      { name: "birthTime", label: "Birth Time", type: "time", required: true },
      { name: "birthPlace", label: "Birth Place", type: "text", required: true, placeholder: "City, Country" },
    ],
    submitLabel: "Generate Kundali",
    compute: (values) => {
      const name = values.name || "User";
      const birthTime = values.birthTime || "12:00";
      const birthDate = values.birthDate ? new Date(values.birthDate) : new Date();
      const hour = parseInt(birthTime.split(":")[0], 10) || 12;

      // Deterministic chart details
      const lagnaIndex = (hour % 12) + 1;
      
      // Traditional South/North Indian chart presentation style
      // Let's create a beautiful visual representation of the houses
      return (
        <ServiceResultCard title={`${name}'s Janma Kundali Chart`}>
          <div className="space-y-6 font-poppins">
            <div className="flex flex-col items-center justify-center">
              {/* North Indian style Kundali Mock (visual representation with CSS borders) */}
              <div className="relative w-64 h-64 border-2 border-navy bg-cream-dark/10 rounded-xl overflow-hidden shadow-card">
                {/* Diagonal lines */}
                <div className="absolute inset-0 border-t-2 border-b-2 border-navy origin-center rotate-45 scale-150" />
                <div className="absolute inset-0 border-t-2 border-b-2 border-navy origin-center -rotate-45 scale-150" />
                {/* Diamond overlay */}
                <div className="absolute top-1/4 left-1/4 w-32 h-32 border-2 border-navy rotate-45 bg-cream/90 flex items-center justify-center shadow-sm">
                  {/* Ascendant text */}
                  <div className="-rotate-45 text-center">
                    <span className="block text-[10px] uppercase font-bold text-gold">Lagna</span>
                    <span className="text-sm font-extrabold text-navy">{lagnaIndex}</span>
                  </div>
                </div>
                {/* House Labels */}
                <div className="absolute top-2 left-1/2 -translate-x-1/2 text-[9px] font-bold text-navy">House 12</div>
                <div className="absolute top-2 right-2 text-[9px] font-bold text-navy">House 11</div>
                <div className="absolute top-1/2 -translate-y-1/2 right-2 text-[9px] font-bold text-navy">House 10</div>
                <div className="absolute bottom-2 right-2 text-[9px] font-bold text-navy">House 9</div>
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[9px] font-bold text-navy">House 8</div>
                <div className="absolute bottom-2 left-2 text-[9px] font-bold text-navy">House 7</div>
                <div className="absolute top-1/2 -translate-y-1/2 left-2 text-[9px] font-bold text-navy">House 6</div>
                <div className="absolute top-2 left-2 text-[9px] font-bold text-navy">House 5</div>
              </div>
              <span className="text-xs text-muted mt-3">North Indian style Rashi Chart (D1)</span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-card border border-border rounded-xl">
                <span className="block text-muted font-bold uppercase text-[9px]">Ascendant (Lagna)</span>
                <span className="font-semibold text-navy">House {lagnaIndex} (Vedic Lord)</span>
              </div>
              <div className="p-3 bg-card border border-border rounded-xl">
                <span className="block text-muted font-bold uppercase text-[9px]">Sun Position</span>
                <span className="font-semibold text-navy">House {((lagnaIndex + 3) % 12) + 1}</span>
              </div>
              <div className="p-3 bg-card border border-border rounded-xl">
                <span className="block text-muted font-bold uppercase text-[9px]">Moon Position</span>
                <span className="font-semibold text-navy">House {((lagnaIndex + 8) % 12) + 1}</span>
              </div>
            </div>
          </div>
        </ServiceResultCard>
      );
    },
  },

  "kundali-matching": {
    title: "Kundali Matching (Ashtakoot Guna Milan)",
    description: "Calculate relationship compatibility scores based on Ashtakoot Guna Milan system.",
    fields: [
      { name: "boyName", label: "Partner 1 Name", type: "text", required: true, placeholder: "Enter name" },
      { name: "boyBirthDate", label: "Partner 1 Birth Date", type: "date", required: true },
      { name: "girlName", label: "Partner 2 Name", type: "text", required: true, placeholder: "Enter name" },
      { name: "girlBirthDate", label: "Partner 2 Birth Date", type: "date", required: true },
    ],
    submitLabel: "Match Kundali",
    compute: (values) => {
      const boyName = values.boyName || "Partner 1";
      const girlName = values.girlName || "Partner 2";

      // Calculate deterministic matching score
      const combined = (boyName + girlName).toLowerCase();
      let sum = 0;
      for (let i = 0; i < combined.length; i++) {
        sum += combined.charCodeAt(i);
      }
      const matchedGunas = 18 + (sum % 19); // score between 18 and 36 gunas

      let status = "Average Match";
      let statusColor = "text-yellow-600";
      let details = "This union is stable, but requires understanding and patience regarding differences.";

      if (matchedGunas >= 28) {
        status = "Excellent Match (Uttam)";
        statusColor = "text-emerald-600";
        details = "An auspicious and highly compatible relationship. High alignment in core values, physical resonance, and life goals.";
      } else if (matchedGunas >= 22) {
        status = "Good Match (Madhyam)";
        statusColor = "text-gold";
        details = "A solid connection with high potential. Standard remedies can easily resolve minor planetary imbalances.";
      }

      // Ashtakoot categories
      const categories = [
        { name: "Varna (Work alignment)", score: "1 / 1", desc: "Auspicious alignment of intellectual/mental orientations." },
        { name: "Vashya (Influence/Control)", score: matchedGunas > 24 ? "2 / 2" : "1 / 2", desc: "Mutual respect and emotional control parameters." },
        { name: "Tara (Destiny/Luck)", score: matchedGunas > 28 ? "3 / 3" : "1.5 / 3", desc: "Inter-relationship fortune and lifespan safety." },
        { name: "Yoni (Physical resonance)", score: matchedGunas > 30 ? "4 / 4" : "2 / 4", desc: "Physical compatibility and biological harmony." },
        { name: "Maitri (Planetary friendship)", score: matchedGunas > 26 ? "5 / 5" : "3 / 5", desc: "Subconscious alignment and intellectual friendship." },
        { name: "Gana (Temperament)", score: matchedGunas > 28 ? "6 / 6" : "4 / 6", desc: "Mental temperament, alignment of spiritual levels." },
        { name: "Bhakoot (Moon position)", score: matchedGunas > 20 ? "7 / 7" : "0 / 7", desc: "Emotional resonance and wealth progress parameters." },
        { name: "Nadi (Genetic/Health)", score: matchedGunas % 2 === 0 ? "8 / 8" : "0 / 8", desc: "Genetic health alignment and progeny longevity parameters." },
      ];

      return (
        <ServiceResultCard title="Ashtakoot Guna Milan Compatibility Report">
          <div className="space-y-6 font-poppins">
            <div className="text-center p-4 bg-cream-dark/30 border border-border rounded-xl space-y-2">
              <span className="block text-xs font-bold text-muted uppercase">Total Points Matched</span>
              <h4 className="text-3xl font-black text-navy">{matchedGunas} / 36 Gunas</h4>
              <span className={`text-sm font-semibold uppercase ${statusColor}`}>{status}</span>
            </div>

            <p className="text-xs text-paragraph leading-relaxed bg-cream-dark/10 p-3 rounded-lg border border-border">
              {details}
            </p>

            <div className="space-y-3">
              <span className="block text-xs font-bold text-navy uppercase tracking-wider">Detailed Ashtakoot Parameters</span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                {categories.map((cat, idx) => (
                  <div key={idx} className="p-3 border border-border bg-card rounded-lg space-y-1">
                    <div className="flex items-center justify-between font-semibold">
                      <span className="text-navy">{cat.name}</span>
                      <span className="text-gold">{cat.score}</span>
                    </div>
                    <p className="text-[10px] text-muted leading-relaxed">{cat.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ServiceResultCard>
      );
    },
  },

  tarot: {
    title: "Cosmic Tarot Reading",
    description: "Draw cards from the mystical Tarot deck to seek guidance on your query.",
    fields: [
      { name: "query", label: "Your Question / Intent", type: "text", required: true, placeholder: "What aspect of life are you seeking guidance on?" },
      { name: "spread", label: "Select Spread", type: "select", options: ["Single Card", "Three Cards (Past, Present, Future)"], required: true },
    ],
    submitLabel: "Draw Cards",
    compute: (values) => {
      const query = values.query || "My Path";
      const spread = values.spread || "Single Card";

      const tarotCards = [
        { name: "The Magician (I)", type: "Action & Potential", desc: "Represents willpower, creation, desire, and resourcefulness. You have the tools to manifest your dreams." },
        { name: "The High Priestess (II)", type: "Intuition & Mystery", desc: "Represents intuition, unconscious knowledge, and trust in inner guidance. Sit still and listen." },
        { name: "The Empress (III)", type: "Abundance & Growth", desc: "Represents motherhood, nature, creation, fertility, and beauty. A period of warm expansion awaits." },
        { name: "The Emperor (IV)", type: "Authority & Structure", desc: "Represents authority, structure, solid foundation, and protective leadership. Establish solid rules." },
        { name: "The Lovers (VI)", type: "Harmony & Choice", desc: "Represents relationships, alignment of values, choices, and trust. A crucial decision is close." },
        { name: "Wheel of Fortune (X)", type: "Change & Cycles", desc: "Represents karma, destiny, turning points, and luck. What goes up must come down; change is constant." },
        { name: "The Star (XVII)", type: "Hope & Healing", desc: "Represents hope, faith, healing, and spiritual renewal. Safe passage is assured. Peace returns." },
        { name: "The Sun (XIX)", type: "Joy & Success", desc: "Represents success, joy, positivity, truth, and warmth. Total clarity and abundance will shine." },
      ];

      // Deterministically select cards based on query length
      const seed = query.length;
      const cardsDrawn = spread === "Single Card" 
        ? [tarotCards[seed % tarotCards.length]]
        : [
            tarotCards[seed % tarotCards.length],
            tarotCards[(seed + 2) % tarotCards.length],
            tarotCards[(seed + 5) % tarotCards.length],
          ];

      const spreadPositions = ["Past", "Present", "Future"];

      return (
        <ServiceResultCard title={`Tarot Reading for: "${query}"`}>
          <div className="space-y-6 font-poppins">
            <div className={`grid grid-cols-1 gap-4 ${spread !== "Single Card" ? "md:grid-cols-3" : "max-w-sm mx-auto"}`}>
              {cardsDrawn.map((card, idx) => (
                <div key={idx} className="p-4 border-2 border-gold bg-cream-dark/10 rounded-xl text-center space-y-3 shadow-sm hover:shadow-card transition-shadow">
                  {spread !== "Single Card" && (
                    <span className="block text-[10px] uppercase font-bold text-gold tracking-widest bg-gold/10 px-2 py-0.5 rounded-full w-max mx-auto">
                      {spreadPositions[idx]}
                    </span>
                  )}
                  {/* Mock card graphical frame */}
                  <div className="w-24 h-36 border border-gold/40 bg-card rounded-lg mx-auto flex flex-col justify-between p-2 shadow-inner">
                    <span className="text-xs font-bold text-navy opacity-65">Astro Tarot</span>
                    <span className="text-2xl">✦</span>
                    <span className="text-[10px] font-semibold text-gold truncate">{card.name.split(" ")[0]}</span>
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-navy">{card.name}</h5>
                    <span className="text-[10px] text-muted font-medium">{card.type}</span>
                  </div>
                  <p className="text-[11px] text-paragraph leading-relaxed text-left border-t border-border pt-2.5">
                    {card.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </ServiceResultCard>
      );
    },
  },

  numerology: {
    title: "Personal Numerology Chart",
    description: "Calculate your core numerology grid including Life Path, Expression, and Soul numbers.",
    fields: [
      { name: "name", label: "Full Name", type: "text", required: true, placeholder: "Enter full name" },
      { name: "birthDate", label: "Birth Date", type: "date", required: true },
    ],
    submitLabel: "Calculate Grid",
    compute: (values) => {
      const name = values.name || "User";
      const birthDate = values.birthDate;
      if (!birthDate) return <p className="text-sm text-rose-500">Please provide a valid birth date.</p>;

      // Core calculation
      const day = new Date(birthDate).getDate();
      const month = new Date(birthDate).getMonth() + 1;
      const year = new Date(birthDate).getFullYear();

      const lifePath = getSumOfDigits(day + month + year);
      const expressionNum = getNameRootNumber(name);
      const soulUrge = getSumOfDigits(getNameRootNumber(name) + day);

      const lifePathDesc: Record<number, string> = {
        1: "Pioneer, leader, independent spirit, strong individuality.",
        2: "Diplomat, peacemaker, cooperative partner, highly sensitive.",
        3: "Creative communicator, artistic, expressive, social optimist.",
        4: "Practical builder, structured worker, reliable, values security.",
        5: "Adaptable explorer, freedom lover, progressive thinker.",
        6: "Nurturing counselor, artistic protector, domestic responsibility.",
        7: "Spiritual seeker, analytical researcher, introspective investigator.",
        8: "Ambitious executive, karmic material balancer, authoritative.",
        9: "Universal humanitarian, compassionate completion, spiritual mentor.",
      };

      return (
        <ServiceResultCard title={`Numerology Chart for ${name}`}>
          <div className="space-y-4 font-poppins text-xs">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 bg-cream-dark/30 border border-border rounded-xl">
                <span className="block text-muted font-bold uppercase text-[9px] tracking-wider mb-1">Life Path</span>
                <span className="text-3xl font-extrabold text-navy">{lifePath}</span>
              </div>
              <div className="p-3 bg-cream-dark/30 border border-border rounded-xl">
                <span className="block text-muted font-bold uppercase text-[9px] tracking-wider mb-1">Expression</span>
                <span className="text-3xl font-extrabold text-navy">{expressionNum}</span>
              </div>
              <div className="p-3 bg-cream-dark/30 border border-border rounded-xl">
                <span className="block text-muted font-bold uppercase text-[9px] tracking-wider mb-1">Soul Urge</span>
                <span className="text-3xl font-extrabold text-navy">{soulUrge}</span>
              </div>
            </div>

            <div className="space-y-3.5 pt-3">
              <div className="p-3 border border-border bg-card rounded-lg">
                <strong className="block text-navy text-sm font-bold">Life Path {lifePath} Meaning</strong>
                <p className="text-paragraph leading-relaxed mt-1 text-[11px]">{lifePathDesc[lifePath] || "A unique frequency guiding your spiritual development path."}</p>
              </div>
              <div className="p-3 border border-border bg-card rounded-lg">
                <strong className="block text-navy text-sm font-bold">Expression {expressionNum} Meaning</strong>
                <p className="text-paragraph leading-relaxed mt-1 text-[11px]">How you express your talents and project yourself to satisfy your destiny.</p>
              </div>
            </div>
          </div>
        </ServiceResultCard>
      );
    },
  },

  panchang: {
    title: "Daily Sacred Panchang",
    description: "Check today's detailed Panchang parameters — Tithi, Nakshatra, Yoga, and auspicious timings.",
    fields: [
      { name: "date", label: "Select Date", type: "date", required: true },
      { name: "location", label: "Location", type: "text", required: true, placeholder: "City, Country" },
    ],
    submitLabel: "Generate Almanac",
    compute: (values) => {
      const dateStr = values.date || "Today";
      const location = values.location || "Current Location";

      return (
        <ServiceResultCard title={`Vedic Panchang: ${dateStr}`}>
          <div className="space-y-6 font-poppins text-xs">
            <span className="text-muted block">Calculated for <strong className="text-navy">{location}</strong>:</span>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-card border border-border rounded-xl space-y-1">
                <span className="block text-muted font-bold uppercase text-[9px] tracking-wider">Tithi (Lunar Day)</span>
                <span className="text-sm font-bold text-navy">Ekadashi (Shukla Paksha)</span>
                <span className="block text-[10px] text-paragraph leading-relaxed">Highly auspicious for fasting and meditation. Ends at 04:15 PM.</span>
              </div>
              <div className="p-3 bg-card border border-border rounded-xl space-y-1">
                <span className="block text-muted font-bold uppercase text-[9px] tracking-wider">Nakshatra (Star)</span>
                <span className="text-sm font-bold text-navy">Rohini</span>
                <span className="block text-[10px] text-paragraph leading-relaxed">Governed by Moon/Brahma. Creative, nurturing, stable.</span>
              </div>
              <div className="p-3 bg-card border border-border rounded-xl space-y-1">
                <span className="block text-muted font-bold uppercase text-[9px] tracking-wider">Yoga</span>
                <span className="text-sm font-bold text-navy">Harshana</span>
                <span className="block text-[10px] text-paragraph leading-relaxed">Spells happiness and jovial atmospheres. Good for reunions.</span>
              </div>
              <div className="p-3 bg-card border border-border rounded-xl space-y-1">
                <span className="block text-muted font-bold uppercase text-[9px] tracking-wider">Karana</span>
                <span className="text-sm font-bold text-navy">Bava</span>
                <span className="block text-[10px] text-paragraph leading-relaxed">Governed by Vishnu. Good for business expansions and agriculture.</span>
              </div>
            </div>

            <div className="border-t border-border pt-4">
              <span className="block text-xs font-bold text-navy uppercase tracking-wider mb-2.5">Sun & Moon Coordinates</span>
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="p-2 bg-cream-dark/20 border border-border/60 rounded">
                  <span className="block text-muted text-[8px] font-bold">Sunrise</span>
                  <span className="font-semibold text-navy">05:43 AM</span>
                </div>
                <div className="p-2 bg-cream-dark/20 border border-border/60 rounded">
                  <span className="block text-muted text-[8px] font-bold">Sunset</span>
                  <span className="font-semibold text-navy">07:02 PM</span>
                </div>
                <div className="p-2 bg-cream-dark/20 border border-border/60 rounded">
                  <span className="block text-muted text-[8px] font-bold">Moonrise</span>
                  <span className="font-semibold text-navy">02:15 PM</span>
                </div>
                <div className="p-2 bg-cream-dark/20 border border-border/60 rounded">
                  <span className="block text-muted text-[8px] font-bold">Moonset</span>
                  <span className="font-semibold text-navy">01:50 AM</span>
                </div>
              </div>
            </div>
          </div>
        </ServiceResultCard>
      );
    },
  },

  "mangal-dosha": {
    title: "Mangal Dosha Checker",
    description: "Check for Manglik planetary placements in your natal horoscope charts.",
    fields: [
      { name: "name", label: "Full Name", type: "text", required: true, placeholder: "Enter name" },
      { name: "birthDate", label: "Birth Date", type: "date", required: true },
      { name: "birthTime", label: "Birth Time", type: "time", required: true },
      { name: "birthPlace", label: "Birth Place", type: "text", required: true, placeholder: "City, Country" },
    ],
    submitLabel: "Check Dosha Status",
    compute: (values) => {
      const name = values.name || "User";
      const birthTime = values.birthTime || "12:00";
      
      const hours = parseInt(birthTime.split(":")[0], 10) || 12;
      // Deterministically set Dosha based on hours
      // Mangal Dosha occurs when Mars is in 1, 2, 4, 7, 8, 12 houses.
      const isManglik = [1, 2, 4, 7, 8, 12].includes(hours % 12);

      return (
        <ServiceResultCard title={`Mangal Dosha Report: ${name}`}>
          <div className="space-y-4 font-poppins text-xs">
            {isManglik ? (
              <div className="p-4 border border-rose-200 bg-rose-50/50 rounded-xl space-y-1.5 text-center">
                <span className="block text-xs font-bold text-rose-700 uppercase tracking-widest">Status: Manglik (Dosha Present)</span>
                <p className="text-[11px] text-rose-800 leading-relaxed max-w-sm mx-auto">
                  Mars occupies the {hours % 12} house in your Rashi chart. This configuration represents fierce emotional energy in partnerships.
                </p>
              </div>
            ) : (
              <div className="p-4 border border-emerald-200 bg-emerald-50/50 rounded-xl space-y-1.5 text-center">
                <span className="block text-xs font-bold text-emerald-700 uppercase tracking-widest">Status: Non-Manglik (No Dosha)</span>
                <p className="text-[11px] text-emerald-850 leading-relaxed max-w-sm mx-auto">
                  No significant Mars-related obstacles are found in your core partnership houses. Very favorable for relationship harmony.
                </p>
              </div>
            )}

            <div className="p-3.5 bg-cream-dark/15 border border-border/40 rounded-lg space-y-2 text-left">
              <strong className="block text-navy text-sm font-bold">Suggested Remedial Actions</strong>
              <ul className="list-disc pl-4 space-y-1 text-paragraph leading-relaxed text-[11px]">
                {isManglik ? (
                  <>
                    <li>Chant the Hanuman Chalisa on Tuesdays to cool mars energies.</li>
                    <li>Donate red lentils (Masoor Dal) or copper materials on Tuesdays.</li>
                    <li>Conduct Kumbh Vivah or Vishnu Vivah rituals before marriage.</li>
                  </>
                ) : (
                  <>
                    <li>No severe remedies required.</li>
                    <li>Maintain clean communication.</li>
                    <li>Wear silver or pearl to enhance overall moon harmony.</li>
                  </>
                )}
              </ul>
            </div>
          </div>
        </ServiceResultCard>
      );
    },
  },
};
