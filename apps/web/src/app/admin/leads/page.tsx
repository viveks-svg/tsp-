"use client";

import { useState } from "react";
import { Mail, MessageCircle, Phone } from "lucide-react";
import { PageHeader, Panel } from "@/features/admin/components/primitives";
import { Badge, FilterTabs, TableShell, td, th } from "@/features/admin/components/records";
import { useAdminList } from "@/features/admin/hooks/useAdminList";
import { formatDateTime } from "@/features/admin/lib/format";

interface Lead {
  id: string;
  sessionId: string;
  solutionSlug: string;
  solutionName: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  status: string;
  lastActivityAt: string;
  createdAt: string;
  convertedBookingId: string | null;
}

/** How far a visitor got in the booking form before stopping. */
const STAGE: Record<string, { label: string; tone: "neutral" | "info" | "waiting" | "good" }> = {
  STARTED: { label: "Opened the form", tone: "neutral" },
  CONTACT_CAPTURED: { label: "Left contact details", tone: "info" },
  DETAILS_COMPLETED: { label: "Filled in details", tone: "info" },
  PRICE_REVEALED: { label: "Saw the price", tone: "waiting" },
  PAYMENT_INITIATED: { label: "Started paying", tone: "waiting" },
  CONVERTED: { label: "Booked", tone: "good" },
};

const whatsapp = (phone: string) => `https://wa.me/${phone.replace(/\D/g, "").replace(/^(\d{10})$/, "91$1")}`;

/**
 * People who started booking a session but haven't finished — worth a call.
 * Captured as visitors move through the booking form.
 */
export default function AdminLeadsPage() {
  const [view, setView] = useState<"open" | "all">("open");
  const { data, loading } = useAdminList<Lead[]>("/admin/leads", { stale: view === "open" ? "true" : undefined });

  return (
    <div className="mx-auto max-w-[1320px] space-y-8 px-5 py-8 md:px-10 md:py-12">
      <PageHeader
        eyebrow="Clientele"
        title="Booking leads"
        description="Visitors who started booking a session. Those who left a phone number but didn’t finish are worth a gentle call."
      />

      <FilterTabs
        value={view}
        onChange={setView}
        options={[
          { value: "open", label: "Not booked yet", count: view === "open" ? data?.length : undefined },
          { value: "all", label: "All leads" },
        ]}
      />

      <Panel bodyClassName="px-0 pb-0 pt-0 md:px-0">
        <TableShell loading={loading && !data} empty={data && data.length === 0 ? "No leads here." : null}>
          <table className="w-full min-w-[860px]">
            <thead>
              <tr className="border-b border-hairline">
                <th className={th}>Visitor</th>
                <th className={th}>Interested in</th>
                <th className={th}>Got as far as</th>
                <th className={th}>Last active</th>
                <th className={th} aria-label="Contact" />
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {data?.map((lead) => {
                const stage = STAGE[lead.status] ?? { label: lead.status, tone: "neutral" as const };
                return (
                  <tr key={lead.id}>
                    <td className={td}>
                      <p className="font-medium text-ink">{lead.name || <span className="text-ink-3 italic">No name given</span>}</p>
                      <p className="text-[12px] text-ink-3">{[lead.phone, lead.email].filter(Boolean).join(" · ") || "No contact details"}</p>
                    </td>
                    <td className={`${td} text-ink`}>{lead.solutionName}</td>
                    <td className={td}>
                      <Badge tone={stage.tone}>{stage.label}</Badge>
                    </td>
                    <td className={`${td} whitespace-nowrap`}>{formatDateTime(lead.lastActivityAt)}</td>
                    <td className={`${td} text-right whitespace-nowrap`}>
                      <span className="inline-flex gap-1.5">
                        {lead.phone && (
                          <>
                            <a href={`tel:${lead.phone}`} title="Call" aria-label="Call" className="rounded-lg border border-hairline bg-ivory p-2 text-ink-2 hover:border-champagne hover:text-ink">
                              <Phone className="h-4 w-4" />
                            </a>
                            <a
                              href={whatsapp(lead.phone)}
                              target="_blank"
                              rel="noreferrer"
                              title="WhatsApp"
                              aria-label="WhatsApp"
                              className="rounded-lg border border-hairline bg-ivory p-2 text-ink-2 hover:border-champagne hover:text-ink"
                            >
                              <MessageCircle className="h-4 w-4" />
                            </a>
                          </>
                        )}
                        {lead.email && (
                          <a href={`mailto:${lead.email}`} title="Email" aria-label="Email" className="rounded-lg border border-hairline bg-ivory p-2 text-ink-2 hover:border-champagne hover:text-ink">
                            <Mail className="h-4 w-4" />
                          </a>
                        )}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </TableShell>
      </Panel>
    </div>
  );
}
