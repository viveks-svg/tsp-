export type HoroscopePeriod = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';

export interface HoroscopeReading {
  sign: string;
  period: HoroscopePeriod;
  periodStartDate: string;
  periodEndDate: string;

  overallText: string;
  loveText: string;
  careerText: string;
  healthText: string;
  financeText: string;

  luckyColor: string;
  luckyNumber: number;
  luckyTime: string | null;
  moodTag: string;
  rating: number; // 1-5

  generatedAt: string;
}

export const HOROSCOPE_PERIODS: { value: HoroscopePeriod; label: string }[] = [
  { value: 'DAILY', label: 'Today' },
  { value: 'WEEKLY', label: 'Weekly' },
  { value: 'MONTHLY', label: 'Monthly' },
  { value: 'YEARLY', label: 'Yearly' },
];

/**
 * Maps legacy frontend period slugs (URL params) to the backend HoroscopePeriod enum.
 */
export const PERIOD_SLUG_MAP: Record<string, HoroscopePeriod> = {
  daily: 'DAILY',
  today: 'DAILY',
  tomorrow: 'DAILY',
  yesterday: 'DAILY',
  weekly: 'WEEKLY',
  monthly: 'MONTHLY',
  yearly: 'YEARLY',
  'this-year': 'YEARLY',
  'next-month': 'MONTHLY',
  'next-year': 'YEARLY',
};
