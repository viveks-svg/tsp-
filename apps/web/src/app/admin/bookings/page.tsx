"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Loader2, Video } from "lucide-react";
import { apiClient } from "@/lib/http/client";
import { PageHeader, Panel } from "@/features/admin/components/primitives";
import { DetailList, Drawer, FilterTabs, Pagination, SearchBox, SectionTitle, StatusBadge, TableShell, td, th } from "@/features/admin/components/records";
import { useAdminList } from "@/features/admin/hooks/useAdminList";
import { useAuth } from "@/providers/AuthProvider";
import { MoneyActionDialog } from "@/features/admin/components/MoneyActionDialog";
import { RefundHistory, useRefunds } from "@/features/admin/components/RefundHistory";

import { calendarParts, formatDateTime, formatFullDate, formatINR } from "@/features/admin/lib/format";

type View = "upcoming" | "past" | "unpaid" | "closed";

interface BookingRow {
  id: string;
  serviceName: string;
  fullName: string;
  email: string;
  phone: string;
  scheduledDate: string | null;
  scheduledSlot: string | null;
  amount: number;
  status: string;
  meetLink: string | null;
  createdAt: string;
}

interface BookingDetail extends BookingRow {
  serviceCategory: string;
  dateOfBirth: string | null;
  timeOfBirth: string | null;
  placeOfBirth: string | null;
  businessName: string | null;
  businessAddress: string | null;
  spaceType: string | null;
  urgencyTier: string;
  notes: string | null;
  baseAmount: number;
  surchargeAmount: number;
  razorpayOrderId: string | null;
  razorpayPaymentId: string | null;
  confirmedAt: string | null;
  clientId: string | null;
  bookingLead: { solutionName: string; createdAt: string } | null;
  paymentEvents: { id: string; eventType: string; razorpayEventId: string | null; amount: number; createdAt: string }[];
}

const VIEW_HELP: Record<View, string> = {
  upcoming: "Confirmed sessions from today onwards.",
  past: "Sessions whose date has passed.",
  unpaid: "Checkouts where payment was never completed — worth a follow-up call.",
  closed: "Cancelled or refunded.",
};

const URGENCY: Record<string, string> = { STANDARD: "Standard", NEXT_DAY: "Next day (+25%)", SAME_DAY: "Same day (+50%)" };

