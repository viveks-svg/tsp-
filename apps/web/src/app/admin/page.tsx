"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  CalendarClock,
  ChevronRight,
  IndianRupee,
  PhoneCall,
  RefreshCw,
  ShoppingBag,
  UserRound,
  UsersRound,
  Video,
  Wallet,
} from "lucide-react";
import { apiClient } from "@/lib/http/client";
import { useAuth } from "@/providers/AuthProvider";
import { cn } from "@/lib/cn";
import { RevenueChart, type TrendPoint } from "@/features/admin/components/RevenueChart";
import {
  Delta,
  Eyebrow,
  PageHeader,
  Panel,
  PanelLink,
  Skeleton,
  StatTile,
} from "@/features/admin/components/primitives";
import {
  calendarParts,
  formatCount,
  formatDateTime,
  formatINR,
  formatLongDate,
  formatTime,
  greeting,
  percentChange,
} from "@/features/admin/lib/format";

type Source = "BOOKING" | "WALLET" | "SHOP";

interface Overview {
  generatedAt: string;
  revenue: {
    today: number;
    month: number;
    lastMonth: number;
    lifetime: number;
    monthBySource: Record<Source, number>;
  };
  trend: TrendPoint[];
  recentPayments: { source: Source; id: string; name: string | null; label: string; amount: number; at: string }[];
  clients: { total: number; newThisMonth: number; newLastMonth: number };
  upcoming: {
    count: number;
    items: {
      id: string;
      fullName: string;
      serviceName: string;
      serviceCategory: string;
      scheduledDate: string | null;
      scheduledSlot: string | null;
      meetLink: string | null;
      amount: number;
    }[];
  };
  attention: { openLeads: number; unpaidCheckouts: number; shopToFulfil: number; liveConsultations: number; moneyAwaitingApproval?: number };
}

const SOURCE_LABEL: Record<Source, string> = {
  BOOKING: "Sessions & bookings",
  WALLET: "Wallet top-ups",
  SHOP: "Shop",
};

const SOURCE_ICON: Record<Source, typeof IndianRupee> = {
  BOOKING: CalendarClock,
  WALLET: Wallet,
  SHOP: ShoppingBag,
};

export default function AdminOverviewPage() {
  const { user } = useAuth();
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setRefreshing(true);
    setError(null);
    try {
      setData(await apiClient.get<Overview>("/admin/overview"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load the overview");
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);


  return (
    <div className="mx-auto max-w-[1320px] space-y-8 px-5 py-8 md:px-10 md:py-12">
      <PageHeader
        eyebrow={formatLongDate()}
        title={`${greeting()}, ${user?.name || "Administrator"}`}
        description="Here is how the house of Time Space & Planets stands today."
        actions={
          <button
            onClick={load}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-full border border-hairline bg-ivory px-4 py-2 text-[13px] font-medium text-ink-2 transition hover:border-champagne hover:text-ink disabled:opacity-60"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", refreshing && "animate-spin")} />
            {data ? `Updated ${formatTime(data.generatedAt)}` : "Refresh"}
          </button>
        }
      />

      {error && (
        <div className="rounded-xl border border-garnet/20 bg-garnet/5 px-5 py-4 text-sm text-garnet">{error}</div>
      )}

      {!data && !error ? <OverviewSkeleton /> : data && <OverviewBody data={data} />}
    </div>
  );
}

