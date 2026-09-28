"use client";

import { useState } from "react";
import { toast } from "sonner";
import { signOut } from "firebase/auth";
import { BadgeCheck, KeyRound, Loader2, Mail, Smartphone } from "lucide-react";
import { auth } from "@/lib/firebase";
import { apiClient } from "@/lib/http/client";
import { useAuth } from "@/providers/AuthProvider";
import { filterPhoneInput, validatePassword } from "@/lib/validations/validators";
import PasswordStrengthIndicator from "@/components/ui/PasswordStrengthIndicator";
import { usePhoneOtp } from "@/features/auth/usePhoneOtp";

const input =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10";
const dark = "inline-flex items-center gap-2 rounded-xl bg-navy px-4 py-2.5 text-sm font-semibold text-white hover:bg-navy-hover disabled:opacity-50";
const light = "inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50";
const errText = (e: unknown, fallback: string) => (e instanceof Error && e.message ? e.message : fallback);

/**
 * How a client signs in: email, mobile number and password, each proven.
 * One account per person — add the other methods here instead of making a
 * second account.
 */
export default function SignInMethods() {
  const { user } = useAuth();
  if (!user) return null;
  return (
    <div className="mt-10">
      <h2 className="font-heading text-xl font-bold text-dark">Sign-in &amp; security</h2>
      <p className="mt-1 text-sm text-paragraph">
        Add your email and mobile number so you can sign in either way, and so your bookings are always found under your account.
      </p>
      <div className="mt-5 divide-y divide-border rounded-card-lg border border-border bg-white shadow-card">
        <EmailRow />
        <PhoneRow />
        <PasswordRow />
      </div>
    </div>
  );
}

function Row({ icon, title, value, badge, children }: { icon: React.ReactNode; title: string; value: React.ReactNode; badge?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <div className="p-5 sm:p-6">
      <div className="flex flex-wrap items-start gap-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600">{icon}</span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{title}</p>
          <div className="mt-0.5 flex flex-wrap items-center gap-2 text-sm text-slate-800">
            {value}
            {badge}
          </div>
        </div>
      </div>
      {children && <div className="mt-4 sm:pl-14">{children}</div>}
    </div>
  );
}

const Verified = () => (
  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
    <BadgeCheck className="h-3.5 w-3.5" /> Verified
  </span>
);
const NotConfirmed = () => <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">Not confirmed</span>;

function EmailRow() {
  const { user, revalidate } = useAuth();
  const [editing, setEditing] = useState(false);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  const resend = async () => {
    setBusy(true);
    try {
      const r = await apiClient.post<{ sent: boolean; email?: string }>("/auth/verify-email/resend", {});
      toast.success(r.sent ? `We've sent a new link to ${r.email}.` : "Your email is already confirmed.");
    } catch (e) {
      toast.error(errText(e, "Could not send the link"));
    } finally {
      setBusy(false);
    }
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const r = await apiClient.post<{ sent: boolean; email?: string; alreadyVerified?: boolean }>("/auth/email", { email: email.trim() });
      toast.success(r.alreadyVerified ? "That's already your confirmed email." : `We've sent a link to ${r.email} — click it to confirm.`);
      setEditing(false);
      setEmail("");
      await revalidate();
    } catch (err) {
      toast.error(errText(err, "Could not update your email"));
    } finally {
      setBusy(false);
    }
  };

  const confirmed = !!user?.email && user.emailVerified;
  return (
    <Row
      icon={<Mail className="h-5 w-5" />}
      title="Email"
      value={user?.email ?? <span className="text-slate-500">No email yet</span>}
      badge={user?.email ? confirmed ? <Verified /> : <NotConfirmed /> : null}
    >
      {user?.pendingEmail && (
        <p className="mb-3 rounded-xl bg-amber-50 px-3.5 py-2.5 text-sm text-amber-800">
          Waiting for you to confirm <strong>{user.pendingEmail}</strong> — check that inbox for our link.
        </p>
      )}
      {editing ? (
        <form onSubmit={save} className="flex flex-col gap-3 sm:flex-row">
          <input type="email" required autoFocus placeholder="name@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className={input} />
          <div className="flex gap-2">
            <button type="submit" disabled={busy} className={dark}>
              {busy && <Loader2 className="h-4 w-4 animate-spin" />} Send link
            </button>
            <button type="button" onClick={() => setEditing(false)} className={light}>
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className="flex flex-wrap gap-2">
          {(user?.pendingEmail || (user?.email && !confirmed)) && (
            <button type="button" onClick={resend} disabled={busy} className={dark}>
              {busy && <Loader2 className="h-4 w-4 animate-spin" />} Send confirmation link
            </button>
          )}
          <button type="button" onClick={() => setEditing(true)} className={light}>
            {user?.email ? "Change email" : "Add email"}
          </button>
        </div>
      )}
    </Row>
  );
}

