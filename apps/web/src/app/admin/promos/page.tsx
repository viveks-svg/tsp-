"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowRight, Loader2, Pencil, Plus, Sparkles, Trash2, X } from "lucide-react";
import { apiClient } from "@/lib/http/client";
import { cn } from "@/lib/cn";
import { PageHeader, Panel, Skeleton } from "@/features/admin/components/primitives";
import { Badge } from "@/features/admin/components/records";
import { formatDateTime } from "@/features/admin/lib/format";

interface Promo {
  id: string;
  title: string;
  description: string;
  imageUrl: string | null;
  actionUrl: string | null;
  actionText: string | null;
  isActive: boolean;
  expiresAt: string | null;
  createdAt: string;
}

type Form = { title: string; description: string; imageUrl: string; actionUrl: string; actionText: string; expiresAt: string; isActive: boolean };

const EMPTY: Form = { title: "", description: "", imageUrl: "", actionUrl: "/book", actionText: "Book now", expiresAt: "", isActive: true };

const live = (p: Promo) => p.isActive && (!p.expiresAt || new Date(p.expiresAt) > new Date());

const inputClass =
  "w-full rounded-xl border border-hairline bg-ivory px-3.5 py-2.5 text-[14px] text-ink outline-none transition focus:border-champagne focus:ring-2 focus:ring-champagne/20";

/** The popup visitors see in the bottom corner of the website. */
export default function PromosPage() {
  const [promos, setPromos] = useState<Promo[] | null>(null);
  const [editing, setEditing] = useState<Promo | "new" | null>(null);

  const load = useCallback(() => {
    apiClient
      .get<Promo[]>("/admin/promos")
      .then(setPromos)
      .catch((e) => toast.error(e instanceof Error ? e.message : "Could not load promos"));
  }, []);
  useEffect(load, [load]);

  const toggle = async (p: Promo) => {
    try {
      await apiClient.patch(`/admin/promos/${p.id}`, { isActive: !p.isActive });
      toast.success(p.isActive ? "Taken down from the website." : "Showing on the website.");
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not update");
    }
  };

  const remove = async (p: Promo) => {
    if (!confirm(`Delete “${p.title}”?`)) return;
    try {
      await apiClient.delete(`/admin/promos/${p.id}`);
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not delete");
    }
  };

  return (
    <div className="mx-auto max-w-[1320px] space-y-8 px-5 py-8 md:px-10 md:py-12">
      <PageHeader
        eyebrow="Growth"
        title="Promo popups"
        description="A card that appears in the corner of the website for every visitor — for an offer, an event or news. Changes show to visitors immediately."
        actions={
          <button
            onClick={() => setEditing("new")}
            className="inline-flex items-center gap-2 rounded-full bg-midnight px-5 py-2.5 text-[13px] font-semibold text-champagne-light shadow-[0_10px_24px_-12px_rgba(11,18,51,0.7)] transition hover:bg-midnight-2"
          >
            <Plus className="h-4 w-4" /> New popup
          </button>
        }
      />

      {!promos ? (
        <Skeleton className="h-64" />
      ) : promos.length === 0 ? (
        <Panel>
          <p className="py-10 text-center text-[14px] text-ink-3">No popups yet.</p>
        </Panel>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {promos.map((p) => (
            <Panel key={p.id} bodyClassName="pt-6">
              <div className="flex flex-col gap-5 sm:flex-row">
                <div className="w-full shrink-0 sm:w-[220px]">
                  <PromoCard form={{ ...EMPTY, ...p, imageUrl: p.imageUrl ?? "", actionUrl: p.actionUrl ?? "", actionText: p.actionText ?? "", expiresAt: "" }} compact />
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    {live(p) ? <Badge tone="good">Showing now</Badge> : p.isActive ? <Badge tone="neutral">Ended</Badge> : <Badge tone="neutral">Off</Badge>}
                  </div>
                  <p className="text-[13px] text-ink-3">
                    Created {formatDateTime(p.createdAt)}
                    {p.expiresAt && ` · ends ${formatDateTime(p.expiresAt)}`}
                  </p>
                  <div className="mt-auto flex flex-wrap gap-2">
                    <button onClick={() => toggle(p)} className="rounded-full border border-hairline bg-ivory px-3.5 py-1.5 text-[12px] font-medium text-ink-2 hover:border-champagne">
                      {p.isActive ? "Take down" : "Show"}
                    </button>
                    <button onClick={() => setEditing(p)} className="inline-flex items-center gap-1.5 rounded-full border border-hairline bg-ivory px-3.5 py-1.5 text-[12px] font-medium text-ink-2 hover:border-champagne">
                      <Pencil className="h-3.5 w-3.5" /> Edit
                    </button>
                    <button onClick={() => remove(p)} aria-label="Delete" className="rounded-lg p-2 text-ink-3 hover:bg-garnet/10 hover:text-garnet">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </Panel>
          ))}
        </div>
      )}

      {editing && (
        <PromoEditor
          promo={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            load();
          }}
        />
      )}
    </div>
  );
}

