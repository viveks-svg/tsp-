"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CalendarOff, Info } from "lucide-react";
import { apiClient } from "@/lib/http/client";
import { ENDPOINTS } from "@/lib/constants/http/endpoints";
import { cn } from "@/lib/cn";
import { PageHeader, Panel, Skeleton } from "@/features/admin/components/primitives";
import { calendarParts } from "@/features/admin/lib/format";

type Hours =
  | { isProvider: false; isAvailable: boolean }
  | {
      isProvider: true;
      isAvailable: boolean;
      settings: { sessionMinutes: number; bufferMinutes: number; horizonDays: number; acceptingBookings: boolean };
      weekly: { dayOfWeek: number; ranges: { start: string; end: string }[] }[];
      daysOff: { date: string; note: string | null }[];
    };

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DISPLAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

const to12h = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  if (h === 24) return "12:00 AM";
  return `${h % 12 === 0 ? 12 : h % 12}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
};

/**
 * The astrologer's view of their hours. The TSP office sets consultation hours
 * (Admin → Consultation Hours); the astrologer controls only whether they take
 * instant chat and call consultations right now.
 */
export default function MyHoursPage() {
  const [data, setData] = useState<Hours | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiClient
      .get<Hours>(ENDPOINTS.ASTROLOGER_PANEL.HOURS)
      .then(setData)
      .catch((e) => toast.error(e instanceof Error ? e.message : "Could not load your hours"));
  }, []);

  const toggle = async () => {
    if (!data) return;
    setSaving(true);
    try {
      await apiClient.patch(ENDPOINTS.ASTROLOGER_PANEL.AVAILABILITY, { isAvailable: !data.isAvailable });
      setData({ ...data, isAvailable: !data.isAvailable } as Hours);
      toast.success(!data.isAvailable ? "You are taking instant chat and calls." : "Instant chat and calls are paused.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not update");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-[1100px] space-y-8 px-5 py-8 md:px-10 md:py-12">
      <PageHeader
        eyebrow="Practice"
        title="My hours"
        description="When clients can book you. The TSP office keeps these hours; ask them to change a day or add time off."
      />

      {!data ? (
        <Skeleton className="h-96" />
      ) : (
        <>
          <Panel>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[15px] font-medium text-ink">Available for instant chat & calls</p>
                <p className="text-[13px] text-ink-3">Switch off when you step away. Booked sessions are not affected.</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={data.isAvailable}
                aria-label="Available for instant chat and calls"
                onClick={toggle}
                disabled={saving}
                className={cn("relative h-7 w-12 shrink-0 rounded-full transition-colors disabled:opacity-50", data.isAvailable ? "bg-midnight" : "bg-[#D9D1C0]")}
              >
                <span
                  className={cn(
                    "absolute top-1 left-1 h-5 w-5 rounded-full shadow transition-transform",
                    data.isAvailable ? "translate-x-5 bg-champagne-light" : "bg-white",
                  )}
                />
              </button>
            </div>
          </Panel>

          {!data.isProvider ? (
            <Panel>
              <p className="flex gap-3 text-[14px] text-ink-2">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-bronze" />
                Your consultation hours haven’t been set up yet. The TSP office will arrange them with you.
              </p>
            </Panel>
          ) : (
            <>
              <Panel
                title="Consultation hours"
                subtitle={`Indian Standard Time · ${data.settings.sessionMinutes}-minute sessions${
                  data.settings.bufferMinutes ? ` with ${data.settings.bufferMinutes} minutes between` : ""
                }${data.settings.acceptingBookings ? "" : " · bookings are paused"}`}
                bodyClassName="px-0 pb-2 md:px-0"
              >
                <ul className="divide-y divide-hairline">
                  {DISPLAY_ORDER.map((d) => {
                    const ranges = data.weekly.find((w) => w.dayOfWeek === d)?.ranges ?? [];
                    return (
                      <li key={d} className="flex flex-col gap-2 px-6 py-4 sm:flex-row sm:items-center md:px-7">
                        <span className="w-32 font-playfair text-[16px] font-semibold text-ink">{DAY_NAMES[d]}</span>
                        {ranges.length === 0 ? (
                          <span className="text-[14px] text-ink-3">Not available</span>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {ranges.map((r) => (
                              <span key={r.start} className="rounded-full border border-hairline bg-parchment px-3 py-1 text-[13px] text-ink-2 tabular-nums">
                                {to12h(r.start)} – {to12h(r.end)}
                              </span>
                            ))}
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </Panel>

              <Panel title="Days off" subtitle="No sessions can be booked on these dates">
                {data.daysOff.length === 0 ? (
                  <p className="text-[14px] text-ink-3">No days off ahead.</p>
                ) : (
                  <ul className="flex flex-wrap gap-2">
                    {data.daysOff.map((d) => {
                      const p = calendarParts(d.date);
                      return (
                        <li key={d.date} className="inline-flex items-center gap-2 rounded-xl border border-hairline bg-parchment px-3.5 py-2 text-[13px] text-ink-2">
                          <CalendarOff className="h-4 w-4 text-bronze" />
                          {p.weekday}, {p.day} {p.month}
                          {d.note && <span className="text-ink-3">· {d.note}</span>}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </Panel>
            </>
          )}
        </>
      )}
    </div>
  );
}
