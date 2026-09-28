"use client";

import { useState } from "react";
import { toast } from "sonner";
import { CalendarClock, Download, Loader2, ShoppingBag, Wallet } from "lucide-react";
import { PageHeader, Panel } from "@/features/admin/components/primitives";
import { FilterTabs, Pagination, SearchBox, StatusBadge, TableShell, td, th } from "@/features/admin/components/records";
import { useAdminList } from "@/features/admin/hooks/useAdminList";
import { useAuth } from "@/providers/AuthProvider";
import { MoneyActionDialog, type MoneyActionType } from "@/features/admin/components/MoneyActionDialog";
import { useRefunds } from "@/features/admin/components/RefundHistory";
import { formatDateTime, formatINR } from "@/features/admin/lib/format";

type Source = "ALL" | "BOOKING" | "WALLET" | "SHOP";
type Status = "ALL" | "PAID" | "PENDING" | "FAILED" | "CANCELLED" | "REFUNDED";

interface PaymentRow {
  source: Exclude<Source, "ALL">;
  id: string;
  name: string | null;
  email: string | null;
  label: string;
  amount: number;
  status: Exclude<Status, "ALL">;
  reference: string | null;
  at: string;
}

const SOURCE = {
  BOOKING: { label: "Sessions & bookings", icon: CalendarClock },
  WALLET: { label: "Wallet top-up", icon: Wallet },
  SHOP: { label: "Shop", icon: ShoppingBag },
} as const;

const inputClass =
  "rounded-xl border border-hairline bg-ivory px-3 py-2 text-[13px] text-ink outline-none focus:border-champagne focus:ring-2 focus:ring-champagne/20";

const REFUND_TYPE: Record<PaymentRow["source"], MoneyActionType> = {
  BOOKING: "REFUND_BOOKING",
  WALLET: "REFUND_WALLET_TOPUP",
  SHOP: "REFUND_SHOP_ORDER",
};