/** Mirrors the popup on the website (components/campaign/PromoPopup.tsx). */
function PromoCard({ form, compact }: { form: Form; compact?: boolean }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[#C8A04A]/30 bg-[#1C1A17] font-poppins shadow-[0_20px_40px_rgba(0,0,0,0.3)]">
      <div className={cn("relative w-full bg-[#0F0E0C]", compact ? "h-20" : "h-32")}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={form.imageUrl || "/promo_popup_bg.png"} alt="" className="h-full w-full object-cover opacity-80" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1C1A17] to-transparent" />
      </div>
      <div className={compact ? "p-4 pt-3" : "p-6 pt-5"}>
        <div className="mb-2 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-[#C8A04A]" />
          <span className="text-[10px] font-bold tracking-wider text-[#C8A04A] uppercase">Special Announcement</span>
        </div>
        <h3 className={cn("mb-2 leading-tight font-bold text-white", compact ? "text-[14px]" : "text-lg")}>{form.title || "Title"}</h3>
        <p className={cn("leading-relaxed text-white/70", compact ? "line-clamp-2 text-[12px]" : "mb-5 text-sm")}>{form.description || "Description"}</p>
        {!compact && form.actionUrl && (
          <span className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#C8A04A] to-[#A6832E] py-2.5 text-sm font-semibold text-white">
            {form.actionText || "Learn More"} <ArrowRight className="h-4 w-4" />
          </span>
        )}
      </div>
    </div>
  );
}

function PromoEditor({ promo, onClose, onSaved }: { promo: Promo | null; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState<Form>(
    promo
      ? {
          title: promo.title,
          description: promo.description,
          imageUrl: promo.imageUrl ?? "",
          actionUrl: promo.actionUrl ?? "",
          actionText: promo.actionText ?? "",
          // datetime-local wants local time without zone
          expiresAt: promo.expiresAt ? new Date(new Date(promo.expiresAt).getTime() - new Date().getTimezoneOffset() * 60_000).toISOString().slice(0, 16) : "",
          isActive: promo.isActive,
        }
      : EMPTY,
  );
  const [busy, setBusy] = useState(false);
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    setBusy(true);
    const body = {
      title: form.title,
      description: form.description,
      imageUrl: form.imageUrl.trim(),
      actionUrl: form.actionUrl.trim(),
      actionText: form.actionText.trim(),
      // An empty string clears a saved end date (the server stores it as "no end date").
      expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : promo ? "" : undefined,
      isActive: form.isActive,
    };
    try {
      if (promo) await apiClient.patch(`/admin/promos/${promo.id}`, body);
      else await apiClient.post("/admin/promos", body);
      toast.success(form.isActive ? "Saved — visitors see it now." : "Saved.");
      onSaved();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save");
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-midnight/50 backdrop-blur-[2px] sm:items-center sm:p-6" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className="max-h-[94vh] w-full overflow-y-auto rounded-t-2xl border border-hairline bg-ivory shadow-[0_30px_80px_-20px_rgba(11,18,51,0.5)] sm:max-w-4xl sm:rounded-2xl"
      >
        <div className="flex items-center justify-between border-b border-hairline px-6 py-4">
          <h2 className="font-playfair text-xl font-semibold text-ink">{promo ? "Edit popup" : "New popup"}</h2>
          <button onClick={onClose} aria-label="Close" className="rounded-lg p-2 text-ink-3 hover:bg-parchment hover:text-ink">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="grid grid-cols-1 gap-8 px-6 py-6 md:grid-cols-[1fr_340px]">
          <div className="space-y-4">
            <label className="block space-y-1.5">
              <span className="block text-[13px] font-medium text-ink-2">Title</span>
              <input value={form.title} maxLength={80} onChange={(e) => set("title", e.target.value)} className={inputClass} />
            </label>
            <label className="block space-y-1.5">
              <span className="block text-[13px] font-medium text-ink-2">Message</span>
              <textarea rows={3} maxLength={400} value={form.description} onChange={(e) => set("description", e.target.value)} className={cn(inputClass, "resize-none")} />
            </label>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="block space-y-1.5">
                <span className="block text-[13px] font-medium text-ink-2">Button text</span>
                <input value={form.actionText} maxLength={30} onChange={(e) => set("actionText", e.target.value)} className={inputClass} />
              </label>
              <label className="block space-y-1.5">
                <span className="block text-[13px] font-medium text-ink-2">Button goes to</span>
                <input value={form.actionUrl} onChange={(e) => set("actionUrl", e.target.value)} placeholder="/book or https://…" className={inputClass} />
              </label>
            </div>
            <label className="block space-y-1.5">
              <span className="block text-[13px] font-medium text-ink-2">Image link (optional)</span>
              <input value={form.imageUrl} onChange={(e) => set("imageUrl", e.target.value)} placeholder="https://…" className={inputClass} />
            </label>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="block space-y-1.5">
                <span className="block text-[13px] font-medium text-ink-2">Ends (optional)</span>
                <input type="datetime-local" value={form.expiresAt} onChange={(e) => set("expiresAt", e.target.value)} className={inputClass} />
              </label>
              <label className="flex items-center gap-3 self-end pb-3 text-[14px] text-ink-2">
                <input type="checkbox" checked={form.isActive} onChange={(e) => set("isActive", e.target.checked)} className="h-4 w-4 accent-[#0B1233]" />
                Show on the website
              </label>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-[12px] text-ink-3">Preview</p>
            <PromoCard form={form} />
          </div>
        </div>
        <div className="flex justify-end gap-3 border-t border-hairline px-6 py-4">
          <button onClick={onClose} className="rounded-full border border-hairline bg-ivory px-4 py-2 text-[13px] font-medium text-ink-2 hover:border-champagne">
            Cancel
          </button>
          <button
            onClick={save}
            disabled={busy || form.title.trim().length < 2 || form.description.trim().length < 2}
            className="inline-flex items-center gap-2 rounded-full bg-midnight px-5 py-2 text-[13px] font-semibold text-champagne-light hover:bg-midnight-2 disabled:opacity-40"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />} Save
          </button>
        </div>
      </div>
    </div>
  );
}
