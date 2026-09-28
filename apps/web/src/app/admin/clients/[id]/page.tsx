"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft, Mail, Phone, Star } from "lucide-react";
import { apiClient } from "@/lib/http/client";
import { cn } from "@/lib/cn";
import { PageHeader, Panel, Skeleton, StatTile } from "@/features/admin/components/primitives";
import { DetailList, StatusBadge, td, th } from "@/features/admin/components/records";
import { MoneyActionDialog } from "@/features/admin/components/MoneyActionDialog";
import { useAuth } from "@/providers/AuthProvider";
import { calendarParts, formatDateTime, formatFullDate, formatINR } from "@/features/admin/lib/format";

interface Client {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  authProvider: string | null;
  createdAt: string;
  profile: { dob: string | null; tob: string | null; pob: string | null; gender: string | null } | null;
  wallet: { balance: number; entries: { id: string; amount: number; type: string; description: string; balanceAfter: number; createdAt: string }[] } | null;
  consultations: {
    id: string;
    type: string;
    status: string;
    scheduledAt: string;
    durationMin: number | null;
    cost: number | null;
    astrologerName: string | null;
    review: { rating: number; review: string | null } | null;
  }[];
  shopOrders: { id: string; status: string; totalAmount: number; createdAt: string; items: number }[];
  bookings: { id: string; serviceName: string; status: string; scheduledDate: string | null; scheduledSlot: string | null; amount: number; createdAt: string }[];
  sessions: { id: string; deviceModel: string | null; os: string | null; userAgent: string | null; createdAt: string }[];
}

const SIGNED_UP: Record<string, string> = { EMAIL: "Email & password", GOOGLE: "Google", PHONE: "Phone", APPLE: "Apple" };

