"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader, Panel } from "@/features/admin/components/primitives";
import { Pagination, SearchBox, TableShell, td, th } from "@/features/admin/components/records";
import { useAdminList } from "@/features/admin/hooks/useAdminList";
import { calendarParts, formatINR } from "@/features/admin/lib/format";

interface ClientRow {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  signedUpWith: string | null;
  joinedAt: string;
  walletBalance: number;
  consultations: number;
  shopOrders: number;
  bookings: number;
  bookingSpend: number;
}

export default function ClientsPage() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const { data, loading } = useAdminList<{ items: ClientRow[]; total: number; page: number; pageSize: number }>("/admin/clients", { q, page });

  return (
    <div className="mx-auto max-w-[1320px] space-y-8 px-5 py-8 md:px-10 md:py-12">
      <PageHeader eyebrow="Clientele" title="Clients" description="Everyone who has an account with Time Space & Planets, newest first." />

      <Panel
        title={data ? `${data.total} ${data.total === 1 ? "client" : "clients"}` : "Clients"}
        action={
          <SearchBox
            value={q}
            onChange={(v) => {
              setQ(v);
              setPage(1);
            }}
            placeholder="Name, email or phone"
          />
        }
        bodyClassName="px-0 pb-0 md:px-0"
      >
        <TableShell loading={loading && !data} empty={data && data.items.length === 0 ? (q ? "No client matches that search." : "No clients yet.") : null}>
          <table className="w-full min-w-[860px]">
            <thead>
              <tr className="border-b border-hairline">
                <th className={th}>Client</th>
                <th className={th}>Phone</th>
                <th className={th}>Joined</th>
                <th className={`${th} text-right`}>Bookings</th>
                <th className={`${th} text-right`}>Consultations</th>
                <th className={`${th} text-right`}>Shop orders</th>
                <th className={`${th} text-right`}>Wallet</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {data?.items.map((c) => (
                <tr key={c.id} onClick={() => router.push(`/admin/clients/${c.id}`)} className="cursor-pointer transition-colors hover:bg-parchment/60">
                  <td className={td}>
                    <p className="font-medium text-ink">{c.name || "—"}</p>
                    <p className="text-[12px] text-ink-3">{c.email || (c.signedUpWith === "PHONE" ? "Signed up with phone" : "—")}</p>
                  </td>
                  <td className={`${td} tabular-nums`}>{c.phone || "—"}</td>
                  <td className={`${td} whitespace-nowrap`}>{calendarParts(c.joinedAt.slice(0, 10)).full}</td>
                  <td className={`${td} text-right tabular-nums`}>
                    {c.bookings}
                    {c.bookingSpend > 0 && <span className="block text-[12px] text-ink-3">{formatINR(c.bookingSpend)}</span>}
                  </td>
                  <td className={`${td} text-right tabular-nums`}>{c.consultations}</td>
                  <td className={`${td} text-right tabular-nums`}>{c.shopOrders}</td>
                  <td className={`${td} text-right font-medium text-ink tabular-nums`}>{formatINR(c.walletBalance)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableShell>
        {data && <Pagination page={data.page} pageSize={data.pageSize} total={data.total} onPage={setPage} />}
      </Panel>
    </div>
  );
}
