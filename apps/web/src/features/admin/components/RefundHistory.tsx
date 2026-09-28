"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/http/client";
import { useAuth } from "@/providers/AuthProvider";
import { formatDateTime, formatINR } from "../lib/format";
import { Badge } from "./records";

export interface RefundRow {
  id: string;
  status: "PENDING_APPROVAL" | "COMPLETED" | "REJECTED" | "FAILED";
  amount: number;
  reason: string;
  reference: string | null;
  requestedBy: string;
  createdAt: string;
}

/**
 * Refunds (done, waiting, failed) already made against one booking, order or top-up.
 * Needs "payments.view"; without it nothing is fetched (the server would refuse
 * and log a blocked attempt), rows stay null and `allowed` is false.
 */
export function useRefunds(targetId: string | null | undefined, version = 0) {
  const { user } = useAuth();
  const allowed = !!user?.permissions?.includes("payments.view");
  const [rows, setRows] = useState<RefundRow[] | null>(null);
  useEffect(() => {
    if (!allowed || !targetId) {
      setRows(null);
      return;
    }
    apiClient
      .get<{ items: RefundRow[] }>(`/admin/money?targetId=${encodeURIComponent(targetId)}`)
      .then((r) => setRows(r.items))
      .catch(() => setRows([]));
  }, [allowed, targetId, version]);
  const committed = (rows ?? []).filter((r) => r.status === "COMPLETED" || r.status === "PENDING_APPROVAL").reduce((s, r) => s + r.amount, 0);
  /** True once the history has loaded, so `committed` can be trusted for a refund's maximum. */
  const ready = allowed && rows !== null;
  return { rows, committed, allowed, ready };
}

export function RefundHistory({ rows }: { rows: RefundRow[] | null }) {
  if (!rows || rows.length === 0) return null;
  return (
    <ul className="divide-y divide-hairline rounded-xl border border-hairline text-[13px]">
      {rows.map((r) => (
        <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
          <span className="text-ink-2">
            {formatINR(r.amount)} · {r.reason}
            <span className="block text-[12px] text-ink-3">
              {formatDateTime(r.createdAt)} by {r.requestedBy}
              {r.reference ? ` · ${r.reference}` : ""}
            </span>
          </span>
          <Badge tone={r.status === "COMPLETED" ? "good" : r.status === "PENDING_APPROVAL" ? "waiting" : "bad"}>
            {r.status === "COMPLETED" ? "Refunded" : r.status === "PENDING_APPROVAL" ? "Awaiting approval" : r.status === "FAILED" ? "Failed" : "Rejected"}
          </Badge>
        </li>
      ))}
    </ul>
  );
}
