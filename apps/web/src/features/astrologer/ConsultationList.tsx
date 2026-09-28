"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, MessageSquare, Phone, Search } from "lucide-react";
import { apiClient } from "@/lib/http/client";
import { ENDPOINTS } from "@/lib/constants/http/endpoints";
import { ROUTES } from "@/lib/constants/routes";
import { useCallSocket } from "@/features/call/hooks/useCallSocket";
import { cn } from "@/lib/cn";
import { formatDateTime, formatINR } from "@/features/admin/lib/format";

/**
 * The astrologer's own consultations (GET /consultations returns only theirs),
 * with the actions to accept a call or open a chat.
 */

interface Consultation {
  id: string;
  status: "PENDING" | "ACTIVE" | "COMPLETED" | "CANCELLED";
  type?: "CHAT" | "CALL";
  scheduledAt: string;
  lockedPricingPerMin: string | number;
  durationMin?: number | null;
  cost?: string | number | null;
  user: { name: string | null; email: string | null };
}

const STATUS: Record<Consultation["status"], { label: string; className: string }> = {
  PENDING: { label: "Waiting for you", className: "bg-champagne/15 text-bronze" },
  ACTIVE: { label: "In progress", className: "bg-emerald-deep/10 text-emerald-deep" },
  COMPLETED: { label: "Completed", className: "bg-parchment text-ink-2" },
  CANCELLED: { label: "Cancelled", className: "bg-garnet/10 text-garnet" },
};
const ORDER = { PENDING: 0, ACTIVE: 1, COMPLETED: 2, CANCELLED: 3 } as const;

export function ConsultationList({ limit, withFilters = false }: { limit?: number; withFilters?: boolean }) {
  const router = useRouter();
  const { acceptCall } = useCallSocket();
  const [items, setItems] = useState<Consultation[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"ALL" | Consultation["status"]>("ALL");

  const load = useCallback(async () => {
    try {
      setItems(await apiClient.get<Consultation[]>(ENDPOINTS.CONSULTATIONS.LIST));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not load consultations");
      setItems((prev) => prev ?? []);
    }
  }, []);

  useEffect(() => {
    void load();
    const t = setInterval(load, 15_000);
    return () => clearInterval(t);
  }, [load]);

  const open = async (c: Consultation) => {
    setBusy(c.id);
    try {
      if (c.type === "CALL") {
        if (c.status === "PENDING") acceptCall(c.id);
        router.push(`/astrologer/consultations/${c.id}/call`);
      } else {
        if (c.status === "PENDING") await apiClient.post(ENDPOINTS.CONSULTATIONS.START(c.id));
        router.push(`${ROUTES.CONSULTATIONS}/${c.id}/chat`);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not open the consultation");
      setBusy(null);
    }
  };

  if (!items) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-champagne" />
      </div>
    );
  }

  const visible = [...items]
    .filter((c) => status === "ALL" || c.status === status)
    .filter((c) => (c.user.name || c.user.email || "").toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => ORDER[a.status] - ORDER[b.status] || +new Date(b.scheduledAt) - +new Date(a.scheduledAt))
    .slice(0, limit);

  return (
    <div className="space-y-4">
      {withFilters && (
        <div className="flex flex-col gap-3 sm:flex-row">
          <label className="relative flex-1">
            <Search className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-ink-3" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by client name"
              className="w-full rounded-xl border border-hairline bg-ivory py-2.5 pr-3.5 pl-10 text-[14px] text-ink outline-none focus:border-champagne focus:ring-2 focus:ring-champagne/20"
            />
          </label>
          <div className="flex flex-wrap gap-1.5">
            {(["ALL", "PENDING", "ACTIVE", "COMPLETED", "CANCELLED"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                className={cn(
                  "rounded-full border px-3.5 py-2 text-[12px] font-medium transition",
                  status === s ? "border-midnight bg-midnight text-champagne-light" : "border-hairline bg-ivory text-ink-2 hover:border-champagne",
                )}
              >
                {s === "ALL" ? "All" : STATUS[s].label}
              </button>
            ))}
          </div>
        </div>
      )}

      {visible.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-hairline bg-ivory px-6 py-14 text-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-full border border-hairline bg-parchment text-champagne">
            <MessageSquare className="h-5 w-5" />
          </span>
          <p className="text-sm text-ink-3">
            {items.length === 0 ? "No consultations yet. When a client consults you, they appear here." : "Nothing matches."}
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-hairline overflow-hidden rounded-2xl border border-hairline bg-ivory">
          {visible.map((c) => {
            const Icon = c.type === "CALL" ? Phone : MessageSquare;
            const actionable = c.status === "PENDING" || c.status === "ACTIVE";
            return (
              <li key={c.id} className="flex items-center gap-4 px-5 py-4 md:px-6">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-hairline bg-parchment text-bronze">
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-ink">{c.user.name || c.user.email || "Client"}</p>
                  <p className="truncate text-[13px] text-ink-3">
                    {c.type === "CALL" ? "Call" : "Chat"} · {formatDateTime(c.scheduledAt)}
                    {c.status === "COMPLETED" && c.cost != null && ` · ${formatINR(Number(c.cost))}`}
                    {c.status === "COMPLETED" && c.durationMin ? ` · ${c.durationMin} min` : ""}
                  </p>
                </div>
                {/* In the compact list the action button already says what state it is in. */}
                {(withFilters || !actionable) && (
                  <span className={cn("hidden shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium sm:inline", STATUS[c.status].className)}>
                    {STATUS[c.status].label}
                  </span>
                )}
                {actionable && (
                  <button
                    onClick={() => open(c)}
                    disabled={busy === c.id}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-midnight px-4 py-2 text-[12px] font-semibold text-champagne-light transition hover:bg-midnight-2 disabled:opacity-50"
                  >
                    {busy === c.id && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    {c.status === "PENDING" ? (c.type === "CALL" ? "Answer" : "Begin") : "Rejoin"}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
