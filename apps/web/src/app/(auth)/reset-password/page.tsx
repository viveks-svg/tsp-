"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { AlertCircle, CheckCircle2, Eye, EyeOff, Loader2, Lock } from "lucide-react";
import { apiClient } from "@/lib/http/client";
import { ENDPOINTS } from "@/lib/constants/http/endpoints";
import PasswordStrengthIndicator from "@/components/ui/PasswordStrengthIndicator";
import { validatePassword } from "@/lib/validations/validators";

/** Opened from a "Set a new password" email (forgot password, or an astrologer's first login). */
function ResetPassword() {
  const token = useSearchParams().get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const problem = validatePassword(password) || (password !== confirm ? "The two passwords don't match." : null);
    if (problem) return setError(problem);
    setBusy(true);
    setError(null);
    try {
      await apiClient.post(ENDPOINTS.AUTH.RESET_PASSWORD, { token, password });
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "This link didn't work.");
    } finally {
      setBusy(false);
    }
  };

  const input =
    "w-full rounded-xl border border-slate-200 py-3 pl-11 pr-11 text-sm text-slate-800 placeholder-slate-400 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10";

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Link href="/" className="mb-4 inline-flex justify-center">
          <Image src="/logo/Group 2.svg" alt="Time Space & Planets" width={64} height={64} className="h-16 w-16" priority />
        </Link>
        <h1 className="font-heading text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">Choose a new password</h1>
        <p className="mt-1 text-sm text-slate-500">You&apos;ll be signed out on your other devices.</p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        {!token ? (
          <p className="text-center text-sm text-slate-600">
            This link is incomplete. Please open it again from the email, or{" "}
            <Link href="/forgot-password" className="font-semibold text-slate-900 underline">
              ask for a new one
            </Link>
            .
          </p>
        ) : done ? (
          <div className="space-y-3 text-center">
            <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600" />
            <p className="text-sm text-slate-600">Your password has been changed.</p>
            <Link href="/login" className="inline-flex rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800">
              Sign in
            </Link>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            {error && (
              <div role="alert" className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-sm text-rose-800">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  {error}{" "}
                  {/expired|already used|not valid/i.test(error) && (
                    <Link href="/forgot-password" className="font-semibold underline">
                      Ask for a new link
                    </Link>
                  )}
                </span>
              </div>
            )}
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">New password</span>
              <span className="relative block">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input type={show ? "text" : "password"} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} className={input} />
                <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? "Hide password" : "Show password"} className="absolute inset-y-0 right-0 pr-3 text-slate-400 hover:text-slate-600">
                  {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </span>
            </label>
            <PasswordStrengthIndicator password={password} />
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">Type it again</span>
              <span className="relative block">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input type={show ? "text" : "password"} autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className={input} />
              </span>
            </label>
            <button
              type="submit"
              disabled={busy || !password || !confirm}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:bg-slate-300"
            >
              {busy && <Loader2 className="h-4 w-4 animate-spin" />} Save new password
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPassword />
    </Suspense>
  );
}
