"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, KeyRound, Loader2, PlugZap, RotateCcw, Save, ShieldAlert } from "lucide-react";
import { apiClient } from "@/lib/http/client";
import { cn } from "@/lib/cn";
import { PageHeader, Panel, Skeleton } from "@/features/admin/components/primitives";
import { Badge } from "@/features/admin/components/records";
import { formatINR } from "@/features/admin/lib/format";

interface Finance {
  commissionPercent: number;
  managerApprovalLimit: number;
  bookingEarnings: boolean;
}

interface Razorpay {
  configured: boolean;
  source: "ADMIN" | "ENV" | null;
  mode: "TEST" | "LIVE" | null;
  keyId: string | null;
  keySecret: string | null;
  webhookSecretSet: boolean;
  canSave: boolean;
}

const inputClass =
  "w-full rounded-xl border border-hairline bg-ivory px-3.5 py-2.5 text-[14px] text-ink outline-none transition focus:border-champagne focus:ring-2 focus:ring-champagne/20";

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-[1100px] space-y-8 px-5 py-8 md:px-10 md:py-12">
      <PageHeader eyebrow="The House" title="Settings" description="Money rules, the payment gateway and team security. Only Super Admins can change these; every change is kept in the Activity log." />
      <FinancePanel />
      <RazorpayPanel />
      <SecurityPanel />
    </div>
  );
}

function FinancePanel() {
  const [saved, setSaved] = useState<Finance | null>(null);
  const [form, setForm] = useState<Finance | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    apiClient
      .get<Finance>("/admin/settings/finance")
      .then((f) => {
        setSaved(f);
        setForm(f);
      })
      .catch((e) => toast.error(e instanceof Error ? e.message : "Could not load settings"));
  }, []);

  const dirty = JSON.stringify(saved) !== JSON.stringify(form);
  const save = async () => {
    if (!form) return;
    setBusy(true);
    try {
      const f = await apiClient.put<Finance>("/admin/settings/finance", {
        commissionPercent: Number(form.commissionPercent),
        managerApprovalLimit: Number(form.managerApprovalLimit),
        bookingEarnings: form.bookingEarnings,
      });
      setSaved(f);
      setForm(f);
      toast.success("Money rules saved. They apply from now on.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save");
    } finally {
      setBusy(false);
    }
  };

  if (!form) return <Skeleton className="h-72" />;
  const example = 1000;
  const share = example * (1 - Number(form.commissionPercent || 0) / 100);

  return (
    <Panel
      title="Money rules"
      subtitle="Apply to new consultations, bookings and requests — past ones are not changed"
      action={
        <button
          onClick={save}
          disabled={!dirty || busy}
          className="inline-flex shrink-0 items-center gap-2 rounded-full bg-midnight px-4 py-2 text-[13px] font-semibold text-champagne-light hover:bg-midnight-2 disabled:opacity-40"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} {dirty ? "Save" : "Saved"}
        </button>
      }
    >
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <label className="block space-y-1.5">
          <span className="block text-[13px] font-medium text-ink-2">Platform commission (%)</span>
          <input
            type="number"
            min={0}
            max={100}
            step="0.5"
            value={form.commissionPercent}
            onChange={(e) => setForm({ ...form, commissionPercent: e.target.value as unknown as number })}
            className={inputClass}
          />
          <span className="block text-[12px] text-ink-3">
            On a {formatINR(example)} consultation the astrologer earns {formatINR(share)} and TSP keeps {formatINR(example - share)}.
          </span>
        </label>
        <label className="block space-y-1.5">
          <span className="block text-[13px] font-medium text-ink-2">Approval needed above (₹)</span>
          <input
            type="number"
            min={0}
            step="500"
            value={form.managerApprovalLimit}
            onChange={(e) => setForm({ ...form, managerApprovalLimit: e.target.value as unknown as number })}
            className={inputClass}
          />
          <span className="block text-[12px] text-ink-3">
            Managers refund, adjust wallets and record payouts up to this amount in total per client or order within 24 hours; above it a Super Admin approves.
          </span>
        </label>
      </div>
      <label className="mt-6 flex items-start justify-between gap-4 rounded-xl border border-hairline bg-parchment/60 px-5 py-4">
        <span>
          <span className="block text-[14px] font-medium text-ink">Booked sessions count towards the astrologer’s earnings</span>
          <span className="block text-[13px] text-ink-3">
            When a client pays for a session, the astrologer taking bookings earns it less commission. Turn off if bookings are TSP’s alone.
          </span>
        </span>
        <input
          type="checkbox"
          checked={form.bookingEarnings}
          onChange={(e) => setForm({ ...form, bookingEarnings: e.target.checked })}
          className="mt-1 h-5 w-5 shrink-0 accent-[#0B1233]"
        />
      </label>
    </Panel>
  );
}