export default function ClientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user } = useAuth();
  const canAdjust = !!user?.permissions?.includes("wallet.adjust");
  const [c, setC] = useState<Client | null>(null);
  const [version, setVersion] = useState(0);
  const [adjusting, setAdjusting] = useState<"WALLET_CREDIT" | "WALLET_DEBIT" | null>(null);

  useEffect(() => {
    apiClient
      .get<Client>(`/admin/clients/${id}`)
      .then(setC)
      .catch((e) => toast.error(e instanceof Error ? e.message : "Could not load the client"));
  }, [id, version]);

  const spend = c ? c.bookings.filter((b) => b.status === "CONFIRMED" || b.status === "COMPLETED").reduce((s, b) => s + b.amount, 0) : 0;
  const consultationSpend = c ? c.consultations.reduce((s, x) => s + (x.cost ?? 0), 0) : 0;
  const shopSpend = c ? c.shopOrders.filter((o) => !["PENDING", "CANCELLED"].includes(o.status)).reduce((s, o) => s + o.totalAmount, 0) : 0;

  return (
    <div className="mx-auto max-w-[1320px] space-y-8 px-5 py-8 md:px-10 md:py-12">
      <Link href="/admin/clients" className="inline-flex items-center gap-1.5 text-[13px] font-medium text-bronze hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> All clients
      </Link>

      {!c ? (
        <Skeleton className="h-96" />
      ) : (
        <>
          <PageHeader
            eyebrow={`Client since ${calendarParts(c.createdAt.slice(0, 10)).full}`}
            title={c.name || c.email || "Client"}
            description={
              <span className="flex flex-wrap gap-x-5 gap-y-1">
                {c.email && (
                  <a href={`mailto:${c.email}`} className="inline-flex items-center gap-1.5 hover:text-ink">
                    <Mail className="h-4 w-4" /> {c.email}
                  </a>
                )}
                {c.phone && (
                  <a href={`tel:${c.phone}`} className="inline-flex items-center gap-1.5 hover:text-ink">
                    <Phone className="h-4 w-4" /> {c.phone}
                  </a>
                )}
              </span>
            }
          />

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
            <StatTile label="Spent on bookings" value={formatINR(spend)} detail={`${c.bookings.length} booking${c.bookings.length === 1 ? "" : "s"}`} />
            <StatTile label="Spent on consultations" value={formatINR(consultationSpend)} detail={`${c.consultations.length} consultation${c.consultations.length === 1 ? "" : "s"}`} />
            <StatTile label="Spent in the shop" value={formatINR(shopSpend)} detail={`${c.shopOrders.length} order${c.shopOrders.length === 1 ? "" : "s"}`} />
            <StatTile label="Wallet balance" value={formatINR(c.wallet?.balance ?? 0)} detail={`${c.wallet?.entries.length ?? 0} wallet entries`} />
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <div className="space-y-6 xl:col-span-2">
              <Panel title="Bookings" subtitle="Matched by email address" bodyClassName="px-0 pb-2 md:px-0">
                {c.bookings.length === 0 ? (
                  <p className="px-6 pb-4 text-[14px] text-ink-3 md:px-7">No bookings.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[560px]">
                      <thead>
                        <tr className="border-b border-hairline">
                          <th className={th}>Service</th>
                          <th className={th}>Session</th>
                          <th className={th}>Status</th>
                          <th className={`${th} text-right`}>Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-hairline">
                        {c.bookings.map((b) => (
                          <tr key={b.id}>
                            <td className={`${td} text-ink`}>{b.serviceName}</td>
                            <td className={`${td} whitespace-nowrap`}>
                              {b.scheduledDate ? calendarParts(b.scheduledDate).full : "—"}
                              {b.scheduledSlot && <span className="block text-[12px] text-ink-3">{b.scheduledSlot}</span>}
                            </td>
                            <td className={td}>
                              <StatusBadge status={b.status} />
                            </td>
                            <td className={`${td} text-right font-medium text-ink tabular-nums`}>{formatINR(b.amount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Panel>

              <Panel title="Consultations" bodyClassName="px-0 pb-2 md:px-0">
                {c.consultations.length === 0 ? (
                  <p className="px-6 pb-4 text-[14px] text-ink-3 md:px-7">No consultations.</p>
                ) : (
                  <ul className="divide-y divide-hairline">
                    {c.consultations.map((x) => (
                      <li key={x.id} className="flex flex-wrap items-center gap-3 px-6 py-3.5 md:px-7">
                        <div className="min-w-0 flex-1">
                          <p className="text-[14px] font-medium text-ink">
                            {x.type === "CALL" ? "Call" : "Chat"} with {x.astrologerName || "astrologer"}
                          </p>
                          <p className="text-[12px] text-ink-3">
                            {formatDateTime(x.scheduledAt)}
                            {x.durationMin ? ` · ${x.durationMin} min` : ""}
                            {x.cost != null ? ` · ${formatINR(x.cost)}` : ""}
                          </p>
                          {x.review && (
                            <p className="mt-1 flex items-center gap-1 text-[12px] text-bronze">
                              <Star className="h-3 w-3 fill-current" /> {x.review.rating}
                              {x.review.review && <span className="text-ink-3 italic"> — “{x.review.review}”</span>}
                            </p>
                          )}
                        </div>
                        <StatusBadge status={x.status} />
                      </li>
                    ))}
                  </ul>
                )}
              </Panel>

              <Panel
                title="Wallet"
                subtitle="Every change to their balance, newest first"
                action={
                  canAdjust && (
                    <span className="flex shrink-0 gap-2">
                      <button
                        onClick={() => setAdjusting("WALLET_CREDIT")}
                        className="rounded-full border border-hairline bg-ivory px-3.5 py-1.5 text-[12px] font-medium text-ink-2 hover:border-champagne"
                      >
                        Credit
                      </button>
                      <button
                        onClick={() => setAdjusting("WALLET_DEBIT")}
                        disabled={!c.wallet || c.wallet.balance <= 0}
                        className="rounded-full border border-hairline bg-ivory px-3.5 py-1.5 text-[12px] font-medium text-ink-2 hover:border-champagne disabled:opacity-40"
                      >
                        Debit
                      </button>
                    </span>
                  )
                }
                bodyClassName="px-0 pb-2 md:px-0"
              >
                {!c.wallet || c.wallet.entries.length === 0 ? (
                  <p className="px-6 pb-4 text-[14px] text-ink-3 md:px-7">No wallet activity.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[520px]">
                      <tbody className="divide-y divide-hairline">
                        {c.wallet.entries.map((e) => (
                          <tr key={e.id}>
                            <td className={`${td} whitespace-nowrap`}>{formatDateTime(e.createdAt)}</td>
                            <td className={`${td} text-ink`}>{e.description}</td>
                            <td className={cn(td, "text-right font-medium whitespace-nowrap tabular-nums", e.type === "CREDIT" ? "text-emerald-deep" : "text-garnet")}>
                              {e.type === "CREDIT" ? "+" : "−"}
                              {formatINR(e.amount)}
                            </td>
                            <td className={`${td} text-right whitespace-nowrap tabular-nums`}>{formatINR(e.balanceAfter)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Panel>
            </div>

            <div className="space-y-6">
              <Panel title="Details">
                <DetailList
                  rows={[
                    ["Signed up with", SIGNED_UP[c.authProvider ?? ""] ?? c.authProvider ?? "—"],
                    ["Date of birth", c.profile?.dob ? formatFullDate(c.profile.dob) : null],
                    ["Time of birth", c.profile?.tob],
                    ["Place of birth", c.profile?.pob],
                    ["Gender", c.profile?.gender],
                  ]}
                />
              </Panel>

              <Panel title="Shop orders" bodyClassName="px-0 pb-2 md:px-0">
                {c.shopOrders.length === 0 ? (
                  <p className="px-6 pb-4 text-[14px] text-ink-3 md:px-7">No orders.</p>
                ) : (
                  <ul className="divide-y divide-hairline">
                    {c.shopOrders.map((o) => (
                      <li key={o.id}>
                        <Link href={`/admin/orders?open=${o.id}`} className="flex items-center gap-3 px-6 py-3.5 hover:bg-parchment/60 md:px-7">
                          <div className="min-w-0 flex-1">
                            <p className="text-[14px] font-medium text-ink tabular-nums">{formatINR(o.totalAmount)}</p>
                            <p className="text-[12px] text-ink-3">
                              {formatDateTime(o.createdAt)} · {o.items} item{o.items === 1 ? "" : "s"}
                            </p>
                          </div>
                          <StatusBadge status={o.status} />
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </Panel>

              <Panel title="Signed in on" subtitle="Active sessions">
                {c.sessions.length === 0 ? (
                  <p className="text-[14px] text-ink-3">No active sessions.</p>
                ) : (
                  <ul className="space-y-3">
                    {c.sessions.map((s) => (
                      <li key={s.id} className="text-[13px]">
                        <p className="font-medium text-ink">{[s.deviceModel, s.os].filter(Boolean).join(" · ") || s.userAgent?.slice(0, 60) || "Unknown device"}</p>
                        <p className="text-ink-3">Since {formatDateTime(s.createdAt)}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </Panel>
            </div>
          </div>
          {adjusting && (
            <MoneyActionDialog
              type={adjusting}
              title={adjusting === "WALLET_CREDIT" ? "Credit wallet" : "Debit wallet"}
              subtitle={`${c.name || c.email} · balance ${formatINR(c.wallet?.balance ?? 0)}`}
              userId={c.id}
              max={adjusting === "WALLET_DEBIT" ? c.wallet?.balance ?? 0 : undefined}
              note={
                adjusting === "WALLET_CREDIT"
                  ? "Adds TSP credit the client can spend on consultations (e.g. goodwill for a dropped call). No money is charged or paid out."
                  : "Removes credit from the client's TSP wallet (e.g. a correction). No money is refunded to them."
              }
              onClose={() => setAdjusting(null)}
              onDone={() => setVersion((v) => v + 1)}
            />
          )}
        </>
      )}
    </div>
  );
}
