"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { BellRing, Loader2, Send } from "lucide-react";
import { apiClient } from "@/lib/http/client";
import { cn } from "@/lib/cn";
import { PageHeader, Panel } from "@/features/admin/components/primitives";
import { Pagination, TableShell, td, th } from "@/features/admin/components/records";
import { useAdminList } from "@/features/admin/hooks/useAdminList";
import { formatDateTime } from "@/features/admin/lib/format";

type Audience = "ME" | "RECENT_CLIENTS" | "ALL_CLIENTS";

interface Broadcast {
  id: string;
  title: string;
  body: string;
  link: string | null;
  audience: Audience;
  recipients: number;
  pushSent: number;
  pushFailed: number;
  sentBy: string;
  createdAt: string;
}

const AUDIENCE_LABEL: Record<Audience, string> = {
  ME: "Just me (test)",
  RECENT_CLIENTS: "Clients who joined in the last 30 days",
  ALL_CLIENTS: "All clients",
};

const inputClass =
  "w-full rounded-xl border border-hairline bg-ivory px-3.5 py-2.5 text-[14px] text-ink outline-none transition focus:border-champagne focus:ring-2 focus:ring-champagne/20";

/**
 * Messages to clients: each recipient gets it in the website's notification
 * bell, and as a push on the phones and browsers where they allowed it.
 */
