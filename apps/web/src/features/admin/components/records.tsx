"use client";

import { useEffect, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, Loader2, Search, X } from "lucide-react";
import { cn } from "@/lib/cn";

/** Shared pieces for the admin record pages (clients, payments, bookings, orders, consultations). */

export function SearchBox({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  // Debounce so typing doesn't fire a request per keystroke.
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);
  useEffect(() => {
    const t = setTimeout(() => draft !== value && onChange(draft), 300);
    return () => clearTimeout(t);
  }, [draft, value, onChange]);
  return (
    <label className="relative block w-full sm:max-w-sm">
      <Search className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-ink-3" />
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-hairline bg-ivory py-2.5 pr-3.5 pl-10 text-[14px] text-ink outline-none focus:border-champagne focus:ring-2 focus:ring-champagne/20"
      />
    </label>
  );
}

export function FilterTabs<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string; count?: number }[];
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-[12px] font-medium transition",
            value === o.value ? "border-midnight bg-midnight text-champagne-light" : "border-hairline bg-ivory text-ink-2 hover:border-champagne",
          )}
        >
          {o.label}
          {o.count !== undefined && (
            <span className={cn("rounded-full px-1.5 text-[11px] tabular-nums", value === o.value ? "bg-white/10" : "bg-parchment")}>{o.count}</span>
          )}
        </button>
      ))}
    </div>
  );
}

export function Pagination({
  page,
  pageSize,
  total,
  onPage,
}: {
  page: number;
  pageSize: number;
  total: number;
  onPage: (p: number) => void;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (total === 0) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  return (
    <div className="flex items-center justify-between gap-4 px-6 py-4 text-[13px] text-ink-3 md:px-7">
      <span className="tabular-nums">
        {from}–{to} of {total}
      </span>
      <div className="flex gap-1.5">
        <button
          onClick={() => onPage(page - 1)}
          disabled={page <= 1}
          aria-label="Previous page"
          className="rounded-lg border border-hairline bg-ivory p-2 text-ink-2 transition hover:border-champagne disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          onClick={() => onPage(page + 1)}
          disabled={page >= pages}
          aria-label="Next page"
          className="rounded-lg border border-hairline bg-ivory p-2 text-ink-2 transition hover:border-champagne disabled:opacity-40"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

const TONES = {
  good: "bg-emerald-deep/10 text-emerald-deep",
  waiting: "bg-champagne/15 text-bronze",
  bad: "bg-garnet/10 text-garnet",
  neutral: "bg-parchment text-ink-2",
  info: "bg-regal/10 text-regal",
} as const;

export function Badge({ tone, children }: { tone: keyof typeof TONES; children: ReactNode }) {
  return <span className={cn("inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-medium", TONES[tone])}>{children}</span>;
}

/** One place that decides how every status in the admin reads and looks. */
export const STATUS_BADGE: Record<string, { label: string; tone: keyof typeof TONES }> = {
  // payments
  PAID: { label: "Paid", tone: "good" },
  PENDING: { label: "Pending", tone: "waiting" },
  FAILED: { label: "Failed", tone: "bad" },
  REFUNDED: { label: "Refunded", tone: "neutral" },
  CANCELLED: { label: "Cancelled", tone: "neutral" },
  // bookings
  PENDING_PAYMENT: { label: "Unpaid", tone: "waiting" },
  CONFIRMED: { label: "Confirmed", tone: "good" },
  COMPLETED: { label: "Completed", tone: "neutral" },
  // shop
  PROCESSING: { label: "Packing", tone: "info" },
  SHIPPED: { label: "Shipped", tone: "info" },
  DELIVERED: { label: "Delivered", tone: "good" },
  // consultations
  ACTIVE: { label: "In progress", tone: "good" },
};

export function StatusBadge({ status }: { status: string }) {
  const s = STATUS_BADGE[status] ?? { label: status, tone: "neutral" as const };
  return <Badge tone={s.tone}>{s.label}</Badge>;
}

export function Drawer({ title, subtitle, onClose, children }: { title: ReactNode; subtitle?: ReactNode; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-midnight/40 backdrop-blur-[2px]" onClick={onClose}>
      <aside
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className="flex h-full w-full max-w-xl flex-col bg-ivory shadow-[-30px_0_80px_-20px_rgba(11,18,51,0.45)]"
      >
        <div className="flex items-start justify-between gap-4 border-b border-hairline px-6 py-5">
          <div className="min-w-0">
            <h2 className="truncate font-playfair text-2xl font-semibold text-ink">{title}</h2>
            {subtitle && <p className="mt-1 text-[13px] text-ink-3">{subtitle}</p>}
          </div>
          <button onClick={onClose} aria-label="Close" className="rounded-lg p-2 text-ink-3 hover:bg-parchment hover:text-ink">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">{children}</div>
      </aside>
    </div>
  );
}

export function DetailList({ rows }: { rows: [string, ReactNode][] }) {
  return (
    <dl className="divide-y divide-hairline rounded-xl border border-hairline">
      {rows
        .filter(([, v]) => v !== null && v !== undefined && v !== "")
        .map(([k, v]) => (
          <div key={k} className="grid grid-cols-[140px_1fr] gap-4 px-4 py-3 text-[14px]">
            <dt className="text-ink-3">{k}</dt>
            <dd className="min-w-0 break-words text-ink">{v}</dd>
          </div>
        ))}
    </dl>
  );
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return <h3 className="font-cinzel text-[11px] font-semibold uppercase tracking-[0.22em] text-bronze">{children}</h3>;
}

export function TableShell({ loading, empty, children }: { loading: boolean; empty: ReactNode | null; children: ReactNode }) {
  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-champagne" />
      </div>
    );
  }
  if (empty) return <p className="px-6 py-14 text-center text-[14px] text-ink-3 md:px-7">{empty}</p>;
  return <div className="overflow-x-auto">{children}</div>;
}

export const th = "px-3 py-3 text-left text-[12px] font-medium text-ink-3 first:pl-6 last:pr-6 md:first:pl-7 md:last:pr-7";
export const td = "px-3 py-3.5 text-[14px] text-ink-2 first:pl-6 last:pr-6 md:first:pl-7 md:last:pr-7";
