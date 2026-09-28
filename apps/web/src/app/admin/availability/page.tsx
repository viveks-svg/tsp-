"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, CalendarOff, Copy, Loader2, Plus, Radio, Save, Trash2 } from "lucide-react";
import { apiClient } from "@/lib/http/client";
import { cn } from "@/lib/cn";
import { PageHeader, Panel, Skeleton } from "@/features/admin/components/primitives";
import { calendarParts, formatDateTime } from "@/features/admin/lib/format";

// ── Types (mirror GET /admin/availability) ────────────────────────────────────

interface Range {
  start: string; // "HH:MM" IST
  end: string;
}
interface WeeklyDay {
  dayOfWeek: number;
  ranges: Range[];
}
interface Settings {
  sessionMinutes: number;
  bufferMinutes: number;
  horizonDays: number;
  acceptingBookings: boolean;
}
interface Astrologer {
  astrologerId: string;
  userId: string;
  name: string | null;
  email: string | null;
}
interface Schedule {
  provider: (Astrologer & { chosen: boolean }) | null;
  astrologers: Astrologer[];
  settings: Settings;
  weekly: WeeklyDay[];
  daysOff: { date: string; note: string | null }[];
}

// ── Time helpers ──────────────────────────────────────────────────────────────

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DISPLAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

const toMin = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};
const toHhmm = (min: number) => `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;
const to12h = (min: number) => {
  const h24 = Math.floor(min / 60) % 24;
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${String(min % 60).padStart(2, "0")} ${h24 < 12 ? "AM" : "PM"}`;
};

/** Quarter-hour choices from 5 AM to midnight. */
const TIME_OPTIONS = Array.from({ length: (24 - 5) * 4 + 1 }, (_, i) => 5 * 60 + i * 15).map((m) => ({
  value: m === 24 * 60 ? "24:00" : toHhmm(m),
  label: m === 24 * 60 ? "12:00 AM (midnight)" : to12h(m),
}));

/** Same splitting the server uses, so the preview matches what clients see. */
const sessionsFor = (range: Range, s: Settings) => {
  const out: number[] = [];
  for (let t = toMin(range.start); t + s.sessionMinutes <= toMin(range.end); t += s.sessionMinutes + s.bufferMinutes) {
    out.push(t);
  }
  return out;
};

const rangeProblem = (ranges: Range[], i: number) => {
  const r = ranges[i];
  if (toMin(r.end) <= toMin(r.start)) return "Ends before it starts";
  const clash = ranges.some((o, j) => j !== i && toMin(r.start) < toMin(o.end) && toMin(o.start) < toMin(r.end));
  return clash ? "Overlaps another block" : null;
};

const fullWeek = (weekly: WeeklyDay[]): WeeklyDay[] =>
  Array.from({ length: 7 }, (_, d) => ({ dayOfWeek: d, ranges: weekly.find((w) => w.dayOfWeek === d)?.ranges ?? [] }));

