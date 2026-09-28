import { BadRequestException, Injectable } from "@nestjs/common";
import { BookingStatus, Prisma } from "@prisma/client";
import { PrismaService } from "../../database/prisma.service";
import {
  MinuteRange,
  addDays,
  daysBetween,
  formatSlotLabel,
  hhmmToMinutes,
  istToUtc,
  minutesToHhmm,
  nowInIst,
  overlaps,
  parseSlotLabel,
} from "./slot-label";

/**
 * Dr. Pradeep's schedule — the single source for:
 *   - which astrologer is "Dr. Pradeep" (the consultation provider),
 *   - his weekly hours (several ranges per day, AdminAvailability rows),
 *   - session length / gap / booking window (PlatformSetting "schedule"),
 *   - days off (SlotConfig rows with isBlocked),
 * and the bookable session slots derived from them.
 */

export interface ScheduleSettings {
  sessionMinutes: number;
  bufferMinutes: number;
  horizonDays: number;
  acceptingBookings: boolean;
}

export interface WeeklyDay {
  dayOfWeek: number; // 0 = Sunday … 6 = Saturday
  ranges: { start: string; end: string }[]; // "HH:MM", IST
}

export const DEFAULT_SETTINGS: ScheduleSettings = {
  sessionMinutes: 60,
  bufferMinutes: 0,
  horizonDays: 60,
  acceptingBookings: true,
};

/** How long an unpaid checkout holds its slot. */
const PENDING_HOLD_MINUTES = 15;
/** Same-day sessions must start at least this far ahead. */
const SAME_DAY_LEAD_MINUTES = 60;

const SETTINGS_KEY = "schedule";
const PROVIDER_KEY = "provider";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** An approved astrologer whose login is still an astrologer login. */
const ACTIVE_ASTROLOGER = { status: "APPROVED" as const, user: { role: "ASTROLOGER" as const } };
const PROVIDER_SELECT = { id: true, userId: true, user: { select: { name: true, email: true } } } as const;

export interface Provider {
  astrologerId: string;
  userId: string;
  name: string | null;
  email: string | null;
  chosen: boolean;
}

const toProvider = (
  a: { id: string; userId: string; user: { name: string | null; email: string | null } },
  chosen: boolean,
): Provider => ({ astrologerId: a.id, userId: a.userId, name: a.user.name, email: a.user.email, chosen });

