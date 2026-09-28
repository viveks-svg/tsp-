"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Download, Info, Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";
import { Delta, PageHeader, Panel, PanelLink, Skeleton, StatTile } from "@/features/admin/components/primitives";
import { TableShell, td, th } from "@/features/admin/components/records";
import { RevenueChart } from "@/features/admin/components/RevenueChart";
import { useAdminList } from "@/features/admin/hooks/useAdminList";
import { formatCount, formatINR, percentChange } from "@/features/admin/lib/format";
import { downloadCsv } from "@/features/admin/lib/download";

interface Totals {
  bookings: number;
  wallet: number;
  shop: number;
  received: number;
  refunded: number;
  net: number;
  astrologerShare: number;
  paidOut: number;
  payments: number;
}

interface MonthRow extends Omit<Totals, "payments"> {
  month: string; // YYYY-MM
}

interface Report {
  range: { from: string; to: string; days: number; previousFrom: string; previousTo: string };
  totals: Totals;
  previous: Totals;
  months: MonthRow[];
  services: { service: string; category: string; paid: number; refunded: number; amount: number }[];
  consultations: { type: string; count: number; minutes: number; amount: number }[];
  clients: { newClients: number; paying: number; returning: number };
  topClients: { name: string | null; email: string; userId: string | null; amount: number; payments: number }[];
  now: { clientWallets: number; astrologerOwed: number };
}

// ── Date ranges (IST) ───────────────────────────────────────────────────────

const pad = (n: number) => String(n).padStart(2, "0");
const iso = (y: number, m: number, d: number) => `${y}-${pad(m)}-${pad(d)}`;
const lastDay = (y: number, m: number) => new Date(Date.UTC(y, m, 0)).getUTCDate();
const todayIst = () => new Date(Date.now() + 330 * 60_000).toISOString().slice(0, 10);

type Preset = "month" | "last-month" | "quarter" | "fy" | "last-fy" | "custom";

function presetRange(p: Exclude<Preset, "custom">): { from: string; to: string } {
  const today = todayIst();
  const [y, m] = today.split("-").map(Number);
  const fyStart = m >= 4 ? y : y - 1;
  switch (p) {
    case "month":
      return { from: iso(y, m, 1), to: today };
    case "last-month": {
      const [py, pm] = m === 1 ? [y - 1, 12] : [y, m - 1];
      return { from: iso(py, pm, 1), to: iso(py, pm, lastDay(py, pm)) };
    }
    case "quarter": {
      const qm = Math.floor((m - 1) / 3) * 3 + 1;
      return { from: iso(y, qm, 1), to: today };
    }
    case "fy":
      return { from: iso(fyStart, 4, 1), to: today };
    case "last-fy":
      return { from: iso(fyStart - 1, 4, 1), to: iso(fyStart, 3, 31) };
  }
}

const fyLabel = (offset: number) => {
  const [y, m] = todayIst().split("-").map(Number);
  const start = (m >= 4 ? y : y - 1) + offset;
  return `FY ${start}–${String(start + 1).slice(2)}`;
};

const monthLabel = (ym: string) => {
  const d = new Date(`${ym.slice(0, 7)}-01T00:00:00Z`);
  return {
    short: new Intl.DateTimeFormat("en-IN", { month: "short", timeZone: "UTC" }).format(d),
    full: new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric", timeZone: "UTC" }).format(d),
  };
};

