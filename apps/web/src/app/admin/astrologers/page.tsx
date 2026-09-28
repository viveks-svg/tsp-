"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Ban, Check, Copy, KeyRound, RotateCcw, Loader2, Mail, Pencil, Plus, Radio, ShieldAlert, ShieldCheck, Sparkles, X } from "lucide-react";
import { ApiError, apiClient } from "@/lib/http/client";
import { ENDPOINTS } from "@/lib/constants/http/endpoints";
import { cn } from "@/lib/cn";
import { PageHeader, Panel, Skeleton } from "@/features/admin/components/primitives";
import { formatINR } from "@/features/admin/lib/format";

interface Astrologer {
  id: string;
  userId: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  bio: string;
  pricingPerMin: number;
  status: "PENDING" | "APPROVED" | "REJECTED";
  isAvailable: boolean;
  loginActive: boolean;
  twoStepEnabled: boolean;
  consultations: number;
  takesLiveQueue: boolean;
  createdAt: string;
}

type Credentials = { title: string; email: string | null; password?: string; emailedTo?: string };

export default function AstrologersPage() {
  const [items, setItems] = useState<Astrologer[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<Astrologer | null>(null);
  const [resetting, setResetting] = useState<Astrologer | null>(null);
  const [credentials, setCredentials] = useState<Credentials | null>(null);

  const load = useCallback(() => {
    apiClient
      .get<Astrologer[]>(ENDPOINTS.ADMIN.ASTROLOGERS)
      .then(setItems)
      .catch((e) => setError(e instanceof Error ? e.message : "Could not load astrologers"));
  }, []);

  useEffect(load, [load]);

  return (
    <div className="mx-auto max-w-[1320px] space-y-8 px-5 py-8 md:px-10 md:py-12">
      <PageHeader
        eyebrow="People"
        title="Astrologers"
        description="Astrologers sign in to their own panel and see only their own clients and sessions. Add them here, keep their profile current, and reset their password when they need it."
        actions={
          <button
            onClick={() => setAdding(true)}
            className="inline-flex items-center gap-2 rounded-full bg-midnight px-5 py-2.5 text-[13px] font-semibold text-champagne-light shadow-[0_10px_24px_-12px_rgba(11,18,51,0.7)] transition hover:bg-midnight-2"
          >
            <Plus className="h-4 w-4" /> Add astrologer
          </button>
        }
      />

      {error && <div className="rounded-xl border border-garnet/20 bg-garnet/5 px-5 py-4 text-sm text-garnet">{error}</div>}

      {!items && !error ? (
        <Skeleton className="h-64" />
      ) : items && items.length === 0 ? (
        <Panel>
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <span className="flex h-11 w-11 items-center justify-center rounded-full border border-hairline bg-parchment text-champagne">
              <Sparkles className="h-5 w-5" />
            </span>
            <p className="text-sm text-ink-3">No astrologers yet. Add Dr. Pradeep to open bookings.</p>
          </div>
        </Panel>
      ) : (
        items && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {items.map((a) => (
              <AstrologerCard
                key={a.id}
                a={a}
                onEdit={() => setEditing(a)}
                onReset={() => setResetting(a)}
                onResetTwoStep={async () => {
                  if (!confirm(`Reset ${a.name}'s two-step verification? Use this when they've lost their phone — they set it up again at next sign-in.`)) return;
                  try {
                    await apiClient.post(`${ENDPOINTS.ADMIN.ASTROLOGER(a.id)}/reset-two-step`, {});
                    setItems((list) => list?.map((x) => (x.id === a.id ? { ...x, twoStepEnabled: false } : x)) ?? list);
                    toast.success("Two-step verification reset.");
                  } catch (e) {
                    toast.error(e instanceof Error ? e.message : "Could not reset");
                  }
                }}
                onToggleActive={async () => {
                  const deactivating = a.status !== "REJECTED";
                  if (
                    deactivating &&
                    !confirm(`Deactivate ${a.name}? They are signed out, can't sign in, and are hidden from clients. You can reactivate them later.`)
                  )
                    return;
                  try {
                    setItems(await apiClient.post<Astrologer[]>(`${ENDPOINTS.ADMIN.ASTROLOGER(a.id)}/${deactivating ? "deactivate" : "reactivate"}`));
                    toast.success(deactivating ? "Astrologer deactivated." : "Astrologer reactivated.");
                  } catch (e) {
                    toast.error(e instanceof Error ? e.message : "Could not update");
                  }
                }}
              />
            ))}
          </div>
        )
      )}

      {adding && (
        <AddAstrologerDialog
          onClose={() => setAdding(false)}
          onCreated={(c) => {
            setAdding(false);
            setCredentials(c);
            load();
          }}
        />
      )}
      {editing && (
        <EditAstrologerDialog
          a={editing}
          onClose={() => setEditing(null)}
          onSaved={(list) => {
            setEditing(null);
            setItems(list);
            toast.success("Profile saved.");
          }}
        />
      )}
      {resetting && (
        <ResetPasswordDialog
          a={resetting}
          onClose={() => setResetting(null)}
          onDone={(c) => {
            setResetting(null);
            setCredentials(c);
          }}
        />
      )}
      {credentials && <CredentialsDialog c={credentials} onClose={() => setCredentials(null)} />}
    </div>
  );
}

