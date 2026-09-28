"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { KeyRound, Loader2, ShieldAlert, ShieldCheck } from "lucide-react";
import { apiClient } from "@/lib/http/client";
import { useAuth } from "@/providers/AuthProvider";
import { validatePassword } from "@/lib/validations/validators";
import { Panel, Skeleton } from "@/features/admin/components/primitives";
import { Badge } from "@/features/admin/components/records";
import { RecoveryCodes, TwoStepSetup } from "./TwoStep";

interface Status {
  available: boolean;
  enabled: boolean;
  enabledAt: string | null;
  required: boolean;
  recoveryCodesLeft: number;
}

const inputClass =
  "w-full rounded-xl border border-hairline bg-ivory px-3.5 py-2.5 text-[14px] text-ink outline-none transition focus:border-champagne focus:ring-2 focus:ring-champagne/20";
const primary =
  "inline-flex items-center gap-2 rounded-full bg-midnight px-5 py-2.5 text-[13px] font-semibold text-champagne-light hover:bg-midnight-2 disabled:opacity-40";
const secondary =
  "inline-flex items-center gap-2 rounded-full border border-hairline bg-ivory px-4 py-2 text-[13px] font-medium text-ink-2 hover:border-champagne disabled:opacity-40";
const errText = (e: unknown, fallback: string) => (e instanceof Error && e.message ? e.message : fallback);

/** Two-step verification and password, for staff (Admin → My Account) and astrologers (Profile). */
export default function StaffSecurity() {
  return (
    <div className="space-y-6">
      <TwoStepPanel />
      <PasswordPanel />
    </div>
  );
}

function TwoStepPanel() {
  const { revalidate } = useAuth();
  const [status, setStatus] = useState<Status | null>(null);
  const [mode, setMode] = useState<"idle" | "setup" | "codes" | "off">("idle");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [newCodes, setNewCodes] = useState<string[] | null>(null);

  const load = useCallback(async () => {
    try {
      setStatus(await apiClient.get<Status>("/auth/two-step"));
    } catch (e) {
      toast.error(errText(e, "Could not load"));
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  const withCode = async (path: string, done: (r: any) => void) => {
    setBusy(true);
    try {
      done(await apiClient.post(path, { code }));
      setCode("");
    } catch (e) {
      toast.error(errText(e, "That code didn't match"));
    } finally {
      setBusy(false);
    }
  };

  if (!status) return <Skeleton className="h-44" />;

  return (
    <Panel
      title="Two-step verification"
      subtitle="After your password, a 6-digit code from an authenticator app on your phone. A stolen password alone can't open your account."
      action={status.enabled ? <Badge tone="good">On</Badge> : status.required ? <Badge tone="bad">Required</Badge> : <Badge tone="neutral">Off</Badge>}
    >
      {newCodes ? (
        <div className="max-w-md">
          <RecoveryCodes
            codes={newCodes}
            onDone={() => {
              setNewCodes(null);
              setMode("idle");
              void load();
            }}
          />
        </div>
      ) : mode === "setup" ? (
        <div className="max-w-md">
          <TwoStepSetup
            onEnabled={() => {
              setMode("idle");
              void load();
              void revalidate();
              toast.success("Two-step verification is on.");
            }}
          />
          <button type="button" onClick={() => setMode("idle")} className="mt-4 text-[13px] text-ink-3 hover:text-ink">
            Cancel
          </button>
        </div>
      ) : !status.enabled ? (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex gap-2.5 text-[14px] text-ink-2">
            <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-bronze" />
            {status.required
              ? "The office requires it — you'll be asked to set it up next time you sign in. You can do it now."
              : "Recommended for everyone who can see client details or move money."}
          </p>
          <button type="button" onClick={() => setMode("setup")} className={primary}>
            <ShieldCheck className="h-4 w-4" /> Set up
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          <p className="text-[14px] text-ink-2">
            On since{" "}
            {status.enabledAt
              ? new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Kolkata" }).format(new Date(status.enabledAt))
              : "—"}
            . <span className={status.recoveryCodesLeft <= 2 ? "font-medium text-garnet" : ""}>{status.recoveryCodesLeft} recovery codes left.</span>
          </p>
          {mode === "idle" ? (
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => setMode("codes")} className={secondary}>
                <KeyRound className="h-4 w-4" /> New recovery codes
              </button>
              {!status.required && (
                <button type="button" onClick={() => setMode("off")} className={secondary}>
                  Turn off
                </button>
              )}
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (mode === "codes") void withCode("/auth/two-step/recovery-codes", (r) => setNewCodes(r.recoveryCodes));
                else
                  void withCode("/auth/two-step/disable", () => {
                    toast.success("Two-step verification is off.");
                    setMode("idle");
                    void load();
                    void revalidate();
                  });
              }}
              className="max-w-sm space-y-3"
            >
              <p className="text-[13px] text-ink-2">
                {mode === "codes" ? "Enter a code from your app. Your old recovery codes will stop working." : "Enter a code from your app to turn it off."}
              </p>
              <input
                autoFocus
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                placeholder="6-digit code"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                className={`${inputClass} text-center tracking-[0.4em]`}
              />
              <div className="flex gap-2">
                <button type="submit" disabled={busy || code.length !== 6} className={primary}>
                  {busy && <Loader2 className="h-4 w-4 animate-spin" />} {mode === "codes" ? "Show new codes" : "Turn off"}
                </button>
                <button type="button" onClick={() => setMode("idle")} className={secondary}>
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </Panel>
  );
}

function PasswordPanel() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [busy, setBusy] = useState(false);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const problem = validatePassword(next);
    if (problem) return toast.error(problem);
    setBusy(true);
    try {
      await apiClient.post("/auth/password", { currentPassword: current, newPassword: next });
      toast.success("Password changed. Your other devices were signed out.");
      setCurrent("");
      setNext("");
    } catch (err) {
      toast.error(errText(err, "Could not change the password"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Panel title="Password" subtitle="Changing it signs you out everywhere else.">
      <form onSubmit={save} className="grid max-w-2xl grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_auto]">
        <input type="password" required autoComplete="current-password" placeholder="Current password" value={current} onChange={(e) => setCurrent(e.target.value)} className={inputClass} />
        <input type="password" required autoComplete="new-password" placeholder="New password" value={next} onChange={(e) => setNext(e.target.value)} className={inputClass} />
        <button type="submit" disabled={busy || !current || !next} className={primary}>
          {busy && <Loader2 className="h-4 w-4 animate-spin" />} Change
        </button>
      </form>
      <p className="mt-2 text-[12px] text-ink-3">At least 8 characters, with upper and lower case letters, a number and a symbol.</p>
    </Panel>
  );
}