function PhoneRow() {
  const { user, revalidate } = useAuth();
  const [adding, setAdding] = useState(false);
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const sms = usePhoneOtp("recaptcha-link-phone");

  const send = async (e?: React.FormEvent) => {
    e?.preventDefault();
    try {
      await sms.send(phone);
    } catch (err) {
      toast.error(errText(err, "Could not send the code"));
    }
  };

  const confirm = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const idToken = await sms.confirm(code);
      await apiClient.post("/auth/phone", { idToken });
      await signOut(auth).catch(() => undefined); // our own session is what signs you in
      toast.success("Mobile number added. You can now sign in with it.");
      setAdding(false);
      setPhone("");
      setCode("");
      sms.reset();
      await revalidate();
    } catch (err) {
      toast.error(errText(err, "Could not add the number"));
    }
  };

  return (
    <Row
      icon={<Smartphone className="h-5 w-5" />}
      title="Mobile number"
      value={user?.phone ?? <span className="text-slate-500">No number yet</span>}
      badge={user?.phone ? user.phoneVerified ? <Verified /> : <NotConfirmed /> : null}
    >
      <div id="recaptcha-link-phone" />
      {!adding ? (
        <button type="button" onClick={() => setAdding(true)} className={light}>
          {user?.phone ? (user.phoneVerified ? "Change number" : "Verify this number") : "Add mobile number"}
        </button>
      ) : !sms.codeSent ? (
        <form onSubmit={send} className="flex flex-col gap-3 sm:flex-row">
          <input
            type="tel"
            inputMode="numeric"
            autoFocus
            maxLength={10}
            placeholder="10-digit mobile number"
            value={phone}
            onChange={(e) => setPhone(filterPhoneInput(e.target.value))}
            className={input}
          />
          <div className="flex gap-2">
            <button type="submit" disabled={sms.busy || phone.length !== 10} className={dark}>
              {sms.busy && <Loader2 className="h-4 w-4 animate-spin" />} Send code
            </button>
            <button type="button" onClick={() => setAdding(false)} className={light}>
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={confirm} className="space-y-3">
          <p className="text-sm text-slate-600">
            Enter the 6-digit code we sent to <strong className="text-slate-900">{sms.sentTo}</strong>.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              inputMode="numeric"
              autoComplete="one-time-code"
              autoFocus
              maxLength={6}
              placeholder="6-digit code"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              className={`${input} tracking-[0.3em]`}
            />
            <button type="submit" disabled={sms.busy || code.length !== 6} className={dark}>
              {sms.busy && <Loader2 className="h-4 w-4 animate-spin" />} Verify
            </button>
          </div>
          <p className="text-xs text-slate-500">
            {sms.resendIn > 0 ? (
              <>Resend in {sms.resendIn}s</>
            ) : (
              <button type="button" onClick={() => send()} className="font-semibold text-slate-900 hover:underline">
                Resend code
              </button>
            )}
          </p>
        </form>
      )}
    </Row>
  );
}

function PasswordRow() {
  const { user, revalidate } = useAuth();
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [busy, setBusy] = useState(false);
  const has = !!user?.hasPassword;
  const canChoose = has || (!!user?.email && !!user.emailVerified);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const problem = validatePassword(next);
    if (problem) return toast.error(problem);
    setBusy(true);
    try {
      await apiClient.post("/auth/password", { ...(has && { currentPassword: current }), newPassword: next });
      toast.success(has ? "Password changed. Your other devices were signed out." : "Password saved. You can now sign in with your email.");
      setOpen(false);
      setCurrent("");
      setNext("");
      await revalidate();
    } catch (err) {
      toast.error(errText(err, "Could not save the password"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Row icon={<KeyRound className="h-5 w-5" />} title="Password" value={has ? "••••••••" : <span className="text-slate-500">Not set — you sign in with a code or Google</span>}>
      {!open ? (
        <div className="space-y-2">
          <button type="button" onClick={() => setOpen(true)} disabled={!canChoose} className={light}>
            {has ? "Change password" : "Choose a password"}
          </button>
          {!canChoose && <p className="text-xs text-slate-500">Add and confirm an email first — it&apos;s what you&apos;ll sign in with.</p>}
        </div>
      ) : (
        <form onSubmit={save} className="max-w-sm space-y-3">
          {has && (
            <input type="password" autoComplete="current-password" required placeholder="Current password" value={current} onChange={(e) => setCurrent(e.target.value)} className={input} />
          )}
          <input type="password" autoComplete="new-password" required placeholder="New password" value={next} onChange={(e) => setNext(e.target.value)} className={input} />
          <PasswordStrengthIndicator password={next} />
          <div className="flex gap-2">
            <button type="submit" disabled={busy} className={dark}>
              {busy && <Loader2 className="h-4 w-4 animate-spin" />} Save password
            </button>
            <button type="button" onClick={() => setOpen(false)} className={light}>
              Cancel
            </button>
          </div>
        </form>
      )}
    </Row>
  );
}