// ── Card ──────────────────────────────────────────────────────────────────────

function AstrologerCard({
  a,
  onEdit,
  onReset,
  onResetTwoStep,
  onToggleActive,
}: {
  a: Astrologer;
  onEdit: () => void;
  onReset: () => void;
  onResetTwoStep: () => void;
  onToggleActive: () => void;
}) {
  const initials = (a.name || a.email || "A")
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
  return (
    <Panel bodyClassName="pt-6">
      <div className="flex items-start gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-champagne/50 bg-midnight font-cinzel text-[15px] font-semibold text-champagne-light">
          {initials}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-playfair text-xl font-semibold text-ink">{a.name || "Unnamed"}</h2>
            <StatusPill a={a} />
            {a.takesLiveQueue && (
              <span className="inline-flex items-center gap-1 rounded-full border border-champagne/40 bg-champagne/10 px-2.5 py-0.5 text-[11px] font-medium text-bronze">
                <Radio className="h-3 w-3" /> Takes the live queue
              </span>
            )}
          </div>
          <p className="truncate text-[13px] text-ink-3">
            {a.email}
            {a.phone && ` · ${a.phone}`}
          </p>
          {a.loginActive && (
            <p className={cn("mt-1 inline-flex items-center gap-1 text-[12px]", a.twoStepEnabled ? "text-emerald-deep" : "text-ink-3")}>
              <ShieldCheck className="h-3.5 w-3.5" /> Two-step verification {a.twoStepEnabled ? "on" : "off"}
            </p>
          )}
        </div>
      </div>

      <dl className="mt-5 grid grid-cols-3 gap-4 border-t border-hairline pt-5">
        <Stat label="Rate" value={`${formatINR(a.pricingPerMin)}/min`} />
        <Stat label="Consultations" value={String(a.consultations)} />
        <Stat label="Taking calls" value={a.isAvailable ? "Yes" : "Paused"} />
      </dl>

      {a.bio && <p className="mt-4 line-clamp-2 text-[13px] text-ink-2">{a.bio}</p>}

      <div className="mt-5 flex flex-wrap gap-2">
        <button onClick={onEdit} className={secondaryButton}>
          <Pencil className="h-3.5 w-3.5" /> Edit profile
        </button>
        <button onClick={onReset} className={secondaryButton}>
          <KeyRound className="h-3.5 w-3.5" /> Reset password
        </button>
        {a.twoStepEnabled && (
          <button onClick={onResetTwoStep} className={secondaryButton} title="For a lost phone">
            <ShieldCheck className="h-3.5 w-3.5" /> Reset two-step
          </button>
        )}
        <button
          onClick={onToggleActive}
          className={cn(secondaryButton, a.status === "REJECTED" ? "" : "hover:border-garnet/40 hover:text-garnet")}
        >
          {a.status === "REJECTED" ? <RotateCcw className="h-3.5 w-3.5" /> : <Ban className="h-3.5 w-3.5" />}
          {a.status === "REJECTED" ? "Reactivate" : "Deactivate"}
        </button>
      </div>
    </Panel>
  );
}