function RazorpayPanel() {
  const [rp, setRp] = useState<Razorpay | null>(null);
  const [keyId, setKeyId] = useState("");
  const [keySecret, setKeySecret] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");
  const [busy, setBusy] = useState<"save" | "test" | "clear" | null>(null);

  const adopt = (r: Razorpay) => {
    setRp(r);
    setKeyId(r.keyId ?? "");
    setKeySecret("");
    setWebhookSecret("");
  };

  useEffect(() => {
    apiClient
      .get<Razorpay>("/admin/settings/razorpay")
      .then(adopt)
      .catch((e) => toast.error(e instanceof Error ? e.message : "Could not load Razorpay settings"));
  }, []);

  const goingLive = keyId.startsWith("rzp_live_") && rp?.mode !== "LIVE";

  const save = async () => {
    if (goingLive && !confirm("Switch to LIVE keys? Clients will be charged real money from now on.")) return;
    setBusy("save");
    try {
      adopt(
        await apiClient.put<Razorpay>("/admin/settings/razorpay", {
          keyId: keyId.trim(),
          ...(keySecret && { keySecret }),
          ...(webhookSecret && { webhookSecret }),
        }),
      );
      toast.success("Razorpay keys saved and verified. Payments use them from now on.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save");
    } finally {
      setBusy(null);
    }
  };

  const test = async () => {
    setBusy("test");
    try {
      const r = await apiClient.post<{ ok: boolean; message: string }>("/admin/settings/razorpay/test");
      (r.ok ? toast.success : toast.error)(r.message);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not test the connection");
    } finally {
      setBusy(null);
    }
  };

  const clear = async () => {
    if (!confirm("Stop using these keys and go back to the server's configured keys?")) return;
    setBusy("clear");
    try {
      adopt(await apiClient.delete<Razorpay>("/admin/settings/razorpay"));
      toast.success("Using the server's keys again.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not remove the keys");
    } finally {
      setBusy(null);
    }
  };

  if (!rp) return <Skeleton className="h-80" />;

  return (
    <Panel title="Razorpay" subtitle="The account that takes payments for sessions, wallet top-ups and the shop">
      <div className="mb-6 flex flex-wrap items-center gap-3 rounded-xl border border-hairline bg-parchment/60 px-5 py-4 text-[14px]">
        {rp.configured ? (
          <>
            <CheckCircle2 className="h-5 w-5 text-emerald-deep" />
            <span className="text-ink-2">
              Using <code className="font-mono text-[13px] text-ink">{rp.keyId}</code>
              {rp.source === "ENV" ? " from the server’s configuration" : " saved here"}.
            </span>
            <Badge tone={rp.mode === "LIVE" ? "good" : "waiting"}>{rp.mode === "LIVE" ? "Live — real payments" : "Test mode"}</Badge>
            {!rp.webhookSecretSet && <Badge tone="bad">No webhook secret</Badge>}
          </>
        ) : (
          <>
            <ShieldAlert className="h-5 w-5 text-garnet" /> <span className="text-garnet">Online payments are not configured.</span>
          </>
        )}
        <span className="ml-auto flex gap-2">
          <button
            onClick={test}
            disabled={!!busy || !rp.configured}
            className="inline-flex items-center gap-1.5 rounded-full border border-hairline bg-ivory px-3.5 py-1.5 text-[12px] font-medium text-ink-2 hover:border-champagne disabled:opacity-40"
          >
            {busy === "test" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <PlugZap className="h-3.5 w-3.5" />} Test connection
          </button>
          {rp.source === "ADMIN" && (
            <button
              onClick={clear}
              disabled={!!busy}
              className="inline-flex items-center gap-1.5 rounded-full border border-hairline bg-ivory px-3.5 py-1.5 text-[12px] font-medium text-ink-2 hover:border-champagne disabled:opacity-40"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Use server keys
            </button>
          )}
        </span>
      </div>

      {!rp.canSave ? (
        <p className="flex gap-2 text-[13px] text-ink-2">
          <KeyRound className="mt-0.5 h-4 w-4 shrink-0 text-bronze" />
          Saving keys here needs the server’s encryption key (SETTINGS_ENCRYPTION_KEY). Ask the developer to add it.
        </p>
      ) : (
        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            <label className="block space-y-1.5">
              <span className="block text-[13px] font-medium text-ink-2">Key id</span>
              <input value={keyId} onChange={(e) => setKeyId(e.target.value)} placeholder="rzp_live_…" className={cn(inputClass, "font-mono text-[13px]")} />
            </label>
            <label className="block space-y-1.5">
              <span className="block text-[13px] font-medium text-ink-2">Key secret</span>
              <input
                type="password"
                autoComplete="off"
                value={keySecret}
                onChange={(e) => setKeySecret(e.target.value)}
                placeholder={rp.keySecret ? `${rp.keySecret} (unchanged)` : "Key secret"}
                className={inputClass}
              />
            </label>
            <label className="block space-y-1.5">
              <span className="block text-[13px] font-medium text-ink-2">Webhook secret</span>
              <input
                type="password"
                autoComplete="off"
                value={webhookSecret}
                onChange={(e) => setWebhookSecret(e.target.value)}
                placeholder={rp.webhookSecretSet ? "•••••••• (unchanged)" : "Webhook secret"}
                className={inputClass}
              />
            </label>
          </div>
          <p className="text-[12px] text-ink-3">
            Secrets are encrypted and never shown again. Keys are checked with Razorpay before they are saved. In Razorpay’s
            dashboard, add webhooks (event “payment.captured”) to https://timespaceplanets.com/api/v1/webhooks/razorpay for
            bookings and https://timespaceplanets.com/api/v1/payments/webhook for wallet top-ups, both with this webhook secret.
          </p>
          <div className="flex justify-end">
            <button
              onClick={save}
              disabled={!!busy || !keyId.trim() || (keyId === rp.keyId && !keySecret && !webhookSecret)}
              className="inline-flex items-center gap-2 rounded-full bg-midnight px-5 py-2.5 text-[13px] font-semibold text-champagne-light hover:bg-midnight-2 disabled:opacity-40"
            >
              {busy === "save" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Verify & save keys
            </button>
          </div>
        </div>
      )}
    </Panel>
  );
}

/** Two-step verification for the team; signing everyone out after a lost device. */
function SecurityPanel() {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [required, setRequired] = useState<boolean | null>(null);
  const [savingRequired, setSavingRequired] = useState(false);

  useEffect(() => {
    apiClient
      .get<{ requireStaffTwoStep: boolean }>("/admin/settings/security")
      .then((r) => setRequired(r.requireStaffTwoStep))
      .catch(() => setRequired(false));
  }, []);

  const toggleRequired = async () => {
    if (required === null) return;
    setSavingRequired(true);
    try {
      const r = await apiClient.put<{ requireStaffTwoStep: boolean }>("/admin/settings/security", { requireStaffTwoStep: !required });
      setRequired(r.requireStaffTwoStep);
      toast.success(
        r.requireStaffTwoStep
          ? "Required. Anyone without it sets it up at their next sign-in."
          : "Two-step verification is now optional.",
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save");
    } finally {
      setSavingRequired(false);
    }
  };

  const signOutAll = async () => {
    setBusy(true);
    try {
      const r = await apiClient.post<{ signedOut: number }>("/admin/team/sign-out-all", {});
      toast.success(`Signed out ${r.signedOut} ${r.signedOut === 1 ? "login" : "logins"}. You stay signed in.`);
      setConfirming(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not sign everyone out");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Panel title="Security" subtitle="Sign-in rules for the team and astrologers.">
      <div className="mb-6 flex flex-col gap-4 border-b border-hairline pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-3">
          <KeyRound className="mt-0.5 h-5 w-5 shrink-0 text-bronze" />
          <div>
            <p className="text-[14px] font-medium text-ink">Require two-step verification</p>
            <p className="max-w-xl text-[13px] text-ink-2">
              Everyone on the team and every astrologer must use an authenticator app when signing in. Those who haven&apos;t set it up
              are guided through it at their next sign-in. Set up yours first under My Account.
            </p>
          </div>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={!!required}
          aria-label="Require two-step verification"
          onClick={toggleRequired}
          disabled={required === null || savingRequired}
          className={cn(
            "relative h-7 w-12 shrink-0 rounded-full transition disabled:opacity-50",
            required ? "bg-midnight" : "bg-hairline",
          )}
        >
          <span className={cn("absolute top-1 h-5 w-5 rounded-full bg-ivory shadow transition-all", required ? "left-6" : "left-1")} />
        </button>
      </div>
      <p className="mb-3 text-[13px] font-medium text-ink-3">If a device is lost or a password may have leaked</p>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-3">
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-bronze" />
          <p className="max-w-xl text-[14px] text-ink-2">
            Sign out every other admin and astrologer login on every device, straight away. They sign in again with their
            password; anyone holding an old session is locked out. Clients are not affected.
          </p>
        </div>
        {confirming ? (
          <div className="flex shrink-0 gap-2">
            <button onClick={() => setConfirming(false)} className="rounded-full border border-hairline bg-ivory px-4 py-2 text-[13px] font-medium text-ink-2 hover:border-champagne">
              Cancel
            </button>
            <button
              onClick={signOutAll}
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-full bg-garnet px-4 py-2 text-[13px] font-semibold text-white hover:opacity-90 disabled:opacity-50"
            >
              {busy && <Loader2 className="h-4 w-4 animate-spin" />} Yes, sign them out
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirming(true)}
            className="shrink-0 rounded-full border border-garnet/40 bg-ivory px-4 py-2 text-[13px] font-semibold text-garnet hover:bg-garnet/5"
          >
            Sign out everyone else
          </button>
        )}
      </div>
    </Panel>
  );
}