function OverviewBody({ data }: { data: Overview }) {
  const { revenue, clients, upcoming, attention } = data;
  const nextSession = upcoming.items[0];

  return (
    <>
      {/* Treasury + key figures */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Panel className="xl:col-span-2" bodyClassName="pt-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <Eyebrow>Received this month</Eyebrow>
              <p className="font-inter text-5xl leading-none font-semibold tracking-tight text-ink md:text-[56px]">
                {formatINR(revenue.month)}
              </p>
              <p className="text-[13px]">
                <Delta value={percentChange(revenue.month, revenue.lastMonth)} period="last month" />
              </p>
            </div>
            <dl className="grid grid-cols-3 gap-6 border-t border-hairline pt-5 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-8">
              {(Object.keys(SOURCE_LABEL) as Source[]).map((s) => (
                <div key={s} className="space-y-1">
                  <dt className="text-[12px] text-ink-3">{SOURCE_LABEL[s]}</dt>
                  <dd className="font-inter text-[17px] font-semibold text-ink tabular-nums">
                    {formatINR(revenue.monthBySource[s])}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="mt-8">
            <p className="mb-3 text-[13px] text-ink-3">Money received per day, last 30 days</p>
            <RevenueChart data={data.trend} height={236} />
          </div>
        </Panel>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 xl:grid-cols-1">
          <StatTile
            label="Received today"
            icon={<IndianRupee className="h-4 w-4" />}
            value={formatINR(revenue.today)}
            detail={`${formatINR(revenue.lifetime)} since launch`}
          />
          <StatTile
            label="Sessions ahead"
            icon={<CalendarClock className="h-4 w-4" />}
            value={formatCount(upcoming.count)}
            detail={
              nextSession?.scheduledDate
                ? `Next on ${calendarParts(nextSession.scheduledDate).full}`
                : "Nothing booked ahead"
            }
          />
          <StatTile
            label="Clients"
            icon={<UsersRound className="h-4 w-4" />}
            value={formatCount(clients.total)}
            detail={`${formatCount(clients.newThisMonth)} joined this month`}
          />
        </div>
      </div>

      {/* Diary + attention */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Panel
          className="xl:col-span-2"
          title="Dr. Pradeep’s diary"
          subtitle="Confirmed sessions from today onwards"
          action={<PanelLink href="/admin/bookings">All bookings</PanelLink>}
          bodyClassName="px-0 pb-2 md:px-0"
        >
          {upcoming.items.length === 0 ? (
            <EmptyState icon={CalendarClock} text="No sessions are booked ahead." />
          ) : (
            <ul className="divide-y divide-hairline">
              {upcoming.items.map((b) => {
                const d = b.scheduledDate ? calendarParts(b.scheduledDate) : null;
                return (
                  <li key={b.id} className="flex items-center gap-5 px-6 py-4 md:px-7">
                    <div className="flex w-14 shrink-0 flex-col items-center rounded-xl border border-hairline bg-parchment py-2">
                      <span className="font-cinzel text-[10px] font-semibold uppercase tracking-[0.18em] text-bronze">
                        {d?.weekday ?? "—"}
                      </span>
                      <span className="font-inter text-xl leading-tight font-semibold text-ink">{d?.day ?? "?"}</span>
                      <span className="text-[11px] text-ink-3">{d?.month ?? ""}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-ink">{b.serviceName}</p>
                      <p className="truncate text-[13px] text-ink-3">
                        {b.fullName}
                        {b.scheduledSlot && ` · ${b.scheduledSlot}`}
                      </p>
                    </div>
                    <div className="hidden text-right sm:block">
                      <p className="font-inter text-[15px] font-semibold text-ink tabular-nums">{formatINR(b.amount)}</p>
                    </div>
                    {b.meetLink ? (
                      <a
                        href={b.meetLink}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-full bg-midnight px-3.5 py-1.5 text-[12px] font-medium text-champagne-light transition hover:bg-midnight-2"
                      >
                        <Video className="h-3.5 w-3.5" /> Join
                      </a>
                    ) : (
                      <span className="w-[62px]" />
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>

        <Panel title="Needs attention" subtitle="Waiting on someone at TSP" bodyClassName="px-0 pb-2 md:px-0">
          <ul className="divide-y divide-hairline">
            <AttentionRow
              icon={PhoneCall}
              label="Booking leads to follow up"
              value={attention.openLeads}
              href="/admin/leads"
            />
            <AttentionRow
              icon={IndianRupee}
              label="Unpaid checkouts, last 7 days"
              value={attention.unpaidCheckouts}
              href="/admin/bookings?view=unpaid"
            />
            <AttentionRow icon={ShoppingBag} label="Shop orders to dispatch" value={attention.shopToFulfil} href="/admin/orders" />
            {(attention.moneyAwaitingApproval ?? 0) > 0 && (
              <AttentionRow icon={IndianRupee} label="Money requests awaiting approval" value={attention.moneyAwaitingApproval!} href="/admin/money" />
            )}
            <AttentionRow
              icon={UserRound}
              label="Consultations in progress"
              value={attention.liveConsultations}
              href="/admin/queue"
            />
          </ul>
        </Panel>
      </div>

      {/* Recent receipts */}
      <Panel
        title="Recent receipts"
        subtitle="The latest payments across sessions, wallet and shop"
        action={<PanelLink href="/admin/payments">All payments</PanelLink>}
        bodyClassName="px-0 pb-2 md:px-0"
      >
        {data.recentPayments.length === 0 ? (
          <EmptyState icon={IndianRupee} text="No payments received yet." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-hairline text-[12px] text-ink-3">
                  <th className="px-6 py-3 font-medium md:px-7">Received</th>
                  <th className="px-3 py-3 font-medium">Client</th>
                  <th className="px-3 py-3 font-medium">For</th>
                  <th className="px-3 py-3 font-medium">Through</th>
                  <th className="px-6 py-3 text-right font-medium md:px-7">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline">
                {data.recentPayments.map((p) => {
                  const Icon = SOURCE_ICON[p.source];
                  return (
                    <tr key={`${p.source}-${p.id}`} className="transition-colors hover:bg-parchment/60">
                      <td className="px-6 py-3.5 whitespace-nowrap text-ink-2 md:px-7">{formatDateTime(p.at)}</td>
                      <td className="px-3 py-3.5 font-medium text-ink">{p.name ?? "—"}</td>
                      <td className="max-w-[280px] truncate px-3 py-3.5 text-ink-2">{p.label}</td>
                      <td className="px-3 py-3.5">
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-hairline bg-parchment px-2.5 py-1 text-[12px] text-ink-2">
                          <Icon className="h-3 w-3 text-bronze" />
                          {SOURCE_LABEL[p.source]}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-right font-semibold whitespace-nowrap text-ink tabular-nums md:px-7">
                        {formatINR(p.amount)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </>
  );
}

function AttentionRow({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: typeof IndianRupee;
  label: string;
  value: number;
  href?: string;
}) {
  const body = (
    <>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-hairline bg-parchment text-bronze">
        <Icon className="h-4 w-4" />
      </span>
      <span className="flex-1 text-[14px] text-ink-2">{label}</span>
      <span className={cn("font-inter text-lg font-semibold tabular-nums", value > 0 ? "text-ink" : "text-ink-3")}>
        {formatCount(value)}
      </span>
      {href && <ChevronRight className="h-4 w-4 text-ink-3" />}
    </>
  );
  return (
    <li>
      {href ? (
        <Link href={href} className="flex items-center gap-4 px-6 py-4 transition-colors hover:bg-parchment/60 md:px-7">
          {body}
        </Link>
      ) : (
        <div className="flex items-center gap-4 px-6 py-4 md:px-7">{body}</div>
      )}
    </li>
  );
}

function EmptyState({ icon: Icon, text }: { icon: typeof IndianRupee; text: string }) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
      <span className="flex h-11 w-11 items-center justify-center rounded-full border border-hairline bg-parchment text-champagne">
        <Icon className="h-5 w-5" />
      </span>
      <p className="text-sm text-ink-3">{text}</p>
    </div>
  );
}

function OverviewSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Skeleton className="h-[420px] xl:col-span-2" />
        <div className="grid gap-6">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Skeleton className="h-72 xl:col-span-2" />
        <Skeleton className="h-72" />
      </div>
    </div>
  );
}