export default function AnnouncementsPage() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [link, setLink] = useState("");
  const [audience, setAudience] = useState<Audience>("ME");
  const [sizes, setSizes] = useState<{ ALL_CLIENTS: number; RECENT_CLIENTS: number; withDevices: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [page, setPage] = useState(1);
  const history = useAdminList<{ items: Broadcast[]; total: number; page: number; pageSize: number }>("/admin/announcements", { page });

  useEffect(() => {
    apiClient.get<typeof sizes>("/admin/announcements/audience").then(setSizes).catch(() => {});
  }, []);

  const count = audience === "ME" ? 1 : sizes?.[audience];
  const valid = title.trim().length >= 2 && body.trim().length >= 2;

  const send = async () => {
    if (audience !== "ME" && !confirm(`Send this to ${count ?? "all"} ${audience === "ALL_CLIENTS" ? "clients" : "recent clients"}? It can't be recalled.`)) return;
    setBusy(true);
    try {
      const r = await apiClient.post<Broadcast>("/admin/announcements", { title, body, ...(link.trim() && { link: link.trim() }), audience });
      toast.success(
        `Sent to ${r.recipients} ${r.recipients === 1 ? "account" : "accounts"}` +
          (r.pushSent || r.pushFailed ? ` · push reached ${r.pushSent} device${r.pushSent === 1 ? "" : "s"}` : " · no devices had push turned on"),
      );
      if (audience !== "ME") {
        setTitle("");
        setBody("");
        setLink("");
        setAudience("ME");
      }
      history.reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not send");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-[1320px] space-y-8 px-5 py-8 md:px-10 md:py-12">
      <PageHeader
        eyebrow="Growth"
        title="Announcements"
        description="Send clients a message — it appears in their notification bell on the website and as a push notification where they’ve allowed it. Send it to yourself first to see how it looks."
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_380px]">
        <Panel title="New announcement" bodyClassName="space-y-5">
          <label className="block space-y-1.5">
            <span className="flex justify-between text-[13px] font-medium text-ink-2">
              Title <span className="font-normal text-ink-3">{title.length}/65</span>
            </span>
            <input value={title} maxLength={65} onChange={(e) => setTitle(e.target.value)} placeholder="Diwali consultations are open" className={inputClass} />
          </label>
          <label className="block space-y-1.5">
            <span className="flex justify-between text-[13px] font-medium text-ink-2">
              Message <span className="font-normal text-ink-3">{body.length}/240</span>
            </span>
            <textarea
              rows={3}
              maxLength={240}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Book a festive session with Dr. Pradeep before 30 October."
              className={cn(inputClass, "resize-none")}
            />
          </label>
          <label className="block space-y-1.5">
            <span className="block text-[13px] font-medium text-ink-2">Opens when tapped (optional)</span>
            <input value={link} onChange={(e) => setLink(e.target.value)} placeholder="/book" className={inputClass} />
          </label>
          <fieldset className="space-y-2">
            <legend className="mb-1.5 text-[13px] font-medium text-ink-2">Send to</legend>
            {(["ME", "RECENT_CLIENTS", "ALL_CLIENTS"] as Audience[]).map((a) => (
              <label
                key={a}
                className={cn(
                  "flex cursor-pointer items-center justify-between gap-3 rounded-xl border px-4 py-3 transition",
                  audience === a ? "border-champagne bg-champagne/10" : "border-hairline bg-ivory hover:border-champagne/60",
                )}
              >
                <span className="flex items-center gap-3">
                  <input type="radio" name="audience" checked={audience === a} onChange={() => setAudience(a)} className="accent-[#0B1233]" />
                  <span className="text-[14px] text-ink">{AUDIENCE_LABEL[a]}</span>
                </span>
                <span className="text-[13px] text-ink-3 tabular-nums">{a === "ME" ? "1" : sizes ? sizes[a] : "…"}</span>
              </label>
            ))}
            {sizes && (
              <p className="text-[12px] text-ink-3">
                {sizes.withDevices} of {sizes.ALL_CLIENTS} clients have allowed push notifications; everyone gets it in the website bell.
              </p>
            )}
          </fieldset>
          <div className="flex justify-end">
            <button
              onClick={send}
              disabled={!valid || busy}
              className="inline-flex items-center gap-2 rounded-full bg-midnight px-5 py-2.5 text-[13px] font-semibold text-champagne-light hover:bg-midnight-2 disabled:opacity-40"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {audience === "ME" ? "Send me a test" : `Send to ${count ?? "…"}`}
            </button>
          </div>
        </Panel>

        <Panel title="How it looks">
          <div className="rounded-[28px] bg-midnight p-4">
            <p className="mb-3 text-center text-[11px] text-white/50">Lock screen</p>
            <div className="flex gap-3 rounded-2xl bg-white/90 p-3 backdrop-blur">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-midnight">
                <Image src="/logo/tsp-logo-champagne.svg" alt="" width={30} height={20} />
              </span>
              <div className="min-w-0">
                <p className="text-[11px] text-ink-3">Time Space &amp; Planets · now</p>
                <p className="truncate text-[14px] font-semibold text-ink">{title || "Title"}</p>
                <p className="line-clamp-3 text-[13px] text-ink-2">{body || "Your message"}</p>
              </div>
            </div>
          </div>
          <p className="mt-4 flex gap-2 text-[12px] text-ink-3">
            <BellRing className="h-4 w-4 shrink-0 text-bronze" /> On the website it appears in the notification bell; tapping opens {link || "the website"}.
          </p>
        </Panel>
      </div>

      <Panel title="Sent" bodyClassName="px-0 pb-0 md:px-0">
        <TableShell loading={history.loading && !history.data} empty={history.data && history.data.items.length === 0 ? "Nothing sent yet." : null}>
          <table className="w-full min-w-[820px]">
            <thead>
              <tr className="border-b border-hairline">
                <th className={th}>Sent</th>
                <th className={th}>Message</th>
                <th className={th}>To</th>
                <th className={`${th} text-right`}>Accounts</th>
                <th className={`${th} text-right`}>Devices reached</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {history.data?.items.map((b) => (
                <tr key={b.id}>
                  <td className={`${td} whitespace-nowrap`}>
                    {formatDateTime(b.createdAt)}
                    <span className="block text-[12px] text-ink-3">by {b.sentBy}</span>
                  </td>
                  <td className={`${td} max-w-[360px]`}>
                    <p className="font-medium text-ink">{b.title}</p>
                    <p className="line-clamp-2 text-[12px] text-ink-3">{b.body}</p>
                  </td>
                  <td className={td}>{AUDIENCE_LABEL[b.audience] ?? b.audience}</td>
                  <td className={`${td} text-right tabular-nums`}>{b.recipients}</td>
                  <td className={`${td} text-right tabular-nums`}>
                    {b.pushSent}
                    {b.pushFailed > 0 && <span className="block text-[12px] text-garnet">{b.pushFailed} failed</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableShell>
        {history.data && <Pagination page={history.data.page} pageSize={history.data.pageSize} total={history.data.total} onPage={setPage} />}
      </Panel>
    </div>
  );
}