export default function PaymentsPage() {
  const { user } = useAuth();
  const canRefund = !!user?.permissions?.includes("payments.refund");
  const [refunding, setRefunding] = useState<PaymentRow | null>(null);
  const [source, setSource] = useState<Source>("ALL");
  const [status, setStatus] = useState<Status>("PAID");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [exporting, setExporting] = useState(false);

  const { data, loading, queryString, reload } = useAdminList<{ items: PaymentRow[]; total: number; paidTotal: number; page: number; pageSize: number }>(
    "/admin/payments",
    { source, status, from, to, q, page },
  );

  const reset = <T,>(set: (v: T) => void) => (v: T) => {
    set(v);
    setPage(1);
  };

  const exportCsv = async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams(queryString);
      params.delete("page");
      const res = await fetch(`/api/admin/payments/export?${params}`, { credentials: "include" });
      if (!res.ok) throw new Error(`Export failed (${res.status})`);
      const url = URL.createObjectURL(await res.blob());
      const a = document.createElement("a");
      a.href = url;
      a.download = `tsp-payments-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not export");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="mx-auto max-w-[1320px] space-y-8 px-5 py-8 md:px-10 md:py-12">
      <PageHeader
        eyebrow="Treasury"
        title="Payments"
        description="Every payment across sessions and bookings, wallet top-ups and the shop. Dates are Indian Standard Time."
        actions={
          <button
            onClick={exportCsv}
            disabled={exporting || !data || data.total === 0}
            className="inline-flex items-center gap-2 rounded-full border border-hairline bg-ivory px-4 py-2 text-[13px] font-medium text-ink-2 transition hover:border-champagne hover:text-ink disabled:opacity-40"
          >
            {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} Export CSV
          </button>
        }
      />

      <Panel bodyClassName="space-y-4 pt-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <FilterTabs
            value={status}
            onChange={reset(setStatus)}
            options={[
              { value: "PAID", label: "Received" },
              { value: "PENDING", label: "Pending" },
              { value: "FAILED", label: "Failed" },
              { value: "REFUNDED", label: "Refunded" },
              { value: "CANCELLED", label: "Cancelled" },
              { value: "ALL", label: "All" },
            ]}
          />
          <SearchBox value={q} onChange={reset(setQ)} placeholder="Client, email or payment ID" />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <FilterTabs
            value={source}
            onChange={reset(setSource)}
            options={[
              { value: "ALL", label: "All sources" },
              { value: "BOOKING", label: "Sessions & bookings" },
              { value: "WALLET", label: "Wallet" },
              { value: "SHOP", label: "Shop" },
            ]}
          />
          <div className="flex items-center gap-2 text-[13px] text-ink-3">
            <input type="date" aria-label="From date" value={from} onChange={(e) => reset(setFrom)(e.target.value)} className={inputClass} />
            to
            <input type="date" aria-label="To date" value={to} min={from || undefined} onChange={(e) => reset(setTo)(e.target.value)} className={inputClass} />
            {(from || to) && (
              <button onClick={() => { setFrom(""); setTo(""); setPage(1); }} className="text-bronze hover:text-ink">
                Clear
              </button>
            )}
          </div>
        </div>
      </Panel>

      <Panel
        title={data ? `${data.total} payment${data.total === 1 ? "" : "s"}` : "Payments"}
        subtitle={data && data.paidTotal > 0 ? `${formatINR(data.paidTotal)} received in this view` : undefined}
        bodyClassName="px-0 pb-0 md:px-0"
      >
        <TableShell loading={loading && !data} empty={data && data.items.length === 0 ? "No payments match these filters." : null}>
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="border-b border-hairline">
                <th className={th}>Date</th>
                <th className={th}>Client</th>
                <th className={th}>For</th>
                <th className={th}>Through</th>
                <th className={th}>Status</th>
                <th className={th}>Reference</th>
                <th className={`${th} text-right`}>Amount</th>
                {canRefund && <th className={th} aria-label="Actions" />}
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {data?.items.map((p) => {
                const Icon = SOURCE[p.source].icon;
                return (
                  <tr key={`${p.source}-${p.id}`}>
                    <td className={`${td} whitespace-nowrap`}>{formatDateTime(p.at)}</td>
                    <td className={td}>
                      <p className="font-medium text-ink">{p.name || "—"}</p>
                      {p.email && <p className="text-[12px] text-ink-3">{p.email}</p>}
                    </td>
                    <td className={`${td} max-w-[240px] truncate`}>{p.label}</td>
                    <td className={td}>
                      <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-[13px]">
                        <Icon className="h-3.5 w-3.5 text-bronze" /> {SOURCE[p.source].label}
                      </span>
                    </td>
                    <td className={td}>
                      <StatusBadge status={p.status} />
                    </td>
                    <td className={`${td} max-w-[160px] truncate font-mono text-[12px]`} title={p.reference ?? undefined}>
                      {p.reference || "—"}
                    </td>
                    <td className={`${td} text-right font-semibold whitespace-nowrap text-ink tabular-nums`}>{formatINR(p.amount)}</td>
                    {canRefund && (
                      <td className={`${td} text-right`}>
                        {p.status === "PAID" && (
                          <button onClick={() => setRefunding(p)} className="text-[12px] font-medium text-garnet hover:underline">
                            Refund
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </TableShell>
        {data && <Pagination page={data.page} pageSize={data.pageSize} total={data.total} onPage={setPage} />}
      </Panel>

      {refunding && <RefundPaymentDialog payment={refunding} onClose={() => setRefunding(null)} onDone={() => reload()} />}
    </div>
  );
}

/** The refund dialog, capped at what is still refundable after earlier (done or waiting) refunds. */
function RefundPaymentDialog({ payment, onClose, onDone }: { payment: PaymentRow; onClose: () => void; onDone: () => void }) {
  const refunds = useRefunds(payment.id);
  // Wait for the history so the dialog opens with the right maximum.
  if (!refunds.ready) return null;
  const refundable = Math.max(0, Math.round((payment.amount - refunds.committed) * 100) / 100);
  return (
    <MoneyActionDialog
      type={REFUND_TYPE[payment.source]}
      title={`Refund ${SOURCE[payment.source].label.toLowerCase()}`}
      subtitle={`${payment.name ?? "Client"} · ${formatINR(payment.amount)} paid ${formatDateTime(payment.at)}`}
      targetId={payment.id}
      max={refundable}
      note={
        payment.source === "WALLET"
          ? "The money goes back to the client's card or UPI and the same amount leaves their TSP wallet. Only unspent wallet money can be refunded."
          : `The money goes back to the client's original payment method through Razorpay.${
              refunds.committed > 0 ? ` ${formatINR(refunds.committed)} has already been refunded or is awaiting approval.` : ""
            }`
      }
      onClose={onClose}
      onDone={onDone}
    />
  );
}
