"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Clock, Loader2, ShieldAlert, X, XCircle } from "lucide-react";
import { apiClient } from "@/lib/http/client";
import { cn } from "@/lib/cn";
import { formatINR } from "../lib/format";

/**
 * One dialog for every money action: refunds, wallet credits/debits and
 * astrologer payouts. The approval limit is a 24-hour total per client or order:
 * once a manager's own actions for the same client/order (plus this one) exceed
 * it, the request waits for a super admin; the dialog says so before and after.
 */

export type MoneyActionType =
  | "REFUND_BOOKING"
  | "REFUND_SHOP_ORDER"
  | "REFUND_WALLET_TOPUP"
  | "WALLET_CREDIT"
  | "WALLET_DEBIT"
  | "ASTROLOGER_PAYOUT";

export interface MoneyActionResult {
  id: string;
  status: "PENDING_APPROVAL" | "COMPLETED" | "REJECTED" | "FAILED";
  outcome: "DONE" | "PENDING_APPROVAL";
  amount: number;
  reference: string | null;
  error: string | null;
}

interface Rules {
  approvalLimit: number;
  actsWithoutApproval: boolean;
  canApprove?: boolean;
  /** Rupees this user already moved on their own authority for this client/order in the last 24h. */
  usedToday?: number;
}

const VERB: Record<MoneyActionType, string> = {
  REFUND_BOOKING: "Refund",
  REFUND_SHOP_ORDER: "Refund",
  REFUND_WALLET_TOPUP: "Refund",
  WALLET_CREDIT: "Credit wallet",
  WALLET_DEBIT: "Debit wallet",
  ASTROLOGER_PAYOUT: "Record payout",
};

const inputClass =
  "w-full rounded-xl border border-hairline bg-ivory px-3.5 py-2.5 text-[14px] text-ink outline-none transition focus:border-champagne focus:ring-2 focus:ring-champagne/20";

