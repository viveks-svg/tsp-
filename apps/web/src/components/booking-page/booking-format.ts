/**
 * Formatting helpers shared by the booking steps.
 *
 * Booking dates are calendar days ("YYYY-MM-DD") in India. `new Date('2026-10-02')`
 * parses as UTC midnight, which shows the previous day for clients west of UTC,
 * so we always build the date from its parts in local time instead.
 */

export function parseCalendarDate(ymd: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd ?? '');
  if (!m) return null;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

export function formatCalendarDate(
  ymd: string,
  options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' },
): string {
  const d = parseCalendarDate(ymd);
  return d ? d.toLocaleDateString('en-IN', options) : ymd;
}

/** Today's date in India (IST, UTC+5:30) as YYYY-MM-DD, offset by `addDays`. */
export function istDateString(addDays = 0): string {
  return new Date(Date.now() + 330 * 60_000 + addDays * 86_400_000).toISOString().slice(0, 10);
}

/** Slots come from Dr. Pradeep's schedule in IST — say so. */
export function formatSlot(slot: string): string {
  if (!slot) return slot;
  return /\bIST\b/i.test(slot) ? slot : `${slot} IST`;
}

/** "14:30" → "2:30 PM" */
export function formatTime24(hhmm: string): string {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm ?? '');
  if (!m) return hhmm;
  const h = Number(m[1]);
  return `${h % 12 || 12}:${m[2]} ${h >= 12 ? 'PM' : 'AM'}`;
}
