"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { CalendarClock, IndianRupee, ListOrdered, MessageSquare, Radio, RefreshCw, Video } from "lucide-react";
import { apiClient } from "@/lib/http/client";
import { ENDPOINTS } from "@/lib/constants/http/endpoints";
import { cn } from "@/lib/cn";
import { PageHeader, Panel, PanelLink, Skeleton, StatTile } from "@/features/admin/components/primitives";
import { calendarParts, formatDateTime, formatINR, formatLongDate, formatTime, greeting } from "@/features/admin/lib/format";
import { ConsultationList } from "@/features/astrologer/ConsultationList";

interface Overview {
  profile: { name: string | null; pricingPerMin: number; isAvailable: boolean };
  isProvider: boolean;
  live: { isLive: boolean; nextWindow: string | null };
  consultations: { pending: number; active: number; completed: number };
  queueWaiting: number;
  upcoming: {
    id: string;
    fullName: string;
    serviceName: string;
    scheduledDate: string | null;
    scheduledSlot: string | null;
    meetLink: string | null;
    notes: string | null;
  }[];
  earnings: { balance: number; thisMonth: number };
}

export default function AstrologerDashboardPage() {
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadedAt, setLoadedAt] = useState<Date | null>(null);

  const load = useCallback(async () => {
    try {
      setData(await apiClient.get<Overview>(ENDPOINTS.ASTROLOGER_PANEL.OVERVIEW));
      setLoadedAt(new Date());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load your overview");
    }
  }, []);

  useEffect(() => {
    void load();
    const t = setInterval(load, 30_000);
    return () => clearInterval(t);
  }, [load]);

  return (
    <div className="mx-auto max-w-[1320px] space-y-8 px-5 py-8 md:px-10 md:py-12">
      <PageHeader
        eyebrow={formatLongDate()}
        title={`${greeting()}, ${data?.profile.name || "Guruji"}`}
        description="Your sessions, clients and the day ahead."
        actions={
          <button
            onClick={load}
            className="inline-flex items-center gap-2 rounded-full border border-hairline bg-ivory px-4 py-2 text-[13px] font-medium text-ink-2 transition hover:border-champagne hover:text-ink"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            {loadedAt ? `Updated ${formatTime(loadedAt)}` : "Refresh"}
          </button>
        }
      />

      {error && <div className="rounded-xl border border-garnet/20 bg-garnet/5 px-5 py-4 text-sm text-garnet">{error}</div>}

      {!data ? (
        !error && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-36" />
            ))}
          </div>
        )
      ) : (
        <>
          {/* Status ribbon */}
          <div
            className={cn(
              "flex flex-wrap items-center gap-3 rounded-2xl border px-5 py-4 text-[14px]",
              data.live.isLive ? "border-emerald-deep/25 bg-emerald-deep/5 text-emerald-deep" : "border-hairline bg-ivory text-ink-2",
            )}
          >
            <Radio className="h-4 w-4" />
            {data.isProvider
              ? data.live.isLive
                ? "You are within your consultation hours now."
                : data.live.nextWindow
                  ? `Your next consultation hours begin ${formatDateTime(data.live.nextWindow)}.`
                  : "No consultation hours are set yet — the TSP office sets them."
              : "Your consultation hours are not set up yet. The TSP office will arrange them."}
            {!data.profile.isAvailable && (
              <span className="rounded-full bg-garnet/10 px-2.5 py-0.5 text-[12px] font-medium text-garnet">
                Instant chat & calls are paused
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
            <StatTile
              label="Sessions ahead"
              icon={<CalendarClock className="h-4 w-4" />}
              value={data.upcoming.length}
              detail={data.upcoming[0]?.scheduledDate ? `Next on ${calendarParts(data.upcoming[0].scheduledDate).full}` : "Nothing booked ahead"}
            />
            <StatTile
              label="Waiting in the live queue"
              icon={<ListOrdered className="h-4 w-4" />}
              value={data.queueWaiting}
              detail={<Link href="/astrologer/queue" className="text-bronze hover:underline">Open the live queue</Link>}
            />
            <StatTile
              label="Consultations needing you"
              icon={<MessageSquare className="h-4 w-4" />}
              value={data.consultations.pending + data.consultations.active}
              detail={`${data.consultations.completed} completed in all`}
            />
            <StatTile
              label="Earned this month"
              icon={<IndianRupee className="h-4 w-4" />}
              value={formatINR(data.earnings.thisMonth)}
              detail={`Balance ${formatINR(data.earnings.balance)}`}
            />
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
            <Panel
              className="xl:col-span-3"
              title="Your diary"
              subtitle="Confirmed sessions from today onwards"
              bodyClassName="px-0 pb-2 md:px-0"
            >
              {data.upcoming.length === 0 ? (
                <p className="px-6 pb-6 text-sm text-ink-3 md:px-7">No sessions are booked ahead.</p>
              ) : (
                <ul className="divide-y divide-hairline">
                  {data.upcoming.map((b) => {
                    const d = b.scheduledDate ? calendarParts(b.scheduledDate) : null;
                    return (
                      <li key={b.id} className="flex items-center gap-5 px-6 py-4 md:px-7">
                        <div className="flex w-14 shrink-0 flex-col items-center rounded-xl border border-hairline bg-parchment py-2">
                          <span className="font-cinzel text-[10px] font-semibold uppercase tracking-[0.18em] text-bronze">{d?.weekday ?? "—"}</span>
                          <span className="font-inter text-xl leading-tight font-semibold text-ink">{d?.day ?? "?"}</span>
                          <span className="text-[11px] text-ink-3">{d?.month ?? ""}</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium text-ink">{b.serviceName}</p>
                          <p className="truncate text-[13px] text-ink-3">
                            {b.fullName}
                            {b.scheduledSlot && ` · ${b.scheduledSlot}`}
                          </p>
                          {b.notes && <p className="mt-1 line-clamp-1 text-[12px] text-ink-3 italic">“{b.notes}”</p>}
                        </div>
                        {b.meetLink && (
                          <a
                            href={b.meetLink}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-midnight px-3.5 py-1.5 text-[12px] font-medium text-champagne-light transition hover:bg-midnight-2"
                          >
                            <Video className="h-3.5 w-3.5" /> Join
                          </a>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </Panel>

            <Panel
              className="xl:col-span-2"
              title="Consultations"
              subtitle="Waiting for you and in progress first"
              action={<PanelLink href="/astrologer/consultations">All</PanelLink>}
              bodyClassName="pt-4"
            >
              <ConsultationList limit={5} />
            </Panel>
          </div>
        </>
      )}
    </div>
  );
}
