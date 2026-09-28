"use client";

import Link from "next/link";
import { Fragment, useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowRight, ChevronDown, Download, History, Loader2, ShieldAlert, X } from "lucide-react";
import { apiClient } from "@/lib/http/client";
import { cn } from "@/lib/cn";
import { STAFF_ROLE_LABEL } from "@/lib/constants/admin-permissions";
import { PageHeader, Panel, Skeleton } from "@/features/admin/components/primitives";
import { Badge, FilterTabs, Pagination, SearchBox } from "@/features/admin/components/records";
import { useAdminList } from "@/features/admin/hooks/useAdminList";
import { downloadCsv } from "@/features/admin/lib/download";

interface Change {
  field: string;
  from: unknown;
  to: unknown;
}

interface Entry {
  id: string;
  actorId: string | null;
  actorName: string;
  actorEmail: string | null;
  actorRole: string;
  action: string;
  area: string;
  summary: string;
  targetType: string | null;
  targetId: string | null;
  changes: Change[] | null;
  details: Record<string, unknown> | null;
  outcome: "SUCCESS" | "DENIED" | "FAILED";
  ipAddress: string | null;
  createdAt: string;
}

interface Actor {
  id: string;
  name: string;
  role: string;
}

const AREAS: Record<string, string> = {
  money: "Money",
  people: "People",
  growth: "Growth",
  schedule: "Hours",
  orders: "Shop",
  queue: "Live queue",
  settings: "Settings",
  security: "Security",
  other: "Other",
};

const ROLE_LABEL: Record<string, string> = { ...STAFF_ROLE_LABEL, ASTROLOGER: "Astrologer" };

/** Where to look at the thing an entry is about. */
const TARGET_HREF: Record<string, (id: string) => string> = {
  Blog: (id) => `/admin/blog/${id}`,
  Astrologer: () => "/admin/astrologers",
  StaffInvite: () => "/admin/team",
  User: () => "/admin/team",
  MoneyAction: () => "/admin/money",
  ShopOrder: () => "/admin/orders",
  Campaign: () => "/admin/campaigns",
  PromoEvent: () => "/admin/promos",
  NotificationBroadcast: () => "/admin/announcements",
};

const IST = "Asia/Kolkata";
const dayKey = (iso: string) => new Intl.DateTimeFormat("en-CA", { timeZone: IST }).format(new Date(iso));
const dayHeading = (iso: string) =>
  new Intl.DateTimeFormat("en-IN", { timeZone: IST, weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date(iso));
const timeOf = (iso: string) => new Intl.DateTimeFormat("en-IN", { timeZone: IST, hour: "numeric", minute: "2-digit" }).format(new Date(iso));

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("") || "?";

const show = (v: unknown) => {
  if (v === null || v === undefined || v === "") return <span className="text-ink-3">—</span>;
  if (typeof v === "boolean") return v ? "Yes" : "No";
  if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}T/.test(v)) {
    return new Intl.DateTimeFormat("en-IN", { timeZone: IST, dateStyle: "medium", timeStyle: "short" }).format(new Date(v));
  }
  if (typeof v === "object") return <code className="text-[12px]">{JSON.stringify(v)}</code>;
  return String(v);
};

const humanKey = (k: string) => k.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());

const selectClass =
  "rounded-xl border border-hairline bg-ivory px-3 py-2.5 text-[13px] text-ink outline-none focus:border-champagne focus:ring-2 focus:ring-champagne/20";

/**
 * Who did what, and when. Written by the server on every change in the admin
 * and astrologer panels; nobody can edit or delete it.
 */
