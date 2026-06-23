import type { HoroscopeReading, HoroscopePeriod } from "@/types/horoscope";
import { horoscopeTexts, zodiacSigns } from "./zodiac";

// A simple hash function to get deterministic numbers for combinations
function getHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

export function getHoroscopeReading(sign: string, period: HoroscopePeriod): HoroscopeReading {
  const seed = getHash(`${sign}-${period}`);
  const baseText = horoscopeTexts[sign] || "The celestial energies align to support your intentions.";

  const loveTexts = [
    "Your heart is open, and connections feel natural. Communicate your vulnerabilities to deepen your bond.",
    "A day of quiet understanding. If single, self-love attracts a like-minded soul. If committed, cherish small moments.",
    "Expressive romantic waves surround you. Surprise your partner or reach out to someone who makes your heart beat.",
    "Cosmic transits urge you to clear past misunderstandings. Patience is your strongest ally in relationships.",
  ];

  const careerTexts = [
    "A creative proposal gets traction. Keep your goals aligned and present them clearly to authority figures.",
    "Focus on details and fine-tuning. Rushing today could lead to minor errors. Steady efforts bring success.",
    "Professional collaboration is highly supported. Exchange ideas freely with team members to find solutions.",
    "Ambitious drives are backed by the cosmos. Do not fear taking the lead on a challenging project.",
  ];

  const healthTexts = [
    "Vitality levels are strong. Maintain a balanced diet and include light stretches to keep energy flowing.",
    "Rest and rejuvenation are key today. Unplug early from devices to support high-quality sleep cycles.",
    "Mindfulness or short walks in nature will ease mental tension. Stay hydrated and prioritize your wellbeing.",
    "Channel dynamic energy into physical exercise. Listen to your body and honor its need for recovery.",
  ];

  const financeTexts = [
    "Financial decisions carry long-term benefits today. Consider saving or investing in low-risk schemes.",
    "Avoid impulsive purchases. Analyze your budgets and clear any pending dues for peace of mind.",
    "Opportunities for gain or savings are close. A wise advisor could share insights on wealth generation.",
    "Abundance flows when you align efforts with ethics. Plan your expenses with standard discipline.",
  ];

  const colors = ["Golden Yellow", "Emerald Green", "Royal Blue", "Rose Pink", "Silver White", "Copper Red", "Deep Violet"];
  const compatibleSignIndex = seed % zodiacSigns.length;
  const compatibleSign = zodiacSigns[compatibleSignIndex] === sign 
    ? zodiacSigns[(compatibleSignIndex + 1) % zodiacSigns.length]
    : zodiacSigns[compatibleSignIndex];

  return {
    love: `${loveTexts[seed % loveTexts.length]} ${baseText.slice(0, 50)}...`,
    career: `${careerTexts[(seed + 1) % careerTexts.length]} Make sure to track your tasks.`,
    health: `${healthTexts[(seed + 2) % healthTexts.length]} Mental peace should be a priority.`,
    finance: `${financeTexts[(seed + 3) % financeTexts.length]} Stability will follow structured plans.`,
    luckyNumber: (seed % 9) + 1,
    luckyColor: colors[seed % colors.length],
    compatibleSign: compatibleSign,
  };
}