export default function BookingsPage() {
  const [view, setView] = useState<View>(() => {
    if (typeof window === "undefined") return "upcoming";
    const v = new URLSearchParams(window.location.search).get("view");
    return (["upcoming", "past", "unpaid", "closed"].includes(v ?? "") ? v : "upcoming") as View;
  });
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [openId, setOpenId] = useState<string | null>(null);
  const { data, loading } = useAdminList<{ items: BookingRow[]; total: number; counts: Record<View, number>; page: number; pageSize: number }>(
    "/admin/bookings",
    { view, q, page },
  );

  return (
    <div className="mx-auto max-w-[1320px] space-y-8 px-5 py-8 md:px-10 md:py-12">
      <PageHeader eyebrow="Clientele" title="Bookings" description="Sessions, Vastu visits and reports booked on the website." />

      <Panel bodyClassName="space-y-3 pt-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <FilterTabs
            value={view}
            onChange={(v) => {
              setView(v);
              setPage(1);
            }}
            options={[
              { value: "upcoming", label: "Upcoming", count: data?.counts.upcoming },
              { value: "past", label: "Past", count: data?.counts.past },
              { value: "unpaid", label: "Unpaid checkouts", count: data?.counts.unpaid },
              { value: "closed", label: "Cancelled & refunded", count: data?.counts.closed },
            ]}
          />
          <SearchBox
            value={q}
            onChange={(v) => {
              setQ(v);
              setPage(1);
            }}
            placeholder="Client, email, phone or service"
          />
        </div>
        <p className="text-[13px] text-ink-3">{VIEW_HELP[view]}</p>
      </Panel>

      <Panel bodyClassName="px-0 pb-0 pt-0 md:px-0">
        <TableShell loading={loading && !data} empty={data && data.items.length === 0 ? "Nothing here." : null}>
          <table className="w-full min-w-[860px]">
            <thead>
              <tr className="border-b border-hairline">
                <th className={th}>Session</th>
                <th className={th}>Service</th>
                <th className={th}>Client</th>
                <th className={th}>Status</th>
                <th className={`${th} text-right`}>Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {data?.items.map((b) => (
                <tr key={b.id} onClick={() => setOpenId(b.id)} className="cursor-pointer transition-colors hover:bg-parchment/60">
                  <td className={`${td} whitespace-nowrap`}>
                    {b.scheduledDate ? <span className="font-medium text-ink">{calendarParts(b.scheduledDate).full}</span> : "No date (report)"}
                    {b.scheduledSlot && <span className="block text-[12px] text-ink-3">{b.scheduledSlot}</span>}
                  </td>
                  <td className={`${td} max-w-[300px] text-ink`}>{b.serviceName}</td>
                  <td className={td}>
                    <p className="font-medium text-ink">{b.fullName}</p>
                    <p className="text-[12px] text-ink-3">{b.phone}</p>
                  </td>
                  <td className={td}>
                    <StatusBadge status={b.status} />
                  </td>
                  <td className={`${td} text-right font-semibold whitespace-nowrap text-ink tabular-nums`}>{formatINR(b.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableShell>
        {data && <Pagination page={data.page} pageSize={data.pageSize} total={data.total} onPage={setPage} />}
      </Panel>

      {openId && <BookingDrawer id={openId} onClose={() => setOpenId(null)} />}
    </div>
  );
}

function BookingDrawer({ id, onClose }: { id: string; onClose: () => void }) {
  const { user } = useAuth();
  const [b, setB] = useState<BookingDetail | null>(null);
  const [version, setVersion] = useState(0);
  const [refunding, setRefunding] = useState(false);
  const refunds = useRefunds(id, version);
  // Refunding needs the refund history (payments.view) to know what is still refundable.
  const canRefund = !!user?.permissions?.includes("payments.refund") && refunds.allowed;
  useEffect(() => {
    apiClient
      .get<BookingDetail>(`/admin/bookings/${id}`)
      .then(setB)
      .catch((e) => toast.error(e instanceof Error ? e.message : "Could not load the booking"));
  }, [id, version]);
  const refundable = b ? Math.max(0, Math.round((b.amount - refunds.committed) * 100) / 100) : 0;
  const paid = !!b?.razorpayPaymentId && ["CONFIRMED", "COMPLETED", "REFUNDED"].includes(b.status);

  return (
    <Drawer title={b?.serviceName ?? "Booking"} subtitle={b ? `Booked ${formatDateTime(b.createdAt)}` : undefined} onClose={onClose}>
      {!b ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-champagne" />
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge status={b.status} />
            {b.meetLink && (
              <a href={b.meetLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-full bg-midnight px-3.5 py-1.5 text-[12px] font-medium text-champagne-light">
                <Video className="h-3.5 w-3.5" /> Meet link
              </a>
            )}
            {b.clientId && (
              <Link href={`/admin/clients/${b.clientId}`} className="text-[13px] font-medium text-bronze hover:text-ink">
                View client →
              </Link>
            )}
          </div>

          <section className="space-y-3">
            <SectionTitle>Session</SectionTitle>
            <DetailList
              rows={[
                ["Date", b.scheduledDate ? calendarParts(b.scheduledDate).full : "No date (report)"],
                ["Time", b.scheduledSlot],
                ["Urgency", URGENCY[b.urgencyTier] ?? b.urgencyTier],
                ["Client's notes", b.notes],
              ]}
            />
          </section>

          <section className="space-y-3">
            <SectionTitle>Client</SectionTitle>
            <DetailList
              rows={[
                ["Name", b.fullName],
                ["Email", <a key="e" href={`mailto:${b.email}`} className="hover:underline">{b.email}</a>],
                ["Phone", <a key="p" href={`tel:${b.phone}`} className="hover:underline">{b.phone}</a>],
                ["Date of birth", b.dateOfBirth ? formatFullDate(b.dateOfBirth) : null],
                ["Time of birth", b.timeOfBirth],
                ["Place of birth", b.placeOfBirth],
                ["Business", b.businessName],
                ["Address", b.businessAddress],
                ["Space", b.spaceType],
              ]}
            />
          </section>

          <section className="space-y-3">
            <SectionTitle>Payment</SectionTitle>
            <DetailList
              rows={[
                ["Price", formatINR(b.baseAmount)],
                ["Urgency surcharge", b.surchargeAmount ? formatINR(b.surchargeAmount) : null],
                ["Total", <strong key="t">{formatINR(b.amount)}</strong>],
                ["Paid on", b.confirmedAt ? formatDateTime(b.confirmedAt) : null],
                ["Razorpay payment", b.razorpayPaymentId && <code key="rp" className="text-[12px]">{b.razorpayPaymentId}</code>],
                ["Razorpay order", b.razorpayOrderId && <code key="ro" className="text-[12px]">{b.razorpayOrderId}</code>],
                ["Came from lead", b.bookingLead ? `${b.bookingLead.solutionName} · ${formatDateTime(b.bookingLead.createdAt)}` : null],
              ]}
            />
            {paid && (canRefund || (refunds.rows?.length ?? 0) > 0) && (
              <div className="space-y-3 pt-2">
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
              </div>
            )}
            {refunding && b && (
              <MoneyActionDialog
                type="REFUND_BOOKING"
                title="Refund booking"
                subtitle={`${b.serviceName} · ${b.fullName}`}
                targetId={b.id}
                max={refundable}
                defaultAmount={refundable}
                note="The money goes back to the client's original payment method through Razorpay. The astrologer's share is reduced to match."
                onClose={() => setRefunding(false)}
                onDone={() => setVersion((v) => v + 1)}
              />
            )}
            {b.paymentEvents.length > 0 && (
              <ul className="space-y-2 rounded-xl border border-hairline p-4 text-[13px]">
                {b.paymentEvents.map((e) => (
                  <li key={e.id} className="flex justify-between gap-4">
                    <span className="text-ink-2">{e.eventType.replace(/_/g, " ").toLowerCase()}</span>
                    <span className="text-ink-3">{formatDateTime(e.createdAt)}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </Drawer>
  );
}