export default function ActivityPage() {
  const [q, setQ] = useState("");
  const [actorId, setActorId] = useState("");
  const [area, setArea] = useState("");
  const [outcome, setOutcome] = useState<"ALL" | "DENIED" | "FAILED">("ALL");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [target, setTarget] = useState<{ id: string; label: string } | null>(null);
  const [page, setPage] = useState(1);
  const [actors, setActors] = useState<Actor[]>([]);
  const [open, setOpen] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const filters = { q, actorId, area, outcome, from, to, targetId: target?.id };
  const { data, loading, queryString } = useAdminList<{ items: Entry[]; total: number; page: number; pageSize: number }>("/admin/activity", {
    ...filters,
    page,
  });

  // Any filter change starts again from the first page.
  const key = JSON.stringify(filters);
  useEffect(() => setPage(1), [key]);

  useEffect(() => {
    apiClient.get<Actor[]>("/admin/activity/actors").then(setActors).catch(() => {});
  }, []);

  const onSearch = useCallback((v: string) => setQ(v), []);

  const exportCsv = async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams(queryString);
      params.delete("page");
      await downloadCsv(`/admin/activity/export?${params}`, `tsp-activity-${new Date().toISOString().slice(0, 10)}.csv`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not download");
    } finally {
      setExporting(false);
    }
  };

  const items = data?.items ?? [];

  return (
    <div className="mx-auto max-w-[1100px] space-y-8 px-5 py-8 md:px-10 md:py-12">
      <PageHeader
        eyebrow="The House"
        title="Activity log"
        description="Every change made in the admin and astrologer panels, every staff sign-in, and anyone stopped at a door their role doesn’t open. Entries can’t be edited or deleted."
        actions={
          <button
            onClick={exportCsv}
            disabled={exporting}
            className="inline-flex items-center gap-2 rounded-full border border-hairline bg-ivory px-5 py-2.5 text-[13px] font-semibold text-ink-2 transition hover:border-champagne disabled:opacity-40"
          >
            {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Download CSV
          </button>
        }
      />

      <div className="space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <SearchBox value={q} onChange={onSearch} placeholder="Search what happened, or who" />
          <div className="flex flex-wrap items-center gap-2">
            <select aria-label="Who" value={actorId} onChange={(e) => setActorId(e.target.value)} className={selectClass}>
              <option value="">Everyone</option>
              {actors.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} · {ROLE_LABEL[a.role] ?? a.role}
                </option>
              ))}
            </select>
            <select aria-label="Area" value={area} onChange={(e) => setArea(e.target.value)} className={selectClass}>
              <option value="">All areas</option>
              {Object.entries(AREAS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
            <input type="date" aria-label="From" value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} className={selectClass} />
            <span className="text-[13px] text-ink-3">to</span>
            <input type="date" aria-label="To" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} className={selectClass} />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <FilterTabs
            value={outcome}
            onChange={setOutcome}
            options={[
              { value: "ALL", label: "Everything" },
              { value: "DENIED", label: "Blocked" },
              { value: "FAILED", label: "Failed" },
            ]}
          />
          {target && (
            <span className="inline-flex items-center gap-2 rounded-full border border-champagne bg-champagne/10 px-3.5 py-1.5 text-[12px] text-ink">
              <History className="h-3.5 w-3.5 text-bronze" /> History of {target.label}
              <button onClick={() => setTarget(null)} aria-label="Show everything" className="text-ink-3 hover:text-ink">
                <X className="h-3.5 w-3.5" />
              </button>
            </span>
          )}
        </div>
      </div>

      <Panel bodyClassName="px-0 pb-0 pt-0 md:px-0">
        {!data ? (
          <div className="space-y-3 p-6">
            {Array.from({ length: 6 }, (_, i) => (
              <Skeleton key={i} className="h-14" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <p className="px-6 py-16 text-center text-sm text-ink-3">Nothing matches these filters.</p>
        ) : (
          <ol className={cn("transition-opacity", loading && "opacity-60")}>
            {items.map((e, i) => {
              const newDay = i === 0 || dayKey(items[i - 1].createdAt) !== dayKey(e.createdAt);
              const expanded = open === e.id;
              const hasMore = !!(e.changes?.length || (e.details && Object.keys(e.details).length) || e.ipAddress || e.targetId);
              return (
                <Fragment key={e.id}>
                  {newDay && (
                    <li className="border-b border-hairline bg-parchment/60 px-6 py-2.5 md:px-7">
                      <p className="font-cinzel text-[11px] font-semibold uppercase tracking-[0.2em] text-bronze">{dayHeading(e.createdAt)}</p>
                    </li>
                  )}
                  <li className="border-b border-hairline last:border-0">
                    <button
                      onClick={() => hasMore && setOpen(expanded ? null : e.id)}
                      aria-expanded={hasMore ? expanded : undefined}
                      className={cn("flex w-full items-start gap-4 px-6 py-4 text-left md:px-7", hasMore && "hover:bg-parchment/40")}
                    >
                      <span className="w-16 shrink-0 pt-2 text-[12px] text-ink-3 tabular-nums">{timeOf(e.createdAt)}</span>
                      <span
                        className={cn(
                          "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[12px] font-semibold",
                          e.outcome === "SUCCESS" ? "bg-midnight text-champagne-light" : "bg-garnet/10 text-garnet",
                        )}
                        aria-hidden
                      >
                        {e.outcome === "SUCCESS" ? initials(e.actorName) : <ShieldAlert className="h-4 w-4" />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[14px] leading-snug text-ink">
                          <span className="font-semibold">{e.actorName}</span> <span className="text-ink-2">{lowerFirst(e.summary)}</span>
                        </span>
                        <span className="mt-1.5 flex flex-wrap items-center gap-2 text-[12px] text-ink-3">
                          <span>{ROLE_LABEL[e.actorRole] ?? e.actorRole}</span>
                          <span aria-hidden>·</span>
                          <span>{AREAS[e.area] ?? e.area}</span>
                          {e.outcome === "DENIED" && <Badge tone="bad">Blocked</Badge>}
                          {e.outcome === "FAILED" && <Badge tone="bad">Failed</Badge>}
                          {!!e.changes?.length && <Badge tone="info">{e.changes.length} change{e.changes.length === 1 ? "" : "s"}</Badge>}
                        </span>
                      </span>
                      {hasMore && <ChevronDown className={cn("mt-2 h-4 w-4 shrink-0 text-ink-3 transition-transform", expanded && "rotate-180")} />}
                    </button>

                    {expanded && (
                      <div className="space-y-4 px-6 pb-5 md:px-7 md:pl-[152px]">
                        {!!e.changes?.length && (
                          <div className="overflow-x-auto rounded-xl border border-hairline">
                            <table className="w-full min-w-[420px] text-[13px]">
                              <thead>
                                <tr className="border-b border-hairline bg-parchment/50 text-left text-[12px] text-ink-3">
                                  <th className="px-4 py-2 font-medium">What</th>
                                  <th className="px-4 py-2 font-medium">Was</th>
                                  <th className="w-6" aria-hidden />
                                  <th className="px-4 py-2 font-medium">Now</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-hairline">
                                {e.changes.map((c) => (
                                  <tr key={c.field}>
                                    <td className="px-4 py-2.5 font-medium text-ink">{c.field}</td>
                                    <td className="px-4 py-2.5 text-ink-3 line-through decoration-ink-3/40">{show(c.from)}</td>
                                    <td aria-hidden>
                                      <ArrowRight className="h-3.5 w-3.5 text-champagne" />
                                    </td>
                                    <td className="px-4 py-2.5 text-ink">{show(c.to)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                        {e.details && Object.keys(e.details).length > 0 && (
                          <dl className="grid grid-cols-1 gap-x-6 gap-y-2 rounded-xl border border-hairline bg-parchment/30 px-4 py-3 text-[13px] sm:grid-cols-[180px_1fr]">
                            {Object.entries(e.details).map(([k, v]) => (
                              <Fragment key={k}>
                                <dt className="text-ink-3">{humanKey(k)}</dt>
                                <dd className="break-words text-ink-2">{show(v)}</dd>
                              </Fragment>
                            ))}
                          </dl>
                        )}
                        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[12px] text-ink-3">
                          {e.actorEmail && <span>{e.actorEmail}</span>}
                          {e.ipAddress && <span>IP {e.ipAddress}</span>}
                          {e.targetId && (
                            <button
                              onClick={() => setTarget({ id: e.targetId!, label: targetLabel(e) })}
                              className="inline-flex items-center gap-1 font-medium text-bronze hover:text-ink"
                            >
                              <History className="h-3.5 w-3.5" /> Full history of this item
                            </button>
                          )}
                          {e.targetType && e.targetId && TARGET_HREF[e.targetType] && (
                            <Link href={TARGET_HREF[e.targetType](e.targetId)} className="font-medium text-bronze hover:text-ink">
                              Open
                            </Link>
                          )}
                        </div>
                      </div>
                    )}
                  </li>
                </Fragment>
              );
            })}
          </ol>
        )}
        {data && <Pagination page={data.page} pageSize={data.pageSize} total={data.total} onPage={setPage} />}
      </Panel>
    </div>
  );
}

const lowerFirst = (s: string) => (/^[A-Z][a-z]/.test(s) ? s.charAt(0).toLowerCase() + s.slice(1) : s);

const TARGET_NAME: Record<string, string> = {
  Blog: "this article",
  Astrologer: "this astrologer",
  StaffInvite: "this invite",
  User: "this person",
  MoneyAction: "this money request",
  ShopOrder: "this shop order",
  Campaign: "this campaign",
  PromoEvent: "this popup",
  NotificationBroadcast: "this announcement",
  QueueEntry: "this queue entry",
  Consultation: "this consultation",
};

const targetLabel = (e: Entry) => TARGET_NAME[e.targetType ?? ""] ?? "this item";