function StatusPill({ a }: { a: Astrologer }) {
  if (!a.loginActive)
    return <span className="rounded-full bg-garnet/10 px-2.5 py-0.5 text-[11px] font-medium text-garnet">No astrologer login</span>;
  const map = {
    APPROVED: "bg-emerald-deep/10 text-emerald-deep",
    PENDING: "bg-champagne/15 text-bronze",
    REJECTED: "bg-garnet/10 text-garnet",
  } as const;
  const label = { APPROVED: "Active", PENDING: "Pending", REJECTED: "Deactivated" }[a.status];
  return <span className={cn("rounded-full px-2.5 py-0.5 text-[11px] font-medium", map[a.status])}>{label}</span>;
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[12px] text-ink-3">{label}</dt>
      <dd className="font-inter text-[15px] font-semibold text-ink tabular-nums">{value}</dd>
    </div>
  );
}

// ── Dialogs ───────────────────────────────────────────────────────────────────

const inputClass =
  "w-full rounded-xl border border-hairline bg-ivory px-3.5 py-2.5 text-[14px] text-ink outline-none transition focus:border-champagne focus:ring-2 focus:ring-champagne/20";
const primaryButton =
  "inline-flex items-center justify-center gap-2 rounded-full bg-midnight px-5 py-2.5 text-[13px] font-semibold text-champagne-light transition hover:bg-midnight-2 disabled:opacity-40";
const secondaryButton =
  "inline-flex items-center gap-1.5 rounded-full border border-hairline bg-ivory px-3.5 py-2 text-[12px] font-medium text-ink-2 transition hover:border-champagne hover:text-ink";

function Dialog({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-midnight/50 p-0 backdrop-blur-[2px] sm:items-center sm:p-6" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[92vh] w-full overflow-y-auto rounded-t-2xl border border-hairline bg-ivory shadow-[0_30px_80px_-20px_rgba(11,18,51,0.5)] sm:max-w-lg sm:rounded-2xl"
      >
        <div className="flex items-center justify-between border-b border-hairline px-6 py-4">
          <h2 className="font-playfair text-xl font-semibold text-ink">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="rounded-lg p-2 text-ink-3 hover:bg-parchment hover:text-ink">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-5 px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="block text-[13px] font-medium text-ink-2">{label}</span>
      {children}
      {hint && <span className="block text-[12px] text-ink-3">{hint}</span>}
    </label>
  );
}