@Injectable()
export class ScheduleService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Provider (Dr. Pradeep, an astrologer) ─────────────────────────────────

  /**
   * The astrologer whose hours these are and who takes live-queue calls.
   * Chosen on the admin Availability page; until then, the longest-standing
   * approved astrologer. Admins are never providers.
   */
  async getProvider(): Promise<Provider | null> {
    const setting = await this.prisma.platformSetting.findUnique({ where: { key: PROVIDER_KEY } });
    const chosenId = (setting?.value as { astrologerId?: string } | null)?.astrologerId;
    if (chosenId) {
      const chosen = await this.prisma.astrologer.findFirst({
        where: { id: chosenId, ...ACTIVE_ASTROLOGER },
        select: PROVIDER_SELECT,
      });
      if (chosen) return toProvider(chosen, true);
    }
    const fallback = await this.prisma.astrologer.findFirst({
      where: ACTIVE_ASTROLOGER,
      orderBy: { createdAt: "asc" },
      select: PROVIDER_SELECT,
    });
    return fallback ? toProvider(fallback, false) : null;
  }

  async listAstrologers() {
    const rows = await this.prisma.astrologer.findMany({
      where: ACTIVE_ASTROLOGER,
      orderBy: { createdAt: "asc" },
      select: PROVIDER_SELECT,
    });
    return rows.map((r) => toProvider(r, false));
  }

  // ── Settings & weekly hours ───────────────────────────────────────────────

  async getSettings(): Promise<ScheduleSettings> {
    const row = await this.prisma.platformSetting.findUnique({ where: { key: SETTINGS_KEY } });
    return { ...DEFAULT_SETTINGS, ...((row?.value as Partial<ScheduleSettings> | null) ?? {}) };
  }

  /**
   * The platform has one consultation schedule. Rows keep the provider's user id
   * (AdminAvailability.adminId is a legacy name), but reads ignore it so changing
   * the provider never loses the hours.
   */
  async getWeekly(): Promise<WeeklyDay[]> {
    const rows = await this.prisma.adminAvailability.findMany({
      where: { isActive: true },
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    });
    return Array.from({ length: 7 }, (_, dayOfWeek) => ({
      dayOfWeek,
      ranges: rows.filter((r) => r.dayOfWeek === dayOfWeek).map((r) => ({ start: r.startTime, end: r.endTime })),
    }));
  }

  async getSchedule() {
    const [provider, settings, weekly, daysOff, astrologers] = await Promise.all([
      this.getProvider(),
      this.getSettings(),
      this.getWeekly(),
      this.listDaysOff(),
      this.listAstrologers(),
    ]);
    return { provider, astrologers, settings, weekly, daysOff };
  }

  async saveSchedule(
    actorId: string,
    input: { astrologerId?: string; settings: ScheduleSettings; weekly: WeeklyDay[] },
  ) {
    const weekly = this.validateWeekly(input.weekly);
    const settings = this.validateSettings(input.settings);

    if (input.astrologerId) {
      const chosen = await this.prisma.astrologer.findFirst({ where: { id: input.astrologerId, ...ACTIVE_ASTROLOGER } });
      if (!chosen) throw new BadRequestException("Choose an approved astrologer.");
    }

    // Rows need an owner; they belong to the astrologer, whoever (admin) is editing them.
    const ownerUserId = input.astrologerId
      ? (await this.prisma.astrologer.findUnique({ where: { id: input.astrologerId }, select: { userId: true } }))!.userId
      : (await this.getProvider())?.userId;
    if (!ownerUserId) throw new BadRequestException("Add Dr. Pradeep as an astrologer before setting his hours.");

    await this.prisma.$transaction(async (tx) => {
      if (input.astrologerId) {
        await tx.platformSetting.upsert({
          where: { key: PROVIDER_KEY },
          create: { key: PROVIDER_KEY, value: { astrologerId: input.astrologerId }, updatedById: actorId },
          update: { value: { astrologerId: input.astrologerId }, updatedById: actorId },
        });
      }
      await tx.platformSetting.upsert({
        where: { key: SETTINGS_KEY },
        create: { key: SETTINGS_KEY, value: settings as unknown as Prisma.InputJsonValue, updatedById: actorId },
        update: { value: settings as unknown as Prisma.InputJsonValue, updatedById: actorId },
      });
      // There is one schedule: clear every row, including any left under a previous provider.
      await tx.adminAvailability.deleteMany({});
      const rows = weekly.flatMap((day) =>
        day.ranges.map((r) => ({ adminId: ownerUserId, dayOfWeek: day.dayOfWeek, startTime: r.start, endTime: r.end })),
      );
      if (rows.length) await tx.adminAvailability.createMany({ data: rows });
    });

    return this.getSchedule();
  }

  private validateSettings(s: ScheduleSettings): ScheduleSettings {
    const int = (v: unknown, min: number, max: number, label: string) => {
      const n = Number(v);
      if (!Number.isInteger(n) || n < min || n > max) {
        throw new BadRequestException(`${label} must be a whole number between ${min} and ${max}.`);
      }
      return n;
    };
    return {
      sessionMinutes: int(s.sessionMinutes, 15, 240, "Session length"),
      bufferMinutes: int(s.bufferMinutes, 0, 120, "Gap between sessions"),
      horizonDays: int(s.horizonDays, 7, 365, "Booking window"),
      acceptingBookings: Boolean(s.acceptingBookings),
    };
  }

  private validateWeekly(weekly: WeeklyDay[]): WeeklyDay[] {
    const days = new Map<number, MinuteRange[]>();
    for (const day of weekly ?? []) {
      if (!Number.isInteger(day.dayOfWeek) || day.dayOfWeek < 0 || day.dayOfWeek > 6) {
        throw new BadRequestException("Invalid day of week.");
      }
      const ranges = (day.ranges ?? []).map((r) => {
        if (!/^\d{2}:\d{2}$/.test(r.start) || !/^\d{2}:\d{2}$/.test(r.end)) {
          throw new BadRequestException("Times must be in HH:MM format.");
        }
        const range = { start: hhmmToMinutes(r.start), end: hhmmToMinutes(r.end) };
        if (range.start >= range.end || range.end > 24 * 60) {
          throw new BadRequestException(`${r.start}–${r.end}: the end must be after the start.`);
        }
        return range;
      });
      ranges.sort((a, b) => a.start - b.start);
      for (let i = 1; i < ranges.length; i++) {
        if (overlaps(ranges[i - 1], ranges[i])) {
          throw new BadRequestException(`Hours overlap on ${DAY_NAMES[day.dayOfWeek]}.`);
        }
      }
      if (ranges.length > 8) throw new BadRequestException(`At most 8 blocks of hours per day.`);
      days.set(day.dayOfWeek, ranges);
    }
    return [...days.entries()].map(([dayOfWeek, ranges]) => ({
      dayOfWeek,
      ranges: ranges.map((r) => ({ start: minutesToHhmm(r.start), end: minutesToHhmm(r.end) })),
    }));
  }

  // ── Days off ──────────────────────────────────────────────────────────────

  async listDaysOff() {
    const rows = await this.prisma.slotConfig.findMany({
      where: { isBlocked: true, date: { gte: new Date(`${nowInIst().date}T00:00:00Z`) } },
      orderBy: { date: "asc" },
      select: { date: true, note: true },
    });
    return rows.map((r) => ({ date: r.date.toISOString().slice(0, 10), note: r.note }));
  }

  async addDayOff(dateStr: string, note?: string) {
    if (!DATE_RE.test(dateStr)) throw new BadRequestException("Date must be YYYY-MM-DD.");
    if (dateStr < nowInIst().date) throw new BadRequestException("That date has already passed.");
    const date = new Date(`${dateStr}T00:00:00Z`);
    await this.prisma.slotConfig.upsert({
      where: { date },
      create: { date, slots: [], isBlocked: true, note: note?.trim() || null },
      update: { isBlocked: true, note: note?.trim() || null },
    });
    return this.listDaysOff();
  }

  async removeDayOff(dateStr: string) {
    if (!DATE_RE.test(dateStr)) throw new BadRequestException("Date must be YYYY-MM-DD.");
    await this.prisma.slotConfig.updateMany({
      where: { date: new Date(`${dateStr}T00:00:00Z`) },
      data: { isBlocked: false, note: null },
    });
    return this.listDaysOff();
  }

  // ── Bookable slots ────────────────────────────────────────────────────────

  /** The sessions a client can book on a date ("YYYY-MM-DD", IST calendar). */
  async getBookableSlots(dateStr: string) {
    const empty = (reason: string, sameDayEnabled = false) => ({
      available: false,
      slots: [] as string[],
      sameDayEnabled,
      reason,
    });
    if (!DATE_RE.test(dateStr) || Number.isNaN(Date.parse(`${dateStr}T00:00:00Z`))) return empty("INVALID_DATE");

    const now = nowInIst();
    const date = new Date(`${dateStr}T00:00:00Z`);
    const [settings, config, provider] = await Promise.all([
      this.getSettings(),
      this.prisma.slotConfig.findUnique({ where: { date } }),
      this.getProvider(),
    ]);
    const sameDayEnabled = config?.sameDayEnabled ?? false;

    if (!settings.acceptingBookings) return empty("NOT_ACCEPTING", sameDayEnabled);
    if (dateStr < now.date) return empty("PAST", sameDayEnabled);
    if (daysBetween(now.date, dateStr) > settings.horizonDays) return empty("TOO_FAR", sameDayEnabled);
    if (config?.isBlocked) return empty("DAY_OFF", sameDayEnabled);
    if (!provider) return empty("NO_PROVIDER", sameDayEnabled);

    const ranges = await this.prisma.adminAvailability.findMany({
      where: { dayOfWeek: date.getUTCDay(), isActive: true },
      orderBy: { startTime: "asc" },
    });

    let sessions = ranges.flatMap((r) =>
      this.splitIntoSessions({ start: hhmmToMinutes(r.startTime), end: hhmmToMinutes(r.endTime) }, settings),
    );
    if (dateStr === now.date) {
      sessions = sessions.filter((s) => s.start >= now.minutes + SAME_DAY_LEAD_MINUTES);
    }

    const taken = await this.takenRanges(date);
    const free = sessions.filter((s) => !taken.some((t) => overlaps(s, t)));

    return {
      available: free.length > 0,
      slots: free.map(formatSlotLabel),
      sameDayEnabled,
      reason: free.length ? null : sessions.length ? "FULLY_BOOKED" : "NO_HOURS",
    };
  }

  async isBookable(dateStr: string, label: string) {
    const { slots } = await this.getBookableSlots(dateStr);
    const wanted = parseSlotLabel(label);
    return !!wanted && slots.some((s) => {
      const r = parseSlotLabel(s);
      return !!r && r.start === wanted.start && r.end === wanted.end;
    });
  }

  private splitIntoSessions(range: MinuteRange, s: ScheduleSettings): MinuteRange[] {
    const out: MinuteRange[] = [];
    for (let t = range.start; t + s.sessionMinutes <= range.end; t += s.sessionMinutes + s.bufferMinutes) {
      out.push({ start: t, end: t + s.sessionMinutes });
    }
    return out;
  }

  /** Confirmed sessions, plus checkouts still inside their payment window. */
  private async takenRanges(date: Date): Promise<MinuteRange[]> {
    const bookings = await this.prisma.booking.findMany({
      where: {
        scheduledDate: date,
        OR: [
          { status: BookingStatus.CONFIRMED },
          {
            status: BookingStatus.PENDING_PAYMENT,
            createdAt: { gte: new Date(Date.now() - PENDING_HOLD_MINUTES * 60_000) },
          },
        ],
      },
      select: { scheduledSlot: true },
    });
    return bookings.map((b) => parseSlotLabel(b.scheduledSlot)).filter((r): r is MinuteRange => r !== null);
  }

  // ── Live status ───────────────────────────────────────────────────────────

  /** Whether Dr. Pradeep is within his hours right now, else when he next is. */
  async getLiveStatus() {
    if (!(await this.getProvider())) return { isLive: false, nextWindow: null };

    const now = nowInIst();
    const weekly = await this.getWeekly();
    const daysOff = new Set((await this.listDaysOff()).map((d) => d.date));

    for (let offset = 0; offset <= 7; offset++) {
      const dateStr = addDays(now.date, offset);
      if (daysOff.has(dateStr)) continue;
      const ranges = weekly[(now.dayOfWeek + offset) % 7].ranges.map((r) => ({
        start: hhmmToMinutes(r.start),
        end: hhmmToMinutes(r.end),
      }));
      for (const r of ranges) {
        if (offset === 0 && now.minutes >= r.start && now.minutes < r.end) return { isLive: true, nextWindow: null };
        if (offset > 0 || r.start > now.minutes) {
          return { isLive: false, nextWindow: istToUtc(dateStr, r.start) };
        }
      }
    }
    return { isLive: false, nextWindow: null };
  }
}

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
