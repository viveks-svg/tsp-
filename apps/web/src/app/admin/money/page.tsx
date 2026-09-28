"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Check, Loader2, X } from "lucide-react";
import { apiClient } from "@/lib/http/client";
import { PageHeader, Panel } from "@/features/admin/components/primitives";
import { Badge, FilterTabs, Pagination, TableShell, td, th } from "@/features/admin/components/records";
import { useAdminList } from "@/features/admin/hooks/useAdminList";
import { formatDateTime, formatINR } from "@/features/admin/lib/format";
import { MONEY_TYPE_LABEL } from "@/features/admin/lib/money";

type Status = "PENDING_APPROVAL" | "ALL" | "COMPLETED" | "FAILED" | "REJECTED";

interface MoneyAction {
  id: string;
  type: string;
  status: "PENDING_APPROVAL" | "COMPLETED" | "REJECTED" | "FAILED";
  amount: number;
  reason: string;
  targetId: string | null;
  reference: string | null;
  error: string | null;
  user: { id: string; name: string | null; email: string | null; role: string } | null;
  requestedBy: string;
  reviewedBy: string | null;
  reviewNote: string | null;
  createdAt: string;
  reviewedAt: string | null;
}


const STATUS_VIEW = {
  PENDING_APPROVAL: { label: "Awaiting approval", tone: "waiting" },
  COMPLETED: { label: "Done", tone: "good" },
  REJECTED: { label: "Rejected", tone: "neutral" },
  FAILED: { label: "Failed", tone: "bad" },
} as const;

export default function MoneyRequestsPage() {
  const [status, setStatus] = useState<Status>("PENDING_APPROVAL");
  const [page, setPage] = useState(1);
  const [canApprove, setCanApprove] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const { data, loading, reload } = useAdminList<{
    items: MoneyAction[];
    total: number;
    pendingApproval: number;
    approvalLimit: number;
    page: number;
    pageSize: number;
  }>("/admin/money", { status, page });

  useEffect(() => {
    apiClient
      .get<{ canApprove: boolean }>("/admin/money/rules")
      .then((r) => setCanApprove(r.canApprove))
      .catch(() => {});
  }, []);

  const review = async (a: MoneyAction, decision: "approve" | "reject") => {
    let note: string | undefined;
    if (decision === "reject") {
      const answer = prompt("Why is this rejected? (kept on record)");
      if (answer === null) return; // cancelled
      note = answer.trim() || undefined;
    } else if (!confirm(`Approve ${MONEY_TYPE_LABEL[a.type].toLowerCase()} of ${formatINR(a.amount)}? Money moves immediately.`)) {
      return;
    }
    setBusy(a.id);
    try {
      const r = await apiClient.post<MoneyAction>(`/admin/money/${a.id}/${decision}`, note ? { note } : {});
      if (r.status === "FAILED") toast.error(`It didn't go through: ${r.error}`);
      else toast.success(decision === "approve" ? "Approved and carried out." : "Rejected.");
      reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not update");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="mx-auto max-w-[1320px] space-y-8 px-5 py-8 md:px-10 md:py-12">
      <PageHeader
        eyebrow="Treasury"
        title="Money requests"
        description={
          data
            ? `Refunds, wallet adjustments and payouts. Managers act directly up to ${formatINR(data.approvalLimit)} in total per client or order within 24 hours; above that a Super Admin approves here.`
            : "Refunds, wallet adjustments and payouts."
        }
      />

      <FilterTabs
        value={status}
        onChange={(v) => {
          setStatus(v);
          setPage(1);
        }}
        options={[
          { value: "PENDING_APPROVAL", label: "Awaiting approval", count: data?.pendingApproval },
          { value: "COMPLETED", label: "Done" },
          { value: "FAILED", label: "Failed" },
          { value: "REJECTED", label: "Rejected" },
          { value: "ALL", label: "All" },
        ]}
      />

      <Panel bodyClassName="px-0 pb-0 pt-0 md:px-0">
        <TableShell
          loading={loading && !data}
          empty={data && data.items.length === 0 ? (status === "PENDING_APPROVAL" ? "Nothing is waiting for approval." : "Nothing here yet.") : null}
        >
          <table className="w-full min-w-[980px]">
            <thead>
              <tr className="border-b border-hairline">
                <th className={th}>Requested</th>
                <th className={th}>What</th>
                <th className={th}>For</th>
                <th className={th}>Reason</th>
                <th className={th}>Status</th>
                <th className={`${th} text-right`}>Amount</th>
                {status === "PENDING_APPROVAL" && canApprove && <th className={`${th} text-right`}>Decision</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {data?.items.map((a) => {
                const s = STATUS_VIEW[a.status];
                return (
                  <tr key={a.id}>
                    <td className={`${td} whitespace-nowrap`}>
                      {formatDateTime(a.createdAt)}
                      <span className="block text-[12px] text-ink-3">by {a.requestedBy}</span>
                    </td>
                    <td className={`${td} whitespace-nowrap text-ink`}>{MONEY_TYPE_LABEL[a.type] ?? a.type}</td>
                    <td className={td}>{a.user ? a.user.name || a.user.email : "—"}</td>
                    <td className={`${td} max-w-[280px]`}>
                      <span className="line-clamp-2">{a.reason}</span>
                      {a.reference && <span className="block font-mono text-[11px] text-ink-3">{a.reference}</span>}
                    </td>
                    <td className={td}>
                      <Badge tone={s.tone}>{s.label}</Badge>
                      {a.status === "FAILED" && a.error && <span className="mt-1 block max-w-[200px] text-[12px] text-garnet">{a.error}</span>}
                      {a.reviewedBy && a.status !== "PENDING_APPROVAL" && (
                        <span className="mt-1 block text-[12px] text-ink-3">
                          {a.status === "REJECTED" ? "Rejected" : "Approved"} by {a.reviewedBy}
                          {a.reviewNote && a.reviewNote !== "Within the requester's limit" ? ` — “${a.reviewNote}”` : ""}
                        </span>
                      )}
                    </td>
                    <td className={`${td} text-right font-semibold whitespace-nowrap text-ink tabular-nums`}>{formatINR(a.amount)}</td>
                    {status === "PENDING_APPROVAL" && canApprove && (
                      <td className={`${td} text-right whitespace-nowrap`}>
                        <button
                          onClick={() => review(a, "approve")}
                          disabled={!!busy}
                          className="mr-2 inline-flex items-center gap-1.5 rounded-full bg-midnight px-3.5 py-1.5 text-[12px] font-semibold text-champagne-light disabled:opacity-40"
                        >
                          {busy === a.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />} Approve
                        </button>
                        <button
                          onClick={() => review(a, "reject")}
                          disabled={!!busy}
                          className="inline-flex items-center gap-1.5 rounded-full border border-garnet/30 px-3.5 py-1.5 text-[12px] font-semibold text-garnet disabled:opacity-40"
                        >
                          <X className="h-3.5 w-3.5" /> Reject
                        </button>
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
    </div>
  );
}