function AddAstrologerDialog({ onClose, onCreated }: { onClose: () => void; onCreated: (c: Credentials) => void }) {
  const [form, setForm] = useState({ name: "", email: "", phone: "", pricingPerMin: "", bio: "", sendSetupEmail: true });
  const [existing, setExisting] = useState<{ role: string; message: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof form, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (convertExisting = false) => {
    setBusy(true);
    try {
      const res = await apiClient.post<{ email: string; temporaryPassword: string; setupEmailSent: boolean }>(
        ENDPOINTS.ADMIN.ASTROLOGERS,
        {
          name: form.name,
          email: form.email,
          ...(form.phone && { phone: form.phone }),
          ...(form.bio && { bio: form.bio }),
          pricingPerMin: Number(form.pricingPerMin),
          sendSetupEmail: form.sendSetupEmail,
          convertExisting,
        },
      );
      onCreated({
        title: `${form.name} can now sign in`,
        email: res.email,
        password: res.temporaryPassword,
        emailedTo: res.setupEmailSent ? res.email : undefined,
      });
    } catch (e) {
      const body = e instanceof ApiError ? (e.body as { code?: string; role?: string; message?: string }) : null;
      if (body?.code === "ACCOUNT_EXISTS") {
        setExisting({ role: body.role ?? "USER", message: body.message ?? (e as Error).message });
      } else {
        toast.error(e instanceof Error ? e.message : "Could not add the astrologer");
      }
    } finally {
      setBusy(false);
    }
  };

  const valid = form.name.trim().length >= 2 && /\S+@\S+\.\S+/.test(form.email) && form.pricingPerMin !== "" && Number(form.pricingPerMin) >= 0;

  return (
    <Dialog title="Add astrologer" onClose={onClose}>
      <Field label="Full name">
        <input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Dr. Pradeep Sharma" className={inputClass} />
      </Field>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Email" hint="Their sign-in email.">
          <input
            type="email"
            value={form.email}
            onChange={(e) => {
              set("email", e.target.value);
              setExisting(null);
            }}
            className={inputClass}
          />
        </Field>
        <Field label="Phone (optional)">
          <input value={form.phone} inputMode="numeric" maxLength={10} onChange={(e) => set("phone", e.target.value.replace(/\D/g, ""))} className={inputClass} />
        </Field>
      </div>
      <Field label="Rate per minute (₹)" hint="Charged for chat and call consultations.">
        <input type="number" min={0} step="1" value={form.pricingPerMin} onChange={(e) => set("pricingPerMin", e.target.value)} className={inputClass} />
      </Field>
      <Field label="Short bio (optional)">
        <textarea rows={3} value={form.bio} onChange={(e) => set("bio", e.target.value)} className={cn(inputClass, "resize-none")} />
      </Field>
      <label className="flex items-start gap-3 text-[13px] text-ink-2">
        <input type="checkbox" checked={form.sendSetupEmail} onChange={(e) => set("sendSetupEmail", e.target.checked)} className="mt-0.5 h-4 w-4 accent-[#0B1233]" />
        <span>
          Email them a link to choose their own password <span className="text-ink-3">(valid for 1 hour)</span>. A temporary password is shown to you either way.
        </span>
      </label>

      {existing && (
        <div className="flex gap-3 rounded-xl border border-garnet/30 bg-garnet/5 px-4 py-3 text-[13px] text-ink-2">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-garnet" />
          <div className="space-y-3">
            <p>{existing.message} Their password will be replaced with a new temporary one and they will be signed out.</p>
            <button onClick={() => submit(true)} disabled={busy} className={cn(primaryButton, "bg-garnet hover:bg-garnet/90 text-white")}>
              {busy && <Loader2 className="h-4 w-4 animate-spin" />} Convert to astrologer
            </button>
          </div>
        </div>
      )}

      {!existing && (
        <div className="flex justify-end gap-3 pt-1">
          <button onClick={onClose} className={secondaryButton}>
            Cancel
          </button>
          <button onClick={() => submit(false)} disabled={!valid || busy} className={primaryButton}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" />} Create login
          </button>
        </div>
      )}
    </Dialog>
  );
}

function EditAstrologerDialog({ a, onClose, onSaved }: { a: Astrologer; onClose: () => void; onSaved: (list: Astrologer[]) => void }) {
  const [form, setForm] = useState({
    name: a.name ?? "",
    phone: a.phone ?? "",
    pricingPerMin: String(a.pricingPerMin),
    bio: a.bio,
    isAvailable: a.isAvailable,
  });
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    try {
      onSaved(
        await apiClient.patch<Astrologer[]>(ENDPOINTS.ADMIN.ASTROLOGER(a.id), {
          name: form.name,
          ...(form.phone && { phone: form.phone }),
          bio: form.bio,
          pricingPerMin: Number(form.pricingPerMin),
          isAvailable: form.isAvailable,
        }),
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog title={`Edit ${a.name || "astrologer"}`} onClose={onClose}>
      <Field label="Full name">
        <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} />
      </Field>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Phone">
          <input value={form.phone} inputMode="numeric" maxLength={10} onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, "") })} className={inputClass} />
        </Field>
        <Field label="Rate per minute (₹)">
          <input type="number" min={0} value={form.pricingPerMin} onChange={(e) => setForm({ ...form, pricingPerMin: e.target.value })} className={inputClass} />
        </Field>
      </div>
      <Field label="Bio">
        <textarea rows={4} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} className={cn(inputClass, "resize-none")} />
      </Field>
      <label className="flex items-center gap-3 text-[13px] text-ink-2">
        <input type="checkbox" checked={form.isAvailable} onChange={(e) => setForm({ ...form, isAvailable: e.target.checked })} className="h-4 w-4 accent-[#0B1233]" />
        Taking chat and call consultations
      </label>
      <div className="flex justify-end gap-3 pt-1">
        <button onClick={onClose} className={secondaryButton}>
          Cancel
        </button>
        <button onClick={save} disabled={busy || form.name.trim().length < 2} className={primaryButton}>
          {busy && <Loader2 className="h-4 w-4 animate-spin" />} Save
        </button>
      </div>
    </Dialog>
  );
}

