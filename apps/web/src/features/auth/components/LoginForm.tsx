"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, ArrowLeft, Eye, EyeOff, Loader2, Lock, Mail, Phone, ShieldCheck, Smartphone } from "lucide-react";
import { GoogleAuthProvider, OAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { apiClient } from "@/lib/http/client";
import { ENDPOINTS } from "@/lib/constants/http/endpoints";
import { useAuth } from "@/providers/AuthProvider";
import { filterPhoneInput } from "@/lib/validations/validators";
import type { AuthTokenResponse, TwoStepChallenge, User } from "@/types/user";
import { usePhoneOtp } from "../usePhoneOtp";
import { TwoStepSignIn } from "./TwoStep";

interface LoginFormProps {
  /** Called after a successful login with user data. */
  onSuccess?: (user: User) => void;
  /** Called when the user clicks "Create an account". */
  onSwitchToSignup?: () => void;
}

/** Apple sign-in needs Apple Developer set-up in Firebase; the button shows once that's done. */
const APPLE_ENABLED = process.env.NEXT_PUBLIC_APPLE_SIGNIN === "1";

const input =
  "w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm text-slate-800 placeholder-slate-400 transition-all focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10";
const primary =
  "flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 text-sm font-semibold text-white transition-all duration-300 hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300";

const popupCancelled = (e: unknown) => /popup-closed-by-user|cancelled-popup-request/.test((e as { code?: string })?.code ?? "");

/**
 * One sign-in for everyone: mobile number (SMS code) first — most clients use
 * it — then email and password, Google, and Apple. Staff and astrologers sign
 * in with email; if their account uses two-step verification the form moves
 * on to the authenticator code.
 */
export default function LoginForm({ onSuccess, onSwitchToSignup }: LoginFormProps) {
  const { login } = useAuth();
  const [mode, setMode] = useState<"phone" | "email">("phone");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [busy, setBusy] = useState<null | "email" | "phone" | "google" | "apple">(null);
  const [error, setError] = useState<string | null>(null);
  const [challenge, setChallenge] = useState<TwoStepChallenge | null>(null);
  const sms = usePhoneOtp("recaptcha-container");

  const signedIn = (response: AuthTokenResponse) => {
    login(response.user, Number(response.walletBalance ?? 0), response.accessToken);
    onSuccess?.(response.user);
  };

  const run = async (kind: NonNullable<typeof busy>, task: () => Promise<void>) => {
    setBusy(kind);
    setError(null);
    try {
      await task();
    } catch (e) {
      if (!popupCancelled(e)) setError(e instanceof Error && e.message ? e.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(null);
    }
  };

  const emailLogin = (e: React.FormEvent) => {
    e.preventDefault();
    void run("email", async () => {
      const r = await apiClient.post<AuthTokenResponse | TwoStepChallenge>(ENDPOINTS.AUTH.LOGIN, { email: email.trim(), password });
      if ("twoStep" in r) setChallenge(r);
      else signedIn(r);
    });
  };

  const sendCode = (e?: React.FormEvent) => {
    e?.preventDefault();
    void run("phone", () => sms.send(phone));
  };

  const verifyCode = (e: React.FormEvent) => {
    e.preventDefault();
    void run("phone", async () => {
      const idToken = await sms.confirm(otp);
      signedIn(await apiClient.post<AuthTokenResponse>(ENDPOINTS.AUTH.FIREBASE_PHONE, { idToken }));
    });
  };

  const social = (kind: "google" | "apple") =>
    void run(kind, async () => {
      const provider = kind === "google" ? new GoogleAuthProvider() : new OAuthProvider("apple.com");
      if (kind === "apple") (provider as OAuthProvider).addScope("email");
      const result = await signInWithPopup(auth, provider);
      const idToken = await result.user.getIdToken();
      signedIn(
        await apiClient.post<AuthTokenResponse>(kind === "google" ? ENDPOINTS.AUTH.FIREBASE_GOOGLE : ENDPOINTS.AUTH.FIREBASE_APPLE, { idToken }),
      );
    });

  if (challenge) {
    return (
      <div className="mx-auto w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <TwoStepSignIn
          challenge={challenge}
          onSignedIn={signedIn}
          onCancel={() => {
            setChallenge(null);
            setPassword("");
          }}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-md space-y-5">
      <div className="flex rounded-xl border border-slate-200 bg-slate-100/80 p-1" role="tablist">
        {(
          [
            ["phone", "Mobile number", Smartphone],
            ["email", "Email", Mail],
          ] as const
        ).map(([value, label, Icon]) => (
          <button
            key={value}
            role="tab"
            aria-selected={mode === value}
            onClick={() => {
              setMode(value);
              setError(null);
            }}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition-all duration-300 ${
              mode === value ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Icon className="h-4 w-4" /> {label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"
            role="alert"
          >
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />
            <span>{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        {mode === "phone" ? (
          !sms.codeSent ? (
            <form onSubmit={sendCode} className="space-y-4">
              <Field label="Mobile number" icon={<Phone className="h-4 w-4" />}>
                <span className="pointer-events-none absolute inset-y-0 left-10 flex items-center text-sm text-slate-500">+91</span>
                <input
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  placeholder="98765 43210"
                  maxLength={10}
                  value={phone}
                  onChange={(e) => setPhone(filterPhoneInput(e.target.value))}
                  className={`${input} pl-[4.5rem]`}
                />
              </Field>
              <button type="submit" disabled={busy !== null || phone.length !== 10} className={primary}>
                {busy === "phone" && <Loader2 className="h-4 w-4 animate-spin" />} Send code by SMS
              </button>
              <p className="text-center text-xs text-slate-500">New here? Your account is created when you verify your number.</p>
            </form>
          ) : (
            <form onSubmit={verifyCode} className="space-y-4">
              <p className="text-sm text-slate-600">
                We sent a 6-digit code to <strong className="text-slate-900">{sms.sentTo}</strong>.
              </p>
              <Field label="Verification code" icon={<ShieldCheck className="h-4 w-4" />}>
                <input
                  autoFocus
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="6-digit code"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  className={`${input} tracking-[0.3em]`}
                />
              </Field>
              <button type="submit" disabled={busy !== null || otp.length !== 6} className={primary}>
                {busy === "phone" && <Loader2 className="h-4 w-4 animate-spin" />} Verify and continue
              </button>
              <div className="flex items-center justify-between text-xs text-slate-500">
                <button
                  type="button"
                  onClick={() => {
                    sms.reset();
                    setOtp("");
                  }}
                  className="inline-flex items-center gap-1 hover:text-slate-900"
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> Change number
                </button>
                {sms.resendIn > 0 ? (
                  <span>
                    Resend in <strong className="text-slate-700">{sms.resendIn}s</strong>
                  </span>
                ) : (
                  <button type="button" onClick={() => sendCode()} className="font-semibold text-slate-900 hover:underline">
                    Resend code
                  </button>
                )}
              </div>
            </form>
          )
        ) : (
          <form onSubmit={emailLogin} className="space-y-4">
            <Field label="Email address" icon={<Mail className="h-4 w-4" />}>
              <input
                type="email"
                required
                autoComplete="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={input}
              />
            </Field>
            <Field label="Password" icon={<Lock className="h-4 w-4" />}>
              <input
                type={showPassword ? "text" : "password"}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`${input} pr-11`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </Field>
            <div className="-mt-1 flex justify-end">
              <Link href="/forgot-password" className="text-xs font-semibold text-slate-600 transition-colors hover:text-slate-900">
                Forgot password?
              </Link>
            </div>
            <button type="submit" disabled={busy !== null} className={primary}>
              {busy === "email" && <Loader2 className="h-4 w-4 animate-spin" />} Sign in
            </button>
            <p className="text-center text-xs text-slate-500">TSP team members and astrologers sign in here.</p>
          </form>
        )}

        {/* Invisible reCAPTCHA for SMS codes */}
        <div id="recaptcha-container" />

        <div className="relative my-6 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200" />
          </div>
          <span className="relative bg-white px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Or continue with</span>
        </div>

        <div className={`grid gap-3 ${APPLE_ENABLED ? "grid-cols-2" : "grid-cols-1"}`}>
          <button
            type="button"
            onClick={() => social("google")}
            disabled={busy !== null}
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 py-3 text-sm font-bold text-slate-700 transition-all hover:bg-slate-50 disabled:opacity-50"
          >
            {busy === "google" ? <Loader2 className="h-5 w-5 animate-spin" /> : <GoogleIcon />} Google
          </button>
          {APPLE_ENABLED && (
            <button
              type="button"
              onClick={() => social("apple")}
              disabled={busy !== null}
              className="flex items-center justify-center gap-2 rounded-xl border border-slate-900 bg-slate-900 py-3 text-sm font-bold text-white transition-all hover:bg-slate-800 disabled:opacity-50"
            >
              {busy === "apple" ? <Loader2 className="h-5 w-5 animate-spin" /> : <AppleIcon />} Apple
            </button>
          )}
        </div>

        <p className="pt-5 text-center text-sm text-slate-600">
          Prefer email?{" "}
          <button type="button" onClick={onSwitchToSignup} className="font-bold text-slate-900 hover:underline">
            Create an account
          </button>
        </p>
      </div>
    </div>
  );
}

function Field({ label, icon, children }: { label: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">{label}</span>
      <span className="relative block">
        <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">{icon}</span>
        {children}
      </span>
    </label>
  );
}

function GoogleIcon() {
  return (
    <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" aria-hidden>
      <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.9h6.6c-.28 1.48-1.11 2.73-2.36 3.58v2.98h3.8c2.23-2.05 3.5-5.07 3.5-8.39z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.8-2.98c-1.05.7-2.4 1.12-4.13 1.12-3.18 0-5.88-2.15-6.84-5.04H1.28v3.08C3.26 21.3 7.37 24 12 24z" />
      <path fill="#FBBC05" d="M5.16 14.19c-.25-.76-.39-1.57-.39-2.41s.14-1.65.39-2.41V6.29H1.28C.46 7.92 0 9.75 0 11.78s.46 3.86 1.28 5.49l3.88-3.08z" />
      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.37 0 3.26 2.7 1.28 6.29l3.88 3.08c.96-2.89 3.66-5.04 6.84-5.04z" />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M16.37 1.43c0 1.14-.47 2.28-1.2 3.08-.8.87-2.08 1.53-3.1 1.45-.13-1.1.42-2.27 1.14-3.03.8-.87 2.18-1.5 3.16-1.5zM20.5 17.2c-.56 1.3-.83 1.88-1.55 3.03-1 1.6-2.42 3.6-4.18 3.62-1.56.02-1.96-1.02-4.08-1-2.12.01-2.56 1.02-4.12 1-1.76-.02-3.1-1.82-4.1-3.42C-.33 16.1-.62 10.93 1.16 8.2 2.42 6.26 4.4 5.13 6.26 5.13c1.9 0 3.1 1.04 4.66 1.04 1.52 0 2.44-1.04 4.64-1.04 1.66 0 3.42.9 4.67 2.46-4.1 2.25-3.44 8.1.27 9.61z" />
    </svg>
  );
}
