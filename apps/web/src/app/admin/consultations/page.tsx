"use client";

import { useState } from "react";
import Link from "next/link";
import { MessageSquare, Phone, Star } from "lucide-react";
import { PageHeader, Panel, StatTile } from "@/features/admin/components/primitives";
import { Badge, FilterTabs, Pagination, StatusBadge, TableShell, td, th } from "@/features/admin/components/records";
import { useAdminList } from "@/features/admin/hooks/useAdminList";
import { formatDateTime, formatINR } from "@/features/admin/lib/format";

type Tab = "consultations" | "reviews";
type Status = "ALL" | "PENDING" | "ACTIVE" | "COMPLETED" | "CANCELLED";
type Kind = "ALL" | "CHAT" | "CALL";

interface ConsultationRow {
  id: string;
  type: "CHAT" | "CALL";
  status: string;
  scheduledAt: string;
  durationMin: number | null;
  cost: number | null;
  lockedPricingPerMin: number;
  viaLiveQueue: boolean;
  user: { id: string; name: string | null; email: string | null };
  astrologerName: string | null;
  callSession: { durationSeconds: number | null; endReason: string | null } | null;
  review: { rating: number; review: string | null } | null;
}

interface ReviewRow {
  id: string;
  rating: number;
  review: string | null;
  createdAt: string;
  user: { id: string; name: string | null };
  astrologerName: string | null;
  consultation: { type: string };
}

export default function ConsultationsAdminPage() {
  const [tab, setTab] = useState<Tab>("consultations");
  return (
    <div className="mx-auto max-w-[1320px] space-y-8 px-5 py-8 md:px-10 md:py-12">
      <PageHeader
        eyebrow="Clientele"
        title="Consultations"
        description="Chat and call consultations with the astrologers, and what clients said afterwards. Conversations themselves stay private between client and astrologer."
      />
      <FilterTabs
        value={tab}
        onChange={setTab}
        options={[
          { value: "consultations", label: "Consultations" },
          { value: "reviews", label: "Reviews" },
        ]}
      />
      {tab === "consultations" ? <ConsultationsTab /> : <ReviewsTab />}
    </div>
  );
}

function ConsultationsTab() {
  const [status, setStatus] = useState<Status>("ALL");
  const [kind, setKind] = useState<Kind>("ALL");
  const [page, setPage] = useState(1);
  const { data, loading } = useAdminList<{
    items: ConsultationRow[];
    total: number;
    completed: { count: number; minutes: number; revenue: number };
    page: number;
    pageSize: number;
  }>("/admin/consultations", { status, type: kind, page });

  return (
    <>
      {data && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          <StatTile label="Completed consultations" value={data.completed.count} />
          <StatTile label="Minutes consulted" value={data.completed.minutes} />
          <StatTile label="Charged to clients" value={formatINR(data.completed.revenue)} detail="From wallets, completed consultations" />
        </div>
      )}
      <Panel bodyClassName="pt-6">
        <div className="flex flex-wrap gap-4">
          <FilterTabs
            value={status}
            onChange={(v) => {
              setStatus(v);
              setPage(1);
            }}
            options={[
              { value: "ALL", label: "All" },
              { value: "PENDING", label: "Waiting" },
              { value: "ACTIVE", label: "In progress" },
              { value: "COMPLETED", label: "Completed" },
              { value: "CANCELLED", label: "Cancelled" },
            ]}
          />
          <FilterTabs
            value={kind}
            onChange={(v) => {
              setKind(v);
              setPage(1);
            }}
            options={[
              { value: "ALL", label: "Chat & call" },
              { value: "CHAT", label: "Chat" },
              { value: "CALL", label: "Call" },
            ]}
          />
        </div>
      </Panel>
      <Panel bodyClassName="px-0 pb-0 pt-0 md:px-0">
        <TableShell loading={loading && !data} empty={data && data.items.length === 0 ? "No consultations yet." : null}>
          <table className="w-full min-w-[860px]">
            <thead>
              <tr className="border-b border-hairline">
                <th className={th}>When</th>
                <th className={th}>Client</th>
                <th className={th}>Astrologer</th>
                <th className={th}>Kind</th>
                <th className={th}>Status</th>
                <th className={`${th} text-right`}>Length</th>
                <th className={`${th} text-right`}>Charged</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {data?.items.map((c) => (
                <tr key={c.id}>
                  <td className={`${td} whitespace-nowrap`}>{formatDateTime(c.scheduledAt)}</td>
                  <td className={td}>
                    <Link href={`/admin/clients/${c.user.id}`} className="font-medium text-ink hover:underline">
                      {c.user.name || c.user.email || "Client"}
                    </Link>
                  </td>
                  <td className={td}>{c.astrologerName || "—"}</td>
                  <td className={td}>
                    <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                      {c.type === "CALL" ? <Phone className="h-3.5 w-3.5 text-bronze" /> : <MessageSquare className="h-3.5 w-3.5 text-bronze" />}
                      {c.type === "CALL" ? "Call" : "Chat"}
                      {c.viaLiveQueue && <Badge tone="info">Live queue</Badge>}
                    </span>
                  </td>
                  <td className={td}>
                    <StatusBadge status={c.status} />
                  </td>
                  <td className={`${td} text-right tabular-nums`}>{c.durationMin ? `${c.durationMin} min` : "—"}</td>
                  <td className={`${td} text-right font-semibold whitespace-nowrap text-ink tabular-nums`}>
                    {c.cost != null ? formatINR(c.cost) : <span className="font-normal text-ink-3">{formatINR(c.lockedPricingPerMin)}/min</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableShell>
        {data && <Pagination page={data.page} pageSize={data.pageSize} total={data.total} onPage={setPage} />}
      </Panel>
    </>
  );
}

function ReviewsTab() {
  const [page, setPage] = useState(1);
  const { data, loading } = useAdminList<{ items: ReviewRow[]; total: number; averageRating: number | null; page: number; pageSize: number }>(
    "/admin/reviews",
    { page },
  );
  return (
    <Panel
      title={data ? `${data.total} review${data.total === 1 ? "" : "s"}` : "Reviews"}
      subtitle={data?.averageRating ? `Average ${data.averageRating.toFixed(1)} of 5` : undefined}
      bodyClassName="px-0 pb-0 md:px-0"
    >
      <TableShell loading={loading && !data} empty={data && data.items.length === 0 ? "No reviews yet. Clients can review a consultation once it ends." : null}>
        <ul className="divide-y divide-hairline">
          {data?.items.map((r) => (
            <li key={r.id} className="space-y-1.5 px-6 py-4 md:px-7">
              <div className="flex flex-wrap items-center gap-3">
                <span className="flex items-center gap-0.5 text-bronze" aria-label={`${r.rating} of 5`}>
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star key={i} className={i < Math.round(r.rating) ? "h-4 w-4 fill-current" : "h-4 w-4 text-hairline"} />
                  ))}
                </span>
                <Link href={`/admin/clients/${r.user.id}`} className="text-[14px] font-medium text-ink hover:underline">
                  {r.user.name || "Client"}
                </Link>
                <span className="text-[13px] text-ink-3">
                  on a {r.consultation.type === "CALL" ? "call" : "chat"} with {r.astrologerName || "the astrologer"} · {formatDateTime(r.createdAt)}
                </span>
              </div>
              {r.review && <p className="text-[14px] text-ink-2">“{r.review}”</p>}
            </li>
          ))}
        </ul>
      </TableShell>
      {data && <Pagination page={data.page} pageSize={data.pageSize} total={data.total} onPage={setPage} />}
    </Panel>
  );
}
