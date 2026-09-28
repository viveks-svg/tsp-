/**
 * Session slot labels, e.g. "10:00 AM – 11:00 AM".
 *
 * Bookings store the label the client picked (Booking.scheduledSlot), so labels
 * must be parseable back into times. Older bookings use "02:00-03:00 PM" or
 * "10:00 – 11:00 AM" (meridiem on the end time only); those are parsed too.
 * All times are minutes since midnight, Indian Standard Time.
 */

export interface MinuteRange {
  start: number;
  end: number;
}

const IST_OFFSET_MIN = 330;

export const hhmmToMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

export const minutesToHhmm = (min: number) =>
  `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;

const to12h = (min: number) => {
  const h24 = Math.floor(min / 60) % 24;
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${String(h12).padStart(2, "0")}:${String(min % 60).padStart(2, "0")} ${h24 < 12 ? "AM" : "PM"}`;
};

const to24 = (h: number, m: number, meridiem: string) => {
  const pm = meridiem.toUpperCase() === "PM";
  return ((h % 12) + (pm ? 12 : 0)) * 60 + m;
};

export const formatSlotLabel = (range: MinuteRange) => `${to12h(range.start)} – ${to12h(range.end)}`;

const FULL = /^(\d{1,2}):(\d{2})\s*(AM|PM)\s*[–-]\s*(\d{1,2}):(\d{2})\s*(AM|PM)$/i;
const END_ONLY = /^(\d{1,2}):(\d{2})\s*[–-]\s*(\d{1,2}):(\d{2})\s*(AM|PM)$/i;

export function parseSlotLabel(label: string | null | undefined): MinuteRange | null {
  if (!label) return null;
  const text = label.trim();

  const full = FULL.exec(text);
  if (full) {
    const start = to24(+full[1], +full[2], full[3]);
    const end = to24(+full[4], +full[5], full[6]);
    return end > start ? { start, end } : null;
  }

  const legacy = END_ONLY.exec(text);
  if (legacy) {
    const end = to24(+legacy[3], +legacy[4], legacy[5]);
    // The start shares the end's meridiem unless that would put it after the end
    // ("11:00-12:00 PM" is 11 AM – 12 PM).
    const candidates = [to24(+legacy[1], +legacy[2], "AM"), to24(+legacy[1], +legacy[2], "PM")].filter((s) => s < end);
    if (candidates.length === 0) return null;
    return { start: Math.max(...candidates), end };
  }

  return null;
}

export const overlaps = (a: MinuteRange, b: MinuteRange) => a.start < b.end && b.start < a.end;

/** A calendar date ("YYYY-MM-DD") plus IST minutes → the real UTC instant. */
export const istToUtc = (dateStr: string, minutes: number) =>
  new Date(Date.parse(`${dateStr}T00:00:00.000Z`) + (minutes - IST_OFFSET_MIN) * 60_000);

/** Today's date and the current minute, in IST. */
export function nowInIst() {
  const shifted = new Date(Date.now() + IST_OFFSET_MIN * 60_000);
  return {
    date: shifted.toISOString().slice(0, 10),
    minutes: shifted.getUTCHours() * 60 + shifted.getUTCMinutes(),
    dayOfWeek: shifted.getUTCDay(),
  };
}

/** Whole days from `from` to `to` (both "YYYY-MM-DD"). */
export const daysBetween = (from: string, to: string) =>
  Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);

export const addDays = (dateStr: string, days: number) =>
  new Date(Date.parse(`${dateStr}T00:00:00Z`) + days * 86_400_000).toISOString().slice(0, 10);