const todayIst = () => new Date(Date.now() + 330 * 60_000).toISOString().slice(0, 10);

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AvailabilityPage() {
  const [saved, setSaved] = useState<Schedule | null>(null);
  const [astrologerId, setAstrologerId] = useState<string>("");
  const [settings, setSettings] = useState<Settings | null>(null);
  const [weekly, setWeekly] = useState<WeeklyDay[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [live, setLive] = useState<{ isLive: boolean; nextWindow: string | null } | null>(null);

  const adopt = useCallback((s: Schedule) => {
    setSaved(s);
    setAstrologerId(s.provider?.astrologerId ?? "");
    setSettings(s.settings);
    setWeekly(fullWeek(s.weekly));
  }, []);

  const loadLive = useCallback(() => {
    apiClient
      .get<{ isLive: boolean; nextWindow: string | null }>("/availability/dr-pradeep")
      .then(setLive)
      .catch(() => setLive(null));
  }, []);

  useEffect(() => {
    apiClient
      .get<Schedule>("/admin/availability")
      .then(adopt)
      .catch((e) => setError(e instanceof Error ? e.message : "Could not load the schedule"));
    loadLive();
  }, [adopt, loadLive]);

  const dirty = useMemo(() => {
    if (!saved || !settings) return false;
    return (
      astrologerId !== (saved.provider?.astrologerId ?? "") ||
      JSON.stringify(settings) !== JSON.stringify(saved.settings) ||
      JSON.stringify(weekly) !== JSON.stringify(fullWeek(saved.weekly))
    );
  }, [saved, settings, weekly, astrologerId]);

  const hasProblems = weekly.some((d) => d.ranges.some((_, i) => rangeProblem(d.ranges, i)));

  const setDayRanges = (dayOfWeek: number, ranges: Range[]) =>
    setWeekly((w) => w.map((d) => (d.dayOfWeek === dayOfWeek ? { ...d, ranges } : d)));

  const copyMonday = () => {
    const monday = weekly.find((d) => d.dayOfWeek === 1)?.ranges ?? [];
    setWeekly((w) => w.map((d) => (d.dayOfWeek >= 2 && d.dayOfWeek <= 6 ? { ...d, ranges: monday.map((r) => ({ ...r })) } : d)));
    toast.success("Monday’s hours copied to Tuesday–Saturday. Save to apply.");
  };

  const save = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      const result = await apiClient.put<Schedule>("/admin/availability", {
        ...(astrologerId ? { astrologerId } : {}),
        settings,
        weekly: weekly.map((d) => ({ dayOfWeek: d.dayOfWeek, ranges: d.ranges })),
      });
      adopt(result);
      loadLive();
      toast.success("Consultation hours saved.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save");
    } finally {
      setSaving(false);
    }
  };

  const weeklySessions = settings
    ? weekly.reduce((n, d) => n + d.ranges.reduce((m, r) => m + sessionsFor(r, settings).length, 0), 0)
    : 0;

  return (
    <div className="mx-auto max-w-[1320px] space-y-8 px-5 py-8 md:px-10 md:py-12">
      <PageHeader
        eyebrow="Dr. Pradeep"
        title="Consultation hours"
        description="When Dr. Pradeep sees clients. Clients can only book the sessions these hours produce; changing them never cancels a session already booked."
        actions={
          <>
            <LiveBadge live={live} />
            <button
              onClick={save}
              disabled={!dirty || saving || hasProblems}
              className="inline-flex items-center gap-2 rounded-full bg-midnight px-5 py-2.5 text-[13px] font-semibold text-champagne-light shadow-[0_10px_24px_-12px_rgba(11,18,51,0.7)] transition hover:bg-midnight-2 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {dirty ? "Save changes" : "Saved"}
            </button>
          </>
        }
      />

      {error && <div className="rounded-xl border border-garnet/20 bg-garnet/5 px-5 py-4 text-sm text-garnet">{error}</div>}

      {!saved || !settings ? (
        !error && (
          <div className="space-y-6">
            <Skeleton className="h-56" />
            <Skeleton className="h-[520px]" />
          </div>
        )
      ) : (
        <>
          {/* Sessions */}
          <Panel title="Sessions" subtitle="How each consultation is laid out">
            {!saved.provider ? (
              <div className="mb-6 flex gap-3 rounded-xl border border-garnet/30 bg-garnet/5 px-4 py-3 text-[13px] text-ink-2">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-garnet" />
                <p>
                  No astrologer is set up yet, so clients can’t book. Add Dr. Pradeep on the{" "}
                  <a href="/admin/astrologers" className="font-semibold text-ink underline">Astrologers</a> page first.
                </p>
              </div>
            ) : (
              !saved.provider.chosen && (
                <div className="mb-6 flex gap-3 rounded-xl border border-champagne/40 bg-champagne/10 px-4 py-3 text-[13px] text-ink-2">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-bronze" />
                  <p>
                    No astrologer has been chosen for these hours, so{" "}
                    <strong className="font-semibold text-ink">{saved.provider.name || saved.provider.email}</strong> is used.
                    Choose Dr. Pradeep below and save.
                  </p>
                </div>
              )
            )}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
              <Field label="Astrologer" hint="Whose hours these are; live-queue calls go to him.">
                <select value={astrologerId} onChange={(e) => setAstrologerId(e.target.value)} className={inputClass}>
                  {saved.astrologers.length === 0 && <option value="">No astrologers yet</option>}
                  {saved.astrologers.map((a) => (
                    <option key={a.astrologerId} value={a.astrologerId}>
                      {a.name || a.email} {a.name && a.email ? `· ${a.email}` : ""}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Session length" hint="Each booking lasts this long.">
                <select
                  value={settings.sessionMinutes}
                  onChange={(e) => setSettings({ ...settings, sessionMinutes: Number(e.target.value) })}
                  className={inputClass}
                >
                  {[30, 45, 60, 75, 90, 120].map((m) => (
                    <option key={m} value={m}>
                      {m < 60 ? `${m} minutes` : m % 60 ? `${Math.floor(m / 60)} h ${m % 60} min` : `${m / 60} hour${m > 60 ? "s" : ""}`}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Rest between sessions" hint="Breathing room after each one.">
                <select
                  value={settings.bufferMinutes}
                  onChange={(e) => setSettings({ ...settings, bufferMinutes: Number(e.target.value) })}
                  className={inputClass}
                >
                  {[0, 5, 10, 15, 30, 45, 60].map((m) => (
                    <option key={m} value={m}>
                      {m === 0 ? "None" : `${m} minutes`}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Booking window" hint="How far ahead clients can book.">
                <select
                  value={settings.horizonDays}
                  onChange={(e) => setSettings({ ...settings, horizonDays: Number(e.target.value) })}
                  className={inputClass}
                >
                  {[14, 30, 45, 60, 90, 120, 180].map((d) => (
                    <option key={d} value={d}>
                      {d} days
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <div className="mt-6 flex items-center justify-between gap-4 rounded-xl border border-hairline bg-parchment/60 px-5 py-4">
              <div>
                <p className="text-[14px] font-medium text-ink">Taking bookings</p>
                <p className="text-[13px] text-ink-3">Switch off for leave — the hours below are kept for when he returns.</p>
              </div>
              <Switch
                checked={settings.acceptingBookings}
                onChange={(v) => setSettings({ ...settings, acceptingBookings: v })}
                label="Taking bookings"
              />
            </div>
          </Panel>

          {/* Weekly hours */}
          <Panel
            title="Weekly hours"
            subtitle={
              settings.acceptingBookings
                ? `Indian Standard Time · ${weeklySessions} session${weeklySessions === 1 ? "" : "s"} a week`
                : "Indian Standard Time · bookings are paused"
            }
            action={
              <button
                onClick={copyMonday}
                className="inline-flex shrink-0 items-center gap-2 rounded-full border border-hairline bg-ivory px-3.5 py-2 text-[12px] font-medium text-ink-2 transition hover:border-champagne hover:text-ink"
              >
                <Copy className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Copy Monday to Tue–Sat</span>
                <span className="sm:hidden">Copy Monday</span>
              </button>
            }
            bodyClassName="px-0 pb-2 md:px-0"
          >
            <ul className="divide-y divide-hairline">
              {DISPLAY_ORDER.map((d) => (
                <DayRow
                  key={d}
                  day={weekly.find((w) => w.dayOfWeek === d)!}
                  settings={settings}
                  onChange={(ranges) => setDayRanges(d, ranges)}
                />
              ))}
            </ul>
          </Panel>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <DaysOffPanel daysOff={saved.daysOff} onChange={(daysOff) => setSaved({ ...saved, daysOff })} />
            <PreviewPanel dirty={dirty} />
          </div>
        </>
      )}
    </div>
  );
}

// ── Pieces ────────────────────────────────────────────────────────────────────

const inputClass =
  "w-full rounded-xl border border-hairline bg-ivory px-3.5 py-2.5 text-[14px] text-ink outline-none transition focus:border-champagne focus:ring-2 focus:ring-champagne/20";

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="block text-[13px] font-medium text-ink-2">{label}</span>
      {children}
      {hint && <span className="block text-[12px] text-ink-3">{hint}</span>}
    </label>
  );
}

function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative h-7 w-12 shrink-0 rounded-full transition-colors",
        checked ? "bg-midnight" : "bg-[#D9D1C0]",
      )}
    >
      <span
        className={cn(
          "absolute top-1 left-1 h-5 w-5 rounded-full shadow transition-transform",
          checked ? "translate-x-5 bg-champagne-light" : "bg-white",
        )}
      />
    </button>
  );
}

function LiveBadge({ live }: { live: { isLive: boolean; nextWindow: string | null } | null }) {
  if (!live) return null;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-[12px] font-medium",
        live.isLive ? "border-emerald-deep/30 bg-emerald-deep/10 text-emerald-deep" : "border-hairline bg-ivory text-ink-2",
      )}
    >
      <Radio className="h-3.5 w-3.5" />
      {live.isLive ? "Within hours now" : live.nextWindow ? `Next sitting ${formatDateTime(live.nextWindow)}` : "No hours set"}
    </span>
  );
}

function DayRow({
  day,
  settings,
  onChange,
}: {
  day: WeeklyDay;
  settings: Settings;
  onChange: (ranges: Range[]) => void;
}) {
  const { ranges } = day;
  const sessions = ranges.flatMap((r, i) => (rangeProblem(ranges, i) ? [] : sessionsFor(r, settings)));
  sessions.sort((a, b) => a - b);

  const addRange = () => {
    const last = ranges.length ? Math.max(...ranges.map((r) => toMin(r.end))) : null;
    const start = last === null ? 10 * 60 : Math.min(last + 60, 21 * 60);
    const end = Math.min(start + 3 * 60, 24 * 60);
    onChange([...ranges, { start: toHhmm(start), end: end === 24 * 60 ? "24:00" : toHhmm(end) }]);
  };

  const update = (i: number, patch: Partial<Range>) => onChange(ranges.map((r, j) => (j === i ? { ...r, ...patch } : r)));

  return (
    <li className="grid grid-cols-1 gap-4 px-6 py-5 md:grid-cols-[180px_1fr] md:px-7">
      <div>
        <p className="font-playfair text-[17px] font-semibold text-ink">{DAY_NAMES[day.dayOfWeek]}</p>
        <p className="text-[12px] text-ink-3">
          {ranges.length === 0 ? "Not available" : `${sessions.length} session${sessions.length === 1 ? "" : "s"}`}
        </p>
      </div>
      <div className="space-y-3">
        {ranges.map((r, i) => {
          const problem = rangeProblem(ranges, i);
          return (
            <div key={i} className="flex flex-wrap items-center gap-2.5">
              <select
                aria-label={`${DAY_NAMES[day.dayOfWeek]} block ${i + 1} from`}
                value={r.start}
                onChange={(e) => update(i, { start: e.target.value })}
                className={cn(inputClass, "w-[132px]", problem && "border-garnet/50")}
              >
                {TIME_OPTIONS.filter((o) => o.value !== "24:00").map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <span className="text-ink-3">to</span>
              <select
                aria-label={`${DAY_NAMES[day.dayOfWeek]} block ${i + 1} to`}
                value={r.end}
                onChange={(e) => update(i, { end: e.target.value })}
                className={cn(inputClass, "w-[132px]", problem && "border-garnet/50")}
              >
                {TIME_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <button
                onClick={() => onChange(ranges.filter((_, j) => j !== i))}
                aria-label="Remove these hours"
                className="rounded-lg p-2 text-ink-3 transition hover:bg-garnet/10 hover:text-garnet"
              >
                <Trash2 className="h-4 w-4" />
              </button>
              {problem ? (
                <span className="text-[12px] text-garnet">{problem}</span>
              ) : (
                <span className="text-[12px] text-ink-3">
                  {sessionsFor(r, settings).length === 0
                    ? "Too short for a session"
                    : `${sessionsFor(r, settings).length} × ${settings.sessionMinutes} min`}
                </span>
              )}
            </div>
          );
        })}

        <button
          onClick={addRange}
          className="inline-flex items-center gap-1.5 text-[13px] font-medium text-bronze transition hover:text-ink"
        >
          <Plus className="h-4 w-4" /> Add hours
        </button>

        {sessions.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {sessions.map((m) => (
              <span
                key={m}
                className="rounded-full border border-hairline bg-parchment px-2.5 py-1 text-[11px] font-medium text-ink-2 tabular-nums"
              >
                {to12h(m)}
              </span>
            ))}
          </div>
        )}
      </div>
    </li>
  );
}

function DaysOffPanel({
  daysOff,
  onChange,
}: {
  daysOff: Schedule["daysOff"];
  onChange: (d: Schedule["daysOff"]) => void;
}) {
  const [date, setDate] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const add = async () => {
    if (!date) return;
    setBusy(true);
    try {
      onChange(await apiClient.post<Schedule["daysOff"]>("/admin/availability/days-off", { date, note: note || undefined }));
      setDate("");
      setNote("");
      toast.success("Day off added — no sessions can be booked that day.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not add the day off");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (d: string) => {
    try {
      onChange(await apiClient.delete<Schedule["daysOff"]>(`/admin/availability/days-off/${d}`));
      toast.success("Day off removed.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not remove the day off");
    }
  };

  return (
    <Panel title="Days off" subtitle="Travel, festivals, rest — no sessions can be booked" bodyClassName="space-y-5">
      <div className="flex flex-wrap items-end gap-3">
        <Field label="Date">
          <input type="date" min={todayIst()} value={date} onChange={(e) => setDate(e.target.value)} className={cn(inputClass, "w-[170px]")} />
        </Field>
        <div className="min-w-[160px] flex-1">
          <Field label="Reason (optional)">
            <input
              value={note}
              maxLength={120}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Diwali"
              className={inputClass}
            />
          </Field>
        </div>
        <button
          onClick={add}
          disabled={!date || busy}
          className="inline-flex items-center gap-2 rounded-full border border-midnight bg-midnight px-4 py-2.5 text-[13px] font-medium text-champagne-light transition hover:bg-midnight-2 disabled:opacity-40"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarOff className="h-4 w-4" />} Add
        </button>
      </div>

      {daysOff.length === 0 ? (
        <p className="text-[13px] text-ink-3">No days off ahead.</p>
      ) : (
        <ul className="divide-y divide-hairline rounded-xl border border-hairline">
          {daysOff.map((d) => {
            const p = calendarParts(d.date);
            return (
              <li key={d.date} className="flex items-center gap-4 px-4 py-3">
                <span className="w-24 shrink-0 font-medium text-ink">
                  {p.weekday}, {p.day} {p.month}
                </span>
                <span className="flex-1 truncate text-[13px] text-ink-3">{d.note || "—"}</span>
                <button
                  onClick={() => remove(d.date)}
                  aria-label="Remove day off"
                  className="rounded-lg p-2 text-ink-3 transition hover:bg-garnet/10 hover:text-garnet"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}

const REASONS: Record<string, string> = {
  NOT_ACCEPTING: "Bookings are paused.",
  PAST: "That date has passed.",
  TOO_FAR: "Beyond the booking window.",
  DAY_OFF: "A day off.",
  NO_HOURS: "No hours on this weekday.",
  FULLY_BOOKED: "Every session is taken.",
  NO_PROVIDER: "No admin account holds the schedule.",
  INVALID_DATE: "Choose a date.",
};

function PreviewPanel({ dirty }: { dirty: boolean }) {
  const [date, setDate] = useState(() => {
    const d = new Date(Date.now() + 330 * 60_000 + 2 * 86_400_000);
    return d.toISOString().slice(0, 10);
  });
  const [result, setResult] = useState<{ slots: string[]; reason: string | null } | null>(null);

  useEffect(() => {
    if (!date || dirty) return;
    apiClient
      .get<{ slots: string[]; reason: string | null }>(`/admin/availability/preview?date=${date}`)
      .then(setResult)
      .catch(() => setResult(null));
  }, [date, dirty]);

  return (
    <Panel title="What clients see" subtitle="The sessions offered on a date, after bookings and days off" bodyClassName="space-y-5">
      <Field label="Date">
        <input type="date" min={todayIst()} value={date} onChange={(e) => setDate(e.target.value)} className={cn(inputClass, "w-[170px]")} />
      </Field>
      {dirty ? (
        <p className="text-[13px] text-ink-3">Save your changes to preview them.</p>
      ) : !result ? (
        <Loader2 className="h-5 w-5 animate-spin text-champagne" />
      ) : result.slots.length === 0 ? (
        <p className="text-[13px] text-ink-3">No sessions — {REASONS[result.reason ?? ""] ?? "unavailable."}</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {result.slots.map((s) => (
            <span key={s} className="rounded-xl border border-hairline bg-parchment px-3 py-2 text-[13px] font-medium text-ink tabular-nums">
              {s}
            </span>
          ))}
        </div>
      )}
    </Panel>
  );
}