export function MoneyActionDialog({
  type,
  title,
  subtitle,
  targetId,
  userId,
  max,
  defaultAmount,
  note,
  onClose,
  onDone,
}: {
  type: MoneyActionType;
  title: string;
  subtitle?: string;
  targetId?: string;
  userId?: string;
  max?: number;
  defaultAmount?: number;
  note?: string;
  onClose: () => void;
  onDone?: (r: MoneyActionResult) => void;
}) {
  const [rules, setRules] = useState<Rules | null>(null);
  const [amount, setAmount] = useState(defaultAmount ? String(defaultAmount) : "");
  const [reason, setReason] = useState("");
  const [reference, setReference] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<MoneyActionResult | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    const q = new URLSearchParams();
    if (targetId) q.set("targetId", targetId);
    if (userId) q.set("userId", userId);
    const qs = q.toString();
    apiClient
      .get<Rules>(`/admin/money/rules${qs ? `?${qs}` : ""}`)
      .then(setRules)
      .catch(() => setRules(null));
  }, [targetId, userId]);

  const value = Number(amount);
  const needsReference = type === "ASTROLOGER_PAYOUT";
  const usedToday = rules?.usedToday ?? 0;
  const scope = !targetId ? "client" : type === "REFUND_BOOKING" ? "booking" : type === "REFUND_WALLET_TOPUP" ? "top-up" : "order";
  const willNeedApproval = !!rules && !rules.actsWithoutApproval && value + usedToday > rules.approvalLimit;
  const valid =
    value > 0 && (max === undefined || value <= max + 0.001) && reason.trim().length >= 3 && (!needsReference || reference.trim().length > 0);

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      const r = await apiClient.post<MoneyActionResult>("/admin/money", {
        type,
        amount: value,
        reason: reason.trim(),
        ...(targetId && { targetId }),
        ...(userId && { userId }),
        ...(needsReference && { reference: reference.trim() }),
      });
      setResult(r);
      onDone?.(r);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not complete this");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-midnight/50 backdrop-blur-[2px] sm:items-center sm:p-6" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[92vh] w-full overflow-y-auto rounded-t-2xl border border-hairline bg-ivory shadow-[0_30px_80px_-20px_rgba(11,18,51,0.5)] sm:max-w-md sm:rounded-2xl"
      >
        <div className="flex items-start justify-between border-b border-hairline px-6 py-4">
          <div>
            <h2 className="font-playfair text-xl font-semibold text-ink">{title}</h2>
            {subtitle && <p className="text-[13px] text-ink-3">{subtitle}</p>}
          </div>
          <button onClick={onClose} aria-label="Close" className="rounded-lg p-2 text-ink-3 hover:bg-parchment hover:text-ink">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-5 px-6 py-5">
          {result ? (
            <Outcome r={result} onClose={onClose} />
          ) : (
            <>
              {note && <p className="rounded-xl border border-hairline bg-parchment/60 px-4 py-3 text-[13px] text-ink-2">{note}</p>}
              <label className="block space-y-1.5">
                <span className="block text-[13px] font-medium text-ink-2">Amount (₹)</span>
                <input type="number" min={0} step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className={inputClass} autoFocus />
                {max !== undefined && (
                  <span className="flex justify-between text-[12px] text-ink-3">
                    <span>Up to {formatINR(max)}</span>
                    <button type="button" onClick={() => setAmount(String(max))} className="text-bronze hover:text-ink">
                      Use full amount
                    </button>
                  </span>
                )}
              </label>
              {needsReference && (
                <label className="block space-y-1.5">
                  <span className="block text-[13px] font-medium text-ink-2">Bank transfer reference (UTR)</span>
                  <input value={reference} onChange={(e) => setReference(e.target.value)} className={inputClass} />
                </label>
              )}
              <label className="block space-y-1.5">
                <span className="block text-[13px] font-medium text-ink-2">Reason (kept on record)</span>
                <textarea rows={2} value={reason} onChange={(e) => setReason(e.target.value)} className={cn(inputClass, "resize-none")} />
              </label>

              {rules && !rules.actsWithoutApproval && usedToday > 0 && (
                <p className="text-[12px] text-ink-3">
                  {formatINR(usedToday)} already moved for this {scope} in the last 24 hours — anything above{" "}
                  {formatINR(rules.approvalLimit)} in total goes to a Super Admin.
                </p>
              )}
              {willNeedApproval && (
                <p className="flex gap-2 rounded-xl border border-champagne/40 bg-champagne/10 px-4 py-3 text-[13px] text-ink-2">
                  <Clock className="mt-0.5 h-4 w-4 shrink-0 text-bronze" />
                  {usedToday > 0 ? "Together with earlier amounts, this is above" : "Above"} {formatINR(rules!.approvalLimit)} — this will wait for a
                  Super Admin to approve before any money moves.
                </p>
              )}
              {error && <p className="text-[13px] text-garnet">{error}</p>}

              <div className="flex justify-end gap-3">
                <button onClick={onClose} className="rounded-full border border-hairline bg-ivory px-4 py-2 text-[13px] font-medium text-ink-2 hover:border-champagne">
                  Cancel
                </button>
                <button
                  onClick={submit}
                  disabled={!valid || busy}
                  className="inline-flex items-center gap-2 rounded-full bg-midnight px-5 py-2 text-[13px] font-semibold text-champagne-light hover:bg-midnight-2 disabled:opacity-40"
                >
                  {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                  {willNeedApproval ? "Request approval" : `${VERB[type]}${value > 0 ? ` ${formatINR(value)}` : ""}`}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Outcome({ r, onClose }: { r: MoneyActionResult; onClose: () => void }) {
  const view =
    r.status === "COMPLETED"
      ? { icon: CheckCircle2, tone: "text-emerald-deep", text: `Done — ${formatINR(r.amount)}.${r.reference ? ` Reference ${r.reference}.` : ""}` }
      : r.status === "PENDING_APPROVAL"
        ? { icon: Clock, tone: "text-bronze", text: `Sent for approval. A Super Admin will approve or reject it under Treasury → Money Requests.` }
        : r.status === "FAILED"
          ? { icon: XCircle, tone: "text-garnet", text: `It didn't go through: ${r.error ?? "unknown error"}. Nothing was charged or credited.` }
          : { icon: ShieldAlert, tone: "text-garnet", text: "Rejected." };
  const Icon = view.icon;
  return (
    <div className="space-y-5">
      <p className={cn("flex gap-3 text-[14px]", view.tone)}>
        <Icon className="mt-0.5 h-5 w-5 shrink-0" /> <span className="text-ink-2">{view.text}</span>
      </p>
      <div className="flex justify-end">
        <button onClick={onClose} className="rounded-full bg-midnight px-5 py-2 text-[13px] font-semibold text-champagne-light hover:bg-midnight-2">
          Done
        </button>
      </div>
    </div>
  );
}
