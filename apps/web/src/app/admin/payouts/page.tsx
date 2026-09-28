"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Landmark } from "lucide-react";
import { apiClient } from "@/lib/http/client";
import { PageHeader, Panel, Skeleton } from "@/features/admin/components/primitives";
import { Badge, Pagination, TableShell, td, th } from "@/features/admin/components/records";
import { MoneyActionDialog } from "@/features/admin/components/MoneyActionDialog";
import { useAdminList } from "@/features/admin/hooks/useAdminList";
import { formatDateTime, formatINR } from "@/features/admin/lib/format";

interface Balance {
  astrologerId: string;
  userId: string;
  name: string | null;
  email: string | null;
  active: boolean;
  owed: number;
  awaitingApproval: number;
  earned: number;
  paidOut: number;
  lastPayout: { amount: number; at: string; reference: string | null } | null;
}

interface Payout {
  id: string;
  status: string;
  amount: number;
  reason: string;
  reference: string | null;
  user: { name: string | null } | null;
  requestedBy: string;
  createdAt: string;
}

/**
 * What TSP owes each astrologer (their earnings after commission, less payouts)
 * and a record of the bank transfers made to them.
 */
export default function PayoutsPage() {
  const [balances, setBalances] = useState<Balance[] | null>(null);
  const [paying, setPaying] = useState<Balance | null>(null);
  const [page, setPage] = useState(1);
  const history = useAdminList<{ items: Payout[]; total: number; page: number; pageSize: number }>("/admin/money", {
    type: "ASTROLOGER_PAYOUT",
    status: "ALL",
    page,
  });

  const load = useCallback(() => {
    apiClient
      .get<Balance[]>("/admin/money/payouts")
      .then(setBalances)
      .catch((e) => toast.error(e instanceof Error ? e.message : "Could not load payouts"));
  }, []);
  useEffect(load, [load]);

  return (
    <div className="mx-auto max-w-[1320px] space-y-8 px-5 py-8 md:px-10 md:py-12">
      <PageHeader
        eyebrow="Treasury"
        title="Payouts"
        description="What TSP owes each astrologer — their consultations and sessions after commission — and the bank transfers made to them. Transfer the money from the bank, then record it here with its reference."
      />

      {!balances ? (
        <Skeleton className="h-60" />
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {balances.map((b) => (
            <Panel key={b.astrologerId} bodyClassName="pt-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-playfair text-xl font-semibold text-ink">{b.name}</p>
                  <p className="text-[13px] text-ink-3">{b.email}</p>
                </div>
                {!b.active && <Badge tone="neutral">Deactivated</Badge>}
              </div>
              <div className="mt-5 grid grid-cols-3 gap-4 border-t border-hairline pt-5">
                <div>
                  <p className="text-[12px] text-ink-3">Owed now</p>
                  <p className="font-inter text-2xl font-semibold text-ink tabular-nums">{formatINR(b.owed)}</p>
                  {b.awaitingApproval > 0 && <p className="text-[12px] text-bronze">{formatINR(b.awaitingApproval)} awaiting approval</p>}
                </div>
                <div>
                  <p className="text-[12px] text-ink-3">Earned</p>
                  <p className="font-inter text-[17px] font-semibold text-ink tabular-nums">{formatINR(b.earned)}</p>
                </div>
                <div>
                  <p className="text-[12px] text-ink-3">Paid out</p>
                  <p className="font-inter text-[17px] font-semibold text-ink tabular-nums">{formatINR(b.paidOut)}</p>
                </div>
              </div>
              <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                <p className="text-[12px] text-ink-3">
                  {b.lastPayout ? `Last paid ${formatINR(b.lastPayout.amount)} on ${formatDateTime(b.lastPayout.at)}` : "No payouts yet"}
                </p>
                <button
                  onClick={() => setPaying(b)}
                  disabled={b.owed - b.awaitingApproval <= 0}
                  className="inline-flex items-center gap-2 rounded-full bg-midnight px-4 py-2 text-[13px] font-semibold text-champagne-light hover:bg-midnight-2 disabled:opacity-40"
                >
                  <Landmark className="h-4 w-4" /> Record payout
                </button>
              </div>
            </Panel>
          ))}
        </div>
      )}

      <Panel title="Payout history" bodyClassName="px-0 pb-2 md:px-0">
        <TableShell loading={history.loading && !history.data} empty={history.data && history.data.items.length === 0 ? "No payouts recorded yet." : null}>
          <table className="w-full min-w-[720px]">
            <thead>
              <tr className="border-b border-hairline">
                <th className={th}>Recorded</th>
                <th className={th}>Astrologer</th>
                <th className={th}>Bank reference</th>
                <th className={th}>Note</th>
                <th className={th}>Status</th>
                <th className={`${th} text-right`}>Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {history.data?.items.map((p) => (
                <tr key={p.id}>
                  <td className={`${td} whitespace-nowrap`}>
                    {formatDateTime(p.createdAt)}
                    <span className="block text-[12px] text-ink-3">by {p.requestedBy}</span>
                  </td>
                  <td className={td}>{p.user?.name ?? "—"}</td>
                  <td className={`${td} font-mono text-[12px]`}>{p.reference ?? "—"}</td>
                  <td className={`${td} max-w-[260px] truncate`}>{p.reason}</td>
                  <td className={td}>
                    <Badge tone={p.status === "COMPLETED" ? "good" : p.status === "PENDING_APPROVAL" ? "waiting" : "bad"}>
                      {p.status === "COMPLETED" ? "Paid" : p.status === "PENDING_APPROVAL" ? "Awaiting approval" : p.status.toLowerCase()}
                    </Badge>
                  </td>
                  <td className={`${td} text-right font-semibold whitespace-nowrap text-ink tabular-nums`}>{formatINR(p.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableShell>
        {history.data && <Pagination page={history.data.page} pageSize={history.data.pageSize} total={history.data.total} onPage={setPage} />}
      </Panel>

      {paying && (
        <MoneyActionDialog
          type="ASTROLOGER_PAYOUT"
          title={`Pay ${paying.name}`}
          subtitle="Record a bank transfer you have already made"
          userId={paying.userId}
          max={Math.max(0, paying.owed - paying.awaitingApproval)}
          defaultAmount={Math.max(0, paying.owed - paying.awaitingApproval)}
          onClose={() => setPaying(null)}
          onDone={() => {
            load();
            history.reload();
          }}
        />
      )}
    </div>
  );
}
