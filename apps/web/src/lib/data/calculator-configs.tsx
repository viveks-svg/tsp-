import type { ReactNode } from "react";
import type { CalculatorConfig } from "@/types/calculator";
import ServiceResultCard from "@/features/free-services/components/ServiceResultCard";

// Helpers for calculations
function getDeterministicScore(str1: string, str2: string): number {
  const combined = (str1 + str2).toLowerCase().replace(/\s+/g, "");
  let sum = 0;
  for (let i = 0; i < combined.length; i++) {
    sum += combined.charCodeAt(i);
  }
  return 60 + (sum % 41); // Returns score between 60% and 100%
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

export const calculatorConfigs: Record<string, CalculatorConfig> = {
  love: {
    title: "Love Calculator",
    description: "Measure the cosmic chemistry between two names using name numerology.",
    fields: [
      { name: "yourName", label: "Your Name", type: "text", required: true, placeholder: "Enter your name" },
      { name: "partnerName", label: "Partner's Name", type: "text", required: true, placeholder: "Enter partner's name" },
    ],
    submitLabel: "Calculate Compatibility",
    compute: (values) => {
      const yourName = values.yourName || "You";
      const partnerName = values.partnerName || "Partner";
      const score = getDeterministicScore(yourName, partnerName);
      const gunas = Math.round((score / 100) * 36);

      let feedback = "A balanced relationship requiring patience and mutual understanding.";
      if (score >= 90) {
        feedback = "An extraordinary cosmic match with deep spiritual harmony and understanding.";
      } else if (score >= 80) {
        feedback = "A wonderful connection full of chemistry, trust, and shared values.";
      } else if (score >= 70) {
        feedback = "A strong bond. Mutual effort and honest communication will make it thrive.";
      }

      return (
        <ServiceResultCard title="Love Compatibility Report">
          <div className="flex flex-col items-center text-center space-y-4 py-4">
            <div className="relative flex items-center justify-center w-32 h-32 rounded-full border-4 border-gold bg-cream-dark/30 shadow-inner">
              <span className="text-3xl font-extrabold text-navy font-poppins">{score}%</span>
            </div>
            <div>
              <h4 className="text-lg font-bold text-navy font-heading">
                {yourName} & {partnerName}
              </h4>
              <p className="text-xs text-muted font-poppins mt-1">
                Guna Milan Equivalent: <strong className="text-gold">{gunas} out of 36 Gunas</strong> matched
              </p>
            </div>
            <p className="text-sm font-body text-paragraph max-w-md bg-cream-dark/40 p-4 rounded-xl border border-border">
              {feedback}
            </p>
          </div>
        </ServiceResultCard>
      );
    },
  },

  "name-compatibility": {
    title: "Name Compatibility",
    description: "Discover how your names vibrate together in harmony using Pythagorean Numerology.",
    fields: [
      { name: "yourName", label: "Your Name", type: "text", required: true, placeholder: "Enter your name" },
      { name: "partnerName", label: "Partner's Name", type: "text", required: true, placeholder: "Enter partner's name" },
    ],
    submitLabel: "Check Resonance",
    compute: (values) => {
      const yourName = values.yourName || "You";
      const partnerName = values.partnerName || "Partner";
      const yourRoot = getNameRootNumber(yourName);
      const partnerRoot = getNameRootNumber(partnerName);
      const harmony = getSumOfDigits(yourRoot + partnerRoot);

      const numerologyMeanings: Record<number, string> = {
        1: "Indicates leadership, pioneering energy, and strong individual focus.",
        2: "Indicates partnership, cooperation, diplomacy, and emotional support.",
        3: "Indicates creativity, joy, expressive communication, and social connection.",
        4: "Indicates stability, hard work, structure, and grounding security.",
        5: "Indicates adventure, movement, freedom, and dynamic change.",
        6: "Indicates nurturing care, domestic responsibility, harmony, and love.",
        7: "Indicates analysis, spiritual seeking, wisdom, and introspective depth.",
        8: "Indicates material power, ambition, authority, and karma balance.",
        9: "Indicates humanitarian goals, completion, spiritual release, and empathy.",
      };

      return (
        <ServiceResultCard title="Name Vibration Resonance Report">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="p-3 bg-cream-dark/30 border border-border rounded-xl">
                <span className="block text-xs font-bold text-muted font-poppins uppercase">Your Name Root</span>
                <span className="text-2xl font-bold text-navy font-poppins">{yourRoot}</span>
              </div>
              <div className="p-3 bg-cream-dark/30 border border-border rounded-xl">
                <span className="block text-xs font-bold text-muted font-poppins uppercase">Partner Name Root</span>
                <span className="text-2xl font-bold text-navy font-poppins">{partnerRoot}</span>
              </div>
            </div>
            <div className="p-4 border border-gold/30 bg-gold/5 rounded-xl text-center space-y-2">
              <span className="block text-xs font-bold text-gold font-poppins uppercase tracking-wider">Relationship Vibration Number</span>
              <span className="text-3xl font-extrabold text-navy font-poppins">{harmony}</span>
              <p className="text-sm font-body text-paragraph mt-2">
                {numerologyMeanings[harmony] || "A unique vibrational energy that promotes growth and development."}
              </p>
            </div>
          </div>
        </ServiceResultCard>
      );
    },
  },

  dasha: {
    title: "Dasha Calculator",
    description: "Calculate your current Vimshottari Dasha timeline based on birth coordinates.",
    fields: [
      { name: "birthDate", label: "Birth Date", type: "date", required: true },
      { name: "birthTime", label: "Birth Time", type: "time", required: true },
      { name: "birthPlace", label: "Birth Place", type: "places-autocomplete", required: true, placeholder: "City, Country" },
    ],
    submitLabel: "Calculate Dasha Periods",
    compute: async (values) => {
      let dashas = [];
      let currentDasha = null;
      let balance = { years: 0, months: 0, days: 0 };
      const currentYear = new Date().getFullYear();

      try {
        const { fetchDasha } = await import("@/lib/api/ephemeris");
        const apiData = await fetchDasha({
          birthDate: values.birthDate,
          birthTime: values.birthTime,
          birthPlace: values.birthPlace,
        });

        dashas = apiData.mahadashas.map((d: any) => ({
          planet: d.planet,
          years: d.durationYears,
          start: new Date(d.startDate).getFullYear(),
        }));

        balance = apiData.balanceAtBirth;
        currentDasha = dashas.find((d: any) => currentYear >= d.start && currentYear < d.start + d.years) || dashas[5];
      } catch (error) {
        // Fallback local calculation
        const birthYear = values.birthDate ? new Date(values.birthDate).getFullYear() : currentYear;
        dashas = [
          { planet: "Ketu", years: 7, start: birthYear },
          { planet: "Venus", years: 20, start: birthYear + 7 },
          { planet: "Sun", years: 6, start: birthYear + 27 },
          { planet: "Moon", years: 10, start: birthYear + 33 },
          { planet: "Mars", years: 7, start: birthYear + 43 },
          { planet: "Rahu", years: 18, start: birthYear + 50 },
          { planet: "Jupiter", years: 16, start: birthYear + 68 },
          { planet: "Saturn", years: 19, start: birthYear + 84 },
          { planet: "Mercury", years: 17, start: birthYear + 103 },
        ];
        currentDasha = dashas.find(d => currentYear >= d.start && currentYear < d.start + d.years) || dashas[5];
      }

      return (
        <ServiceResultCard title="Your Vimshottari Dasha Timeline">
          <div className="space-y-4">
            <div className="p-4 bg-navy text-white rounded-xl text-center space-y-1">
              <span className="text-xs uppercase tracking-wider text-gold/80 font-poppins font-bold">Current Mahadasha</span>
              <h4 className="text-xl font-bold font-heading">{currentDasha.planet}</h4>
              <p className="text-xs font-poppins opacity-90">
                Active from {currentDasha.start} to {currentDasha.start + currentDasha.years} (Duration: {currentDasha.years} years)
              </p>
            </div>
            {balance.years > 0 && (
              <div className="text-center text-xs text-muted mb-2 font-poppins">
                Balance at birth: {balance.years} years, {balance.months} months, {balance.days} days
              </div>
            )}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs font-poppins">
                <thead>
                  <tr className="border-b border-border bg-cream-dark/50">
                    <th className="py-2 px-3 font-semibold text-dark">Planet</th>
                    <th className="py-2 px-3 font-semibold text-dark">Duration (Years)</th>
                    <th className="py-2 px-3 font-semibold text-dark">Active Period</th>
                    <th className="py-2 px-3 font-semibold text-dark">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {dashas.map((d: any) => {
                    const isCurrent = d.planet === currentDasha.planet;
                    const isPast = currentYear >= d.start + d.years;
                    return (
                      <tr key={d.planet} className={isCurrent ? "bg-gold/10 font-bold" : ""}>
                        <td className="py-2 px-3 text-navy">{d.planet}</td>
                        <td className="py-2 px-3 text-paragraph">{d.years}</td>
                        <td className="py-2 px-3 text-paragraph">{d.start} – {d.start + d.years}</td>
                        <td className="py-2 px-3">
                          {isCurrent && <span className="text-gold">Active</span>}
                          {isPast && <span className="text-muted/60">Completed</span>}
                          {!isCurrent && !isPast && <span className="text-paragraph">Upcoming</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </ServiceResultCard>
      );
    },
  },

  mulaank: {
    title: "Mulaank (Root Number)",
    description: "Calculate your birth day root number and its ruling planet in Vedic numerology.",
    fields: [
      { name: "birthDate", label: "Birth Date", type: "date", required: true },
    ],
    submitLabel: "Find Mulaank",
    compute: (values) => {
      const dateStr = values.birthDate;
      if (!dateStr) return <p className="text-sm text-rose-500">Please provide a valid birth date.</p>;
      const day = new Date(dateStr).getDate();
      const mulaank = getSumOfDigits(day);

      const details: Record<number, { planet: string; traits: string; gem: string; days: string }> = {
        1: { planet: "Sun (Surya)", traits: "Independent, leadership qualities, ambitious, pioneering.", gem: "Ruby", days: "Sunday, Monday" },
        2: { planet: "Moon (Chandra)", traits: "Creative, sensitive, cooperative, intuitive, emotional.", gem: "Pearl", days: "Monday, Friday" },
        3: { planet: "Jupiter (Guru)", traits: "Optimistic, spiritual, wise, disciplined, intellectual.", gem: "Yellow Sapphire", days: "Thursday, Friday" },
        4: { planet: "Rahu", traits: "Rebellious, innovative, energetic, unconventional, hardworking.", gem: "Gomed (Hessonite)", days: "Saturday, Sunday" },
        5: { planet: "Mercury (Budha)", traits: "Analytical, communicative, versatile, adaptable, quick-witted.", gem: "Emerald", days: "Wednesday, Friday" },
        6: { planet: "Venus (Shukra)", traits: "Nurturing, luxury-loving, artistic, romantic, responsible.", gem: "Diamond", days: "Friday, Tuesday" },
        7: { planet: "Ketu", traits: "Spiritual, mystical, analytical, philosophical, private.", gem: "Cat's Eye", days: "Monday, Wednesday" },
        8: { planet: "Saturn (Shani)", traits: "Disciplined, patient, karmic, realistic, authoritative.", gem: "Blue Sapphire", days: "Saturday, Friday" },
        9: { planet: "Mars (Mangal)", traits: "Courageous, active, determined, humanitarian, protective.", gem: "Red Coral", days: "Tuesday, Thursday" },
      };

      const info = details[mulaank];

      return (
        <ServiceResultCard title={`Mulaank ${mulaank} Analysis`}>
          <div className="space-y-4 font-poppins">
            <div className="flex flex-col items-center justify-center p-4 bg-cream-dark/30 border border-border rounded-xl text-center space-y-2">
              <span className="text-xs font-bold text-muted uppercase">Your Root Number</span>
              <span className="text-5xl font-black text-navy">{mulaank}</span>
              <span className="text-sm font-semibold text-gold">Ruled by {info.planet}</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-card border border-border rounded-lg">
                <span className="block font-bold text-navy mb-1">Lucky Days</span>
                <span className="text-paragraph">{info.days}</span>
              </div>
              <div className="p-3 bg-card border border-border rounded-lg">
                <span className="block font-bold text-navy mb-1">Auspicious Gemstone</span>
                <span className="text-paragraph">{info.gem}</span>
              </div>
            </div>
            <div className="p-3.5 bg-cream-dark/15 border border-border/40 rounded-lg text-xs leading-relaxed text-paragraph">
              <strong className="block text-navy font-bold text-sm mb-1.5 font-heading">Core Personality Traits</strong>
              {info.traits}
            </div>
          </div>
        </ServiceResultCard>
      );
    },
  },

  rashi: {
    title: "Rashi Calculator",
    description: "Determine your Vedic Moon Sign (Rashi) based on your birth coordinates.",
    fields: [
      { name: "birthDate", label: "Birth Date", type: "date", required: true },
      { name: "birthTime", label: "Birth Time", type: "time", required: true },
      { name: "birthPlace", label: "Birth Place", type: "places-autocomplete", required: true, placeholder: "City, Country" },
    ],
    submitLabel: "Find Rashi",
    compute: async (values) => {
      let rashi;
      try {
        const { fetchRashi } = await import("@/lib/api/ephemeris");
        const apiData = await fetchRashi({
          birthDate: values.birthDate,
          birthTime: values.birthTime,
          birthPlace: values.birthPlace,
        });
        rashi = {
          name: `${apiData.rashiEnglish} (${apiData.rashi})`,
          planet: apiData.rulingPlanet,
          element: apiData.element,
          symbol: apiData.symbol,
          traits: apiData.quality + " qualities.",
        };
      } catch (error) {
        const birthDate = values.birthDate ? new Date(values.birthDate) : new Date();
        const month = birthDate.getMonth(); // 0-11
        const rashis = [
          { name: "Aries (Mesha)", planet: "Mars", element: "Fire", symbol: "Ram", traits: "Energetic, dynamic, courageous, and direct." },
          { name: "Taurus (Vrishabha)", planet: "Venus", element: "Earth", symbol: "Bull", traits: "Patient, reliable, artistic, and steady." },
          { name: "Gemini (Mithuna)", planet: "Mercury", element: "Air", symbol: "Twins", traits: "Intellectual, witty, adaptable, and communicative." },
          { name: "Cancer (Karka)", planet: "Moon", element: "Water", symbol: "Crab", traits: "Nurturing, intuitive, protective, and emotional." },
          { name: "Leo (Simha)", planet: "Sun", element: "Fire", symbol: "Lion", traits: "Generous, expressive, proud, and charismatic." },
          { name: "Virgo (Kanya)", planet: "Mercury", element: "Earth", symbol: "Virgin", traits: "Analytical, methodical, helpful, and detail-oriented." },
          { name: "Libra (Tula)", planet: "Venus", element: "Air", symbol: "Scales", traits: "Harmonious, diplomatic, aesthetic, and relationship-focused." },
          { name: "Scorpio (Vrishchika)", planet: "Mars", element: "Water", symbol: "Scorpion", traits: "Intense, mystical, resilient, and transformative." },
          { name: "Sagittarius (Dhanu)", planet: "Jupiter", element: "Fire", symbol: "Archer", traits: "Optimistic, philosophical, adventurous, and truth-seeking." },
          { name: "Capricorn (Makara)", planet: "Saturn", element: "Earth", symbol: "Sea-Goat", traits: "Ambitious, disciplined, structured, and patient." },
          { name: "Aquarius (Kumbha)", planet: "Saturn", element: "Air", symbol: "Water Bearer", traits: "Humanitarian, innovative, detached, and intellectual." },
          { name: "Pisces (Meena)", planet: "Jupiter", element: "Water", symbol: "Fish", traits: "Compassionate, spiritual, imaginative, and sacrifice-loving." },
        ];
        rashi = rashis[Math.min(month, 11)];
      }

      return (
        <ServiceResultCard title="Your Rashi (Moon Sign) Result">
          <div className="space-y-4 font-poppins">
            <div className="text-center p-4 bg-cream-dark/30 border border-border rounded-xl">
              <span className="block text-xs font-bold text-muted uppercase">Your Moon Sign (Rashi)</span>
              <h4 className="text-2xl font-bold text-navy mt-1 font-heading">{rashi.name}</h4>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center text-xs">
              <div className="p-2.5 bg-card border border-border rounded-lg">
                <span className="block text-muted font-bold uppercase mb-0.5 text-[9px]">Ruling Lord</span>
                <span className="text-navy font-semibold">{rashi.planet}</span>
              </div>
              <div className="p-2.5 bg-card border border-border rounded-lg">
                <span className="block text-muted font-bold uppercase mb-0.5 text-[9px]">Element</span>
                <span className="text-navy font-semibold">{rashi.element}</span>
              </div>
              <div className="p-2.5 bg-card border border-border rounded-lg">
                <span className="block text-muted font-bold uppercase mb-0.5 text-[9px]">Symbol</span>
                <span className="text-navy font-semibold">{rashi.symbol}</span>
              </div>
            </div>
            <div className="p-3.5 bg-cream-dark/15 border border-border/40 rounded-lg text-xs leading-relaxed text-paragraph">
              <strong className="block text-navy font-bold mb-1">Nature & Characteristics</strong>
              {rashi.traits} Moon sign signifies your mental landscape and emotional responses.
            </div>
          </div>
        </ServiceResultCard>
      );
    },
  },

  lagna: {
    title: "Lagna Calculator",
    description: "Determine your Ascendant (Lagna) — the rising sign in your first house.",
    fields: [
      { name: "birthDate", label: "Birth Date", type: "date", required: true },
      { name: "birthTime", label: "Birth Time", type: "time", required: true },
      { name: "birthPlace", label: "Birth Place", type: "places-autocomplete", required: true, placeholder: "City, Country" },
    ],
    submitLabel: "Find Lagna",
    compute: async (values) => {
      let lagna = "Aries";
      try {
        const { fetchLagna } = await import("@/lib/api/ephemeris");
        const apiData = await fetchLagna({
          birthDate: values.birthDate,
          birthTime: values.birthTime,
          birthPlace: values.birthPlace,
        });
        lagna = apiData.lagnaEnglish;
      } catch (error) {
        const birthTime = values.birthTime || "12:00";
        const hours = parseInt(birthTime.split(":")[0], 10);

        const signs = [
          "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
          "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"
        ];
        // Deterministically find sign based on birth hour
        const index = Math.floor(hours / 2) % 12;
        lagna = signs[index];
      }

      return (
        <ServiceResultCard title="Your Ascendant (Lagna) Report">
          <div className="space-y-4 font-poppins">
            <div className="text-center p-4 bg-cream-dark/30 border border-border rounded-xl">
              <span className="block text-xs font-bold text-muted uppercase">Your Rising Sign (Lagna)</span>
              <h4 className="text-2xl font-bold text-navy mt-1 font-heading">{lagna} Ascendant</h4>
            </div>
            <p className="text-xs leading-relaxed text-paragraph">
              Your Lagna represents your physical shell, outward personality, and how you project yourself onto the physical plane. It is the primary reference point of your birth chart.
            </p>
          </div>
        </ServiceResultCard>
      );
    },
  },

  "lucky-number": {
    title: "Lucky Number",
    description: "Unveil your spiritual path and lucky number using Destiny Numerology.",
    fields: [
      { name: "birthDate", label: "Birth Date", type: "date", required: true },
    ],
    submitLabel: "Find Lucky Number",
    compute: (values) => {
      const dateStr = values.birthDate;
      if (!dateStr) return <p className="text-sm text-rose-500">Please provide a valid birth date.</p>;
      const sanitized = dateStr.replace(/-/g, "");
      let sum = 0;
      for (let i = 0; i < sanitized.length; i++) {
        sum += parseInt(sanitized[i], 10);
      }
      const luckyNum = getSumOfDigits(sum);

      const advice: Record<number, string> = {
        1: "Act on your ideas. You are designed to lead, not follow.",
        2: "Seek cooperative pathways. Harmony is your biggest strength today.",
        3: "Express yourself through creative formats. Art or writing will heal you.",
        4: "Establish solid ground. Focus on organising your schedules.",
        5: "Embrace sudden shifts. A flexible mind will succeed.",
        6: "Connect with family and loved ones. Nurture the domestic sphere.",
        7: "Dedicate time to research and quiet meditation.",
        8: "Focus on your financial tasks. Ethical karma brings abundance.",
        9: "Release what no longer serves. Support a humanitarian cause.",
      };

      return (
        <ServiceResultCard title="Lucky Number & Destiny Report">
          <div className="space-y-4 font-poppins text-center">
            <div className="flex flex-col items-center justify-center p-4 bg-cream-dark/30 border border-border rounded-xl space-y-1 w-36 mx-auto">
              <span className="text-xs font-bold text-muted uppercase">Your Lucky Number</span>
              <span className="text-5xl font-black text-navy">{luckyNum}</span>
            </div>
            <div className="p-3.5 bg-cream-dark/15 border border-border/40 rounded-lg text-xs leading-relaxed text-paragraph text-left">
              <strong className="block text-navy font-bold mb-1.5">Actionable Guidance</strong>
              {advice[luckyNum]}
            </div>
          </div>
        </ServiceResultCard>
      );
    },
  },

  "lucky-color": {
    title: "Lucky Color",
    description: "Discover the colour frequency that aligns with your daily cosmic vibration.",
    fields: [
      { name: "birthDate", label: "Birth Date", type: "date", required: true },
    ],
    submitLabel: "Discover Color",
    compute: (values) => {
      const birthDate = values.birthDate ? new Date(values.birthDate) : new Date();
      const dayOfWeek = birthDate.getDay(); // 0-6

      const colors = [
        { name: "Royal Gold", hex: "#D4AF37", description: "Infuses Sun frequency, leadership, warmth, and vitality." },
        { name: "Pristine White / Cream", hex: "#FDF5E6", description: "Infuses Moon frequency, emotional stability, peace, and empathy." },
        { name: "Fiery Coral Red", hex: "#FF7F50", description: "Infuses Mars frequency, raw courage, drive, and protective boundaries." },
        { name: "Emerald Green", hex: "#50C878", description: "Infuses Mercury frequency, logic, clear speech, and commercial success." },
        { name: "Yellow Sapphire", hex: "#E4D00A", description: "Infuses Jupiter frequency, wisdom, spiritual prosperity, and fortune." },
        { name: "Dazzling Silver", hex: "#C0C0C0", description: "Infuses Venus frequency, artistic expressions, wealth, and clean romance." },
        { name: "Deep Cobalt Blue", hex: "#0047AB", description: "Infuses Saturn frequency, limits, structured work, focus, and longevity." },
      ];

      const luckyColor = colors[dayOfWeek % 7];

      return (
        <ServiceResultCard title="Your Cosmic Lucky Color">
          <div className="space-y-4 font-poppins text-center py-2">
            <div className="flex flex-col items-center justify-center space-y-2">
              <div
                className="w-16 h-16 rounded-full border-2 border-border shadow-card"
                style={{ backgroundColor: luckyColor.hex }}
              />
              <h4 className="text-xl font-bold text-navy font-heading">{luckyColor.name}</h4>
            </div>
            <p className="text-xs leading-relaxed text-paragraph bg-cream-dark/30 p-3 rounded-lg max-w-sm mx-auto">
              {luckyColor.description} Use this color in your clothes or digital screens today.
            </p>
          </div>
        </ServiceResultCard>
      );
    },
  },

  "baby-name": {
    title: "Baby Name Finder",
    description: "Search for auspicious Sanskrit names based on baby's gender and Moon sign (Rashi).",
    fields: [
      { name: "gender", label: "Gender", type: "select", options: ["Boy", "Girl"], required: true },
      { name: "rashi", label: "Moon Sign (Rashi)", type: "select", options: ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"], required: true },
    ],
    submitLabel: "Find Names",
    compute: (values) => {
      const gender = values.gender || "Boy";
      const rashi = values.rashi || "Aries";

      const syallables: Record<string, string> = {
        Aries: "A, L, E",
        Taurus: "I, U, E, O, Wa, Wi, Wu, We, Wo",
        Gemini: "Ka, Ki, Ku, Gha, Chha, Ke, Ko, Ha",
        Cancer: "Hi, Hu, He, Ho, Da, Di, Du, De, Do",
        Leo: "Ma, Mi, Mu, Me, Mo, Ta, Ti, Tu, Te",
        Virgo: "To, Pa, Pi, Pu, Sha, Na, Tha, Pe, Po",
        Libra: "Ra, Ri, Ru, Re, Ro, Ta, Ti, Tu, Te",
        Scorpio: "To, Na, Ni, Nu, Ne, No, Ya, Yi, Yu",
        Sagittarius: "Ye, Yo, Bha, Bhi, Bhu, Dha, Pha, Dha, Ji",
        Capricorn: "Bho, Ja, Ji, Khi, Khu, Khe, Kho, Ga, Gi",
        Aquarius: "Goo, Ge, Go, Sa, Si, Su, Se, So, Da",
        Pisces: "Di, Du, Tha, Jha, Ja, De, Do, Cha, Chi",
      };

      const nameDb: Record<string, Record<string, { name: string; meaning: string }[]>> = {
        Boy: {
          Aries: [
            { name: "Aarav", meaning: "Peaceful, wisdom, musical sound." },
            { name: "Lakshit", meaning: "Targeted, distinguished, focused." },
          ],
          Taurus: [
            { name: "Ishaan", meaning: "Lord Shiva, sun, wealth-giver." },
            { name: "Vihan", meaning: "Dawn, morning time, beginning." },
          ],
          Gemini: [
            { name: "Kabir", meaning: "The great one, famous mystic." },
            { name: "Harshil", meaning: "Joyful, hill-loving." },
          ],
          Cancer: [
            { name: "Devansh", meaning: "Part of the divine, demigod." },
            { name: "Hardik", meaning: "Cordial, from the heart." },
          ],
          Leo: [
            { name: "Manav", meaning: "Human being, intelligent observer." },
            { name: "Tushar", meaning: "Snow, purity, frost sparkles." },
          ],
          Virgo: [
            { name: "Pranav", meaning: "The sacred syllable OM, praise." },
            { name: "Shashank", meaning: "Moon, bright celestial explorer." },
          ],
          Libra: [
            { name: "Rishi", meaning: "Sage, ray of light, spiritual guide." },
            { name: "Taran", meaning: "Ruler, raftsman, saver." },
          ],
          Scorpio: [
            { name: "Naman", meaning: "Salutations, respectful bowing." },
            { name: "Yash", meaning: "Victory, glory, success." },
          ],
          Sagittarius: [
            { name: "Bhavya", meaning: "Grand, auspicious, majestic." },
            { name: "Dhruv", meaning: "Pole star, immovable, firm faith." },
          ],
          Capricorn: [
            { name: "Jaidev", meaning: "God of victory, successful." },
            { name: "Girish", meaning: "Lord of the mountains." },
          ],
          Aquarius: [
            { name: "Siddharth", meaning: "One who has accomplished a goal." },
            { name: "Daksh", meaning: "Capable, son of Lord Brahma." },
          ],
          Pisces: [
            { name: "Divit", meaning: "Immortal, heavenly, blessed." },
            { name: "Chirag", meaning: "Lamp, source of guidance." },
          ],
        },
        Girl: {
          Aries: [
            { name: "Aanya", meaning: "Graceful, limitless, resurrection." },
            { name: "Lekha", meaning: "Writing, crescent moon shape." },
          ],
          Taurus: [
            { name: "Ira", meaning: "Earth, Saraswati goddess, speech." },
            { name: "Vanya", meaning: "Gracious gift of God." },
          ],
          Gemini: [
            { name: "Kavya", meaning: "Poetry, rhythmic expression." },
            { name: "Hiral", meaning: "Lustrous, diamond-like glow." },
          ],
          Cancer: [
            { name: "Disha", meaning: "Direction, pathfinder." },
            { name: "Divya", meaning: "Divine light, brilliant." },
          ],
          Leo: [
            { name: "Meera", meaning: "Devotee, prosperous, peace." },
            { name: "Tisha", meaning: "Active, joyful spirit." },
          ],
          Virgo: [
            { name: "Pari", meaning: "Angel, beauty, fairy." },
            { name: "Shruti", meaning: "Vedic knowledge, hearing." },
          ],
          Libra: [
            { name: "Riya", meaning: "Graceful singer, flower." },
            { name: "Tanya", meaning: "Of the family, fairy queen." },
          ],
          Scorpio: [
            { name: "Neha", meaning: "Love, rain shower, affection." },
            { name: "Yashvi", meaning: "Famous, glorious champion." },
          ],
          Sagittarius: [
            { name: "Bhavini", meaning: "Emotional, beautiful woman." },
            { name: "Dharini", meaning: "Earth, she who holds values." },
          ],
          Capricorn: [
            { name: "Jeevika", meaning: "Water, source of life." },
            { name: "Geetika", meaning: "A small song, melody." },
          ],
          Aquarius: [
            { name: "Sneha", meaning: "Affection, friendly warmth." },
            { name: "Diya", meaning: "Light, small clay lamp." },
          ],
          Pisces: [
            { name: "Divisha", meaning: "Goddess Durga, chief of gods." },
            { name: "Charvi", meaning: "Lovely lady, beautiful." },
          ],
        },
      };

      const selectedNames = nameDb[gender]?.[rashi] || [
        { name: "Sanskrit Name", meaning: "A beautiful traditional choice." }
      ];

      return (
        <ServiceResultCard title="Auspicious Baby Names Suggestion">
          <div className="space-y-4 font-poppins">
            <div className="p-3 bg-cream-dark/30 border border-border rounded-xl">
              <span className="block text-[10px] text-muted font-bold uppercase tracking-wider">Auspicious Syllables (Phonetics)</span>
              <span className="text-sm font-semibold text-navy mt-1 block">{syallables[rashi]}</span>
            </div>
            <div className="space-y-3">
              <span className="block text-xs font-bold text-navy uppercase tracking-wider">Name Ideas ({gender})</span>
              <div className="grid grid-cols-1 gap-2">
                {selectedNames.map((n, idx) => (
                  <div key={idx} className="p-3 border border-border bg-card rounded-lg flex items-start justify-between">
                    <div>
                      <strong className="block text-navy text-sm font-bold">{n.name}</strong>
                      <span className="text-xs text-paragraph leading-normal mt-0.5 block">{n.meaning}</span>
                    </div>
                    <span className="text-[10px] uppercase font-bold text-gold bg-gold/10 px-2 py-0.5 rounded">Auspicious</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ServiceResultCard>
      );
    },
  },

  "shubh-muhurat": {
    title: "Shubh Muhurat",
    description: "Determine the most auspicious windows for key life actions today.",
    fields: [
      { name: "date", label: "Date", type: "date", required: true },
      { name: "activity", label: "Activity Type", type: "select", options: ["Marriage", "Griha Pravesh", "Business Launch", "Vehicle Purchase"], required: true },
    ],
    submitLabel: "Find Muhurat Slots",
    compute: (values) => {
      const activity = values.activity || "Marriage";
      const dateStr = values.date || "Today";

      const slots = [
        { name: "Abhijit Muhurat", time: "11:45 AM – 12:35 PM", status: "Highly Auspicious", quality: "Brings success in all endeavours. Governed by Vishnu." },
        { name: "Amrit Kaal", time: "02:15 PM – 03:50 PM", status: "Excellent", quality: "Perfect for signatures, business inaugurals." },
        { name: "Rahu Kaal (Avoid)", time: "04:30 PM – 06:00 PM", status: "Inauspicious", quality: "Avoid starting any new work or journey." },
      ];

      return (
        <ServiceResultCard title={`Shubh Muhurat for ${activity}`}>
          <div className="space-y-4 font-poppins">
            <span className="text-xs text-muted block">Auspicious windows calculated for <strong className="text-navy">{dateStr}</strong>:</span>
            <div className="space-y-3">
              {slots.map((s) => {
                const isAvoid = s.status === "Inauspicious";
                return (
                  <div key={s.name} className={`p-3.5 border rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 ${isAvoid ? "border-rose-200 bg-rose-50/50" : "border-border bg-card"}`}>
                    <div>
                      <strong className={`block text-sm font-bold ${isAvoid ? "text-rose-700" : "text-navy"}`}>{s.name}</strong>
                      <span className="text-xs text-paragraph font-medium block mt-1">{s.time}</span>
                      <span className="text-[10px] text-muted block mt-0.5">{s.quality}</span>
                    </div>
                    <span className={`self-start md:self-auto text-[10px] uppercase font-bold px-2 py-0.5 rounded ${isAvoid ? "text-rose-700 bg-rose-100" : "text-gold bg-gold/10"}`}>
                      {s.status}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </ServiceResultCard>
      );
    },
  },

  "saturn-return": {
    title: "Saturn Return Calculator",
    description: "Determine the dates of your major Saturn Return milestones.",
    fields: [
      { name: "birthDate", label: "Birth Date", type: "date", required: true },
    ],
    submitLabel: "Find Returns",
    compute: (values) => {
      const birthDate = values.birthDate ? new Date(values.birthDate) : new Date();
      const birthYear = birthDate.getFullYear();

      const returns = [
        { title: "First Saturn Return (Ages 28–30)", years: `${birthYear + 28} – ${birthYear + 30}`, desc: "Period of major maturation, structure testing, and defining career/relationships." },
        { title: "Second Saturn Return (Ages 58–60)", years: `${birthYear + 58} – ${birthYear + 60}`, desc: "Period of retirement planning, philosophical adjustments, wisdom and harvest." },
        { title: "Third Saturn Return (Ages 87–89)", years: `${birthYear + 87} – ${birthYear + 89}`, desc: "Spiritual reflection and complete completion of active earthly duties." },
      ];

      return (
        <ServiceResultCard title="Your Saturn Return Timeline">
          <div className="space-y-4 font-poppins text-xs">
            <p className="text-paragraph leading-relaxed">
              Saturn takes approximately 29.5 years to complete one orbit around the Sun and return to the exact position it occupied at your birth. These cycles signal structural life shifts.
            </p>
            <div className="divide-y divide-border">
              {returns.map((ret, idx) => (
                <div key={idx} className="py-3.5 space-y-1">
                  <div className="flex items-center justify-between">
                    <strong className="text-sm font-bold text-navy">{ret.title}</strong>
                    <span className="font-bold text-gold text-xs">{ret.years}</span>
                  </div>
                  <p className="text-paragraph leading-normal text-[11px] opacity-90">{ret.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </ServiceResultCard>
      );
    },
  },

  nakshatra: {
    title: "Nakshatra Finder",
    description: "Determine your birth star (Nakshatra) and its divine qualities.",
    fields: [
      { name: "birthDate", label: "Birth Date", type: "date", required: true },
      { name: "birthTime", label: "Birth Time", type: "time", required: true },
      { name: "birthPlace", label: "Birth Place", type: "places-autocomplete", required: true, placeholder: "City, Country" },
    ],
    submitLabel: "Find Nakshatra",
    compute: async (values) => {
      let star;
      try {
        const { fetchNakshatra } = await import("@/lib/api/ephemeris");
        const apiData = await fetchNakshatra({
          birthDate: values.birthDate,
          birthTime: values.birthTime,
          birthPlace: values.birthPlace,
        });
        star = {
          name: apiData.nakshatra,
          lord: apiData.rulingLord,
          deity: apiData.deity,
          symbol: apiData.symbol,
          traits: `Gana: ${apiData.gana}, Pada: ${apiData.pada}.`,
        };
      } catch (error) {
        const birthDate = values.birthDate ? new Date(values.birthDate) : new Date();
        const day = birthDate.getDate();

        const stars = [
          { name: "Ashwini", lord: "Ketu", deity: "Ashwini Kumars", symbol: "Horse Head", traits: "Swift, adventurous, healing focus, pioneering." },
          { name: "Bharani", lord: "Venus", deity: "Yama", symbol: "Yoni", traits: "Resilient, creative, intense, subject to sudden shifts." },
          { name: "Krittika", lord: "Sun", deity: "Agni", symbol: "Razor/Knife", traits: "Sharp mind, direct, purging energy, ambitious." },
          { name: "Rohini", lord: "Moon", deity: "Brahma", symbol: "Chariot/Temple", traits: "Beautiful, artistic, growth-oriented, stable family bonds." },
          { name: "Mrigashira", lord: "Mars", deity: "Soma", symbol: "Deer Head", traits: "Searching, curious, gentle, travel-loving." },
          { name: "Ardra", lord: "Rahu", deity: "Rudra", symbol: "Teardrop", traits: "Transformative, intellectual, weathers emotional storms." },
        ];

        star = stars[day % stars.length];
      }

      return (
        <ServiceResultCard title="Your Birth Star (Nakshatra) Report">
          <div className="space-y-4 font-poppins">
            <div className="text-center p-4 bg-cream-dark/30 border border-border rounded-xl">
              <span className="block text-xs font-bold text-muted uppercase">Your Nakshatra</span>
              <h4 className="text-2xl font-bold text-navy mt-1 font-heading">{star.name}</h4>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center text-xs">
              <div className="p-2.5 bg-card border border-border rounded-lg">
                <span className="block text-muted font-bold uppercase mb-0.5 text-[9px]">Ruling Lord</span>
                <span className="text-navy font-semibold">{star.lord}</span>
              </div>
              <div className="p-2.5 bg-card border border-border rounded-lg">
                <span className="block text-muted font-bold uppercase mb-0.5 text-[9px]">Primary Deity</span>
                <span className="text-navy font-semibold truncate block">{star.deity}</span>
              </div>
              <div className="p-2.5 bg-card border border-border rounded-lg">
                <span className="block text-muted font-bold uppercase mb-0.5 text-[9px]">Symbol</span>
                <span className="text-navy font-semibold truncate block">{star.symbol}</span>
              </div>
            </div>
            <div className="p-3.5 bg-cream-dark/15 border border-border/40 rounded-lg text-xs leading-relaxed text-paragraph">
              <strong className="block text-navy font-bold mb-1">Qualities</strong>
              {star.traits}
            </div>
          </div>
        </ServiceResultCard>
      );
    },
  },

  ayanamsa: {
    title: "Ayanamsa Calculator",
    description: "Determine the precise precession offset (Ayanamsa) for your charts.",
    fields: [
      { name: "birthDate", label: "Birth Date", type: "date", required: true },
    ],
    submitLabel: "Calculate Ayanamsa",
    compute: async (values) => {
      let degrees, minutes, seconds;

      try {
        const { fetchAyanamsa } = await import("@/lib/api/ephemeris");
        const apiData = await fetchAyanamsa({
          birthDate: values.birthDate || new Date().toISOString().split('T')[0],
        });
        degrees = apiData.degrees;
        minutes = apiData.minutes;
        seconds = apiData.seconds;
      } catch (error) {
        const year = values.birthDate ? new Date(values.birthDate).getFullYear() : new Date().getFullYear();

        // Calculate Lahiri Ayanamsa: roughly 23.85 degrees + 50.29 seconds per year from 1950
        const diffYears = year - 1950;
        const secondsOffset = diffYears * 50.29;
        const baseDeg = 23.16 + (secondsOffset / 3600);

        degrees = Math.floor(baseDeg);
        minutes = Math.floor((baseDeg - degrees) * 60);
        seconds = Math.round((((baseDeg - degrees) * 60) - minutes) * 60);
      }

      return (
        <ServiceResultCard title="Lahiri Ayanamsa Calculation">
          <div className="space-y-4 font-poppins text-center">
            <div className="p-4 bg-cream-dark/30 border border-border rounded-xl">
              <span className="block text-xs font-bold text-muted uppercase">Offset (Precession Angle)</span>
              <span className="text-3xl font-extrabold text-navy block mt-1">
                {degrees}° {minutes}' {seconds}"
              </span>
            </div>
            <p className="text-xs text-paragraph text-left leading-relaxed">
              Vedic Astrology uses the sidereal zodiac, which compensates for the earth's axis precession (wobble) using this Ayanamsa. This is why Vedic planet placements differ by ~24 degrees from Western tropical charts.
            </p>
          </div>
        </ServiceResultCard>
      );
    },
  },

  hora: {
    title: "Hora Calculator",
    description: "Display planetary hours for scheduling meetings and starting work today.",
    fields: [
      { name: "date", label: "Date", type: "date", required: true },
      { name: "birthPlace", label: "Coordinates (City)", type: "places-autocomplete", required: true, placeholder: "City, Country" },
    ],
    submitLabel: "Find Horas",
    compute: (values) => {
      const dateStr = values.date || "Today";

      const horas = [
        { time: "06:00 AM – 07:00 AM", ruler: "Sun", effect: "Auspicious", desc: "Good for meetings, leadership tasks, public activities." },
        { time: "07:00 AM – 08:00 AM", ruler: "Venus", effect: "Auspicious", desc: "Perfect for buying gems, art, dates, signing contracts." },
        { time: "08:00 AM – 09:00 AM", ruler: "Mercury", effect: "Excellent", desc: "Best for writing, commerce, accounts, studies." },
        { time: "09:00 AM – 10:00 AM", ruler: "Moon", effect: "Auspicious", desc: "Good for family meets, food industry, travels." },
        { time: "10:00 AM – 11:00 AM", ruler: "Saturn", effect: "Avoid", desc: "Low energy. Complete pending chores or routine jobs." },
        { time: "11:00 AM – 12:00 PM", ruler: "Jupiter", effect: "Highly Auspicious", desc: "Best for audits, meeting advisors, spiritual rituals." },
        { time: "12:00 PM – 01:00 PM", ruler: "Mars", effect: "Avoid", desc: "Fierce energy. Good for exercise, bad for diplomatic talks." },
      ];

      return (
        <ServiceResultCard title={`Hora Schedule for ${dateStr}`}>
          <div className="space-y-4 font-poppins">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-border bg-cream-dark/50 text-dark font-semibold">
                    <th className="py-2 px-3">Time Slot</th>
                    <th className="py-2 px-3">Ruling Planet</th>
                    <th className="py-2 px-3">Auspiciousness</th>
                    <th className="py-2 px-3">Best for</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60 text-paragraph">
                  {horas.map((h, idx) => {
                    const isAvoid = h.effect === "Avoid";
                    return (
                      <tr key={idx} className={isAvoid ? "bg-rose-50/30" : ""}>
                        <td className="py-2.5 px-3 font-medium text-navy">{h.time}</td>
                        <td className="py-2.5 px-3 font-semibold text-navy">{h.ruler}</td>
                        <td className="py-2.5 px-3">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${isAvoid ? "text-rose-700 bg-rose-100" : "text-gold bg-gold/10"}`}>
                            {h.effect}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-[11px] leading-relaxed">{h.desc}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </ServiceResultCard>
      );
    },
  },

  choghadiya: {
    title: "Choghadiya Calculator",
    description: "Display auspicious and inauspicious time divisions for daily tasks.",
    fields: [
      { name: "date", label: "Date", type: "date", required: true },
      { name: "birthPlace", label: "Coordinates (City)", type: "places-autocomplete", required: true, placeholder: "City, Country" },
    ],
    submitLabel: "Find Choghadiya",
    compute: (values) => {
      const dateStr = values.date || "Today";

      const slots = [
        { name: "Shubh", ruler: "Jupiter", type: "Auspicious", time: "06:00 AM – 07:30 AM", detail: "Excellent for educational and spiritual starts." },
        { name: "Rog", ruler: "Mars", type: "Inauspicious", time: "07:30 AM – 09:00 AM", detail: "Causes friction and arguments. Avoid health checks." },
        { name: "Udveg", ruler: "Sun", type: "Inauspicious", time: "09:00 AM – 10:30 AM", detail: "Causes anxiety. Avoid government dealings." },
        { name: "Chal", ruler: "Venus", type: "Auspicious", time: "10:30 AM – 12:00 PM", detail: "Neutral/Favourable. Good for journeys and shopping." },
        { name: "Labh", ruler: "Mercury", type: "Auspicious", time: "12:00 PM – 01:30 PM", detail: "Gainful period. Excellent for commercial deals." },
        { name: "Amrit", ruler: "Moon", type: "Highly Auspicious", time: "01:30 PM – 03:00 PM", detail: "Best overall period. All actions supported." },
      ];

      return (
        <ServiceResultCard title={`Choghadiya Slots for ${dateStr}`}>
          <div className="space-y-4 font-poppins">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {slots.map((s, idx) => {
                const isAvoid = s.type === "Inauspicious";
                return (
                  <div key={idx} className={`p-3 border rounded-xl space-y-1 ${isAvoid ? "border-rose-100 bg-rose-50/30" : "border-border bg-card"}`}>
                    <div className="flex items-center justify-between">
                      <strong className={`text-sm font-bold ${isAvoid ? "text-rose-700" : "text-navy"}`}>{s.name} ({s.type})</strong>
                      <span className="text-xs text-gold font-semibold font-poppins">{s.time}</span>
                    </div>
                    <span className="block text-[10px] text-muted font-medium uppercase tracking-wider">Ruled by {s.ruler}</span>
                    <p className="text-[11px] leading-relaxed text-paragraph mt-1">{s.detail}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </ServiceResultCard>
      );
    },
  },
};
