"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Loader2, PackageCheck, Truck, XCircle, Box } from "lucide-react";
import { apiClient } from "@/lib/http/client";
import { cn } from "@/lib/cn";
import { PageHeader, Panel } from "@/features/admin/components/primitives";
import { DetailList, Drawer, FilterTabs, Pagination, SearchBox, SectionTitle, StatusBadge, TableShell, td, th } from "@/features/admin/components/records";
import { useAdminList } from "@/features/admin/hooks/useAdminList";
import { useAuth } from "@/providers/AuthProvider";
import { MoneyActionDialog } from "@/features/admin/components/MoneyActionDialog";
import { RefundHistory, useRefunds } from "@/features/admin/components/RefundHistory";

import { formatDateTime, formatINR } from "@/features/admin/lib/format";

type Filter = "TO_DISPATCH" | "ALL" | "PENDING" | "SHIPPED" | "DELIVERED" | "CANCELLED";

interface OrderRow {
  id: string;
  customerName: string;
  customerEmail: string;
  city: string;
  state: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  items: { productName: string; quantity: number }[];
}

interface OrderDetail extends OrderRow {
  customerPhone: string;
  shippingAddress: string;
  pincode: string;
  razorpayOrderId: string | null;
  paymentId: string | null;
  user: { id: string; name: string | null } | null;
  items: { id: string; productName: string; quantity: number; price: number }[];
  nextStatuses: string[];
}

const ACTIONS: Record<string, { label: string; icon: typeof Box; danger?: boolean }> = {
  PROCESSING: { label: "Start packing", icon: Box },
  SHIPPED: { label: "Mark shipped", icon: Truck },
  DELIVERED: { label: "Mark delivered", icon: PackageCheck },
  CANCELLED: { label: "Cancel order", icon: XCircle, danger: true },
};

const initialParam = (key: string) => (typeof window === "undefined" ? null : new URLSearchParams(window.location.search).get(key));