function ResetPasswordDialog({ a, onClose, onDone }: { a: Astrologer; onClose: () => void; onDone: (c: Credentials) => void }) {
  const [busy, setBusy] = useState<"temporary" | "email" | null>(null);

  const reset = async (mode: "temporary" | "email") => {
    setBusy(mode);
    try {
      const res = await apiClient.post<{ email?: string; sentTo?: string; temporaryPassword?: string }>(
        ENDPOINTS.ADMIN.ASTROLOGER_RESET_PASSWORD(a.id),
        { mode },
      );
      onDone(
        mode === "email"
          ? { title: "Set-password link sent", email: res.sentTo ?? a.email, emailedTo: res.sentTo }
          : { title: `New password for ${a.name || "astrologer"}`, email: res.email ?? a.email, password: res.temporaryPassword },
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not reset the password");
    } finally {
      setBusy(null);
    }
  };

  return (
    <Dialog title="Reset password" onClose={onClose}>
      <p className="text-[14px] text-ink-2">
        For <strong className="font-semibold text-ink">{a.name}</strong> ({a.email}).
      </p>
      <button onClick={() => reset("temporary")} disabled={!!busy} className="flex w-full items-start gap-4 rounded-xl border border-hairline bg-parchment/60 p-4 text-left transition hover:border-champagne">
        <KeyRound className="mt-0.5 h-5 w-5 shrink-0 text-bronze" />
        <span>
          <span className="block font-medium text-ink">Create a temporary password</span>
          <span className="block text-[13px] text-ink-3">Shown to you once — share it privately. Signs them out everywhere now.</span>
        </span>
        {busy === "temporary" && <Loader2 className="ml-auto h-4 w-4 animate-spin" />}
      </button>
      <button onClick={() => reset("email")} disabled={!!busy} className="flex w-full items-start gap-4 rounded-xl border border-hairline bg-parchment/60 p-4 text-left transition hover:border-champagne">
        <Mail className="mt-0.5 h-5 w-5 shrink-0 text-bronze" />
        <span>
          <span className="block font-medium text-ink">Email a set-password link</span>
          <span className="block text-[13px] text-ink-3">They choose their own password (link works for 1 hour) and are signed out everywhere once they do.</span>
        </span>
        {busy === "email" && <Loader2 className="ml-auto h-4 w-4 animate-spin" />}
      </button>
    </Dialog>
  );
}

function CredentialsDialog({ c, onClose }: { c: Credentials; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    if (!c.password) return;
    await navigator.clipboard.writeText(c.password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <Dialog title={c.title} onClose={onClose}>
      {c.password && (
        <>
          <div className="space-y-3 rounded-xl border border-hairline bg-parchment/60 p-4">
            <div>
              <p className="text-[12px] text-ink-3">Sign-in email</p>
              <p className="font-medium text-ink">{c.email}</p>
            </div>
            <div>
              <p className="text-[12px] text-ink-3">Temporary password</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 rounded-lg border border-hairline bg-ivory px-3 py-2 font-mono text-[15px] tracking-wide text-ink">{c.password}</code>
                <button onClick={copy} className={secondaryButton} aria-label="Copy password">
                  {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
            </div>
          </div>
          <p className="flex gap-2 text-[13px] text-ink-2">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-bronze" />
            This password is shown only now. Share it privately; they can change it with “Forgot password” after signing in.
          </p>
        </>
      )}
      {c.emailedTo && (
        <p className="flex gap-2 text-[13px] text-ink-2">
          <Mail className="mt-0.5 h-4 w-4 shrink-0 text-bronze" />A link to set their own password was emailed to {c.emailedTo}. It works for 1 hour.
        </p>
      )}
      <div className="flex justify-end">
        <button onClick={onClose} className={primaryButton}>
          Done
        </button>
      </div>
    </Dialog>
  );
}