const rangeLabel = (from: string, to: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to)) return "Choose a start and end date";
  const f = (s: string) => new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${s}T00:00:00Z`));
  return `${f(from)} – ${f(to)}`;
};

const CATEGORY: Record<string, string> = { CONSULTATION: "Consultation", BUSINESS_VASTU: "Vastu", REPORT: "Report" };
const CONSULT_TYPE: Record<string, string> = { CHAT: "Chat", CALL: "Call" };

const inputClass =
  "rounded-xl border border-hairline bg-ivory px-3 py-2 text-[13px] text-ink outline-none transition focus:border-champagne focus:ring-2 focus:ring-champagne/20";

/** Takings, refunds and the astrologer's share for any period — and a CSV for the accountant. */
export default function ReportsPage() {
  const [preset, setPreset] = useState<Preset>("fy");
  const [custom, setCustom] = useState(() => presetRange("month"));
  const range = preset === "custom" ? custom : presetRange(preset);
  const validCustom = preset !== "custom" || (custom.from && custom.to && custom.from <= custom.to);
  const { data, loading } = useAdminList<Report>("/admin/reports", range);
  const [exporting, setExporting] = useState(false);

  const presets: { value: Preset; label: string }[] = useMemo(
    () => [
      { value: "month", label: "This month" },
      { value: "last-month", label: "Last month" },
      { value: "quarter", label: "This quarter" },
      { value: "fy", label: fyLabel(0) },
      { value: "last-fy", label: fyLabel(-1) },
      { value: "custom", label: "Custom" },
    ],
    [],
  );

  const exportCsv = async () => {
    setExporting(true);
    try {
      await downloadCsv(`/admin/reports/export?from=${range.from}&to=${range.to}`, `tsp-report-${range.from}-to-${range.to}.csv`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not download");
    } finally {
      setExporting(false);
    }
  };

  const t = data?.totals;
  const prevName = "previous period";

  return (
    <div className="mx-auto max-w-[1320px] space-y-8 px-5 py-8 md:px-10 md:py-12">
      <PageHeader
        eyebrow="The House"
        title="Reports"
        description="What came in, what went back out, and what is owed to the astrologer — for any period, in Indian financial years."
        actions={
          <button
            onClick={exportCsv}
            disabled={exporting || !validCustom}
            className="inline-flex items-center gap-2 rounded-full bg-midnight px-5 py-2.5 text-[13px] font-semibold text-champagne-light shadow-[0_10px_24px_-12px_rgba(11,18,51,0.7)] transition hover:bg-midnight-2 disabled:opacity-40"
          >
            {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Monthly CSV for the accountant
          </button>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        {presets.map((p) => (
          <button
            key={p.value}
            onClick={() => setPreset(p.value)}
            className={cn(
              "rounded-full border px-4 py-1.5 text-[13px] font-medium transition",
              preset === p.value ? "border-midnight bg-midnight text-champagne-light" : "border-hairline bg-ivory text-ink-2 hover:border-champagne",
            )}
          >
            {p.label}
          </button>
        ))}
        {preset === "custom" && (
          <span className="flex flex-wrap items-center gap-2 pl-1">
            <input type="date" aria-label="From" value={custom.from} max={custom.to || undefined} onChange={(e) => setCustom((c) => ({ ...c, from: e.target.value }))} className={inputClass} />
            <span className="text-ink-3">to</span>
            <input type="date" aria-label="To" value={custom.to} min={custom.from || undefined} onChange={(e) => setCustom((c) => ({ ...c, to: e.target.value }))} className={inputClass} />
          </span>
        )}
      </div>
      <p className="-mt-5 text-[13px] text-ink-3">
        {rangeLabel(range.from, range.to)}
        {data && <> · compared with {rangeLabel(data.range.previousFrom, data.range.previousTo)}</>}
      </p>

      {!data || !t ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-36" />
          ))}
        </div>
      ) : (
        <div className={cn("space-y-8 transition-opacity", loading && "opacity-60")}>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
            <StatTile
              label="Received"
              value={formatINR(t.received)}
              detail={<Delta value={percentChange(t.received, data.previous.received)} period={prevName} />}
            />
            <StatTile label="Refunded" value={formatINR(t.refunded)} detail={`${formatCount(t.payments)} payments received in this period`} />
            <StatTile label="Net received" value={formatINR(t.net)} detail={<Delta value={percentChange(t.net, data.previous.net)} period={prevName} />} />
            <StatTile
              label="Astrologer’s share"
              value={formatINR(t.astrologerShare)}
              detail={`${formatINR(t.paidOut)} paid out in this period`}
            />
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_380px]">
            <Panel title="Money received by month" subtitle="Bookings, wallet top-ups and shop orders, before refunds.">
              {data.months.length > 1 ? (
                <RevenueChart
                  unit="month"
                  lastIsToday={false}
                  formatLabel={monthLabel}
                  height={240}
                  data={data.months.map((m) => ({ day: m.month, booking: m.bookings, wallet: m.wallet, shop: m.shop }))}
                />
              ) : (
                <p className="py-10 text-center text-sm text-ink-3">Choose a period longer than a month to see the trend.</p>
              )}
            </Panel>

            <Panel title="Where it came from">
              <SourceBreakdown totals={t} />
            </Panel>
          </div>

          <Panel title="Month by month" bodyClassName="px-0 pb-0 md:px-0">
            <TableShell loading={false} empty={null}>
              <table className="w-full min-w-[980px]">
                <thead>
                  <tr className="border-b border-hairline">
                    <th className={th}>Month</th>
                    <th className={`${th} text-right`}>Bookings</th>
                    <th className={`${th} text-right`}>Wallet top-ups</th>
                    <th className={`${th} text-right`}>Shop</th>
                    <th className={`${th} text-right`}>Received</th>
                    <th className={`${th} text-right`}>Refunded</th>
                    <th className={`${th} text-right`}>Net</th>
                    <th className={`${th} text-right`}>Astrologer’s share</th>
                    <th className={`${th} text-right`}>Paid out</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline">
                  {data.months.map((m) => (
                    <tr key={m.month}>
                      <td className={`${td} whitespace-nowrap font-medium text-ink`}>{monthLabel(m.month).full}</td>
                      <Money v={m.bookings} />
                      <Money v={m.wallet} />
                      <Money v={m.shop} />
                      <Money v={m.received} strong />
                      <Money v={m.refunded} negative />
                      <Money v={m.net} strong />
                      <Money v={m.astrologerShare} />
                      <Money v={m.paidOut} />
                    </tr>
                  ))}
                  {data.months.length > 1 && (
                    <tr className="bg-parchment/60">
                      <td className={`${td} font-semibold text-ink`}>Total</td>
                      <Money v={t.bookings} strong />
                      <Money v={t.wallet} strong />
                      <Money v={t.shop} strong />
                      <Money v={t.received} strong />
                      <Money v={t.refunded} negative strong />
                      <Money v={t.net} strong />
                      <Money v={t.astrologerShare} strong />
                      <Money v={t.paidOut} strong />
                    </tr>
                  )}
                </tbody>
              </table>
            </TableShell>
          </Panel>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <Panel title="Services booked" bodyClassName="px-0 pb-0 md:px-0">
              <TableShell loading={false} empty={data.services.length === 0 ? "No paid bookings in this period." : null}>
                <table className="w-full min-w-[520px]">
                  <thead>
                    <tr className="border-b border-hairline">
                      <th className={th}>Service</th>
                      <th className={`${th} text-right`}>Paid</th>
                      <th className={`${th} text-right`}>Refunded</th>
                      <th className={`${th} text-right`}>Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-hairline">
                    {data.services.map((s) => (
                      <tr key={`${s.category}-${s.service}`}>
                        <td className={td}>
                          <p className="font-medium text-ink">{s.service}</p>
                          <p className="text-[12px] text-ink-3">{CATEGORY[s.category] ?? s.category}</p>
                        </td>
                        <td className={`${td} text-right tabular-nums`}>{formatCount(s.paid)}</td>
                        <td className={`${td} text-right tabular-nums`}>{s.refunded ? formatCount(s.refunded) : "—"}</td>
                        <Money v={s.amount} strong />
                      </tr>
                    ))}
                  </tbody>
                </table>
              </TableShell>
            </Panel>

            <Panel title="Top clients" subtitle="By money received in this period." bodyClassName="px-0 pb-0 md:px-0">
              <TableShell loading={false} empty={data.topClients.length === 0 ? "No payments in this period." : null}>
                <table className="w-full min-w-[480px]">
                  <thead>
                    <tr className="border-b border-hairline">
                      <th className={th}>Client</th>
                      <th className={`${th} text-right`}>Payments</th>
                      <th className={`${th} text-right`}>Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-hairline">
                    {data.topClients.map((c) => (
                      <tr key={c.email}>
                        <td className={td}>
                          {c.userId ? (
                            <Link href={`/admin/clients/${c.userId}`} className="font-medium text-ink hover:text-bronze">
                              {c.name || c.email}
                            </Link>
                          ) : (
                            <p className="font-medium text-ink">{c.name || c.email}</p>
                          )}
                          {c.name && <p className="text-[12px] text-ink-3">{c.email}</p>}
                        </td>
                        <td className={`${td} text-right tabular-nums`}>{formatCount(c.payments)}</td>
                        <Money v={c.amount} strong />
                      </tr>
                    ))}
                  </tbody>
                </table>
              </TableShell>
            </Panel>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <Panel title="Clients">
              <dl className="space-y-3 text-[14px]">
                <Row label="New sign-ups" value={formatCount(data.clients.newClients)} />
                <Row label="Clients who paid" value={formatCount(data.clients.paying)} />
                <Row label="…of whom had paid before" value={formatCount(data.clients.returning)} />
              </dl>
            </Panel>
            <Panel title="Consultations completed">
              {data.consultations.length === 0 ? (
                <p className="text-sm text-ink-3">None in this period.</p>
              ) : (
                <dl className="space-y-3 text-[14px]">
                  {data.consultations.map((c) => (
                    <Row
                      key={c.type}
                      label={`${CONSULT_TYPE[c.type] ?? c.type} · ${formatCount(c.count)}`}
                      value={`${formatCount(c.minutes)} min · ${formatINR(c.amount)}`}
                    />
                  ))}
                </dl>
              )}
            </Panel>
            <Panel title="Right now" subtitle="Balances today, whatever period is chosen.">
              <dl className="space-y-3 text-[14px]">
                <Row label="Unspent in client wallets" value={formatINR(data.now.clientWallets)} />
                <Row label="Owed to the astrologer" value={formatINR(data.now.astrologerOwed)} />
              </dl>
              <div className="mt-4">
                <PanelLink href="/admin/payouts">Payouts</PanelLink>
              </div>
            </Panel>
          </div>

          <p className="flex gap-2 text-[12px] leading-relaxed text-ink-3">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            Money is counted on the day it is received and refunds on the day they are made, as on the bank statement. Wallet
            top-ups are prepayments: clients spend them on consultations later, so “Unspent in client wallets” is money held for them.
            The astrologer’s share is after TSP’s commission.
          </p>
        </div>
      )}
    </div>
  );
}

function Money({ v, strong, negative }: { v: number; strong?: boolean; negative?: boolean }) {
  return (
    <td className={cn(td, "text-right whitespace-nowrap tabular-nums", strong && "font-medium text-ink", negative && v > 0 && "text-garnet")}>
      {v === 0 ? <span className="text-ink-3">—</span> : `${negative ? "−" : ""}${formatINR(v)}`}
    </td>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-hairline pb-3 last:border-0 last:pb-0">
      <dt className="text-ink-2">{label}</dt>
      <dd className="font-inter font-semibold tabular-nums text-ink">{value}</dd>
    </div>
  );
}

function SourceBreakdown({ totals }: { totals: Totals }) {
  const rows = [
    { label: "Sessions & bookings", value: totals.bookings },
    { label: "Wallet top-ups", value: totals.wallet },
    { label: "Shop", value: totals.shop },
  ];
  const max = Math.max(1, ...rows.map((r) => r.value));
  if (totals.received === 0) return <p className="py-6 text-center text-sm text-ink-3">Nothing received in this period.</p>;
  return (
    <ul className="space-y-5">
      {rows.map((r) => (
        <li key={r.label} className="space-y-2">
          <div className="flex items-baseline justify-between gap-3 text-[14px]">
            <span className="text-ink-2">{r.label}</span>
            <span className="font-inter font-semibold tabular-nums text-ink">
              {formatINR(r.value)}{" "}
              <span className="text-[12px] font-normal text-ink-3">{Math.round((r.value / totals.received) * 100)}%</span>
            </span>
          </div>
          <div className="h-2 rounded-full bg-parchment">
            <div className="h-2 rounded-full bg-regal" style={{ width: `${(r.value / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}
