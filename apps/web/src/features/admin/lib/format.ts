/**
 * Formatting for the admin panel. Everything is shown in Indian Standard Time
 * and Indian rupee grouping (1,00,000), regardless of the viewer's browser.
 */

const IST = "Asia/Kolkata";

const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
const inrCompact = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  notation: "compact",
  maximumFractionDigits: 1,
});
const count = new Intl.NumberFormat("en-IN");

export const formatINR = (value: number) => inr.format(value);
export const formatINRCompact = (value: number) => inrCompact.format(value);
export const formatCount = (value: number) => count.format(value);

/** "Wednesday, 23 September" in IST. */
export const formatLongDate = (date: Date = new Date()) =>
  new Intl.DateTimeFormat("en-IN", { timeZone: IST, weekday: "long", day: "numeric", month: "long" }).format(date);

/** "23 Sep, 5:10 pm" in IST. */
export const formatDateTime = (iso: string | Date) =>
  new Intl.DateTimeFormat("en-IN", {
    timeZone: IST,
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));

/** "5:10 pm" in IST. */
export const formatTime = (iso: string | Date) =>
  new Intl.DateTimeFormat("en-IN", { timeZone: IST, hour: "numeric", minute: "2-digit" }).format(new Date(iso));

/**
 * Parts of a calendar date stored as 00:00 UTC (e.g. Booking.scheduledDate, or a
 * "YYYY-MM-DD" day key). Read in UTC so the date never shifts.
 */
export const calendarParts = (value: string) => {
  const date = new Date(value.length === 10 ? `${value}T00:00:00Z` : value);
  const part = (options: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat("en-IN", { timeZone: "UTC", ...options }).format(date);
  return {
    weekday: part({ weekday: "short" }),
    day: part({ day: "numeric" }),
    month: part({ month: "short" }),
    full: part({ weekday: "short", day: "numeric", month: "short" }),
  };
};

/** "12 April 1988" — a calendar date with its year (e.g. date of birth), read in UTC so it never shifts. */
export const formatFullDate = (value: string) =>
  new Intl.DateTimeFormat("en-IN", { timeZone: "UTC", day: "numeric", month: "long", year: "numeric" }).format(
    new Date(value.length === 10 ? `${value}T00:00:00Z` : value),
  );

/** Greeting for the current hour in IST. */
export const greeting = () => {
  const hour = Number(new Intl.DateTimeFormat("en-GB", { timeZone: IST, hour: "numeric", hour12: false }).format(new Date()));
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
};

/** Percentage change, or null when there is no base to compare with. */
export const percentChange = (current: number, previous: number) =>
  previous > 0 ? ((current - previous) / previous) * 100 : null;
