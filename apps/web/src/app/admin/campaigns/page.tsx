"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Megaphone, Pencil, Plus, X } from "lucide-react";
import { apiClient } from "@/lib/http/client";
import { ENDPOINTS } from "@/lib/constants/http/endpoints";
import { cn } from "@/lib/cn";
import { PageHeader, Panel, Skeleton } from "@/features/admin/components/primitives";
import { Badge } from "@/features/admin/components/records";
import { formatINR } from "@/features/admin/lib/format";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

interface Campaign {
  id: string;
  title: string;
  bannerText: string;
  ratePerMinute: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
  createdAt: string;
}

type CampaignForm = Omit<Campaign, "id" | "createdAt">;

const DEFAULT_FORM: CampaignForm = {
  title: "Skip the Queue with Dr. Pradeep",
  bannerText: "Get instant consultation with Dr. Pradeep Sharma at just ₹19/min! Live every Wednesday.",
  ratePerMinute: "19.00",
  dayOfWeek: 3,
  startTime: "10:00",
  endTime: "15:00",
  isActive: true,
};

const to12h = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return `${h % 12 === 0 ? 12 : h % 12}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
};

const inputClass =
  "w-full rounded-xl border border-hairline bg-ivory px-3.5 py-2.5 text-[14px] text-ink outline-none transition focus:border-champagne focus:ring-2 focus:ring-champagne/20";

/**
 * Live-queue campaigns: a weekly window (e.g. Wednesdays 10–3) when clients
 * join a queue to speak with Dr. Pradeep at a special per-minute rate. The
 * banner text runs across the top of the website while a campaign is on.
 */
export default function AdminCampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[] | null>(null);
  const [editing, setEditing] = useState<Campaign | "new" | null>(null);

  const load = useCallback(async () => {
    try {
      setCampaigns(await apiClient.get<Campaign[]>(ENDPOINTS.ADMIN.CAMPAIGNS));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not load campaigns");
      setCampaigns([]);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const toggle = async (c: Campaign) => {
    try {
      await apiClient.patch(ENDPOINTS.ADMIN.CAMPAIGN(c.id), { isActive: !c.isActive });
      toast.success(c.isActive ? "Campaign paused." : "Campaign switched on.");
      void load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not update");
    }
  };

  return (
    <div className="mx-auto max-w-[1320px] space-y-8 px-5 py-8 md:px-10 md:py-12">
      <PageHeader
        eyebrow="Growth"
        title="Campaigns"
        description="Weekly live-queue sessions with Dr. Pradeep at a special per-minute rate. While a campaign is on, its banner runs across the top of the website and clients can join the queue."
        actions={
          <button
            onClick={() => setEditing("new")}
            className="inline-flex items-center gap-2 rounded-full bg-midnight px-5 py-2.5 text-[13px] font-semibold text-champagne-light shadow-[0_10px_24px_-12px_rgba(11,18,51,0.7)] transition hover:bg-midnight-2"
          >
            <Plus className="h-4 w-4" /> New campaign
          </button>
        }
      />

      {!campaigns ? (
        <Skeleton className="h-64" />
      ) : campaigns.length === 0 ? (
        <Panel>
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <span className="flex h-11 w-11 items-center justify-center rounded-full border border-hairline bg-parchment text-champagne">
              <Megaphone className="h-5 w-5" />
            </span>
            <p className="text-sm text-ink-3">No campaigns yet.</p>
          </div>
        </Panel>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {campaigns.map((c) => (
            <Panel key={c.id} bodyClassName="pt-6">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="font-playfair text-xl font-semibold text-ink">{c.title}</h2>
                  <p className="mt-1 text-[13px] text-ink-3">
                    Every {DAY_NAMES[c.dayOfWeek]}, {to12h(c.startTime)} – {to12h(c.endTime)} IST
                  </p>
                </div>
                {c.isActive ? <Badge tone="good">On</Badge> : <Badge tone="neutral">Paused</Badge>}
              </div>
              <p className="mt-4 rounded-xl border border-champagne/30 bg-midnight px-4 py-3 text-[13px] text-champagne-light">{c.bannerText}</p>
              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-hairline pt-4">
                <p className="text-[13px] text-ink-2">
                  <span className="font-inter text-[17px] font-semibold text-ink">{formatINR(Number(c.ratePerMinute))}</span> per minute
                </p>
                <div className="flex gap-2">
                  <button onClick={() => toggle(c)} className="rounded-full border border-hairline bg-ivory px-3.5 py-1.5 text-[12px] font-medium text-ink-2 hover:border-champagne">
                    {c.isActive ? "Pause" : "Switch on"}
                  </button>
                  <button
                    onClick={() => setEditing(c)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-hairline bg-ivory px-3.5 py-1.5 text-[12px] font-medium text-ink-2 hover:border-champagne"
                  >
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </button>
                </div>
              </div>
            </Panel>
          ))}
        </div>
      )}

      {editing && (
        <CampaignEditor
          campaign={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            void load();
          }}
        />
      )}
    </div>
  );
}

function CampaignEditor({ campaign, onClose, onSaved }: { campaign: Campaign | null; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState<CampaignForm>(
    campaign
      ? {
          title: campaign.title,
          bannerText: campaign.bannerText,
          ratePerMinute: campaign.ratePerMinute,
          dayOfWeek: campaign.dayOfWeek,
          startTime: campaign.startTime,
          endTime: campaign.endTime,
          isActive: campaign.isActive,
        }
      : DEFAULT_FORM,
  );
  const [busy, setBusy] = useState(false);
  const set = <K extends keyof CampaignForm>(k: K, v: CampaignForm[K]) => setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const save = async () => {
    setBusy(true);
    try {
      if (campaign) await apiClient.patch(ENDPOINTS.ADMIN.CAMPAIGN(campaign.id), form);
      else await apiClient.post(ENDPOINTS.ADMIN.CAMPAIGNS, form);
      toast.success("Campaign saved.");
      onSaved();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save the campaign");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-midnight/50 backdrop-blur-[2px] sm:items-center sm:p-6" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className="max-h-[94vh] w-full overflow-y-auto rounded-t-2xl border border-hairline bg-ivory shadow-[0_30px_80px_-20px_rgba(11,18,51,0.5)] sm:max-w-lg sm:rounded-2xl"
      >
        <div className="flex items-center justify-between border-b border-hairline px-6 py-4">
          <h2 className="font-playfair text-xl font-semibold text-ink">{campaign ? "Edit campaign" : "New campaign"}</h2>
          <button onClick={onClose} aria-label="Close" className="rounded-lg p-2 text-ink-3 hover:bg-parchment hover:text-ink">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-4 px-6 py-5">
          <label className="block space-y-1.5">
            <span className="block text-[13px] font-medium text-ink-2">Title</span>
            <input value={form.title} onChange={(e) => set("title", e.target.value)} className={inputClass} />
          </label>
          <label className="block space-y-1.5">
            <span className="block text-[13px] font-medium text-ink-2">Banner text</span>
            <textarea rows={2} value={form.bannerText} onChange={(e) => set("bannerText", e.target.value)} className={cn(inputClass, "resize-none")} />
          </label>
          <div className="grid grid-cols-2 gap-4">
            <label className="block space-y-1.5">
              <span className="block text-[13px] font-medium text-ink-2">Rate per minute (₹)</span>
              <input type="number" min={0} step="0.5" value={form.ratePerMinute} onChange={(e) => set("ratePerMinute", e.target.value)} className={inputClass} />
            </label>
            <label className="block space-y-1.5">
              <span className="block text-[13px] font-medium text-ink-2">Day</span>
              <select value={form.dayOfWeek} onChange={(e) => set("dayOfWeek", Number(e.target.value))} className={inputClass}>
                {DAY_NAMES.map((d, i) => (
                  <option key={d} value={i}>
                    {d}
                  </option>
                ))}
              </select>
            </label>
            <label className="block space-y-1.5">
              <span className="block text-[13px] font-medium text-ink-2">From (IST)</span>
              <input type="time" value={form.startTime} onChange={(e) => set("startTime", e.target.value)} className={inputClass} />
            </label>
            <label className="block space-y-1.5">
              <span className="block text-[13px] font-medium text-ink-2">To (IST)</span>
              <input type="time" value={form.endTime} onChange={(e) => set("endTime", e.target.value)} className={inputClass} />
            </label>
          </div>
          <label className="flex items-center gap-3 text-[14px] text-ink-2">
            <input type="checkbox" checked={form.isActive} onChange={(e) => set("isActive", e.target.checked)} className="h-4 w-4 accent-[#0B1233]" />
            Campaign is on
          </label>
        </div>
        <div className="flex justify-end gap-3 border-t border-hairline px-6 py-4">
          <button onClick={onClose} className="rounded-full border border-hairline bg-ivory px-4 py-2 text-[13px] font-medium text-ink-2 hover:border-champagne">
            Cancel
          </button>
          <button
            onClick={save}
            disabled={busy || !form.title.trim() || !form.bannerText.trim() || !(form.endTime > form.startTime)}
            className="inline-flex items-center gap-2 rounded-full bg-midnight px-5 py-2 text-[13px] font-semibold text-champagne-light hover:bg-midnight-2 disabled:opacity-40"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />} Save
          </button>
        </div>
      </div>
    </div>
  );
}
