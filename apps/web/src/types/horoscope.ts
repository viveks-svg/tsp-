export type HoroscopePeriod =
  | "today"
  | "tomorrow"
  | "yesterday"
  | "weekly"
  | "monthly"
  | "this-year"
  | "next-month"
  | "next-year";

export interface HoroscopeReading {
  love: string;
  career: string;
  health: string;
  finance: string;
  luckyNumber: number;
  luckyColor: string;
  compatibleSign: string;
}

export const HOROSCOPE_PERIODS: { value: HoroscopePeriod; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "tomorrow", label: "Tomorrow" },
  { value: "yesterday", label: "Yesterday" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "this-year", label: "This Year" },
  { value: "next-month", label: "Next Month" },
  { value: "next-year", label: "Next Year" },
];