export default function OrdersPage() {
  const [filter, setFilter] = useState<Filter>(() => (initialParam("status") as Filter) || "TO_DISPATCH");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [openId, setOpenId] = useState<string | null>(() => initialParam("open"));
  const { data, loading, reload } = useAdminList<{ items: OrderRow[]; total: number; toDispatch: number; page: number; pageSize: number }>(
    "/admin/orders",
    { status: filter, q, page },
  );

  return (
    <div className="mx-auto max-w-[1320px] space-y-8 px-5 py-8 md:px-10 md:py-12">
      <PageHeader eyebrow="Treasury" title="Shop orders" description="Products bought from the TSP shop. Move each paid order through packing, shipping and delivery." />

      <Panel bodyClassName="pt-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <FilterTabs
            value={filter}
            onChange={(v) => {
              setFilter(v);
              setPage(1);
            }}
            options={[
              { value: "TO_DISPATCH", label: "To dispatch", count: data?.toDispatch },
              { value: "SHIPPED", label: "Shipped" },
              { value: "DELIVERED", label: "Delivered" },
              { value: "PENDING", label: "Unpaid" },
              { value: "CANCELLED", label: "Cancelled" },
              { value: "ALL", label: "All" },
            ]}
          />
          <SearchBox
            value={q}
            onChange={(v) => {
              setQ(v);
              setPage(1);
            }}
            placeholder="Customer, email, phone or order ID"
          />
        </div>
      </Panel>

      <Panel bodyClassName="px-0 pb-0 pt-0 md:px-0">
        <TableShell loading={loading && !data} empty={data && data.items.length === 0 ? (filter === "TO_DISPATCH" ? "Nothing waiting to be dispatched." : "No orders here.") : null}>
          <table className="w-full min-w-[820px]">
            <thead>
              <tr className="border-b border-hairline">
                <th className={th}>Ordered</th>
                <th className={th}>Customer</th>
                <th className={th}>Items</th>
                <th className={th}>Ship to</th>
                <th className={th}>Status</th>
                <th className={`${th} text-right`}>Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {data?.items.map((o) => (
                <tr key={o.id} onClick={() => setOpenId(o.id)} className="cursor-pointer transition-colors hover:bg-parchment/60">
                  <td className={`${td} whitespace-nowrap`}>{formatDateTime(o.createdAt)}</td>
                  <td className={td}>
                    <p className="font-medium text-ink">{o.customerName}</p>
                    <p className="text-[12px] text-ink-3">{o.customerEmail}</p>
                  </td>
                  <td className={`${td} max-w-[260px]`}>
                    <span className="line-clamp-2">{o.items.map((i) => `${i.productName}${i.quantity > 1 ? ` × ${i.quantity}` : ""}`).join(", ")}</span>
                  </td>
                  <td className={`${td} whitespace-nowrap`}>
                    {o.city}, {o.state}
                  </td>
                  <td className={td}>
                    <StatusBadge status={o.status} />
                  </td>
                  <td className={`${td} text-right font-semibold whitespace-nowrap text-ink tabular-nums`}>{formatINR(o.totalAmount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableShell>
        {data && <Pagination page={data.page} pageSize={data.pageSize} total={data.total} onPage={setPage} />}
      </Panel>

      {openId && <OrderDrawer id={openId} onClose={() => setOpenId(null)} onChanged={reload} />}
    </div>
  );
}

function OrderDrawer({ id, onClose, onChanged }: { id: string; onClose: () => void; onChanged: () => void }) {
  const { user } = useAuth();
  const [o, setO] = useState<OrderDetail | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [version, setVersion] = useState(0);
  const [refunding, setRefunding] = useState(false);
  const refunds = useRefunds(id, version);
  // Refunding needs the refund history (payments.view) to know what is still refundable.
  const canRefund = !!user?.permissions?.includes("payments.refund") && refunds.allowed;

  useEffect(() => {
    apiClient
      .get<OrderDetail>(`/admin/orders/${id}`)
      .then(setO)
      .catch((e) => toast.error(e instanceof Error ? e.message : "Could not load the order"));
  }, [id, version]);
  const refundable = o ? Math.max(0, Math.round((o.totalAmount - refunds.committed) * 100) / 100) : 0;

  const move = async (status: string) => {
    if (status === "CANCELLED" && !confirm("Cancel this order? This can't be undone here. Refund the customer separately if they paid.")) return;
    setBusy(status);
    try {
      setO(await apiClient.patch<OrderDetail>(`/admin/orders/${id}/status`, { status }));
      onChanged();
      toast.success("Order updated.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not update the order");
    } finally {
      setBusy(null);
    }
  };

  return (
    <Drawer title={o ? `Order for ${o.customerName}` : "Order"} subtitle={o ? `Placed ${formatDateTime(o.createdAt)} · ${o.id.slice(0, 8)}` : undefined} onClose={onClose}>
      {!o ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-champagne" />
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge status={o.status} />
            {o.user && (
              <Link href={`/admin/clients/${o.user.id}`} className="text-[13px] font-medium text-bronze hover:text-ink">
                View client →
              </Link>
            )}
          </div>

          {o.nextStatuses.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {o.nextStatuses.map((s) => {
                const a = ACTIONS[s];
                const Icon = a.icon;
                return (
                  <button
                    key={s}
                    onClick={() => move(s)}
                    disabled={!!busy}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-full px-4 py-2 text-[13px] font-semibold transition disabled:opacity-50",
                      a.danger ? "border border-garnet/30 text-garnet hover:bg-garnet/5" : "bg-midnight text-champagne-light hover:bg-midnight-2",
                    )}
                  >
                    {busy === s ? <Loader2 className="h-4 w-4 animate-spin" /> : <Icon className="h-4 w-4" />} {a.label}
                  </button>
                );
              })}
            </div>
          )}

          <section className="space-y-3">
            <SectionTitle>Items</SectionTitle>
            <ul className="divide-y divide-hairline rounded-xl border border-hairline">
              {o.items.map((i) => (
                <li key={i.id} className="flex justify-between gap-4 px-4 py-3 text-[14px]">
                  <span className="text-ink">
                    {i.productName} {i.quantity > 1 && <span className="text-ink-3">× {i.quantity}</span>}
                  </span>
                  <span className="text-ink-2 tabular-nums">{formatINR(i.price * i.quantity)}</span>
                </li>
              ))}
              <li className="flex justify-between gap-4 px-4 py-3 text-[14px] font-semibold">
                <span className="text-ink">Total</span>
                <span className="text-ink tabular-nums">{formatINR(o.totalAmount)}</span>
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <SectionTitle>Ship to</SectionTitle>
            <DetailList
              rows={[
                ["Name", o.customerName],
                ["Phone", <a key="p" href={`tel:${o.customerPhone}`} className="hover:underline">{o.customerPhone}</a>],
                ["Email", <a key="e" href={`mailto:${o.customerEmail}`} className="hover:underline">{o.customerEmail}</a>],
                ["Address", `${o.shippingAddress}, ${o.city}, ${o.state} ${o.pincode}`],
              ]}
            />
          </section>

          {o.paymentId && o.status !== "PENDING" && (canRefund || (refunds.rows?.length ?? 0) > 0) && (
            <section className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <SectionTitle>Refunds</SectionTitle>
                {canRefund && refunds.ready && refundable > 0 && (
                  <button
                    onClick={() => setRefunding(true)}
                    className="rounded-full border border-garnet/30 px-3.5 py-1.5 text-[12px] font-semibold text-garnet hover:bg-garnet/5"
                  >
                    Refund…
                  </button>
                )}
              </div>
              <RefundHistory rows={refunds.rows} />
              {refunds.rows?.length === 0 && <p className="text-[13px] text-ink-3">No refunds.</p>}
            </section>
          )}
          {refunding && (
            <MoneyActionDialog
              type="REFUND_SHOP_ORDER"
              title="Refund order"
              subtitle={`${o.customerName} · ${formatINR(o.totalAmount)}`}
              targetId={o.id}
              max={refundable}
              defaultAmount={refundable}
              note="The money goes back to the customer's original payment method. A full refund cancels the order."
              onClose={() => setRefunding(false)}
              onDone={() => {
                setVersion((v) => v + 1);
                onChanged();
              }}
            />
          )}

          <section className="space-y-3">
            <SectionTitle>Payment</SectionTitle>
            <DetailList
              rows={[
                ["Razorpay payment", o.paymentId && <code key="p" className="text-[12px]">{o.paymentId}</code>],
                ["Razorpay order", o.razorpayOrderId && <code key="o" className="text-[12px]">{o.razorpayOrderId}</code>],
              ]}
            />
          </section>
        </>
      )}
    </Drawer>
  );
}
